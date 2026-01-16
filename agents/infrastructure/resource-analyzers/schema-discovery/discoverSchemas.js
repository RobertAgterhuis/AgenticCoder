/**
 * Schema Discovery Tool
 * 
 * Discovers all available Azure resource types with Bicep schemas via Azure MCP.
 * Run this periodically to update the supported-resources.json cache.
 * 
 * Usage: node discoverSchemas.js
 */

import { spawn } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// All Azure providers we want to check
const PROVIDERS = [
  'Microsoft.Web',
  'Microsoft.Compute',
  'Microsoft.Storage',
  'Microsoft.Sql',
  'Microsoft.DocumentDB',
  'Microsoft.Network',
  'Microsoft.KeyVault',
  'Microsoft.Insights',
  'Microsoft.OperationalInsights',
  'Microsoft.ContainerService',
  'Microsoft.ContainerRegistry',
  'Microsoft.ContainerInstance',
  'Microsoft.ManagedIdentity',
  'Microsoft.Cache',
  'Microsoft.ServiceBus',
  'Microsoft.EventHub',
  'Microsoft.EventGrid',
  'Microsoft.Logic',
  'Microsoft.ApiManagement',
  'Microsoft.CognitiveServices',
  'Microsoft.MachineLearningServices',
  'Microsoft.BotService',
  'Microsoft.Search',
  'Microsoft.SignalRService',
  'Microsoft.Synapse',
  'Microsoft.DataFactory',
  'Microsoft.Databricks',
  'Microsoft.StreamAnalytics',
  'Microsoft.Cdn',
  'Microsoft.App',
  'Microsoft.Authorization',
  'Microsoft.Consumption',
  'Microsoft.RecoveryServices',
  'Microsoft.Devices',
  'Microsoft.DigitalTwins',
  'Microsoft.Communication',
  'Microsoft.Media',
  'Microsoft.Maps',
  'Microsoft.DesktopVirtualization',
  'Microsoft.Batch',
  'Microsoft.DevTestLab',
  'Microsoft.DBforMySQL',
  'Microsoft.DBforPostgreSQL',
  'Microsoft.DBforMariaDB',
  'Microsoft.NotificationHubs',
  'Microsoft.Relay',
  'Microsoft.AppConfiguration',
  'Microsoft.AlertsManagement',
  'Microsoft.Monitor'
];

/**
 * Call Azure MCP to list resource types for a provider
 */
async function listResourceTypesForProvider(providerNamespace) {
  return new Promise((resolve, reject) => {
    const args = [
      '-y', '@azure/mcp@latest',
      '--transport', 'stdio'
    ];

    const proc = spawn('npx', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: process.platform === 'win32'
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Send JSON-RPC request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'azmcp-bicep-types-list-resource-types',
        arguments: {
          providerNamespace
        }
      }
    };

    proc.stdin.write(JSON.stringify(request) + '\n');

    // Give it time to respond then close
    setTimeout(() => {
      proc.stdin.end();
    }, 5000);

    proc.on('close', (code) => {
      try {
        // Parse the response - look for the result in stdout
        const lines = stdout.split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.result && json.result.content) {
              const content = json.result.content[0];
              if (content && content.text) {
                resolve(content.text);
                return;
              }
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
        resolve('');
      } catch (e) {
        reject(e);
      }
    });

    proc.on('error', reject);
  });
}

/**
 * Parse resource types from MCP response
 */
function parseResourceTypes(text) {
  if (!text) return [];
  
  const resources = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Format: Microsoft.Web/sites@2023-12-01
    if (trimmed.includes('@') && trimmed.includes('/')) {
      const [fullType, apiVersion] = trimmed.split('@');
      if (fullType && apiVersion) {
        resources.push({
          type: fullType,
          apiVersion,
          provider: fullType.split('/')[0]
        });
      }
    }
  }
  
  return resources;
}

/**
 * Main discovery function
 */
async function discoverAllSchemas() {
  console.log('🔍 Discovering Azure resource schemas via MCP...\n');
  
  const allResources = [];
  const providerSummary = {};
  
  for (const provider of PROVIDERS) {
    process.stdout.write(`  Checking ${provider}... `);
    
    try {
      const result = await listResourceTypesForProvider(provider);
      const resources = parseResourceTypes(result);
      
      if (resources.length > 0) {
        allResources.push(...resources);
        providerSummary[provider] = resources.length;
        console.log(`✓ ${resources.length} types`);
      } else {
        providerSummary[provider] = 0;
        console.log('✗ No schemas available');
      }
    } catch (error) {
      providerSummary[provider] = 0;
      console.log(`✗ Error: ${error.message}`);
    }
    
    // Small delay to avoid overwhelming
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Build the output
  const output = {
    generatedAt: new Date().toISOString(),
    totalProviders: Object.keys(providerSummary).length,
    totalResourceTypes: allResources.length,
    providerSummary,
    resourceTypes: allResources.reduce((acc, r) => {
      acc[r.type] = r.apiVersion;
      return acc;
    }, {}),
    // Group by provider for easier lookup
    byProvider: allResources.reduce((acc, r) => {
      if (!acc[r.provider]) acc[r.provider] = [];
      acc[r.provider].push({ type: r.type, apiVersion: r.apiVersion });
      return acc;
    }, {})
  };
  
  // Write to file
  const outputPath = join(__dirname, 'supported-resources.json');
  await writeFile(outputPath, JSON.stringify(output, null, 2));
  
  console.log('\n📊 Summary:');
  console.log(`   Total providers checked: ${output.totalProviders}`);
  console.log(`   Total resource types found: ${output.totalResourceTypes}`);
  console.log(`\n✅ Saved to: ${outputPath}`);
  
  return output;
}

// Run if called directly
discoverAllSchemas().catch(console.error);

export { discoverAllSchemas, PROVIDERS };
