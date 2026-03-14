import chalk from 'chalk';
import { ensureDirs } from '../core/config.js';
import { resolveVersion } from '../core/resolver.js';
import { downloadSource } from '../core/downloader.js';
import { buildFromSource, checkDependencies, suggestInstall } from '../core/builder.js';
import { isInstalled, setCurrentVersion } from '../core/versions.js';
import { log, formatDuration } from '../utils/ui.js';

export function registerInstallCommand(program) {
  program
    .command('install <version>')
    .description('Install a PHP version (e.g. pvm install 8.3)')
    .option('--no-switch', 'Do not switch to this version after install')
    .action(async (versionInput, opts) => {
      const start = Date.now();

      try {
        ensureDirs();

        const missing = checkDependencies();
        if (missing.length > 0) {
          log.warn('Missing build dependencies:');
          suggestInstall(missing);
          log.blank();
          log.error('Please install the missing dependencies and try again.');
          process.exit(1);
        }

        const version = await resolveVersion(versionInput);

        if (isInstalled(version)) {
          log.info(`PHP ${version} is already installed`);
          if (opts.switch !== false) {
            setCurrentVersion(version);
            log.success(`Now using PHP ${version}`);
          }
          return;
        }

        log.blank();

        const tarball = await downloadSource(version);
        log.blank();

        const installDir = await buildFromSource(tarball, version);
        log.blank();

        if (opts.switch !== false) {
          setCurrentVersion(version);
        }

        const elapsed = formatDuration(Date.now() - start);
        log.success(`PHP ${version} installed successfully (${elapsed})`);
        log.plain(`Location: ${chalk.gray(installDir)}`);
        log.blank();

        if (opts.switch !== false) {
          log.info(`Now using PHP ${version}`);
        } else {
          log.info(`Run ${chalk.cyan(`pvm use ${version}`)} to activate.`);
        }
      } catch (err) {
        log.blank();
        log.error(err.message);
        process.exit(1);
      }
    });
}
