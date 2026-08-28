# Zelarion portfolio revamp — brief

> Captured 2026-08-28 from a `/vgldesign` request. **The source message was truncated by the
> harness at 50,000 characters, mid-way through the Navigation2 component source.** Everything
> after that point — including the footer spec — was not received. Ask the requester to
> re-send the tail before treating this document as complete.
>
> Component *source* is not transcribed here: every component below is installable from its
> shadcn registry URL, so the URL is the source of truth. What IS transcribed is the part that
> is **not** recoverable from a registry: the shader graph, the DOM/CSS structure, the
> acceptance criteria, and the Zelarion-specific content.

## Goal

Revamp this site into a proper portfolio website for the company **Zelarion**.
Design reference / stack starting point: https://github.com/cloudai-x/threejs-skills
Design skill to apply: `/vgldesign`.

## Sections to build

| Section | Source | Notes |
|---|---|---|
| Navigation | `npx shadcn@latest add https://registry.watermelon.sh/r/navigation-2.json` | `Navigation2` |
| Team profiles | `npx shadcn@latest add https://registry.watermelon.sh/r/expandable-profile-card.json` | `ExpandableProfileCard`; roles below |
| FAQ | `npx shadcn@latest add https://registry.watermelon.sh/r/faq-5.json` | `Faq5`, takes a `categories` array |
| Contact (end of page) | hand-built on the `shaders` WebGPU lib | full spec below |
| Contact form (after clicking "Contact us") | `npx shadcn@latest add https://registry.watermelon.sh/r/contact-3.json` | `ProjectInquirySection` |
| 404 | `npx shadcn@latest add https://registry.watermelon.sh/r/error-7.json` | `Error7` |
| Footer | **reference implementation**, not a registry component | see below |

### Team roles (placeholder people for now)

CEO · CTO · Senior UI/UX · Chief Marketing Officer (CMO)

### Footer

Match the animated footer from the KaiboPH project at
`C:/Users/Win10/Desktop/Projects/Company/KaiboPH` — read how it is built there and port the
technique. This is the last instruction that survived truncation; anything the requester said
about the footer *after* the Navigation2 code block is missing.

## Cursor Trail Contact section — full spec

Live reference to match: https://previews.shaders.com/sections/cursor-trail-contact
Library: `npm install shaders`, import from `shaders/react`. Docs: https://shaders.com/docs/guide
Per-component props via MCP `get-shader-docs` (`npx shaders@latest install-mcp`).

**Vite note (does not apply here — this project is CRA):** never add `"shaders"` to
`optimizeDeps.exclude`; its dist has CommonJS deps needing pre-bundle interop.

### Fonts (document head)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://api.fontshare.com">
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&display=swap">
```

Satoshi 400/500/700 for body + headline (`'Satoshi', ui-sans-serif, system-ui, sans-serif`);
Geist Mono 400 for the footer row (`'Geist Mono', ui-monospace, monospace`).
**Nothing may load from `previews.shaders.com` or `data.shaders.com` at runtime.**

### Shader tree — ONE `Shader` canvas, children in exactly this order

```json
{
  "components": [
    { "type": "DotGrid", "props": {
        "id": "trailDots", "density": 40, "twinkle": 0.9, "visible": false,
        "dotSize": { "type": "map", "source": "trailFlow", "channel": "alpha",
                     "inputMin": 0, "inputMax": 1, "outputMin": 0, "outputMax": 1 } } },
    { "type": "ChromaFlow", "props": {
        "id": "trailFlow", "intensity": 1.4, "radius": 2.9, "visible": false } },
    { "type": "LinearGradient", "props": {
        "colorA": "#1e1e1f", "colorB": "#070708", "colorSpace": "hsl",
        "start": { "x": 0, "y": 1 }, "end": { "x": 1, "y": 0 } } },
    { "type": "LinearGradient", "props": {
        "colorA": "#000000", "colorB": "#ffffff", "colorSpace": "hsl",
        "start": { "x": 0, "y": 1 }, "end": { "x": 1, "y": 0 },
        "maskSource": "trailDots" } },
    { "type": "CursorRipples", "props": {} },
    { "type": "FilmGrain", "props": { "strength": 0.1 } }
  ]
}
```

**Do not break this.** Two invisible driver components carry the whole effect:
`ChromaFlow#trailFlow` renders nothing but its cursor field is sampled by `DotGrid#trailDots`
(via the `dotSize` map driver reading `trailFlow`'s alpha channel); `trailDots` in turn is the
`maskSource` of the white `LinearGradient`, which is what actually paints the trail. Both id
linkages (`dotSize.source` to the ChromaFlow id, `maskSource` to the DotGrid id) must stay
intact, and both `visible: false` components must stay in the tree — removing either one kills
the effect. Every prop is a static literal; the `dotSize` object is a built-in prop driver, not
framework state, and needs no wiring.

The `Shader` element fills its positioned parent: `position: absolute; inset: 0; width: 100%;
height: 100%; display: block`.

### Structure

```text
main   position: relative; isolation: isolate; display: flex; flex-direction: column;
       min-height: 100dvh; overflow: hidden; background: #070708; color: #fff;
       font-family: 'Satoshi', sans-serif; -webkit-font-smoothing: antialiased
|
+- div  shader wrapper — position: absolute; inset: 0; aria-hidden="true"
|   +- Shader (component tree above)
|
+- section  position: relative; z-index: 10; flex: 1; display: flex;
|           flex-direction: column; align-items: center; justify-content: center;
|           padding: 0 1.5rem; text-align: center
|   +- h2  "Got something to make?" — class reveal, --reveal-delay: 0.1s;
|   |      font-size 1.5rem, 1.875rem at >=640px; font-weight 500;
|   |      color rgba(255,255,255,0.7)
|   +- a   "Contact us" — class reveal, --reveal-delay: 0.25s; display: inline-block;
|          margin-top: 1.25rem; max-width: 100%; overflow-wrap: break-word;
|          font-size: clamp(2.2rem, 7vw, 6rem); line-height: 1.05; font-weight: 700;
|          letter-spacing: -0.02em; color #fff, hover rgba(255,255,255,0.85).
|          Acts as the hover group.
|       +- span  underline — display: block; margin: 0.5rem auto 0; height: 3px;
|                width 0, parent-hover width 100%; background rgba(255,255,255,0.7);
|                transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1)
|
+- footer  class reveal, --reveal-delay: 0.45s; position: relative; z-index: 10;
           display: flex; flex-wrap: wrap; align-items: center;
           justify-content: space-between; gap: 1rem;
           padding: 0 1.5rem 2.25rem (>=640px: 0 3rem 2.25rem);
           font-family 'Geist Mono'; font-size 0.75rem; letter-spacing 0.18em;
           text-transform: uppercase; color rgba(255,255,255,0.4)
    +- div  socials — display: flex; gap: 1.75rem — Instagram / Are.na / GitHub,
    |       each transition color, hover #fff
    +- p    "( move your cursor )" — display: none below 640px
```

The underline grows from the centre because it is centred with `margin-inline: auto` while
`width` animates from 0 to 100%.

### Behaviour

- **Cursor trail is the point of the section.** No JS event wiring — `ChromaFlow` and
  `CursorRipples` track the cursor internally.
- **Reveal:** `.reveal` = `opacity: 0; transform: translateY(14px)` animating to `opacity: 1;
  transform: none`, keyframes over **1.1s**, `cubic-bezier(0.16, 1, 0.3, 1)`, `fill-mode:
  forwards`. Stagger via `--reveal-delay`: 0.1s heading / 0.25s CTA / 0.45s footer.
- **Reduced motion:** under `prefers-reduced-motion: reduce` the reveal is disabled entirely —
  content renders fully visible with no transform.
- **Breakpoint 640px:** heading 1.5rem to 1.875rem; footer horizontal padding 1.5rem to 3rem;
  the "( move your cursor )" hint hidden below, shown at/above. The CTA scales fluidly via
  `clamp(2.2rem, 7vw, 6rem)` and wraps via `overflow-wrap: break-word`.

### Acceptance

- Fills the viewport (`min-height: 100dvh`), near-black `#070708`, with the corner gradient
  and film grain visible **before any interaction**.
- Moving the cursor paints a white twinkling halftone dot trail that fades, with chromatic
  ripple fringes — shader tree matching the JSON above exactly, both invisible components
  present, both id linkages intact.
- Reveal delays 0.1 / 0.25 / 0.45s; reduced-motion users get static content.
- CTA hover dims the text and grows the centred 3px underline to full width over 0.5s; footer
  links brighten to white.
- The giant CTA points at Zelarion's real contact destination and the socials at real
  profiles — or stay `#` placeholders if none supplied. **No runtime hotlinking to
  shaders.com domains.**
- On touch devices (no cursor) the section still reads as finished: dark gradient + grain,
  content legible and centred.
- **If WebGPU is unavailable the content layer still renders and functions** on plain
  `#070708`; the canvas degrades without breaking layout.

## Open questions for the requester

1. The brief was truncated — what came after the Navigation2 source?
2. Real contact destination for the giant CTA (mailto / route / form)?
3. Real social profile URLs (the spec names Instagram, Are.na, GitHub)?
4. Real names, photos, and bios for CEO, CTO, Senior UI/UX, CMO — placeholders until then.
5. `shaders` requires WebGPU. This project is CRA + React 18; confirm the WebGPU-less
   fallback (plain `#070708`) is acceptable for the browsers Zelarion cares about.
6. The registry components are written for shadcn + `@/components/base-ui/*` + TypeScript.
   This project is plain JSX with no shadcn setup and only `components/ui/button.jsx`.
   Confirm: add shadcn + TypeScript, or hand-port each component to JSX?
