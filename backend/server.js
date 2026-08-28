import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { pathToFileURL } from 'url';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Opaque client-generated token (UUID and similar formats fit comfortably). Bounded to
// 128 chars and restricted to a safe charset so it can't be used to smuggle control
// characters/newlines into logs or the unique index, and can't grow unbounded in storage.
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Validate the Idempotency-Key header value. Fails closed: anything that isn't a
 * single well-formed token (missing, empty, wrong type, too long, bad charset) is invalid.
 */
function isValidIdempotencyKey(value) {
  return typeof value === 'string' && IDEMPOTENCY_KEY_RE.test(value);
}

/**
 * True only when a MongoDB duplicate-key error (11000) is specifically a collision on
 * the idempotency_key unique index — never treat a duplicate on some other index (e.g. a
 * future unique email constraint) as an idempotent replay.
 */
function isIdempotencyKeyConflict(err) {
  return (
    err &&
    err.code === 11000 &&
    !!err.keyPattern &&
    Object.prototype.hasOwnProperty.call(err.keyPattern, 'idempotency_key')
  );
}

/**
 * Shape a stored demo_requests document into the API response. Both the first-write
 * (201) and replayed (200) responses are built from this single helper so they cannot
 * drift apart. idempotency_key is deliberately omitted: it's a client-supplied token,
 * not data about the demo request.
 */
function toDemoResponse(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    company: doc.company,
    team_size: doc.team_size,
    preferred_date: doc.preferred_date,
    message: doc.message,
    created_at: doc.created_at,
  };
}

/**
 * Validate the demo request payload.
 * Returns an array of { field, message } errors (empty array = valid).
 */
function validateDemoPayload(body) {
  const errors = [];
  const b = body || {};

  const requiredStringField = (field, maxLen) => {
    const value = b[field];
    if (value === undefined || value === null) {
      errors.push({ field, message: `${field} is required` });
      return;
    }
    if (typeof value !== 'string') {
      errors.push({ field, message: `${field} must be a string` });
      return;
    }
    if (value.length < 1 || value.length > maxLen) {
      errors.push({ field, message: `${field} must be between 1 and ${maxLen} characters` });
    }
  };

  requiredStringField('name', 120);

  if (b.email === undefined || b.email === null) {
    errors.push({ field: 'email', message: 'email is required' });
  } else if (typeof b.email !== 'string' || !EMAIL_RE.test(b.email)) {
    errors.push({ field: 'email', message: 'email must be a valid email address' });
  }

  requiredStringField('company', 160);
  requiredStringField('team_size', 60);

  if (b.preferred_date !== undefined && b.preferred_date !== null && typeof b.preferred_date !== 'string') {
    errors.push({ field: 'preferred_date', message: 'preferred_date must be a string' });
  }

  if (b.message !== undefined && b.message !== null) {
    if (typeof b.message !== 'string') {
      errors.push({ field: 'message', message: 'message must be a string' });
    } else if (b.message.length > 1000) {
      errors.push({ field: 'message', message: 'message must be at most 1000 characters' });
    }
  }

  return errors;
}

/**
 * Build the Express app given a MongoDB Database handle.
 */
export function createApp(db) {
  const app = express();

  const corsOriginsEnv = process.env.CORS_ORIGINS;
  let corsOrigin = true;
  if (corsOriginsEnv && corsOriginsEnv !== '*') {
    corsOrigin = corsOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean);
  }

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'zelarion' });
  });

  app.post('/api/demo', async (req, res, next) => {
    try {
      // Key check runs before payload validation: a request with neither a valid key
      // nor a valid body must fail closed on the key (400), not fall through to the
      // payload validator (422). This is the endpoint's first line of defense against
      // double-submits, so it takes priority over shape-of-body concerns.
      const idempotencyKey = req.get('Idempotency-Key');
      if (!isValidIdempotencyKey(idempotencyKey)) {
        return res.status(400).json({
          detail: [
            {
              field: 'idempotency_key',
              message:
                'Idempotency-Key header is required and must be 1-128 characters of letters, digits, hyphens, or underscores',
            },
          ],
        });
      }

      const errors = validateDemoPayload(req.body);
      if (errors.length > 0) {
        return res.status(422).json({ detail: errors });
      }

      const { name, email, company, team_size, preferred_date, message } = req.body;

      const doc = {
        name,
        email,
        company,
        team_size,
        preferred_date: preferred_date === undefined ? null : preferred_date,
        message: message === undefined ? null : message,
        created_at: new Date().toISOString(),
        idempotency_key: idempotencyKey,
      };

      try {
        const result = await db.collection('demo_requests').insertOne(doc);
        return res.status(201).json(toDemoResponse({ _id: result.insertedId, ...doc }));
      } catch (err) {
        if (!isIdempotencyKeyConflict(err)) {
          throw err;
        }

        // Lost the race on the unique index: another request with this same key already
        // committed. Re-query outside the failed insert (Mongo doesn't abort a
        // surrounding transaction here the way Postgres would, but the failed insertOne
        // itself left no state to reuse) and hand back the winner's record verbatim.
        const existing = await db.collection('demo_requests').findOne({ idempotency_key: idempotencyKey });
        if (!existing) {
          // Should be unreachable: the write that caused our conflict must have
          // committed. If it's genuinely gone, don't fabricate a success — surface a
          // clean conflict so the client retries rather than trusting a made-up 200.
          return res.status(409).json({
            detail: [{ field: 'idempotency_key', message: 'Conflicting request could not be resolved; retry' }],
          });
        }
        return res.status(200).json(toDemoResponse(existing));
      }
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/demo/count', async (req, res, next) => {
    try {
      const count = await db.collection('demo_requests').countDocuments({});
      res.status(200).json({ count });
    } catch (err) {
      next(err);
    }
  });

  // Basic error handler fallback
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ detail: [{ field: 'server', message: 'Internal server error' }] });
  });

  return app;
}

/**
 * Create the indexes demo_requests depends on for correctness. Kept separate from
 * createApp (which must stay synchronous) so callers can await it before serving traffic.
 *
 * The unique index is scoped with a partialFilterExpression to documents where
 * idempotency_key is actually a string. Rows written before this field existed have no
 * idempotency_key at all, and MongoDB indexes a missing field as null — a plain unique
 * index would treat every one of those legacy rows as colliding on that same null value
 * and start rejecting inserts (or fail to build at all on existing data). Restricting the
 * index to { $type: 'string' } makes it invisible to legacy rows entirely.
 */
export async function ensureIndexes(db) {
  await db.collection('demo_requests').createIndex(
    { idempotency_key: 1 },
    {
      unique: true,
      partialFilterExpression: { idempotency_key: { $type: 'string' } },
    }
  );
}

// Only run the server when this file is executed directly (not when imported by tests).
const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  dotenv.config();

  const { MONGO_URL, DB_NAME, PORT } = process.env;

  if (!MONGO_URL) {
    console.error('FATAL: MONGO_URL environment variable is not set.');
    process.exit(1);
  }

  const dbName = DB_NAME || 'zelarion';

  const client = new MongoClient(MONGO_URL);

  client
    .connect()
    .then(async () => {
      const db = client.db(dbName);
      await ensureIndexes(db);
      const app = createApp(db);
      const port = PORT || 8001;
      app.listen(port, () => {
        console.log(`zelarion-backend listening on port ${port}`);
      });
    })
    .catch((err) => {
      console.error('FATAL: Failed to connect to MongoDB.', err);
      process.exit(1);
    });
}
