<#
.SYNOPSIS
    Scans React (.jsx, .tsx, .js) files for common Quick Start anti-patterns.
.DESCRIPTION
    Deterministically checks code for common React anti-patterns:
    - class="" instead of className=""
    - Immediate event handler invocation (e.g. onClick={handleClick()})
    - Using array index as key in map (e.g. key={index}, key={i})
    - Risky .length && <JSX> conditional rendering
.PARAMETER TargetPath
    The file or folder path to analyze (defaults to current directory).
.EXAMPLE
    .\verify-react-patterns.ps1 -TargetPath "./src"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, Position = 0)]
    [string]$TargetPath = "."
)

$ErrorActionPreference = 'Continue'
$issuesFound = 0

Write-Host "Analyzing React code patterns at: $TargetPath" -ForegroundColor Cyan

if (-not (Test-Path $TargetPath)) {
    Write-Error "Target path '$TargetPath' does not exist."
    exit 1
}

$files = @()
if ((Get-Item $TargetPath) -is [System.IO.DirectoryInfo]) {
    $files = Get-ChildItem -Path $TargetPath -Recurse -Include *.jsx, *.tsx, *.js |
        Where-Object { $_.FullName -notmatch '[\\/](node_modules|\.git|dist|build|\.next)[\\/]' }
} else {
    $files = @(Get-Item $TargetPath)
}

if ($files.Count -eq 0) {
    Write-Host "No React files (.jsx, .tsx, .js) found in $TargetPath." -ForegroundColor Yellow
    exit 0
}

foreach ($file in $files) {
    $lines = Get-Content -Path $file.FullName
    $lineNum = 0

    foreach ($line in $lines) {
        $lineNum++

        # Check 1: class= instead of className= in JSX
        if ($line -match '<[a-zA-Z0-9_.-]+\s+[^>]*\bclass="') {
            Write-Host "[WARNING] $($file.Name):$lineNum - Found 'class=' in JSX. In React, use 'className='." -ForegroundColor Yellow
            $issuesFound++
        }

        # Check 2: Immediate execution in event handler (e.g. onClick={fn()})
        if ($line -match 'on[A-Z][a-zA-Z]+\s*=\s*\{\s*([a-zA-Z0-9_]+)\(\s*\)\s*\}') {
            $handler = $matches[1]
            if ($handler -ne 'function' -and $handler -ne 'e' -and $handler -ne 'event') {
                Write-Host "[ERROR] $($file.Name):$lineNum - Event handler '$($matches[0])' executes immediately during render! Pass reference: onEvent={$handler} or wrap in arrow function: onEvent={() => $handler()}." -ForegroundColor Red
                $issuesFound++
            }
        }

        # Check 3: Using array index as key in .map()
        if ($line -match '\.map\s*\(\s*\([^)]*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>.*key=\{\s*\1\s*\}') {
            Write-Host "[WARNING] $($file.Name):$lineNum - Array index used as key. Use a stable unique ID instead (e.g., item.id)." -ForegroundColor Yellow
            $issuesFound++
        }

        # Check 4: Unsafe array length with logical &&
        if ($line -match '\.length\s*&&\s*<') {
            Write-Host "[WARNING] $($file.Name):$lineNum - Using '.length && <Element>' may render literal '0'. Use '.length > 0 && <Element>' instead." -ForegroundColor Yellow
            $issuesFound++
        }
    }
}

Write-Host "----------------------------------------"
if ($issuesFound -eq 0) {
    Write-Host "[PASS] No obvious Quick Start anti-patterns found in $($files.Count) file(s)!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[WARN] Completed scan: $issuesFound potential issue(s) detected across $($files.Count) file(s)." -ForegroundColor Yellow
    exit 0
}
