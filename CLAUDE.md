# CLAUDE.md

Zelarion marketing site. Two independent packages, no root manifest — run every command
from inside `frontend/` or `backend/`.

## Commands

```bash
# frontend/ — CRA (react-scripts 5), React 18 JSX, Tailwind 3
npm start                 # dev server
npm run build             # production bundle
npm test                  # CRA/jest watch mode (no frontend tests exist yet)

# backend/ — Express 4 ESM + MongoDB driver
npm run dev               # nodemon server.js
npm start                 # node server.js
npm test                  # jest + supertest + mongodb-memory-server
npm test -- demo.test.js  # single file
```

## Architecture

- Scroll is globally coupled: `SmoothScroll` (Lenis) and `TravellingCore` (R3F) both read
  `frontend/src/lib/scrollStore.js`. Section components assume that shared timeline exists.
- The backend is one file. `backend/server.js` holds validation, routes, and the error
  middleware; `buildApp(db)` is exported so tests inject an in-memory Mongo.

## Don'ts

- Don't put anything secret in `frontend/` — CRA inlines it into the public bundle.
- Don't add a formatter/linter as a side effect of an unrelated change; neither package has one.

## In-flight work

A full portfolio redesign is specified in `docs/zelarion-revamp-brief.md`. Read it before
changing anything under `frontend/src/`.

## Project memory (auto-loaded)

@.claude/rules/conventions.md
@.claude/rules/code-quality.md
@.claude/rules/engineering-standards.md
@.claude/rules/idempotency-concurrency.md
@.claude/rules/lessons.md
