import {readContent} from '../../tooling/content.mjs';
export const gallery = await readContent('holiday-gallery');
export function galleryFigure(item, manifest) {
  const info = manifest[item.source];
  if (!info) throw new Error(`Run pnpm images to prepare ${item.source}`);
  const src = (info.variants.find(v=>v.width===768)||info.variants.at(-1)).src;
  const srcset = info.variants.filter(v=>v.width>=320).map(v=>`${v.src} ${v.width}w`).join(', ');
  const alt=item.alt.replaceAll('&','&amp;').replaceAll('"','&quot;');
  return `<figure><img src="${src}" data-original-src="${item.source}" srcset="${srcset}" sizes="(min-width: 1380px) 634px, (min-width: 700px) 46vw, calc(100vw - 40px)" width="${info.width}" height="${info.height}" loading="lazy" decoding="async" alt="${alt}" /></figure>`;
}
