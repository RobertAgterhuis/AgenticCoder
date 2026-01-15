import express from 'express';
import dotenv from 'dotenv';
import { DefaultAzureCredential } from '@azure/identity';
import { ResourceGraphClient } from '@azure/arm-resourcegraph';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: 'mcp-azure-resource-graph', time: new Date().toISOString() });
});

// Execute Azure Resource Graph query
// Body: { query: string, subscriptions?: string[], managementGroupId?: string, options?: object }
app.post('/api/query', async (req, res) => {
  try {
    const { query, subscriptions, managementGroupId, options } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Missing query string in body' });
    }
    if (query.length > 10000) {
      return res.status(400).json({ error: 'Query too long. Max 10000 characters.' });
    }

    // Determine target scope
    let targetSubs = subscriptions;
    if (!targetSubs || !Array.isArray(targetSubs) || targetSubs.length === 0) {
      const envSubs = process.env.AZURE_SUBSCRIPTIONS;
      if (envSubs) targetSubs = envSubs.split(',').map(s => s.trim()).filter(Boolean);
    }

    const credential = new DefaultAzureCredential();
    const client = new ResourceGraphClient(credential);

    const request = {
      query,
      subscriptions: targetSubs && targetSubs.length ? targetSubs : undefined,
      managementGroupName: managementGroupId || process.env.MANAGEMENT_GROUP_ID || undefined,
      options: options || { resultFormat: 'objectArray' }
    };

    const result = await client.resources(request);
    res.json({ count: result.totalRecords || (result.data?.length || 0), data: result.data || result });
  } catch (err) {
    res.status(500).json({ error: 'Resource Graph query failed', details: String(err) });
  }
});

app.listen(port, () => {
  console.log(`Azure Resource Graph MCP server listening on port ${port}`);
});
