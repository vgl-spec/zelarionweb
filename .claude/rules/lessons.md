# Lessons Learned (append-only)

> Auto-loaded into every session via `@import` from CLAUDE.md. When a bug, wrong
> assumption, or environment gotcha is found, APPEND it here (newest at top). This
> is the project's growing memory — it exists so the same mistake never repeats.
>
> Format: one bold takeaway per bullet, then the mechanism/cause and the fix.
> Keep it to what a future session needs to avoid the trap — not a changelog.

## 2026-08-28

- **Check the container against the codec: `aurora.webm` was H.264, not VP9.** A 1920x1080
  60fps encode of a soft gradient loop shipped at 17 MB. Re-encoded to real VP9 at 720p/30
  it is 35 KB -- a 99.8% cut with no visible difference, because a blurred gradient has
  almost no high-frequency detail to encode. The whole `public/assets/` folder went from
  21.7 MB to 236 KB. **Everything in `public/` is deployed, so an unused 1.4 MB master
  sitting next to its optimised copy is shipped to every visitor.** Verify a suspiciously
  large saving by extracting a frame rather than trusting the byte count.

- **A 1024x1024 PNG rendered into a 30px slot is the easiest perf win in any repo.** The
  logo was 1.4 MB for a 30px mark. Resized to 192px it is 42 KB and still crisp at 6x.

- **Animating `height: auto` in framer-motion measures a pixel height every frame, and
  `layout` on the parent reflows its whole grid with it.** That was the stutter in
  `ExpandableProfileCard`. Animating a single grid track instead (`grid-template-rows:
  0fr -> 1fr` on an `overflow: hidden` wrapper with a `min-h-0` child) needs no measurement.
  Exit is set shorter than enter so collapsing feels responsive.

- **Building pages does not make them reachable.** `/work`, `/services`, `/team` and `/faq`
  shipped while the nav still pointed at `/#work` hash anchors, so nothing in the UI linked
  to any of them. **After adding a route, grep the nav and footer for a link to it** --
  otherwise it exists only for whoever types the URL.


- **A sibling rendered *after* `<main>` still loses to it when `<main>` has `z-10` and the
  sibling has none.** `CinematicFooter`'s wrapper was `relative` with no z-index, so it
  computed to `auto` and `<main class="relative z-10">` painted over the `lg:fixed` footer.
  Every footer link and button was unhoverable and unclickable on every page tall enough to
  still be scrolling -- `/contact` worked only because its content is short enough that
  main's box ends above the footer. DOM order does not beat an explicit z-index. Fix: give
  the footer wrapper `z-20` (header is `z-40`). **Symptom to recognise: "it works on one
  short page and nowhere else" is almost always a stacking-context bug, not a CSS-per-page
  bug.**

- **Numbered markers (01/02/03) are only honest when the content is genuinely ordered.** The
  hero listed six clients as `01`-`06` inside an `<ol>`, implying a ranking that does not
  exist. Replaced the numbers with each client's sector and the `<ol>` with a `<ul>`: the
  marker slot now carries real information and doubles as a scannable index. **Structural
  devices should encode something true about the content, not decorate it.**

- **Watch for a label and its description saying the same thing twice.** Once the sector
  moved into the marker slot, three entries read "INDUSTRIAL SUPPLY / Industrial supply
  for...". Whenever you promote a field into a label, re-read the neighbouring copy.


- **An inline `style` on an element outranks every `:hover` rule in a stylesheet.** The
  `CursorTrailContact` CTA underline set its base state inline and its hover state in a
  `<style>` block, so it could never animate -- the acceptance criterion "underline grows to
  full width on hover" was silently unmet, and a build plus a render smoke test both passed
  anyway. Only a computed-style check before/after `hover()` caught it. Fix: base state moved
  into the stylesheet. **A visual acceptance criterion needs a test that reads the computed
  value, not one that asserts the element exists.**

- **Nesting a fixed-position canvas inside `<main>` moved it into main's stacking context and
  it swallowed every click beneath it.** `TravellingCore` is `fixed inset-0 z-[2]`; as a
  sibling of `<main class="relative z-10">` it sits behind, but moved *inside* main both
  compete in the same context and `z-2` beat the contact section's `z-auto`. The giant CTA
  became unclickable. Compounding it: the wrapper's `pointer-events-none` does not protect
  anything, because **@react-three/fiber's own container resets `pointer-events: auto` on the
  canvas.** Fix: keep the canvas a sibling of `<main>`, and add `[&_*]:pointer-events-none` so
  a decorative canvas can never capture input. `document.elementsFromPoint()` at an element's
  centre is the way to prove what is actually on top.

- **A backtick inside a CSS comment terminates the JS template literal holding the CSS.**
  Components that inject styles via `<style dangerouslySetInnerHTML={{ __html: STYLES }} />`
  hold that CSS in a template literal, so writing `` `transform` `` for emphasis in a comment
  breaks the whole file with a misleading "Missing semicolon". Hit twice in one session. Never
  use backticks inside those comments.

- **Vercel prefers `yarn.lock` over `package-lock.json` when both are present.** This repo
  tracked both; a tool run mid-session added 440 lines to `yarn.lock`, which would have made
  the deploy install a dependency graph nobody built or tested. Removed `yarn.lock`.
  **Two lockfiles is not a tidiness issue, it is a "production runs different code than CI"
  issue.**

- **CRA emits one chunk unless you split it.** The initial bundle was 1.21 MB gzipped because
  `shaders` (34 MB of source) and `three` (30 MB) were both in the eager path for decorative
  background canvases. `React.lazy` on the two canvas modules took the main chunk to 232 kB
  (-81%). The split must be at the *canvas* boundary, not the section boundary -- lazy-loading
  the whole contact section would have gated its heading and CTA behind the shader download.

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
