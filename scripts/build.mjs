import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {transform} from 'lightningcss';
import {minify} from 'terser';
import {gzipSync, brotliCompressSync} from 'node:zlib';
import {renderServicePages, serviceLinks} from './holiday-services.mjs';
import {refreshHolidayImagery} from './holiday-imagery.mjs';
const require = createRequire(import.meta.url);
const outputs = new Set();
const holidayCities = JSON.parse(await fs.readFile('content/holiday-cities.json','utf8'));
const cityPages = new Set(holidayCities.map(city => city.page));
const holidayServices = JSON.parse(await fs.readFile('content/holiday-services.json','utf8'));
const servicePages = new Set(holidayServices.map(service => service.page));
await renderServicePages(holidayServices, holidayCities);
const pages = (await fs.readdir('.')).filter(n => n.endsWith('.html'));
const header = await fs.readFile('partials/header.html', 'utf8');
const footer = await fs.readFile('partials/footer.html', 'utf8');
for (const name of pages) {
  const page = name.slice(0, -5);
  const isHoliday = ['holiday', 'holiday-contact'].includes(page) || cityPages.has(page) || servicePages.has(page);
  const isContact = ['contact', 'holiday-contact'].includes(page);
  const values = {
    contactHref: isHoliday ? '/contact/holiday-lighting' : '/contact/landscape-lighting',
    contactLabel: isHoliday ? 'Holiday Consultation' : 'Landscape Consultation',
    headerCta: isContact ? 'Contact' : servicePages.has(page) ? 'Request an Estimate' : 'Design Consultation',
    footerConsultations: isHoliday || ['contact','privacy-policy','thank-you'].includes(page) ? '' : `<div class="site-footer-ctas" aria-label="Request a design consultation"><a class="site-cta" href="/contact/landscape-lighting">Plan your landscape lighting</a><a class="site-cta site-cta-secondary" href="/contact/holiday-lighting">Holiday lighting consultation</a></div>`,
    year: String(new Date().getFullYear()),
  };
  const render = template => template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key])
    .replace(/data-page-link="([\w-]+)"/g, (_, key) => key === (isContact ? 'contact' : page) ? 'aria-current="page"' : '');
  let html = await fs.readFile(name, 'utf8');
  if (page === 'holiday' || page === 'holiday-contact' || cityPages.has(page)) html = await refreshHolidayImagery(html);
  if (page === 'holiday' || cityPages.has(page)) {
    const links = serviceLinks(holidayServices);
    html = html.includes('<!-- holiday-services:start -->')
      ? html.replace(/<!-- holiday-services:start -->[\s\S]*?<!-- holiday-services:end -->/,links)
      : html.replace(/(?=<section id="(?:city-process|process)")/,links+'\n    ');
  }
  for (const [slot, template] of [['header', header], ['footer', footer]]) {
    html = html.replace(new RegExp(`<!-- site-${slot}:start -->[\\s\\S]*?<!-- site-${slot}:end -->`),
      `<!-- site-${slot}:start -->\n${render(template)}<!-- site-${slot}:end -->`);
  }
  await fs.writeFile(name, html);
}
await fs.mkdir('assets/generated', {recursive:true});
const compiled = execFileSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-c', 'tailwind.config.cjs', '-i', 'assets/css/utilities.css', '--minify'], {stdio:['ignore','pipe','inherit']});
const write = async (name, ext, content) => {
  const hash=crypto.createHash('sha256').update(content).digest('hex').slice(0,12);
  const file=`assets/generated/${name}.${hash}.${ext}`;
  await fs.writeFile(file, content);
  outputs.add(file.split('/').at(-1));
  await fs.writeFile(`${file}.gz`,gzipSync(content,{level:9}));
  await fs.writeFile(`${file}.br`,brotliCompressSync(content));
  outputs.add(file.split('/').at(-1)+'.gz');
  outputs.add(file.split('/').at(-1)+'.br');
  return `/${file}`;
};
const fonts = transform({filename:'fonts.css',code:await fs.readFile('assets/css/fonts.css'),minify:true}).code;
const shell = transform({filename:'site-shell.css',code:await fs.readFile('assets/css/site-shell.css'),minify:true}).code;
const utilities = await write('utilities','css',Buffer.concat([fonts,compiled,shell]));
for (const name of pages) {
  const page=name.slice(0,-5);
  let html=await fs.readFile(name,'utf8');
  const pageCss = await fs.readFile(`assets/css/${servicePages.has(page) ? 'holiday-service' : cityPages.has(page) ? 'holiday-city' : page}.css`);
  const cssSource = ['contact', 'holiday-contact'].includes(page)
    ? Buffer.concat([await fs.readFile('assets/css/consultation.css'), pageCss])
    : (page === 'holiday' || cityPages.has(page) || servicePages.has(page))
      ? Buffer.concat([await fs.readFile('assets/css/holiday-shared.css'), pageCss])
      : pageCss;
  const css=transform({filename:`${page}.css`,code:cssSource,minify:true}).code;
  const cssUrl=await write(servicePages.has(page) ? 'holiday-service' : cityPages.has(page) ? 'holiday-city' : page,'css',css);
  html=html.replace(/(<link data-build="utilities" href=")[^"]+/,`$1${utilities}`);
  html=html.replace(/(<link data-build="page-css" href=")[^"]+/,`$1${cssUrl}`);
  for(const match of html.matchAll(/<script data-build="([\w-]+)" src="[^"]+" defer><\/script>/g)) {
    const jsName=match[1];
    const result=await minify(await fs.readFile(`assets/js/${jsName}.js`,'utf8'));
    const url=await write(jsName,'js',result.code);
    html=html.replace(match[0],`<script data-build="${jsName}" src="${url}" defer></script>`);
  }
  await fs.writeFile(name,html.replace(/[\t ]+$/gm,''));
}
// This directory contains only build outputs. Remove obsolete fingerprints.
for(const file of await fs.readdir('assets/generated')) {
  if(!outputs.has(file) && (/^[\w-]+\.[a-f0-9]{12}\.(css|js)(\.(gz|br))?$/.test(file) || file==='utilities.css')) {
    await fs.unlink(`assets/generated/${file}`);
  }
}
console.log('Built static CSS and JavaScript; HTML now references content-hashed assets.');
