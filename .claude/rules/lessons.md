# Lessons Learned (append-only)

> Auto-loaded into every session via `@import` from CLAUDE.md. When a bug, wrong
> assumption, or environment gotcha is found, APPEND it here (newest at top). This
> is the project's growing memory — it exists so the same mistake never repeats.
>
> Format: one bold takeaway per bullet, then the mechanism/cause and the fix.
> Keep it to what a future session needs to avoid the trap — not a changelog.

## 2026-08-28

- **A hook that fails closed on a missing dependency can deny every tool call in the repo.**
  Three of the dotclaude safety hooks (`block-dangerous-commands.sh`, `protect-files.sh`,
  `warn-large-files.sh`) emit `permissionDecision: deny` when `jq` is absent. `jq` is not
  installed on this machine (Windows, Git Bash, `winget` only), so as shipped they would have
  denied every Bash, Edit, and Write call. Fix: `.claude/hooks/json-field.js` plus a
  `json_field`/`has_json_parser` shell pair in each hook — prefer `jq`, fall back to `node`,
  fail closed only when neither exists. **Always execute a newly installed hook with a real
  payload before trusting it; "the file copied successfully" proves nothing.**

- **`session-start.sh`'s drift fingerprint was hashing empty input.** Its `manifest_hash()`
  only reads root-level manifests, and this repo has no root `package.json` — the packages are
  `frontend/` and `backend/`. The recorded hash was `42949672950`, which is exactly
  `printf '' | cksum`, so config-drift detection could never fire. Fix: the function now loops
  over `package.json frontend/package.json backend/package.json`. **When a tool assumes a
  single-package layout, verify its output is not the degenerate empty-input value.**

- **`frontend/` tracks both `package-lock.json` and `yarn.lock`.** Identical mtimes, both
  committed. They will drift the moment anyone adds a dependency with the other tool. Pick one
  and delete the other before the next `install`.

- **`@craco/craco` is an unused dependency.** `frontend/package.json` scripts call
  `react-scripts` directly and there is no `craco.config.js`. Don't write config against it.
