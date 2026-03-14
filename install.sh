#!/usr/bin/env bash
# pvm installer
# Usage: curl -fsSL https://raw.githubusercontent.com/nvndevio/pvm/main/install.sh | bash

set -e

PVM_DIR="${PVM_DIR:-$HOME/.pvm}"
REPO="nvndevio/pvm"
BRANCH="main"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "  ${CYAN}ℹ${NC} $1"; }
success() { echo -e "  ${GREEN}✓${NC} $1"; }
warn()    { echo -e "  ${YELLOW}⚠${NC} $1"; }
error()   { echo -e "  ${RED}✗${NC} $1"; exit 1; }

echo ""
echo -e "${BOLD}  pvm installer${NC}"
echo -e "  PHP Version Manager"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  error "Node.js is required (>= 18). Install it from https://nodejs.org"
fi

NODE_MAJOR=$(node -e 'console.log(process.versions.node.split(".")[0])')
if [ "$NODE_MAJOR" -lt 18 ]; then
  error "Node.js >= 18 required. You have $(node -v)"
fi
success "Node.js $(node -v) detected"

# Check git
if ! command -v git &>/dev/null; then
  error "git is required. Install it first."
fi

# Clone or update
if [ -d "$PVM_DIR/.git" ]; then
  info "Updating existing installation..."
  cd "$PVM_DIR"
  git pull origin "$BRANCH" --quiet
  success "Updated to latest version"
else
  info "Installing to $PVM_DIR..."
  mkdir -p "$(dirname "$PVM_DIR")"
  git clone --depth 1 "https://github.com/$REPO.git" "$PVM_DIR" --quiet
  success "Downloaded pvm"
fi

# Install dependencies
cd "$PVM_DIR"
npm install --production --silent 2>/dev/null
success "Dependencies installed"

# Create wrapper binary
mkdir -p "$PVM_DIR/bin"
cat > "$PVM_DIR/bin/pvm" << 'WRAPPER'
#!/usr/bin/env bash
exec node "$(dirname "$0")/../bin/pvm.js" "$@"
WRAPPER
chmod +x "$PVM_DIR/bin/pvm"

# Copy shell integration
cp "$PVM_DIR/scripts/pvm.sh" "$PVM_DIR/pvm.sh"

success "pvm installed successfully!"

echo ""

# Detect shell config file
SHELL_NAME="$(basename "$SHELL")"
SHELL_RC=""
case "$SHELL_NAME" in
  zsh)  SHELL_RC="$HOME/.zshrc" ;;
  bash)
    if [ -f "$HOME/.bashrc" ]; then
      SHELL_RC="$HOME/.bashrc"
    else
      SHELL_RC="$HOME/.bash_profile"
    fi
    ;;
  fish) SHELL_RC="$HOME/.config/fish/config.fish" ;;
esac

PVM_INIT='export PVM_DIR="$HOME/.pvm"
[ -s "$PVM_DIR/pvm.sh" ] && source "$PVM_DIR/pvm.sh"'

# Check if already in shell config
if [ -n "$SHELL_RC" ] && ! grep -q 'PVM_DIR' "$SHELL_RC" 2>/dev/null; then
  echo "" >> "$SHELL_RC"
  echo '# pvm - PHP Version Manager' >> "$SHELL_RC"
  echo 'export PVM_DIR="$HOME/.pvm"' >> "$SHELL_RC"
  echo '[ -s "$PVM_DIR/pvm.sh" ] && source "$PVM_DIR/pvm.sh"' >> "$SHELL_RC"
  success "Added pvm to $SHELL_RC"
else
  if [ -n "$SHELL_RC" ]; then
    info "pvm already configured in $SHELL_RC"
  fi
fi

echo ""
echo -e "  ${BOLD}Done!${NC} Restart your terminal or run:"
echo ""
echo -e "    ${CYAN}source $SHELL_RC${NC}"
echo ""
echo -e "  Then try:"
echo ""
echo -e "    ${CYAN}pvm doctor${NC}        Check build dependencies"
echo -e "    ${CYAN}pvm available${NC}     See PHP versions"
echo -e "    ${CYAN}pvm install 8.3${NC}   Install PHP 8.3"
echo ""
