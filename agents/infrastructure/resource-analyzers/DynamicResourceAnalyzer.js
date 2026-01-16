/**
 * DynamicResourceAnalyzer - Consolidated Resource Analyzer with Full Capability
 * 
 * This analyzer replaces all individual analyzers and provides:
 * 1. Runtime validation of resource types against supported Bicep schemas
 * 2. Automatic dependency detection and resource generation
 * 3. Solution templates for complete architectures
 * 4. Best practices injection (SKU selection, security defaults)
 * 5. Dynamic resource generation based on task requirements
 * 
 * Configuration is modular and loaded from separate files for maintainability:
 * - config/dependencyGraph.js - Resource dependencies
 * - config/solutionTemplates.js - Pre-defined architectures
 * - config/bestPractices.js - Security & performance defaults
 * - config/namingConventions.js - Azure naming standards
 */

import BaseResourceAnalyzer from './BaseResourceAnalyzer.js';
import * as schemaValidator from './schema-discovery/schemaValidator.js';

// Import modular configurations
import { 
  DEPENDENCY_GRAPH, 
  getDependencies, 
  getAllRequiredDependencies 
} from './config/dependencyGraph.js';
import { 
  SOLUTION_TEMPLATES, 
  findSolutionTemplate, 
  getAllTemplates 
} from './config/solutionTemplates.js';
import { 
  ALL_BEST_PRACTICES, 
  getBestPractices 
} from './config/bestPracticesExtended.js';
import { 
  NAMING_PREFIXES, 
  getPrefix, 
  generateName, 
  getEnvironmentShort 
} from './config/namingConventions.js';

/**
 * Resource type mappings from keywords to Azure resource types
 */
const RESOURCE_TYPE_MAPPINGS = {
  // Compute
  'virtual machine': 'Microsoft.Compute/virtualMachines',
  'vm': 'Microsoft.Compute/virtualMachines',
  'vmss': 'Microsoft.Compute/virtualMachineScaleSets',
  'scale set': 'Microsoft.Compute/virtualMachineScaleSets',
  'availability set': 'Microsoft.Compute/availabilitySets',
  'disk': 'Microsoft.Compute/disks',
  
  // Web
  'web app': 'Microsoft.Web/sites',
  'app service': 'Microsoft.Web/sites',
  'function app': 'Microsoft.Web/sites',
  'function': 'Microsoft.Web/sites',
  'app service plan': 'Microsoft.Web/serverfarms',
  'static site': 'Microsoft.Web/staticSites',
  'static web app': 'Microsoft.Web/staticSites',
  
  // Storage
  'storage': 'Microsoft.Storage/storageAccounts',
  'storage account': 'Microsoft.Storage/storageAccounts',
  'blob': 'Microsoft.Storage/storageAccounts/blobServices/containers',
  
  // Database
  'sql server': 'Microsoft.Sql/servers',
  'sql database': 'Microsoft.Sql/servers/databases',
  'sql': 'Microsoft.Sql/servers',
  'cosmos': 'Microsoft.DocumentDB/databaseAccounts',
  'cosmosdb': 'Microsoft.DocumentDB/databaseAccounts',
  'mysql': 'Microsoft.DBforMySQL/flexibleServers',
  'postgresql': 'Microsoft.DBforPostgreSQL/flexibleServers',
  'postgres': 'Microsoft.DBforPostgreSQL/flexibleServers',
  
  // Networking
  'virtual network': 'Microsoft.Network/virtualNetworks',
  'vnet': 'Microsoft.Network/virtualNetworks',
  'subnet': 'Microsoft.Network/virtualNetworks/subnets',
  'nsg': 'Microsoft.Network/networkSecurityGroups',
  'network security group': 'Microsoft.Network/networkSecurityGroups',
  'load balancer': 'Microsoft.Network/loadBalancers',
  'application gateway': 'Microsoft.Network/applicationGateways',
  'firewall': 'Microsoft.Network/azureFirewalls',
  'bastion': 'Microsoft.Network/bastionHosts',
  'nat gateway': 'Microsoft.Network/natGateways',
  'public ip': 'Microsoft.Network/publicIPAddresses',
  'private endpoint': 'Microsoft.Network/privateEndpoints',
  'dns zone': 'Microsoft.Network/dnsZones',
  'private dns': 'Microsoft.Network/privateDnsZones',
  
  // Security
  'key vault': 'Microsoft.KeyVault/vaults',
  'keyvault': 'Microsoft.KeyVault/vaults',
  'managed identity': 'Microsoft.ManagedIdentity/userAssignedIdentities',
  
  // Containers
  'aks': 'Microsoft.ContainerService/managedClusters',
  'kubernetes': 'Microsoft.ContainerService/managedClusters',
  'container app': 'Microsoft.App/containerApps',
  'container registry': 'Microsoft.ContainerRegistry/registries',
  'acr': 'Microsoft.ContainerRegistry/registries',
  
  // Messaging
  'service bus': 'Microsoft.ServiceBus/namespaces',
  'event hub': 'Microsoft.EventHub/namespaces',
  'event grid': 'Microsoft.EventGrid/topics',
  
  // Monitoring
  'application insights': 'Microsoft.Insights/components',
  'app insights': 'Microsoft.Insights/components',
  'log analytics': 'Microsoft.OperationalInsights/workspaces',
  
  // AI & ML
  'cognitive services': 'Microsoft.CognitiveServices/accounts',
  'openai': 'Microsoft.CognitiveServices/accounts',
  'machine learning': 'Microsoft.MachineLearningServices/workspaces',
  'ml workspace': 'Microsoft.MachineLearningServices/workspaces',
  
  // Integration
  'logic app': 'Microsoft.Logic/workflows',
  'api management': 'Microsoft.ApiManagement/service',
  'apim': 'Microsoft.ApiManagement/service',
  
  // Caching
  'redis': 'Microsoft.Cache/redis',
  'cache': 'Microsoft.Cache/redis',
  
  // Analytics
  'synapse': 'Microsoft.Synapse/workspaces',
  'data factory': 'Microsoft.DataFactory/factories',
  'databricks': 'Microsoft.Databricks/workspaces',
  'stream analytics': 'Microsoft.StreamAnalytics/streamingjobs',
  
  // Search
  'search': 'Microsoft.Search/searchServices',
  'search service': 'Microsoft.Search/searchServices',
  
  // CDN
  'cdn': 'Microsoft.Cdn/profiles',
  
  // Other
  'app configuration': 'Microsoft.AppConfiguration/configurationStores',
  'signalr': 'Microsoft.SignalRService/signalR',
  'notification hub': 'Microsoft.NotificationHubs/namespaces',
  
  // IoT (Newly discovered support)
  'iot hub': 'Microsoft.Devices/IotHubs',
  'iothub': 'Microsoft.Devices/IotHubs',
  'iot': 'Microsoft.Devices/IotHubs',
  'device provisioning': 'Microsoft.Devices/provisioningServices',
  'dps': 'Microsoft.Devices/provisioningServices',
  
  // Digital Twins (Newly discovered support)
  'digital twins': 'Microsoft.DigitalTwins/digitalTwinsInstances',
  'digitaltwins': 'Microsoft.DigitalTwins/digitalTwinsInstances',
  'adt': 'Microsoft.DigitalTwins/digitalTwinsInstances',
  
  // Communication Services (Newly discovered support)
  'communication services': 'Microsoft.Communication/communicationServices',
  'acs': 'Microsoft.Communication/communicationServices',
  'email service': 'Microsoft.Communication/emailServices',
  
  // Azure Virtual Desktop (Newly discovered support)
  'virtual desktop': 'Microsoft.DesktopVirtualization/hostPools',
  'avd': 'Microsoft.DesktopVirtualization/hostPools',
  'host pool': 'Microsoft.DesktopVirtualization/hostPools',
  'application group': 'Microsoft.DesktopVirtualization/applicationGroups',
  'avd workspace': 'Microsoft.DesktopVirtualization/workspaces',
  'scaling plan': 'Microsoft.DesktopVirtualization/scalingPlans',
  
  // Container Instances (Confirmed support)
  'container instance': 'Microsoft.ContainerInstance/containerGroups',
  'aci': 'Microsoft.ContainerInstance/containerGroups',
  'container group': 'Microsoft.ContainerInstance/containerGroups',
  
  // Batch (Confirmed support)
  'batch': 'Microsoft.Batch/batchAccounts',
  'batch account': 'Microsoft.Batch/batchAccounts',
  'batch pool': 'Microsoft.Batch/batchAccounts/pools',
  
  // Data Explorer / Kusto
  'kusto': 'Microsoft.Kusto/clusters',
  'data explorer': 'Microsoft.Kusto/clusters',
  'adx': 'Microsoft.Kusto/clusters',
  'kusto cluster': 'Microsoft.Kusto/clusters',
  'kusto database': 'Microsoft.Kusto/clusters/databases',
  
  // Dev Center / DevBox
  'dev center': 'Microsoft.DevCenter/devcenters',
  'devcenter': 'Microsoft.DevCenter/devcenters',
  'devbox': 'Microsoft.DevCenter/projects/pools',
  'dev box': 'Microsoft.DevCenter/projects/pools',
  
  // Automation
  'automation': 'Microsoft.Automation/automationAccounts',
  'automation account': 'Microsoft.Automation/automationAccounts',
  'runbook': 'Microsoft.Automation/automationAccounts/runbooks',
  
  // Cost Management
  'cost management': 'Microsoft.CostManagement/exports',
  'budget': 'Microsoft.CostManagement/budgets',
  'cost export': 'Microsoft.CostManagement/exports',
  
  // Recovery Services
  'recovery vault': 'Microsoft.RecoveryServices/vaults',
  'backup vault': 'Microsoft.RecoveryServices/vaults',
  'rsv': 'Microsoft.RecoveryServices/vaults',
  
  // Load Test
  'load test': 'Microsoft.LoadTestService/loadTests',
  'load testing': 'Microsoft.LoadTestService/loadTests',
  'alt': 'Microsoft.LoadTestService/loadTests',
  
  // Purview
  'purview': 'Microsoft.Purview/accounts',
  'data catalog': 'Microsoft.Purview/accounts',
  
  // NetApp
  'netapp': 'Microsoft.NetApp/netAppAccounts',
  'anf': 'Microsoft.NetApp/netAppAccounts',
  'azure netapp files': 'Microsoft.NetApp/netAppAccounts',
  'netapp volume': 'Microsoft.NetApp/netAppAccounts/capacityPools/volumes',
  
  // HDInsight
  'hdinsight': 'Microsoft.HDInsight/clusters',
  'hdi': 'Microsoft.HDInsight/clusters',
  'hadoop': 'Microsoft.HDInsight/clusters',
  'spark cluster': 'Microsoft.HDInsight/clusters',
  
  // Healthcare APIs
  'healthcare api': 'Microsoft.HealthcareApis/workspaces',
  'fhir': 'Microsoft.HealthcareApis/workspaces/fhirservices',
  'dicom': 'Microsoft.HealthcareApis/workspaces/dicomservices',
  'health data': 'Microsoft.HealthcareApis/workspaces',
  
  // Azure VMware Solution
  'avs': 'Microsoft.AVS/privateClouds',
  'azure vmware': 'Microsoft.AVS/privateClouds',
  'vmware solution': 'Microsoft.AVS/privateClouds',
  
  // Hybrid Compute
  'arc machine': 'Microsoft.HybridCompute/machines',
  'arc server': 'Microsoft.HybridCompute/machines',
  'hybrid compute': 'Microsoft.HybridCompute/machines',
  
  // Time Series Insights
  'time series': 'Microsoft.TimeSeriesInsights/environments',
  'tsi': 'Microsoft.TimeSeriesInsights/environments',
  
  // Portal
  'dashboard': 'Microsoft.Portal/dashboards',
  'azure dashboard': 'Microsoft.Portal/dashboards',
  
  // Maintenance
  'maintenance configuration': 'Microsoft.Maintenance/maintenanceConfigurations',
  'maintenance': 'Microsoft.Maintenance/maintenanceConfigurations',
  
  // Policy & Security
  'remediation': 'Microsoft.PolicyInsights/remediations',
  'attestation': 'Microsoft.PolicyInsights/attestations',
  'security connector': 'Microsoft.Security/securityConnectors',
  
  // Service Fabric
  'service fabric': 'Microsoft.ServiceFabric/clusters',
  'sf cluster': 'Microsoft.ServiceFabric/managedClusters',
  
  // Storage Sync
  'storage sync': 'Microsoft.StorageSync/storageSyncServices',
  'azure file sync': 'Microsoft.StorageSync/storageSyncServices',
  
  // Data Lake
  'data lake store': 'Microsoft.DataLakeStore/accounts',
  'adls': 'Microsoft.DataLakeStore/accounts',
  'data lake analytics': 'Microsoft.DataLakeAnalytics/accounts',
  'adla': 'Microsoft.DataLakeAnalytics/accounts',
  
  // Lab Services
  'lab services': 'Microsoft.LabServices/labs',
  'lab plan': 'Microsoft.LabServices/labPlans',
  
  // Attestation
  'attestation provider': 'Microsoft.Attestation/attestationProviders',
  
  // Chaos Engineering
  'chaos': 'Microsoft.Chaos/experiments',
  'chaos experiment': 'Microsoft.Chaos/experiments',
  'chaos engineering': 'Microsoft.Chaos/experiments',
  
  // Confidential Ledger
  'confidential ledger': 'Microsoft.ConfidentialLedger/ledgers',
  'acl': 'Microsoft.ConfidentialLedger/ledgers',
  
  // Network Fabric
  'network fabric': 'Microsoft.ManagedNetworkFabric/networkFabrics',
  
  // Orbital (Space)
  'orbital': 'Microsoft.Orbital/spacecrafts',
  'satellite': 'Microsoft.Orbital/spacecrafts',
  'ground station': 'Microsoft.Orbital/groundStations',
  
  // Partner Solutions
  'elastic': 'Microsoft.Elastic/monitors',
  'elasticsearch': 'Microsoft.Elastic/monitors',
  'datadog': 'Microsoft.Datadog/monitors',
  'confluent': 'Microsoft.Confluent/organizations',
  'kafka': 'Microsoft.Confluent/organizations',
  
  // Spring Apps
  'spring apps': 'Microsoft.AppPlatform/Spring',
  'spring cloud': 'Microsoft.AppPlatform/Spring',
  
  // Voice Services
  'voice services': 'Microsoft.VoiceServices/communicationsGateways',
  'operator connect': 'Microsoft.VoiceServices/communicationsGateways',
  
  // Video Indexer
  'video indexer': 'Microsoft.VideoIndexer/accounts',
  
  // Grafana
  'grafana': 'Microsoft.Dashboard/grafana',
  'managed grafana': 'Microsoft.Dashboard/grafana',
  
  // AgriFood
  'farmbeats': 'Microsoft.AgFoodPlatform/farmBeats',
  'agfood': 'Microsoft.AgFoodPlatform/farmBeats',
  
  // Quantum
  'quantum': 'Microsoft.Quantum/workspaces',
  'quantum computing': 'Microsoft.Quantum/workspaces',
  
  // Hybrid Connectivity
  'hybrid connectivity': 'Microsoft.HybridConnectivity/endpoints',
  
  // SAP Workloads
  'sap': 'Microsoft.Workloads/sapVirtualInstances',
  'sap virtual instance': 'Microsoft.Workloads/sapVirtualInstances',
  
  // Storage Mover
  'storage mover': 'Microsoft.StorageMover/storageMovers',
  
  // Energy Platform
  'energy platform': 'Microsoft.OpenEnergyPlatform/energyServices',
  'osdu': 'Microsoft.OpenEnergyPlatform/energyServices'
};

export default class DynamicResourceAnalyzer extends BaseResourceAnalyzer {
  static keywords = [];  // Matches all - this is the consolidated analyzer
  static priority = 10;  // High priority - main analyzer

  constructor() {
    super();
    this.supportedMappings = this._buildSupportedMappings();
    this.generatedResources = new Map(); // Track generated resources to avoid duplicates
  }

  /**
   * Build mappings for only supported resource types
   */
  _buildSupportedMappings() {
    const supported = {};
    for (const [keyword, resourceType] of Object.entries(RESOURCE_TYPE_MAPPINGS)) {
      if (schemaValidator.isSupported(resourceType)) {
        supported[keyword] = resourceType;
      }
    }
    return supported;
  }

  /**
   * Find matching resource types from task description
   * @param {string} description 
   * @returns {Array<{keyword: string, resourceType: string, apiVersion: string}>}
   */
  findMatches(description) {
    const lowerDesc = description.toLowerCase();
    const matches = [];
    const matchedTypes = new Set();
    
    for (const [keyword, resourceType] of Object.entries(this.supportedMappings)) {
      if (lowerDesc.includes(keyword) && !matchedTypes.has(resourceType)) {
        const apiVersion = schemaValidator.getLatestApiVersion(resourceType);
        matches.push({ keyword, resourceType, apiVersion });
        matchedTypes.add(resourceType);
      }
    }
    
    return matches;
  }

  /**
   * Check if this analyzer matches
   */
  matches(description) {
    return findSolutionTemplate(description) !== null || 
           this.findMatches(description).length > 0;
  }

  /**
   * Analyze task and generate validated resources with dependencies
   */
  analyze(task, constraints) {
    const description = task.description || '';
    this.generatedResources.clear();
    
    // Check for solution template first
    const solutionTemplate = findSolutionTemplate(description);
    if (solutionTemplate) {
      return this._generateFromSolutionTemplate(solutionTemplate, constraints);
    }

    // Otherwise, generate individual resources with dependencies
    const matches = this.findMatches(description);
    const resources = [];

    for (const match of matches) {
      const resourcesWithDeps = this._generateResourceWithDependencies(
        match.resourceType, 
        match.apiVersion, 
        constraints
      );
      resources.push(...resourcesWithDeps);
    }

    return this._deduplicateResources(resources);
  }

  /**
   * Generate resources from a solution template
   */
  _generateFromSolutionTemplate(template, constraints) {
    const resources = [];

    for (const resourceType of template.resources) {
      if (!this.generatedResources.has(resourceType)) {
        const apiVersion = schemaValidator.getLatestApiVersion(resourceType);
        const templateConfig = template.config?.[resourceType] || {};
        const resource = this._generateResourceForType(resourceType, apiVersion, constraints, templateConfig);
        if (resource) {
          resources.push(resource);
          this.generatedResources.set(resourceType, resource);
        }
      }
    }

    return this._orderByDependencies(resources);
  }

  /**
   * Generate a resource with all its required dependencies
   */
  _generateResourceWithDependencies(resourceType, apiVersion, constraints, depth = 0) {
    if (depth > 5) return []; // Prevent infinite recursion
    if (this.generatedResources.has(resourceType)) return [];

    const resources = [];
    const deps = getDependencies(resourceType);

    // Generate required dependencies first
    if (deps?.requires) {
      for (const depType of deps.requires) {
        if (!this.generatedResources.has(depType)) {
          const depApiVersion = schemaValidator.getLatestApiVersion(depType);
          if (depApiVersion) {
            const depResources = this._generateResourceWithDependencies(depType, depApiVersion, constraints, depth + 1);
            resources.push(...depResources);
          }
        }
      }
    }

    // Generate the main resource
    const resource = this._generateResourceForType(resourceType, apiVersion, constraints);
    if (resource) {
      // Add dependency references
      if (deps?.requires?.length > 0) {
        resource.dependsOn = deps.requires
          .filter(depType => this.generatedResources.has(depType))
          .map(depType => this.generatedResources.get(depType).name);
      }
      resources.push(resource);
      this.generatedResources.set(resourceType, resource);
    }

    return resources;
  }

  /**
   * Generate a resource based on type with best practices applied
   */
  _generateResourceForType(resourceType, apiVersion, constraints, overrideConfig = {}) {
    const location = this._getLocation(constraints);
    const environment = this._getEnvironment(constraints);
    const isProd = environment === 'prod' || environment === 'production';
    
    // Get best practices for this resource type
    const bestPractices = getBestPractices(resourceType, isProd ? 'prod' : 'dev');

    // Generate name using naming conventions
    const name = generateName(resourceType, environment);

    // Base configuration
    const baseConfig = {
      location,
      tags: { 
        environment, 
        createdBy: 'AgenticCoder',
        managedBy: 'Bicep'
      }
    };

    // Merge configurations: base < best practices < override
    const config = this._deepMerge(baseConfig, bestPractices, overrideConfig);

    // Generate unique ID for resource tracking
    const resourceId = `${getPrefix(resourceType)}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const resource = {
      id: resourceId,
      type: resourceType,
      apiVersion: apiVersion || schemaValidator.getLatestApiVersion(resourceType),
      name,
      ...config
    };

    return resource;
  }

  /**
   * Deep merge objects
   */
  _deepMerge(...objects) {
    const result = {};
    for (const obj of objects) {
      if (!obj) continue;
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = this._deepMerge(result[key] || {}, value);
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  }

  /**
   * Order resources by dependencies (dependencies first)
   */
  _orderByDependencies(resources) {
    const ordered = [];
    const remaining = [...resources];
    const added = new Set();

    while (remaining.length > 0) {
      let addedThisRound = false;
      
      for (let i = remaining.length - 1; i >= 0; i--) {
        const resource = remaining[i];
        const deps = resource.dependsOn || [];
        const allDepsAdded = deps.every(dep => added.has(dep));
        
        if (allDepsAdded) {
          ordered.push(resource);
          added.add(resource.name);
          remaining.splice(i, 1);
          addedThisRound = true;
        }
      }

      // If no progress, add remaining (circular deps or missing deps)
      if (!addedThisRound) {
        ordered.push(...remaining);
        break;
      }
    }

    return ordered;
  }

  /**
   * Remove duplicate resources
   */
  _deduplicateResources(resources) {
    const seen = new Map();
    return resources.filter(resource => {
      const key = `${resource.type}:${resource.name}`;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  }

  /**
   * Get supported resource types summary
   */
  static getSupportedTypes() {
    return Object.entries(RESOURCE_TYPE_MAPPINGS)
      .filter(([_, type]) => schemaValidator.isSupported(type))
      .map(([keyword, type]) => ({ keyword, resourceType: type }));
  }

  /**
   * Get schema validator statistics
   */
  static getSchemaStats() {
    return schemaValidator.getStats();
  }

  /**
   * Get all available solution templates
   */
  static getSolutionTemplates() {
    return getAllTemplates();
  }

  /**
   * Get dependency graph for a resource type
   */
  static getDependencies(resourceType) {
    return getDependencies(resourceType);
  }

  /**
   * Get best practices for a resource type
   */
  static getBestPractices(resourceType, environment = 'dev') {
    return getBestPractices(resourceType, environment);
  }

  /**
   * Get configuration statistics
   */
  static getConfigStats() {
    return {
      dependencyRules: Object.keys(DEPENDENCY_GRAPH).length,
      solutionTemplates: Object.keys(SOLUTION_TEMPLATES).length,
      bestPracticeConfigs: Object.keys(ALL_BEST_PRACTICES).length,
      namingPrefixes: Object.keys(NAMING_PREFIXES).length,
      keywordMappings: Object.keys(RESOURCE_TYPE_MAPPINGS).length
    };
  }
}
