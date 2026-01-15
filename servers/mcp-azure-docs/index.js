import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'mcp-azure-docs', time: new Date().toISOString() });
});

// Search Microsoft Learn / Docs API
// Endpoint: https://learn.microsoft.com/api/search?search={q}&locale=en-us
// Optional: scope facets like Azure
const docsCache = new Map();
const setDocsCache = (key, value, ttlMs = 5 * 60 * 1000) => docsCache.set(key, { value, expiresAt: Date.now() + ttlMs });
const getDocsCache = (key) => {
  const entry = docsCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) { docsCache.delete(key); return undefined; }
  return entry.value;
};

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

    let url = `https://learn.microsoft.com/api/search?search=${encodeURIComponent(q)}&locale=${encodeURIComponent(locale)}`;
    if (facet) url += `&facet=${encodeURIComponent(facet)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'AgenticCoder/1.0' } });
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Learn search error', details: text });
    }
    const json = await response.json();
    const results = (json && json.results) ? json.results.slice(0, limitNum).map(r => ({
      id: r.id,
      title: r.title,
      url: r.url,
      summary: r.summary,
      locale: r.locale,
      rank: r.rank,
      source: r.source,
      lastUpdated: r.lastUpdated
    })) : [];

    setDocsCache(cacheKey, results, ttlNum);
    res.json({ source: 'live', count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ error: 'Docs search failed', details: String(err) });
  }
});

app.listen(port, () => {
  console.log(`Azure Docs MCP server listening on port ${port}`);
});
