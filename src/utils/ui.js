import chalk from 'chalk';
import ora from 'ora';

export const log = {
  success: (msg) => console.log(chalk.green('  ✓ ') + msg),
  error: (msg) => console.log(chalk.red('  ✗ ') + msg),
  info: (msg) => console.log(chalk.blue('  ℹ ') + msg),
  warn: (msg) => console.log(chalk.yellow('  ⚠ ') + msg),
  plain: (msg) => console.log('    ' + msg),
  blank: () => console.log(),
};

export function spinner(text) {
  return ora({ text: '  ' + text, indent: 0 });
}

export function formatVersion(version, isActive) {
  if (isActive) {
    return chalk.green('→ ' + version) + chalk.gray(' (active)');
  }
  return '  ' + version;
}

export function header(text) {
  console.log();
  console.log(chalk.bold(text));
  console.log();
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function formatDuration(ms) {
  if (ms < 1000) return ms + 'ms';
  if (ms < 60_000) return (ms / 1000).toFixed(1) + 's';
  const min = Math.floor(ms / 60_000);
  const sec = Math.round((ms % 60_000) / 1000);
  return `${min}m ${sec}s`;
}
