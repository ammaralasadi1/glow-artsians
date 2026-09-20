import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {test} from 'node:test';
import {outputPath} from '../tooling/paths.mjs';

test('homepage has concise service-first flow and truthful structured data', async () => {
 const html = await fs.readFile(outputPath('index.html'), 'utf8');
 const main = html.match(/<main\b[\s\S]*?<\/main>/)[0];
 assert.equal((main.match(/<h1\b/g)||[]).length, 1);
 assert.equal((main.match(/<details>/g)||[]).length, 11);
 for (const reviewer of ['Michael Sosler','Marshall Williams','Bernardo Garcia','Andy Thomas','Joe R']) assert.ok(main.includes(reviewer));
 assert.ok(main.includes('Joe R · Industry peer'));
 assert.equal((main.match(/class="archetype-card home-service-card"/g)||[]).length, 6);
 assert.ok(main.indexOf('id="services"') < main.indexOf('id="glow-path"'));
 assert.ok(main.indexOf('id="glow-path"') < main.indexOf('id="holiday-introduction"'));
 assert.ok(main.includes('href="/contact/holiday-lighting"'));
 for(const phrase of ['GlowCare','Sterling Family','123 Artisan Way','Lifetime Manufacturer Warranty','Estate..','Qulaity']) assert.ok(!html.includes(phrase), phrase);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema['@graph'].find(s=>s['@type']==='FAQPage').mainEntity.length,6);
 assert.ok(!schema['@graph'][0].address.streetAddress);
 assert.equal((main.match(/Schedule Your Consultation/g)||[]).length,4);
});
