# pvm - PHP Version Manager (PowerShell integration)
#
# Add to your PowerShell profile ($PROFILE):
#   . "$env:USERPROFILE\.pvm\pvm.ps1"

$env:PVM_DIR = if ($env:PVM_DIR) { $env:PVM_DIR } else { "$env:USERPROFILE\.pvm" }
$PVM_BIN = "$env:PVM_DIR\bin\pvm.cmd"

function pvm {
    if ($args[0] -eq "use") {
        $useArgs = $args[1..($args.Length - 1)]
        $binPath = & node "$env:PVM_DIR\bin\pvm.js" use @useArgs --shell-output 2>$null
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0 -and $binPath -and (Test-Path $binPath)) {
            # Remove old pvm paths from PATH
            $paths = $env:PATH -split ';' | Where-Object {
                $_ -notlike "*$env:PVM_DIR\versions*" -and $_ -notlike "*$env:PVM_DIR\current*"
            }
            $env:PATH = ($binPath + ';' + ($paths -join ';'))

            $phpVersion = & "$binPath\php.exe" -r "echo PHP_VERSION;" 2>$null
            Write-Host "  ✓ Now using PHP $phpVersion" -ForegroundColor Green
        } else {
            & node "$env:PVM_DIR\bin\pvm.js" use @useArgs
        }
    } else {
        & node "$env:PVM_DIR\bin\pvm.js" @args
    }
}

# Auto-load current version into PATH
$currentFile = "$env:PVM_DIR\current"
if (Test-Path $currentFile) {
    $currentVersion = (Get-Content $currentFile -Raw).Trim()
    $currentBin = "$env:PVM_DIR\versions\$currentVersion"
    if (Test-Path "$currentBin\php.exe") {
        $env:PATH = "$currentBin;$env:PATH"
    }
}

# Auto-switch when changing directories
function __pvm_auto_switch {
    $phpVersionFile = Join-Path (Get-Location) ".php-version"
    if (Test-Path $phpVersionFile) {
        $wanted = (Get-Content $phpVersionFile -Raw).Trim()
        $current = & node "$env:PVM_DIR\bin\pvm.js" current 2>$null
        if ($wanted -and $wanted -ne $current) {
            pvm use $wanted
        }
    }
}

# Hook into prompt for auto-switch
$__pvmOriginalPrompt = $function:prompt
function prompt {
    __pvm_auto_switch
    & $__pvmOriginalPrompt
}
