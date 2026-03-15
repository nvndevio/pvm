# pvm installer for Windows
# Usage: irm https://raw.githubusercontent.com/nvndevio/pvm/main/install.ps1 | iex

$ErrorActionPreference = "Stop"

$PVM_DIR = if ($env:PVM_DIR) { $env:PVM_DIR } else { "$env:USERPROFILE\.pvm" }
$REPO = "nvndevio/pvm"

Write-Host ""
Write-Host "  pvm installer" -ForegroundColor White
Write-Host "  PHP Version Manager for Windows"
Write-Host ""

# Check Node.js
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeExists) {
    Write-Host "  ✗ Node.js is required (>= 18). Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

$nodeVersion = (node -e "console.log(process.versions.node.split('.')[0])")
if ([int]$nodeVersion -lt 18) {
    Write-Host "  ✗ Node.js >= 18 required. You have $(node -v)" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Node.js $(node -v) detected" -ForegroundColor Green

# Check git
$gitExists = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitExists) {
    Write-Host "  ✗ git is required. Install from https://git-scm.com" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ git detected" -ForegroundColor Green

# Clone or update
if (Test-Path "$PVM_DIR\.git") {
    Write-Host "  ℹ Updating existing installation..." -ForegroundColor Cyan
    Push-Location $PVM_DIR
    git pull origin main --quiet
    Pop-Location
    Write-Host "  ✓ Updated" -ForegroundColor Green
} else {
    Write-Host "  ℹ Installing to $PVM_DIR..." -ForegroundColor Cyan
    git clone --depth 1 "https://github.com/$REPO.git" $PVM_DIR --quiet
    Write-Host "  ✓ Downloaded pvm" -ForegroundColor Green
}

# Install dependencies
Push-Location $PVM_DIR
npm install --production --silent 2>$null
Pop-Location
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# Create bin wrapper
$binDir = "$PVM_DIR\bin"
if (-not (Test-Path $binDir)) { New-Item -ItemType Directory -Path $binDir -Force | Out-Null }

@"
@echo off
node "%~dp0\..\bin\pvm.js" %*
"@ | Set-Content "$binDir\pvm.cmd" -Encoding ASCII

# Copy PowerShell integration
Copy-Item "$PVM_DIR\scripts\pvm.ps1" "$PVM_DIR\pvm.ps1" -Force

Write-Host "  ✓ pvm installed successfully!" -ForegroundColor Green
Write-Host ""

# Add to PowerShell profile
$profilePath = $PROFILE
$profileDir = Split-Path $profilePath
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}
if (-not (Test-Path $profilePath)) {
    New-Item -ItemType File -Path $profilePath -Force | Out-Null
}

$profileContent = Get-Content $profilePath -Raw -ErrorAction SilentlyContinue
if ($profileContent -notlike "*PVM_DIR*") {
    Add-Content $profilePath @"

# pvm - PHP Version Manager
`$env:PVM_DIR = "$PVM_DIR"
. "`$env:PVM_DIR\pvm.ps1"
"@
    Write-Host "  ✓ Added pvm to PowerShell profile" -ForegroundColor Green
} else {
    Write-Host "  ℹ pvm already in PowerShell profile" -ForegroundColor Cyan
}

# Add bin to user PATH
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($userPath -notlike "*$binDir*") {
    [Environment]::SetEnvironmentVariable("PATH", "$binDir;$userPath", "User")
    $env:PATH = "$binDir;$env:PATH"
    Write-Host "  ✓ Added pvm to system PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "  Done! Restart your terminal, then try:" -ForegroundColor White
Write-Host ""
Write-Host "    pvm doctor        " -NoNewline -ForegroundColor Cyan
Write-Host "Check system"
Write-Host "    pvm available     " -NoNewline -ForegroundColor Cyan
Write-Host "See PHP versions"
Write-Host "    pvm install 8.3   " -NoNewline -ForegroundColor Cyan
Write-Host "Install PHP 8.3"
Write-Host ""
