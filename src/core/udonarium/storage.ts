
import fs from 'fs';

export function dirRemove(path :string) {
  if (!path) return;
  if ( !fs.existsSync( path )) return;
  fs.rmSync(path, { recursive: true, force: true })
}

export async function fileRemove(filePath :string) {
  if (!filePath) return;
  if ( !fs.existsSync( filePath )) return;
  fs.rmSync(filePath, { force: true })
}
