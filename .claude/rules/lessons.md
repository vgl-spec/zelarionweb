# Lessons Learned (append-only)

> Auto-loaded into every session via `@import` from CLAUDE.md. When a bug, wrong
> assumption, or environment gotcha is found, APPEND it here (newest at top). This
> is the project's growing memory — it exists so the same mistake never repeats.
>
> Format: one bold takeaway per bullet, then the mechanism/cause and the fix.
> Keep it to what a future session needs to avoid the trap — not a changelog.

## 2026-08-28

- **A shared `layoutId` between a portalled dialog and a trigger that STAYS MOUNTED never
  settles.** framer keeps projecting: the dialog held a residual transform
  (`matrix(0.996, ...)`) indefinitely, so `getBoundingClientRect()` returned 861px for a
  1024px element, and framer holds `pointer-events: none` on a projecting element, so
  `elementsFromPoint` at the dialog's own centre returned the backdrop and the dialog was
  not in the hit stack at all. Three separate assertions failed and every one looked like a
  different bug. Fix: drop the shared projection and animate the dialog with plain
  `opacity` + `scale`. **Shared-element layout is for a trigger that goes away.** If both
  ends stay on screen, use an ordinary transition.

- **Removing an element under the cursor makes the browser fire mouseover/mouseenter on
  whatever is newly on top.** Closing the preview removed the backdrop, the tile underneath
  received a synthetic mouseenter, and hover-to-open reopened it instantly. Escape and the
  close button both appeared to do nothing while actually working perfectly.

- **`mouseenter` is dispatched BEFORE the `mousemove` that caused it.** A "has the pointer
  really moved since dismissal?" guard read at mouseenter time is always stale, which
  blocked even the first hover. Evaluate that check when the hover-intent timer fires, by
  which point a genuine hover has logged a mousemove and a synthetic enter has not. Movement
  is the right discriminator here; a time window is not, because too short lets the second
  synthetic event through and too long eats a deliberate re-hover.

- **A boolean "blocked" flag cleared only by an event that might never fire is a stuck
  state.** Blocking reopen until the tile's `mouseleave` looked right, but a pointer-out
  dismissal leaves the pointer nowhere near the tile, so no mouseleave ever came and the
  card could never open again. Prefer a self-healing signal (a timestamp comparison) over a
  latch that depends on a specific future event.

- **An unconditional focus-opens handler makes a card impossible to open by tapping.**
  `ExpandableProjectCard` opened on `onFocus` for keyboard parity and toggled on click. A tap
  fires focus THEN click, so React batched `setIsOpen(true)` followed by the click's
  `setIsOpen(open => !open)` and the net result was closed — every tap a no-op. The event
  trace made it obvious where reasoning had not: the click handler set `aria-expanded=true`
  and the final state was `false`. Fix: gate the focus branch on
  `event.target.matches(':focus-visible')`, which is false for pointer/touch focus and true
  for keyboard focus — exactly the needed distinction. **When hover, focus and click all
  drive one piece of state, enumerate the real event ORDER for each input type before
  writing the handlers.**

- **One flat scrim cannot both protect text and preserve a background effect.** The shader
  behind the contact form was set to `opacity-0.15` under a `bg-ink/70` wash — about 4%
  effective, so the requested animated background was simply invisible while still costing a
  WebGL context. Fix: run the effect at 60% and put the darkening *where the text is* — a
  horizontal ramp opaque over the form column and clearing toward the empty right-hand side.
  **Protect the text, not the whole viewport.**

- **A copied animation's end value is tuned for the page it came from, not yours.** The
  ported HeroParallax settles its card block at `translateY: +500`, which in the reference
  sits on a page where the card wall is the only content. Dropped into a hero with a header
  above it, that pushed the rows half a viewport below their layout position and left a
  ~440px band of empty background between the header and the first row for the entire middle
  of the scroll — invisible at scroll 0 and at the bottom, so both the "top" and "deep"
  screenshots looked perfect. `+160` keeps the fly-down entrance with no void. **Screenshot
  the MIDDLE of a scroll-driven animation, not just its endpoints** — the defect lives in the
  transition.

- **Changing a validator's RETURN SHAPE silently disabled every validation on the endpoint.**
  `validateDemoPayload` was refactored from returning an array to returning
  `{ errors, data }`, but the route handler still read `const errors = validateDemoPayload(...)`
  then `if (errors.length > 0)`. On an object `.length` is `undefined`, and `undefined > 0` is
  `false` — so **every** rule, old and new, passed everything through: no email check, no
  length caps, no currency allowlist, no unknown-field rejection. The file passed
  `node --check` and the server started fine. A second bug rode along: `doc` was still built
  from raw `req.body`, so the sanitized values were computed and thrown away and the three new
  fields were never persisted at all.
  **Two takeaways.** (1) When you widen a function's return type, grep every call site in the
  same commit — a destructure that silently yields `undefined` fails open, which is the worst
  possible direction for a validator (rule 14 says fail closed). (2) **A validation layer with
  no test that asserts a REJECTION is indistinguishable from no validation layer.** The suite
  now has 38 tests, and the ones that matter are the ones expecting 422.

- **A rate limit kills every parallel subagent at once and can leave a file half-written.**
  Four builders died mid-task on a shared sonnet session limit. Three had written nothing;
  the fourth left `backend/server.js` with 166 new lines that passed `node --check` and
  *looked* finished — but no tests existed and nothing had been run. **`node --check` and a
  green build prove syntax, never completeness.** When reviving a killed agent, tell it to
  AUDIT the partial work first and report what actually landed, rather than continuing from
  where it thinks it was.

- **Deleting JSX leaves its imports behind, and `CI=true` turns that into a failed build.**
  Removing the footer's "Call Us" button orphaned the `Phone` import from `lucide-react`;
  CRA promotes the unused-var warning to an error. **After deleting any markup block, grep
  the file's imports for every symbol that block was the last user of.** Same trap as
  deleting a component and leaving its route import.

- **A live `tel:` link to a placeholder number is worse than no phone number at all.** The
  footer shipped `+1 (555) 010-0000` — a reserved fictional US number — behind a "Call Us"
  pill on a lead-generation page, with a stale "swap before shipping" comment above it. A
  prospect who taps a dead number is a lost lead plus a credibility hit. Placeholder contact
  details are not neutral filler; either they are real or the affordance comes out.

- **"Label promises X, href goes to Y" is one bug class, and it hides in menus as well as
  footers.** After fixing footer links that pointed at unreachable `/#hash` anchors, the
  Services mega-menu turned out to have **eight** invented sub-service labels ("Cloud &
  DevOps", "QA & Testing" — offered nowhere else on the site) with **every one pointing at
  `/work`**. Auditing one navigation surface means auditing all of them: enumerate every
  link's label next to its destination and read the two together.

- **An ffmpeg crop bigger than the source writes a 0-byte file and the shell loop still exits 0.**
  Cropping `2880:1920` from an 1800px-tall capture failed on all 16 images with
  "Invalid too big or non positive size", yet the loop reported nothing and left 16 empty
  `.webp` files behind. **After any batch encode, list the output sizes** — `ls -l | awk
  '{print $5, $9}'` — rather than trusting the exit code. A 0-byte or 3 KB output is the
  tell.

- **Contact-sheet many captures instead of opening them one by one.** `ffmpeg -i seq/%02d.png
  -vf "scale=460:-1,tile=4x4:padding=6" -frames:v 1 sheet.png` puts 16 screenshots in one
  image, which is one read instead of sixteen. Two gotchas: this Windows ffmpeg build has
  **no glob support** (`-pattern_type glob` errors with "globbing is not supported by this
  libavformat build"), so copy the files to a numbered sequence first; and `tile` needs every
  input at the same size.

- **Crawling a site's own nav to pick screenshot targets will find 404s and PDFs.** Discovering
  hrefs from the DOM beats guessing paths, but `/packages` returned a styled 404 page whose
  `<title>` was identical to the home page's, so the title check passed. Another link started a
  PDF download and hung `page.goto`. **Look at the pixels** — an unusually small encoded file
  (2.8 KB vs a 20 KB norm) is the cheapest signal that a capture is mostly blank.

- **`body { overflow: hidden }` does NOT lock the page when Lenis is driving the scroll.**
  Lenis runs its own rAF loop and calls `window.scrollTo`, so it sails straight through the
  overflow lock: an open profile dialog scrolled the page 593px behind itself. A browser test
  caught it; reading the code did not, and the builder had flagged it as unverifiable. Fix:
  `registerScrollDriver(lenis)` in `SmoothScroll`, and `lockScroll()`/`unlockScroll()` from
  `scrollStore` in the modal. **Keep the body-overflow lock too** — under
  `prefers-reduced-motion` there is no Lenis instance and overflow is the only lever.
  Neither mechanism alone holds the page still.

- **A viewport that lays out wider than itself is the signature of a mobile overflow bug.**
  `window.innerWidth` came back as **482 on a 390px viewport**: the phone had shrink-to-fit
  zoomed the whole page out. Cause: `Navigation2`'s desktop `NavigationMenu` had no
  responsive hiding, so it rendered *next to* the `lg:hidden` hamburger and its intrinsic
  width pushed the layout out. Shipped live and invisible to every desktop check. **Assert
  `document.documentElement.scrollWidth === window.innerWidth === 390` on every route** — and
  when hunting the culprit, ignore elements inside `overflow-hidden` parents (the footer
  marquee is legitimately 4435px wide), because they never contribute to `scrollWidth`.

- **Never put overlay text over a screenshot of a website.** The scroll-expand section used
  the full Kaibo landing page as its full-bleed media, so that site's own headline sat under
  Zelarion's headline and both became unreadable. The original component used an abstract
  photo for exactly this reason. Fix: crop to a region of the same screenshot with no type in
  it — still genuinely the client's build, but it reads as atmosphere.

- **When the font size and the animation distance both scale in `vw`, their ratio is constant
  -- so "it fits on desktop" proves nothing.** The split headline occupies ~84% of the line at
  every width in the `5.5vw` regime, leaving ~8vw of slack per side; a 220px travel that
  looked perfect at 1440 cut the words mid-letter at 390. Cap the travel below the slack
  (7vw) and stack the halves below `sm`, where the `2rem` font floor eats the rest of the
  room. Assert the rendered `getBoundingClientRect()` of the moving text stays inside
  `0..innerWidth` at several widths — the mid-animation frame is the one that clips.

- **`DISABLE_ESLINT_PLUGIN=true CI=true npm run build` is how you isolate a compile error from
  a lint error here.** One builder's bad `eslint-disable` comment aborts the whole CRA build at
  the eslint step, before any other file is even reached, so parallel builders all report "the
  build is red" and none of them can prove their own work compiles. There is no discoverable
  `.eslintrc` to lint a single file against either -- CRA embeds `react-app` internally, so the
  ESLint Node API just errors "No ESLint configuration found".

- **A "definition of done" that contradicts the instructions above it wastes a whole agent run.**
  A brief told a builder to keep `domain: 'palattaolaw.vercel.app'` as caption text, then set a
  done-check of `grep -rn "palattaolaw\|..." frontend/src` returning nothing. Mutually
  exclusive as written. **Write the acceptance grep against the thing actually being removed**
  (`grep -n "url:"`, `grep -n "href"`), never against a substring that legitimate content also
  contains.

- **Unmounting a component to save resources replays its entrance animation on remount.**
  `TravellingCore` now tears down its WebGL canvas past the hero and remounts it on the way
  back up. `Core` seeded its damping ref from a hardcoded `REST` constant, so every remount --
  which only happens deep in the already-faded zone -- would have flashed the crystal back to
  full opacity and faded it out a second time. **Any ref holding animation state must be
  seeded from live state (`settle(scrollStore.viewportsScrolled)`), never from the at-rest
  constant.** Mount is not the same event as page load. Pair every unmount-for-perf gate with
  hysteresis too (unmount 1.4 / remount 1.1) or a scroll parked on the boundary thrashes the
  context every frame.

- **`// eslint-disable-next-line react-hooks/exhaustive-deps` FAILS the build in this repo.**
  CRA's eslint config here does not register that rule, so the disable comment itself errors
  with "Definition for rule 'react-hooks/exhaustive-deps' was not found" -- and `CI=true`
  promotes it to a hard failure. The disable comment is the defect, not the dependency array.
  Restructure the effect instead of silencing it.

- **A screenshot script that exits 0 proves nothing about what is in the frame.** Capturing
  the six client landing pages, two of six were unusable and both looked like successes:
  `yorinternational.net` was caught mid-preloader at "98% INITIALIZING", and `nogatu.store`
  had a cookie banner across the fold. Only opening the PNGs found it. **Look at every
  captured frame before encoding it.** Third-party sites need: a long fixed wait after
  `load` (a percentage preloader is not covered by `networkidle`), a scroll-down-and-back
  to trip lazy hero imagery, and an explicit consent-banner dismissal (`getByRole('button',
  {name: 'Necessary only'})`, falling back through 'Accept all' / 'Reject').

- **Some heroes are scroll-driven and have no "correct" frame.** `yorinternational.net`
  renders a marquee that bleeds off both edges, so at `scrollY: 0` it reads as the fragment
  "VEMENT". Four time-spaced captures were byte-identical because the animation is driven by
  scroll position, not time — sampling more frames cannot fix what is not animating. Scroll
  offsets change it but expose worse framing. That fragment IS the site; ship it.

- **Global `@playwright/cli` does not put `playwright` on the resolvable path.** `npm root -g`
  shows only `@playwright/cli`; the real package is nested at
  `@playwright/cli/node_modules/playwright`, and ESM ignores `NODE_PATH`. From the scratchpad,
  `require()` that absolute path from a `.cjs` file. `@playwright/test` is not installed here.

- **Anything keyed to whole-document scroll progress silently re-times when a section is
  added.** `TravellingCore` interpolated eight keyframes over `scrollStore.progress`
  (`scrollY / docHeight`), so restoring the 300vh `ScrollExpandShowcase` would have stretched
  every keyframe without any error. Scroll animations that belong to one section must key off
  **viewports scrolled** (`scrollY / innerHeight`), which is independent of page length.

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
