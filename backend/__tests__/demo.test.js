import { randomUUID } from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import request from 'supertest';
import { createApp, ensureIndexes } from '../server.js';

let mongoServer;
let client;
let app;

// Every POST test needs its own Idempotency-Key so tests stay independent of each
// other — reusing a key across tests would make later tests see an earlier test's
// replay (200) instead of exercising a fresh insert (201).
const freshKey = () => randomUUID();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  client = new MongoClient(uri);
  await client.connect();
  const db = client.db('zelarion_test');
  await ensureIndexes(db);
  app = createApp(db);
}, 120000);

afterAll(async () => {
  if (client) {
    await client.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

describe('GET /api/health', () => {
  it('returns status ok and service zelarion', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'zelarion' });
  });
});

describe('GET /api/demo/count', () => {
  it('returns 200 with an integer count >= 0', async () => {
    const res = await request(app).get('/api/demo/count');
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
    expect(Number.isInteger(res.body.count)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(0);
  });
});

describe('POST /api/demo', () => {
  it('creates a demo request with a full valid payload and increments count by 1', async () => {
    const payload = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      company: 'Analytical Engines Inc',
      team_size: '11-50',
      preferred_date: '2026-08-01',
      message: 'Excited to see a demo.',
    };

    const countBefore = await request(app).get('/api/demo/count');
    const countBeforeValue = countBefore.body.count;

    const res = await request(app).post('/api/demo').set('Idempotency-Key', freshKey()).send(payload);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(payload.name);
    expect(res.body.email).toBe(payload.email);
    expect(res.body.company).toBe(payload.company);
    expect(res.body.team_size).toBe(payload.team_size);
    expect(res.body.preferred_date).toBe(payload.preferred_date);
    expect(res.body.message).toBe(payload.message);
    expect(typeof res.body.created_at).toBe('string');
    expect(typeof res.body.id).toBe('string');

    const countAfter = await request(app).get('/api/demo/count');
    expect(countAfter.body.count).toBe(countBeforeValue + 1);
  });

  it('creates a demo request with only the 4 required fields', async () => {
    const payload = {
      name: 'Grace Hopper',
      email: 'grace@example.com',
      company: 'Navy Computing',
      team_size: '1-10',
    };

    const res = await request(app).post('/api/demo').set('Idempotency-Key', freshKey()).send(payload);

    expect(res.status).toBe(201);
    expect(res.body.email).toBe(payload.email);
    expect(res.body.preferred_date).toBeNull();
    expect(res.body.message).toBeNull();
  });

  it('rejects an invalid email with 422', async () => {
    const payload = {
      name: 'Bad Email',
      email: 'not-an-email',
      company: 'Some Co',
      team_size: '1-10',
    };

    const res = await request(app).post('/api/demo').set('Idempotency-Key', freshKey()).send(payload);

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.detail)).toBe(true);
  });

  it('rejects a payload missing a required field (no name key) with 422', async () => {
    const payload = {
      email: 'noname@example.com',
      company: 'Some Co',
      team_size: '1-10',
    };

    const res = await request(app).post('/api/demo').set('Idempotency-Key', freshKey()).send(payload);

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.detail)).toBe(true);
  });

  it('rejects an empty string for a required field (name) with 422', async () => {
    const payload = {
      name: '',
      email: 'empty@example.com',
      company: 'Some Co',
      team_size: '1-10',
    };

    const res = await request(app).post('/api/demo').set('Idempotency-Key', freshKey()).send(payload);

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.detail)).toBe(true);
  });

  const validPayload = () => ({
    name: 'Idempotency Tester',
    email: 'idem@example.com',
    company: 'Retry Co',
    team_size: '51-200',
    preferred_date: '2026-09-01',
    message: 'Testing double-submit protection.',
  });

  it('rejects a request with no Idempotency-Key header with 400 and does not create a record', async () => {
    const countBefore = await request(app).get('/api/demo/count');

    const res = await request(app).post('/api/demo').send(validPayload());

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.detail)).toBe(true);

    const countAfter = await request(app).get('/api/demo/count');
    expect(countAfter.body.count).toBe(countBefore.body.count);
  });

  it('rejects an empty-string Idempotency-Key header with 400', async () => {
    const res = await request(app).post('/api/demo').set('Idempotency-Key', '').send(validPayload());

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.detail)).toBe(true);
  });

  it('rejects an Idempotency-Key header longer than the 128-char bound with 400', async () => {
    const tooLong = 'a'.repeat(129);
    const res = await request(app).post('/api/demo').set('Idempotency-Key', tooLong).send(validPayload());

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.detail)).toBe(true);
  });

  it('checks the Idempotency-Key before the payload: no key + invalid body still returns 400, not 422', async () => {
    // Body is missing every required field. If the endpoint validated the body first,
    // this would be a 422. The key check must win, proving the declared ordering.
    const res = await request(app).post('/api/demo').send({});

    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.detail)).toBe(true);
  });

  it('double-fire sequential: same key and body twice returns 201 then 200 with identical bodies, count +1', async () => {
    const key = freshKey();
    const payload = validPayload();

    const countBefore = await request(app).get('/api/demo/count');

    const first = await request(app).post('/api/demo').set('Idempotency-Key', key).send(payload);
    const second = await request(app).post('/api/demo').set('Idempotency-Key', key).send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);

    const countAfter = await request(app).get('/api/demo/count');
    expect(countAfter.body.count).toBe(countBefore.body.count + 1);
  });

  it('double-fire concurrent: same key and body fired together produces exactly one 201 and one 200, count +1', async () => {
    const key = freshKey();
    const payload = validPayload();

    const countBefore = await request(app).get('/api/demo/count');

    // Genuinely race both requests: both promises are created (and their underlying
    // sockets opened) before either is awaited, so the two insertOne calls are in
    // flight against MongoDB at the same time. Against the pre-fix bare insertOne
    // (no unique index, no key check) this would return two 201s and increment the
    // count by 2 — this test would fail against that implementation, which is the
    // point: it proves the DB-level unique index, not app logic, is what serializes
    // the race.
    const [resA, resB] = await Promise.all([
      request(app).post('/api/demo').set('Idempotency-Key', key).send(payload),
      request(app).post('/api/demo').set('Idempotency-Key', key).send(payload),
    ]);

    expect(resA.status).not.toBe(500);
    expect(resB.status).not.toBe(500);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 201]);

    expect(resA.body).toEqual(resB.body);

    const countAfter = await request(app).get('/api/demo/count');
    expect(countAfter.body.count).toBe(countBefore.body.count + 1);
  });

  it('different Idempotency-Key headers with the same body create two distinct records', async () => {
    const payload = validPayload();

    const first = await request(app).post('/api/demo').set('Idempotency-Key', freshKey()).send(payload);
    const second = await request(app).post('/api/demo').set('Idempotency-Key', freshKey()).send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
  });
});
