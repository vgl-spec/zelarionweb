import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import request from 'supertest';
import { createApp } from '../server.js';

let mongoServer;
let client;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  client = new MongoClient(uri);
  await client.connect();
  const db = client.db('zelarion_test');
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

    const res = await request(app).post('/api/demo').send(payload);

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

    const res = await request(app).post('/api/demo').send(payload);

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

    const res = await request(app).post('/api/demo').send(payload);

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.detail)).toBe(true);
  });

  it('rejects a payload missing a required field (no name key) with 422', async () => {
    const payload = {
      email: 'noname@example.com',
      company: 'Some Co',
      team_size: '1-10',
    };

    const res = await request(app).post('/api/demo').send(payload);

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

    const res = await request(app).post('/api/demo').send(payload);

    expect(res.status).toBe(422);
    expect(Array.isArray(res.body.detail)).toBe(true);
  });
});
