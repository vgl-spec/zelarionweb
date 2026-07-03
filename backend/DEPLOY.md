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
environment variable) at this Render service's URL. No frontend code changes are needed.
