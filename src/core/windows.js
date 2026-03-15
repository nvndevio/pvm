import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { paths } from './config.js';
import { spinner, formatBytes, log } from '../utils/ui.js';
import { downloadFile } from './downloader.js';
import { getArch, windowsVsTag } from './platform.js';

const WIN_PHP_BASE = 'https://windows.php.net/downloads/releases';
const WIN_PHP_ARCHIVE = 'https://windows.php.net/downloads/releases/archives';

/**
 * Install PHP on Windows by downloading pre-built binaries.
 */
export async function installWindowsBinary(version) {
  const installDir = join(paths.versions, version);

  if (existsSync(join(installDir, 'php.exe'))) {
    log.info(`PHP ${version} is already installed`);
    return installDir;
  }

  const zipPath = await downloadWindowsZip(version);
  await extractZip(zipPath, installDir);

  setupPhpIni(installDir);

  return installDir;
}

async function downloadWindowsZip(version) {
  const arch = getArch();
  const vsTag = windowsVsTag(version);
  const archSuffix = arch === 'x64' ? 'x64' : 'x86';

  // NTS (Non-Thread Safe) for CLI usage
  const filename = `php-${version}-nts-Win32-${vsTag}-${archSuffix}.zip`;
  const cachePath = join(paths.cache, filename);

  if (existsSync(cachePath)) {
    return cachePath;
  }

  const sp = spinner(`Downloading ${filename}...`);
  sp.start();

  const urls = [
    `${WIN_PHP_BASE}/${filename}`,
    `${WIN_PHP_ARCHIVE}/${filename}`,
  ];

  let downloaded = false;
  for (const url of urls) {
    try {
      await downloadFile(url, cachePath, (received, total) => {
        if (total) {
          const pct = Math.round((received / total) * 100);
          sp.text = `  Downloading ${filename}... ${pct}% (${formatBytes(received)}/${formatBytes(total)})`;
        } else {
          sp.text = `  Downloading ${filename}... ${formatBytes(received)}`;
        }
      });
      downloaded = true;
      break;
    } catch {
      continue;
    }
  }

  if (!downloaded) {
    sp.fail(`Failed to download PHP ${version} for Windows`);
    throw new Error(
      `Could not download PHP ${version} for Windows.\n` +
      `    Tried: ${filename}\n` +
      `    Check available versions at https://windows.php.net/download`
    );
  }

  sp.succeed(`Downloaded ${filename}`);
  return cachePath;
}

async function extractZip(zipPath, destDir) {
  const sp = spinner('Extracting...');
  sp.start();

  try {
    mkdirSync(destDir, { recursive: true });

    // Use PowerShell to extract (available on all modern Windows)
    execSync(
      `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`,
      { stdio: 'pipe' }
    );

    // Windows PHP zips sometimes nest inside a folder — flatten if needed
    const entries = readdirSync(destDir);
    if (entries.length === 1 && existsSync(join(destDir, entries[0], 'php.exe'))) {
      const nested = join(destDir, entries[0]);
      execSync(`xcopy "${nested}\\*" "${destDir}\\" /E /Y /Q`, { stdio: 'pipe' });
      execSync(`rmdir "${nested}" /S /Q`, { stdio: 'pipe' });
    }

    sp.succeed('Extracted');
  } catch (err) {
    sp.fail('Failed to extract');
    throw err;
  }
}

function setupPhpIni(installDir) {
  const iniDev = join(installDir, 'php.ini-development');
  const iniDest = join(installDir, 'php.ini');

  if (existsSync(iniDev) && !existsSync(iniDest)) {
    try {
      execSync(
        process.platform === 'win32'
          ? `copy "${iniDev}" "${iniDest}"`
          : `cp "${iniDev}" "${iniDest}"`,
        { stdio: 'pipe' }
      );
    } catch { /* non-critical */ }
  }
}

/**
 * Check Windows-specific dependencies (minimal — just need Node.js).
 */
export function checkWindowsDependencies() {
  const missing = [];

  try {
    execSync('powershell -Command "echo ok"', { stdio: 'pipe' });
  } catch {
    missing.push('PowerShell');
  }

  return missing;
}
