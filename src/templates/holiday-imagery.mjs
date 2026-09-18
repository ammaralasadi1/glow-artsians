import {readContent} from '../../tooling/content.mjs';
import {gallery, galleryFigure} from './holiday-gallery.mjs';
const escape = text => text.replaceAll('&','&amp;').replaceAll('"','&quot;');

// Only called for the holiday hub, city pages and holiday contact page.
// Shared original portfolio files stay untouched for landscape consumers.
export async function refreshHolidayImagery(html, manifest) {
  const inventory=await readContent('holiday-imagery');
  for(const item of inventory){
    const info=manifest[item.source];
    if(!info)throw new Error(`Run pnpm images to prepare ${item.source}`);
    const source=(info.variants.find(v=>v.width===1200)||info.variants.at(-1)).src;
    const srcset=info.variants.filter(v=>v.width>=320).map(v=>`${v.src} ${v.width}w`).join(', ');
    html=html.replace(/<img\b[^>]*>/g,tag=>{
      if(![item.oldSource,item.source].some(src=>tag.includes(`data-original-src="${src}"`)))return tag;
      return tag.replace(/data-original-src="[^"]*"/,`data-original-src="${item.source}"`)
        .replace(/(?<![\w-])src="[^"]*"/,`src="${source}"`)
        .replace(/srcset="[^"]*"/,`srcset="${srcset}"`)
        .replace(/width="\d+"/,`width="${info.width}"`)
        .replace(/height="\d+"/,`height="${info.height}"`)
        .replace(/alt="[^"]*"/,`alt="${escape(item.alt)}"`);
    });
  }
  const hero=inventory[0];
  const heroInfo=manifest[hero.source];
  html=html.replace(/(<meta property="og:image" content=")[^"]*/,`$1https://glowartisans.com${heroInfo.variants.at(-1).src}`)
    .replace(/(<meta property="og:image:alt" content=")[^"]*/,`$1${escape(hero.alt)}`)
    .replace(/(<video\b[^>]*poster=")[^"]*/,`$1${heroInfo.variants.find(v=>v.width===1200).src}`);
  const additions = '<!-- holiday-gallery-extra:start -->'+gallery.map(item=>galleryFigure(item,manifest)).join('\n')+'<!-- holiday-gallery-extra:end -->';
  if(html.includes('class="city-gallery"')) {
    html=html.replace(/<!-- holiday-gallery-extra:start -->[\s\S]*?<!-- holiday-gallery-extra:end -->/,'');
    html=html.replace(/(<div class="city-gallery">[\s\S]*?)(<\/div>)/,`$1${additions}$2`);
  } else if(html.includes('site-page-holiday-contact')) {
    const contactGallery='<!-- holiday-contact-gallery:start --><div class="holiday-contact-gallery" role="group" aria-label="Holiday design inspiration">'+gallery.slice(2).map(item=>galleryFigure(item,manifest)).join('\n')+'</div><!-- holiday-contact-gallery:end -->';
    html=html.includes('<!-- holiday-contact-gallery:start -->')
      ? html.replace(/<!-- holiday-contact-gallery:start -->[\s\S]*?<!-- holiday-contact-gallery:end -->/,contactGallery)
      : html.replace('<p class="consultation-service-area">',contactGallery+'\n<p class="consultation-service-area">');
  }
  return html;
}
