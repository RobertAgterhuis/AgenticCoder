import { McpStdioToolClient } from '../core/tooling/McpStdioToolClient.js';

const client = new McpStdioToolClient({
  name: 'azure-mcp',
  command: process.env.AGENTICCODER_AZURE_MCP_COMMAND || 'npx',
  args: ['-y', '@azure/mcp@latest', 'server', 'start', '--insecure-disable-elicitation', '--debug'],
  cwd: process.cwd(),
  shell: process.platform === 'win32',
  framing: 'ndjson',
  timeoutMs: 60000
});

await client.connect();

const list = await client.call('tools/list', {});
const tools = Array.isArray(list?.tools) ? list.tools : [];

const tool =
  tools.find((t) => String(t?.name || '').toLowerCase().includes('bicepschema_get')) ||
  tools.find((t) => String(t?.name || '').toLowerCase().includes('bicepschema'));

console.log('bicepschema tool:', tool?.name);
console.log('inputSchema:', JSON.stringify(tool?.inputSchema, null, 2));

const props = tool?.inputSchema?.properties || {};
const keys = Object.keys(props);
const param = keys.length ? keys[0] : 'resourceType';

const res = await client.call('tools/call', {
  name: tool.name,
  arguments: {
    [param]: 'Microsoft.Web/serverfarms'
  }
});

console.log('tools/call result:', JSON.stringify(res, null, 2));

if (tool?.name === 'bicepschema') {
  const schemaRes = await client.call('tools/call', {
    name: 'bicepschema',
    arguments: {
      intent: 'Get Bicep schema for Microsoft.Web/serverfarms',
      command: 'bicepschema_get',
      parameters: {
        'resource-type': 'Microsoft.Web/serverfarms'
      }
    }
  });

  console.log('bicepschema_get (router) result:', JSON.stringify(schemaRes, null, 2));
}

await client.disconnect();
