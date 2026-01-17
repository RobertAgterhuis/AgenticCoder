/**
 * Generators Index - Exports all code generators
 * 
 * This module provides a centralized export point for all
 * code generators in the AgenticCoder system.
 */

// Base
const BaseGenerator = require('./BaseGenerator');

// Frontend Generators
const ReactGenerator = require('./ReactGenerator');
const VueGenerator = require('./VueGenerator');
const NextJSGenerator = require('./NextJSGenerator');
const AngularGenerator = require('./AngularGenerator');
const ViteGenerator = require('./ViteGenerator');

// Backend Generators
const ExpressGenerator = require('./ExpressGenerator');
const NestJSGenerator = require('./NestJSGenerator');
const FastAPIGenerator = require('./FastAPIGenerator');
const DotNetGenerator = require('./DotNetGenerator');

// Database Generators
const PostgreSQLGenerator = require('./PostgreSQLGenerator');
const AzureSQLGenerator = require('./AzureSQLGenerator');
const CosmosDBGenerator = require('./CosmosDBGenerator');
const SQLServerGenerator = require('./SQLServerGenerator');

// Architecture Generators
const MicroservicesGenerator = require('./MicroservicesGenerator');
const ServerlessGenerator = require('./ServerlessGenerator');
const EventDrivenGenerator = require('./EventDrivenGenerator');

// Azure/Infrastructure Generators
const BicepGenerator = require('./BicepGenerator');
const EntraIDGenerator = require('./EntraIDGenerator');
const KeyVaultGenerator = require('./KeyVaultGenerator');
const StorageGenerator = require('./StorageGenerator');
const NetworkingGenerator = require('./NetworkingGenerator');
const MonitoringGenerator = require('./MonitoringGenerator');
const ContainerAppsGenerator = require('./ContainerAppsGenerator');

/**
 * Generator registry for easy lookup
 */
const GENERATORS = {
  // Frontend
  react: ReactGenerator,
  vue: VueGenerator,
  nextjs: NextJSGenerator,
  angular: AngularGenerator,
  vite: ViteGenerator,
  
  // Backend
  express: ExpressGenerator,
  nestjs: NestJSGenerator,
  fastapi: FastAPIGenerator,
  dotnet: DotNetGenerator,
  
  // Database
  postgresql: PostgreSQLGenerator,
  azuresql: AzureSQLGenerator,
  cosmosdb: CosmosDBGenerator,
  sqlserver: SQLServerGenerator,
  
  // Architecture
  microservices: MicroservicesGenerator,
  serverless: ServerlessGenerator,
  eventdriven: EventDrivenGenerator,
  
  // Azure/Infrastructure
  bicep: BicepGenerator,
  entraid: EntraIDGenerator,
  keyvault: KeyVaultGenerator,
  storage: StorageGenerator,
  networking: NetworkingGenerator,
  monitoring: MonitoringGenerator,
  containerapps: ContainerAppsGenerator,
};

/**
 * Create all generators with dependencies
 * @param {Object} templateRegistry - Template registry instance
 * @param {Object} promptComposer - Prompt composer instance
 * @returns {Object} Object containing all generator instances
 */
function createGenerators(templateRegistry, promptComposer) {
  return {
    // Frontend
    react: new ReactGenerator(templateRegistry, promptComposer),
    vue: new VueGenerator(templateRegistry, promptComposer),
    nextjs: new NextJSGenerator(templateRegistry, promptComposer),
    angular: new AngularGenerator(templateRegistry, promptComposer),
    vite: new ViteGenerator(templateRegistry, promptComposer),
    
    // Backend
    express: new ExpressGenerator(templateRegistry, promptComposer),
    nestjs: new NestJSGenerator(templateRegistry, promptComposer),
    fastapi: new FastAPIGenerator(templateRegistry, promptComposer),
    dotnet: new DotNetGenerator(templateRegistry, promptComposer),
    
    // Database
    postgresql: new PostgreSQLGenerator(templateRegistry, promptComposer),
    azuresql: new AzureSQLGenerator(templateRegistry, promptComposer),
    cosmosdb: new CosmosDBGenerator(templateRegistry, promptComposer),
    sqlserver: new SQLServerGenerator(templateRegistry, promptComposer),
    
    // Architecture
    microservices: new MicroservicesGenerator(templateRegistry, promptComposer),
    serverless: new ServerlessGenerator(templateRegistry, promptComposer),
    eventdriven: new EventDrivenGenerator(templateRegistry, promptComposer),
    
    // Azure/Infrastructure
    bicep: new BicepGenerator(templateRegistry, promptComposer),
    entraid: new EntraIDGenerator(templateRegistry, promptComposer),
    keyvault: new KeyVaultGenerator(templateRegistry, promptComposer),
    storage: new StorageGenerator(templateRegistry, promptComposer),
    networking: new NetworkingGenerator(templateRegistry, promptComposer),
    monitoring: new MonitoringGenerator(templateRegistry, promptComposer),
    containerapps: new ContainerAppsGenerator(templateRegistry, promptComposer),
  };
}

/**
 * Get generators that support a given tech stack
 * @param {Object} techStack - Technology stack configuration
 * @param {Object} templateRegistry - Template registry instance
 * @param {Object} promptComposer - Prompt composer instance
 * @returns {Array} Array of matching generator instances
 */
function getMatchingGenerators(techStack, templateRegistry, promptComposer) {
  const generators = createGenerators(templateRegistry, promptComposer);
  
  return Object.values(generators)
    .filter(gen => gen.supports(techStack))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get a specific generator by name
 * @param {string} name - Generator name
 * @param {Object} templateRegistry - Template registry instance
 * @param {Object} promptComposer - Prompt composer instance
 * @returns {BaseGenerator|null} Generator instance or null
 */
function getGenerator(name, templateRegistry, promptComposer) {
  const GeneratorClass = GENERATORS[name.toLowerCase()];
  if (!GeneratorClass) return null;
  return new GeneratorClass(templateRegistry, promptComposer);
}

/**
 * List all available generators
 * @returns {Array} Array of generator names
 */
function listGenerators() {
  return Object.keys(GENERATORS);
}

module.exports = {
  // Base
  BaseGenerator,
  
  // Frontend Generators
  ReactGenerator,
  VueGenerator,
  NextJSGenerator,
  AngularGenerator,
  ViteGenerator,
  
  // Backend Generators
  ExpressGenerator,
  NestJSGenerator,
  FastAPIGenerator,
  DotNetGenerator,
  
  // Database Generators
  PostgreSQLGenerator,
  AzureSQLGenerator,
  CosmosDBGenerator,
  SQLServerGenerator,
  
  // Architecture Generators
  MicroservicesGenerator,
  ServerlessGenerator,
  EventDrivenGenerator,
  
  // Azure/Infrastructure Generators
  BicepGenerator,
  EntraIDGenerator,
  KeyVaultGenerator,
  StorageGenerator,
  NetworkingGenerator,
  MonitoringGenerator,
  ContainerAppsGenerator,
  
  // Factory functions
  createGenerators,
  getMatchingGenerators,
  getGenerator,
  listGenerators,
  
  // Registry
  GENERATORS,
};
