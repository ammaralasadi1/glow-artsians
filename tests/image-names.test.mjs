import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {outputPath} from '../tooling/paths.mjs';

test('published responsive images keep descriptive filenames and immutable identifiers', async () => {
  const manifest=JSON.parse(await fs.readFile(outputPath('assets/images/responsive-manifest.json'),'utf8'));
  for(const [source,image] of Object.entries(manifest)) {
    const stem=path.basename(source,path.extname(source));
    assert.match(stem,/^[a-z0-9]+(?:-[a-z0-9]+)+$/);
    for(const variant of image.variants) {
      assert(path.basename(variant.src).startsWith(stem+'-'));
      assert.match(variant.src,/-[a-f0-9]{12}-\d+\.webp$/);
      await fs.access(outputPath(variant.src.slice(1)));
    }
  }
});

test('legacy image redirects point directly to published images', async () => {
  const redirects=(await fs.readFile(outputPath('_redirects'),'utf8')).split('\n').filter(line=>line.startsWith('/assets/images/')).map(line=>line.split(/\s+/));
  assert(redirects.length>100);
  assert.equal(new Set(redirects.map(r=>r[0])).size,redirects.length);
  for(const [from,to,status] of redirects) {
    assert.notEqual(from,to);
    assert.equal(status,'301!');
    await fs.access(outputPath(to.slice(1)));
  }
});

test('image sitemap associates image URLs with service-area pages', async () => {
  const xml=await fs.readFile(outputPath('sitemap.xml'),'utf8');
  assert(xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
  assert.match(xml,/<loc>https:\/\/glowartisans.com\/holiday\/mclean-va<\/loc><image:image>/);
  assert(!xml.includes('geo_location'));
});
