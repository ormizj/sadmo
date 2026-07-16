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
