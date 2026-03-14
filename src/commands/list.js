import { listInstalled, getCurrentVersion } from '../core/versions.js';
import { formatVersion, log } from '../utils/ui.js';

export function registerListCommand(program) {
  program
    .command('list')
    .alias('ls')
    .description('List installed PHP versions')
    .action(() => {
      const installed = listInstalled();

      if (installed.length === 0) {
        log.info('No PHP versions installed.');
        log.plain('Run: pvm install <version>');
        return;
      }

      const current = getCurrentVersion();

      console.log();
      for (const version of installed) {
        console.log(formatVersion(version, version === current));
      }
      console.log();
    });
}
