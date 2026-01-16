# Azure Pipelines Skill

## Overview
**Skill ID**: `azure-pipelines`  
**Version**: 1.0  
**Domain**: Azure DevOps Pipelines (YAML) for CI/CD automation  
**Phase**: 16 (@azure-devops-specialist)  
**Maturity**: Production-Ready

Azure Pipelines skill covers YAML pipeline syntax, multi-stage builds, deployment environments, quality gates, security scanning, caching optimization, and enterprise CI/CD patterns using Azure DevOps.

---

## Core Concepts

### 1. Pipeline Structure

**Definition**: YAML configuration for automated build and deployment.

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop
      - feature/*
  paths:
    include:
      - src/**
      - .pipelines/**
    exclude:
      - README.md
      - docs/**

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'
  dotnetVersion: '8.0.x'

stages:
  # Stage 1: Build & Test
  - stage: Build
    displayName: 'Build & Test'
    jobs:
      - job: BuildJob
        displayName: 'Build Application'
        steps:
          - task: UseDotNet@2
            inputs:
              version: $(dotnetVersion)
          
          - task: DotNetCoreCLI@2
            displayName: 'Restore NuGet packages'
            inputs:
              command: 'restore'
              projects: 'src/**/*.csproj'
          
          - task: DotNetCoreCLI@2
            displayName: 'Build solution'
            inputs:
              command: 'build'
              projects: 'src/**/*.csproj'
              arguments: '--configuration $(buildConfiguration)'
          
          - task: DotNetCoreCLI@2
            displayName: 'Run unit tests'
            inputs:
              command: 'test'
              projects: 'src/**/*.Tests.csproj'
              arguments: '--configuration $(buildConfiguration) --no-build'
              publishTestResults: true
          
          - task: DotNetCoreCLI@2
            displayName: 'Publish artifact'
            inputs:
              command: 'publish'
              projects: 'src/Api/Api.csproj'
              arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'
          
          - task: PublishBuildArtifacts@1
            displayName: 'Upload artifacts'
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'drop'

  # Stage 2: Code Quality
  - stage: CodeQuality
    displayName: 'Code Quality'
    dependsOn: Build
    condition: succeeded()
    jobs:
      - job: SonarQube
        displayName: 'Run SonarQube Analysis'
        steps:
          - checkout: self
            fetchDepth: 0
          
          - task: SonarCloudPrepare@1
            inputs:
              SonarCloud: 'SonarCloud'
              organization: 'myorg'
              scannerMode: 'MSBuild'
              projectKey: 'myproject'
          
          - task: DotNetCoreCLI@2
            inputs:
              command: 'build'
              projects: 'src/**/*.csproj'
          
          - task: SonarCloudAnalyze@1
          
          - task: SonarCloudPublish@1
            inputs:
              pollingTimeoutSec: '300'

  # Stage 3: Deploy to Development
  - stage: DeployDev
    displayName: 'Deploy to Development'
    dependsOn: CodeQuality
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
    jobs:
      - deployment: DeployDev
        displayName: 'Deploy Dev'
        environment: 'development'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadBuildArtifacts@0
                  inputs:
                    artifactName: 'drop'
                    downloadPath: '$(System.ArtifactsDirectory)'
                
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'AzureSubscription'
                    appType: 'webAppLinux'
                    appName: 'myapp-dev'
                    package: '$(System.ArtifactsDirectory)/drop'
                    runtimeStack: 'DOTNETCORE|8.0'

  # Stage 4: Deploy to Production
  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: CodeQuality
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployProd
        displayName: 'Deploy Production'
        environment: 'production'
        strategy:
          runOnce:
            preDeploy:
              steps:
                - task: AzureAppServiceManageAzureResources@1
                  inputs:
                    azureSubscription: 'AzureSubscription'
                    resourceGroupName: 'myapp-prod-rg'
                    appServiceName: 'myapp-prod'
                    action: 'Scale Up'
            deploy:
              steps:
                - task: DownloadBuildArtifacts@0
                  inputs:
                    artifactName: 'drop'
                    downloadPath: '$(System.ArtifactsDirectory)'
                
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'AzureSubscription'
                    appType: 'webAppLinux'
                    appName: 'myapp-prod'
                    package: '$(System.ArtifactsDirectory)/drop'
                    runtimeStack: 'DOTNETCORE|8.0'
            postDeploy:
              steps:
                - task: AzureAppServiceManageAzureResources@1
                  inputs:
                    azureSubscription: 'AzureSubscription'
                    resourceGroupName: 'myapp-prod-rg'
                    appServiceName: 'myapp-prod'
                    action: 'Scale Down'
```

**Key Elements**:
- **trigger**: Events that start pipeline
- **pool**: Machines to run on (ubuntu-latest, windows-latest, macos-latest)
- **variables**: Reusable values
- **stages**: Logical groupings of work
- **jobs**: Parallel units of work within stage
- **steps**: Individual commands/tasks

### 2. Deployment Strategies

**Definition**: Different patterns for releasing code safely.

```yaml
# Strategy 1: Run Once (single deployment)
stages:
  - stage: Deploy
    jobs:
      - deployment: DeployOnce
        environment: 'production'
        strategy:
          runOnce:
            preDeploy:
              steps:
                - script: echo "Pre-deployment checks"
            deploy:
              steps:
                - script: echo "Deploying..."
            postDeploy:
              steps:
                - script: echo "Post-deployment validation"

---

# Strategy 2: Rolling (sequential instances)
stages:
  - stage: Deploy
    jobs:
      - deployment: DeployRolling
        environment: 'production'
        strategy:
          rolling:
            maxParallel: 1           # Deploy to 1 instance at a time
            preDeploy:
              steps:
                - script: echo "Pre-deploy to {{Agent.Name}}"
            deploy:
              steps:
                - script: echo "Deploying to {{Agent.Name}}"
            postDeploy:
              steps:
                - script: echo "Running tests on {{Agent.Name}}"

---

# Strategy 3: Canary (small percentage first)
stages:
  - stage: Deploy
    jobs:
      - deployment: DeployCanary
        environment: 'production'
        strategy:
          canary:
            increments: [10, 20, 30] # 10%, 20%, 30% of traffic
            preDeploy:
              steps:
                - script: echo "Pre-deploy canary"
            deploy:
              steps:
                - script: echo "Deploy to {{Agent.Name}}"
            postDeploy:
              steps:
                - script: echo "Monitor metrics"

---

# Strategy 4: Blue-Green (zero downtime)
stages:
  - stage: Deploy
    jobs:
      - deployment: DeployBlueGreen
        environment: 'production'
        strategy:
          blueGreen:
            preDeploy:
              steps:
                - script: echo "Verify green environment ready"
            deploy:
              steps:
                - script: echo "Deploy to green environment"
            postDeploy:
              steps:
                - script: echo "Switch traffic from blue to green"
```

### 3. Quality Gates & Approvals

**Definition**: Prevent bad code from reaching production.

```yaml
trigger:
  - main

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        steps:
          - task: DotNetCoreCLI@2
            inputs:
              command: 'test'
              projects: '**/*Tests.csproj'

  - stage: CodeQuality
    dependsOn: Build
    jobs:
      - job: RunSonarQube
        steps:
          - task: SonarCloudPrepare@1
            inputs:
              SonarCloud: 'SonarCloud'
          
          - task: DotNetCoreCLI@2
            inputs:
              command: 'build'
          
          - task: SonarCloudAnalyze@1
          
          - task: SonarCloudPublish@1

  # Production deployment requires approval
  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: CodeQuality
    condition: succeeded()
    jobs:
      - deployment: DeployProduction
        displayName: 'Deploy Production'
        environment: 'production'  # Creates approval gate
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'AzureSubscription'
                    appName: 'myapp'
                    package: '$(Pipeline.Workspace)/drop'

# Quality gates in environment
# 1. In Azure DevOps: Pipelines → Environments → production
# 2. Add "Approvals" check
# 3. Add "Business hours only" check
# 4. Add "Required reviewers" check
```

### 4. Caching for Performance

**Definition**: Speed up builds by caching dependencies.

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  buildConfiguration: 'Release'

jobs:
  - job: BuildWithCaching
    steps:
      # Cache NuGet packages
      - task: Cache@2
        inputs:
          key: 'nuget | "$(Agent.OS)" | **/packages.lock.json'
          restoreKeys: |
            nuget | "$(Agent.OS)"
            nuget
          path: '$(NuGet.SharedFeedsDir)'
        displayName: 'Cache NuGet'
      
      # Cache .NET packages
      - task: Cache@2
        inputs:
          key: 'dotnet | "$(Agent.OS)" | src/**/*.csproj'
          restoreKeys: |
            dotnet | "$(Agent.OS)"
            dotnet
          path: '$(UserProfile)/.nuget/packages'
        displayName: 'Cache .NET'

      - task: DotNetCoreCLI@2
        inputs:
          command: 'restore'
          projects: 'src/**/*.csproj'

      - task: DotNetCoreCLI@2
        inputs:
          command: 'build'
          projects: 'src/**/*.csproj'

---

# NPM caching
jobs:
  - job: BuildWithNpm
    steps:
      - task: Cache@2
        inputs:
          key: 'npm | "$(Agent.OS)" | package-lock.json'
          restoreKeys: |
            npm | "$(Agent.OS)"
          path: '$(npm_config_cache)'
        displayName: 'Cache npm'

      - task: NodeTool@0
        inputs:
          versionSpec: '18.x'

      - script: npm ci
        displayName: 'Install dependencies'

      - script: npm run build
        displayName: 'Build'
```

### 5. Security Scanning

**Definition**: Automated security vulnerability detection.

```yaml
trigger:
  - main

stages:
  - stage: Build
    jobs:
      - job: BuildAndScan
        steps:
          - task: DotNetCoreCLI@2
            inputs:
              command: 'build'

  - stage: SecurityScans
    dependsOn: Build
    jobs:
      - job: DependencyScanning
        displayName: 'Scan Dependencies'
        steps:
          # OWASP dependency check
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '3.x'
          
          - script: pip install safety
            displayName: 'Install safety'
          
          - script: safety check --json > dependency-check.json
            displayName: 'Run dependency check'
            continueOnError: true
          
          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: 'dependency-check.json'
              artifactName: 'security-reports'

      - job: SonarQubeSecurityHotspots
        displayName: 'SonarQube Security Analysis'
        steps:
          - task: SonarCloudPrepare@1
            inputs:
              SonarCloud: 'SonarCloud'
          
          - task: DotNetCoreCLI@2
            inputs:
              command: 'build'
          
          - task: SonarCloudAnalyze@1

      - job: ContainerScanning
        displayName: 'Container Image Scanning'
        steps:
          - task: AzureSecurityTrivyScan@1
            inputs:
              imageName: '$(ACR_NAME).azurecr.io/myapp:latest'

      - job: InfrastructureAsCodeScanning
        displayName: 'Infrastructure as Code Scanning'
        steps:
          - task: Bridgecrewio@0
            inputs:
              projectKey: 'myorg/myproject'
              softFail: false

# Gate production deployment until scans pass
- stage: DeployProd
  displayName: 'Deploy to Production'
  dependsOn: SecurityScans
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  # All security scans must pass before deployment
```

### 6. Variables & Environments

**Definition**: Manage environment-specific configuration.

```yaml
trigger:
  - main

# Global variables
variables:
  buildConfiguration: 'Release'
  artifactName: 'drop'

# Environment-specific variables (must define in Azure DevOps UI)
# Or use variable groups

stages:
  - stage: Build
    variables:
      # Stage-level variables
      dotnetVersion: '8.0.x'
    jobs:
      - job: BuildJob
        variables:
          # Job-level variables
          runTests: true
        steps:
          - task: UseDotNet@2
            inputs:
              version: $(dotnetVersion)

          - ${{ if eq(variables['runTests'], 'true') }}:
            - task: DotNetCoreCLI@2
              inputs:
                command: 'test'

  - stage: DeployDev
    variables:
      environment: 'development'
      appName: 'myapp-dev'
    jobs:
      - deployment: Deploy
        environment: $(environment)

  - stage: DeployProd
    variables:
      environment: 'production'
      appName: 'myapp-prod'
    jobs:
      - deployment: Deploy
        environment: $(environment)

---

# Using variable groups (defined in Azure DevOps)
stages:
  - stage: Deploy
    jobs:
      - deployment: Deploy
        variables:
          - group: 'prod-secrets'  # Contains: apiKey, dbConnectionString, etc.
        steps:
          - task: AzureWebApp@1
            inputs:
              azureSubscription: 'AzureSubscription'
              appName: 'myapp'
              appSettings: |
                -ApiKey $(apiKey)
                -ConnectionString $(dbConnectionString)
```

---

## Best Practices

### 1. Use Stable Pool Images

```yaml
# ❌ BAD: Using latest (can break between runs)
pool:
  vmImage: 'ubuntu-latest'

# ✅ GOOD: Pin specific version
pool:
  vmImage: 'ubuntu-22.04'

# Options: ubuntu-22.04, ubuntu-20.04, windows-2022, macos-13
```

### 2. Fail Fast

```yaml
# ❌ BAD: Continue on errors
- task: DotNetCoreCLI@2
  inputs:
    command: 'test'
  continueOnError: true  # Hides failures!

# ✅ GOOD: Fail immediately on errors
- task: DotNetCoreCLI@2
  inputs:
    command: 'test'
  # continueOnError defaults to false
```

### 3. Publish Test Results

```yaml
# ✅ GOOD: Always publish test results
- task: DotNetCoreCLI@2
  displayName: 'Run Tests'
  inputs:
    command: 'test'
    projects: '**/*Tests.csproj'
    arguments: '--logger trx --collect:"XPlat Code Coverage"'
    publishTestResults: true

- task: PublishCodeCoverageResults@1
  inputs:
    codeCoverageTool: 'Cobertura'
    summaryFileLocation: '$(Agent.TempDirectory)/**/*coverage.cobertura.xml'
    pathToSources: '$(Build.SourcesDirectory)'
```

### 4. Use Conditions Wisely

```yaml
# ✅ GOOD: Deploy only on main branch
- stage: DeployProd
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')

# ✅ GOOD: Run only if previous succeeded
- stage: Deploy
  dependsOn: Build
  condition: succeeded()

# ✅ GOOD: Run only if previous failed
- stage: Notify
  dependsOn: Build
  condition: failed()

# ✅ GOOD: Complex condition
- job: DeployIfApproved
  condition: and(succeeded(), eq(variables['run_deploy'], 'true'))
```

### 5. Explicit Dependencies

```yaml
# ❌ BAD: Implicit dependencies (unclear order)
stages:
  - stage: Build
  - stage: Deploy     # Assumes depends on Build
  - stage: Validate   # Assumes depends on Deploy

# ✅ GOOD: Explicit dependencies
stages:
  - stage: Build
    displayName: 'Build Application'
  
  - stage: Deploy
    dependsOn: Build  # Explicitly depends on Build
  
  - stage: Validate
    dependsOn: Deploy # Explicitly depends on Deploy
```

### 6. Secure Sensitive Data

```yaml
# ❌ BAD: Hardcoded secrets
variables:
  apiKey: 'super-secret-key'

# ✅ GOOD: Use variable groups with secret checkbox
variables:
  - group: 'prod-secrets'  # Created in Azure DevOps UI with encryption

steps:
  - script: echo $(apiKey)  # Will be masked in logs
    displayName: 'Use secret (masked in output)'
```

---

## Complete Production Pipeline Example

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-22.04'

variables:
  buildConfiguration: 'Release'
  dotnetVersion: '8.0.x'
  artifactName: 'drop'

stages:
  # Stage 1: Build
  - stage: Build
    displayName: 'Build'
    jobs:
      - job: BuildJob
        displayName: 'Build Application'
        steps:
          - task: UseDotNet@2
            inputs:
              version: $(dotnetVersion)

          - task: Cache@2
            inputs:
              key: 'nuget | "$(Agent.OS)" | **/packages.lock.json'
              restoreKeys: |
                nuget | "$(Agent.OS)"
              path: '$(NuGet.SharedFeedsDir)'

          - task: DotNetCoreCLI@2
            displayName: 'Restore'
            inputs:
              command: 'restore'

          - task: DotNetCoreCLI@2
            displayName: 'Build'
            inputs:
              command: 'build'
              arguments: '--configuration $(buildConfiguration) --no-restore'

          - task: DotNetCoreCLI@2
            displayName: 'Test'
            inputs:
              command: 'test'
              arguments: '--configuration $(buildConfiguration) --no-build --logger trx'
              publishTestResults: true

          - task: DotNetCoreCLI@2
            displayName: 'Publish'
            inputs:
              command: 'publish'
              arguments: '--configuration $(buildConfiguration) --output $(Build.ArtifactStagingDirectory)'

          - task: PublishBuildArtifacts@1
            displayName: 'Publish Artifacts'
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)'
              artifactName: $(artifactName)

  # Stage 2: Code Quality
  - stage: CodeQuality
    displayName: 'Code Quality'
    dependsOn: Build
    condition: succeeded()
    jobs:
      - job: SonarQubeAnalysis
        displayName: 'SonarQube Analysis'
        steps:
          - task: SonarCloudPrepare@1
            inputs:
              SonarCloud: 'SonarCloud'
              organization: 'myorg'
              scannerMode: 'MSBuild'
              projectKey: 'myproject'

          - task: DotNetCoreCLI@2
            inputs:
              command: 'build'

          - task: SonarCloudAnalyze@1

          - task: SonarCloudPublish@1
            inputs:
              pollingTimeoutSec: '300'

  # Stage 3: Deploy to Dev (auto on develop)
  - stage: DeployDev
    displayName: 'Deploy to Dev'
    dependsOn: CodeQuality
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
    jobs:
      - deployment: DeployDev
        displayName: 'Deploy Dev'
        environment: 'development'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadBuildArtifacts@0
                  inputs:
                    artifactName: $(artifactName)
                    downloadPath: '$(Pipeline.Workspace)'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'AzureSubscription'
                    appType: 'webAppLinux'
                    appName: 'myapp-dev'
                    package: '$(Pipeline.Workspace)/$(artifactName)'
                    runtimeStack: 'DOTNETCORE|8.0'

  # Stage 4: Deploy to Prod (manual approval on main)
  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: CodeQuality
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployProd
        displayName: 'Deploy Production'
        environment: 'production'  # Requires approval
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadBuildArtifacts@0
                  inputs:
                    artifactName: $(artifactName)
                    downloadPath: '$(Pipeline.Workspace)'

                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'AzureSubscription'
                    appType: 'webAppLinux'
                    appName: 'myapp-prod'
                    package: '$(Pipeline.Workspace)/$(artifactName)'
                    runtimeStack: 'DOTNETCORE|8.0'
```

---

## Validation Criteria

When this skill is applied:
- ✅ Pipeline YAML is syntactically valid
- ✅ Stages have explicit dependencies
- ✅ Build jobs use caching for performance
- ✅ Test results published
- ✅ Code quality gates enforced
- ✅ Deployment environments configured
- ✅ Approvals required for production
- ✅ Security scans included
- ✅ Secrets not exposed in logs
- ✅ Deployment strategy appropriate (runOnce, rolling, canary, blueGreen)
- ✅ Rollback plans defined
- ✅ Failure notifications configured

---

## Further Reading
- Azure Pipelines Docs: https://learn.microsoft.com/azure/devops/pipelines/
- YAML Schema: https://learn.microsoft.com/azure/devops/pipelines/yaml-schema/
- Best Practices: https://learn.microsoft.com/azure/devops/pipelines/process/pipeline-default-branch/
