import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {gunzipSync, brotliDecompressSync} from 'node:zlib';
const pages=(await fs.readdir('.')).filter(f=>f.endsWith('.html'));
for(const file of pages){
  const html=await fs.readFile(file,'utf8');
  assert(!/cdn\.tailwindcss|fonts\.googleapis|unpkg\.com\/aos/.test(html),`${file}: runtime styling dependency`);
  for(const m of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(\/assets\/generated\/[^"]+)"[^>]*>/g)){
    const asset=m[1].slice(1);const bytes=await fs.readFile(asset);
    assert.deepEqual(gunzipSync(await fs.readFile(asset+'.gz')),bytes);
    assert.deepEqual(brotliDecompressSync(await fs.readFile(asset+'.br')),bytes);
    if(asset.endsWith('.js'))new vm.Script(bytes.toString());
  }
  for(const m of html.matchAll(/<img\b[^>]*>/g)){
    assert(m[0].includes('srcset='),`${file}: missing responsive image`);
    for(const source of m[0].matchAll(/(\/assets\/images\/responsive\/[^\s",]+\.webp)/g))await fs.access(source[1].slice(1));
  }
  assert(html.indexOf('data-build="page-css"')<html.indexOf('data-build="utilities"'),`${file}: CSS order changed`);
  assert.equal((html.match(/class="site-header"/g)||[]).length,1,`${file}: shared header`);
  assert.equal((html.match(/class="site-footer"/g)||[]).length,1,`${file}: shared footer`);
  assert(!html.includes('Return to Main Site'),`${file}: old microsite navigation`);
  assert(!html.includes('{{contactHref}}'),`${file}: unresolved template`);
}
const holiday=await fs.readFile('holiday.html','utf8');
assert(/<video[\s\S]*?autoplay[\s\S]*?loop[\s\S]*?muted[\s\S]*?playsinline/.test(holiday),'Background video flags changed');
await fs.access('assets/video/glow-artisan-holiday-light-installation-video-2.mp4');
assert(!/<iframe\b[^>]*data-form-id=/.test(holiday),'Holiday landing page must link to its dedicated consultation page');
assert(!/data-deferred-src|data-build="deferred-form"/.test(holiday),'Holiday landing page must not retain the deferred form loader');
assert(holiday.includes('href="/contact/holiday-lighting"'),'Holiday landing page must link to its dedicated consultation page');
assert(!holiday.includes('href="/contact"'),'Holiday inquiries must retain their service context');
assert(holiday.includes('class="city-hero city-width"'),'Holiday hub shares the approved split layout');
assert(holiday.includes('id="holiday-video-toggle"'),'Holiday video retains a pause control');
assert.equal((holiday.match(/<h1\b/g)||[]).length,1,'Holiday hub has one primary heading');
assert.equal((holiday.match(/<details>/g)||[]).length,6,'Holiday hub FAQs remain accessible without JavaScript');
JSON.parse(holiday.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
for (const place of ['McLean','Great Falls','Vienna','Oakton','Potomac','Cabin John','Bethesda']) assert(holiday.includes(place),`Holiday service area: ${place}`);
const home=await fs.readFile('index.html','utf8');
assert(home.includes('data-original-src="/assets/images/landscape-slider-before-blue-hour.png"'),'Landscape slider has unlit base');
assert(/id="slider-inner-img"[\s\S]*?data-original-src="\/assets\/images\/landscape-slider-after-blue-hour.png"/.test(home),'Landscape slider reveals illuminated overlay');
assert(home.includes('AI-generated lighting design visualization'),'Slider visualization is disclosed');
assert(home.indexOf('id="slider-root"')<home.indexOf('id="holiday-introduction"'),'Landscape demonstration precedes holiday feature');
assert(home.indexOf('id="holiday-introduction"')<home.indexOf('id="services"'),'Holiday feature remains discoverable');
assert(!/Seasonal Exclusive|Spring 2026|Slot Remains/.test(home),'Homepage promotion should remain evergreen');
const consultationPages = [
  {file:'contact.html',route:'/contact/landscape-lighting',formId:'lrHwC458HnS2mgYg2RGQ',height:927},
  {file:'holiday-contact.html',route:'/contact/holiday-lighting',formId:'B57or7c2v4bJpQB5Cfvq',height:1408},
];
const consultationTitles = [];
for (const {file,route,formId,height} of consultationPages) {
  const html=await fs.readFile(file,'utf8');
  const formFrames=[...html.matchAll(/<iframe\b[^>]*data-form-id="[^"]+"[^>]*>/g)].map(match=>match[0]);
  assert.equal(formFrames.length,1,`${file}: exactly one service-specific embedded form`);
  const iframe=formFrames[0];
  const source=`https://api.leadconnectorhq.com/widget/form/${formId}`;
  assert(iframe.includes(`data-form-id="${formId}"`),`${file}: correct service form`);
  assert(iframe.includes(`id="inline-${formId}"`),`${file}: provider iframe ID`);
  assert.equal(iframe.match(/\ssrc="([^"]+)"/)?.[1],source,`${file}: form must load eagerly with its own source`);
  assert(!/data-deferred-src|loading="lazy"/.test(iframe),`${file}: primary form must not wait for scrolling`);
  assert(iframe.includes(`data-height="${height}"`),`${file}: initial provider form height`);
  assert(!/data-iframe-resizer-initialized|data-initial-iframe-hidden/.test(iframe),`${file}: provider lifecycle markers must be assigned at runtime`);
  assert(html.includes(`href="${source}"`),`${file}: direct provider link available if embedding fails`);
  const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0] || '';
  assert(canonical.includes(`href="https://glowartisans.com${route}"`),`${file}: service-specific canonical URL`);
  const formPosition=html.search(/class="[^"]*\bconsultation-form\b/);
  const storyPosition=html.search(/class="[^"]*\bconsultation-story\b/);
  assert(formPosition>=0 && storyPosition>formPosition,`${file}: consultation form precedes supporting content`);
  const title=html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
  assert(title,`${file}: page title present`);
  consultationTitles.push(title);
}
assert.equal(new Set(consultationTitles).size,2,'Consultation pages need distinct service-specific titles');
const city=await fs.readFile('holiday-mclean.html','utf8');
assert.equal((city.match(/<h1\b/g)||[]).length,1,'City pilot has one primary heading');
assert(city.includes('href="https://glowartisans.com/holiday/mclean-va"'),'City pilot canonical');
assert(city.includes('href="/contact/holiday-lighting"'),'City inquiries retain holiday context');
assert(!city.match(/<main\b[\s\S]*?<\/main>/)[0].includes('href="/contact/landscape-lighting"'),'Primary city content retains holiday context');
assert(!/data-form-id=|form_embed\.js|<video\b/.test(city),'City pilot adds no form or video payload');
assert(!/<figcaption\b/.test(city+holiday),'Holiday media stays free of visible captions');
assert(!holiday.includes('aria-describedby="holiday-video-caption"'),'No dangling video caption reference');
assert(city.includes('Interior decorating is not included'),'Exterior-only scope is explicit');
assert(city.includes('elsewhere in Northern Virginia'),'Other Northern Virginia inquiries stay welcome');
assert.equal((city.match(/<details>/g)||[]).length,6,'City FAQ works without JavaScript');
const citySchema=JSON.parse(city.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
assert(citySchema['@graph'].some(item=>item['@type']==='Service'),'City service structured data');
assert(citySchema['@graph'].some(item=>item['@type']==='BreadcrumbList'),'City breadcrumb structured data');
assert(!/aggregateRating|"review"|streetAddress/.test(JSON.stringify(citySchema)),'No invented local reviews, ratings, or office');
assert(holiday.includes('href="/holiday/mclean-va"'),'City pilot is linked from the holiday hub');
const cityRegistry=JSON.parse(await fs.readFile('content/holiday-cities.json','utf8'));
assert.equal(cityRegistry.length,8,'Eight holiday service-area pages');
const descriptions=new Set();
const localSections=new Set();
for(const {name,state,abbr,page,route} of cityRegistry){
  const html=await fs.readFile(`${page}.html`,'utf8');
  const main=html.match(/<main\b[\s\S]*?<\/main>/)[0];
  const header=html.match(/<header class="site-header">[\s\S]*?<\/header>/)[0];
  assert(html.includes(`href="https://glowartisans.com${route}"`),`${page}: canonical`);
  assert(html.includes(`${name}, ${abbr}`) && main.includes(`${name}, ${state}`),`${page}: correct city/state`);
  assert(!/data-form-id=|form_embed\.js|<video\b|<figcaption\b/.test(main),`${page}: light, caption-free city page`);
  assert(!main.includes('/contact/landscape-lighting'),`${page}: holiday primary CTAs`);
  assert(header.includes('href="/contact/holiday-lighting"'),`${page}: contextual header CTA`);
  assert((main.match(/class="city-button" href="\/contact\/holiday-lighting"/g)||[]).length>=3,`${page}: hero, post-gallery, closing CTAs`);
  assert.equal((main.match(/<h1\b/g)||[]).length,1,`${page}: one H1`);
  assert.equal((main.match(/<details>/g)||[]).length,6,`${page}: native FAQs`);
  assert(main.includes('Interior decorating is not included') && main.includes('elsewhere in Northern Virginia'),`${page}: agreed scope and wider availability`);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const service=schema['@graph'].find(item=>item['@type']==='Service');
  assert(service.areaServed.some(area=>area.name===`${name}, ${state}`),`${page}: service schema geography`);
  assert(!/aggregateRating|streetAddress|"review"/.test(JSON.stringify(schema)),`${page}: no invented claims`);
  assert(holiday.includes(`href="${route}"`),`${page}: discoverable from holiday hub`);
  descriptions.add(html.match(/<meta name="description" content="([^"]+)"/)[1]);
  localSections.add(main.match(/<h2 id="city-local-title">[\s\S]*?<\/aside>/)[0].replaceAll(name,'CITY'));
}
assert.equal(descriptions.size,8,'Distinct city descriptions');
assert.equal(localSections.size,8,'Distinct city planning content');
for(const page of pages){
  const html=await fs.readFile(page,'utf8');
  assert(html.includes('href="/contact/landscape-lighting"') && html.includes('href="/contact/holiday-lighting"'),`${page}: both service consultation routes accessible`);
  const header=html.match(/<header class="site-header">[\s\S]*?<\/header>/)[0];
  const expected=page.startsWith('holiday')?'/contact/holiday-lighting':'/contact/landscape-lighting';
  assert(header.includes(`href="${expected}" class="site-contact-link"`),`${page}: correct header destination`);
}
const services=JSON.parse(await fs.readFile('content/holiday-services.json','utf8'));
assert.equal(services.length,4,'Four distinct holiday services');
const serviceDescriptions=new Set();
for(const service of services){
  const html=await fs.readFile(service.page+'.html','utf8');
  const main=html.match(/<main\b[\s\S]*?<\/main>/)[0];
  assert.equal((main.match(/<h1\b/g)||[]).length,1,`${service.page}: one H1`);
  assert.equal((main.match(/<details>/g)||[]).length,6,`${service.page}: accessible FAQs`);
  assert(!/<video\b|data-form-id=/.test(main),`${service.page}: no video or duplicated forms`);
  assert.equal((main.match(/<img\b/g)||[]).length,3,`${service.page}: hero and two supporting images`);
  assert.equal((main.match(/loading="lazy"/g)||[]).length,2,`${service.page}: supporting images lazy-loaded`);
  assert(main.includes(`data-original-src="${service.image}"`),`${service.page}: correct service image`);
  assert(main.includes('fetchpriority="high"') && main.includes('loading="eager"'),`${service.page}: prioritized hero`);
  assert(main.includes('AI-generated design inspiration'),`${service.page}: transparent inspiration imagery`);
  assert(!html.includes('site-footer-ctas'),`${service.page}: no duplicate footer CTA banner`);
  assert(!main.includes('/contact/landscape-lighting'),`${service.page}: holiday contact context`);
  assert.equal((main.match(/Request a Holiday Estimate/g)||[]).length,3,`${service.page}: hero, planning and closing estimate CTAs`);
  assert(html.includes(`href="https://glowartisans.com${service.route}"`),`${service.page}: canonical`);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert(schema['@graph'].some(x=>x['@type']==='Service' && x.url.endsWith(service.route)),`${service.page}: service structured data`);
  assert(!/aggregateRating|streetAddress|"review"/.test(JSON.stringify(schema)),`${service.page}: no invented claims`);
  serviceDescriptions.add(schema['@graph'].find(x=>x['@type']==='Service').description);
  for(const source of ['holiday',...cityRegistry.map(c=>c.page)]){
    const linked=await fs.readFile(source+'.html','utf8');
    assert(linked.includes(`href="${service.route}"`),`${source}: discovers ${service.page}`);
    assert(!linked.includes('site-footer-ctas'),`${source}: no duplicate footer CTA banner`);
  }
  for(const other of services.filter(x=>x!==service))assert(main.includes(`href="${other.route}"`),`${service.page}: related service link`);
  for(const match of main.matchAll(/href="#([^"]+)"/g))assert(main.includes(`id="${match[1]}"`),`${service.page}: valid section link`);
}
assert.equal(serviceDescriptions.size,4,'Unique service descriptions');
for(const file of ['holiday.html','holiday-contact.html',...cityRegistry.map(c=>c.page+'.html')]){
  const html=await fs.readFile(file,'utf8');
  assert(!/data-original-src="\/assets\/images\/portfolio-/.test(html),`${file}: upgraded holiday imagery`);
  assert(html.includes('Still imagery is AI-generated design inspiration'),`${file}: inspiration disclosure`);
  const expectedImages=file==='holiday.html'?6:file==='holiday-contact.html'?3:7;
  assert.equal((html.match(/<img\b/g)||[]).length,expectedImages,`${file}: expanded gallery without duplicates`);
  for(const tag of html.matchAll(/<img\b[^>]*>/g))assert(tag[0].includes('AI-generated inspiration:'),`${file}: descriptive inspiration alt text`);
}
console.log(`${pages.length} pages: resource references, CSS order, script syntax, compression, responsive images, video, forms and holiday service checks pass.`);
