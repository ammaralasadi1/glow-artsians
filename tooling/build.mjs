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
const [cities, services, pages, manifest] = await Promise.all([
  readContent('holiday-cities'), readContent('holiday-services'), readPages(), prepareImages(),
]);
await publishImages(manifest);
pages.push(...await renderServicePages(services, cities, manifest));
pages.push(...await renderCityPages(cities));
// Tailwind scans rendered templates too, including data-driven service markup.
for (const page of pages) await fs.writeFile(outputPath(page.output), page.html);
const compileAssets = await createAssetCompiler();
const renderLayout = await createLayoutRenderer();
for (const page of pages) {
  const context = {...page, isCity: cities.some(city => city.page === page.name), isService: services.some(service => service.page === page.name)};
  let html = page.html;
  if (['holiday', 'holiday-contact'].includes(page.name) || context.isCity) html = await refreshHolidayImagery(html, manifest);
  if (page.name === 'holiday' || context.isCity) html = html.replace(/<!-- holiday-services:start -->[\s\S]*?<!-- holiday-services:end -->/, serviceLinks(services));
  html = renderLayout(html, context);
  html = renderResponsiveImages(html, manifest);
  html = await compileAssets(html, context);
  await fs.writeFile(outputPath(page.output), html.replace(/[\t ]+$/gm, ''));
}
console.log(`Built ${pages.length} pages into dist. Source files were not modified.`);
