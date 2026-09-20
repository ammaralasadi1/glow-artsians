import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import http from 'node:http';
import { after, before, test } from 'node:test';
import { createPreviewServer } from '../tooling/serve.mjs';
import {readContent} from '../tooling/content.mjs';

const root = new URL('../dist/', import.meta.url);
const holidayCities = await readContent('holiday-cities');
const holidayServices = await readContent('holiday-services');
const pages = [
  ['/services/architectural-facade-lighting', 'landscape-architectural.html'],
  ['/services/tree-garden-lighting', 'landscape-tree-garden.html'],
  ['/services/pathway-outdoor-living-lighting', 'landscape-outdoor-living.html'],
  ['/services/landscape-lighting-maintenance-upgrades', 'landscape-maintenance.html'],
  ['/services/landscape-lighting-installation', 'landscape-installation.html'],
  ['/', 'index.html'],
  ['/services/custom-landscape-lighting-design', 'landscape-design.html'],
  ['/contact/landscape-lighting', 'contact.html'],
  ['/contact/holiday-lighting', 'holiday-contact.html'],
  ['/holiday', 'holiday.html'],
  ...holidayCities.map(city => [city.route, `${city.page}.html`]),
  ...holidayServices.map(service => [service.route, `${service.page}.html`]),
  ['/our-story', 'our-story.html'],
  ['/great-falls', 'great-falls.html'],
  ['/privacy-policy', 'privacy-policy.html'],
  ['/thank-you', 'thank-you.html'],
];
const videoPath = '/assets/video/glow-artisan-holiday-light-installation-video-2.mp4';
let server;
let origin;

before(async () => {
  server = createPreviewServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server?.listening) return;
  server.closeAllConnections();
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

for (const [route, filename] of pages) {
  test(`serves ${route} as the correct HTML page`, async () => {
    const response = await fetch(`${origin}${route}`, { redirect: 'manual' });
    const expected = await readFile(new URL(filename, root), 'utf8');
    const expectedTitle = expected.match(/<title>[\s\S]*?<\/title>/i)?.[0];
    assert.ok(expectedTitle, `${filename} must have a title`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/html\b/i);
    const body = await response.text();
    assert.ok(body.includes(expectedTitle), 'must serve the requested page, not a homepage fallback');
    assert.equal(body, expected);
  });

  test(`permanently redirects /${filename} to ${route}`, async () => {
    const response = await fetch(`${origin}/${filename}`, { redirect: 'manual' });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), route);
    await response.arrayBuffer();
  });
}

test('preserves query strings on legacy redirects and clean routes', async () => {
  const query = '?utm_source=preview&message=holiday%20lights';
  const routes = [
    ['/holiday.html', '/holiday', 'holiday.html'],
    ['/contact.html', '/contact/landscape-lighting', 'contact.html'],
    ['/contact', '/contact/landscape-lighting', 'contact.html'],
    ['/holiday-contact.html', '/contact/holiday-lighting', 'holiday-contact.html'],
  ];
  for (const [legacy,route,filename] of routes) {
    const redirect = await fetch(`${origin}${legacy}${query}`, { redirect: 'manual' });
    assert.equal(redirect.status, 301, legacy);
    assert.equal(redirect.headers.get('location'), `${route}${query}`, legacy);
    await redirect.arrayBuffer();
    const response = await fetch(`${origin}${route}${query}`, { redirect: 'manual' });
    assert.equal(response.status, 200, route);
    assert.equal(await response.text(), await readFile(new URL(filename, root), 'utf8'));
  }
});

test('legacy contact URL redirects directly to the landscape consultation page', async () => {
  const response = await fetch(`${origin}/contact`, { redirect: 'manual' });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), '/contact/landscape-lighting');
  await response.arrayBuffer();
});

test('services redirects preserve their section anchor and incoming query', async () => {
  for (const route of ['/services', '/services.html']) {
    for (const query of ['', '?utm_source=preview']) {
      const response = await fetch(`${origin}${route}${query}`, { redirect: 'manual' });
      assert.equal(response.status, 301);
      assert.equal(response.headers.get('location'), `/${query}#services`);
      await response.arrayBuffer();
    }
  }
});

test('serves styles, scripts, images, and fonts with their browser MIME types', async () => {
  const home = await readFile(new URL('index.html', root), 'utf8');
  const assets = [
    [home.match(/<link data-build="utilities" href="([^"]+)"/)[1], /^text\/css\b/i],
    [home.match(/<script data-build="site-shell" src="([^"]+)"/)[1], /^(?:text|application)\/javascript\b/i],
    ['/assets/images/hero-image.webp', /^image\/webp\b/i],
    ['/assets/fonts/7a7ce1a34f3e.woff2', /^font\/woff2\b/i],
  ];
  for (const [path, mime] of assets) {
    const response = await fetch(`${origin}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get('content-type'), mime, path);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(new URL(path.slice(1), root)));
  }
});

test('HEAD reports the video size without sending its contents', async () => {
  const response = await fetch(`${origin}${videoPath}`, { method: 'HEAD' });
  const { size } = await stat(new URL(videoPath.slice(1), root));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^video\/mp4\b/i);
  assert.equal(response.headers.get('content-length'), String(size));
  assert.equal(response.headers.get('accept-ranges'), 'bytes');
  assert.equal((await response.arrayBuffer()).byteLength, 0);
});

test('serves exact video byte ranges for playback and seeking', async () => {
  const source = await readFile(new URL(videoPath.slice(1), root));
  for (const [range, start, end] of [
    ['bytes=0-1023', 0, 1023],
    ['bytes=1024-2047', 1024, 2047],
    ['bytes=-32', source.length - 32, source.length - 1],
  ]) {
    const response = await fetch(`${origin}${videoPath}`, { headers: { Range: range } });
    assert.equal(response.status, 206, range);
    assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${source.length}`);
    assert.equal(response.headers.get('content-length'), String(end - start + 1));
    assert.match(response.headers.get('content-type'), /^video\/mp4\b/i);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), source.subarray(start, end + 1));
  }
});

test('unknown pages and private project files return 404', async () => {
  for (const path of ['/missing-page', '/missing-page.html', '/assets/missing.webp', '/.git/config', '/package.json', '/tooling/serve.mjs', '/src/partials/header.html', '/src/content/holiday-cities.json', '/tests/site.mjs']) {
    const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
    assert.equal(response.status, 404, path);
    await response.arrayBuffer();
  }
});

test('rejects encoded path traversal without exposing project files', async () => {
  // Use raw HTTP paths because URL/fetch normalizes dot segments before sending.
  for (const path of ['/assets/../package.json', '/assets/%2e%2e/package.json', '/assets/%2e%2e%2fpackage.json', '/assets/%2e%2e%5cpackage.json']) {
    const response = await new Promise((resolve, reject) => {
      const request = http.get(origin, { path }, incoming => {
        const chunks = [];
        incoming.on('data', chunk => chunks.push(chunk));
        incoming.on('end', () => resolve({ status: incoming.statusCode, body: Buffer.concat(chunks).toString() }));
        incoming.on('error', reject);
      });
      request.on('error', reject);
    });
    assert.ok([400, 403, 404].includes(response.status), `${path}: expected rejection, got ${response.status}`);
    assert.ok(!response.body.includes('glow-artisans-site'), `${path}: package metadata must stay private`);
  }
});
