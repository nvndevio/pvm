import { readdirSync, existsSync, lstatSync, readlinkSync, symlinkSync, unlinkSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { paths, versionDir, versionBinDir } from './config.js';

/**
 * List all installed PHP versions, sorted ascending.
 */
export function listInstalled() {
  if (!existsSync(paths.versions)) return [];

  return readdirSync(paths.versions)
    .filter((name) => {
      const dir = join(paths.versions, name);
      const phpBin = join(dir, 'bin', 'php');
      return existsSync(phpBin);
    })
    .sort(compareVersions);
}

/**
 * Get the currently active PHP version (from the "current" symlink).
 * Returns null if no version is active.
 */
export function getCurrentVersion() {
  try {
    if (!existsSync(paths.current)) return null;

    const stat = lstatSync(paths.current);
    if (!stat.isSymbolicLink()) return null;

    const target = readlinkSync(paths.current);
    const resolved = resolve(paths.root, target);
    const versionName = resolved.split('/').pop();
    return versionName;
  } catch {
    return null;
  }
}

/**
 * Set the active PHP version by updating the "current" symlink.
 */
export function setCurrentVersion(version) {
  const targetDir = versionDir(version);
  const phpBin = join(targetDir, 'bin', 'php');

  if (!existsSync(phpBin)) {
    throw new Error(`PHP ${version} is not installed (no binary found at ${phpBin})`);
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
  const phpBin = join(versionDir(version), 'bin', 'php');
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
    if (lstatExistsSafe(paths.current)) {
      unlinkSync(paths.current);
    }
  }

  rmSync(dir, { recursive: true, force: true });
}

/**
 * Get the PHP binary path for a given version.
 */
export function phpBinaryPath(version) {
  return join(versionBinDir(version), 'php');
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
