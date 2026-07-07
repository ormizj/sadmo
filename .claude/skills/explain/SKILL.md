---
name: explain
description: Explain a file, code, or subject step-by-step — one unit at a time — pausing after each until the user says next. Triggers on "explain X", "walk me through X", "teach me X", "break down X line by line / section by section".
user-invocable: true
allowed-tools: Read, Glob, Grep, AskUserQuestion
---

You are running an **interactive, self-paced walkthrough**. You explain the subject
**one unit at a time** and then **stop** — the user drives the pace. You only ever
advance when the user explicitly tells you to.

The single most important rule: **explain exactly ONE unit per turn.** Never explain
ahead, never dump several units at once, never summarize the whole thing. One unit,
then hand control back. If you feel the urge to "just cover the rest," don't.

## Step 0 — Resolve the subject

The subject comes from the invocation args (e.g. `explain docker-compose.yml`,
`explain React Server Components`).

- If it names a **file** (has an extension, or looks like a path) — use `Glob` to
  locate it if needed, then `Read` it. Always quote from the **actual file
  contents**, never from memory.
- If it's a **concept** (no file) — no read is needed; you'll break it into
  sub-topics.
- If **no subject** was given — ask the user what they'd like explained, in plain
  text, and stop.

## Step 1 — Ask granularity UP FRONT

Before explaining anything, send a single `AskUserQuestion`:

- header: `Granularity`, question: `How should I break this down?`
- options:
  1. `Line by line` — each line, or the smallest logical unit.
  2. `Section by section` — logical blocks (e.g. each service in a compose file,
     each function, each sub-topic of a concept).

The auto-added "Other" covers custom requests (e.g. "just the tricky parts").

## Step 2 — Enumerate units

Build the ordered list of units per the chosen granularity and note the **total
count**. Keep this list to yourself — **do not print it**.

## Step 3 — Explain exactly ONE unit

Output, in this order:

1. A **position header** — e.g. `Line 4 of 18` or `Section 2 of 6: volumes`. Always
   include this; it lets you (and the user) recover the current position on any turn,
   even after a long conversation.
2. The **quoted unit** — the exact line(s) / block, in a code block for files.
3. A focused explanation of **that unit only**.

Then go to Step 4. Do not continue past the current unit on your own.

## Step 4 — Present controls

Send an `AskUserQuestion`:

- header: `Continue?`, question: e.g. `Explained line 4/18 — what next?`
- options (explicit, unambiguous actions only):
  1. `Next` — go to the next unit.
  2. `Back` — return to the previous unit.
  3. `Stop` — end the walkthrough.

The auto-added "Other" is free text — used for a **question** about the current unit,
or an explicit **jump** ("jump to line 20", "skip to volumes", "go to the end").

## Step 5 — Interpret the answer strictly

Act **only** on a clear instruction. When in doubt, **do not move** — stay on the
current unit and re-ask.

- `Next` — or free-text synonyms `n`, `continue`, `go on`, `keep going` → advance one
  unit → Step 3.
- `Back` — or `previous`, `prev` → go back one unit → Step 3.
- `Stop` — or `done`, `quit`, `exit` → end → Step 6.
- **Other free text:**
  - If it is *unambiguously* a **jump/skip** to a named target (a line number, a
    section name, "the end", "the start") → move there → Step 3.
  - Otherwise treat it as a **question** about the current unit: answer it, then
    **re-present the same unit's controls (Step 4) — do NOT advance.**
- Anything ambiguous (a comment, a reaction, unclear intent) → stay put and re-ask.

Never advance or jump on unclear input. Advancing is only ever triggered by an
explicit `Next`/synonym or an explicit jump.

## Step 6 — End

When the last unit is reached (or the user stops), state that the walkthrough is
complete. Offer a short one-paragraph recap, but only produce it if the user wants
one.
