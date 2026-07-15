# Sketches

Point-in-time **explanatory diagrams** — visuals that show how some part of the system
works *at a moment in time*. Unlike the rest of `docs/`, these are **not living docs**:
they are snapshots that can go stale, so each one records the **commit it depicts**.

Authored with the [`sketch`](../../.claude/skills/sketch/SKILL.md) skill
(`/sketch <what to visualize>`), which traces the real code, stamps the commit, and
writes the file here.

## The contract

- One sketch = one `.md` file, kebab-case slug (e.g. `prisma-generate-dev-vs-prod.md`).
- Every sketch carries frontmatter:

  ```yaml
  ---
  title: <human title>
  depicts: <one-line summary of what the picture shows>
  commit: <git rev-parse --short HEAD at authoring time>
  date: <YYYY-MM-DD>
  kind: mermaid          # mermaid | image
  ---
  ```

- Body: a mermaid diagram (default) or an embedded image, plus a **short caption**
  pointing at the real files/lines.
- Images (when a graph diagram won't do) live in `assets/<slug>.<ext>` and are embedded
  with a relative `![alt](./assets/<slug>.<ext>)`.

## Trust the `commit` field

A sketch describes the codebase **as of its `commit`** — nothing more. When the code
moves, the picture may no longer be true. Don't silently patch a stale sketch: **rerun
the skill** so `commit`/`date` refresh honestly. If you're unsure whether a sketch still
holds, diff its `commit` against `HEAD`.
