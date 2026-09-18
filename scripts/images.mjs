import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = process.cwd();
const out = 'assets/images/responsive';
await fs.mkdir(out, {recursive: true});
const sources = new Set();
for (const item of JSON.parse(await fs.readFile('content/holiday-gallery.json','utf8'))) sources.add(item.source);
for (const item of JSON.parse(await fs.readFile('content/holiday-imagery.json','utf8'))) sources.add(item.source);
for (const service of JSON.parse(await fs.readFile('content/holiday-services.json','utf8'))) {
  if (service.image) sources.add(service.image);
}
for (const name of (await fs.readdir(root)).filter(n => n.endsWith('.html'))) {
  const html = await fs.readFile(name, 'utf8');
  for (const match of html.matchAll(/<img\b[^>]*(?:data-original-src|src)="(\/assets\/images\/[^\"]+)"[^>]*>/g)) {
    sources.add(match[1]);
  }
}
// Include the video's poster in the same responsive asset inventory.
sources.add('/assets/images/portfolio-roof-line.webp');
const manifest = {};
for (const source of sources) {
  if (source.includes('/responsive/')) continue;
  const input = await fs.readFile(path.join(root, source));
  const meta = await sharp(input).metadata();
  const id = crypto.createHash('sha256').update(input).update('webp-q82-effort6-v1').digest('hex').slice(0, 12);
  const widths = [...new Set([160, 320, 480, 768, 1200, Math.min(meta.width, 1920)].filter(w => w <= meta.width))].sort((a,b) => a-b);
  const variants = [];
  for (const width of widths) {
    const file = `${out}/${id}-${width}.webp`;
    await sharp(input).resize({width, withoutEnlargement:true}).webp({quality:82, effort:6}).toFile(file);
    variants.push({width, src:`/${file}`, bytes:(await fs.stat(file)).size});
  }
  manifest[source] = {width:meta.width, height:meta.height, originalBytes:input.length, variants};
}
await fs.writeFile('assets/images/responsive-manifest.json', JSON.stringify(manifest, null, 2)+'\n');
const keep=new Set(Object.values(manifest).flatMap(info=>info.variants.map(v=>path.basename(v.src))));
for(const file of await fs.readdir(out)) {
  if((/^[a-f0-9]{12}-\d+\.webp$/.test(file)&&!keep.has(file)) || file==='manifest.json') {
    await fs.unlink(path.join(out,file));
  }
}
// Refresh existing responsive references whenever original images are replaced.
for(const name of (await fs.readdir(root)).filter(n=>n.endsWith('.html'))){
  let html=await fs.readFile(name,'utf8');
  html=html.replace(/<img\b[^>]*data-original-src="([^"]+)"[^>]*>/g,(tag,source)=>{
    const info=manifest[source];if(!info)return tag;
    const srcset=info.variants.map(v=>`${v.src} ${v.width}w`).join(', ');
    return tag.replace(/\bsrcset="[^"]*"/,`srcset="${srcset}"`)
      .replace(/(?<![\w-])src="[^"]*"/,`src="${info.variants.at(-1).src}"`);
  });
  await fs.writeFile(name,html);
}
console.log(`Generated responsive variants for ${sources.size} source images.`);
