import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { pathToFileURL } from 'url';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      };

      const result = await db.collection('demo_requests').insertOne(doc);

      return res.status(201).json({
        id: result.insertedId.toString(),
        name: doc.name,
        email: doc.email,
        company: doc.company,
        team_size: doc.team_size,
        preferred_date: doc.preferred_date,
        message: doc.message,
        created_at: doc.created_at,
      });
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
    .then(() => {
      const db = client.db(dbName);
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
