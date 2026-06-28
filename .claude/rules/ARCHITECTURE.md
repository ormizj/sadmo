# Architecture rules

Sort code by **what it is**, not where it's first used. A layer may import from
layers above it in this table, never below.

| Layer | Folder | Rule |
|-------|--------|------|
| Pure logic | `src/lib/` | Framework-agnostic. No React/Next imports. Pure functions + constants. Reusable & unit-testable. |
| Reusable behavior | `src/hooks/` | Shared *stateful* React logic. Create only when behavior is reused across ≥2 components. |
| Config / data | `src/config/` | Static app data separated from JSX (e.g. nav items). |
| UI primitives | `src/components/ui/` | Generic, presentational. Prefer **base + variant** composition (e.g. `TextField` → `PasswordField`). |
| Icons | `src/components/icons/` | Brand/custom SVGs that `lucide-react` doesn't ship. Standard icons come from `lucide-react` — never inline an SVG a component could import. |
| Feature components | `src/components/<feature>/` | Compose primitives + hooks + lib for one feature. Hold *orchestration*, not reusable rules. |

## When you spot duplication

Move the shared piece **up** to the layer that matches what it is — a pure rule
goes to `lib/`, shared stateful behavior to `hooks/`, shared markup to a `ui/`
primitive — then have both call sites import it. Don't copy.

## `src/lib/` organization

Group by **type, then domain**: a type-namespace folder holds a `common.ts` for
generic reusable helpers plus one file per domain for feature-specific logic.

```
src/lib/validation/
  common.ts   # generic, reusable: isValidEmail, isRequired
  auth.ts     # domain-specific: validateLogin (composes common.ts)
```

Generic primitives go in `common.ts` so the next feature can find them; keep
domain-specific orchestration (which fields, which messages) in the domain file,
not inline in components.
