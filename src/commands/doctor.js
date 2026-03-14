import chalk from 'chalk';
import { execSync } from 'node:child_process';
import { platform } from 'node:os';
import { existsSync } from 'node:fs';
import { paths } from '../core/config.js';
import { log } from '../utils/ui.js';

export function registerDoctorCommand(program) {
  program
    .command('doctor')
    .description('Check system for build dependencies')
    .action(() => {
      console.log();
      console.log(chalk.bold('  pvm doctor'));
      console.log();

      let allGood = true;

      allGood = checkCommand('node', 'Node.js') && allGood;
      allGood = checkCommand('gcc', 'C Compiler (gcc)') && allGood;
      allGood = checkCommand('make', 'Make') && allGood;
      allGood = checkCommand('tar', 'Tar') && allGood;
      allGood = checkCommand('pkg-config', 'pkg-config') && allGood;
      allGood = checkCommand('autoconf', 'autoconf') && allGood;
      allGood = checkCommand('bison', 'Bison') && allGood;
      allGood = checkCommand('re2c', 're2c') && allGood;

      console.log();

      if (platform() === 'darwin') {
        console.log(chalk.bold('  Homebrew libraries:'));
        console.log();
        allGood = checkBrewPackage('openssl') && allGood;
        allGood = checkBrewPackage('readline') && allGood;
        allGood = checkBrewPackage('libzip') && allGood;
        allGood = checkBrewPackage('icu4c') && allGood;
        allGood = checkBrewPackage('oniguruma') && allGood;
        allGood = checkBrewPackage('libxml2') && allGood;
        allGood = checkBrewPackage('curl') && allGood;
        allGood = checkBrewPackage('zlib') && allGood;
        console.log();
      }

      console.log(chalk.bold('  pvm directories:'));
      console.log();
      checkDir(paths.root, 'PVM_DIR');
      checkDir(paths.versions, 'versions');
      checkDir(paths.cache, 'cache');
      console.log();

      if (allGood) {
        log.success('All dependencies are satisfied. Ready to build PHP!');
      } else {
        log.warn('Some dependencies are missing.');
        console.log();
        if (platform() === 'darwin') {
          log.info('Install missing dependencies with Homebrew:');
          log.plain('brew install openssl readline libzip icu4c oniguruma pkg-config autoconf bison re2c');
        } else {
          log.info('Install missing dependencies:');
          log.plain('sudo apt install build-essential libxml2-dev libssl-dev libcurl4-openssl-dev libzip-dev libonig-dev libreadline-dev libsqlite3-dev pkg-config autoconf bison re2c');
        }
      }
      console.log();
    });
}

function checkCommand(cmd, label) {
  try {
    const path = execSync(`which ${cmd}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    console.log(`  ${chalk.green('✓')} ${label.padEnd(22)} ${chalk.gray(path)}`);
    return true;
  } catch {
    console.log(`  ${chalk.red('✗')} ${label.padEnd(22)} ${chalk.red('not found')}`);
    return false;
  }
}

function checkBrewPackage(name) {
  try {
    const prefix = execSync(`brew --prefix ${name}`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    if (existsSync(prefix)) {
      console.log(`  ${chalk.green('✓')} ${name.padEnd(22)} ${chalk.gray(prefix)}`);
      return true;
    }
    console.log(`  ${chalk.red('✗')} ${name.padEnd(22)} ${chalk.red('not installed')}`);
    return false;
  } catch {
    console.log(`  ${chalk.red('✗')} ${name.padEnd(22)} ${chalk.red('not installed')}`);
    return false;
  }
}

function checkDir(dir, label) {
  if (existsSync(dir)) {
    console.log(`  ${chalk.green('✓')} ${label.padEnd(22)} ${chalk.gray(dir)}`);
  } else {
    console.log(`  ${chalk.yellow('○')} ${label.padEnd(22)} ${chalk.yellow('will be created')}`);
  }
}
