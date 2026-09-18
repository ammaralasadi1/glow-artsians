import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {test} from 'node:test';
import {paths} from '../tooling/paths.mjs';
import {readContent, readPages} from '../tooling/content.mjs';
import {renderResponsiveImages} from '../tooling/images.mjs';

test('page registries have unique output filenames and all sources exist', async () => {
  const pages = await readPages();
  const cities = await readContent('holiday-cities');
  const services = await readContent('holiday-services');
  const filenames = [...pages.map(p => p.output), ...cities.map(p => `${p.page}.html`), ...services.map(p => `${p.page}.html`)];
  assert.equal(filenames.length, 20);
  assert.equal(new Set(filenames).size, filenames.length);
  for (const filename of filenames) await fs.access(path.join(paths.output, filename));
});

test('source pages contain layout slots rather than rendered navigation', async () => {
  for (const {name, html} of await readPages()) {
    assert.ok(html.includes('<!-- site-header:start --><!-- site-header:end -->'), name);
    assert.ok(html.includes('<!-- site-footer:start --><!-- site-footer:end -->'), name);
    assert.ok(!/\.[a-f0-9]{12}\.(?:css|js)/.test(html), name);
  }
});

test('deployment contains no editable source or repository metadata', async () => {
  for (const name of ['src', 'tooling', 'tests', '.git', 'node_modules', 'package.json', 'README.md']) {
    await assert.rejects(fs.access(path.join(paths.output, name)), {code: 'ENOENT'});
  }
  assert.ok(!(await fs.readdir(paths.root)).some(name => name.endsWith('.html')));
});

test('all rendered pages resolve template slots and retain descriptive image alternatives', async () => {
  for (const name of (await fs.readdir(paths.output)).filter(name => name.endsWith('.html'))) {
    const html = await fs.readFile(path.join(paths.output, name), 'utf8');
    assert.ok(!/\{\{\w+\}\}/.test(html), name);
    for (const image of html.matchAll(/<img\b[^>]*>/g)) assert.match(image[0], /\balt="[^"]+"/, name);
  }
});

test('responsive image rendering inserts a missing srcset and correct dimensions', () => {
  const html = '<img src="/assets/images/example.png" data-original-src="/assets/images/example.png" width="1" height="1" alt="Garden" />';
  const manifest = {'/assets/images/example.png': {width: 800, height: 600, variants: [{width: 320, src: '/assets/images/responsive/example-320.webp'}, {width: 800, src: '/assets/images/responsive/example-800.webp'}]}};
  const rendered = renderResponsiveImages(html, manifest);
  assert.match(rendered, /srcset="[^"]+320w, [^"]+800w"/);
  assert.match(rendered, /width="800" height="600"/);
  assert.equal(renderResponsiveImages(rendered, manifest), rendered);
  assert.throws(() => renderResponsiveImages(html, {}), /Missing responsive image/);
});
