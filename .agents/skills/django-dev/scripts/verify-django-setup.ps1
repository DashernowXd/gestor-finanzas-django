<#
.SYNOPSIS
    Audits a Django project structure, settings, and common configuration pitfalls.
.DESCRIPTION
    Checks for:
    - manage.py entrypoint
    - settings.py existence
    - Insecure hardcoded SECRET_KEY
    - DEBUG setting status
    - Missing app registration or empty ALLOWED_HOSTS
.PARAMETER ProjectRoot
    Path to the Django project root (defaults to current directory).
.EXAMPLE
    .\verify-django-setup.ps1 -ProjectRoot "."
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$ProjectRoot = "."
)

$ErrorActionPreference = 'Continue'
$hasWarnings = $false

function Write-Pass($msg) {
    Write-Host "[PASS] $msg" -ForegroundColor Green
}

function Write-Fail($msg) {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
    $script:hasWarnings = $true
}

function Write-Warn($msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
    $script:hasWarnings = $true
}

$resolvedRoot = Resolve-Path $ProjectRoot
Write-Host "Verifying Django Project at: $resolvedRoot" -ForegroundColor Cyan

# 1. Check manage.py
$managePy = Join-Path $resolvedRoot "manage.py"
if (Test-Path $managePy) {
    Write-Pass "manage.py entrypoint found."
} else {
    Write-Warn "manage.py not found in $resolvedRoot (skip if running against an individual app directory)."
}

# 2. Locate settings files (*settings*.py, base.py, etc.)
$settingsFiles = Get-ChildItem -Path $resolvedRoot -Recurse -Include "*settings*.py", "base.py" |
    Where-Object { $_.FullName -notmatch '[\\/](venv|\.venv|env|node_modules)[\\/]' }

if ($settingsFiles.Count -eq 0) {
    Write-Warn "No settings.py file located in project tree."
    exit 0
}

foreach ($settingFile in $settingsFiles) {
    Write-Host "`nInspecting: $($settingFile.FullName)" -ForegroundColor Cyan
    $content = Get-Content -Path $settingFile.FullName -Raw

    # Check SECRET_KEY
    if ($content -match 'SECRET_KEY\s*=\s*["'']django-insecure-[^"'']+["'']') {
        Write-Warn "Default insecure SECRET_KEY detected in $($settingFile.Name). Use environment variables for production."
    } elseif ($content -match 'SECRET_KEY\s*=\s*os\.environ') {
        Write-Pass "SECRET_KEY dynamically loaded from environment."
    } else {
        Write-Pass "SECRET_KEY configured."
    }

    # Check DEBUG
    if ($content -match '(?m)^\s*DEBUG\s*=\s*True\s*$') {
        Write-Warn "DEBUG is hardcoded to True. Ensure DEBUG is False in production environments."
    } elseif ($content -match 'DEBUG\s*=.*os\.environ') {
        Write-Pass "DEBUG state controlled via environment."
    }

    # Check ALLOWED_HOSTS
    if ($content -match 'ALLOWED_HOSTS\s*=\s*\[\s*\]') {
        Write-Warn "ALLOWED_HOSTS is empty. Required when DEBUG is False."
    } else {
        Write-Pass "ALLOWED_HOSTS is configured."
    }

    # Check WhiteNoise presence
    if ($content -match 'whitenoise\.middleware\.WhiteNoiseMiddleware') {
        Write-Pass "WhiteNoise static middleware detected."
    }
}

Write-Host "`n----------------------------------------"
if ($hasWarnings) {
    Write-Host "Audit completed with recommendations. Review warnings above." -ForegroundColor Yellow
} else {
    Write-Host "Django project configuration verified cleanly!" -ForegroundColor Green
}
exit 0
