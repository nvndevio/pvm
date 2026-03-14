# pvm — PHP Version Manager

Simple, fast PHP version management. Inspired by [nvm](https://github.com/nvm-sh/nvm).

```
pvm install 8.3
pvm use 8.3
pvm list
php -v  # PHP 8.3.x
```

## Install

### Option 1: Quick install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/nvndevio/pvm/main/install.sh | bash
```

This will clone pvm to `~/.pvm` and auto-configure your shell.

### Option 2: npm

```bash
npm install -g pvm-php
```

Then add to your `~/.zshrc` or `~/.bashrc`:

```bash
export PVM_DIR="$HOME/.pvm"
[ -s "$PVM_DIR/pvm.sh" ] && source "$PVM_DIR/pvm.sh"
```

### Option 3: Homebrew (macOS)

```bash
brew tap nvndevio/tap
brew install pvm
```

### Option 4: Manual

```bash
git clone https://github.com/nvndevio/pvm.git ~/.pvm
cd ~/.pvm && npm install
```

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export PVM_DIR="$HOME/.pvm"
[ -s "$PVM_DIR/pvm.sh" ] && source "$PVM_DIR/pvm.sh"
```

Then restart your terminal: `source ~/.zshrc`

## Build Requirements

PHP is compiled from source, so you need build tools:

**macOS** (via Homebrew):

```bash
xcode-select --install
brew install openssl readline libzip icu4c oniguruma pkg-config autoconf bison re2c
```

**Ubuntu/Debian**:

```bash
sudo apt install build-essential libxml2-dev libssl-dev libcurl4-openssl-dev \
  libzip-dev libonig-dev libreadline-dev libsqlite3-dev pkg-config autoconf bison re2c
```

Run `pvm doctor` to check if your system is ready.

## Usage

### Install a PHP version

```bash
pvm install 8.3       # Install latest PHP 8.3.x
pvm install 8.2.25    # Install exact version
```

### List installed versions

```bash
pvm list

#   8.1.27
#   8.2.25
# → 8.3.14 (active)
```

### Switch PHP version

```bash
pvm use 8.2
```

### Show current version

```bash
pvm current
# 8.3.14
```

### Uninstall a version

```bash
pvm uninstall 8.1.27
```

### See available versions

```bash
pvm available           # PHP 8.x versions
pvm available --major 7 # PHP 7.x versions
```

### Check build dependencies

```bash
pvm doctor
```

## Auto-switch per project

Create a `.php-version` file in your project root:

```
8.2
```

When you `cd` into the project, pvm automatically switches to the specified version.

## How it works

```
~/.pvm/
├── versions/
│   ├── 8.1.27/        # Each version built from source
│   ├── 8.2.25/
│   └── 8.3.14/
├── current -> versions/8.3.14    # Symlink to active version
├── cache/              # Downloaded source tarballs
├── bin/pvm             # CLI binary
└── pvm.sh              # Shell integration
```

1. `pvm install` downloads PHP source from php.net, configures, and builds it
2. `pvm use` creates a symlink at `~/.pvm/current` and updates your `PATH`
3. The shell integration auto-loads the active version on terminal start

## Commands

| Command | Description |
|---------|-------------|
| `pvm install <version>` | Download and build a PHP version |
| `pvm use <version>` | Switch to an installed version |
| `pvm list` | List installed versions |
| `pvm current` | Show active version |
| `pvm uninstall <version>` | Remove a version |
| `pvm available` | List versions available to install |
| `pvm doctor` | Check build dependencies |
| `pvm env` | Print shell integration code |

## License

MIT
