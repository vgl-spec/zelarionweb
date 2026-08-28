# Deploying the Zelarion backend to Render

## Service setup

- Create a new **Web Service** on Render, pointed at this repo/directory (`backend/`).
- Environment: **Node**.
- Build command: `npm install`
- Start command: `npm start`

## Required environment variables

Set these in the Render service's "Environment" settings:

| Variable        | Description                                                              |
|-----------------|---------------------------------------------------------------------------|
| `MONGO_URL`     | Full MongoDB connection string (e.g. Atlas SRV URI).                      |
| `DB_NAME`       | Database name to use (e.g. `zelarion`).                                  |
| `CORS_ORIGINS`  | Comma-separated list of allowed origins, or `*` to allow all.             |

Render automatically sets `PORT` for you — the app already reads `process.env.PORT`
and falls back to `8001` only when it's not set (e.g. for local development), so no
action is needed for that variable.

## Frontend wiring

Once this service is deployed, point the frontend's `REACT_APP_BACKEND_URL` (a Vercel
environment variable) at this Render service's URL. Frontend code changes ARE needed —
see the idempotency requirement below.

## `POST /api/demo` requires an `Idempotency-Key` header

This is a breaking change to the endpoint's contract, made to close a double-submit bug:
a double-click, a timeout-triggered retry, or a flaky connection previously created two
`demo_requests` rows for one user action.

**What the client must do:** generate the key ONCE per user intent — when the form/dialog
is opened, not on every submit attempt — and reuse that same key for every attempt of that
submission (including retries after a timeout or network error). A `crypto.randomUUID()`
string works well. Opening the form again (a new user intent) must generate a new key;
retrying a failed attempt of the same intent must NOT.

**Contract:**

| Status | Meaning |
|--------|---------|
| `400`  | `Idempotency-Key` header missing, empty, or not 1-128 characters of letters/digits/hyphens/underscores. Checked before body validation, so a request with neither a valid key nor a valid body still gets 400. |
| `422`  | Key was valid; the request body failed validation (unchanged from before). |
| `201`  | First request seen for this key: a new `demo_requests` row was created. |
| `200`  | Replay: a request with this exact key was already processed. Returns the same body the original `201` returned — no new row is created. |
| `409`  | Rare edge case: a write conflict was detected on this key but the record could not be found on re-query. Safe to retry with the same key. |

The dedupe is enforced by a unique index on `idempotency_key` in MongoDB, so it holds even
under concurrent duplicate requests, not just sequential ones.
