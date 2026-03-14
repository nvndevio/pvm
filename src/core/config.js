import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';

const HOME = homedir();
const PVM_DIR = process.env.PVM_DIR || join(HOME, '.pvm');

export const paths = {
  root: PVM_DIR,
  versions: join(PVM_DIR, 'versions'),
  cache: join(PVM_DIR, 'cache'),
  current: join(PVM_DIR, 'current'),
  bin: join(PVM_DIR, 'bin'),
};

export function ensureDirs() {
  for (const dir of [paths.root, paths.versions, paths.cache, paths.bin]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

export function versionDir(version) {
  return join(paths.versions, version);
}

export function versionBinDir(version) {
  return join(paths.versions, version, 'bin');
}
