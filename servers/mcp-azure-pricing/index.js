import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Simple in-memory TTL cache
const cache = new Map();
const setCache = (key, value, ttlMs = 5 * 60 * 1000) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};
const getCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
};

app.use(express.json());
// Basic rate limiting: 60 requests/minute per IP
app.use(rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'mcp-azure-pricing', time: new Date().toISOString() });
});

// Azure Retail Prices API integration with filters and caching
// Docs: https://learn.microsoft.com/azure/cost-management-billing/retail-prices/retail-prices
app.get('/api/prices', async (req, res) => {
  try {
    const {
      serviceName,
      armRegionName,
      armSkuName,
      meterName,
      contains,
      currencyCode = 'USD',
      limit = 100,
      ttl = 300000 // 5 minutes default
    } = req.query;

    // Validate numeric inputs
    const limitNum = Number(limit);
    const ttlNum = Number(ttl);
    if (Number.isNaN(limitNum) || limitNum < 1 || limitNum > 2000) {
      return res.status(400).json({ error: 'Invalid limit. Provide 1-2000.' });
    }
    if (Number.isNaN(ttlNum) || ttlNum < 1000 || ttlNum > 3600000) {
      return res.status(400).json({ error: 'Invalid ttl. Provide 1000-3600000 ms.' });
    }

    // Build OData filter
    const filters = [];
    if (serviceName) filters.push(`serviceName eq '${serviceName}'`);
    if (armRegionName) filters.push(`armRegionName eq '${armRegionName}'`);
    if (armSkuName) filters.push(`armSkuName eq '${armSkuName}'`);
    if (meterName) filters.push(`meterName eq '${meterName}'`);
    if (contains) filters.push(`contains(productName,'${contains}')`);
    const filterQuery = filters.length ? `$filter=${encodeURIComponent(filters.join(' and '))}` : '';

    const cacheKey = `prices:${currencyCode}:${filterQuery}:${limitNum}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', count: cached.Items?.length || cached.length || 0, data: cached });
    }

    let url = `https://prices.azure.com/api/retail/prices?currencyCode=${encodeURIComponent(currencyCode)}`;
    if (filterQuery) url += `&${filterQuery}`;

    let results = [];
    let pageCount = 0;
    while (url && results.length < limitNum) {
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: 'Azure Retail Prices API error', details: text });
      }
      const json = await response.json();
      const items = json.Items || [];
      results = results.concat(items);
      pageCount += 1;
      if (results.length >= limitNum) break;
      url = json.NextPageLink || null;
    }

    // Trim to limit
    results = results.slice(0, limitNum);
    setCache(cacheKey, results, ttlNum);
    res.json({ source: 'live', pagesFetched: pageCount, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prices', details: String(err) });
  }
});

app.listen(port, () => {
  console.log(`Azure Pricing MCP server listening on port ${port}`);
});
