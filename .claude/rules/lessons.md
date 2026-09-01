# Lessons Learned (append-only)

> Auto-loaded into every session via `@import` from CLAUDE.md. When a bug, wrong
> assumption, or environment gotcha is found, APPEND it here (newest at top). This
> is the project's growing memory — it exists so the same mistake never repeats.
>
> Format: one bold takeaway per bullet, then the mechanism/cause and the fix.
> Keep it to what a future session needs to avoid the trap — not a changelog.

## 2026-09-01 (unlisted is not private)

- **An unlinked route is UNLISTED, never private.** /team is absent from the header, the
  footer and the sitemap and carries `noindex`, but it is still public to anyone who types
  the path, and its content ships inside the JS bundle. Say that plainly rather than
  letting "hide it" be heard as "make it private". Anything genuinely confidential needs a
  server, not a routing decision.

- **Names in a statically imported page land in the MAIN bundle, downloaded on every
  route.** `grep -c "<name>" build/static/js/main.*.js` returned 1 — so every visitor to
  the home page was fetching the roster. `React.lazy` moved it into a 4 KB chunk that only
  a /team visitor requests. The route table could then no longer build the page's JSON-LD
  (that needs a static import of the names), so the page renders its own `<Seo>` and the
  shell skips its own when a route supplies no `title`.

- **Per-route `<meta name="robots">` must be RESTORED on unmount.** index.html ships one
  site-wide `index, follow`; a route that overrides it to `noindex` leaks that to every
  page reached by client-side navigation afterwards, because there is no document reload to
  reset it. The effect cleanup has to put the original value back, and the test has to
  navigate AWAY via a real in-page click to catch it.

- **Choose the reversible direction on anything a crawler might keep.** Getting a person's
  name out of a search index is slow and unreliable; adding it later is instant. So an
  unlisted people page defaults to `noindex`, and indexing is the deliberate opt-in.

- **A test's own PRECONDITION guard can be the flaky part.** "row was not drifting before
  the hover" failed 1 in 7 — not the product, but a single fixed-delay sample racing an
  IntersectionObserver callback that had not fired yet. Poll for the state the assertion
  depends on instead of assuming a delay is long enough.

- **Aiming a click at a container's centre can land in the GAP between its children.**
  After fixing the poll, `elementFromPoint` at the row centre sometimes found no button at
  all, and "clicking a tile did not open a dialog" looked exactly like a broken handler.
  Clicking a gap correctly does nothing. Compute the nearest CHILD's centre and click that.

- **When a removed feature comes back, invert its old assertion rather than deleting it.**
  `verify.cjs` still asserted "/team renders the 404 view" from when the route was dropped.
  The route is deliberately back, so the check now asserts it renders real content AND that
  nothing links to it — the new intent stays guarded instead of going untested.

## 2026-09-01 (later: an idle rAF loop is not free)

- **An always-running `useAnimationFrame` loop made a DIFFERENT component's timing test
  flake 1 run in 3.** `CapabilityWall` ran two rAF loops (plus a `useVelocity` spring
  each) for the life of the page, on every route, whether or not the section was on
  screen. `verify-hover` then intermittently reported "opened before the 650ms delay
  elapsed" -- a `setTimeout` cannot fire early, so the real cause was main-thread pressure
  skewing the test's own clock relative to the page's. Gating both loops on an
  `IntersectionObserver` (`rootMargin: '200px 0px'`, read through a ref so the observer
  never re-renders the row) took it to 5/5 green. **A flaky test in an untouched component
  can be the honest signal that the component you DID add is too expensive.** Read a new
  intermittent failure as evidence about the change, not as noise to re-run past.

- **Structured data naming people must be backed by visible page content.** Adding four
  named `employee` entries to the Organization JSON-LD while the site had no team surface
  at all is the "marked-up content is not visible to readers" pattern Google's own
  guidelines call out. The fix is not to drop the markup -- it is to render the same names
  and the same `addressLocality` on the page, and assert the two agree
  (`document.body.innerText.includes(person.name)` per entry).

- **`sameAs` linked nowhere on the page is a weak entity signal.** A profile asserted only
  to the crawler is worth less than one a visitor can click. Ship the visible link and the
  `sameAs` entry together, and assert the `href` matches the `sameAs` string exactly so
  they cannot drift apart.

- **A knowledge panel is not markup and cannot be built.** It comes from Google's
  Knowledge Graph, which is fed by independent corroboration (Wikipedia/Wikidata,
  Crunchbase, LinkedIn, press). Canva's panel literally prints "Source: Wikipedia". For a
  small studio the achievable equivalent is a verified Google Business Profile plus
  consistent `sameAs`; promising the Canva-style Founders/HQ/Founded panel would be
  promising something no code change can deliver.

## 2026-09-01 (a short row is an empty row)

- **A parallax row narrower than the viewport PLUS its own travel slides clean off the
  screen.** Restoring the hero wall with 11 screens split 4/4/3 looked right at scroll 0
  and left an **840px void** on the left of the bottom row at the deepest snap stop --
  the same "big empty space" the client review had already called out once. The reference
  layout uses five per row for exactly this reason: five 480px cards plus gaps is 2720px,
  which still covers a 1440px viewport after a 1000px translate; three cards is 1600px and
  cannot. **Measure the gap at every snap stop, not just at rest** -- `Math.max(0, left)`
  and `Math.max(0, innerWidth - right)` per row across the scroll turned an argument about
  taste into five lines of numbers. Cycle the list to fill the row rather than shipping a
  short one.

- **Playwright checks element stability BEFORE it dispatches the hover, so `.click()` can
  never trigger a hover-to-pause.** A drifting marquee timed out with "element is not
  stable" 58 times. That is a chicken-and-egg in the TEST, not proof of a product bug --
  drive `page.mouse.move()` by hand, wait, then click. But the timeout did surface a real
  defect underneath: a row that never stops is a moving click target. Pause on
  `mouseenter` AND `onFocusCapture` (focus does not bubble, so a tile taking keyboard
  focus would otherwise slide out from under itself).

- **Aim a pointer test at the CONTAINER's centre, never at `.first()` of a moving list.**
  The first tile in DOM order had drifted to `x = -1758`, so `mouse.move` went outside the
  viewport and `elementsFromPoint` returned `[]` -- the assertion was measuring nothing.
  `document.elementFromPoint(...).closest('button')` finds whatever is genuinely under the
  cursor instead.

- **An exponential ease is still moving when a naive test samples it.** The pause decays
  ~7% per frame and snaps to zero at ~1.2s; sampling at 800ms caught 2.14px of residual
  glide and reported a failure about the easing curve rather than about whether the row
  stops. Know the settle time of your own animation before choosing the sample window.

- **`aspect-[16/9]` over a 1440x900 capture crops 11% off the bottom.** The project tiles
  had carried the mismatch since they were built, silently violating an explicit
  "show the whole screenshot" requirement. Match the box to the source ratio (`8/5`)
  rather than trusting that a 16/9 frame is a safe default for screenshots.

- **A suite that "crashes" may just be pointed at the wrong port.** Six of seven verify
  scripts exited with a stack trace and `name: 'Error'`; every one defaulted to `:4188`
  while the server was on `:4193`. `grep -E "FAIL|Error"` hid the actual message
  (`navigating to "http://127.0.0.1:4188/"`) which was one line further up. Read the whole
  error before concluding a change broke anything.

- **`npx serve -l <port>` silently ignored the port** and bound 53458. A 30-line node
  static server is more predictable and lets you set MIME types (which the XML/manifest
  download trap needs anyway). Resolve its root with `path.resolve` -- a Git-Bash
  `pwd -W` path mixes separators and a naive `startsWith` guard 403s everything.

## 2026-08-31 (a bare link preview is a CACHE, not a bug)

- **"The Messenger preview shows nothing" almost never means the tags are wrong.**
  Every check against the live domain passed -- DNS resolved, `www` and apex both
  answered, the apex 308'd to www, all 15 OG/Twitter tags were in the served HTML,
  `og-image.png` returned 200 as a 162 KB `image/png`, and the JS and CSS bundles
  both loaded. The site was completely healthy. Facebook caches its scrape PER URL,
  so moving to a new domain means the new URL has either never been fetched or was
  fetched once while it was still mid-propagation and the empty result stuck.
  **Fetch the page with `curl -A "facebookexternalhit/1.1 ..."` before touching any
  markup** -- if the tags come back, the markup is done and the fix is a re-scrape in
  the Sharing Debugger, which only the site owner can trigger.

- **A brand written several ways in the wild needs `alternateName`, not meta
  keywords.** "Zelarion PH", "Zelarion Tech", "Zelarion IT" appeared in NO crawlable
  surface, so a search for any variant had nothing to bind to the entity. Google has
  ignored `<meta name="keywords">` since 2009; the tag that teaches it name variants
  is `alternateName` on the `Organization` JSON-LD. Ship both if asked, but comment
  which one is load-bearing so a future reader does not maintain the dead one.

## 2026-08-30 (domain move, shader coverage)

- **A canvas can be exactly the right SIZE and still not COVER.** The contact shader's
  canvas measured identical to its section at every width and across a resize -- every
  geometric assertion passed -- yet the right-hand sixth of the page rendered near black.
  The cause was inside the fragment shader: `uv` is normalised by the SHORT side, so a
  2.6:1 section pushes the corners to |uv| = 2.8, past where the ring field still has
  energy. Element bounds are not coverage. Measure emitted BRIGHTNESS across the frame
  (crop a band, average per column) -- mean went 47 mid-frame to 10 at the right edge, which
  is the number that actually described the complaint.

- **A section shorter than the viewport leaves its decorative background looking cut.** The
  contact form is about 1090px tall; on a tall or zoomed-out window the section ended above
  the fold and the backdrop stopped with it, leaving flat black between it and the footer.
  Any section carrying a full-bleed background needs a min-height, not just padding.

- **`site:<domain>` is the first thing to check before touching SEO.** zelarion.tech
  returned ZERO indexed pages, so no amount of meta-tag work could have made it appear in
  results: Google had never crawled it. Establish whether a site is indexed at all before
  attributing invisibility to markup.

- **A hardcoded canonical domain spreads further than it looks.** Moving from the Vercel
  deployment URL to the real domain touched 18 occurrences across index.html, robots.txt,
  sitemap.xml and the Seo component, plus the rendered share card, which prints the domain
  as artwork and had to be regenerated. Keep a single constant per layer and grep for the
  literal before assuming it is contained.

## 2026-08-30 (SEO, mobile scale, money input)

- **Google does not render SVG favicons.** Its supported formats are BMP, GIF, ICO, PNG,
  JPEG, PPM and TIFF. This site shipped an SVG-only `rel="icon"`, so no favicon could ever
  appear beside a search result no matter how well the rest of the page ranked. PNGs at
  48/96/192 now sit alongside it (Google wants square, at least 48px, at a URL that does not
  change). The SVG stays first because browsers prefer it in the tab.

- **Social crawlers do not execute JavaScript, so a React-injected meta tag is invisible to
  them.** Facebook, Messenger and LinkedIn read the served HTML. In a CRA single-page app
  that is one `index.html` for every route, which means the Open Graph tags have to be
  STATIC and complete there; the per-route component can only serve Google, which does
  render. Getting this backwards produces link previews that silently fall back to a bare
  URL while every local check passes.

- **Read what is actually in `public/index.html` before assuming it is fine.** This site had
  been serving `"Zelarion runs your entire test suite on every commit and returns a
  pass/fail verdict in 90 seconds"` as its meta description and `"Ship with proof, not
  hope."` as its title for the life of the project. Boilerplate from an unrelated template,
  and the single most visible string in a search result.

- **`min-height` does nothing on a non-replaced inline element.** The mobile nav links
  carried `min-h-[44px]` and measured 42px, because react-router renders a plain `<a>`,
  which is `display: inline`. Same for the footer pills and the logo. The class looked like
  the accessibility work had been done and no assertion had ever checked it. Add `flex` or
  `block` alongside any `min-h-*` on a link.

- **Measure the type scale before standardising it.** An audit of computed font sizes at
  390px found body copy at 15, 16, 17, 18 AND 20px, and the same tier of section heading at
  30, 32, 36 and 48px, because every section had arrived at its own clamp independently.
  Nothing in the source looked wrong file by file; only the collected numbers showed it. The
  scale now lives once in `tailwind.config.js` as named `text-h1/h2/h3/body/meta/eyebrow`.

- **A grouped money input has to store raw digits and group only for DISPLAY.** Keeping the
  formatted string in state means every reader (validation, the payload, the max check) has
  to strip separators, and one that forgets sends `"1,500,000"` to a server expecting a
  number. Store digits, render `toLocaleString`, and restore the caret by counting DIGITS
  before it rather than characters: separators are rewritten on every keystroke, so a
  character offset drifts and typing into the middle of a number throws the caret to the end.

- **`page.goto` on an XML or manifest URL throws "Download is starting".** The local static
  server had no MIME type for `.xml`, so it served `application/octet-stream` and Chromium
  downloaded rather than rendered it, crashing the suite. Use `context.request.get` for any
  non-HTML file; it reports a status instead of navigating.

- **Retire an assertion together with the feature it guards.** After the contact photo was
  removed on request, `verify-photos` still asserted it rendered, and reported a failure for
  work that was correct. A stale red is as costly as a false green: it trains you to skim
  the output.

## 2026-08-30 (hover intent + a grid that was already full)

- **Read the WHOLE container before adding a child to a grid.** `ProjectInquirySection`
  is `lg:grid-cols-5` holding a `lg:col-span-3` form and a `lg:col-span-2` aside -- five of
  five. A grep for `lg:grid` and `lg:col-span-3` showed the form and looked like two spare
  columns, so a third `col-span-2` child went in; 3+2+2 overflows, it wrapped to a second
  row, and a large photograph ended up orphaned underneath the form. The user spotted it in
  a screenshot. **Grep found the class I was looking for and hid the one that mattered.**

- **A test that only asks "did the image render" cannot see that it rendered in the wrong
  place.** The contact check asserted loaded / decorative / hidden-at-390px and passed with
  the image stranded on a second grid row. Position is a property worth asserting: the fix
  added `img.left >= form.right` and a count of the grid's direct children, and both fail
  loudly against the broken build.

- **"A mousemove fired" is not evidence the viewer moved the pointer.** Scrolling a tile
  under a stationary cursor makes the browser dispatch mousemove with the SAME clientX/
  clientY, so a movement guard keyed on the event alone still opened previews during a
  scroll. Compare coordinates against the last recorded position and ignore unchanged ones.
  Pair it with a scroll-quiet window, because a trackpad scroll with a few pixels of cursor
  drift produces genuine movement and only the quiet test rejects that.

- **A guard that only arms on `mouseenter` strands the element it protects.** Once a scroll
  parks a tile under the cursor, mouseenter has already fired and will never fire again
  while the pointer stays inside, so the tile could not be opened at all without leaving and
  coming back. Start the intent timer from `mousemove` over the element as well as from
  enter, so a deliberate move inside it still counts as intent.

- **Anchor a scripted patch on structure, not on a long comment you wrote earlier.** A
  removal keyed to a five-line comment failed on a single word ("right-hand grid columns"
  vs "right-hand columns"). Anchor on the unique class list and walk the tag depth to find
  the block end. Same run, the failure was invisible because the patch and the build were
  chained in one backgrounded command -- exactly the trap already recorded above, hit again.

## 2026-08-30 (photography pass)

- **A blend mode is tuned to the backdrop it was chosen for, so swapping the media
  invalidates it.** `ScrollExpandShowcase`'s headline used `mix-blend-difference`, which was
  right for the near-black cube lattice: inverting near-black gives near-white. Against a
  photograph it inverts to mid grey, AND the value changes across the frame, so half the
  line read brighter than the other half. Nothing errored and the headline was still
  technically visible, it just went muddy. When you replace the image behind text, re-check
  every blend mode, filter and scrim that was calibrated against the old one.

- **Contrast measured from a screenshot that still contains the text is meaningless.**
  The first measurement reported a brightest backdrop luminance of 0.84 and a failing 2.53:1
  -- that 0.84 was the white glyphs inside the crop. Hide the text layer
  (`visibility: hidden` on the h2/h3/p), re-shoot, and measure the bare backdrop: the real
  numbers were 5.91:1 for body text and 14.93:1 for the heading. **The thing you are
  measuring against must not be in the sample.**

- **Plugin skill symlinks arrive as plain text files on a Windows checkout.** The
  `ui-ux-pro-max` skill's `scripts` and `data` entries were 31 and 34 byte FILES whose
  contents were `../../../src/ui-ux-pro-max/scripts`. `python .../scripts/search.py` failed
  with "No such file or directory" and the directory listing showed them as regular files
  with plausible sizes. `cat` the entry to get the real target, then run from
  `<plugin>/src/...` instead of the `.claude/skills/...` facade.

- **Portrait imagery that is right on a desktop grid is half a phone viewport.** Four 3:4
  process cards at four columns is a strong sequence at 1440px; stacked at 390px each one is
  456px of a 844px screen and the section becomes mostly photograph. Give phones a landscape
  crop of the same file (`aspect-[4/3] sm:aspect-[3/4]`) rather than shrinking the card or
  dropping the image.

## 2026-08-30 (later)

- **`preventDefault` on a wheel event does NOT stop Lenis.** Lenis registers its own
  listener first, so by the time a later-mounted component's handler runs, Lenis has
  already taken the delta; preventDefault only cancels the BROWSER's scroll.
  `stopImmediatePropagation` cannot help either, for the same ordering reason. The only
  way to cancel a gesture is to actively re-pin the page (`scrollTo(stop, {immediate:
  true})`). Missing that is what made the first stepped-scroll attempt feel flaky: the page
  was rock solid DURING a snap -- when Lenis's own `scrollTo` owns the position and drops
  input -- and slid freely in every gap between snaps, so it read as intermittent.

- **Lenis stops any running animation on every touch event it sees.** A snap fired from
  `touchmove` was killed by the next `touchmove` about 185px into a 400px step, stranding
  the page between two stops -- and it looked like a maths bug, not a lifecycle one. The
  event trace was unambiguous: `tm 47 0 true` (prevented, at scroll 0), a burst of scroll
  events to 185, then eleven more touchmoves with the page frozen. Fix: record the swipe's
  intent during `touchmove` and fire the step on `touchend`, when no further touch events
  can cancel it. Hold the page with an immediate `scrollTo` during the swipe so it is
  visibly locked rather than sliding and snapping back.

- **A test that locates an element by a style it happens to have will silently retarget.**
  The contact CTA's underline was found with "first span whose transform is a matrix". Then
  the arrow badge gained `translate-y`, became the first match, and the assertion started
  reading `matrix(1,...)` -> `scaleX 1` and passing unconditionally -- it could no longer
  fail even with the underline scaled to zero. Give the element a `data-testid` and address
  it directly. A green check on the wrong node is worse than no check.

- **A flex sibling next to a headline that wraps drops onto its own line.** The CTA's arrow
  badge sat beside the text in a `flex flex-wrap` row; once "Got something to make?" broke
  across two lines, the badge fell below "make?" and read as a stray circle. Put the badge
  INSIDE the text span as an inline element, sized in `em` so it tracks the type, and it
  rides the last word at every breakpoint.

- **`justify-between` centres the middle of three items only when the outer two are the
  same width.** The footer's studio pill sat right of centre because the copyright line is
  far wider than the 48px back-to-top button. Equal-width grid columns
  (`md:grid-cols-3` + `justify-self-*`) put it on the page's centre line regardless.

- **A 1.67 MB PNG dropped into `public/assets` ships to every visitor.** `heroBG.png`
  re-encoded to WebP at 1600px wide is 54 KB, a 97% cut with no visible loss. Everything in
  `public/` is deployed, so the master does not belong there next to its optimised copy --
  same trap as the 1.4 MB logo and the 17 MB "webm".

## 2026-08-30

- **Wheel input is DISCARDED while a Lenis programmatic `scrollTo` is running.** A scroll
  snapper built the obvious way -- wait for the page to go idle, then tween to the nearest
  stop -- chains Lenis's own ~1.15s inertia in FRONT of the snap, so one gesture took about
  2.5 seconds end to end, and any second gesture that arrived during the tween vanished. An
  event trace (`scroll` + `wheel` with timestamps, runs of `scroll` collapsed) showed it
  plainly: `W @2615ms y=740` followed by 45 scroll events all reading 740. Fix: react on the
  `wheel` event itself and re-target Lenis immediately. No `preventDefault` is needed or
  wanted -- Lenis owns the position for the tween's duration and swallows the delta for you,
  and preventDefault would not have stopped Lenis anyway (it registers its own listener
  first, so `stopImmediatePropagation` from a later-mounted component never fires in time).

- **A `vh`-multiple height on a container whose content is sized in px can only be right at
  one window height.** `HeroParallax`'s `h-[300vh]` ran 656px past its last card row at
  1440x900, so the middle of the hero scroll was a completely blank screen -- the client's
  review called it out as "very big empty space for what". Card rows are `h-96` etc, fixed
  px, so the natural content height is viewport-independent; the container's was not. Fix:
  drop the fixed height, let it size to content, and add the bottom padding the `+160px`
  settle needs so `overflow-hidden` cannot clip the last row.

- **A snap stop has to be a state with something ON it.** `ScrollExpandShowcase` progress
  0.62 is "headline finished fading out, body copy has not started fading in" -- a full
  screen of image and no words. It is a legitimate frame to pass THROUGH and a terrible one
  to park on. Enumerate the keyframes and ask what is readable at each before making it a
  resting position; the answer collapsed four showcase stops to two.

- **A file-size outlier in a batch of screenshots is the cheapest blank-frame detector
  there is.** Sixteen frames at 250-800 KB and one at 40 KB: the 40 KB one was the empty
  hero screen above. Same tell as the 0-byte ffmpeg outputs and the 2.8 KB 404 page from
  earlier sessions. `ls -l | awk '{print $5, $9}'` before opening anything.

- **Once a scroll snapper is live you cannot screenshot a mid-animation frame with
  `window.scrollTo`** -- the idle park drags you back to the nearest stop and you get a
  byte-identical copy of the stop frame (that is how it was noticed: two files with exactly
  equal sizes). Fire a real gesture and sample DURING the glide instead. Related: plain
  `window.scrollBy` proves nothing on this site at all, because Lenis rewrites the scroll
  position every frame and simply undoes it -- a "touch scrolling works" test built on
  `scrollBy` passed while testing nothing. Use CDP `Input.dispatchTouchEvent` for touch.

- **Never background a compound command whose first half has to succeed.** A `python ... ;
  cd frontend && build` run with `run_in_background` swallowed a `ValueError: substring not
  found` from the patch step; the build still exited 0, the test file still held its OLD
  assertions, and the resulting failure looked exactly like a product bug (it named a snap
  stop that had just been deleted). Ten minutes went into debugging working code. Check the
  task output for `Traceback` before believing a test result.

- **`\n` inside a bash heredoc that feeds a Python string can arrive as a real newline.**
  A generated `console.log('\n== header ==')` came out split across two lines and the
  whole `.cjs` died with `SyntaxError: Invalid or unexpected token`. When generating code
  through two layers of quoting, run the output file before trusting it -- and prefer
  `chr(92)` over stacked backslashes.

## 2026-08-28

- **Hover previews must not treat ambient scroll as a dismissal signal when Lenis owns momentum.**
  A scroll-to-dismiss handler conflicts with Lenis's continued motion and closes a freshly
  opened card without user intent. Keep non-modal previews dismissible through explicit
  intent instead: pointer exit, backdrop, Escape, or a close control.

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
