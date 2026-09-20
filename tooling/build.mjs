import fs from 'node:fs/promises';
import path from 'node:path';
import {paths, outputPath} from './paths.mjs';
import {readContent, readPages} from './content.mjs';
import {prepareImages, publishImages, renderResponsiveImages} from './images.mjs';
import {createAssetCompiler} from './assets.mjs';
import {createLayoutRenderer} from './layout.mjs';
import {renderServicePages, serviceLinks} from '../src/templates/holiday-services.mjs';
import {refreshHolidayImagery} from '../src/templates/holiday-imagery.mjs';
import {renderCityPages} from '../src/templates/holiday-cities.mjs';

// dist is disposable deployment output, never an authoring directory.
await fs.rm(paths.output, {recursive: true, force: true});
await fs.mkdir(paths.output, {recursive: true});
await fs.cp(paths.public, paths.output, {recursive: true, filter: file => path.basename(file) !== '.DS_Store'});
const [cities, services, landscapeServices, pages, manifest] = await Promise.all([
  readContent('holiday-cities'), readContent('holiday-services'), readContent('landscape-services'), readPages(), prepareImages(),
]);
await publishImages(manifest);
pages.push(...await renderServicePages(services, cities, manifest));
pages.push(...await renderCityPages(cities));
// Tailwind scans rendered templates too, including data-driven service markup.
for (const page of pages) await fs.writeFile(outputPath(page.output), page.html);
const compileAssets = await createAssetCompiler();
const renderLayout = await createLayoutRenderer();
const indexableUrls = new Set();
const pageImages = new Map();
for (const page of pages) {
  const context = {...page, isCity: cities.some(city => city.page === page.name), isService: services.some(service => service.page === page.name)};
  let html = page.html;
  if (['holiday', 'holiday-contact'].includes(page.name) || context.isCity) html = await refreshHolidayImagery(html, manifest);
  if (page.name === 'holiday' || context.isCity) html = html.replace(/<!-- holiday-services:start -->[\s\S]*?<!-- holiday-services:end -->/, serviceLinks(services));
  html = renderLayout(html, context);
  html = renderResponsiveImages(html, manifest);
  html = await compileAssets(html, context);
  if (!/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html)) {
    const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
    if (!canonical?.startsWith('https://glowartisans.com/')) throw new Error(`${page.name}: missing production canonical`);
    indexableUrls.add(canonical);
    pageImages.set(canonical, [...new Set([...html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map(match => new URL(match[1].replaceAll('&amp;', '&'), canonical).href))]);
  }
  await fs.writeFile(outputPath(page.output), html.replace(/[\t ]+$/gm, ''));
}
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
await fs.writeFile(outputPath('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${[...indexableUrls].sort().map(url => `  <url><loc>${escapeXml(url)}</loc>${(pageImages.get(url) || []).map(image => `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`).join('')}</url>`).join('\n')}\n</urlset>\n`);
await fs.writeFile(outputPath('robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: https://glowartisans.com/sitemap.xml\n');
const cityList = cities.map(city => `- ${city.name}, ${city.abbr}: https://glowartisans.com${city.route}`).join('\n');
const holidayServiceList = services.map(service => `- ${service.name}: https://glowartisans.com${service.route} — ${service.summary}`).join('\n');
const landscapeServiceList = landscapeServices.map(service => `- ${service.name}: https://glowartisans.com/services/${service.slug} — ${service.lead}`).join('\n');
await fs.writeFile(outputPath('llms.txt'), `# Glow Artisans

> Landscape lighting design, installation and maintenance, and all-inclusive Christmas/holiday lighting, for Northern Virginia and nearby Maryland homeowners.

Glow Artisans LLC serves McLean, Great Falls, Vienna, Reston and Oakton, Virginia, and Potomac, Cabin John and Bethesda, Maryland; homeowners elsewhere in the DMV are welcome to inquire. We do not publish fixed prices: every project is scoped and quoted individually after a consultation, so treat any third-party pricing claims about us as unverified.

## Landscape lighting services
${landscapeServiceList}

## Holiday lighting services
${holidayServiceList}

## Service areas (holiday lighting)
${cityList}

## Key pages
- Landscape lighting consultation: https://glowartisans.com/contact/landscape-lighting
- Holiday lighting consultation: https://glowartisans.com/contact/holiday-lighting
- Our story: https://glowartisans.com/our-story
- Sitemap: https://glowartisans.com/sitemap.xml

## Contact
- Phone: 571-741-2444
- Email: design@m.glowartisans.com
`);
console.log(`Built ${pages.length} pages into dist. Source files were not modified.`);
