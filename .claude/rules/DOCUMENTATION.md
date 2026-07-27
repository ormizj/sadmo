# Documentation rules

## Verify against a source before documenting or teaching

Any claim you write into the docs, or state while explaining/teaching how
something works, MUST be verified against an authoritative source first —
never from memory or assumption.

- **Why:** confident-sounding assumptions are how wrong information gets
  baked into the docs and taught as fact. This version of Next.js differs
  from training data (see `AGENTS.md`), so memory is especially unreliable
  here. One wrong sentence in a doc misleads every future reader.
- **How to apply:** before writing or asserting a technical claim, ground it
  in a real source — the bundled framework docs under
  `node_modules/next/dist/docs/`, the actual code in this repo (read the file,
  run it), or official upstream documentation. Prefer showing the evidence
  (a repo file, a doc quote) over stating it bare. If you cannot verify a
  claim, say so explicitly and flag it as unverified rather than presenting a
  guess as fact. This applies equally to docs files and to inline
  explanations in chat.

## Explore the whole subject before concluding

Verifying isolated claims is not enough. Before documenting or teaching a
subject, map it out fully — how the pieces relate — and check that the result
is **internally consistent**. A statement can be individually true and still be
wrong in context.

- **Why:** the crucial mistakes in this repo's Next.js docs came from partial
  exploration, not missing sources. Each line was "verified," yet the summary
  table kept asserting "no directive = Server Component" and "use secrets here"
  while the sections right below it said the opposite — the claims were checked
  one at a time but never reconciled, so a contradiction shipped and survived
  several rounds. Assumptions fill the gaps you didn't explore.
- **How to apply:**
  - **Read the whole relevant source section, not one grep hit.** A matched
    line can be true while the surrounding text adds a caveat that changes the
    picture (e.g. "shared" vs. "server-only", "referenced" vs. "unreferenced").
  - **Build the mental model first, then write.** Understand the edges and
    exceptions before committing prose — don't document the happy path and
    discover the nuance later.
  - **After any add or fix, re-read the surrounding content for consistency.**
    A correction in one section that contradicts a table, intro, or example
    elsewhere is not done. Check every place the same fact appears.
  - **When unsure whether you've explored enough, you haven't** — keep digging
    or state the open question explicitly rather than smoothing over the gap
    with a confident-sounding guess.
