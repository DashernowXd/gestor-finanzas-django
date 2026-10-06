<#
.SYNOPSIS
    Validates that an Antigravity Agent Skill conforms to the official specification.
.DESCRIPTION
    Checks frontmatter YAML syntax, mandatory fields ('name', 'description'),
    kebab-case naming, directory match, and existence of referenced files.
.PARAMETER SkillPath
    Path to the skill directory to validate.
.EXAMPLE
    .\validate-skill.ps1 -SkillPath ".agents/skills/stitch-design-taste"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$SkillPath
)

$ErrorActionPreference = 'Continue'
$hasErrors = $false

function Write-Pass($msg) {
    Write-Host "[PASS] $msg" -ForegroundColor Green
}

function Write-Fail($msg) {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
    $script:hasErrors = $true
}

function Write-Warn($msg) {
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

if (-not (Test-Path $SkillPath)) {
    Write-Fail "Directory does not exist: $SkillPath"
    exit 1
}

$resolvedDir = Resolve-Path $SkillPath
$dirName = Split-Path $resolvedDir -Leaf
Write-Host "Validating Skill: $dirName at $resolvedDir" -ForegroundColor Cyan

# 1. Check directory naming format
if ($dirName -match '^[a-z0-9]+(-[a-z0-9]+)*$') {
    Write-Pass "Directory name is valid kebab-case: '$dirName'"
} else {
    Write-Fail "Directory name '$dirName' is not valid kebab-case (must be lowercase alphanumeric separated by hyphens)."
}

# 2. Check SKILL.md existence
$skillMdPath = Join-Path $resolvedDir "SKILL.md"
if (-not (Test-Path $skillMdPath)) {
    Write-Fail "Missing required entrypoint file: SKILL.md"
    exit 1
} else {
    Write-Pass "Entrypoint SKILL.md exists."
}

# 3. Read and parse SKILL.md frontmatter
$content = Get-Content -Path $skillMdPath -Raw -Encoding UTF8

if ($content -notmatch '(?s)^---\r?\n(.*?)\r?\n---\r?\n(.*)$') {
    Write-Fail "SKILL.md does not contain valid YAML frontmatter delimiters ('---' at start of file)."
} else {
    Write-Pass "Valid YAML frontmatter delimiters detected."
    $frontmatter = $matches[1]
    $body = $matches[2]

    # Check name field
    if ($frontmatter -match '(?m)^name:\s*(.+)$') {
        $extractedName = $matches[1].Trim().Trim('"').Trim("'")
        if ($extractedName -eq $dirName) {
            Write-Pass "Frontmatter 'name' ($extractedName) matches directory name."
        } else {
            Write-Fail "Frontmatter 'name' ($extractedName) does NOT match directory name ($dirName)."
        }
    } else {
        Write-Fail "Frontmatter missing mandatory field: 'name'."
    }

    # Check description field
    if ($frontmatter -match '(?ms)description:\s*(?:>-\s*)?(.+?)(?=\n[a-z0-9_-]+:|\Z)') {
        $desc = $matches[1].Trim()
        if ([string]::IsNullOrWhiteSpace($desc)) {
            Write-Fail "Frontmatter 'description' is empty."
        } else {
            Write-Pass "Frontmatter 'description' present ($($desc.Length) chars)."
            if ($desc -notmatch '^(Use this skill|Provides|Implements|Manages|A skill to|Runs|Automates|Generates)') {
                Write-Warn "Recommendation: Start description with third-person imperative, e.g. 'Use this skill when...' for optimal model trigger accuracy."
            }
        }
    } else {
        Write-Fail "Frontmatter missing mandatory field: 'description'."
    }
}

# 4. Check recommended subdirectories
$subdirs = @("scripts", "resources", "references", "examples")
foreach ($sub in $subdirs) {
    $subPath = Join-Path $resolvedDir $sub
    if (Test-Path $subPath) {
        Write-Pass "Subdirectory '$sub/' exists."
    }
}

# 5. Check local relative links in SKILL.md (ignoring code blocks)
$contentNoCode = [regex]::Replace($content, '```[\s\S]*?```|`[^`\n]+`', '')
$links = [regex]::Matches($contentNoCode, '\[.*?\]\((\.\/[^)]+)\)')
foreach ($match in $links) {
    $relativeLink = $match.Groups[1].Value
    $targetFile = Join-Path $resolvedDir $relativeLink
    if (Test-Path $targetFile) {
        Write-Pass "Referenced file exists: $relativeLink"
    } else {
        Write-Fail "Broken relative link in SKILL.md: $relativeLink"
    }
}

Write-Host "----------------------------------------"
if ($hasErrors) {
    Write-Host "Validation FAILED. Please correct errors above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "Validation PASSED! Skill conforms to Antigravity standards." -ForegroundColor Green
    exit 0
}
