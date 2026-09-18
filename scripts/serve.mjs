import http from 'node:http';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.json':'application/json',
  '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg',
  '.svg':'image/svg+xml', '.mp4':'video/mp4', '.woff2':'font/woff2', '.txt':'text/plain',
};

// Small local preview for this static site's exact Netlify redirects/rewrites.
// It deliberately does not implement Netlify's full routing language or deploy.
export function createPreviewServer() {
  return http.createServer(async (request, response) => {
    const fail = (code, text) => { response.writeHead(code, {'Content-Type':'text/plain'}); response.end(request.method === 'HEAD' ? undefined : text); };
    if (!['GET','HEAD'].includes(request.method)) {
      response.setHeader('Allow','GET, HEAD');
      return fail(405,'Method not allowed');
    }
    try {
      const url = new URL(request.url, 'http://localhost');
      let route = decodeURIComponent(url.pathname);
      if (route.includes('\0') || route.includes('\\') || route.split('/').some(part => part.startsWith('.'))) return fail(404,'Not found');
      if (route.length > 1) route = route.replace(/\/+$/, '');
      const rules = (await fs.readFile(path.join(root,'_redirects'),'utf8'))
        .split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))
        .map(line => line.split(/\s+/));
      const rule = rules.find(([from]) => from === route);
      if (rule) {
        const [,target,status] = rule;
        const code = Number.parseInt(status,10);
        if (code >= 300 && code < 400) {
          const destination = new URL(target,'http://localhost');
          if (!destination.search) destination.search = url.search;
          response.writeHead(code, {Location:destination.pathname+destination.search+destination.hash, 'Cache-Control':'no-store'});
          return response.end();
        }
        if (code === 200) route = target;
      }
      if (route === '/') route = '/index.html';
      // Preview public pages/assets only, never the repository or dependencies.
      if (!/^\/[a-z-]+\.html$/.test(route) && !route.startsWith('/assets/')) return fail(404,'Not found');
      if (route.split('/').some(part => part.startsWith('.'))) return fail(404,'Not found');
      const file = await fs.realpath(path.join(root,route));
      const realRoot = await fs.realpath(root);
      if (!file.startsWith(realRoot+path.sep)) return fail(404,'Not found');
      const stat = await fs.stat(file);
      if (!stat.isFile()) return fail(404,'Not found');
      const headers = {
        'Content-Type':types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control':'no-store', 'Accept-Ranges':'bytes',
        'X-Content-Type-Options':'nosniff',
      };
      let start = 0, end = stat.size-1, status = 200;
      if (request.headers.range) {
        const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
        if (!range || (!range[1] && !range[2])) {
          response.setHeader('Content-Range',`bytes */${stat.size}`);
          return fail(416,'Invalid range');
        }
        if (range[1]) {
          start = Number(range[1]);
          if (range[2]) end = Math.min(end,Number(range[2]));
        } else start = Math.max(0,stat.size-Number(range[2]));
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start < 0) {
          response.setHeader('Content-Range',`bytes */${stat.size}`);
          return fail(416,'Invalid range');
        }
        headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
        status = 206;
      }
      headers['Content-Length'] = stat.size === 0 ? 0 : end-start+1;
      response.writeHead(status,headers);
      if (request.method === 'HEAD' || stat.size === 0) return response.end();
      const stream = createReadStream(file,{start,end});
      stream.on('error',() => response.destroy());
      response.on('close',() => stream.destroy());
      stream.pipe(response);
    } catch (error) {
      if (error instanceof URIError || ['ENOENT','ENOTDIR'].includes(error.code)) return fail(404,'Not found');
      console.error(error);
      fail(500,'Preview server error');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createPreviewServer();
  const port = Number(process.env.PORT || 3000);
  server.on('error', error => {console.error(`Preview failed: ${error.message}`);process.exitCode=1;});
  server.listen(port,'127.0.0.1',() => console.log(`Glow Artisans preview: http://127.0.0.1:${server.address().port}\nClean URLs and legacy redirects are enabled. Press Ctrl+C to stop.`));
}
