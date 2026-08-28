import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { pathToFileURL } from 'url';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ISO-4217 codes the budget selector offers. Unlike project_type (free text), currency
// is a closed set -- fail closed on anything outside it per idempotency-concurrency.md
// rule 14 (unrecognized enum in a validation chain = reject, never pass).
const SUPPORTED_CURRENCIES = new Set(['PHP', 'USD', 'EUR', 'GBP', 'AUD', 'SGD', 'CAD', 'JPY', 'AED']);

const BUDGET_AMOUNT_MAX = 100_000_000;

// Every field POST /api/demo will accept. Anything else in the body is rejected (rule 9:
// unknown fields at the boundary are rejected, not silently dropped or coerced).
const KNOWN_DEMO_FIELDS = new Set([
  'name',
  'email',
  'company',
  'team_size',
  'preferred_date',
  'message',
  'project_type',
  'budget_currency',
  'budget_amount',
]);

// Strip control characters (\x00-\x1F, \x7F) and trim. `message` is the one field where
// a line break is legitimate content (a multi-line project description), so its \n/\r are
// preserved -- every other field is single-line and any control character in it, newlines
// included, is stripped.
const CONTROL_CHARS_RE = /[\x00-\x1F\x7F]/g;
const CONTROL_CHARS_EXCEPT_NEWLINES_RE = /[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g;

function sanitizeString(value, { allowNewlines = false } = {}) {
  if (typeof value !== 'string') return value;
  const stripped = value.replace(allowNewlines ? CONTROL_CHARS_EXCEPT_NEWLINES_RE : CONTROL_CHARS_RE, '');
  return stripped.trim();
}

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
    project_type: doc.project_type,
    budget_currency: doc.budget_currency,
    budget_amount: doc.budget_amount,
    created_at: doc.created_at,
  };
}

/**
 * Validate (and sanitize) the demo request payload.
 *
 * Returns { errors, data }. `errors` is an array of { field, message } (empty = valid).
 * `data` holds the sanitized (trimmed, control-chars-stripped) values the caller should
 * persist -- never the raw body -- so a field of 200 spaces or an untrimmed value can
 * never reach storage even though it passed JSON parsing.
 */
// Exported so tests can exercise NaN/Infinity rejection directly: real JSON cannot carry
// either (JSON.parse rejects the NaN/Infinity tokens outright, and JSON.stringify turns a
// genuine Infinity/NaN into null), so the only way to test that guard is to call the
// validator with actual JS values instead of round-tripping through HTTP.
export function validateDemoPayload(body) {
  const b = body || {};

  // Unknown-field check runs first and short-circuits: rule 9 requires rejecting
  // unrecognized fields at the boundary, and doing it before the per-field checks means
  // a typo'd field name (e.g. `full_name`) is reported as itself, not as a confusing
  // "name is required" error about the field it was meant to fill in.
  const unknownFields = Object.keys(b).filter((key) => !KNOWN_DEMO_FIELDS.has(key));
  if (unknownFields.length > 0) {
    return {
      errors: unknownFields.map((field) => ({ field, message: `${field} is not a recognized field` })),
      data: null,
    };
  }

  const errors = [];
  const data = {};

  // Sanitize every string-shaped field up front so length/format checks below run
  // against the trimmed, control-char-free value -- otherwise a field of 200 spaces
  // would validate as non-empty and get stored as if it were meaningful content.
  const STRING_FIELDS = ['name', 'email', 'company', 'team_size', 'preferred_date', 'message', 'project_type', 'budget_currency'];
  for (const field of STRING_FIELDS) {
    const raw = b[field];
    data[field] = typeof raw === 'string' ? sanitizeString(raw, { allowNewlines: field === 'message' }) : raw;
  }
  data.budget_amount = b.budget_amount;

  const requiredStringField = (field, maxLen) => {
    const value = data[field];
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

  if (data.email === undefined || data.email === null) {
    errors.push({ field: 'email', message: 'email is required' });
  } else if (typeof data.email !== 'string' || !EMAIL_RE.test(data.email)) {
    errors.push({ field: 'email', message: 'email must be a valid email address' });
  }

  requiredStringField('company', 160);
  requiredStringField('team_size', 60);

  if (data.preferred_date !== undefined && data.preferred_date !== null) {
    if (typeof data.preferred_date !== 'string') {
      errors.push({ field: 'preferred_date', message: 'preferred_date must be a string' });
    } else {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.preferred_date);
      if (!match) {
        errors.push({ field: 'preferred_date', message: 'preferred_date must be in YYYY-MM-DD format' });
      } else {
        const [, yearStr, monthStr, dayStr] = match;
        const year = Number(yearStr);
        const month = Number(monthStr);
        const day = Number(dayStr);

        // Round-trip through Date.UTC and compare the components back out. `new
        // Date('2026-02-31')` silently rolls over to March 3rd instead of returning
        // Invalid Date, so trusting its truthiness would accept nonexistent dates --
        // the round-trip is the only reliable way to catch that.
        const utcMillis = Date.UTC(year, month - 1, day);
        const roundTrip = new Date(utcMillis);
        const isRealCalendarDate =
          roundTrip.getUTCFullYear() === year &&
          roundTrip.getUTCMonth() === month - 1 &&
          roundTrip.getUTCDate() === day;

        if (!isRealCalendarDate) {
          errors.push({ field: 'preferred_date', message: 'preferred_date is not a valid calendar date' });
        } else {
          const now = new Date();
          const todayUtcMillis = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
          if (utcMillis < todayUtcMillis) {
            errors.push({ field: 'preferred_date', message: 'preferred_date cannot be in the past' });
          }
        }
      }
    }
  }

  if (data.message !== undefined && data.message !== null) {
    if (typeof data.message !== 'string') {
      errors.push({ field: 'message', message: 'message must be a string' });
    } else if (data.message.length > 1000) {
      errors.push({ field: 'message', message: 'message must be at most 1000 characters' });
    }
  }

  if (data.project_type !== undefined && data.project_type !== null) {
    if (typeof data.project_type !== 'string') {
      errors.push({ field: 'project_type', message: 'project_type must be a string' });
    } else if (data.project_type.length < 1 || data.project_type.length > 120) {
      errors.push({ field: 'project_type', message: 'project_type must be between 1 and 120 characters' });
    }
  }

  // budget_currency and budget_amount are mutually dependent: a stated budget needs
  // both a figure and a unit to mean anything, so one without the other is a validation
  // error naming the field that's missing (checked before the ordinary null/undefined
  // treatment below, since that's not itself invalid).
  const hasBudgetCurrency = data.budget_currency !== undefined && data.budget_currency !== null;
  const hasBudgetAmount = data.budget_amount !== undefined && data.budget_amount !== null;

  if (hasBudgetCurrency && !hasBudgetAmount) {
    errors.push({ field: 'budget_amount', message: 'budget_amount is required when budget_currency is provided' });
  }
  if (hasBudgetAmount && !hasBudgetCurrency) {
    errors.push({ field: 'budget_currency', message: 'budget_currency is required when budget_amount is provided' });
  }

  if (hasBudgetCurrency) {
    if (typeof data.budget_currency !== 'string') {
      errors.push({ field: 'budget_currency', message: 'budget_currency must be a string' });
    } else {
      const normalized = data.budget_currency.toUpperCase();
      if (!SUPPORTED_CURRENCIES.has(normalized)) {
        errors.push({
          field: 'budget_currency',
          message: `budget_currency must be one of: ${[...SUPPORTED_CURRENCIES].join(', ')}`,
        });
      } else {
        data.budget_currency = normalized;
      }
    }
  }

  if (hasBudgetAmount) {
    // budget_amount is a client-stated figure recorded verbatim -- the server performs
    // no arithmetic and no currency conversion on it, so there is nothing here for it
    // to "recompute" under the server-recomputes-money rule; that rule targets prices
    // the server itself owns (e.g. an order total), not a lead's self-reported budget.
    const amount = data.budget_amount;
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      // typeof NaN === 'number' and typeof Infinity === 'number', so the type check
      // alone would let both through -- Number.isFinite rejects NaN, Infinity, and the
      // string form ("50000" fails the typeof check before this even runs).
      errors.push({ field: 'budget_amount', message: 'budget_amount must be a finite number' });
    } else if (amount <= 0) {
      errors.push({ field: 'budget_amount', message: 'budget_amount must be greater than 0' });
    } else if (amount > BUDGET_AMOUNT_MAX) {
      errors.push({ field: 'budget_amount', message: `budget_amount must be at most ${BUDGET_AMOUNT_MAX}` });
    }
  }

  return { errors, data };
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

      const { errors, data } = validateDemoPayload(req.body);
      if (errors.length > 0) {
        return res.status(422).json({ detail: errors });
      }

      // Persist the sanitized `data` (trimmed, control-chars stripped, currency
      // uppercased) -- never the raw body -- so storage can never drift from what
      // validation actually checked.
      const doc = {
        name: data.name,
        email: data.email,
        company: data.company,
        team_size: data.team_size,
        preferred_date: data.preferred_date === undefined ? null : data.preferred_date,
        message: data.message === undefined ? null : data.message,
        project_type: data.project_type === undefined ? null : data.project_type,
        budget_currency: data.budget_currency === undefined ? null : data.budget_currency,
        budget_amount: data.budget_amount === undefined ? null : data.budget_amount,
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
