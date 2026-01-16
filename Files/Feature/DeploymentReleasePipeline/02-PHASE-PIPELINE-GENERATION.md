# Phase 2: Pipeline Generation

**Phase ID:** F-DRP-P02  
**Feature:** DeploymentReleasePipeline  
**Duration:** 3-4 days  
**Status:** ⬜ Not Started  
**Depends On:** Phase 1 (Environment Management)

---

## 🎯 Phase Objectives

Deze phase implementeert CI/CD pipeline generation:
- GitHub Actions workflow generation
- Azure Pipelines YAML generation
- Bicep deployment integration
- Multi-stage pipeline support
- Environment-specific deployments

---

## 📦 Deliverables

### 1. Directory Structure

```
src/
├── deployment/
│   └── pipeline/
│       ├── index.ts
│       ├── PipelineGenerator.ts
│       ├── generators/
│       │   ├── GitHubActionsGenerator.ts
│       │   ├── AzurePipelinesGenerator.ts
│       │   └── BicepDeploymentGenerator.ts
│       └── templates/
│           ├── github-actions/
│           └── azure-pipelines/
```

---

## 🔧 Implementation Details

### 2.1 Pipeline Types (`src/deployment/pipeline/PipelineGenerator.ts`)

```typescript
import { EnvironmentStage } from '../environment/EnvironmentConfig';

/**
 * Pipeline type
 */
export type PipelineType = 'github-actions' | 'azure-pipelines';

/**
 * Build step configuration
 */
export interface BuildStep {
  name: string;
  command: string;
  workingDirectory?: string;
  env?: Record<string, string>;
  continueOnError?: boolean;
}

/**
 * Test configuration
 */
export interface TestConfig {
  enabled: boolean;
  command: string;
  coverageEnabled?: boolean;
  coverageThreshold?: number;
}

/**
 * Security scan configuration
 */
export interface SecurityScanConfig {
  enabled: boolean;
  failOnHigh?: boolean;
  failOnCritical?: boolean;
  excludePaths?: string[];
}

/**
 * Deployment stage
 */
export interface DeploymentStage {
  name: string;
  environment: EnvironmentStage;
  dependsOn?: string[];
  condition?: string;
  approvalRequired?: boolean;
  steps: DeploymentStep[];
}

/**
 * Deployment step
 */
export interface DeploymentStep {
  type: 'azure-webapp' | 'azure-container' | 'bicep' | 'docker' | 'custom';
  name: string;
  config: Record<string, unknown>;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  name: string;
  type: PipelineType;
  trigger: {
    branches: string[];
    paths?: string[];
    tags?: string[];
  };
  variables?: Record<string, string>;
  secrets?: string[];
  build: {
    nodeVersion?: string;
    steps: BuildStep[];
  };
  test?: TestConfig;
  security?: SecurityScanConfig;
  stages: DeploymentStage[];
}

/**
 * Generated pipeline result
 */
export interface GeneratedPipeline {
  type: PipelineType;
  filename: string;
  content: string;
  additionalFiles?: Array<{
    filename: string;
    content: string;
  }>;
}

/**
 * Pipeline generator interface
 */
export interface IPipelineGenerator {
  type: PipelineType;
  generate(config: PipelineConfig): GeneratedPipeline;
  validate(config: PipelineConfig): { valid: boolean; errors: string[] };
}

/**
 * Pipeline generator factory
 */
export class PipelineGenerator {
  private generators: Map<PipelineType, IPipelineGenerator> = new Map();

  /**
   * Register a pipeline generator
   */
  registerGenerator(generator: IPipelineGenerator): void {
    this.generators.set(generator.type, generator);
  }

  /**
   * Generate pipeline
   */
  generate(config: PipelineConfig): GeneratedPipeline {
    const generator = this.generators.get(config.type);
    if (!generator) {
      throw new Error(`No generator found for pipeline type: ${config.type}`);
    }

    // Validate first
    const validation = generator.validate(config);
    if (!validation.valid) {
      throw new Error(`Invalid pipeline config: ${validation.errors.join(', ')}`);
    }

    return generator.generate(config);
  }

  /**
   * Get available generators
   */
  getAvailableTypes(): PipelineType[] {
    return Array.from(this.generators.keys());
  }
}

/**
 * Create pipeline generator with default generators
 */
export function createPipelineGenerator(): PipelineGenerator {
  const generator = new PipelineGenerator();
  
  // Register generators
  generator.registerGenerator(new GitHubActionsGenerator());
  generator.registerGenerator(new AzurePipelinesGenerator());
  
  return generator;
}

// Forward declarations for generators (implemented below)
declare class GitHubActionsGenerator implements IPipelineGenerator {
  type: PipelineType;
  generate(config: PipelineConfig): GeneratedPipeline;
  validate(config: PipelineConfig): { valid: boolean; errors: string[] };
}

declare class AzurePipelinesGenerator implements IPipelineGenerator {
  type: PipelineType;
  generate(config: PipelineConfig): GeneratedPipeline;
  validate(config: PipelineConfig): { valid: boolean; errors: string[] };
}
```

### 2.2 GitHub Actions Generator (`src/deployment/pipeline/generators/GitHubActionsGenerator.ts`)

```typescript
import * as yaml from 'yaml';
import {
  PipelineConfig,
  GeneratedPipeline,
  IPipelineGenerator,
  PipelineType,
  DeploymentStage,
} from '../PipelineGenerator';

/**
 * GitHub Actions workflow step
 */
interface GitHubStep {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, string | number | boolean>;
  env?: Record<string, string>;
  if?: string;
  'continue-on-error'?: boolean;
  'working-directory'?: string;
}

/**
 * GitHub Actions job
 */
interface GitHubJob {
  name: string;
  'runs-on': string;
  needs?: string[];
  if?: string;
  environment?: {
    name: string;
    url?: string;
  };
  steps: GitHubStep[];
}

/**
 * GitHub Actions workflow
 */
interface GitHubWorkflow {
  name: string;
  on: {
    push?: {
      branches?: string[];
      paths?: string[];
      tags?: string[];
    };
    pull_request?: {
      branches?: string[];
    };
    workflow_dispatch?: Record<string, unknown>;
  };
  env?: Record<string, string>;
  jobs: Record<string, GitHubJob>;
}

/**
 * GitHub Actions generator
 */
export class GitHubActionsGenerator implements IPipelineGenerator {
  type: PipelineType = 'github-actions';

  /**
   * Generate GitHub Actions workflow
   */
  generate(config: PipelineConfig): GeneratedPipeline {
    const workflow = this.buildWorkflow(config);
    
    return {
      type: 'github-actions',
      filename: `.github/workflows/${config.name.toLowerCase().replace(/\s+/g, '-')}.yml`,
      content: yaml.stringify(workflow, { lineWidth: 0 }),
    };
  }

  /**
   * Validate configuration
   */
  validate(config: PipelineConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name) {
      errors.push('Pipeline name is required');
    }

    if (!config.trigger?.branches?.length) {
      errors.push('At least one trigger branch is required');
    }

    if (!config.stages?.length) {
      errors.push('At least one deployment stage is required');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Build workflow object
   */
  private buildWorkflow(config: PipelineConfig): GitHubWorkflow {
    const workflow: GitHubWorkflow = {
      name: config.name,
      on: this.buildTriggers(config),
      jobs: {},
    };

    // Add global environment variables
    if (config.variables) {
      workflow.env = config.variables;
    }

    // Build job
    workflow.jobs.build = this.buildBuildJob(config);

    // Test job (if enabled)
    if (config.test?.enabled) {
      workflow.jobs.test = this.buildTestJob(config);
    }

    // Security scan job (if enabled)
    if (config.security?.enabled) {
      workflow.jobs.security = this.buildSecurityJob(config);
    }

    // Deployment stages
    for (const stage of config.stages) {
      const jobName = `deploy-${stage.environment}`;
      workflow.jobs[jobName] = this.buildDeploymentJob(config, stage);
    }

    return workflow;
  }

  /**
   * Build triggers
   */
  private buildTriggers(config: PipelineConfig) {
    return {
      push: {
        branches: config.trigger.branches,
        ...(config.trigger.paths && { paths: config.trigger.paths }),
        ...(config.trigger.tags && { tags: config.trigger.tags }),
      },
      pull_request: {
        branches: config.trigger.branches,
      },
      workflow_dispatch: {},
    };
  }

  /**
   * Build build job
   */
  private buildBuildJob(config: PipelineConfig): GitHubJob {
    const steps: GitHubStep[] = [
      {
        name: 'Checkout',
        uses: 'actions/checkout@v4',
      },
      {
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v4',
        with: {
          'node-version': config.build.nodeVersion || '20',
          cache: 'npm',
        },
      },
      {
        name: 'Install dependencies',
        run: 'npm ci',
      },
    ];

    // Add custom build steps
    for (const step of config.build.steps) {
      steps.push({
        name: step.name,
        run: step.command,
        ...(step.workingDirectory && { 'working-directory': step.workingDirectory }),
        ...(step.env && { env: step.env }),
        ...(step.continueOnError && { 'continue-on-error': true }),
      });
    }

    // Upload artifacts
    steps.push({
      name: 'Upload build artifacts',
      uses: 'actions/upload-artifact@v4',
      with: {
        name: 'build-output',
        path: 'dist/',
        'retention-days': '7',
      },
    });

    return {
      name: 'Build',
      'runs-on': 'ubuntu-latest',
      steps,
    };
  }

  /**
   * Build test job
   */
  private buildTestJob(config: PipelineConfig): GitHubJob {
    const steps: GitHubStep[] = [
      {
        name: 'Checkout',
        uses: 'actions/checkout@v4',
      },
      {
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v4',
        with: {
          'node-version': config.build.nodeVersion || '20',
          cache: 'npm',
        },
      },
      {
        name: 'Install dependencies',
        run: 'npm ci',
      },
      {
        name: 'Run tests',
        run: config.test!.command || 'npm test',
      },
    ];

    // Coverage upload
    if (config.test?.coverageEnabled) {
      steps.push({
        name: 'Upload coverage',
        uses: 'codecov/codecov-action@v4',
        with: {
          'fail_ci_if_error': 'true',
        },
      });
    }

    return {
      name: 'Test',
      'runs-on': 'ubuntu-latest',
      needs: ['build'],
      steps,
    };
  }

  /**
   * Build security scan job
   */
  private buildSecurityJob(config: PipelineConfig): GitHubJob {
    const steps: GitHubStep[] = [
      {
        name: 'Checkout',
        uses: 'actions/checkout@v4',
      },
      {
        name: 'Run dependency audit',
        run: 'npm audit --audit-level=high',
        'continue-on-error': !config.security!.failOnHigh,
      },
      {
        name: 'Run CodeQL analysis',
        uses: 'github/codeql-action/init@v3',
        with: {
          languages: 'javascript,typescript',
        },
      },
      {
        name: 'Autobuild',
        uses: 'github/codeql-action/autobuild@v3',
      },
      {
        name: 'Perform CodeQL Analysis',
        uses: 'github/codeql-action/analyze@v3',
      },
    ];

    return {
      name: 'Security Scan',
      'runs-on': 'ubuntu-latest',
      steps,
    };
  }

  /**
   * Build deployment job
   */
  private buildDeploymentJob(
    config: PipelineConfig,
    stage: DeploymentStage
  ): GitHubJob {
    const steps: GitHubStep[] = [
      {
        name: 'Checkout',
        uses: 'actions/checkout@v4',
      },
      {
        name: 'Download build artifacts',
        uses: 'actions/download-artifact@v4',
        with: {
          name: 'build-output',
          path: 'dist/',
        },
      },
    ];

    // Azure login for Azure deployments
    const hasAzureStep = stage.steps.some(s => 
      s.type === 'azure-webapp' || s.type === 'azure-container' || s.type === 'bicep'
    );

    if (hasAzureStep) {
      steps.push({
        name: 'Login to Azure',
        uses: 'azure/login@v2',
        with: {
          creds: '${{ secrets.AZURE_CREDENTIALS }}',
        },
      });
    }

    // Add deployment steps
    for (const step of stage.steps) {
      steps.push(this.buildDeploymentStep(step, stage));
    }

    // Determine dependencies
    const needs: string[] = ['build'];
    if (config.test?.enabled) {
      needs.push('test');
    }
    if (stage.dependsOn) {
      for (const dep of stage.dependsOn) {
        needs.push(`deploy-${dep}`);
      }
    }

    return {
      name: `Deploy to ${stage.name}`,
      'runs-on': 'ubuntu-latest',
      needs,
      ...(stage.condition && { if: stage.condition }),
      environment: {
        name: stage.environment,
        url: `https://app-${{ github.event.repository.name }}-${stage.environment}.azurewebsites.net`,
      },
      steps,
    };
  }

  /**
   * Build individual deployment step
   */
  private buildDeploymentStep(
    step: { type: string; name: string; config: Record<string, unknown> },
    stage: DeploymentStage
  ): GitHubStep {
    switch (step.type) {
      case 'azure-webapp':
        return {
          name: step.name,
          uses: 'azure/webapps-deploy@v3',
          with: {
            'app-name': step.config.appName as string,
            'resource-group': step.config.resourceGroup as string,
            package: step.config.package as string || 'dist/',
          },
        };

      case 'azure-container':
        return {
          name: step.name,
          uses: 'azure/container-apps-deploy-action@v2',
          with: {
            'resource-group': step.config.resourceGroup as string,
            'container-app-name': step.config.containerAppName as string,
            'image': step.config.image as string,
          },
        };

      case 'bicep':
        return {
          name: step.name,
          uses: 'azure/arm-deploy@v2',
          with: {
            'resource-group': step.config.resourceGroup as string,
            template: step.config.templateFile as string || 'infra/main.bicep',
            'parameters': step.config.parameters as string || '',
            'deployment-mode': 'Incremental',
          },
        };

      case 'docker':
        return {
          name: step.name,
          run: [
            `docker build -t ${step.config.image} .`,
            `docker push ${step.config.image}`,
          ].join('\n'),
        };

      default:
        return {
          name: step.name,
          run: step.config.command as string,
        };
    }
  }
}
```

### 2.3 Azure Pipelines Generator (`src/deployment/pipeline/generators/AzurePipelinesGenerator.ts`)

```typescript
import * as yaml from 'yaml';
import {
  PipelineConfig,
  GeneratedPipeline,
  IPipelineGenerator,
  PipelineType,
  DeploymentStage,
} from '../PipelineGenerator';

/**
 * Azure Pipelines step
 */
interface AzureStep {
  task?: string;
  script?: string;
  displayName: string;
  inputs?: Record<string, string | boolean | number>;
  env?: Record<string, string>;
  condition?: string;
  continueOnError?: boolean;
}

/**
 * Azure Pipelines job
 */
interface AzureJob {
  job: string;
  displayName: string;
  pool: {
    vmImage: string;
  };
  dependsOn?: string[];
  condition?: string;
  steps: AzureStep[];
}

/**
 * Azure Pipelines stage
 */
interface AzureStage {
  stage: string;
  displayName: string;
  dependsOn?: string[];
  condition?: string;
  jobs: AzureJob[];
}

/**
 * Azure Pipeline
 */
interface AzurePipeline {
  name: string;
  trigger: {
    branches: {
      include: string[];
    };
    paths?: {
      include?: string[];
    };
  };
  pr?: {
    branches: {
      include: string[];
    };
  };
  variables?: Array<{ name: string; value: string } | { group: string }>;
  stages: AzureStage[];
}

/**
 * Azure Pipelines generator
 */
export class AzurePipelinesGenerator implements IPipelineGenerator {
  type: PipelineType = 'azure-pipelines';

  /**
   * Generate Azure Pipeline
   */
  generate(config: PipelineConfig): GeneratedPipeline {
    const pipeline = this.buildPipeline(config);
    
    return {
      type: 'azure-pipelines',
      filename: 'azure-pipelines.yml',
      content: yaml.stringify(pipeline, { lineWidth: 0 }),
    };
  }

  /**
   * Validate configuration
   */
  validate(config: PipelineConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name) {
      errors.push('Pipeline name is required');
    }

    if (!config.trigger?.branches?.length) {
      errors.push('At least one trigger branch is required');
    }

    if (!config.stages?.length) {
      errors.push('At least one deployment stage is required');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Build pipeline object
   */
  private buildPipeline(config: PipelineConfig): AzurePipeline {
    const pipeline: AzurePipeline = {
      name: config.name,
      trigger: {
        branches: {
          include: config.trigger.branches,
        },
        ...(config.trigger.paths && {
          paths: { include: config.trigger.paths },
        }),
      },
      pr: {
        branches: {
          include: config.trigger.branches,
        },
      },
      stages: [],
    };

    // Variables
    if (config.variables || config.secrets) {
      pipeline.variables = [];
      
      if (config.variables) {
        for (const [name, value] of Object.entries(config.variables)) {
          pipeline.variables.push({ name, value });
        }
      }
      
      // Add variable group for secrets
      if (config.secrets?.length) {
        pipeline.variables.push({ group: 'deployment-secrets' });
      }
    }

    // Build stage
    pipeline.stages.push(this.buildBuildStage(config));

    // Test stage
    if (config.test?.enabled) {
      pipeline.stages.push(this.buildTestStage(config));
    }

    // Security stage
    if (config.security?.enabled) {
      pipeline.stages.push(this.buildSecurityStage(config));
    }

    // Deployment stages
    for (const stage of config.stages) {
      pipeline.stages.push(this.buildDeploymentStage(config, stage));
    }

    return pipeline;
  }

  /**
   * Build build stage
   */
  private buildBuildStage(config: PipelineConfig): AzureStage {
    const steps: AzureStep[] = [
      {
        task: 'NodeTool@0',
        displayName: 'Install Node.js',
        inputs: {
          versionSpec: config.build.nodeVersion || '20.x',
        },
      },
      {
        script: 'npm ci',
        displayName: 'Install dependencies',
      },
    ];

    // Custom build steps
    for (const step of config.build.steps) {
      steps.push({
        script: step.command,
        displayName: step.name,
        ...(step.env && { env: step.env }),
        ...(step.continueOnError && { continueOnError: true }),
      });
    }

    // Publish artifacts
    steps.push({
      task: 'PublishBuildArtifacts@1',
      displayName: 'Publish artifacts',
      inputs: {
        pathToPublish: 'dist',
        artifactName: 'build-output',
      },
    });

    return {
      stage: 'Build',
      displayName: 'Build',
      jobs: [
        {
          job: 'BuildJob',
          displayName: 'Build Application',
          pool: {
            vmImage: 'ubuntu-latest',
          },
          steps,
        },
      ],
    };
  }

  /**
   * Build test stage
   */
  private buildTestStage(config: PipelineConfig): AzureStage {
    const steps: AzureStep[] = [
      {
        task: 'NodeTool@0',
        displayName: 'Install Node.js',
        inputs: {
          versionSpec: config.build.nodeVersion || '20.x',
        },
      },
      {
        script: 'npm ci',
        displayName: 'Install dependencies',
      },
      {
        script: config.test!.command || 'npm test',
        displayName: 'Run tests',
      },
    ];

    if (config.test?.coverageEnabled) {
      steps.push({
        task: 'PublishCodeCoverageResults@1',
        displayName: 'Publish coverage',
        inputs: {
          codeCoverageTool: 'Cobertura',
          summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml',
        },
      });
    }

    return {
      stage: 'Test',
      displayName: 'Test',
      dependsOn: ['Build'],
      jobs: [
        {
          job: 'TestJob',
          displayName: 'Run Tests',
          pool: {
            vmImage: 'ubuntu-latest',
          },
          steps,
        },
      ],
    };
  }

  /**
   * Build security stage
   */
  private buildSecurityStage(config: PipelineConfig): AzureStage {
    const steps: AzureStep[] = [
      {
        script: 'npm audit --audit-level=high',
        displayName: 'Run dependency audit',
        continueOnError: !config.security!.failOnHigh,
      },
      {
        task: 'CredScan@3',
        displayName: 'Run credential scan',
        inputs: {
          toolMajorVersion: 'V2',
        },
      },
    ];

    return {
      stage: 'Security',
      displayName: 'Security Scan',
      dependsOn: ['Build'],
      jobs: [
        {
          job: 'SecurityJob',
          displayName: 'Security Analysis',
          pool: {
            vmImage: 'ubuntu-latest',
          },
          steps,
        },
      ],
    };
  }

  /**
   * Build deployment stage
   */
  private buildDeploymentStage(
    config: PipelineConfig,
    stage: DeploymentStage
  ): AzureStage {
    const steps: AzureStep[] = [
      {
        task: 'DownloadBuildArtifacts@1',
        displayName: 'Download artifacts',
        inputs: {
          buildType: 'current',
          artifactName: 'build-output',
          downloadPath: '$(System.ArtifactsDirectory)',
        },
      },
    ];

    // Add deployment steps
    for (const step of stage.steps) {
      steps.push(this.buildDeploymentStep(step));
    }

    // Dependencies
    const dependsOn: string[] = ['Build'];
    if (config.test?.enabled) {
      dependsOn.push('Test');
    }
    if (stage.dependsOn) {
      for (const dep of stage.dependsOn) {
        dependsOn.push(`Deploy_${dep}`);
      }
    }

    return {
      stage: `Deploy_${stage.environment}`,
      displayName: `Deploy to ${stage.name}`,
      dependsOn,
      ...(stage.condition && { condition: stage.condition }),
      jobs: [
        {
          job: 'DeployJob',
          displayName: `Deploy to ${stage.environment}`,
          pool: {
            vmImage: 'ubuntu-latest',
          },
          steps,
        },
      ],
    };
  }

  /**
   * Build individual deployment step
   */
  private buildDeploymentStep(
    step: { type: string; name: string; config: Record<string, unknown> }
  ): AzureStep {
    switch (step.type) {
      case 'azure-webapp':
        return {
          task: 'AzureWebApp@1',
          displayName: step.name,
          inputs: {
            azureSubscription: step.config.subscription as string,
            appName: step.config.appName as string,
            resourceGroupName: step.config.resourceGroup as string,
            package: step.config.package as string || '$(System.ArtifactsDirectory)/build-output',
          },
        };

      case 'azure-container':
        return {
          task: 'AzureContainerApps@1',
          displayName: step.name,
          inputs: {
            azureSubscription: step.config.subscription as string,
            containerAppName: step.config.containerAppName as string,
            resourceGroup: step.config.resourceGroup as string,
            imageToDeploy: step.config.image as string,
          },
        };

      case 'bicep':
        return {
          task: 'AzureResourceManagerTemplateDeployment@3',
          displayName: step.name,
          inputs: {
            deploymentScope: 'Resource Group',
            azureResourceManagerConnection: step.config.subscription as string,
            subscriptionId: step.config.subscriptionId as string,
            resourceGroupName: step.config.resourceGroup as string,
            location: step.config.location as string || 'westeurope',
            templateLocation: 'Linked artifact',
            csmFile: step.config.templateFile as string || 'infra/main.bicep',
            overrideParameters: step.config.parameters as string || '',
            deploymentMode: 'Incremental',
          },
        };

      default:
        return {
          script: step.config.command as string,
          displayName: step.name,
        };
    }
  }
}
```

### 2.4 Bicep Deployment Generator (`src/deployment/pipeline/generators/BicepDeploymentGenerator.ts`)

```typescript
import { EnvironmentConfig, EnvironmentStage } from '../../environment/EnvironmentConfig';

/**
 * Bicep deployment configuration
 */
export interface BicepDeploymentConfig {
  resourceGroup: string;
  location: string;
  templateFile: string;
  parametersFile?: string;
  parameters?: Record<string, unknown>;
}

/**
 * Generated Bicep files
 */
export interface GeneratedBicepDeployment {
  mainBicep: string;
  parameterFiles: Record<EnvironmentStage, string>;
  deploymentScript: string;
}

/**
 * Bicep deployment generator
 */
export class BicepDeploymentGenerator {
  /**
   * Generate deployment-ready Bicep files
   */
  generateDeploymentFiles(
    environments: Record<EnvironmentStage, EnvironmentConfig>,
    options: {
      appName: string;
      useContainerApps?: boolean;
    }
  ): GeneratedBicepDeployment {
    return {
      mainBicep: this.generateMainBicep(options),
      parameterFiles: this.generateParameterFiles(environments, options),
      deploymentScript: this.generateDeploymentScript(environments, options),
    };
  }

  /**
   * Generate main.bicep
   */
  private generateMainBicep(options: { appName: string; useContainerApps?: boolean }): string {
    if (options.useContainerApps) {
      return this.generateContainerAppsBicep(options.appName);
    }
    return this.generateAppServiceBicep(options.appName);
  }

  /**
   * Generate App Service Bicep
   */
  private generateAppServiceBicep(appName: string): string {
    return `// Generated by AgenticCoder
@description('Environment name')
param environment string

@description('Location for resources')
param location string = resourceGroup().location

@description('App Service Plan SKU')
param appServicePlanSku string = 'B1'

@description('Application settings')
param appSettings object = {}

// Variables
var appServicePlanName = 'asp-${appName}-\${environment}'
var webAppName = 'app-${appName}-\${environment}'
var keyVaultName = 'kv-${appName}-\${environment}'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: environment == 'production'
      appSettings: [for item in items(appSettings): {
        name: item.key
        value: item.value
      }]
    }
    httpsOnly: true
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: webApp.identity.principalId
        permissions: {
          secrets: ['get', 'list']
        }
      }
    ]
  }
}

// Outputs
output webAppName string = webApp.name
output webAppUrl string = 'https://\${webApp.properties.defaultHostName}'
output keyVaultName string = keyVault.name
`;
  }

  /**
   * Generate Container Apps Bicep
   */
  private generateContainerAppsBicep(appName: string): string {
    return `// Generated by AgenticCoder
@description('Environment name')
param environment string

@description('Location for resources')
param location string = resourceGroup().location

@description('Container image')
param containerImage string

@description('Application settings')
param appSettings object = {}

// Variables
var containerAppEnvName = 'cae-${appName}-\${environment}'
var containerAppName = 'ca-${appName}-\${environment}'

// Container App Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppEnvName
  location: location
  properties: {}
}

// Container App
resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
    }
    template: {
      containers: [
        {
          name: 'app'
          image: containerImage
          env: [for item in items(appSettings): {
            name: item.key
            value: item.value
          }]
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: environment == 'production' ? 2 : 1
        maxReplicas: environment == 'production' ? 10 : 3
      }
    }
  }
}

// Outputs
output containerAppName string = containerApp.name
output containerAppUrl string = 'https://\${containerApp.properties.configuration.ingress.fqdn}'
`;
  }

  /**
   * Generate parameter files for each environment
   */
  private generateParameterFiles(
    environments: Record<EnvironmentStage, EnvironmentConfig>,
    options: { appName: string }
  ): Record<EnvironmentStage, string> {
    const files: Record<EnvironmentStage, string> = {} as Record<EnvironmentStage, string>;

    for (const [stage, config] of Object.entries(environments)) {
      files[stage as EnvironmentStage] = JSON.stringify({
        '$schema': 'https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#',
        contentVersion: '1.0.0.0',
        parameters: {
          environment: { value: stage },
          location: { value: config.azure?.location || 'westeurope' },
          appServicePlanSku: { 
            value: stage === 'production' ? 'P1v2' : 'B1' 
          },
          appSettings: {
            value: config.variables,
          },
        },
      }, null, 2);
    }

    return files;
  }

  /**
   * Generate deployment script
   */
  private generateDeploymentScript(
    environments: Record<EnvironmentStage, EnvironmentConfig>,
    options: { appName: string }
  ): string {
    const stages = Object.keys(environments) as EnvironmentStage[];
    
    return `#!/bin/bash
# Generated by AgenticCoder
# Deployment script for ${options.appName}

set -e

ENVIRONMENT=\${1:-development}
RESOURCE_GROUP="rg-${options.appName}-\${ENVIRONMENT}"
LOCATION="westeurope"

echo "Deploying to \${ENVIRONMENT}..."

# Create resource group if not exists
az group create --name \$RESOURCE_GROUP --location \$LOCATION

# Deploy Bicep template
az deployment group create \\
  --resource-group \$RESOURCE_GROUP \\
  --template-file infra/main.bicep \\
  --parameters @infra/parameters.\${ENVIRONMENT}.json

echo "Deployment complete!"
`;
  }
}

/**
 * Create Bicep deployment generator
 */
export function createBicepDeploymentGenerator(): BicepDeploymentGenerator {
  return new BicepDeploymentGenerator();
}
```

---

## 📋 Acceptance Criteria

- [ ] GitHub Actions workflows generate correctly
- [ ] Azure Pipelines YAML generates correctly
- [ ] Bicep deployment files include all environments
- [ ] Multi-stage pipelines work end-to-end
- [ ] Security scanning integrates in pipelines
- [ ] Environment-specific deployments work

---

## 🔗 Navigation

← [01-PHASE-ENVIRONMENT-MANAGEMENT.md](01-PHASE-ENVIRONMENT-MANAGEMENT.md) | [03-PHASE-DEPLOYMENT-EXECUTION.md](03-PHASE-DEPLOYMENT-EXECUTION.md) →
