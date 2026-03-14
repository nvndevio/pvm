import chalk from 'chalk';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveVersion } from '../core/resolver.js';
import { isInstalled, setCurrentVersion, listInstalled } from '../core/versions.js';
import { versionBinDir } from '../core/config.js';
import { log } from '../utils/ui.js';

export function registerUseCommand(program) {
  program
    .command('use [version]')
    .description('Switch to a PHP version (e.g. pvm use 8.3)')
    .option('--shell-output', 'Print the version bin path (for shell integration)')
    .action(async (versionInput, opts) => {
      try {
        let targetVersion = versionInput;

        if (!targetVersion) {
          targetVersion = readProjectVersion();
          if (!targetVersion) {
            log.error('No version specified and no .php-version file found.');
            log.plain('Usage: pvm use <version>');
            process.exit(1);
          }
          if (!opts.shellOutput) {
            log.info(`Using version from .php-version: ${targetVersion}`);
          }
        }

        const installed = listInstalled();
        let version = findExactOrPartial(installed, targetVersion);

        if (!version) {
          version = await resolveVersion(targetVersion);
          if (!isInstalled(version)) {
            log.error(`PHP ${version} is not installed.`);
            log.plain(`Run: pvm install ${targetVersion}`);
            process.exit(1);
          }
        }

        const dir = setCurrentVersion(version);

        if (opts.shellOutput) {
          process.stdout.write(versionBinDir(version));
        } else {
          log.success(`Now using PHP ${version}`);
          log.plain(`Binary: ${chalk.gray(join(dir, 'bin', 'php'))}`);
        }
      } catch (err) {
        if (!opts || !opts.shellOutput) {
          log.error(err.message);
        }
        process.exit(1);
      }
    });
}

function findExactOrPartial(installed, input) {
  const exact = installed.find((v) => v === input);
  if (exact) return exact;

  const matches = installed
    .filter((v) => v.startsWith(input + '.') || v.startsWith(input))
    .sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < 3; i++) {
        if ((pa[i] || 0) !== (pb[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
      }
      return 0;
    });

  return matches[0] || null;
}

function readProjectVersion() {
  const filePath = join(process.cwd(), '.php-version');
  if (existsSync(filePath)) {
    return readFileSync(filePath, 'utf8').trim();
  }
  return null;
}
