# Antigravity Skills Specification & Architecture Reference

## 1. Core Concepts
Skills are modular packages of procedural knowledge and domain rules that extend the Antigravity agent's capabilities. Rather than burdening the agent's base system prompt with excessive instructions, skills use **Progressive Disclosure**:
- Only the skill `name` and `description` are loaded into the agent's initial context.
- When a task matches the skill's activation criteria, the agent loads `SKILL.md`.
- Supporting documentation in `references/` is only read if specifically required during execution.

## 2. Directory Taxonomy
A compliant Antigravity skill directory must adhere to:

```text
skills/<skill-name>/
├── SKILL.md             # Required: Entrypoint and runbook with YAML frontmatter
├── scripts/             # Optional: Deterministic automation scripts (.ps1, .sh, .py, .js)
├── examples/            # Optional: Concrete input/output examples and golden files
├── resources/           # Optional: Starter templates, assets, schemas, configs
└── references/          # Optional: Heavy manuals, API docs, specification guides
```

## 3. Storage Roots & Precedence
Antigravity discovers skills across two primary locations:

1. **Workspace Root (Project Scope)**:
   - Path: `.agents/skills/<skill-name>/`
   - Purpose: Team-shared, version-controlled runbooks specific to the repository.
   - Precedence: Highest priority (overrides global and built-in skills with identical names).

2. **Global Root (Machine Scope)**:
   - Path: `~/.gemini/config/skills/<skill-name>/` (on Windows: `C:\Users\<User>\.gemini\config\skills\<skill-name>\`)
   - Purpose: Personal workflow accelerators accessible across all workspaces on the machine.

## 4. Frontmatter Contract
The `SKILL.md` file MUST begin with valid YAML frontmatter:

```markdown
---
name: my-skill-name
description: >-
  Use this skill when the user asks to perform action X, configure service Y,
  or debug scenario Z.
---
```

### Constraints:
- `name`: Must be lowercase alphanumeric with hyphens (kebab-case). It must strictly match the enclosing directory name.
- `description`: The agent's activation model relies on this text. Write in the third person: *"Use this skill when..."*. It must specify both **what** the skill achieves and **when** it triggers.

## 5. Execution Protocol for Agents
When invoking a skill:
1. Parse the instructions in `SKILL.md`.
2. Inspect available scripts in `./scripts/` before executing repetitive shell commands.
3. Validate each execution step with concrete checks (exit codes, output parsing, file existence).
4. Maintain idempotency and isolate temporary artifacts.
