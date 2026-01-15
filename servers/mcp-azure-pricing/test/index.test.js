import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import fetch from 'node-fetch';

// Simplified version of the pricing server for testing
const createApp = () => {
  const app = express();
  const cache = new Map();
  
  const getCache = (key) => {
    const entry = cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { cache.delete(key); return undefined; }
    return entry.value;
  };
  
  const setCache = (key, value, ttlMs = 5 * 60 * 1000) => {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  };

  app.use(express.json());
  app.use(rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'mcp-azure-pricing' });
  });

  app.get('/api/prices', async (req, res) => {
    try {
      const { currencyCode = 'USD', limit = 100, ttl = 300000 } = req.query;
      const limitNum = Number(limit);
      const ttlNum = Number(ttl);
      
      if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 2000) {
        return res.status(400).json({ error: 'Invalid limit. Provide 1-2000.' });
      }
      if (Number.isNaN(ttlNum) || ttlNum < 1000 || ttlNum > 3600000) {
        return res.status(400).json({ error: 'Invalid ttl. Provide 1000-3600000 ms.' });
      }

      const cacheKey = `prices:${currencyCode}:${limitNum}`;
      const cached = getCache(cacheKey);
      if (cached) {
        return res.json({ source: 'cache', count: cached.length, data: cached });
      }

      res.json({ source: 'live', count: 0, data: [] });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch prices' });
    }
  });

  return app;
};

test('Pricing Server', async (t) => {
  const app = createApp();

  await t.test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
  });

  await t.test('GET /api/prices with valid params', async () => {
    const res = await request(app).get('/api/prices?limit=10&currencyCode=USD');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.body.count, 'number');
  });

  await t.test('GET /api/prices rejects invalid limit', async () => {
    const res = await request(app).get('/api/prices?limit=invalid');
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Invalid limit'));
  });

  await t.test('GET /api/prices rejects limit > 2000', async () => {
    const res = await request(app).get('/api/prices?limit=3000');
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Invalid limit'));
  });

  await t.test('GET /api/prices rejects invalid ttl', async () => {
    const res = await request(app).get('/api/prices?ttl=invalid');
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Invalid ttl'));
  });

  await t.test('GET /api/prices rejects ttl < 1000', async () => {
    const res = await request(app).get('/api/prices?ttl=500');
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Invalid ttl'));
  });
});
