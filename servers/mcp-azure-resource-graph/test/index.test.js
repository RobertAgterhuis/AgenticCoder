import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';

// Simplified resource graph server for testing (without Azure SDK since it requires auth)
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'mcp-azure-resource-graph' });
  });

  app.post('/api/query', (req, res) => {
    try {
      const { query } = req.body || {};
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Missing query string in body' });
      }
      if (query.length > 10000) {
        return res.status(400).json({ error: 'Query too long. Max 10000 characters.' });
      }
      
      res.json({ count: 0, data: [] });
    } catch (err) {
      res.status(500).json({ error: 'Resource Graph query failed' });
    }
  });

  return app;
};

test('Resource Graph Server', async (t) => {
  const app = createApp();

  await t.test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  await t.test('POST /api/query requires query in body', async () => {
    const res = await request(app).post('/api/query').send({});
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Missing query string'));
  });

  await t.test('POST /api/query rejects non-string query', async () => {
    const res = await request(app).post('/api/query').send({ query: 123 });
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Missing query string'));
  });

  await t.test('POST /api/query accepts valid query', async () => {
    const res = await request(app).post('/api/query').send({ query: 'Resources | limit 5' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.body.count, 'number');
  });

  await t.test('POST /api/query rejects oversized query', async () => {
    const longQuery = 'a'.repeat(11000);
    const res = await request(app).post('/api/query').send({ query: longQuery });
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Query too long'));
  });

  await t.test('POST /api/query accepts subscriptions array', async () => {
    const res = await request(app).post('/api/query').send({
      query: 'Resources | limit 5',
      subscriptions: ['sub-123']
    });
    assert.strictEqual(res.status, 200);
  });

  await t.test('POST /api/query accepts managementGroupId', async () => {
    const res = await request(app).post('/api/query').send({
      query: 'Resources | limit 5',
      managementGroupId: 'mg-123'
    });
    assert.strictEqual(res.status, 200);
  });
});
