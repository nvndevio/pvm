import { platform, arch } from 'node:os';

export const IS_WINDOWS = platform() === 'win32';
export const IS_MACOS = platform() === 'darwin';
export const IS_LINUX = platform() === 'linux';

export function phpBinaryName() {
  return IS_WINDOWS ? 'php.exe' : 'php';
}

export function getArch() {
  const a = arch();
  if (a === 'x64' || a === 'x86_64') return 'x64';
  if (a === 'arm64' || a === 'aarch64') return 'arm64';
  return a;
}

/**
 * Resolve the Windows VS version tag based on PHP version.
 * PHP 8.4+: vs17, PHP 8.0-8.3: vs16, PHP 7.x: vc15
 */
export function windowsVsTag(version) {
  const [major, minor] = version.split('.').map(Number);
  if (major >= 8 && minor >= 4) return 'vs17';
  if (major >= 8) return 'vs16';
  return 'vc15';
}
