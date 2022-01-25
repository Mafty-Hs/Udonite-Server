
import fs from 'fs';

export function dirRemove(path :string) {
  if (!path) return;
  if ( !fs.existsSync( path )) return;
  fs.rmSync(path, { recursive: true, force: true })
}


