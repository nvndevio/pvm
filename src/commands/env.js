import { paths } from '../core/config.js';

export function registerEnvCommand(program) {
  program
    .command('env')
    .description('Print shell integration code (add to your .zshrc/.bashrc)')
    .option('--shell <type>', 'Shell type: bash, zsh, fish', detectShell())
    .action((opts) => {
      const shellType = opts.shell || 'zsh';

      switch (shellType) {
        case 'fish':
          printFishInit();
          break;
        default:
          printBashZshInit();
          break;
      }
    });
}

function detectShell() {
  const shell = process.env.SHELL || '';
  if (shell.includes('fish')) return 'fish';
  if (shell.includes('zsh')) return 'zsh';
  return 'bash';
}

function printBashZshInit() {
  console.log(`
export PVM_DIR="${paths.root}"

pvm() {
  if [ "\$1" = "use" ]; then
    shift
    local bin_path
    bin_path="\$(command "${paths.bin}/pvm" use "\$@" --shell-output 2>&1)"
    local exit_code=\$?
    if [ \$exit_code -eq 0 ] && [ -n "\$bin_path" ]; then
      PATH="\$(echo "\$PATH" | tr ':' '\\n' | grep -v "\${PVM_DIR}/versions" | grep -v "\${PVM_DIR}/current" | tr '\\n' ':' | sed 's/:$//')"
      export PATH="\${bin_path}:\${PATH}"
      hash -r 2>/dev/null
      echo "  ✓ Now using PHP \$(command "\${bin_path}/php" -r 'echo PHP_VERSION;' 2>/dev/null)"
    else
      command "${paths.bin}/pvm" use "\$@"
    fi
  else
    command "${paths.bin}/pvm" "\$@"
  fi
}

# Auto-load current version
if [ -d "\${PVM_DIR}/current/bin" ]; then
  export PATH="\${PVM_DIR}/current/bin:\${PATH}"
fi

# Auto-switch on directory change
__pvm_auto_switch() {
  if [ -f ".php-version" ]; then
    local wanted=\$(cat .php-version 2>/dev/null)
    local current=\$(command "${paths.bin}/pvm" current 2>/dev/null)
    if [ -n "\$wanted" ] && [ "\$wanted" != "\$current" ]; then
      pvm use "\$wanted"
    fi
  fi
}

if [ -n "\$ZSH_VERSION" ]; then
  autoload -U add-zsh-hook
  add-zsh-hook chpwd __pvm_auto_switch
elif [ -n "\$BASH_VERSION" ]; then
  __pvm_original_cd() { builtin cd "\$@" && __pvm_auto_switch; }
  alias cd='__pvm_original_cd'
fi

__pvm_auto_switch
`.trim());
}

function printFishInit() {
  console.log(`
set -gx PVM_DIR "${paths.root}"

function pvm
  if test "\$argv[1]" = "use"
    set -l args \$argv[2..-1]
    set -l bin_path (command ${paths.bin}/pvm use \$args --shell-output 2>&1)
    if test \$status -eq 0; and test -n "\$bin_path"
      set -l new_path
      for p in \$PATH
        if not string match -q "*\$PVM_DIR/versions*" \$p; and not string match -q "*\$PVM_DIR/current*" \$p
          set new_path \$new_path \$p
        end
      end
      set -gx PATH \$bin_path \$new_path
    else
      command ${paths.bin}/pvm use \$args
    end
  else
    command ${paths.bin}/pvm \$argv
  end
end

if test -d "\$PVM_DIR/current/bin"
  fish_add_path --prepend "\$PVM_DIR/current/bin"
end
`.trim());
}
