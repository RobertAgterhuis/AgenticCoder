/**
 * ProjectScaffolder - Creates project directory structures
 * 
 * Supports all 5 business scenarios (S01-S05) with appropriate
 * directory structures based on architecture and tech stack.
 */

const path = require('path');

class ProjectScaffolder {
  /**
   * @param {import('./FileWriter')} fileWriter - FileWriter instance
   */
  constructor(fileWriter) {
    this.fileWriter = fileWriter;
    
    // Base structure common to all scenarios
    this.baseStructure = {
      docs: {
        files: ['README.md', 'ARCHITECTURE.md', 'CHANGELOG.md']
      },
      '.github': {
        workflows: {},
        ISSUE_TEMPLATE: {},
        PULL_REQUEST_TEMPLATE: {}
      }
    };
  }

  /**
   * Scaffold a project based on scenario and tech stack
   * @param {import('./GenerationContext')} context - Generation context
   * @returns {Promise<Object>} Created structure info
   */
  async scaffold(context) {
    const { scenario, techStack, projectName } = context;
    
    // Get scenario-specific structure
    const structure = this.getStructure(scenario, techStack);
    
    // Create directories and placeholder files
    const created = await this.createStructure('', structure, context);
    
    return {
      projectName,
      scenario,
      directories: created.directories,
      files: created.files
    };
  }

  /**
   * Get structure definition for a scenario
   * @param {string} scenario - Scenario ID (S01-S05)
   * @param {Object} techStack - Technology stack
   * @returns {Object}
   */
  getStructure(scenario, techStack) {
    const structures = {
      'S01': this.getS01Structure(techStack), // Startup MVP
      'S02': this.getS02Structure(techStack), // SMB Operations
      'S03': this.getS03Structure(techStack), // Enterprise Platform
      'S04': this.getS04Structure(techStack), // E-commerce
      'S05': this.getS05Structure(techStack)  // SaaS Product
    };
    
    return {
      ...this.baseStructure,
      ...(structures[scenario] || structures['S01'])
    };
  }

  /**
   * S01: Startup MVP - Simple, lean structure
   */
  getS01Structure(techStack) {
    return {
      frontend: {
        src: {
          components: {},
          pages: {},
          hooks: {},
          services: {},
          styles: {},
          utils: {}
        },
        public: {}
      },
      backend: {
        src: {
          controllers: {},
          models: {},
          routes: {},
          services: {},
          middleware: {},
          utils: {}
        },
        tests: {}
      },
      infrastructure: {
        docker: {},
        scripts: {}
      }
    };
  }

  /**
   * S02: SMB Operations - Business process focused
   */
  getS02Structure(techStack) {
    return {
      frontend: {
        src: {
          components: {
            common: {},
            forms: {},
            reports: {},
            dashboard: {}
          },
          pages: {},
          hooks: {},
          services: {},
          store: {},
          utils: {}
        },
        public: {}
      },
      backend: {
        src: {
          api: {},
          controllers: {},
          models: {},
          services: {
            business: {},
            integration: {}
          },
          middleware: {},
          utils: {},
          validators: {}
        },
        tests: {
          unit: {},
          integration: {}
        }
      },
      infrastructure: {
        docker: {},
        terraform: {},
        scripts: {}
      },
      shared: {
        types: {},
        constants: {}
      }
    };
  }

  /**
   * S03: Enterprise Platform - Full microservices structure
   */
  getS03Structure(techStack) {
    return {
      services: {
        'api-gateway': {
          src: {},
          tests: {}
        },
        'user-service': {
          src: {
            controllers: {},
            models: {},
            services: {},
            events: {}
          },
          tests: {}
        },
        'order-service': {
          src: {
            controllers: {},
            models: {},
            services: {},
            events: {}
          },
          tests: {}
        },
        'notification-service': {
          src: {},
          tests: {}
        }
      },
      frontend: {
        src: {
          components: {},
          pages: {},
          modules: {},
          services: {},
          store: {}
        }
      },
      infrastructure: {
        kubernetes: {
          base: {},
          overlays: {
            dev: {},
            staging: {},
            prod: {}
          }
        },
        terraform: {
          modules: {},
          environments: {}
        },
        helm: {}
      },
      shared: {
        'proto-definitions': {},
        'event-schemas': {},
        types: {}
      },
      tools: {
        scripts: {},
        generators: {}
      }
    };
  }

  /**
   * S04: E-commerce Platform - Product and order focused
   */
  getS04Structure(techStack) {
    return {
      frontend: {
        src: {
          components: {
            product: {},
            cart: {},
            checkout: {},
            account: {},
            common: {}
          },
          pages: {},
          hooks: {},
          services: {},
          store: {
            slices: {}
          },
          utils: {}
        },
        public: {
          images: {},
          icons: {}
        }
      },
      backend: {
        src: {
          api: {
            v1: {}
          },
          controllers: {},
          models: {},
          services: {
            catalog: {},
            cart: {},
            order: {},
            payment: {},
            shipping: {},
            search: {}
          },
          middleware: {},
          utils: {},
          jobs: {}
        },
        tests: {
          unit: {},
          integration: {},
          e2e: {}
        }
      },
      admin: {
        src: {
          components: {},
          pages: {},
          services: {}
        }
      },
      infrastructure: {
        docker: {},
        terraform: {},
        scripts: {}
      },
      shared: {
        types: {},
        constants: {}
      }
    };
  }

  /**
   * S05: SaaS Product - Multi-tenant, subscription focused
   */
  getS05Structure(techStack) {
    return {
      apps: {
        web: {
          src: {
            components: {},
            pages: {},
            features: {},
            hooks: {},
            services: {},
            store: {}
          }
        },
        mobile: {
          src: {}
        },
        admin: {
          src: {}
        }
      },
      packages: {
        'ui-kit': {
          src: {
            components: {},
            themes: {}
          }
        },
        'api-client': {
          src: {}
        },
        utils: {
          src: {}
        }
      },
      backend: {
        src: {
          api: {},
          controllers: {},
          models: {},
          services: {
            tenant: {},
            subscription: {},
            billing: {},
            analytics: {}
          },
          middleware: {
            tenant: {},
            auth: {}
          },
          utils: {}
        },
        tests: {}
      },
      infrastructure: {
        terraform: {
          modules: {},
          environments: {}
        },
        kubernetes: {},
        scripts: {}
      },
      shared: {
        types: {},
        'tenant-config': {}
      }
    };
  }

  /**
   * Recursively create directory structure
   * @param {string} basePath - Current base path
   * @param {Object} structure - Structure definition
   * @param {import('./GenerationContext')} context - Generation context
   * @returns {Promise<Object>}
   */
  async createStructure(basePath, structure, context) {
    const result = { directories: [], files: [] };
    
    for (const [name, content] of Object.entries(structure)) {
      const currentPath = path.join(basePath, name);
      
      if (content.files) {
        // Directory with files
        await this.fileWriter.ensureDirectory(currentPath);
        result.directories.push(currentPath);
        
        for (const file of content.files) {
          const filePath = path.join(currentPath, file);
          const fileContent = this.getPlaceholderContent(file, context);
          await this.fileWriter.writeFile(filePath, fileContent);
          result.files.push(filePath);
          context.addGeneratedFile({
            path: filePath,
            type: 'placeholder',
            generator: 'ProjectScaffolder',
            size: fileContent.length
          });
        }
        
        // Process nested structure (excluding 'files' key)
        const nestedStructure = { ...content };
        delete nestedStructure.files;
        if (Object.keys(nestedStructure).length > 0) {
          const nested = await this.createStructure(currentPath, nestedStructure, context);
          result.directories.push(...nested.directories);
          result.files.push(...nested.files);
        }
      } else if (typeof content === 'object') {
        // Directory with subdirectories
        await this.fileWriter.ensureDirectory(currentPath);
        result.directories.push(currentPath);
        
        // Add .gitkeep to empty directories
        if (Object.keys(content).length === 0) {
          const gitkeepPath = path.join(currentPath, '.gitkeep');
          await this.fileWriter.writeFile(gitkeepPath, '');
          result.files.push(gitkeepPath);
        } else {
          const nested = await this.createStructure(currentPath, content, context);
          result.directories.push(...nested.directories);
          result.files.push(...nested.files);
        }
      }
    }
    
    return result;
  }

  /**
   * Get placeholder content for common files
   * @param {string} filename - File name
   * @param {import('./GenerationContext')} context - Generation context
   * @returns {string}
   */
  getPlaceholderContent(filename, context) {
    const templates = {
      'README.md': `# ${context.projectName}

> Generated by AgenticCoder

## Overview

Project generated for scenario: ${context.scenario}

## Getting Started

Instructions coming soon...

## Documentation

See the \`docs/\` directory for detailed documentation.

## License

[License information]
`,
      'ARCHITECTURE.md': `# Architecture

## Overview

This document describes the architecture for ${context.projectName}.

## Tech Stack

${JSON.stringify(context.techStack, null, 2)}

## Structure

- See individual component READMEs for details
`,
      'CHANGELOG.md': `# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial project structure
`
    };
    
    return templates[filename] || `# ${filename}\n\nPlaceholder file.\n`;
  }

  /**
   * Get available scenario IDs
   * @returns {string[]}
   */
  static getScenarios() {
    return ['S01', 'S02', 'S03', 'S04', 'S05'];
  }

  /**
   * Get scenario description
   * @param {string} scenario - Scenario ID
   * @returns {string}
   */
  static getScenarioDescription(scenario) {
    const descriptions = {
      'S01': 'Startup MVP - Lean structure for rapid development',
      'S02': 'SMB Operations - Business process focused application',
      'S03': 'Enterprise Platform - Full microservices architecture',
      'S04': 'E-commerce Platform - Product and order management',
      'S05': 'SaaS Product - Multi-tenant subscription service'
    };
    return descriptions[scenario] || 'Unknown scenario';
  }
}

module.exports = ProjectScaffolder;
