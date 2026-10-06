---
name: skill-master
description: >-
  Use this skill when creating, scaffolding, architecting, validating, or implementing new Agent Skills for Google Antigravity, ensuring adherence to official progressive disclosure guidelines, YAML frontmatter standards, and folder hierarchies.
---

# Skill Master — Agent Skill Architect & Implementation Runbook

## Overview
`skill-master` is the meta-skill responsible for generating, structuring, and verifying high-quality, production-ready Agent Skills in Google Antigravity. It enforces standard file taxonomy, progressive disclosure, deterministic helpers, and rigorous quality validation according to the [Google Antigravity Documentation](https://antigravity.google/docs/skills).

## Prerequisites
- Antigravity IDE or CLI environment.
- PowerShell 5.1+ / Core (for executing scaffolding and validation scripts).

## Directory Map
- [scripts/scaffold-skill.ps1](./scripts/scaffold-skill.ps1): Automated generator for new skill structures.
- [scripts/validate-skill.ps1](./scripts/validate-skill.ps1): Automated compliance and link validator.
- [resources/SKILL_TEMPLATE.md](./resources/SKILL_TEMPLATE.md): Canonical boilerplate for `SKILL.md`.
- [references/antigravity-skills-spec.md](./references/antigravity-skills-spec.md): Complete technical specification and loading priority rules.

---

## Skill Architecture Principles

### 1. Progressive Disclosure
To preserve model context window efficiency:
- The top-level `SKILL.md` must be lean, directive, and action-oriented (runbook style).
- Bulky documentation, API tables, and background knowledge belong in `references/`.
- Concrete examples, input/output mocks, and schemas belong in `examples/`.
- Starter files, code templates, and assets belong in `resources/`.
- Repetitive, error-prone shell logic belongs in deterministic scripts under `scripts/`.

### 2. Strict Storage Scopes
Always determine the target scope:
| Scope | Target Path | When to Choose |
| :--- | :--- | :--- |
| **Workspace (Project)** | `.agents/skills/<skill-name>/` | Shared with repository team, checked into git. |
| **Global (User)** | `~/.gemini/config/skills/<skill-name>/` | Personal workflows used across all projects on the machine. |
| **Dual Scope** | Both locations | Universal utility available everywhere and embedded in the current repo. |

---

## Step-by-Step Procedure to Create a New Skill

### Step 1: Define Identity & Activation Criteria
1. **Name**: Choose a concise, kebab-case identifier (e.g., `db-migrator`, `component-audit`). Directory name must match `name` exactly.
2. **Description**: Draft a third-person description starting with an imperative activation cue:
   > *"Use this skill when the user requests [action], needs to configure [tool], or wants to troubleshoot [domain]."*

### Step 2: Scaffold the Skill
Run the automated scaffolding script:

```powershell
# For Workspace scope (default):
.\scripts\scaffold-skill.ps1 -Name "my-new-skill" -Description "Use this skill when..." -Scope "workspace"

# For Global scope:
.\scripts\scaffold-skill.ps1 -Name "my-new-skill" -Description "Use this skill when..." -Scope "global"

# For Both scopes:
.\scripts\scaffold-skill.ps1 -Name "my-new-skill" -Description "Use this skill when..." -Scope "both"
```

### Step 3: Populate Components
1. **`SKILL.md`**:
   - Fill in Prerequisites, Step-by-Step procedures, and Verification steps.
   - Use relative markdown links (e.g. `[filename](./resources/example.json)`) to link supporting files.
2. **`scripts/`**:
   - Provide concrete scripts (.ps1, .sh, .py) for complex commands.
3. **`resources/` & `references/`**:
   - Place templates, configs, or lengthy manuals in their dedicated subdirectories.

### Step 4: Validate Compliance
Always execute the validation script before marking a skill as complete:

```powershell
.\scripts\validate-skill.ps1 -SkillPath ".agents/skills/my-new-skill"
```

The validator verifies:
- [x] Directory name is valid kebab-case.
- [x] `SKILL.md` exists with valid `---` YAML delimiters.
- [x] `name` matches directory name.
- [x] `description` is present and formatted in third-person.
- [x] All relative links inside `SKILL.md` resolve to existing files.

---

## Anti-Patterns & Prohibitions
- **NEVER** place raw skill files (`SKILL.md`) directly in the workspace root or loose directories — always place them under `<customization_root>/skills/<skill-name>/`.
- **NEVER** write generic descriptions like *"Helps with code"* — the model's activation router will fail to match user intent.
- **NEVER** duplicate base programming concepts that LLMs already know — focus purely on specific workflows, runbooks, and domain constraints.
- **NEVER** leave broken relative markdown links in `SKILL.md`.
