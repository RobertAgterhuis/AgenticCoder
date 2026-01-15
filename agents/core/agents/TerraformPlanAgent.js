import { BaseAgent } from '../base/BaseAgent.js';
import { EventEmitter } from 'events';

/**
 * TerraformPlanAgent - Multi-Cloud Infrastructure as Code Planning
 * 
 * Analyzes architecture and generates Terraform infrastructure plans
 * supporting AWS, Azure, GCP with modules and best practices.
 */
export class TerraformPlanAgent extends BaseAgent {
  constructor(spec = {}) {
    const defaultSpec = {
      id: 'terraform-plan',
      name: 'Terraform Planning Agent',
      description: 'Plans infrastructure using Terraform IaC for multi-cloud environments',
      inputSchema: {
        type: 'object',
        properties: {
          architecture: { type: 'object' },
          services: { type: 'object' },
          cloudProvider: { type: 'string', enum: ['aws', 'azure', 'gcp', 'multi-cloud'] }
        },
        required: ['architecture', 'services', 'cloudProvider']
      },
      outputSchema: {
        type: 'object',
        properties: {
          terraformPlan: { type: 'object' },
          modules: { type: 'array' },
          variables: { type: 'object' },
          resources: { type: 'array' },
          outputs: { type: 'object' }
        }
      }
    };

    super({ ...defaultSpec, ...spec });
    this.planCache = new Map();
    this.providerConfig = this.initializeProviderConfig();
  }

  async _onInitialize() {
    this.planCache.clear();
    this.providerConfig = this.initializeProviderConfig();
  }

  async _onExecute(input, context, executionId) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const { architecture, services, cloudProvider } = input;

    // Generate Terraform plan
    const terraformPlan = await this.generateTerraformPlan(
      architecture,
      services,
      cloudProvider
    );

    // Define modules
    const modules = await this.defineModules(services, cloudProvider);

    // Define variables
    const variables = await this.defineVariables(terraformPlan, cloudProvider);

    // Define resources
    const resources = await this.defineResources(services, cloudProvider);

    // Define outputs
    const outputs = await this.defineOutputs(modules);

    // Create backend configuration
    const backend = await this.configureBackend(cloudProvider);

    // Create deployment workflow
    const workflow = await this.createWorkflow(terraformPlan);

    const result = {
      executionId,
      terraformPlan,
      modules,
      variables,
      resources,
      outputs,
      backend,
      workflow,
      bestPractices: this.generateBestPractices(terraformPlan, modules)
    };

    this.planCache.set(executionId, result);

    this.emit('terraform-plan-complete', {
      executionId,
      cloudProvider,
      modulesCount: modules.length,
      resourcesCount: resources.length,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      executionId,
      terraformPlan,
      modules,
      variables,
      resources,
      outputs,
      backend,
      workflow,
      summary: {
        cloudProvider,
        totalModules: modules.length,
        totalResources: resources.length,
        totalVariables: Object.keys(variables).length,
        estimatedDeploymentTime: workflow.estimatedTime
      }
    };
  }

  async generateTerraformPlan(architecture, services, cloudProvider) {
    return {
      requiredVersion: '>= 1.6.0',
      cloudProvider,
      structure: 'modular',
      stateManagement: 'remote',
      workspaces: ['dev', 'staging', 'prod'],
      providers: this.getProviderConfiguration(cloudProvider),
      namingConvention: {
        pattern: '{environment}-{service}-{resource}',
        separator: '-'
      },
      tagging: {
        required: ['Environment', 'ManagedBy', 'Project'],
        managedBy: 'Terraform'
      }
    };
  }

  getProviderConfiguration(cloudProvider) {
    const configs = {
      aws: {
        source: 'hashicorp/aws',
        version: '~> 5.0',
        features: ['Default tags', 'Assume role', 'Region failover']
      },
      azure: {
        source: 'hashicorp/azurerm',
        version: '~> 3.0',
        features: ['Skip provider registration', 'Managed identity']
      },
      gcp: {
        source: 'hashicorp/google',
        version: '~> 5.0',
        features: ['User project override', 'Batching']
      }
    };

    return cloudProvider === 'multi-cloud' 
      ? [configs.aws, configs.azure, configs.gcp]
      : [configs[cloudProvider]];
  }

  async defineModules(services, cloudProvider) {
    const modules = [];

    // Networking module
    if (services.networking?.length > 0) {
      modules.push(this.createNetworkingModule(cloudProvider));
    }

    // Compute module
    if (services.compute?.length > 0) {
      modules.push(this.createComputeModule(cloudProvider));
    }

    // Storage module
    if (services.storage?.length > 0) {
      modules.push(this.createStorageModule(cloudProvider));
    }

    // Database module
    if (services.database?.length > 0) {
      modules.push(this.createDatabaseModule(cloudProvider));
    }

    // Security module
    if (services.security?.length > 0) {
      modules.push(this.createSecurityModule(cloudProvider));
    }

    return modules;
  }

  createNetworkingModule(provider) {
    const configs = {
      aws: {
        resources: ['aws_vpc', 'aws_subnet', 'aws_route_table', 'aws_internet_gateway'],
        features: ['VPC', 'Subnets', 'NAT Gateway', 'Route tables']
      },
      azure: {
        resources: ['azurerm_virtual_network', 'azurerm_subnet', 'azurerm_network_security_group'],
        features: ['VNet', 'Subnets', 'NSGs', 'Private endpoints']
      },
      gcp: {
        resources: ['google_compute_network', 'google_compute_subnetwork', 'google_compute_firewall'],
        features: ['VPC', 'Subnets', 'Firewall rules', 'Cloud NAT']
      }
    };

    const config = configs[provider] || configs.aws;

    return {
      name: 'networking',
      source: './modules/networking',
      provider,
      resources: config.resources,
      features: config.features,
      variables: [
        { name: 'vpc_cidr', type: 'string', default: '10.0.0.0/16' },
        { name: 'availability_zones', type: 'list(string)' },
        { name: 'enable_nat_gateway', type: 'bool', default: true }
      ],
      outputs: [
        { name: 'vpc_id', description: 'VPC/VNet ID' },
        { name: 'subnet_ids', description: 'List of subnet IDs' }
      ]
    };
  }

  createComputeModule(provider) {
    const configs = {
      aws: {
        resources: ['aws_instance', 'aws_autoscaling_group', 'aws_launch_template', 'aws_ecs_cluster'],
        features: ['EC2', 'Auto Scaling', 'ECS', 'Load Balancer']
      },
      azure: {
        resources: ['azurerm_linux_virtual_machine', 'azurerm_app_service', 'azurerm_kubernetes_cluster'],
        features: ['VMs', 'App Service', 'AKS', 'Scale Sets']
      },
      gcp: {
        resources: ['google_compute_instance', 'google_compute_instance_group', 'google_container_cluster'],
        features: ['Compute Engine', 'Instance Groups', 'GKE', 'Cloud Run']
      }
    };

    const config = configs[provider] || configs.aws;

    return {
      name: 'compute',
      source: './modules/compute',
      provider,
      resources: config.resources,
      features: config.features,
      variables: [
        { name: 'instance_type', type: 'string' },
        { name: 'desired_capacity', type: 'number', default: 2 },
        { name: 'max_capacity', type: 'number', default: 10 }
      ],
      outputs: [
        { name: 'instance_ids', description: 'Compute instance IDs' },
        { name: 'load_balancer_dns', description: 'Load balancer endpoint' }
      ]
    };
  }

  createStorageModule(provider) {
    const configs = {
      aws: {
        resources: ['aws_s3_bucket', 'aws_s3_bucket_versioning', 'aws_s3_bucket_encryption'],
        features: ['S3', 'Versioning', 'Encryption', 'Lifecycle']
      },
      azure: {
        resources: ['azurerm_storage_account', 'azurerm_storage_container', 'azurerm_storage_blob'],
        features: ['Blob Storage', 'Files', 'Lifecycle management', 'Soft delete']
      },
      gcp: {
        resources: ['google_storage_bucket', 'google_storage_bucket_object'],
        features: ['Cloud Storage', 'Versioning', 'Lifecycle', 'Encryption']
      }
    };

    const config = configs[provider] || configs.aws;

    return {
      name: 'storage',
      source: './modules/storage',
      provider,
      resources: config.resources,
      features: config.features,
      variables: [
        { name: 'bucket_name', type: 'string' },
        { name: 'versioning_enabled', type: 'bool', default: true },
        { name: 'encryption_enabled', type: 'bool', default: true }
      ],
      outputs: [
        { name: 'bucket_id', description: 'Storage bucket ID' },
        { name: 'bucket_arn', description: 'Storage bucket ARN/URI' }
      ]
    };
  }

  createDatabaseModule(provider) {
    const configs = {
      aws: {
        resources: ['aws_db_instance', 'aws_elasticache_cluster', 'aws_dynamodb_table'],
        features: ['RDS', 'ElastiCache', 'DynamoDB', 'Backup']
      },
      azure: {
        resources: ['azurerm_mssql_server', 'azurerm_cosmosdb_account', 'azurerm_redis_cache'],
        features: ['SQL Database', 'Cosmos DB', 'Redis', 'Backup']
      },
      gcp: {
        resources: ['google_sql_database_instance', 'google_redis_instance', 'google_firestore_database'],
        features: ['Cloud SQL', 'Memorystore', 'Firestore', 'Backup']
      }
    };

    const config = configs[provider] || configs.aws;

    return {
      name: 'database',
      source: './modules/database',
      provider,
      resources: config.resources,
      features: config.features,
      variables: [
        { name: 'db_engine', type: 'string' },
        { name: 'db_instance_class', type: 'string' },
        { name: 'backup_retention_days', type: 'number', default: 7 }
      ],
      outputs: [
        { name: 'db_endpoint', description: 'Database endpoint' },
        { name: 'db_connection_string', description: 'Connection string', sensitive: true }
      ]
    };
  }

  createSecurityModule(provider) {
    const configs = {
      aws: {
        resources: ['aws_security_group', 'aws_iam_role', 'aws_kms_key', 'aws_wafv2_web_acl'],
        features: ['Security Groups', 'IAM', 'KMS', 'WAF']
      },
      azure: {
        resources: ['azurerm_key_vault', 'azurerm_role_assignment', 'azurerm_network_security_group'],
        features: ['Key Vault', 'RBAC', 'NSGs', 'Private Link']
      },
      gcp: {
        resources: ['google_compute_firewall', 'google_kms_crypto_key', 'google_service_account'],
        features: ['Firewall Rules', 'Cloud KMS', 'Service Accounts', 'IAM']
      }
    };

    const config = configs[provider] || configs.aws;

    return {
      name: 'security',
      source: './modules/security',
      provider,
      resources: config.resources,
      features: config.features,
      variables: [
        { name: 'enable_encryption', type: 'bool', default: true },
        { name: 'kms_key_rotation', type: 'bool', default: true }
      ],
      outputs: [
        { name: 'kms_key_id', description: 'KMS key ID' },
        { name: 'security_group_id', description: 'Security group ID' }
      ]
    };
  }

  async defineVariables(terraformPlan, cloudProvider) {
    return {
      environment: {
        type: 'string',
        description: 'Deployment environment',
        validation: {
          condition: "contains(['dev', 'staging', 'prod'], var.environment)",
          error_message: 'Environment must be dev, staging, or prod'
        }
      },
      region: {
        type: 'string',
        description: `${cloudProvider} region`,
        default: this.getDefaultRegion(cloudProvider)
      },
      project_name: {
        type: 'string',
        description: 'Project name for resource naming',
        validation: {
          condition: 'length(var.project_name) >= 3 && length(var.project_name) <= 20',
          error_message: 'Project name must be 3-20 characters'
        }
      },
      tags: {
        type: 'map(string)',
        description: 'Common tags for all resources',
        default: {
          ManagedBy: 'Terraform',
          Environment: '${var.environment}'
        }
      },
      enable_monitoring: {
        type: 'bool',
        description: 'Enable monitoring and logging',
        default: true
      }
    };
  }

  async defineResources(services, cloudProvider) {
    const resources = [];

    for (const [category, serviceList] of Object.entries(services)) {
      if (serviceList?.length > 0) {
        resources.push({
          category,
          provider: cloudProvider,
          count: serviceList.length,
          types: this.getResourceTypes(category, cloudProvider)
        });
      }
    }

    return resources;
  }

  getResourceTypes(category, provider) {
    const types = {
      aws: {
        networking: ['aws_vpc', 'aws_subnet', 'aws_route_table'],
        compute: ['aws_instance', 'aws_autoscaling_group', 'aws_ecs_cluster'],
        storage: ['aws_s3_bucket', 'aws_ebs_volume'],
        database: ['aws_db_instance', 'aws_dynamodb_table'],
        security: ['aws_security_group', 'aws_iam_role', 'aws_kms_key']
      },
      azure: {
        networking: ['azurerm_virtual_network', 'azurerm_subnet'],
        compute: ['azurerm_linux_virtual_machine', 'azurerm_app_service'],
        storage: ['azurerm_storage_account', 'azurerm_storage_container'],
        database: ['azurerm_mssql_server', 'azurerm_cosmosdb_account'],
        security: ['azurerm_key_vault', 'azurerm_network_security_group']
      },
      gcp: {
        networking: ['google_compute_network', 'google_compute_subnetwork'],
        compute: ['google_compute_instance', 'google_container_cluster'],
        storage: ['google_storage_bucket'],
        database: ['google_sql_database_instance'],
        security: ['google_kms_crypto_key', 'google_compute_firewall']
      }
    };

    return types[provider]?.[category] || [];
  }

  async defineOutputs(modules) {
    const outputs = {};

    for (const module of modules) {
      for (const output of module.outputs || []) {
        const key = `${module.name}_${output.name}`;
        outputs[key] = {
          description: output.description,
          value: `module.${module.name}.${output.name}`,
          sensitive: output.sensitive || false
        };
      }
    }

    return outputs;
  }

  async configureBackend(cloudProvider) {
    const backends = {
      aws: {
        type: 's3',
        config: {
          bucket: '${var.project_name}-terraform-state',
          key: '${var.environment}/terraform.tfstate',
          region: 'us-east-1',
          encrypt: true,
          dynamodb_table: '${var.project_name}-terraform-locks'
        }
      },
      azure: {
        type: 'azurerm',
        config: {
          resource_group_name: '${var.project_name}-tfstate',
          storage_account_name: 'tfstate${var.project_name}',
          container_name: 'tfstate',
          key: '${var.environment}.terraform.tfstate'
        }
      },
      gcp: {
        type: 'gcs',
        config: {
          bucket: '${var.project_name}-terraform-state',
          prefix: '${var.environment}'
        }
      }
    };

    return backends[cloudProvider] || backends.aws;
  }

  async createWorkflow(terraformPlan) {
    return {
      steps: [
        {
          step: 1,
          name: 'Initialize',
          command: 'terraform init',
          description: 'Initialize Terraform and download providers',
          estimatedTime: '1-2 minutes'
        },
        {
          step: 2,
          name: 'Validate',
          command: 'terraform validate',
          description: 'Validate configuration syntax',
          estimatedTime: '30 seconds'
        },
        {
          step: 3,
          name: 'Format',
          command: 'terraform fmt -check',
          description: 'Check code formatting',
          estimatedTime: '30 seconds'
        },
        {
          step: 4,
          name: 'Plan',
          command: 'terraform plan -out=tfplan',
          description: 'Generate execution plan',
          estimatedTime: '2-5 minutes'
        },
        {
          step: 5,
          name: 'Apply',
          command: 'terraform apply tfplan',
          description: 'Apply infrastructure changes',
          estimatedTime: '10-30 minutes',
          requiresApproval: true
        }
      ],
      estimatedTime: '15-40 minutes',
      cicdIntegration: {
        preCommit: ['terraform fmt', 'terraform validate'],
        prValidation: ['terraform plan'],
        deployment: ['terraform apply -auto-approve']
      }
    };
  }

  generateBestPractices(terraformPlan, modules) {
    return {
      structure: {
        score: modules.length >= 3 ? 'Good' : 'Needs Improvement',
        recommendation: 'Use modular structure for reusability'
      },
      stateManagement: {
        score: terraformPlan.stateManagement === 'remote' ? 'Good' : 'Needs Improvement',
        recommendation: 'Always use remote state with locking'
      },
      versioning: {
        score: 'Good',
        recommendation: 'Pin provider versions for consistency'
      },
      practices: [
        'Use terraform fmt for consistent formatting',
        'Run terraform validate before commits',
        'Use terraform plan before apply',
        'Enable state locking to prevent conflicts',
        'Use workspaces for environment separation',
        'Implement CI/CD for automated deployments',
        'Use terraform-docs for documentation',
        'Implement pre-commit hooks',
        'Use tfsec for security scanning',
        'Keep modules small and focused'
      ]
    };
  }

  getDefaultRegion(provider) {
    const defaults = {
      aws: 'us-east-1',
      azure: 'eastus',
      gcp: 'us-central1'
    };
    return defaults[provider] || 'us-east-1';
  }

  initializeProviderConfig() {
    return {
      aws: { requiredVersion: '~> 5.0' },
      azure: { requiredVersion: '~> 3.0' },
      gcp: { requiredVersion: '~> 5.0' }
    };
  }

  getPlan(executionId) {
    return this.planCache.get(executionId);
  }

  listPlans() {
    return Array.from(this.planCache.values()).map(p => ({
      id: p.executionId,
      provider: p.terraformPlan.cloudProvider,
      modules: p.modules.length
    }));
  }

  async _onCleanup() {
    // Cleanup if needed
  }
}

export default TerraformPlanAgent;
