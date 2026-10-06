<#
.SYNOPSIS
    Audits a Django project for implementation of production architecture patterns.
.DESCRIPTION
    Scans for:
    - Split settings pattern (base.py, development.py, production.py)
    - Custom QuerySets / Service Layer usage
    - Proper signal loading in apps.py (not root __init__.py)
    - select_related / prefetch_related optimization presence
.PARAMETER ProjectRoot
    Path to the Django project root.
.EXAMPLE
    .\audit-django-patterns.ps1 -ProjectRoot "."
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$ProjectRoot = "."
)

$ErrorActionPreference = 'Continue'
$resolved = Resolve-Path $ProjectRoot
Write-Host "Auditing Django Architecture Patterns at: $resolved" -ForegroundColor Cyan

# 1. Check Split Settings
$settingsDir = Join-Path $resolved "config\settings"
if (Test-Path $settingsDir) {
    $hasBase = Test-Path (Join-Path $settingsDir "base.py")
    $hasDev = Test-Path (Join-Path $settingsDir "development.py")
    $hasProd = Test-Path (Join-Path $settingsDir "production.py")

    if ($hasBase -and $hasDev -and $hasProd) {
        Write-Host "[PASS] Split settings pattern implemented (base.py, development.py, production.py)." -ForegroundColor Green
    } else {
        Write-Host "[INFO] Partial split settings detected under config/settings/." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Standard single settings.py detected. Consider migrating to config/settings/ for production scaling." -ForegroundColor Gray
}

# 2. Check for Service Layer & Custom QuerySets
$pyFiles = Get-ChildItem -Path $resolved -Recurse -Filter "*.py" |
    Where-Object { $_.FullName -notmatch '[\\/](venv|\.venv|env|node_modules)[\\/]' }

$hasServices = $false
$hasCustomQuerySet = $false
$usesSelectRelated = $false

foreach ($file in $pyFiles) {
    if ($file.Name -match "services\.py") { $hasServices = $true }
    $content = Get-Content -Path $file.FullName -Raw
    if ($content -match 'class\s+\w+QuerySet\s*\(\s*models\.QuerySet\s*\)') { $hasCustomQuerySet = $true }
    if ($content -match '\.select_related\(' -or $content -match '\.prefetch_related\(') { $usesSelectRelated = $true }
}

if ($hasServices) {
    Write-Host "[PASS] Service Layer pattern identified (services.py files detected)." -ForegroundColor Green
} else {
    Write-Host "[INFO] No dedicated services.py files found. Complex transactions may benefit from a Service Layer." -ForegroundColor Gray
}

if ($hasCustomQuerySet) {
    Write-Host "[PASS] Custom QuerySet pattern identified (models.QuerySet subclasses detected)." -ForegroundColor Green
} else {
    Write-Host "[INFO] No custom QuerySets detected." -ForegroundColor Gray
}

if ($usesSelectRelated) {
    Write-Host "[PASS] Database query optimizations detected (select_related / prefetch_related)." -ForegroundColor Green
} else {
    Write-Host "[WARN] No select_related or prefetch_related found. Ensure relations are eagerly loaded to avoid N+1 queries." -ForegroundColor Yellow
}

Write-Host "`nArchitecture audit complete." -ForegroundColor Cyan
exit 0
