import fs from 'node:fs/promises';
import {sourcePath} from './paths.mjs';

export async function createLayoutRenderer() {
  const templates = await Promise.all(['header', 'footer'].map(async slot => [slot, await fs.readFile(sourcePath('partials', `${slot}.html`), 'utf8')]));
  return function renderLayout(html, {name, isCity, isService}) {
    const isHoliday = ['holiday', 'holiday-contact'].includes(name) || isCity || isService;
    const isContact = ['contact', 'holiday-contact'].includes(name);
    if (isContact) html = html.replace('</head>', '<link rel="preconnect" href="https://api.leadconnectorhq.com" />\n<link rel="preconnect" href="https://link.msgsndr.com" crossorigin />\n</head>');
    const values = {
      servicesHref: isHoliday ? '/holiday#services' : '/#services',
      contactHref: isHoliday ? '/contact/holiday-lighting' : '/contact/landscape-lighting',
      contactLabel: isHoliday ? 'Holiday Consultation' : 'Landscape Lighting Consultation',
      headerCta: isContact ? 'Contact' : isService ? 'Request an Estimate' : 'Design Consultation',
      footerConsultations: isHoliday || ['contact', 'privacy-policy', 'thank-you'].includes(name) ? '' : '<div class="site-footer-ctas" aria-label="Request a design consultation"><a class="site-cta" href="/contact/landscape-lighting">Plan your landscape lighting</a><a class="site-cta site-cta-secondary" href="/contact/holiday-lighting">Holiday lighting consultation</a></div>',
      year: String(new Date().getFullYear()),
    };
    for (const [slot, template] of templates) {
      const rendered = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        if (!(key in values)) throw new Error(`Unknown layout value: ${key}`);
        return values[key];
      }).replace(/data-page-link="([\w-]+)"/g, (_, key) => key === (isContact ? 'contact' : name) ? 'aria-current="page"' : '');
      const marker = new RegExp(`<!-- site-${slot}:start -->[\\s\\S]*?<!-- site-${slot}:end -->`);
      if (!marker.test(html)) throw new Error(`${name}: missing ${slot} slot`);
      html = html.replace(marker, `<!-- site-${slot}:start -->\n${rendered}<!-- site-${slot}:end -->`);
    }
    if (!/>Skip to (?:content|main content)</i.test(html)) {
      const main = html.match(/<main\b[^>]*>/)?.[0];
      if (main) {
        const id = main.match(/\bid="([^"]+)"/)?.[1] || 'main-content';
        const target = main.includes('id=') ? main : main.replace('<main', ` <main id="${id}"`);
        html = html.replace(main, target.includes('tabindex=') ? target : target.replace('<main', '<main tabindex="-1"'));
        html = html.replace(/(<body\b[^>]*>)/, `$1\n<a class="site-skip" href="#${id}">Skip to content</a>`);
      }
    }
    return html;
  };
}
