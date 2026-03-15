# pvm — PHP Version Manager

Simple, fast PHP version management. Inspired by [nvm](https://github.com/nvm-sh/nvm).

**Cross-platform:** macOS, Linux, and Windows.

```
pvm install 8.3
pvm use 8.3
pvm list
php -v  # PHP 8.3.x
```

## Install

### macOS / Linux

**Quick install (recommended):**

```bash
curl -fsSL https://raw.githubusercontent.com/nvndevio/pvm/main/install.sh | bash
```

**Or via npm:**

```bash
npm install -g pvm-php
```

Then add to your `~/.zshrc` or `~/.bashrc`:

```bash
export PVM_DIR="$HOME/.pvm"
[ -s "$PVM_DIR/pvm.sh" ] && source "$PVM_DIR/pvm.sh"
```

### Windows

**Quick install (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/nvndevio/pvm/main/install.ps1 | iex
```

**Or via npm:**

```powershell
npm install -g pvm-php
```

Then add to your PowerShell profile (`$PROFILE`):

```powershell
$env:PVM_DIR = "$env:USERPROFILE\.pvm"
. "$env:PVM_DIR\pvm.ps1"
```

### Manual (all platforms)

```bash
git clone https://github.com/nvndevio/pvm.git ~/.pvm
cd ~/.pvm && npm install
```

## Platform Differences

| | macOS / Linux | Windows |
|---|---|---|
| Install method | Build from source | Pre-built binaries from windows.php.net |
| Install speed | 5-15 min (compiling) | ~30 sec (download only) |
| Build tools required | Yes (gcc, make, etc.) | No |
| Shell integration | bash / zsh / fish | PowerShell / CMD |

## Build Requirements (macOS / Linux only)

Windows users can skip this — pvm downloads pre-built binaries automatically.

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

### Check system dependencies

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
│   ├── 8.1.27/
│   ├── 8.2.25/
│   └── 8.3.14/
├── current             # Symlink (Unix) or version file (Windows)
├── cache/              # Downloaded tarballs / zips
├── bin/pvm             # CLI binary
└── pvm.sh              # Shell integration
```

- **macOS/Linux:** Downloads PHP source, compiles with common extensions, installs to `~/.pvm/versions/`
- **Windows:** Downloads pre-built NTS binary from windows.php.net, extracts to `~/.pvm/versions/`
- `pvm use` updates the active version and your shell `PATH`

## Commands

| Command | Description |
|---------|-------------|
| `pvm install <version>` | Install a PHP version |
| `pvm use <version>` | Switch to an installed version |
| `pvm list` | List installed versions |
| `pvm current` | Show active version |
| `pvm uninstall <version>` | Remove a version |
| `pvm available` | List versions available to install |
| `pvm doctor` | Check system dependencies |
| `pvm env` | Print shell integration code |

## License

MIT
