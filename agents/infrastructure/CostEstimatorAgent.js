import { BaseAgent } from '../core/BaseAgent.js';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * CostEstimatorAgent - Estimates costs for Azure resources
 * Uses Azure Pricing API to calculate deployment costs
 */
export class CostEstimatorAgent extends BaseAgent {
  constructor() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(__dirname, '..', '..');

    const pythonCommand = process.env.AGENTICCODER_PYTHON || 'python';
    const pricingMcpCwd = path.join(repoRoot, '.github', 'mcp', 'azure-pricing-mcp');

    const definition = {
      id: 'cost-estimator',
      name: 'Cost Estimator Agent',
      version: '1.0.0',
      type: 'infrastructure',
      description: 'Estimates Azure resource costs',
      inputs: {
        type: 'object',
        required: ['resources'],
        properties: {
          resources: {
            type: 'array',
            description: 'Resources to estimate costs for',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                name: { type: 'string' },
                sku: { oneOf: [{ type: 'string' }, { type: 'object' }] },
                location: { type: 'string' },
                properties: { type: 'object' },
                tags: { type: 'object' },
                quantity: { type: 'number' }
              }
            }
          },
          timeframe: {
            type: 'string',
            enum: ['hourly', 'daily', 'monthly', 'yearly'],
            default: 'monthly'
          },
          currency: {
            type: 'string',
            default: 'USD'
          }
        }
      },
      outputs: {
        type: 'object',
        required: ['totalCost', 'breakdown'],
        properties: {
          totalCost: {
            type: 'number',
            description: 'Total estimated cost'
          },
          currency: {
            type: 'string'
          },
          timeframe: {
            type: 'string'
          },
          breakdown: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                resourceId: { type: 'string' },
                resourceType: { type: 'string' },
                sku: { oneOf: [{ type: 'string' }, { type: 'object' }] },
                unitPrice: { type: 'number' },
                quantity: { type: 'number' },
                cost: { type: 'number' }
              }
            }
          },
          recommendations: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      mcpServers: [
        {
          name: 'azure-pricing',
          endpoint: 'http://localhost:3001',

          // Optional stdio MCP transport (only used when AGENTICCODER_TOOL_TRANSPORT=mcp*).
          // Runs the python server in JSON-RPC stdio mode.
          stdioCommand: pythonCommand,
          stdioArgs: ['-m', 'azure_pricing_mcp', 'mcp'],
          stdioCwd: pricingMcpCwd
        }
      ],
      timeout: 30000
    };

    super(definition);
  }

  async _onExecute(input, context, executionId) {
    const { resources, timeframe = 'monthly', currency = 'USD' } = input;

    const breakdown = [];
    let totalCost = 0;

    // Get pricing for each resource
    for (const resource of resources) {
      try {
        const pricing = await this._getResourcePricing(resource, currency);
        const cost = this._calculateCost(pricing, resource, timeframe);
        
        breakdown.push({
          resourceId: resource.id,
          resourceType: resource.type,
          sku: resource.sku,
          location: resource.location,
          unitPrice: pricing.unitPrice || 0,
          quantity: resource.quantity || 1,
          cost,
          pricingDetails: pricing
        });

        totalCost += cost;
      } catch (error) {
        console.warn(`Failed to get pricing for ${resource.id}:`, error.message);
        breakdown.push({
          resourceId: resource.id,
          resourceType: resource.type,
          sku: resource.sku,
          cost: 0,
          error: error.message
        });
      }
    }

    // Generate cost optimization recommendations
    const recommendations = this._generateRecommendations(breakdown, totalCost);

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      currency,
      timeframe,
      breakdown,
      recommendations,
      metadata: {
        executionId,
        resourceCount: resources.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  async _getResourcePricing(resource, currency) {
    // Try live pricing via the configured pricing server (HTTP by default).
    // Falls back to mock estimates when the server is unavailable.
    const pricingClient = this.mcpClients.get('azure-pricing');
    const sku = resource.sku;
    const region = resource.location;

    if (pricingClient && sku) {
      try {
        // 1) Prefer MCP stdio tool call when available (safe no-op for HTTP clients).
        try {
          const toolResult = await pricingClient.call('tools/call', {
            name: 'price_search',
            arguments: {
              sku,
              region,
              currency
            }
          });

          const item = toolResult?.items?.[0];
          const retailPrice = typeof item?.retailPrice === 'number' ? item.retailPrice : null;
          const unitOfMeasure = typeof item?.unitOfMeasure === 'string' ? item.unitOfMeasure : null;

          if (retailPrice !== null) {
            return {
              unitPrice: retailPrice,
              unit: unitOfMeasure || 'Hour',
              source: 'azure-pricing-mcp-stdio',
              sku,
              region,
              raw: item
            };
          }
        } catch {
          // Fall through to HTTP.
        }

        // 2) HTTP pricing server (Express) fallback.
        const response = await pricingClient.call('GET /api/prices', {
          contains: sku,
          armRegionName: region,
          currencyCode: currency,
          limit: 1
        });

        const item = response?.data?.[0];
        const retailPrice = typeof item?.retailPrice === 'number' ? item.retailPrice : null;
        const unitOfMeasure = typeof item?.unitOfMeasure === 'string' ? item.unitOfMeasure : null;

        if (retailPrice !== null) {
          return {
            unitPrice: retailPrice,
            unit: unitOfMeasure || 'Hour',
            source: 'azure-retail-prices',
            sku,
            region,
            raw: item
          };
        }
      } catch {
        // Ignore and fall back to mocked estimates.
      }
    }

    // Mock pricing data (offline fallback)
    const pricingMap = {
      'Microsoft.Compute/virtualMachines': {
        'Standard_B2s': { unitPrice: 0.0416, unit: 'Hour' },
        'Standard_D2s_v3': { unitPrice: 0.096, unit: 'Hour' }
      },
      'Microsoft.Storage/storageAccounts': {
        'Standard_LRS': { unitPrice: 0.0184, unit: 'GB/Month' },
        'Premium_LRS': { unitPrice: 0.15, unit: 'GB/Month' }
      },
      'Microsoft.Web/sites': {
        'Y1': { unitPrice: 0.000016, unit: 'Execution/Second' },
        'S1': { unitPrice: 0.10, unit: 'Hour' }
      },
      'Microsoft.KeyVault/vaults': {
        'standard': { unitPrice: 0.03, unit: 'Operation/10000' }
      },
      'Microsoft.OperationalInsights/workspaces': {
        'PerGB2018': { unitPrice: 2.76, unit: 'GB/Month' }
      }
    };

    const resourcePricing = pricingMap[resource.type];
    if (!resourcePricing) {
      return { unitPrice: 0, unit: 'Unknown', estimatedOnly: true };
    }

    const skuPricing = resourcePricing[resource.sku];
    if (!skuPricing) {
      // Return first available SKU pricing as estimate
      const firstSku = Object.keys(resourcePricing)[0];
      return { ...resourcePricing[firstSku], estimatedOnly: true };
    }

    return skuPricing;
  }

  _calculateCost(pricing, resource, timeframe) {
    const { unitPrice, unit } = pricing;
    const quantity = resource.quantity || 1;

    // Convert to requested timeframe
    let multiplier = 1;
    
    if (unit.includes('Hour')) {
      if (timeframe === 'hourly') multiplier = 1;
      else if (timeframe === 'daily') multiplier = 24;
      else if (timeframe === 'monthly') multiplier = 730; // Average hours per month
      else if (timeframe === 'yearly') multiplier = 8760;
    } else if (unit.includes('Month')) {
      if (timeframe === 'hourly') multiplier = 1 / 730;
      else if (timeframe === 'daily') multiplier = 1 / 30;
      else if (timeframe === 'monthly') multiplier = 1;
      else if (timeframe === 'yearly') multiplier = 12;
    }

    // Special handling for different resource types
    if (resource.type.includes('Storage')) {
      // Storage is typically charged per GB
      const storageSize = resource.properties?.storageSize || 100; // Default 100GB
      return unitPrice * storageSize * multiplier * quantity;
    } else if (resource.type.includes('sites') && resource.sku === 'Y1') {
      // Function consumption plan - estimate based on executions
      const executionsPerMonth = resource.properties?.estimatedExecutions || 1000000;
      return (executionsPerMonth / 1000000) * 0.20; // $0.20 per million executions
    }

    return unitPrice * multiplier * quantity;
  }

  _generateRecommendations(breakdown, totalCost) {
    const recommendations = [];

    // Check for expensive resources
    const sortedByPrice = [...breakdown].sort((a, b) => b.cost - a.cost);
    const topExpensive = sortedByPrice.slice(0, 3);

    for (const item of topExpensive) {
      if (item.cost > totalCost * 0.3) {
        recommendations.push(
          `${item.resourceType} (${item.sku}) accounts for ${((item.cost/totalCost)*100).toFixed(1)}% of total cost. Consider optimizing.`
        );
      }
    }

    // Check for reserved instances opportunities
    const computeResources = breakdown.filter(r => 
      r.resourceType.includes('virtualMachines') || r.resourceType.includes('sites')
    );
    
    if (computeResources.length > 0) {
      recommendations.push('Consider Reserved Instances for compute resources to save up to 72%');
    }

    // Check for dev/test pricing
    recommendations.push('Enable Dev/Test pricing for non-production environments');

    // Storage optimization
    const storageResources = breakdown.filter(r => r.resourceType.includes('Storage'));
    const hasPremiumStorage = storageResources.some(r => {
      const skuName = typeof r.sku === 'string' ? r.sku : r.sku?.name;
      return skuName?.includes('Premium');
    });
    if (hasPremiumStorage) {
      recommendations.push('Review Premium storage usage - Standard storage may be sufficient for some workloads');
    }

    // Budget alerts
    if (totalCost > 1000) {
      recommendations.push('Set up Azure Cost Management budgets and alerts');
    }

    return recommendations;
  }
}
