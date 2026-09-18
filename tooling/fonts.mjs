// Maintenance command only: builds use the committed font files without network access.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import {paths, sourcePath} from './paths.mjs';
const fetchText = async url => {
  const response = await fetch(url, {headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}});
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  return response.text();
};
await fs.mkdir(path.join(paths.public,'assets/fonts'),{recursive:true});
const css=await fetchText('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lato:wght@300;400;700&display=swap');
const faces=[...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)].map(m=>m[1]);
if(faces.length!==5) throw new Error('Expected five Latin WOFF2 faces; inspect the provider response.');
const local=[];
for(const face of faces){
  const url=face.match(/url\(([^)]+\.woff2)\)/)?.[1];
  if(!url) throw new Error('Expected WOFF2');
  const response=await fetch(url);if(!response.ok)throw new Error('Font download failed');
  const bytes=Buffer.from(await response.arrayBuffer());
  const hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12);
  const file=`assets/fonts/${hash}.woff2`;
  await fs.writeFile(path.join(paths.public,file),bytes);
  local.push(face.replace(url,`/${file}`));
}
await fs.writeFile(sourcePath('styles','fonts.css'),local.join('\n')+'\n');
for(const family of ['lato','playfairdisplay']){
  await fs.writeFile(path.join(paths.public,`assets/fonts/${family}-OFL.txt`),await fetchText(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`));
}
console.log('Saved five local WOFF2 fonts and their licenses.');
