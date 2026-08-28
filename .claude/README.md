# `.claude/` — Project Memory & Tooling

Source-of-truth for the **Zelarion** project. The root `CLAUDE.md` is the only
file Claude Code auto-loads; it stays a **lean index** and pulls these modular docs
in via `@import`, so every session has them in context without being told to read
each one.

## Structure
```
CLAUDE.md                 # root index — overview + @imports the rules below
.claude/
  README.md               # this file
  hooks/
    lesson-guard.js       # Stop hook: enforces lesson capture after code changes
  rules/                  # canonical, domain-split source of truth (all @imported)
    conventions.md        # workflow + the self-improvement loop
    lessons.md            # APPEND-ONLY log of bugs/gotchas — never repeat a mistake
    <domain>.md           # one file per heavy domain (architecture, data model, …)
  settings.json           # registers the Stop hook (+ any allowlisted ops)
```

## How memory loads
- `@.claude/rules/<file>.md` lines in `CLAUDE.md` import each file automatically.
- **Edit the modular file**, not the index, for its domain. Keep `CLAUDE.md` thin.
- When you learn something (bug, gotcha, wrong assumption), **append to
  `rules/lessons.md`** (newest on top). The Stop hook reminds you if you forget.

## How it self-improves
Every session that changes code is asked, before it ends, whether it learned a
durable lesson. Lessons accrue in `rules/lessons.md` and load into every future
session — so the project gets harder to break over time, while `CLAUDE.md` never
bloats.
