import { readdirSync, existsSync, lstatSync, readlinkSync, symlinkSync, unlinkSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { platform } from 'node:os';
import { paths, versionDir, versionBinDir } from './config.js';

const IS_WINDOWS = platform() === 'win32';
const PHP_BIN = IS_WINDOWS ? 'php.exe' : 'php';

/**
 * List all installed PHP versions, sorted ascending.
 */
export function listInstalled() {
  if (!existsSync(paths.versions)) return [];

  return readdirSync(paths.versions)
    .filter((name) => {
      const phpBin = join(versionBinDir(name), PHP_BIN);
      return existsSync(phpBin);
    })
    .sort(compareVersions);
}

/**
 * Get the currently active PHP version.
 * - Unix: reads the "current" symlink
 * - Windows: reads a "current" text file
 */
export function getCurrentVersion() {
  try {
    if (!existsSync(paths.current)) return null;

    if (IS_WINDOWS) {
      const content = readFileSync(paths.current, 'utf8').trim();
      if (content && existsSync(join(versionBinDir(content), PHP_BIN))) {
        return content;
      }
      return null;
    }

    const stat = lstatSync(paths.current);
    if (!stat.isSymbolicLink()) return null;

    const target = readlinkSync(paths.current);
    const resolved = resolve(paths.root, target);
    const versionName = resolved.split(sep).pop();
    return versionName;
  } catch {
    return null;
  }
}

/**
 * Set the active PHP version.
 * - Unix: updates the "current" symlink
 * - Windows: writes version to "current" file
 */
export function setCurrentVersion(version) {
  const targetDir = versionDir(version);
  const phpBin = join(versionBinDir(version), PHP_BIN);

  if (!existsSync(phpBin)) {
    throw new Error(`PHP ${version} is not installed (no binary found at ${phpBin})`);
  }

  if (IS_WINDOWS) {
    writeFileSync(paths.current, version, 'utf8');
    return targetDir;
  }

  if (existsSync(paths.current) || lstatExistsSafe(paths.current)) {
    unlinkSync(paths.current);
  }

  symlinkSync(targetDir, paths.current);
  return targetDir;
}

/**
 * Check if a specific version is installed.
 */
export function isInstalled(version) {
  const phpBin = join(versionBinDir(version), PHP_BIN);
  return existsSync(phpBin);
}

/**
 * Remove an installed version.
 */
export function removeVersion(version) {
  const dir = versionDir(version);
  if (!existsSync(dir)) {
    throw new Error(`PHP ${version} is not installed`);
  }

  const current = getCurrentVersion();
  if (current === version) {
    if (IS_WINDOWS) {
      try { unlinkSync(paths.current); } catch { /* ok */ }
    } else if (lstatExistsSafe(paths.current)) {
      unlinkSync(paths.current);
    }
  }

  rmSync(dir, { recursive: true, force: true });
}

/**
 * Get the PHP binary path for a given version.
 */
export function phpBinaryPath(version) {
  return join(versionBinDir(version), PHP_BIN);
}

function lstatExistsSafe(p) {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}
