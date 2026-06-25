# General rules

## Ask when ambiguous

If a request is ambiguous, underspecified, or open to more than one
reasonable interpretation, stop and ask the user before acting.

- **Why:** guessing wastes a turn and risks shipping the wrong thing.
  A 10-second clarifying question is cheaper than rework.
- **How to apply:** use `AskUserQuestion` for concrete choices (which
  library, which file, which behavior); ask in plain text for open-ended
  intent. Do not paper over ambiguity with "reasonable defaults" unless
  the user has explicitly told you to proceed autonomously. Examples that
  warrant a question: unclear target file/scope, multiple plausible
  designs, an unstated constraint (auth method, data shape, naming),
  contradictory signals between the request and the code.

## Don't write docs by default

Do not add comments, JSDoc/docstrings, README sections, or standalone
markdown files unless the user asks for them or the logic genuinely
needs explanation.

- **Why:** well-named code documents itself; redundant docs rot, mislead,
  and inflate diffs. The user has explicitly opted out of speculative
  documentation.
- **How to apply:** write a comment only when the *why* is non-obvious —
  a hidden constraint, a subtle invariant, a workaround for a specific
  bug, or behavior that would surprise a careful reader. Never describe
  *what* the code does (the code already shows that). Never add
  "added for task X" / "used by Y" notes. Never create `.md` files
  proactively — only when explicitly requested.
