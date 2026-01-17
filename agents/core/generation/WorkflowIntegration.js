/**
 * WorkflowIntegration.js
 * 
 * Integrates code generation into the existing 16-phase workflow,
 * enabling phase-based code generation with proper context flow.
 * 
 * @module agents/core/generation/WorkflowIntegration
 */

class WorkflowIntegration {
  /**
   * Create a Workflow Integration
   * @param {Object} workflowEngine - The workflow orchestration engine
   * @param {CodeGenerationEngine} codeGenerationEngine - The code generation engine
   */
  constructor(workflowEngine, codeGenerationEngine) {
    this.workflow = workflowEngine;
    this.generation = codeGenerationEngine;
    
    // Phase-to-generator mapping
    this.phaseGeneratorMap = this.initializePhaseMapping();
    
    // Generator-to-agent mapping
    this.generatorAgentMap = this.initializeAgentMapping();
    
    this.registerGenerationPhases();
  }

  /**
   * Initialize mapping of workflow phases to generators
   * @returns {Map<number, Object>} Phase to generator configuration map
   */
  initializePhaseMapping() {
    return new Map([
      // Phase 2: Architecture - Pattern selection
      [2, {
        name: 'Architecture',
        generators: ['microservices', 'serverless', 'event-driven'],
        conditional: true,
        selector: (context) => this.selectArchitectureGenerator(context),
      }],
      
      // Phase 4: Backend Development
      [4, {
        name: 'Backend Development',
        generators: ['express', 'nestjs', 'fastapi', 'dotnet'],
        selector: (context) => this.selectBackendGenerator(context),
      }],
      
      // Phase 5: Frontend Development
      [5, {
        name: 'Frontend Development',
        generators: ['react', 'vue', 'nextjs', 'angular', 'vite'],
        selector: (context) => this.selectFrontendGenerator(context),
      }],
      
      // Phase 6: Database
      [6, {
        name: 'Database',
        generators: ['postgresql', 'azuresql', 'cosmosdb', 'sqlserver'],
        selector: (context) => this.selectDatabaseGenerator(context),
      }],
      
      // Phase 7: Testing - Test file generation
      [7, {
        name: 'Testing',
        generators: ['test'],
        action: 'generateTests',
      }],
      
      // Phase 9: Infrastructure
      [9, {
        name: 'Infrastructure',
        generators: ['bicep', 'entraid', 'keyvault', 'storage', 'networking', 'monitoring', 'containerapps'],
        selector: (context) => this.selectInfrastructureGenerators(context),
        multiple: true,
      }],
      
      // Phase 10: CI/CD - Workflow generation
      [10, {
        name: 'CI/CD',
        generators: ['cicd'],
        action: 'generateWorkflows',
      }],
      
      // Phase 11: Security
      [11, {
        name: 'Security',
        generators: ['entraid', 'keyvault'],
        selector: (context) => this.selectSecurityGenerators(context),
        multiple: true,
      }],
      
      // Phase 12: Documentation
      [12, {
        name: 'Documentation',
        generators: ['docs'],
        action: 'generateDocumentation',
      }],
    ]);
  }

  /**
   * Initialize mapping of generators to specialist agents
   * @returns {Map<string, Object>} Generator to agent configuration map
   */
  initializeAgentMapping() {
    return new Map([
      // Frontend
      ['react', { agent: '@react-specialist', skills: ['react-patterns', 'state-management'] }],
      ['vue', { agent: '@vue-specialist', skills: ['vue-patterns'] }],
      ['nextjs', { agent: '@nextjs-specialist', skills: ['nextjs-patterns'] }],
      ['angular', { agent: '@angular-specialist', skills: ['angular-patterns'] }],
      ['vite', { agent: '@vite-specialist', skills: ['vite-patterns'] }],
      
      // Backend
      ['express', { agent: '@nodejs-specialist', skills: ['express-patterns', 'error-handling'] }],
      ['nestjs', { agent: '@nodejs-specialist', skills: ['nestjs-patterns'] }],
      ['fastapi', { agent: '@python-specialist', skills: ['fastapi-patterns'] }],
      ['dotnet', { agent: '@backend-dev', skills: ['dotnet-patterns', 'dotnet-webapi'] }],
      
      // Database
      ['postgresql', { agent: '@database-specialist', skills: ['database-design', 'sql-schema-design'] }],
      ['azuresql', { agent: '@azure-sql-specialist', skills: ['azure-sql-patterns', 'tsql-programming'] }],
      ['cosmosdb', { agent: '@cosmos-db-specialist', skills: ['cosmos-db-patterns'] }],
      ['sqlserver', { agent: '@database-specialist', skills: ['sql-schema-design'] }],
      
      // Architecture
      ['microservices', { agent: '@microservices-architect', skills: ['microservices-patterns'] }],
      ['serverless', { agent: '@serverless-specialist', skills: ['serverless-patterns'] }],
      ['event-driven', { agent: '@event-driven-architect', skills: ['event-driven-patterns'] }],
      
      // Azure Infrastructure
      ['bicep', { agent: '@bicep-specialist', skills: ['azure-bicep-mastery', 'infrastructure-automation'] }],
      ['entraid', { agent: '@entra-id-specialist', skills: ['entra-id-patterns'] }],
      ['keyvault', { agent: '@keyvault-specialist', skills: ['keyvault-patterns'] }],
      ['storage', { agent: '@storage-specialist', skills: ['azure-storage-patterns'] }],
      ['networking', { agent: '@networking-specialist', skills: ['azure-networking-patterns'] }],
      ['monitoring', { agent: '@monitoring-specialist', skills: ['azure-monitoring-patterns'] }],
      ['containerapps', { agent: '@container-specialist', skills: ['container-apps-patterns'] }],
    ]);
  }

  /**
   * Register generation steps for each workflow phase
   */
  registerGenerationPhases() {
    for (const [phaseNumber, config] of this.phaseGeneratorMap) {
      this.workflow.registerStep(`phase:${phaseNumber}:generate`, async (context) => {
        return this.executePhaseGeneration(phaseNumber, context);
      });
    }
    
    // Register generation-specific hooks
    this.workflow.registerHook('generation:before', this.beforeGeneration.bind(this));
    this.workflow.registerHook('generation:after', this.afterGeneration.bind(this));
  }

  /**
   * Execute code generation for a specific phase
   * @param {number} phaseNumber - The workflow phase number
   * @param {Object} context - The generation context
   * @returns {Promise<Object>} Generation result
   */
  async executePhaseGeneration(phaseNumber, context) {
    const config = this.phaseGeneratorMap.get(phaseNumber);
    if (!config) {
      throw new Error(`No generator configuration for phase ${phaseNumber}`);
    }

    // Check if generation is conditional
    if (config.conditional && !this.shouldGenerate(context, config)) {
      return { skipped: true, reason: 'Condition not met' };
    }

    // Determine which generator(s) to use
    let generatorNames;
    if (config.selector) {
      generatorNames = await config.selector(context);
      if (!Array.isArray(generatorNames)) {
        generatorNames = [generatorNames];
      }
    } else {
      generatorNames = config.generators;
    }

    // Execute generation
    const results = [];
    for (const generatorName of generatorNames) {
      const generator = this.generation.generators.get(generatorName);
      if (!generator) {
        console.warn(`Generator '${generatorName}' not found, skipping`);
        continue;
      }

      // Get agent mapping for context enrichment
      const agentConfig = this.generatorAgentMap.get(generatorName);
      const enrichedContext = {
        ...context,
        agent: agentConfig?.agent,
        skills: agentConfig?.skills || [],
        phase: phaseNumber,
        phaseName: config.name,
      };

      const result = await generator.generate(enrichedContext);
      results.push({
        generator: generatorName,
        agent: agentConfig?.agent,
        ...result,
      });
    }

    // Aggregate results
    return this.aggregateResults(results, config);
  }

  /**
   * Check if generation should proceed based on conditions
   * @param {Object} context - Generation context
   * @param {Object} config - Phase configuration
   * @returns {boolean} Whether to proceed with generation
   */
  shouldGenerate(context, config) {
    // Check for explicit skip flags
    if (context.skip?.includes(config.name?.toLowerCase())) {
      return false;
    }
    
    // Check tech stack requirements
    if (config.generators && context.tech) {
      const hasMatchingTech = config.generators.some(g => 
        context.tech.backend?.toLowerCase() === g ||
        context.tech.frontend?.toLowerCase() === g ||
        context.tech.database?.toLowerCase() === g
      );
      return hasMatchingTech;
    }
    
    return true;
  }

  /**
   * Select architecture generator based on context
   * @param {Object} context - Generation context
   * @returns {string} Selected generator name
   */
  selectArchitectureGenerator(context) {
    const architecture = context.architecture?.type?.toLowerCase();
    
    const mapping = {
      'microservices': 'microservices',
      'micro-services': 'microservices',
      'serverless': 'serverless',
      'functions': 'serverless',
      'event-driven': 'event-driven',
      'event': 'event-driven',
      'cqrs': 'event-driven',
    };
    
    return mapping[architecture] || 'microservices';
  }

  /**
   * Select backend generator based on context
   * @param {Object} context - Generation context
   * @returns {string} Selected generator name
   */
  selectBackendGenerator(context) {
    const backend = context.tech?.backend?.toLowerCase();
    
    const mapping = {
      'express': 'express',
      'expressjs': 'express',
      'express.js': 'express',
      'nestjs': 'nestjs',
      'nest': 'nestjs',
      'fastapi': 'fastapi',
      'fast-api': 'fastapi',
      'python': 'fastapi',
      'dotnet': 'dotnet',
      '.net': 'dotnet',
      'csharp': 'dotnet',
      'c#': 'dotnet',
      'asp.net': 'dotnet',
    };
    
    return mapping[backend] || 'express';
  }

  /**
   * Select frontend generator based on context
   * @param {Object} context - Generation context
   * @returns {string} Selected generator name
   */
  selectFrontendGenerator(context) {
    const frontend = context.tech?.frontend?.toLowerCase();
    
    const mapping = {
      'react': 'react',
      'reactjs': 'react',
      'react.js': 'react',
      'vue': 'vue',
      'vuejs': 'vue',
      'vue.js': 'vue',
      'nextjs': 'nextjs',
      'next': 'nextjs',
      'next.js': 'nextjs',
      'angular': 'angular',
      'vite': 'vite',
    };
    
    return mapping[frontend] || 'react';
  }

  /**
   * Select database generator based on context
   * @param {Object} context - Generation context
   * @returns {string} Selected generator name
   */
  selectDatabaseGenerator(context) {
    const database = context.tech?.database?.toLowerCase();
    
    const mapping = {
      'postgresql': 'postgresql',
      'postgres': 'postgresql',
      'pg': 'postgresql',
      'azuresql': 'azuresql',
      'azure-sql': 'azuresql',
      'azure sql': 'azuresql',
      'cosmosdb': 'cosmosdb',
      'cosmos': 'cosmosdb',
      'cosmos-db': 'cosmosdb',
      'sqlserver': 'sqlserver',
      'sql-server': 'sqlserver',
      'mssql': 'sqlserver',
    };
    
    return mapping[database] || 'postgresql';
  }

  /**
   * Select infrastructure generators based on context
   * @param {Object} context - Generation context
   * @returns {Array<string>} Selected generator names
   */
  selectInfrastructureGenerators(context) {
    const generators = ['bicep']; // Always include base Bicep
    
    const infra = context.infrastructure || {};
    
    if (infra.identity || infra.auth) {
      generators.push('entraid');
    }
    if (infra.secrets || infra.keyvault) {
      generators.push('keyvault');
    }
    if (infra.storage || infra.blobs || infra.files) {
      generators.push('storage');
    }
    if (infra.networking || infra.vnet || infra.privateEndpoints) {
      generators.push('networking');
    }
    if (infra.monitoring || infra.logging || infra.appInsights) {
      generators.push('monitoring');
    }
    if (infra.containers || infra.containerApps || infra.aca) {
      generators.push('containerapps');
    }
    
    return generators;
  }

  /**
   * Select security generators based on context
   * @param {Object} context - Generation context
   * @returns {Array<string>} Selected generator names
   */
  selectSecurityGenerators(context) {
    const generators = [];
    
    const security = context.security || {};
    
    if (security.identity || security.oauth || security.authentication) {
      generators.push('entraid');
    }
    if (security.secrets || security.certificates || security.encryption) {
      generators.push('keyvault');
    }
    
    return generators.length > 0 ? generators : ['entraid', 'keyvault'];
  }

  /**
   * Aggregate results from multiple generators
   * @param {Array<Object>} results - Array of generation results
   * @param {Object} config - Phase configuration
   * @returns {Object} Aggregated result
   */
  aggregateResults(results, config) {
    const aggregated = {
      phase: config.name,
      generators: results.map(r => r.generator),
      files: [],
      errors: [],
      warnings: [],
      metadata: {
        totalGenerators: results.length,
        successfulGenerators: 0,
        failedGenerators: 0,
      },
    };

    for (const result of results) {
      if (result.files) {
        aggregated.files.push(...result.files);
      }
      if (result.errors) {
        aggregated.errors.push(...result.errors.map(e => ({
          generator: result.generator,
          error: e,
        })));
        aggregated.metadata.failedGenerators++;
      } else {
        aggregated.metadata.successfulGenerators++;
      }
      if (result.warnings) {
        aggregated.warnings.push(...result.warnings);
      }
    }

    return aggregated;
  }

  /**
   * Hook called before generation starts
   * @param {Object} context - Generation context
   */
  async beforeGeneration(context) {
    // Log generation start
    console.log(`[WorkflowIntegration] Starting generation for project: ${context.projectName}`);
    
    // Initialize generation tracking
    context.generationStartTime = Date.now();
    context.generatedFiles = [];
    context.generationErrors = [];
  }

  /**
   * Hook called after generation completes
   * @param {Object} context - Generation context
   * @param {Object} result - Generation result
   */
  async afterGeneration(context, result) {
    const duration = Date.now() - context.generationStartTime;
    
    console.log(`[WorkflowIntegration] Generation complete in ${duration}ms`);
    console.log(`[WorkflowIntegration] Files generated: ${result.files?.length || 0}`);
    console.log(`[WorkflowIntegration] Errors: ${result.errors?.length || 0}`);
    
    // Store results in context for downstream phases
    context.generatedFiles = result.files || [];
    context.generationErrors = result.errors || [];
    context.generationDuration = duration;
  }

  /**
   * Get generation status for workflow
   * @param {Object} context - Generation context
   * @returns {Object} Generation status
   */
  getGenerationStatus(context) {
    return {
      filesGenerated: context.generatedFiles?.length || 0,
      errors: context.generationErrors?.length || 0,
      phases: this.getPhaseStatus(context),
      duration: context.generationDuration || 0,
    };
  }

  /**
   * Get status of each phase
   * @param {Object} context - Generation context
   * @returns {Object} Phase status map
   */
  getPhaseStatus(context) {
    const status = {};
    
    for (const [phaseNumber, config] of this.phaseGeneratorMap) {
      const phaseKey = `phase${phaseNumber}`;
      status[phaseKey] = {
        name: config.name,
        generators: config.generators,
        completed: context.completedPhases?.includes(phaseNumber) || false,
        filesGenerated: context.generatedFiles?.filter(f => 
          f.phase === phaseNumber
        ).length || 0,
      };
    }
    
    return status;
  }

  /**
   * Get generator info for a specific phase
   * @param {number} phaseNumber - The phase number
   * @returns {Object|null} Generator configuration or null
   */
  getPhaseGenerators(phaseNumber) {
    return this.phaseGeneratorMap.get(phaseNumber) || null;
  }

  /**
   * Get agent info for a specific generator
   * @param {string} generatorName - The generator name
   * @returns {Object|null} Agent configuration or null
   */
  getGeneratorAgent(generatorName) {
    return this.generatorAgentMap.get(generatorName) || null;
  }

  /**
   * Get all registered phases with generation capabilities
   * @returns {Array<Object>} Array of phase configurations
   */
  getAllPhases() {
    const phases = [];
    for (const [phaseNumber, config] of this.phaseGeneratorMap) {
      phases.push({
        phase: phaseNumber,
        ...config,
      });
    }
    return phases;
  }
}

module.exports = WorkflowIntegration;
