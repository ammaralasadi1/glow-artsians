import fs from 'node:fs/promises';
import {sourcePath} from './paths.mjs';

export async function readContent(name) {
  return JSON.parse(await fs.readFile(sourcePath('content', `${name}.json`), 'utf8'));
}

export async function readPages() {
  const entries = await readContent('pages');
  return Promise.all(entries.map(async entry => ({
    ...entry,
    html: await fs.readFile(sourcePath('pages', entry.source), 'utf8'),
  })));
}
