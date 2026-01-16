import { BaseAgent } from '../core/BaseAgent.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeTask as analyzeTaskWithRegistry, findMatchingAnalyzers } from './resource-analyzers/index.js';

/**
 * ResourceAnalyzerAgent - Analyzes Azure resources required for a task
 * Determines resource types, configurations, and dependencies
 * 
 * Uses modular analyzers from ./resource-analyzers/ for extensibility:
 * - WebAnalyzer: App Service, Functions, Static Web Apps
 * - ComputeAnalyzer: VM, AKS, Container Registry
 * - DatabaseAnalyzer: SQL, CosmosDB, MySQL, PostgreSQL
 * - StorageAnalyzer: Storage Accounts, Blob, Data Lake
 * - NetworkingAnalyzer: VNet, NSG, Load Balancer, App Gateway
 * - SecurityAnalyzer: Key Vault, Managed Identity
 * - MonitoringAnalyzer: App Insights, Log Analytics
 */
export class ResourceAnalyzerAgent extends BaseAgent {
  constructor() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(__dirname, '..', '..');

    const pythonCommand = process.env.AGENTICCODER_PYTHON || 'python';
    const resourceGraphMcpCwd = path.join(repoRoot, '.github', 'mcp', 'azure-resource-graph-mcp');

    const definition = {
      id: 'resource-analyzer',
      name: 'Resource Analyzer Agent',
      version: '1.0.0',
      type: 'infrastructure',
      description: 'Analyzes required Azure resources for tasks',
      inputs: {
        type: 'object',
        required: ['tasks'],
        properties: {
          tasks: {
            type: 'array',
            description: 'Tasks to analyze',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string' },
                requirements: { type: 'array' }
              }
            }
          },
          constraints: {
            type: 'object',
            description: 'Budget, region, compliance constraints'
          }
        }
      },
      outputs: {
        type: 'object',
        required: ['resources'],
        properties: {
          resources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                name: { type: 'string' },
                apiVersion: { type: 'string' },
                sku: { oneOf: [{ type: 'string' }, { type: 'object' }] },
                kind: { type: 'string' },
                location: { type: 'string' },
                properties: { type: 'object' },
                dependencies: { type: 'array' },
                dependsOn: { type: 'array' },
                tags: { type: 'object' },
                zones: { type: 'array' }
              }
            }
          },
          resourceGraph: {
            type: 'object',
            description: 'Resource dependency graph'
          },
          recommendations: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      mcpServers: [
        {
          name: 'azure-resource-graph',
          endpoint: 'http://localhost:3002',

          // Optional stdio MCP transport (only used when AGENTICCODER_TOOL_TRANSPORT=mcp*).
          stdioCommand: pythonCommand,
          stdioArgs: ['-m', 'azure_resource_graph_mcp', 'mcp'],
          stdioCwd: resourceGraphMcpCwd
        }
      ],
      timeout: 30000
    };

    super(definition);
  }

  async _onExecute(input, context, executionId) {
    const { tasks, constraints = {} } = input;

    // Analyze each task to determine required resources
    const resources = [];
    const resourceMap = new Map();

    for (const task of tasks) {
      const taskResources = await this._analyzeTask(task, constraints);
      
      for (const resource of taskResources) {
        if (!resourceMap.has(resource.id)) {
          resourceMap.set(resource.id, resource);
          resources.push(resource);
        }
      }
    }

    // Build resource dependency graph
    const resourceGraph = this._buildResourceGraph(resources);

    // Optional: enrich with a (best-effort) Resource Graph query.
    // To avoid slowing down default runs, only do this when MCP transport is requested,
    // or when explicitly enabled for HTTP probing.
    const transport = (process.env.AGENTICCODER_TOOL_TRANSPORT || '').toLowerCase();
    const wantsMcp = transport.startsWith('mcp');
    const enableHttpProbe = process.env.AGENTICCODER_ENABLE_HTTP_MCP_PROBES === '1';

    let resourceGraphInventory = null;
    if (wantsMcp || enableHttpProbe) {
      resourceGraphInventory = await this._tryFetchResourceGraphInventory(constraints, wantsMcp);
    }

    // Generate recommendations
    const recommendations = this._generateRecommendations(resources, constraints);

    return {
      resources,
      resourceGraph,
      resourceGraphInventory,
      recommendations,
      metadata: {
        executionId,
        totalResources: resources.length,
        analyzedTasks: tasks.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  async _tryFetchResourceGraphInventory(constraints, wantsMcp) {
    const client = this.mcpClients.get('azure-resource-graph');
    if (!client) return null;

    // Keep the query cheap and deterministic. This repo's RG implementations are stubs.
    const queryText = 'Resources | limit 1';

    // Prefer MCP stdio tools/call when we know we're using MCP.
    if (wantsMcp) {
      try {
        const result = await client.call('tools/call', {
          name: 'query',
          arguments: { kusto: queryText }
        });

        return {
          source: 'azure-resource-graph-mcp-stdio',
          query: queryText,
          result
        };
      } catch {
        return null;
      }
    }

    // Optional HTTP probing (disabled by default) for environments running the Node server.
    try {
      const response = await client.call('/api/query', {
        query: queryText,
        subscriptions: constraints.subscriptions,
        managementGroupId: constraints.managementGroupId
      });

      return {
        source: 'mcp-azure-resource-graph-http',
        query: queryText,
        response
      };
    } catch {
      return null;
    }
  }

  async _analyzeTask(task, constraints) {
    const location = constraints.region || 'eastus';
    const lowerDescription = (task.description || '').toLowerCase();

    // Use modular analyzers from registry
    const matchingAnalyzers = findMatchingAnalyzers(lowerDescription);
    
    if (matchingAnalyzers.length > 0) {
      // Delegate to registry - returns deduplicated resources from all matching analyzers
      const resources = analyzeTaskWithRegistry(task, constraints);
      
      // Add requirements-based resources if not already present
      this._addRequirementResources(resources, task, constraints, location);
      
      return resources;
    }

    // Fallback for generic/unmatched tasks
    const resources = [];
    const taskType = task.type || 'generic';

    if (taskType === 'analysis') {
      // Analysis tasks typically don't create resources
      return resources;
    }

    // Generic deployment - minimal resources
    resources.push(
      this._createResource('resource-group', 'Microsoft.Resources/resourceGroups', 'rg', {
        location
      }, constraints)
    );

    this._addRequirementResources(resources, task, constraints, location);
    return resources;
  }

  /**
   * Add resources based on task requirements (Monitoring, Security)
   * @private
   */
  _addRequirementResources(resources, task, constraints, location) {
    const lowerDescription = (task.description || '').toLowerCase();
    
    // Only add Log Analytics if monitoring is requested and App Insights isn't already present.
    const hasAppInsights = resources.some(r => r.type === 'Microsoft.Insights/components');
    const wantsAppInsights = lowerDescription.includes('application insights') || lowerDescription.includes('app insights');

    if (task.requirements?.includes('Monitoring') && !hasAppInsights && !wantsAppInsights) {
      resources.push(
        this._createResource('log-analytics', 'Microsoft.OperationalInsights/workspaces', 'logs', {
          sku: 'PerGB2018',
          location
        }, constraints)
      );
    }

    // Add Key Vault if Security requirement and not already present
    const hasKeyVault = resources.some(r => r.type === 'Microsoft.KeyVault/vaults');
    if (task.requirements?.includes('Security') && !hasKeyVault) {
      resources.push(
        this._createResource('key-vault', 'Microsoft.KeyVault/vaults', 'kv', {
          sku: 'standard',
          location,
          properties: {
            enabledForDeployment: true,
            enabledForTemplateDeployment: true
          }
        }, constraints)
      );
    }
  }

  _createResource(id, type, namePrefix, config, constraints = {}) {
    const environment = constraints.environment || 'development';
    return {
      id: `${id}-${Date.now()}`,
      type,
      name: config?.name || `${namePrefix}-${Math.random().toString(36).substring(7)}`,
      sku: config.sku,
      location: config.location,
      kind: config.kind,
      properties: config.properties || {},
      dependencies: config.dependencies || [],
      tags: {
        createdBy: 'AgenticCoder',
        environment
      }
    };
  }

  _makeName(prefix) {
    return `${prefix}-${Math.random().toString(36).substring(7)}`;
  }

  _makeStorageAccountName(prefix = 'st') {
    // Storage account names must be 3-24 chars, lowercase letters+numbers only.
    const suffix = Math.random().toString(36).replace(/[^a-z0-9]/g, '').substring(0, 18);
    let name = `${prefix}${suffix}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (name.length < 3) name = (name + '000').substring(0, 3);
    if (name.length > 24) name = name.substring(0, 24);
    return name;
  }

  _sanitizeName(name) {
    const cleaned = String(name ?? '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!cleaned) return 'r';
    if (/^[0-9]/.test(cleaned)) return `r${cleaned}`;
    return cleaned;
  }

  _buildResourceGraph(resources) {
    const graph = {
      nodes: resources.map(r => ({
        id: r.id,
        type: r.type,
        name: r.name
      })),
      edges: []
    };

    // Build dependency edges
    for (const resource of resources) {
      if (resource.dependencies && resource.dependencies.length > 0) {
        for (const depId of resource.dependencies) {
          const depResource = resources.find(r => r.id.startsWith(depId));
          if (depResource) {
            graph.edges.push({
              from: depResource.id,
              to: resource.id,
              type: 'depends-on'
            });
          }
        }
      }
    }

    return graph;
  }

  _generateRecommendations(resources, constraints) {
    const recommendations = [];

    // Check for high availability
    const hasMultipleInstances = resources.filter(r => 
      r.type.includes('virtualMachines') || r.type.includes('sites')
    ).length > 1;
    
    if (!hasMultipleInstances) {
      recommendations.push('Consider deploying multiple instances for high availability');
    }

    // Check for monitoring
    const hasMonitoring = resources.some(r => 
      r.type.includes('OperationalInsights') || r.type.includes('insights')
    );
    
    if (!hasMonitoring) {
      recommendations.push('Add Application Insights or Log Analytics for monitoring');
    }

    // Check for security
    const hasKeyVault = resources.some(r => r.type.includes('KeyVault'));
    if (!hasKeyVault) {
      recommendations.push('Consider using Azure Key Vault for secrets management');
    }

    // Budget optimization
    if (constraints.budget) {
      recommendations.push('Review SKU selections to optimize costs within budget');
    }

    return recommendations;
  }
}
