# Conventions — Workflow & Self-Improvement

> AUTO-LOADED. Deliberately short: the "definition of done", falsification, and code-quality
> bars live in `engineering-standards.md` and `code-quality.md` — not repeated here.

## The self-improvement loop
1. **Every bug, gotcha, or wrong assumption gets appended to `.claude/rules/lessons.md`**
   (newest on top, under a `## YYYY-MM-DD` heading) — the takeaway and the mechanism, not a
   changelog line. The `lesson-guard.js` Stop hook backstops this: a session that changed code
   without recording a lesson gets asked for one before it stops.
2. **Learnings append to `lessons.md`, never to `CLAUDE.md`.** `CLAUDE.md` is an index; it
   changes only when a whole new rule file is added.
3. When one topic outgrows a screen, split it into `rules/<domain>.md` and add one `@import`.

## Cross-feature regression sweep
Before shipping a change to shared code, enumerate the other call sites it fans out to and
verify each still holds. `frontend/src/lib/scrollStore.js`, `SmoothScroll`, and
`TravellingCore` are shared scroll state — a change to one affects every section.

## Zelarion-specific
- **Two independent packages, no root manifest.** Run every command from `frontend/` or
  `backend/`. There is no workspace root to run from.
- **`frontend/` tracks both `package-lock.json` and `yarn.lock`.** They will drift. Pick one
  before adding dependencies; do not install with a mixed toolchain.
- **No formatter or linter is configured** in either package. Match the surrounding file's
  style by hand; do not introduce a formatter as a side effect of an unrelated change.
- **`@craco/craco` is an unused dependency** — `frontend/package.json` scripts call
  `react-scripts` directly and there is no `craco.config.js`. Don't build on it.
- **CRA (`react-scripts` 5) has no `NODE_ENV`-safe way to inject secrets.** Anything in
  `frontend/` is public. Secrets belong in `backend/` only.
