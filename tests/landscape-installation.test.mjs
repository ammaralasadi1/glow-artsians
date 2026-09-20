import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {test} from 'node:test';
import {outputPath} from '../tooling/paths.mjs';

test('installation page retains agreed offerings, FAQs and contact links', async () => {
  const html = await fs.readFile(outputPath('landscape-installation.html'), 'utf8');
  const main = html.match(/<main\b[\s\S]*?<\/main>/)[0];
  assert.equal((main.match(/<h1\b/g) || []).length, 1);
  assert.equal((main.match(/<details>/g) || []).length, 8);
  assert.ok(main.includes('customer-supplied'));
  assert.ok(main.includes('methods depend on the site'));
  assert.equal((main.match(/Schedule Your Evening Demo/g) || []).length, 4);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const faqs = schema['@graph'].find(item => item['@type'] === 'FAQPage').mainEntity;
  for (const faq of faqs) assert.ok(main.includes(faq.name) && main.includes(faq.acceptedAnswer.text));
  for (const page of ['index.html', 'landscape-design.html']) {
    const linked = await fs.readFile(outputPath(page), 'utf8');
    assert.ok(linked.includes('href="/services/landscape-lighting-installation"'));
  }
});
