<#
.SYNOPSIS
    Scaffolds a new Antigravity Agent Skill complying with official documentation.
.DESCRIPTION
    Creates the required directory structure, YAML frontmatter, and skeleton files
    for a new skill in either the workspace (.agents/skills) or global (~/.gemini/config/skills).
.PARAMETER Name
    The kebab-case name of the skill (e.g. 'deploy-service', 'audit-db').
.PARAMETER Description
    The third-person activation description ('Use this skill when...').
.PARAMETER Scope
    Where to install: 'workspace' (default), 'global', or 'both'.
.PARAMETER WorkspaceRoot
    Root path of the workspace (defaults to current directory).
.EXAMPLE
    .\scaffold-skill.ps1 -Name "docker-optimizer" -Description "Use this skill when analyzing Dockerfiles and multi-stage builds." -Scope "workspace"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidatePattern('^[a-z0-9]+(-[a-z0-9]+)*$')]
    [string]$Name,

    [Parameter(Mandatory = $false)]
    [string]$Description = "Use this skill when the user requests procedures related to $Name.",

    [Parameter(Mandatory = $false)]
    [ValidateSet('workspace', 'global', 'both')]
    [string]$Scope = 'workspace',

    [Parameter(Mandatory = $false)]
    [string]$WorkspaceRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

function Get-GlobalSkillsPath {
    $homeDir = [System.Environment]::GetFolderPath('UserProfile')
    return Join-Path $homeDir ".gemini\config\skills"
}

$targetPaths = @()

if ($Scope -eq 'workspace' -or $Scope -eq 'both') {
    $targetPaths += Join-Path $WorkspaceRoot ".agents\skills\$Name"
}

if ($Scope -eq 'global' -or $Scope -eq 'both') {
    $globalSkills = Get-GlobalSkillsPath
    $targetPaths += Join-Path $globalSkills $Name
}

# Generate Title from Kebab Name
$titleParts = $Name.Split('-') | ForEach-Object {
    (Get-Culture).TextInfo.ToTitleCase($_)
}
$title = $titleParts -join ' '

$skillContent = @"
---
name: $Name
description: >-
  $Description
---

# $title Skill

## Overview
Brief explanation of the workflow and domain governed by this skill.

## Prerequisites
- Required tools, packages, or environment setup.

## Directory Structure
- [scripts/](./scripts/): Automation and deterministic helper scripts.
- [resources/](./resources/): Templates, assets, and starter configurations.
- [references/](./references/): In-depth manuals and API documentation.
- [examples/](./examples/): Reference implementations and practical examples.

## Step-by-Step Procedure

### 1. Context Assessment
- Review relevant project files and dependencies before applying changes.

### 2. Execution Steps
- Define clear, sequential steps for the agent to follow.
- When applicable, invoke helper scripts from `./scripts/`.

### 3. Verification & Validation
- Steps to verify that the procedure succeeded (e.g. test runs, assertions, logs).

## Anti-Patterns & Common Pitfalls
- List of prohibited practices, known edge cases, or common failure modes.
"@

foreach ($path in $targetPaths) {
    Write-Host "Creating skill at: $path" -ForegroundColor Cyan
    
    $dirs = @(
        $path,
        (Join-Path $path "scripts"),
        (Join-Path $path "resources"),
        (Join-Path $path "references"),
        (Join-Path $path "examples")
    )

    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }

    $skillFilePath = Join-Path $path "SKILL.md"
    if (-not (Test-Path $skillFilePath)) {
        [System.IO.File]::WriteAllText($skillFilePath, $skillContent, [System.Text.Encoding]::UTF8)
        Write-Host "  -> Generated SKILL.md" -ForegroundColor Green
    } else {
        Write-Host "  -> SKILL.md already exists, skipping overwrite." -ForegroundColor Yellow
    }

    # Add a .gitkeep to optional folders so VCS tracks them
    foreach ($sub in @("scripts", "resources", "references", "examples")) {
        $gitkeep = Join-Path $path "$sub\.gitkeep"
        if (-not (Test-Path $gitkeep)) {
            New-Item -ItemType File -Path $gitkeep -Force | Out-Null
        }
    }
}

Write-Host "Skill '$Name' scaffolded successfully in scope [$Scope]!" -ForegroundColor Green
