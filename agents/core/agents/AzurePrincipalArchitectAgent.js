import { BaseAgent } from '../base/BaseAgent.js';
import { EventEmitter } from 'events';

/**
 * AzurePrincipalArchitectAgent - Azure Infrastructure Architecture Design
 * 
 * Specializes in designing Azure-specific infrastructure architecture,
 * selecting appropriate Azure services, planning resource organization,
 * and creating comprehensive Azure deployment strategies.
 */
export class AzurePrincipalArchitectAgent extends BaseAgent {
  constructor(spec = {}) {
    const defaultSpec = {
      id: 'azure-principal-architect',
      name: 'Azure Principal Architect',
      description: 'Designs Azure-specific infrastructure architecture and service selection',
      inputSchema: {
        type: 'object',
        properties: {
          requirements: { type: 'object' },
          architecture: { type: 'object' },
          constraints: { type: 'object' }
        },
        required: ['requirements']
      },
      outputSchema: {
        type: 'object',
        properties: {
          azureArchitecture: { type: 'object' },
          services: { type: 'object' },
          resourceOrganization: { type: 'object' },
          networking: { type: 'object' },
          security: { type: 'object' },
          costEstimate: { type: 'object' },
          deploymentPlan: { type: 'object' }
        }
      }
    };

    super({ ...defaultSpec, ...spec });
    this.architectureCache = new Map();
    this.serviceKnowledge = this.initializeServiceKnowledge();
    this.pricingData = this.initializePricingData();
  }

  async _onInitialize() {
    // Initialize Azure service knowledge base
    this.architectureCache.clear();
    this.serviceKnowledge = this.initializeServiceKnowledge();
    this.pricingData = this.initializePricingData();
  }

  async _onExecute(input, context, executionId) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const { requirements, architecture = {}, constraints = {} } = input;

    // Design Azure-specific architecture
    const azureArchitecture = await this.designAzureArchitecture(
      requirements,
      architecture,
      constraints
    );

    // Select Azure services
    const services = await this.selectAzureServices(
      azureArchitecture,
      requirements
    );

    // Plan resource organization
    const resourceOrganization = await this.planResourceOrganization(
      services,
      requirements
    );

    // Design Azure networking
    const networking = await this.designAzureNetworking(
      services,
      requirements
    );

    // Design Azure security
    const security = await this.designAzureSecurity(
      services,
      requirements
    );

    // Estimate Azure costs
    const costEstimate = await this.estimateAzureCosts(
      services,
      requirements
    );

    // Create deployment plan
    const deploymentPlan = await this.createDeploymentPlan(
      services,
      resourceOrganization,
      networking
    );

    // Cache the architecture
    const result = {
      executionId,
      azureArchitecture,
      services,
      resourceOrganization,
      networking,
      security,
      costEstimate,
      deploymentPlan
    };

    this.architectureCache.set(executionId, result);

    // Emit completion event
    this.emit('azure-architecture-complete', {
      executionId,
      servicesSelected: Object.keys(services).length,
      estimatedMonthlyCost: costEstimate.monthly,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      executionId,
      azureArchitecture,
      services,
      resourceOrganization,
      networking,
      security,
      costEstimate,
      deploymentPlan,
      summary: {
        totalServices: Object.keys(services).length,
        resourceGroups: resourceOrganization.resourceGroups.length,
        estimatedMonthlyCost: costEstimate.monthly,
        regions: resourceOrganization.regions
      }
    };
  }

  async designAzureArchitecture(requirements, architecture, constraints) {
    const workloadType = this.identifyWorkloadType(requirements);
    const scalingRequirements = this.analyzeScalingRequirements(requirements);
    const availabilityNeeds = this.determineAvailabilityNeeds(requirements);

    return {
      workloadType,
      scalingStrategy: scalingRequirements,
      availabilityZones: availabilityNeeds.zones,
      regions: this.selectAzureRegions(requirements, constraints),
      architecturePattern: this.selectArchitecturePattern(workloadType),
      dataResidency: this.planDataResidency(requirements),
      disasterRecovery: this.planDisasterRecovery(availabilityNeeds),
      monitoring: this.planMonitoring(),
      governance: this.planGovernance(requirements)
    };
  }

  async selectAzureServices(azureArchitecture, requirements) {
    const services = {
      compute: this.selectComputeServices(azureArchitecture, requirements),
      storage: this.selectStorageServices(requirements),
      database: this.selectDatabaseServices(requirements),
      networking: this.selectNetworkingServices(azureArchitecture),
      identity: this.selectIdentityServices(requirements),
      security: this.selectSecurityServices(requirements),
      devOps: this.selectDevOpsServices(requirements),
      analytics: this.selectAnalyticsServices(requirements),
      ai: this.selectAIServices(requirements),
      integration: this.selectIntegrationServices(requirements),
      monitoring: this.selectMonitoringServices()
    };

    return services;
  }

  selectComputeServices(azureArchitecture, requirements) {
    const services = [];

    // App Service for web applications
    if (requirements.workloadType === 'web-application') {
      services.push({
        service: 'Azure App Service',
        tier: 'Standard S1',
        instances: 2,
        features: ['Auto-scaling', 'Deployment slots', 'Custom domains', 'SSL'],
        justification: 'Managed PaaS for web applications with built-in scaling'
      });
    }

    // Azure Functions for serverless
    if (requirements.usesServerless || requirements.eventDriven) {
      services.push({
        service: 'Azure Functions',
        plan: 'Premium',
        features: ['VNET integration', 'Durable Functions', 'Always ready instances'],
        justification: 'Serverless compute for event-driven workloads'
      });
    }

    // Azure Kubernetes Service for containers
    if (requirements.usesMicroservices || requirements.usesContainers) {
      services.push({
        service: 'Azure Kubernetes Service (AKS)',
        tier: 'Standard',
        nodeCount: 3,
        nodeSize: 'Standard_D4s_v3',
        features: ['Auto-scaling', 'Azure CNI', 'Azure AD integration', 'Azure Monitor'],
        justification: 'Managed Kubernetes for containerized microservices'
      });
    }

    // Container Instances for simpler container workloads
    if (requirements.usesContainers && !requirements.usesMicroservices) {
      services.push({
        service: 'Azure Container Instances',
        tier: 'Standard',
        features: ['Fast startup', 'Per-second billing', 'Virtual network deployment'],
        justification: 'Simple container deployment without orchestration overhead'
      });
    }

    // Virtual Machines for IaaS requirements
    if (requirements.requiresIaaS || requirements.legacyApplications) {
      services.push({
        service: 'Azure Virtual Machines',
        size: 'Standard_D4s_v3',
        count: 2,
        features: ['Managed disks', 'Availability sets', 'Azure Backup'],
        justification: 'IaaS for legacy applications or custom requirements'
      });
    }

    return services;
  }

  selectStorageServices(requirements) {
    const services = [];

    // Blob Storage for unstructured data
    services.push({
      service: 'Azure Blob Storage',
      tier: 'Hot',
      redundancy: 'GRS',
      features: ['Lifecycle management', 'Soft delete', 'Versioning', 'CDN integration'],
      justification: 'Scalable object storage for files, backups, and media'
    });

    // Azure Files for shared file systems
    if (requirements.needsFileSharing) {
      services.push({
        service: 'Azure Files',
        tier: 'Premium',
        redundancy: 'ZRS',
        features: ['SMB 3.0', 'NFS 4.1', 'Azure File Sync'],
        justification: 'Managed file shares for applications and services'
      });
    }

    // Queue Storage for messaging
    if (requirements.needsMessaging) {
      services.push({
        service: 'Azure Queue Storage',
        redundancy: 'GRS',
        features: ['At-least-once delivery', 'Message TTL'],
        justification: 'Simple message queue for asynchronous processing'
      });
    }

    // Azure Data Lake for big data
    if (requirements.bigData || requirements.analytics) {
      services.push({
        service: 'Azure Data Lake Storage Gen2',
        tier: 'Standard',
        redundancy: 'GRS',
        features: ['Hierarchical namespace', 'ACLs', 'Analytics integration'],
        justification: 'Optimized storage for big data analytics workloads'
      });
    }

    return services;
  }

  selectDatabaseServices(requirements) {
    const services = [];

    // SQL Database for relational data
    if (requirements.needsRelationalDB) {
      services.push({
        service: 'Azure SQL Database',
        tier: 'General Purpose',
        vCores: 4,
        storage: '500GB',
        features: ['Auto-tuning', 'Threat detection', 'Geo-replication', 'Point-in-time restore'],
        justification: 'Managed SQL Server for relational workloads'
      });
    }

    // Cosmos DB for NoSQL
    if (requirements.needsNoSQL || requirements.globalDistribution) {
      services.push({
        service: 'Azure Cosmos DB',
        api: 'Core (SQL)',
        tier: 'Standard',
        throughput: '400 RU/s',
        features: ['Multi-region writes', '99.999% SLA', 'Automatic indexing'],
        justification: 'Globally distributed NoSQL database with multiple APIs'
      });
    }

    // PostgreSQL for open-source relational
    if (requirements.needsPostgreSQL) {
      services.push({
        service: 'Azure Database for PostgreSQL',
        tier: 'General Purpose',
        vCores: 4,
        storage: '500GB',
        features: ['High availability', 'Automated backups', 'Security'],
        justification: 'Managed PostgreSQL with enterprise features'
      });
    }

    // Redis Cache for caching
    if (requirements.needsCaching) {
      services.push({
        service: 'Azure Cache for Redis',
        tier: 'Premium',
        size: 'P1',
        features: ['Clustering', 'Geo-replication', 'Data persistence'],
        justification: 'In-memory cache for improved performance'
      });
    }

    return services;
  }

  selectNetworkingServices(azureArchitecture) {
    return [
      {
        service: 'Azure Virtual Network',
        addressSpace: '10.0.0.0/16',
        subnets: [
          { name: 'web-tier', cidr: '10.0.1.0/24' },
          { name: 'app-tier', cidr: '10.0.2.0/24' },
          { name: 'data-tier', cidr: '10.0.3.0/24' },
          { name: 'management', cidr: '10.0.4.0/24' }
        ],
        features: ['Service endpoints', 'Private endpoints', 'Network security groups']
      },
      {
        service: 'Azure Application Gateway',
        tier: 'WAF v2',
        features: ['WAF', 'Auto-scaling', 'SSL termination', 'URL routing'],
        justification: 'Layer 7 load balancer with WAF protection'
      },
      {
        service: 'Azure Load Balancer',
        tier: 'Standard',
        features: ['Zone redundancy', 'Health probes', 'Outbound rules'],
        justification: 'Layer 4 load balancing for internal traffic'
      },
      {
        service: 'Azure Front Door',
        tier: 'Premium',
        features: ['Global load balancing', 'CDN', 'WAF', 'SSL offload'],
        justification: 'Global HTTP(S) load balancer with CDN and WAF'
      },
      {
        service: 'Azure DNS',
        features: ['Alias records', 'Private DNS zones'],
        justification: 'Reliable and secure DNS hosting'
      }
    ];
  }

  selectIdentityServices(requirements) {
    return [
      {
        service: 'Azure Active Directory',
        tier: 'Premium P1',
        features: ['Conditional access', 'MFA', 'Identity protection', 'Privileged identity management'],
        justification: 'Enterprise identity and access management'
      },
      {
        service: 'Azure AD B2C',
        tier: 'Premium',
        features: ['Custom policies', 'Social identity providers', 'MFA'],
        justification: 'Customer identity and access management',
        conditional: requirements.needsCustomerIdentity
      },
      {
        service: 'Managed Identities',
        type: 'System-assigned',
        features: ['Automatic credential management', 'Azure RBAC integration'],
        justification: 'Secure service-to-service authentication without secrets'
      }
    ].filter(s => s.conditional === undefined || s.conditional);
  }

  selectSecurityServices(requirements) {
    return [
      {
        service: 'Azure Key Vault',
        tier: 'Standard',
        features: ['Secret management', 'Certificate management', 'HSM-backed keys'],
        justification: 'Centralized secrets and certificate management'
      },
      {
        service: 'Azure Security Center',
        tier: 'Standard',
        features: ['Threat protection', 'Compliance dashboard', 'Security recommendations'],
        justification: 'Unified security management and threat protection'
      },
      {
        service: 'Azure DDoS Protection',
        tier: 'Standard',
        features: ['Always-on monitoring', 'Adaptive tuning', 'Attack analytics'],
        justification: 'Protection against DDoS attacks'
      },
      {
        service: 'Azure Firewall',
        tier: 'Standard',
        features: ['Stateful firewall', 'Threat intelligence', 'Application FQDN filtering'],
        justification: 'Cloud-native network security'
      },
      {
        service: 'Azure Sentinel',
        tier: 'Pay-as-you-go',
        features: ['SIEM', 'SOAR', 'AI-powered threat detection'],
        justification: 'Cloud-native SIEM and security orchestration',
        conditional: requirements.needsSIEM
      }
    ].filter(s => s.conditional === undefined || s.conditional);
  }

  selectDevOpsServices(requirements) {
    return [
      {
        service: 'Azure DevOps',
        features: ['Repos', 'Pipelines', 'Boards', 'Artifacts', 'Test Plans'],
        justification: 'Complete DevOps toolchain'
      },
      {
        service: 'Azure Container Registry',
        tier: 'Premium',
        features: ['Geo-replication', 'Content trust', 'Vulnerability scanning'],
        justification: 'Private container registry with security scanning'
      },
      {
        service: 'Azure Monitor',
        features: ['Metrics', 'Logs', 'Application Insights', 'Alerts'],
        justification: 'Comprehensive monitoring and diagnostics'
      }
    ];
  }

  selectAnalyticsServices(requirements) {
    if (!requirements.needsAnalytics) return [];

    return [
      {
        service: 'Azure Synapse Analytics',
        tier: 'Standard',
        features: ['Data warehousing', 'Big data analytics', 'Spark integration'],
        justification: 'Unified analytics platform'
      },
      {
        service: 'Azure Data Factory',
        tier: 'Standard',
        features: ['ETL/ELT', 'Data integration', 'Pipeline orchestration'],
        justification: 'Cloud-based data integration service'
      },
      {
        service: 'Power BI Embedded',
        tier: 'A1',
        features: ['Interactive reports', 'Real-time dashboards', 'Row-level security'],
        justification: 'Embedded analytics and reporting'
      }
    ];
  }

  selectAIServices(requirements) {
    if (!requirements.needsAI) return [];

    return [
      {
        service: 'Azure Cognitive Services',
        apis: ['Computer Vision', 'Language Understanding', 'Speech'],
        tier: 'Standard',
        justification: 'Pre-built AI capabilities'
      },
      {
        service: 'Azure Machine Learning',
        tier: 'Enterprise',
        features: ['Model training', 'Model deployment', 'MLOps'],
        justification: 'Enterprise ML platform'
      },
      {
        service: 'Azure OpenAI Service',
        models: ['GPT-4', 'GPT-3.5'],
        tier: 'Standard',
        justification: 'Advanced language models',
        conditional: requirements.needsLLM
      }
    ].filter(s => s.conditional === undefined || s.conditional);
  }

  selectIntegrationServices(requirements) {
    return [
      {
        service: 'Azure Logic Apps',
        tier: 'Standard',
        features: ['Workflow automation', '400+ connectors', 'B2B integration'],
        justification: 'Serverless workflow orchestration'
      },
      {
        service: 'Azure Service Bus',
        tier: 'Premium',
        features: ['Message queuing', 'Topics/subscriptions', 'Transactions'],
        justification: 'Enterprise messaging for decoupled architectures'
      },
      {
        service: 'Azure API Management',
        tier: 'Developer',
        features: ['API gateway', 'Developer portal', 'Rate limiting', 'Analytics'],
        justification: 'API management and gateway'
      },
      {
        service: 'Azure Event Grid',
        tier: 'Standard',
        features: ['Event routing', 'Filtering', 'Dead-lettering'],
        justification: 'Event-driven architecture support'
      }
    ];
  }

  selectMonitoringServices() {
    return [
      {
        service: 'Azure Monitor',
        features: ['Metrics', 'Logs', 'Alerts', 'Workbooks'],
        justification: 'Comprehensive monitoring solution'
      },
      {
        service: 'Application Insights',
        tier: 'Standard',
        features: ['APM', 'Distributed tracing', 'Live metrics', 'Profiler'],
        justification: 'Application performance monitoring'
      },
      {
        service: 'Log Analytics',
        tier: 'Pay-as-you-go',
        features: ['Centralized logging', 'KQL queries', 'Workbooks'],
        justification: 'Centralized log aggregation and analysis'
      }
    ];
  }

  async planResourceOrganization(services, requirements) {
    return {
      subscriptions: this.planSubscriptions(requirements),
      managementGroups: this.planManagementGroups(requirements),
      resourceGroups: this.planResourceGroups(services, requirements),
      regions: this.selectAzureRegions(requirements, {}),
      namingConvention: this.defineNamingConvention(),
      taggingStrategy: this.defineTaggingStrategy()
    };
  }

  planSubscriptions(requirements) {
    return [
      {
        name: 'production',
        purpose: 'Production workloads',
        costLimit: 'Unlimited',
        policies: ['Require tags', 'Allowed locations', 'SKU restrictions']
      },
      {
        name: 'staging',
        purpose: 'Pre-production testing',
        costLimit: '$5,000/month',
        policies: ['Require tags', 'Allowed locations']
      },
      {
        name: 'development',
        purpose: 'Development and testing',
        costLimit: '$2,000/month',
        policies: ['Require tags', 'Auto-shutdown VMs']
      }
    ];
  }

  planManagementGroups(requirements) {
    return {
      hierarchy: [
        { name: 'Root', level: 0 },
        { name: 'Production', level: 1, parent: 'Root' },
        { name: 'Non-Production', level: 1, parent: 'Root' }
      ],
      policies: {
        root: ['Allowed locations', 'Require tags'],
        production: ['Deny public IPs', 'Require encryption', 'Audit logging'],
        nonProduction: ['Budget limits', 'Auto-shutdown']
      }
    };
  }

  planResourceGroups(services, requirements) {
    return [
      {
        name: 'rg-networking',
        purpose: 'Networking resources',
        region: 'eastus',
        resources: ['Virtual Networks', 'Load Balancers', 'Application Gateway']
      },
      {
        name: 'rg-compute',
        purpose: 'Compute resources',
        region: 'eastus',
        resources: ['App Services', 'Functions', 'AKS']
      },
      {
        name: 'rg-data',
        purpose: 'Data resources',
        region: 'eastus',
        resources: ['SQL Database', 'Storage Accounts', 'Cosmos DB']
      },
      {
        name: 'rg-security',
        purpose: 'Security resources',
        region: 'eastus',
        resources: ['Key Vault', 'Security Center', 'Sentinel']
      },
      {
        name: 'rg-monitoring',
        purpose: 'Monitoring resources',
        region: 'eastus',
        resources: ['Log Analytics', 'Application Insights']
      }
    ];
  }

  selectAzureRegions(requirements, constraints) {
    const primaryRegion = constraints.primaryRegion || 'eastus';
    const secondaryRegion = constraints.secondaryRegion || 'westus2';

    return {
      primary: {
        name: primaryRegion,
        displayName: 'East US',
        purpose: 'Primary production workloads',
        availabilityZones: [1, 2, 3]
      },
      secondary: {
        name: secondaryRegion,
        displayName: 'West US 2',
        purpose: 'Disaster recovery and secondary workloads',
        availabilityZones: [1, 2, 3]
      }
    };
  }

  defineNamingConvention() {
    return {
      pattern: '{resource-type}-{workload/app}-{environment}-{region}-{instance}',
      examples: {
        virtualMachine: 'vm-webapp-prod-eastus-001',
        storageAccount: 'stwebappprodeastus001',
        appService: 'app-webapp-prod-eastus',
        sqlDatabase: 'sql-webapp-prod-eastus'
      },
      rules: [
        'Use lowercase for all names',
        'Use hyphens as separators (except storage accounts)',
        'Include environment (dev, stg, prod)',
        'Include region abbreviation',
        'Pad instance numbers with leading zeros'
      ]
    };
  }

  defineTaggingStrategy() {
    return {
      required: ['Environment', 'CostCenter', 'Owner', 'Application'],
      recommended: ['DataClassification', 'Criticality', 'MaintenanceWindow'],
      examples: {
        Environment: 'Production',
        CostCenter: 'IT-Operations',
        Owner: 'john.doe@company.com',
        Application: 'Web Application',
        DataClassification: 'Confidential',
        Criticality: 'High',
        MaintenanceWindow: 'Saturday 02:00-06:00 UTC'
      }
    };
  }

  async designAzureNetworking(services, requirements) {
    return {
      topology: 'hub-and-spoke',
      vnet: {
        addressSpace: '10.0.0.0/16',
        subnets: [
          { name: 'GatewaySubnet', cidr: '10.0.0.0/27', purpose: 'VPN/ExpressRoute Gateway' },
          { name: 'AzureFirewallSubnet', cidr: '10.0.1.0/26', purpose: 'Azure Firewall' },
          { name: 'AppGatewaySubnet', cidr: '10.0.2.0/24', purpose: 'Application Gateway' },
          { name: 'WebTier', cidr: '10.0.10.0/24', purpose: 'Web applications' },
          { name: 'AppTier', cidr: '10.0.11.0/24', purpose: 'Application logic' },
          { name: 'DataTier', cidr: '10.0.12.0/24', purpose: 'Databases' },
          { name: 'ManagementSubnet', cidr: '10.0.100.0/24', purpose: 'Management tools' }
        ]
      },
      connectivity: {
        vpnGateway: {
          sku: 'VpnGw2AZ',
          type: 'RouteBased',
          features: ['Active-active', 'Zone redundancy']
        },
        expressRoute: requirements.needsExpressRoute ? {
          sku: 'Premium',
          bandwidth: '1Gbps',
          peeringLocation: 'Silicon Valley'
        } : null
      },
      security: {
        nsg: 'Network security groups on all subnets',
        firewall: 'Azure Firewall for egress control',
        waf: 'WAF on Application Gateway',
        ddos: 'DDoS Protection Standard'
      },
      dns: {
        privateDns: 'Azure Private DNS for internal resolution',
        publicDns: 'Azure DNS for public domains'
      },
      cdn: {
        service: 'Azure Front Door',
        caching: 'Edge caching with purge capability',
        waf: 'Integrated WAF protection'
      }
    };
  }

  async designAzureSecurity(services, requirements) {
    return {
      identityAndAccess: {
        azureAD: 'Primary identity provider with conditional access',
        rbac: 'Role-based access control with custom roles',
        managedIdentities: 'System-assigned identities for all services',
        pim: 'Privileged Identity Management for admin access'
      },
      dataProtection: {
        encryption: {
          atRest: 'Azure Storage encryption with customer-managed keys',
          inTransit: 'TLS 1.2+ for all communication',
          keyManagement: 'Azure Key Vault with HSM backing'
        },
        backup: 'Azure Backup with 30-day retention',
        drp: 'Geo-redundant replication for critical data'
      },
      networkSecurity: {
        segmentation: 'Network segmentation with NSGs',
        firewall: 'Azure Firewall for egress filtering',
        waf: 'WAF protection on public endpoints',
        privateEndpoints: 'Private endpoints for PaaS services',
        serviceEndpoints: 'Service endpoints where private endpoints not available'
      },
      threatProtection: {
        securityCenter: 'Azure Security Center Standard tier',
        sentinel: requirements.needsSIEM ? 'Azure Sentinel for SIEM/SOAR' : null,
        defender: 'Azure Defender for all supported services',
        vulnerabilityScanning: 'Continuous vulnerability assessment'
      },
      compliance: {
        policies: 'Azure Policy for compliance enforcement',
        blueprints: 'Azure Blueprints for repeatable deployments',
        audit: 'Audit logging to Log Analytics',
        retention: '90-day log retention minimum'
      }
    };
  }

  async estimateAzureCosts(services, requirements) {
    let monthlyCost = 0;
    const breakdown = {};

    // Compute costs
    if (services.compute) {
      const computeCost = this.estimateComputeCosts(services.compute);
      monthlyCost += computeCost;
      breakdown.compute = computeCost;
    }

    // Storage costs
    if (services.storage) {
      const storageCost = this.estimateStorageCosts(services.storage);
      monthlyCost += storageCost;
      breakdown.storage = storageCost;
    }

    // Database costs
    if (services.database) {
      const databaseCost = this.estimateDatabaseCosts(services.database);
      monthlyCost += databaseCost;
      breakdown.database = databaseCost;
    }

    // Networking costs
    if (services.networking) {
      const networkingCost = 500; // Simplified
      monthlyCost += networkingCost;
      breakdown.networking = networkingCost;
    }

    // Security costs
    if (services.security) {
      const securityCost = 300; // Simplified
      monthlyCost += securityCost;
      breakdown.security = securityCost;
    }

    // Monitoring costs
    const monitoringCost = 200; // Simplified
    monthlyCost += monitoringCost;
    breakdown.monitoring = monitoringCost;

    return {
      monthly: `$${monthlyCost.toFixed(2)}`,
      annual: `$${(monthlyCost * 12).toFixed(2)}`,
      breakdown,
      assumptions: [
        'Prices based on East US region',
        'Pay-as-you-go pricing without reserved instances',
        'Excludes data transfer costs',
        'Based on estimated usage patterns'
      ],
      optimization: [
        'Use Azure Reserved Instances for 30-40% savings',
        'Implement auto-scaling to reduce costs during low usage',
        'Use Azure Hybrid Benefit if applicable',
        'Enable storage lifecycle management'
      ]
    };
  }

  estimateComputeCosts(computeServices) {
    let cost = 0;
    for (const service of computeServices) {
      if (service.service === 'Azure App Service') {
        cost += 75 * (service.instances || 1); // S1 tier ~$75/month
      } else if (service.service === 'Azure Functions') {
        cost += 150; // Premium plan
      } else if (service.service === 'Azure Kubernetes Service (AKS)') {
        cost += 200 * (service.nodeCount || 3); // D4s_v3 ~$200/month
      } else if (service.service === 'Azure Virtual Machines') {
        cost += 180 * (service.count || 2); // D4s_v3 ~$180/month
      }
    }
    return cost;
  }

  estimateStorageCosts(storageServices) {
    let cost = 0;
    for (const service of storageServices) {
      if (service.service === 'Azure Blob Storage') {
        cost += 50; // Baseline for moderate usage
      } else if (service.service === 'Azure Files') {
        cost += 100; // Premium tier
      } else if (service.service === 'Azure Data Lake Storage Gen2') {
        cost += 80;
      }
    }
    return cost;
  }

  estimateDatabaseCosts(databaseServices) {
    let cost = 0;
    for (const service of databaseServices) {
      if (service.service === 'Azure SQL Database') {
        cost += 600; // General Purpose, 4 vCores
      } else if (service.service === 'Azure Cosmos DB') {
        cost += 200; // Baseline throughput
      } else if (service.service === 'Azure Database for PostgreSQL') {
        cost += 500; // General Purpose, 4 vCores
      } else if (service.service === 'Azure Cache for Redis') {
        cost += 250; // P1 tier
      }
    }
    return cost;
  }

  async createDeploymentPlan(services, resourceOrganization, networking) {
    return {
      phases: [
        {
          phase: 1,
          name: 'Foundation Setup',
          duration: '1-2 weeks',
          tasks: [
            'Create Azure AD tenant and configure identity',
            'Set up subscriptions and management groups',
            'Configure Azure Policy and compliance',
            'Establish naming and tagging conventions'
          ]
        },
        {
          phase: 2,
          name: 'Network Infrastructure',
          duration: '1 week',
          tasks: [
            'Deploy virtual networks and subnets',
            'Configure NSGs and firewall rules',
            'Set up VPN/ExpressRoute connectivity',
            'Deploy Application Gateway and load balancers'
          ]
        },
        {
          phase: 3,
          name: 'Security and Governance',
          duration: '1 week',
          tasks: [
            'Deploy Key Vault and configure secrets',
            'Enable Azure Security Center',
            'Configure Azure DDoS Protection',
            'Set up Azure Sentinel if required'
          ]
        },
        {
          phase: 4,
          name: 'Data Services',
          duration: '1-2 weeks',
          tasks: [
            'Deploy database services',
            'Configure storage accounts',
            'Set up backup and DR',
            'Configure encryption and access controls'
          ]
        },
        {
          phase: 5,
          name: 'Compute Services',
          duration: '2-3 weeks',
          tasks: [
            'Deploy App Services or AKS',
            'Configure auto-scaling',
            'Set up deployment slots/pipelines',
            'Configure managed identities'
          ]
        },
        {
          phase: 6,
          name: 'Integration and Monitoring',
          duration: '1 week',
          tasks: [
            'Deploy API Management',
            'Configure Service Bus and Event Grid',
            'Set up Azure Monitor and Application Insights',
            'Configure alerts and dashboards'
          ]
        },
        {
          phase: 7,
          name: 'Testing and Validation',
          duration: '1-2 weeks',
          tasks: [
            'Perform security testing',
            'Load testing and performance validation',
            'Disaster recovery testing',
            'Compliance validation'
          ]
        },
        {
          phase: 8,
          name: 'Production Deployment',
          duration: '1 week',
          tasks: [
            'Final configuration review',
            'Production deployment',
            'Post-deployment validation',
            'Knowledge transfer and documentation'
          ]
        }
      ],
      totalDuration: '9-13 weeks',
      prerequisites: [
        'Azure subscription with appropriate permissions',
        'Network connectivity requirements defined',
        'Compliance requirements documented',
        'Team trained on Azure services'
      ],
      risks: [
        { risk: 'Underestimated data migration time', mitigation: 'Plan migration in advance with testing' },
        { risk: 'Networking complexity', mitigation: 'Engage Azure networking specialist' },
        { risk: 'Security configuration errors', mitigation: 'Use Azure Blueprints and policy enforcement' }
      ]
    };
  }

  // Helper methods
  identifyWorkloadType(requirements) {
    if (requirements.workloadType) return requirements.workloadType;
    if (requirements.usesMicroservices) return 'microservices';
    if (requirements.usesServerless) return 'serverless';
    return 'web-application';
  }

  analyzeScalingRequirements(requirements) {
    return {
      horizontal: requirements.needsHorizontalScaling !== false,
      vertical: requirements.needsVerticalScaling || false,
      autoScaling: requirements.enableAutoScaling !== false,
      metrics: ['CPU', 'Memory', 'Request count', 'Queue length']
    };
  }

  determineAvailabilityNeeds(requirements) {
    const sla = requirements.slaRequirement || '99.9%';
    return {
      sla,
      zones: sla === '99.99%' || sla === '99.999%' ? [1, 2, 3] : [],
      multiRegion: sla === '99.999%',
      dr: sla === '99.99%' || sla === '99.999%'
    };
  }

  selectArchitecturePattern(workloadType) {
    const patterns = {
      'web-application': 'N-tier architecture with separate web, app, and data tiers',
      'microservices': 'Microservices with API Gateway and service mesh',
      'serverless': 'Event-driven serverless architecture',
      'big-data': 'Lambda architecture for batch and stream processing'
    };
    return patterns[workloadType] || patterns['web-application'];
  }

  planDataResidency(requirements) {
    return {
      region: requirements.dataResidencyRegion || 'US',
      compliance: requirements.complianceRequirements || ['SOC 2', 'ISO 27001'],
      restrictions: 'Data must remain within specified geography'
    };
  }

  planDisasterRecovery(availabilityNeeds) {
    if (!availabilityNeeds.dr) {
      return { strategy: 'Backup only', rpo: '24 hours', rto: '48 hours' };
    }

    return {
      strategy: 'Active-passive with geo-replication',
      rpo: '15 minutes',
      rto: '4 hours',
      failoverType: 'Manual with documented runbooks',
      testingSchedule: 'Quarterly DR drills'
    };
  }

  planMonitoring() {
    return {
      metrics: ['CPU', 'Memory', 'Disk I/O', 'Network', 'Application metrics'],
      logging: 'Centralized logging to Log Analytics',
      apm: 'Application Insights for distributed tracing',
      alerts: 'Proactive alerting with action groups',
      dashboards: 'Custom Azure Monitor workbooks'
    };
  }

  planGovernance(requirements) {
    return {
      policies: ['Allowed locations', 'Required tags', 'SKU restrictions', 'Audit diagnostics'],
      rbac: 'Principle of least privilege with custom roles',
      blueprints: 'Standardized environment templates',
      costManagement: 'Budgets and cost alerts configured',
      compliance: requirements.complianceRequirements || ['SOC 2', 'ISO 27001']
    };
  }

  initializeServiceKnowledge() {
    return {
      compute: ['App Service', 'Functions', 'AKS', 'Container Instances', 'VMs'],
      storage: ['Blob Storage', 'Files', 'Queue', 'Data Lake'],
      database: ['SQL Database', 'Cosmos DB', 'PostgreSQL', 'Redis Cache'],
      networking: ['VNet', 'App Gateway', 'Load Balancer', 'Front Door', 'Firewall'],
      security: ['Key Vault', 'Security Center', 'DDoS Protection', 'Sentinel'],
      integration: ['Logic Apps', 'Service Bus', 'API Management', 'Event Grid']
    };
  }

  initializePricingData() {
    return {
      compute: { appService: 75, functions: 150, aks: 200, vm: 180 },
      storage: { blob: 50, files: 100, dataLake: 80 },
      database: { sql: 600, cosmos: 200, postgres: 500, redis: 250 },
      networking: { base: 500 },
      security: { base: 300 },
      monitoring: { base: 200 }
    };
  }

  getArchitecture(executionId) {
    return this.architectureCache.get(executionId);
  }

  listArchitectures() {
    return Array.from(this.architectureCache.values()).map(a => ({
      id: a.executionId,
      totalServices: Object.keys(a.services).length,
      estimatedCost: a.costEstimate.monthly,
      regions: a.resourceOrganization.regions
    }));
  }

  async _onCleanup() {
    // Cleanup can be customized if needed
  }
}

export default AzurePrincipalArchitectAgent;
