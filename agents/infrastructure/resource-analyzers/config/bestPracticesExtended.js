/**
 * Best Practices Extended - Additional resource configurations
 * Imports and extends the base best practices
 */

import { BEST_PRACTICES as BASE_PRACTICES } from './bestPractices.js';

const EXTENDED_PRACTICES = {
  // ============================================================================
  // CONTAINERS
  // ============================================================================
  'Microsoft.ContainerService/managedClusters': {
    dev: {
      sku: { name: 'Base', tier: 'Free' },
      properties: {
        dnsPrefix: 'aks',
        agentPoolProfiles: [{
          name: 'system',
          count: 1,
          vmSize: 'Standard_B2s',
          mode: 'System',
          osType: 'Linux'
        }],
        networkProfile: {
          networkPlugin: 'azure',
          networkPolicy: 'azure'
        }
      }
    },
    prod: {
      sku: { name: 'Base', tier: 'Standard' },
      properties: {
        dnsPrefix: 'aks',
        agentPoolProfiles: [{
          name: 'system',
          count: 3,
          vmSize: 'Standard_D4s_v5',
          mode: 'System',
          osType: 'Linux',
          availabilityZones: ['1', '2', '3']
        }],
        networkProfile: {
          networkPlugin: 'azure',
          networkPolicy: 'azure',
          outboundType: 'userDefinedRouting'
        },
        addonProfiles: {
          azurePolicy: { enabled: true },
          omsAgent: { enabled: true }
        },
        enableRBAC: true,
        aadProfile: { managed: true, enableAzureRBAC: true }
      }
    }
  },

  'Microsoft.ContainerRegistry/registries': {
    dev: {
      sku: { name: 'Basic' },
      properties: { adminUserEnabled: false }
    },
    prod: {
      sku: { name: 'Premium' },
      properties: {
        adminUserEnabled: false,
        networkRuleSet: { defaultAction: 'Deny' },
        policies: {
          quarantinePolicy: { status: 'enabled' },
          trustPolicy: { type: 'Notary', status: 'enabled' },
          retentionPolicy: { days: 30, status: 'enabled' }
        },
        zoneRedundancy: 'Enabled'
      }
    }
  },

  'Microsoft.App/managedEnvironments': {
    dev: {
      properties: {
        zoneRedundant: false
      }
    },
    prod: {
      properties: {
        zoneRedundant: true
      }
    }
  },

  'Microsoft.App/containerApps': {
    dev: {
      properties: {
        configuration: {
          ingress: { external: true, targetPort: 80, transport: 'http' }
        },
        template: {
          scale: { minReplicas: 0, maxReplicas: 2 }
        }
      }
    },
    prod: {
      properties: {
        configuration: {
          ingress: { external: true, targetPort: 80, transport: 'http2' }
        },
        template: {
          scale: { minReplicas: 2, maxReplicas: 10 }
        }
      }
    }
  },

  // ============================================================================
  // NETWORKING
  // ============================================================================
  'Microsoft.Network/virtualNetworks': {
    dev: {
      properties: {
        addressSpace: { addressPrefixes: ['10.0.0.0/16'] },
        subnets: [
          { name: 'default', properties: { addressPrefix: '10.0.0.0/24' } }
        ]
      }
    },
    prod: {
      properties: {
        addressSpace: { addressPrefixes: ['10.0.0.0/16'] },
        subnets: [
          { name: 'GatewaySubnet', properties: { addressPrefix: '10.0.0.0/27' } },
          { name: 'AzureFirewallSubnet', properties: { addressPrefix: '10.0.1.0/26' } },
          { name: 'AzureBastionSubnet', properties: { addressPrefix: '10.0.2.0/26' } },
          { name: 'ApplicationSubnet', properties: { addressPrefix: '10.0.10.0/24' } },
          { name: 'DatabaseSubnet', properties: { addressPrefix: '10.0.20.0/24' } }
        ],
        enableDdosProtection: true
      }
    }
  },

  'Microsoft.Network/networkSecurityGroups': {
    dev: {
      properties: {
        securityRules: [{
          name: 'DenyAllInbound',
          properties: {
            priority: 4096, direction: 'Inbound', access: 'Deny',
            protocol: '*', sourceAddressPrefix: '*', sourcePortRange: '*',
            destinationAddressPrefix: '*', destinationPortRange: '*'
          }
        }]
      }
    },
    prod: {
      properties: {
        securityRules: [{
          name: 'DenyAllInbound',
          properties: {
            priority: 4096, direction: 'Inbound', access: 'Deny',
            protocol: '*', sourceAddressPrefix: '*', sourcePortRange: '*',
            destinationAddressPrefix: '*', destinationPortRange: '*'
          }
        }]
      }
    }
  },

  'Microsoft.Network/publicIPAddresses': {
    dev: {
      sku: { name: 'Basic' },
      properties: { publicIPAllocationMethod: 'Dynamic' }
    },
    prod: {
      sku: { name: 'Standard' },
      properties: { publicIPAllocationMethod: 'Static' },
      zones: ['1', '2', '3']
    }
  },

  'Microsoft.Network/loadBalancers': {
    dev: {
      sku: { name: 'Basic' }
    },
    prod: {
      sku: { name: 'Standard' }
    }
  },

  'Microsoft.Network/bastionHosts': {
    dev: {
      sku: { name: 'Basic' }
    },
    prod: {
      sku: { name: 'Standard' },
      properties: {
        enableTunneling: true,
        enableFileCopy: true,
        enableShareableLink: false
      }
    }
  },

  'Microsoft.Network/azureFirewalls': {
    dev: {
      sku: { name: 'AZFW_VNet', tier: 'Standard' }
    },
    prod: {
      sku: { name: 'AZFW_VNet', tier: 'Premium' },
      zones: ['1', '2', '3']
    }
  },

  // ============================================================================
  // SECURITY
  // ============================================================================
  'Microsoft.KeyVault/vaults': {
    dev: {
      sku: { family: 'A', name: 'standard' },
      properties: {
        tenantId: '${subscription().tenantId}',
        enableSoftDelete: true,
        softDeleteRetentionInDays: 7,
        enableRbacAuthorization: true,
        enablePurgeProtection: false
      }
    },
    prod: {
      sku: { family: 'A', name: 'premium' },
      properties: {
        tenantId: '${subscription().tenantId}',
        enableSoftDelete: true,
        softDeleteRetentionInDays: 90,
        enableRbacAuthorization: true,
        enablePurgeProtection: true,
        networkAcls: { defaultAction: 'Deny', bypass: 'AzureServices' }
      }
    }
  },

  'Microsoft.ManagedIdentity/userAssignedIdentities': {
    dev: { properties: {} },
    prod: { properties: {} }
  },

  // ============================================================================
  // CACHING
  // ============================================================================
  'Microsoft.Cache/redis': {
    dev: {
      sku: { name: 'Basic', family: 'C', capacity: 0 },
      properties: { minimumTlsVersion: '1.2', publicNetworkAccess: 'Enabled' }
    },
    prod: {
      sku: { name: 'Premium', family: 'P', capacity: 1 },
      properties: { minimumTlsVersion: '1.2', publicNetworkAccess: 'Disabled' },
      zones: ['1', '2', '3']
    }
  },

  // ============================================================================
  // MESSAGING
  // ============================================================================
  'Microsoft.EventHub/namespaces': {
    dev: {
      sku: { name: 'Basic', tier: 'Basic', capacity: 1 },
      properties: { minimumTlsVersion: '1.2' }
    },
    prod: {
      sku: { name: 'Standard', tier: 'Standard', capacity: 2 },
      properties: { minimumTlsVersion: '1.2', zoneRedundant: true }
    }
  },

  'Microsoft.ServiceBus/namespaces': {
    dev: {
      sku: { name: 'Basic', tier: 'Basic' },
      properties: { minimumTlsVersion: '1.2' }
    },
    prod: {
      sku: { name: 'Premium', tier: 'Premium', capacity: 1 },
      properties: { minimumTlsVersion: '1.2', zoneRedundant: true }
    }
  },

  'Microsoft.EventGrid/topics': {
    dev: {
      sku: { name: 'Basic' },
      properties: { inputSchema: 'CloudEventSchemaV1_0' }
    },
    prod: {
      sku: { name: 'Basic' },
      properties: {
        inputSchema: 'CloudEventSchemaV1_0',
        publicNetworkAccess: 'Disabled'
      }
    }
  },

  // ============================================================================
  // MONITORING
  // ============================================================================
  'Microsoft.Insights/components': {
    dev: {
      kind: 'web',
      properties: { Application_Type: 'web', RetentionInDays: 30 }
    },
    prod: {
      kind: 'web',
      properties: { Application_Type: 'web', RetentionInDays: 90, DisableLocalAuth: true }
    }
  },

  'Microsoft.OperationalInsights/workspaces': {
    dev: {
      properties: { sku: { name: 'PerGB2018' }, retentionInDays: 30 }
    },
    prod: {
      properties: { sku: { name: 'PerGB2018' }, retentionInDays: 90 }
    }
  },

  // ============================================================================
  // AI & ML
  // ============================================================================
  'Microsoft.CognitiveServices/accounts': {
    dev: {
      kind: 'CognitiveServices',
      sku: { name: 'S0' },
      properties: { publicNetworkAccess: 'Enabled' }
    },
    prod: {
      kind: 'CognitiveServices',
      sku: { name: 'S0' },
      properties: { publicNetworkAccess: 'Disabled', disableLocalAuth: true }
    }
  },

  'Microsoft.MachineLearningServices/workspaces': {
    dev: {
      sku: { name: 'Basic', tier: 'Basic' },
      properties: { publicNetworkAccess: 'Enabled' }
    },
    prod: {
      sku: { name: 'Basic', tier: 'Basic' },
      properties: {
        publicNetworkAccess: 'Disabled',
        v1LegacyMode: false
      }
    }
  },

  // ============================================================================
  // IoT
  // ============================================================================
  'Microsoft.Devices/IotHubs': {
    dev: {
      sku: { name: 'F1', capacity: 1 },
      properties: { minTlsVersion: '1.2' }
    },
    prod: {
      sku: { name: 'S1', capacity: 2 },
      properties: { minTlsVersion: '1.2' }
    }
  },

  'Microsoft.DigitalTwins/digitalTwinsInstances': {
    dev: { properties: {} },
    prod: { properties: { publicNetworkAccess: 'Disabled' } }
  },

  // ============================================================================
  // VIRTUAL DESKTOP
  // ============================================================================
  'Microsoft.DesktopVirtualization/hostPools': {
    dev: {
      properties: {
        hostPoolType: 'Pooled',
        loadBalancerType: 'BreadthFirst',
        preferredAppGroupType: 'Desktop',
        maxSessionLimit: 5,
        validationEnvironment: true
      }
    },
    prod: {
      properties: {
        hostPoolType: 'Pooled',
        loadBalancerType: 'DepthFirst',
        preferredAppGroupType: 'Desktop',
        maxSessionLimit: 10,
        validationEnvironment: false
      }
    }
  },

  // ============================================================================
  // INTEGRATION
  // ============================================================================
  'Microsoft.ApiManagement/service': {
    dev: {
      sku: { name: 'Developer', capacity: 1 },
      properties: { publisherEmail: 'admin@contoso.com', publisherName: 'Contoso' }
    },
    prod: {
      sku: { name: 'Premium', capacity: 2 },
      properties: {
        publisherEmail: 'admin@contoso.com',
        publisherName: 'Contoso'
      },
      zones: ['1', '2', '3']
    }
  },

  'Microsoft.Logic/workflows': {
    dev: { properties: { state: 'Enabled' } },
    prod: { properties: { state: 'Enabled' } }
  },

  // ============================================================================
  // ANALYTICS
  // ============================================================================
  'Microsoft.Synapse/workspaces': {
    dev: {
      properties: { publicNetworkAccess: 'Enabled' }
    },
    prod: {
      properties: { publicNetworkAccess: 'Disabled', managedVirtualNetwork: 'default' }
    }
  },

  'Microsoft.Databricks/workspaces': {
    dev: {
      sku: { name: 'standard' },
      properties: { managedResourceGroupId: '' }
    },
    prod: {
      sku: { name: 'premium' },
      properties: {
        managedResourceGroupId: '',
        publicNetworkAccess: 'Disabled',
        requiredNsgRules: 'AllRules'
      }
    }
  },

  'Microsoft.Kusto/clusters': {
    dev: {
      sku: { name: 'Dev(No SLA)_Standard_E2a_v4', tier: 'Basic', capacity: 1 },
      properties: { enableStreamingIngest: true }
    },
    prod: {
      sku: { name: 'Standard_E8s_v5', tier: 'Standard', capacity: 3 },
      properties: { enableStreamingIngest: true },
      zones: ['1', '2', '3']
    }
  },

  // ============================================================================
  // GRAFANA & MONITORING
  // ============================================================================
  'Microsoft.Dashboard/grafana': {
    dev: {
      sku: { name: 'Standard' },
      properties: { zoneRedundancy: 'Disabled' }
    },
    prod: {
      sku: { name: 'Standard' },
      properties: { zoneRedundancy: 'Enabled' }
    }
  },

  // ============================================================================
  // RECOVERY
  // ============================================================================
  'Microsoft.RecoveryServices/vaults': {
    dev: {
      sku: { name: 'Standard', tier: 'Standard' },
      properties: { publicNetworkAccess: 'Enabled' }
    },
    prod: {
      sku: { name: 'Standard', tier: 'Standard' },
      properties: {
        publicNetworkAccess: 'Disabled',
        securitySettings: { softDeleteSettings: { softDeleteState: 'Enabled' } }
      }
    }
  }
};

// Merge base and extended practices
export const ALL_BEST_PRACTICES = { ...BASE_PRACTICES, ...EXTENDED_PRACTICES };

/**
 * Get best practices for a resource type
 */
export function getBestPractices(resourceType, environment = 'dev') {
  const practices = ALL_BEST_PRACTICES[resourceType];
  return practices?.[environment] || practices?.dev || {};
}

export default ALL_BEST_PRACTICES;
