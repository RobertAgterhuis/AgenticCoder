/**
 * Code Generation Engine - Module Exports
 * 
 * Main entry point for the code generation subsystem.
 */

const CodeGenerationEngine = require('./CodeGenerationEngine');
const FileWriter = require('./FileWriter');
const ProjectScaffolder = require('./ProjectScaffolder');
const GenerationContext = require('./GenerationContext');
const BaseGenerator = require('./generators/BaseGenerator');
const scenarioStructures = require('./structures/scenario-structures');

module.exports = {
  // Main engine
  CodeGenerationEngine,
  
  // Core components
  FileWriter,
  ProjectScaffolder,
  GenerationContext,
  
  // Generator base
  BaseGenerator,
  
  // Structure definitions
  scenarioStructures,
  
  // Convenience exports from structures
  getStructure: scenarioStructures.getStructure,
  getAllStructures: scenarioStructures.getAllStructures,
  listScenarios: scenarioStructures.listScenarios,
  
  // Factory function for quick setup
  createEngine: (options = {}) => {
    return new CodeGenerationEngine(options);
  }
};
