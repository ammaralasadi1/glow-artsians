import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const paths = {
  root,
  source: path.join(root, 'src'),
  public: path.join(root, 'public'),
  output: path.join(root, 'dist'),
  imageCache: path.join(root, '.cache/images'),
};
export const sourcePath = (...parts) => path.join(paths.source, ...parts);
export const outputPath = (...parts) => path.join(paths.output, ...parts);
