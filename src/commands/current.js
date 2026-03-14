import { getCurrentVersion } from '../core/versions.js';
import { log } from '../utils/ui.js';

export function registerCurrentCommand(program) {
  program
    .command('current')
    .description('Show the currently active PHP version')
    .action(() => {
      const version = getCurrentVersion();

      if (!version) {
        log.info('No active PHP version.');
        log.plain('Run: pvm use <version>');
        return;
      }

      console.log(version);
    });
}
