import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, cpus, platform } from 'node:os';
import { paths } from './config.js';
import { spinner, formatDuration, log } from '../utils/ui.js';

/**
 * Extract, configure, build, and install PHP from source tarball.
 */
export async function buildFromSource(tarballPath, version) {
  const installPrefix = join(paths.versions, version);

  if (existsSync(join(installPrefix, 'bin', 'php'))) {
    log.info(`PHP ${version} is already installed`);
    return installPrefix;
  }

  const buildDir = join(tmpdir(), `pvm-build-${version}-${Date.now()}`);
  mkdirSync(buildDir, { recursive: true });

  try {
    await extract(tarballPath, buildDir);
    const srcDir = findSourceDir(buildDir, version);
    await configure(srcDir, installPrefix);
    await make(srcDir);
    await makeInstall(srcDir);
  } finally {
    try {
      execSync(`rm -rf "${buildDir}"`, { stdio: 'ignore' });
    } catch { /* cleanup best-effort */ }
  }

  return installPrefix;
}

async function extract(tarball, dest) {
  const sp = spinner('Extracting source...');
  sp.start();
  try {
    execSync(`tar -xzf "${tarball}" -C "${dest}"`, { stdio: 'pipe' });
    sp.succeed('Extracted source');
  } catch (err) {
    sp.fail('Failed to extract source');
    throw err;
  }
}

function findSourceDir(buildDir, version) {
  const entries = readdirSync(buildDir);
  const dir = entries.find(e => e.startsWith('php-'));
  if (!dir) {
    throw new Error(`Source directory not found in extracted archive`);
  }
  return join(buildDir, dir);
}

function getConfigureFlags(prefix) {
  const flags = [
    `--prefix=${prefix}`,
    '--enable-bcmath',
    '--enable-mbstring',
    '--enable-opcache',
    '--enable-pcntl',
    '--enable-sockets',
    '--enable-soap',
    '--enable-intl',
    '--enable-fpm',
    '--with-curl',
    '--with-zlib',
    '--with-pdo-mysql',
    '--with-pdo-sqlite',
    '--with-sqlite3',
    '--with-readline',
    '--with-zip',
    '--with-openssl',
  ];

  if (platform() === 'darwin') {
    try {
      const opensslPrefix = tryExec(`brew --prefix openssl@3`) || tryExec(`brew --prefix openssl`);
      const readlinePrefix = tryExec(`brew --prefix readline`);
      const libzipPrefix = tryExec(`brew --prefix libzip`);
      const icuPrefix = tryExec(`brew --prefix icu4c`);
      const onigurumaPrefix = tryExec(`brew --prefix oniguruma`);
      const bzip2Prefix = tryExec(`brew --prefix bzip2`);
      const libxml2Prefix = tryExec(`brew --prefix libxml2`);

      const replacements = new Map();

      if (opensslPrefix) {
        replacements.set('--with-openssl', `--with-openssl=${opensslPrefix}`);
      }
      if (readlinePrefix) {
        replacements.set('--with-readline', `--with-readline=${readlinePrefix}`);
      }
      if (libzipPrefix) {
        replacements.set('--with-zip', `--with-zip=${libzipPrefix}`);
      }
      if (bzip2Prefix) {
        flags.push(`--with-bz2=${bzip2Prefix}`);
      }

      for (const [old, replacement] of replacements) {
        const idx = flags.indexOf(old);
        if (idx !== -1) flags[idx] = replacement;
      }

      const extraPkgPaths = [opensslPrefix, icuPrefix, onigurumaPrefix, libzipPrefix, libxml2Prefix]
        .filter(Boolean)
        .map(p => `${p}/lib/pkgconfig`);

      if (extraPkgPaths.length > 0) {
        const existing = process.env.PKG_CONFIG_PATH || '';
        process.env.PKG_CONFIG_PATH = [...extraPkgPaths, existing].filter(Boolean).join(':');
      }
    } catch {
      // Homebrew not available, try with defaults
    }
  }

  return flags;
}

async function configure(srcDir, prefix) {
  const sp = spinner('Configuring... (this may take a minute)');
  sp.start();
  const start = Date.now();

  const flags = getConfigureFlags(prefix);

  try {
    await runCommand('./configure', flags, srcDir);
    sp.succeed(`Configured (${formatDuration(Date.now() - start)})`);
  } catch (err) {
    sp.fail('Configure failed');
    log.error('Run with --verbose to see full output');
    throw err;
  }
}

async function make(srcDir) {
  const jobs = Math.max(1, cpus().length - 1);
  const sp = spinner(`Building with ${jobs} jobs... (this may take 5-15 minutes)`);
  sp.start();
  const start = Date.now();

  try {
    await runCommand('make', [`-j${jobs}`], srcDir);
    sp.succeed(`Built (${formatDuration(Date.now() - start)})`);
  } catch (err) {
    sp.fail('Build failed');
    throw err;
  }
}

async function makeInstall(srcDir) {
  const sp = spinner('Installing...');
  sp.start();

  try {
    await runCommand('make', ['install'], srcDir);
    sp.succeed('Installed');
  } catch (err) {
    sp.fail('Installation failed');
    throw err;
  }
}

function runCommand(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const err = new Error(`Command failed: ${cmd} ${args.join(' ')}\n${stderr.slice(-2000)}`);
        err.exitCode = code;
        reject(err);
      }
    });

    proc.on('error', reject);
  });
}

function tryExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
}

/**
 * Check for required build dependencies and return missing ones.
 */
export function checkDependencies() {
  const required = ['gcc', 'make', 'tar'];
  const missing = [];

  for (const cmd of required) {
    try {
      execSync(`which ${cmd}`, { stdio: 'pipe' });
    } catch {
      missing.push(cmd);
    }
  }

  if (platform() === 'darwin') {
    try {
      execSync('which brew', { stdio: 'pipe' });
    } catch {
      missing.push('brew (Homebrew)');
    }

    const brewDeps = ['openssl', 'readline', 'libzip', 'icu4c', 'oniguruma', 'pkg-config', 'autoconf', 'bison', 're2c'];
    for (const dep of brewDeps) {
      try {
        execSync(`brew --prefix ${dep}`, { stdio: 'pipe' });
      } catch {
        missing.push(dep);
      }
    }
  }

  return missing;
}

export function suggestInstall(missing) {
  if (platform() === 'darwin') {
    const brewPkgs = missing.filter(m => !['gcc', 'make', 'tar', 'brew (Homebrew)'].includes(m));
    if (missing.includes('brew (Homebrew)')) {
      log.warn('Install Homebrew first: https://brew.sh');
    }
    if (brewPkgs.length > 0) {
      log.info(`Install missing dependencies:\n      brew install ${brewPkgs.join(' ')}`);
    }
    if (missing.includes('gcc') || missing.includes('make')) {
      log.info('Install Xcode CLI tools: xcode-select --install');
    }
  } else {
    log.info('Install build dependencies:');
    log.plain('Ubuntu/Debian: sudo apt install build-essential libxml2-dev libssl-dev libcurl4-openssl-dev libzip-dev libonig-dev libreadline-dev libsqlite3-dev pkg-config');
    log.plain('Fedora: sudo dnf install gcc make libxml2-devel openssl-devel libcurl-devel libzip-devel oniguruma-devel readline-devel sqlite-devel');
  }
}
