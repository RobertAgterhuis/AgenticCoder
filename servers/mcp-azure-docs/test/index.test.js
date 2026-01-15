import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';

// Simplified docs server for testing
const createApp = () => {
  const app = express();
  const docsCache = new Map();
  
  const getDocsCache = (key) => {
    const entry = docsCache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { docsCache.delete(key); return undefined; }
    return entry.value;
  };
  
  const setDocsCache = (key, value, ttlMs = 5 * 60 * 1000) => {
    docsCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  };

  app.use(express.json());
  app.use(rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'mcp-azure-docs' });
  });

  app.get('/api/search', async (req, res) => {
    try {
      const { q, locale = 'en-us', facet, limit = 20, ttl = 300000 } = req.query;
      if (!q) return res.status(400).json({ error: 'Missing query parameter q' });

      const limitNum = Number(limit);
      const ttlNum = Number(ttl);
      if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({ error: 'Invalid limit. Provide 1-100.' });
      }
      if (Number.isNaN(ttlNum) || ttlNum < 1000 || ttlNum > 3600000) {
        return res.status(400).json({ error: 'Invalid ttl. Provide 1000-3600000 ms.' });
      }

      const cacheKey = `learn:${locale}:${facet || 'none'}:${q}:${limitNum}`;
      const cached = getDocsCache(cacheKey);
      if (cached) return res.json({ source: 'cache', count: cached.length, data: cached });

      res.json({ source: 'live', count: 0, data: [] });
    } catch (err) {
      res.status(500).json({ error: 'Docs search failed' });
    }
  });

  return app;
};

test('Docs Server', async (t) => {
  const app = createApp();

  await t.test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  await t.test('GET /api/search requires query parameter', async () => {
    const res = await request(app).get('/api/search');
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Missing query parameter'));
  });

  await t.test('GET /api/search with valid q', async () => {
    const res = await request(app).get('/api/search?q=Azure%20Functions&limit=10');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.body.count, 'number');
  });

  await t.test('GET /api/search rejects invalid limit', async () => {
    const res = await request(app).get('/api/search?q=test&limit=invalid');
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Invalid limit'));
  });

  await t.test('GET /api/search rejects limit > 100', async () => {
    const res = await request(app).get('/api/search?q=test&limit=200');
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Invalid limit'));
  });

  await t.test('GET /api/search accepts optional facet', async () => {
    const res = await request(app).get('/api/search?q=test&facet=Azure');
    assert.strictEqual(res.status, 200);
  });

  await t.test('GET /api/search rejects invalid ttl', async () => {
    const res = await request(app).get('/api/search?q=test&ttl=500');
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Invalid ttl'));
  });
});
