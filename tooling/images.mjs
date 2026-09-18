import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {paths} from './paths.mjs';
import {readContent, readPages} from './content.mjs';

const recipe = 'webp-q82-effort6-v1';
const exists = file => fs.access(file).then(() => true, () => false);

/** Cache immutable image variants; never rewrite editable page sources. */
export async function prepareImages() {
  const cache = path.join(paths.imageCache, 'responsive');
  await fs.mkdir(cache, {recursive: true});
  const sources = new Set(['/assets/images/portfolio-roof-line.webp']);
  for (const name of ['holiday-gallery', 'holiday-imagery']) {
    for (const item of await readContent(name)) sources.add(item.source);
  }
  for (const service of await readContent('holiday-services')) sources.add(service.image);
  for (const {html} of await readPages()) {
    for (const match of html.matchAll(/<img\b[^>]*data-original-src="([^"]+)"[^>]*>/g)) sources.add(match[1]);
  }
  const manifest = {};
  for (const source of [...sources].sort()) {
    if (!source.startsWith('/assets/images/') || source.includes('..')) throw new Error(`Invalid image path: ${source}`);
    const input = await fs.readFile(path.join(paths.public, source));
    const metadata = await sharp(input).metadata();
    const id = crypto.createHash('sha256').update(input).update(recipe).digest('hex').slice(0, 12);
    const widths = [...new Set([160, 320, 480, 768, 1200, Math.min(metadata.width, 1920)].filter(w => w <= metadata.width))].sort((a, b) => a - b);
    const variants = [];
    for (const width of widths) {
      const filename = `${id}-${width}.webp`;
      const file = path.join(cache, filename);
      if (!await exists(file)) await sharp(input).resize({width, withoutEnlargement: true}).webp({quality: 82, effort: 6}).toFile(file);
      variants.push({width, src: `/assets/images/responsive/${filename}`, bytes: (await fs.stat(file)).size});
    }
    manifest[source] = {width: metadata.width, height: metadata.height, originalBytes: input.length, variants};
  }
  await fs.writeFile(path.join(paths.imageCache, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/** Materialize only current variants; obsolete cache entries never reach deployment. */
export async function publishImages(manifest) {
  const destination = path.join(paths.output, 'assets/images');
  await fs.mkdir(path.join(destination, 'responsive'), {recursive: true});
  for (const image of Object.values(manifest)) {
    for (const variant of image.variants) {
      const name = path.basename(variant.src);
      await fs.copyFile(path.join(paths.imageCache, 'responsive', name), path.join(destination, 'responsive', name));
    }
  }
  await fs.writeFile(path.join(destination, 'responsive-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}

export function renderResponsiveImages(html, manifest) {
  return html.replace(/<img\b[^>]*data-original-src="([^"]+)"[^>]*>/g, (tag, source) => {
    const image = manifest[source];
    if (!image) throw new Error(`Missing responsive image: ${source}`);
    const srcset = image.variants.map(v => `${v.src} ${v.width}w`).join(', ');
    let result = tag.replace(/(?<![\w-])src="[^"]*"/, `src="${image.variants.at(-1).src}"`);
    result = /\bsrcset=/.test(result)
      ? result.replace(/\bsrcset="[^"]*"/, `srcset="${srcset}"`)
      : result.replace('<img ', `<img srcset="${srcset}" `);
    return result.replace(/\bwidth="\d+"/, `width="${image.width}"`).replace(/\bheight="\d+"/, `height="${image.height}"`);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await prepareImages();
  console.log(`Prepared ${Object.keys(manifest).length} responsive images. Run pnpm build to publish.`);
}
