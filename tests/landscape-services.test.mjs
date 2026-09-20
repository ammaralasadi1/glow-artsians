import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {test} from 'node:test';
import {readContent} from '../tooling/content.mjs';
import {outputPath} from '../tooling/paths.mjs';
const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"','&quot;');
const pages = await readContent('landscape-services');
for (const page of pages) test(page.name + ' preserves approved scope and navigation', async () => {
 const html = await fs.readFile(outputPath('landscape-' + page.key + '.html'), 'utf8');
 const main = html.match(/<main\b[\s\S]*?<\/main>/)[0];
 assert.equal((main.match(/<h1\b/g)||[]).length,1);
 assert.ok(!main.includes('$'));
 assert.ok(main.includes('commercial'));
 assert.equal((main.match(/Schedule Your Consultation/g)||[]).length,3);
 assert.ok(!main.includes('Schedule Your Evening Demo'));
 assert.ok(!main.includes('/contact/holiday-lighting'));
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema['@graph'][0].url,'https://glowartisans.com/services/'+page.slug);
 const faqs=schema['@graph'].find(s=>s['@type']==='FAQPage').mainEntity;
 assert.ok(faqs.length>=7);
 for(const faq of faqs) assert.ok(main.includes(escape(faq.name)) && main.includes(escape(faq.acceptedAnswer.text)));
 for(const city of ['McLean','Great Falls','Vienna','Reston','Potomac','Cabin John','Bethesda']) assert.ok(main.includes(city));
 for(const other of pages.filter(p=>p.key!==page.key)) assert.ok(main.includes('/services/'+other.slug));
 if(page.key==='maintenance') {
   assert.ok(!main.includes('<h3>Evening demo</h3>'));
   assert.ok(main.includes('<h3>Assessment</h3>'));
   assert.ok(main.includes('systems installed by others'));
 }
 for(const file of ['index.html','landscape-design.html','landscape-installation.html']){
  const linked=await fs.readFile(outputPath(file),'utf8');
  assert.ok(linked.includes('/services/'+page.slug));
 }
});

