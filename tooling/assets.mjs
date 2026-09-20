import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {gzipSync, brotliCompressSync} from 'node:zlib';
import {transform} from 'lightningcss';
import {minify} from 'terser';
import {root, sourcePath, outputPath} from './paths.mjs';

const require = createRequire(import.meta.url);
const style = name => fs.readFile(sourcePath('styles', `${name}.css`));
const css = (name, code) => transform({filename: `${name}.css`, code, minify: true}).code;

async function writeAsset(name, extension, content) {
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
  const url = `/assets/generated/${name}.${hash}.${extension}`;
  const file = outputPath(url);
  await fs.mkdir(path.dirname(file), {recursive: true});
  await Promise.all([
    fs.writeFile(file, content),
    fs.writeFile(`${file}.gz`, gzipSync(content, {level: 9})),
    fs.writeFile(`${file}.br`, brotliCompressSync(content)),
  ]);
  return url;
}

export async function createAssetCompiler() {
  const compiled = execFileSync(process.execPath, [require.resolve('tailwindcss/lib/cli.js'), '-c', path.join(root, 'tailwind.config.cjs'), '-i', sourcePath('styles', 'utilities.css'), '--minify'], {cwd: root, stdio: ['ignore', 'pipe', 'inherit']});
  const utilities = await writeAsset('utilities', 'css', Buffer.concat([css('fonts', await style('fonts')), compiled, css('site-shell', await style('site-shell'))]));
  const styles = new Map();
  const scripts = new Map();
  return async function compilePage(html, {name, isCity, isService}) {
    const styleName = isService ? 'holiday-service' : isCity ? 'holiday-city' : name.startsWith('landscape-') ? 'landscape-design' : name;
    if (!styles.has(styleName)) {
      const base = ['contact', 'holiday-contact'].includes(name) ? 'consultation' : name === 'holiday' || isCity || isService ? 'holiday-shared' : null;
      const code = base ? Buffer.concat([await style(base), await style(styleName)]) : await style(styleName);
      styles.set(styleName, await writeAsset(styleName, 'css', css(styleName, code)));
    }
    html = html.replace(/(<link data-build="utilities" href=")[^"]+/, `$1${utilities}`)
      .replace(/(<link data-build="page-css" href=")[^"]+/, `$1${styles.get(styleName)}`);
    for (const match of html.matchAll(/<script data-build="([\w-]+)" src="[^"]+" defer><\/script>/g)) {
      const name = match[1];
      if (!scripts.has(name)) {
        const result = await minify(await fs.readFile(sourcePath('scripts', `${name}.js`), 'utf8'));
        scripts.set(name, await writeAsset(name, 'js', result.code));
      }
      html = html.replace(match[0], `<script data-build="${name}" src="${scripts.get(name)}" defer></script>`);
    }
    return html;
  };
}
