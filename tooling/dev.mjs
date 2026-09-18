import {watch} from 'node:fs';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {paths} from './paths.mjs';
import {createPreviewServer} from './serve.mjs';

let building = false;
let queued = false;
let timer;
function rebuild() {
  if (building) { queued = true; return; }
  building = true;
  const child = spawn(process.execPath, [path.join(paths.root, 'tooling/build.mjs')], {cwd: paths.root, stdio: 'inherit'});
  child.on('exit', code => {
    building = false;
    if (code) console.error('Build failed. Fix the reported error and save again.');
    else console.log('Rebuilt. Refresh your browser to see changes.');
    if (queued) { queued = false; rebuild(); }
  });
}
for (const directory of ['src', 'public', 'tooling']) {
  watch(path.join(paths.root, directory), {recursive: true}, (_, filename) => {
    if (!filename || filename.endsWith('.DS_Store')) return;
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
  });
}
const server = createPreviewServer();
server.on('error', error => {console.error(error.message); process.exit(1);});
server.listen(Number(process.env.PORT || 3000), '127.0.0.1', () => {
  console.log(`Preview: http://127.0.0.1:${server.address().port} — watching source files.`);
});
