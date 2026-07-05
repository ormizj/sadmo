# Skill & Command Manager

Author and maintain CLAUDE skills and slash commands for this Laravel 12 / PHP 8.3 / Livewire v4 project. Skills and commands follow **identical rules** — only the root directory and who invokes them differ.

## Skills vs commands

|                    | Skill                                                                      | Command                                                                      |
|--------------------|----------------------------------------------------------------------------|------------------------------------------------------------------------------|
| **Root directory** | `.claude/skills/`                                                          | `.claude/commands/`                                                          |
| **Invoked by**     | Claude automatically, or user via `/name`                                  | User only, via `/name`                                                       |
| **Use when**       | A capability Claude should reach for (e.g. `pdf-editing`, `design-system`) | A shortcut procedure the user triggers (e.g. `/deploy`, `/pr-description`)   |

Everything else — file format, frontmatter, body structure, folder layout, supporting docs, scripts — is **the same**. A file written for one root directory works in the other by moving it; only invocation changes.

## File layout

Let `<root>` = `.claude/skills/` (for skills) or `.claude/commands/` (for commands). The same layout options apply to both:

| Path                                | Purpose                                                                    | File format            |
|-------------------------------------|----------------------------------------------------------------------------|------------------------|
| `<root><name>/SKILL.md`             | Entry file with YAML frontmatter and a Workflow section                    | Frontmatter + Markdown |
| `<root><name>/<SUPPORTING>.md`      | Optional supporting docs (REFERENCE.md, PATTERNS.md, TROUBLESHOOTING.md)   | Plain Markdown         |
| `<root><name>/scripts/`             | Optional helper scripts                                                    | Any                    |
| `<root><name>.md`                   | Single-file shorthand when no supporting docs or scripts are needed        | Frontmatter + Markdown |

Default to the single-file shorthand (`<root><name>.md`). Promote to a folder (`<root><name>/SKILL.md` + siblings) only when the entry file exceeds ~150 lines, reusable reference data emerges, or helper scripts are needed.

## Canonical project references

Read these before authoring — source of truth for style and structure in this repo:

- `.claude/skills/sync-agents/SKILL.md` — frontmatter format, `allowed-tools` scoping, Workflow step structure, Validation Checks section
- `.claude/skills/figma-to-daisyui/SKILL.md` — entry that anchors in project rule files and delegates implementation
- `.claude/skills/sync-claude-md/SKILL.md` — lean CLAUDE.md-mutation entry

## Frontmatter

```yaml
---
name: name
description: One-sentence purpose. Use when <trigger>. Requires <dependencies>.
allowed-tools: Read, Write, Edit, Bash(php artisan:*), Bash(composer:*)
argument-names: optional-arg-name
---
```

Field rules (identical for skills and commands):

- **`name`** — lowercase, hyphenated. Must match the folder name (folder layout) or the filename without `.md` (single-file shorthand).
- **`description`** — one sentence. State purpose, trigger conditions, and dependencies. Claude uses it to decide whether to auto-invoke a skill and to rank relevance when a user types `/name`.
- **`allowed-tools`** — least privilege. Comma-separated. Use specific Bash patterns over blanket `Bash`.
- **`argument-names`** — optional. Use when the entry takes a positional argument.

## allowed-tools patterns for this project

Common, specific patterns relevant to the Laravel / Livewire / Tailwind stack:

```
Bash(php artisan:*)        # artisan commands
Bash(composer:*)           # dependency + stan
Bash(npm run:*)            # npm run dev / build / lint
Bash(php:*)                # raw php invocations
Bash(git:*)                # git operations (use narrower patterns where possible)
Bash(git status:*)         # read-only git
Bash(git diff:*)           # read-only git
mcp__daisyui-blueprint__*  # daisyUI MCP tools
Read
Write
Edit
Glob
Grep
AskUserQuestion
```

Reject `Bash(*)` or `Bash` alone unless the workflow genuinely needs unrestricted shell access (it almost never does).

## Body structure

Identical template for skills and commands:

```markdown
# <Title>

<1–2 sentence purpose restated, aimed at the operator running it.>

## Argument (if any)

- `$arg-name` — what it means and its format.

## Rules to follow

Any entry that writes code must anchor in the project rule files:

- `.claude/rules/general.md` — documentation discipline (always)
- `.claude/rules/livewire.md` — Livewire v4 SFC format (if writing `.blade.php`)
- `.claude/rules/alpine.md` — Alpine directive shorthand and boundaries (if Alpine is involved)
- `.claude/rules/i18n.md` — translation key discipline (if user-facing strings are involved)
- `.claude/rules/legacy-livewire.md` — frozen `app/Http/Livewire/` archive (if the workflow could touch legacy files)

## Workflow

### Step 1: <verb phrase>
<exact tool call or command, with enough context to execute without inference>

### Step 2: <verb phrase>
...

## Validation checklist

- [ ] <concrete, verifiable post-condition>
- [ ] <concrete, verifiable post-condition>

## Error Handling

<What to do when things fail. Do not retry destructively.>
```

## Workflow

### Step 1: Read the closest existing reference

Pick the closest in-repo entry (from either `.claude/skills/` or `.claude/commands/` — same rules apply) and match its style exactly. Do not invent a new convention.

### Step 2: Clarify scope

Confirm with the user:

- What the entry does
- Whether it's a skill (Claude auto-invokes) or a command (user types `/name`)
- When it should trigger
- What it must not do

If any of these are ambiguous, use `AskUserQuestion` rather than guessing.

### Step 3: Choose root and layout

- Root: `.claude/skills/` for skills, `.claude/commands/` for commands. No other rule changes.
- Layout: single-file shorthand (`<root><name>.md`) by default. Promote to folder (`<root><name>/SKILL.md` + siblings) only when supporting docs, reference data, or helper scripts are genuinely needed.

### Step 4: Scope `allowed-tools`

Start from "what does the workflow actually do?" and add the narrowest pattern that covers it. Prefer `Bash(php artisan:*)` over `Bash(*)`. Prefer `Bash(git status:*)` and `Bash(git diff:*)` over `Bash(git:*)` for read-only flows. No blanket `Bash(*)` unless justified.

### Step 5: Anchor in rule files

Any entry that writes code must cite the relevant `.claude/rules/*.md` files in a "Rules to follow" section:

- `.claude/rules/general.md` — always
- `.claude/rules/livewire.md` — if writing `.blade.php`
- `.claude/rules/alpine.md` — if Alpine is involved
- `.claude/rules/i18n.md` — if user-facing strings are involved
- `.claude/rules/legacy-livewire.md` — if the workflow could touch `app/Http/Livewire/`

Run `Glob` to confirm every referenced rule file actually exists before citing it.

### Step 6: Write the file

Use `Write` for new files, `Edit` for updates. Preserve existing formatting conventions exactly. When updating an existing file, read it in full first — do not rewrite style conventions you haven't been asked to change.

### Step 7: Validate

- Re-read the frontmatter as YAML. Confirm it parses.
- Confirm `name` matches the folder name (folder layout) or filename without `.md` (single-file shorthand).
- Confirm every tool used in the Workflow section is listed in `allowed-tools`.
- Confirm every `.claude/rules/*.md` reference points at a file that exists.

## Quality standards

- **Description field** tells Claude (skills) or the user (commands) exactly when to invoke. No "might be useful for…" — be concrete.
- **Workflow steps** are numbered, verb-led, and contain the exact command or tool call. Future-you should be able to execute from the step without additional context.
- **Validation checklist** post-conditions are checkable, not aspirational.
- **Least privilege** on `allowed-tools` — no blanket access when a pattern works.
- **Rule references** — entries that write `.blade.php` must cite `.claude/rules/livewire.md`. Those touching user-facing strings must cite `.claude/rules/i18n.md`. No exceptions.

## Error Handling

- Validate YAML frontmatter syntax before saving. Common mistakes: unquoted strings with colons, tabs instead of spaces, missing `---` terminator. If YAML is invalid, fix and re-validate before writing.
- If a cited `.claude/rules/*.md` file does not exist, stop and either create it (with the user's confirmation) or remove the reference — do not leave dangling links.
- If the workflow needs a tool that is not in `allowed-tools`, add it with the narrowest matching pattern — do not silently broaden an existing entry.
- Do not retry writes destructively. If `Write` fails because the file exists and the user asked for a new file, confirm with `AskUserQuestion` before overwriting.
