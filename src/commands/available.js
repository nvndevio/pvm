import chalk from 'chalk';
import { fetchVersionsForMajor } from '../core/resolver.js';
import { isInstalled, getCurrentVersion } from '../core/versions.js';
import { spinner, log } from '../utils/ui.js';

export function registerAvailableCommand(program) {
  program
    .command('available')
    .alias('avail')
    .description('List PHP versions available to install')
    .option('--major <version>', 'Filter by major version (5, 7, 8)', '8')
    .action(async (opts) => {
      const sp = spinner('Fetching available versions...');
      sp.start();

      try {
        const versions = await fetchVersionsForMajor(opts.major);
        sp.stop();
        sp.clear();

        if (versions.length === 0) {
          log.info(`No versions found for PHP ${opts.major}`);
          return;
        }

        const current = getCurrentVersion();
        const grouped = groupByMinor(versions);

        console.log();
        console.log(chalk.bold(`  PHP ${opts.major}.x available versions:`));
        console.log();

        for (const [minor, list] of grouped) {
          const formatted = list.map((v) => {
            if (v === current) return chalk.green.bold(v) + chalk.gray(' ← active');
            if (isInstalled(v)) return chalk.green(v) + chalk.gray(' (installed)');
            return chalk.white(v);
          });

          console.log(`  ${chalk.cyan.bold(minor)}`);
          const lines = chunk(formatted, 5);
          for (const line of lines) {
            console.log('    ' + line.join('  '));
          }
          console.log();
        }
      } catch (err) {
        sp.fail('Failed to fetch versions');
        log.error(err.message);
        process.exit(1);
      }
    });
}

function groupByMinor(versions) {
  const map = new Map();
  for (const v of versions) {
    const parts = v.split('.');
    const key = `${parts[0]}.${parts[1]}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(v);
  }
  return map;
}

function chunk(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
