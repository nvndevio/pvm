#!/usr/bin/env bash
# pvm - PHP Version Manager
# Shell integration script
#
# Add to your ~/.zshrc or ~/.bashrc:
#   export PVM_DIR="$HOME/.pvm"
#   [ -s "$PVM_DIR/pvm.sh" ] && source "$PVM_DIR/pvm.sh"

export PVM_DIR="${PVM_DIR:-$HOME/.pvm}"
PVM_BIN="${PVM_DIR}/bin/pvm"

if [ ! -f "$PVM_BIN" ]; then
  if command -v pvm &>/dev/null; then
    PVM_BIN="$(command -v pvm)"
  else
    echo "[pvm] Warning: pvm binary not found at $PVM_BIN" >&2
    return 2>/dev/null || exit
  fi
fi

pvm() {
  if [ "$1" = "use" ]; then
    shift
    local bin_path
    bin_path="$(command "$PVM_BIN" use "$@" --shell-output 2>/dev/null)"
    local exit_code=$?

    if [ $exit_code -eq 0 ] && [ -n "$bin_path" ] && [ -d "$bin_path" ]; then
      # Remove old pvm paths from PATH
      PATH="$(echo "$PATH" | tr ':' '\n' | grep -v "${PVM_DIR}/versions" | grep -v "${PVM_DIR}/current" | tr '\n' ':' | sed 's/:$//')"
      export PATH="${bin_path}:${PATH}"
      hash -r 2>/dev/null

      local php_version
      php_version="$("${bin_path}/php" -r 'echo PHP_VERSION;' 2>/dev/null)"
      echo "  ✓ Now using PHP ${php_version}"
    else
      # Fallback: run normally to show error messages
      command "$PVM_BIN" use "$@"
    fi
  else
    command "$PVM_BIN" "$@"
  fi
}

# Auto-load current version into PATH
if [ -d "${PVM_DIR}/current/bin" ]; then
  export PATH="${PVM_DIR}/current/bin:${PATH}"
fi

# Auto-switch PHP version when changing directories
__pvm_auto_switch() {
  if [ -f ".php-version" ]; then
    local wanted
    wanted="$(cat .php-version 2>/dev/null | tr -d '[:space:]')"
    local current
    current="$(command "$PVM_BIN" current 2>/dev/null)"

    if [ -n "$wanted" ] && [ "$wanted" != "$current" ]; then
      pvm use "$wanted"
    fi
  fi
}

# Hook into cd for auto-switch
if [ -n "$ZSH_VERSION" ]; then
  autoload -U add-zsh-hook
  add-zsh-hook chpwd __pvm_auto_switch
elif [ -n "$BASH_VERSION" ]; then
  __pvm_cd() { builtin cd "$@" && __pvm_auto_switch; }
  alias cd='__pvm_cd'
fi

# Run auto-switch for current directory on shell init
__pvm_auto_switch
