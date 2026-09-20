import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {outputPath, sourcePath} from '../tooling/paths.mjs';
import {createPreviewServer} from '../tooling/serve.mjs';

test('search discovery lists every indexable canonical once and omits confirmation', async () => {
  const sitemap = await fs.readFile(outputPath('sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert.equal(urls.length, new Set(urls).size);
  assert(!sitemap.includes('/thank-you'));
  for (const file of (await fs.readdir(outputPath())).filter(f => f.endsWith('.html'))) {
    const html = await fs.readFile(outputPath(file), 'utf8');
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    assert(canonical, file);
    assert.equal(urls.includes(canonical), !html.includes('content="noindex, follow"'), file);
    assert(/>Skip to (?:content|main content)</i.test(html), `${file}: keyboard bypass`);
    assert(!html.includes('123 Artisan Way'), `${file}: no fabricated office`);
  }
  assert((await fs.readFile(outputPath('robots.txt'), 'utf8')).includes('Sitemap: https://glowartisans.com/sitemap.xml'));
});

test('preview serves public discovery files without exposing source', async t => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const route of ['/robots.txt', '/sitemap.xml']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    if (route.endsWith('.xml')) assert.match(response.headers.get('content-type'), /application\/xml/);
  }
  assert.equal((await fetch(base + '/package.json')).status, 404);
});

test('tracking records intent only with bounded non-personal fields', async () => {
  const callbacks = {};
  const window = {dataLayer: [{event: 'existing'}]};
  const document = {querySelector: () => null, addEventListener: (name, fn) => { callbacks[name] = fn; }};
  vm.runInNewContext(await fs.readFile(sourcePath('scripts', 'site-shell.js'), 'utf8'), {window, document, URL, location: {origin: 'https://glowartisans.com', href: 'https://glowartisans.com/?email=private'}});
  const click = href => callbacks.click({target: {closest: () => ({href, closest: () => null})}});
  click('https://glowartisans.com/contact/holiday-lighting?email=private');
  click('tel:5717412444');
  click('mailto:private@example.com');
  click('https://elsewhere.test/contact/holiday-lighting');
  click('https://glowartisans.com/thank-you');
  assert.equal(window.dataLayer.length, 4);
  assert.equal(window.dataLayer[1].inquiry_service, 'holiday');
  assert.equal(window.dataLayer[2].inquiry_action, 'phone_click');
  assert(!/private|5717412444|generate_lead/.test(JSON.stringify(window.dataLayer)));
});
