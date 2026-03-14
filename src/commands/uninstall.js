import chalk from 'chalk';
import { removeVersion, isInstalled, getCurrentVersion } from '../core/versions.js';
import { log } from '../utils/ui.js';

export function registerUninstallCommand(program) {
  program
    .command('uninstall <version>')
    .alias('rm')
    .description('Uninstall a PHP version')
    .action((version) => {
      try {
        if (!isInstalled(version)) {
          log.error(`PHP ${version} is not installed.`);
          process.exit(1);
        }

        const current = getCurrentVersion();
        const wasCurrent = current === version;

        removeVersion(version);
        log.success(`PHP ${version} uninstalled.`);

        if (wasCurrent) {
          log.warn('The active version was removed.');
          log.plain(`Run ${chalk.cyan('pvm use <version>')} to set a new active version.`);
        }
      } catch (err) {
        log.error(err.message);
        process.exit(1);
      }
    });
}
