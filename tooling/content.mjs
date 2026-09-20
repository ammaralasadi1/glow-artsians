import fs from 'node:fs/promises';
import {sourcePath} from './paths.mjs';
import {renderLandscapePage} from '../src/templates/landscape-services.mjs';

export async function readContent(name) {
  return JSON.parse(await fs.readFile(sourcePath('content', `${name}.json`), 'utf8'));
}

export async function readPages() {
  const entries = await readContent('pages');
  const landscape = await readContent('landscape-services');
  return Promise.all(entries.map(async entry => ({
    ...entry,
    html: entry.landscapeKey
      ? renderLandscapePage(landscape.find(page => page.key === entry.landscapeKey), landscape)
      : await fs.readFile(sourcePath('pages', entry.source), 'utf8'),
  })));
}
