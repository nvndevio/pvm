import { Command } from 'commander';
import chalk from 'chalk';
import { registerInstallCommand } from './commands/install.js';
import { registerListCommand } from './commands/list.js';
import { registerUseCommand } from './commands/use.js';
import { registerUninstallCommand } from './commands/uninstall.js';
import { registerCurrentCommand } from './commands/current.js';
import { registerAvailableCommand } from './commands/available.js';
import { registerDoctorCommand } from './commands/doctor.js';
import { registerEnvCommand } from './commands/env.js';

export function createCLI() {
  const program = new Command();

  program
    .name('pvm')
    .description(chalk.bold('PHP Version Manager') + ' — Simple, fast PHP version management')
    .version('0.1.0')
    .configureHelp({
      sortSubcommands: true,
    });

  registerInstallCommand(program);
  registerListCommand(program);
  registerUseCommand(program);
  registerUninstallCommand(program);
  registerCurrentCommand(program);
  registerAvailableCommand(program);
  registerDoctorCommand(program);
  registerEnvCommand(program);

  program.on('command:*', () => {
    console.error(`Unknown command: ${program.args.join(' ')}`);
    console.error(`Run ${chalk.cyan('pvm --help')} to see available commands.`);
    process.exit(1);
  });

  return program;
}
