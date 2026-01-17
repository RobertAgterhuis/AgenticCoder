/**
 * PromptComposer - Builds effective prompts for LLM-based code generation
 * 
 * Combines context, requirements, skills, and best practices
 * to create well-structured prompts for different generation tasks.
 */

class PromptComposer {
  /**
   * @param {Object} options - Composer options
   * @param {Object} options.skillsRegistry - Registry of coding skills/best practices
   */
  constructor(options = {}) {
    this.skillsRegistry = options.skillsRegistry || null;
    this.systemPrompts = new Map();
    this.taskPrompts = new Map();
    
    // Initialize default prompts
    this.initializeDefaultPrompts();
  }

  /**
   * Initialize default system and task prompts
   */
  initializeDefaultPrompts() {
    // Framework system prompts
    this.systemPrompts.set('react', `You are an expert React developer with deep knowledge of:
- React 18+ with hooks and functional components
- TypeScript for type safety
- Modern state management (Context, Zustand, Redux Toolkit)
- React Router for navigation
- Performance optimization (memo, useMemo, useCallback)
- Testing with React Testing Library

Follow these principles:
- Use functional components exclusively
- Implement proper TypeScript interfaces for all props
- Use custom hooks for reusable logic
- Follow the single responsibility principle
- Implement proper error boundaries
- Use CSS modules or styled-components for styling`);

    this.systemPrompts.set('express', `You are an expert Node.js/Express developer with deep knowledge of:
- Express 4.x with TypeScript
- RESTful API design principles
- Middleware patterns and error handling
- Authentication and authorization (JWT, OAuth)
- Database integration (Prisma, TypeORM)
- Input validation (Zod, Joi)

Follow these principles:
- Use async/await for all asynchronous code
- Implement proper error handling middleware
- Validate all inputs
- Use dependency injection patterns
- Follow the repository/service pattern
- Implement proper logging`);

    this.systemPrompts.set('bicep', `You are an expert Azure infrastructure engineer with deep knowledge of:
- Azure Bicep language and best practices
- Azure Verified Modules (AVM)
- Azure resource types and their configurations
- Security best practices (managed identities, private endpoints)
- Network architecture patterns
- Cost optimization strategies

Follow these principles:
- Use Azure Verified Modules when available
- Implement proper parameter validation with decorators
- Use descriptive names for resources and parameters
- Output all necessary connection information
- Follow least-privilege principle for RBAC
- Implement proper tagging strategy`);

    this.systemPrompts.set('postgresql', `You are an expert database engineer with deep knowledge of:
- PostgreSQL database design and optimization
- Prisma ORM and migrations
- Data modeling best practices
- Indexing strategies
- Query optimization
- Data integrity constraints

Follow these principles:
- Use appropriate data types
- Implement proper foreign key relationships
- Add indexes for frequently queried columns
- Use meaningful table and column names
- Implement soft delete where appropriate
- Add audit timestamps (createdAt, updatedAt)`);

    // Task-specific prompts
    this.taskPrompts.set('component', `Generate a React component that:
- Uses TypeScript with proper interface definitions
- Implements the specified functionality
- Handles loading and error states appropriately
- Is properly documented with JSDoc comments
- Follows accessibility best practices`);

    this.taskPrompts.set('page', `Generate a React page component that:
- Uses React Router hooks for navigation
- Fetches data if required
- Handles loading, error, and empty states
- Is responsive and accessible
- Includes proper page title and meta`);

    this.taskPrompts.set('service', `Generate an API service that:
- Uses TypeScript with proper types
- Implements proper error handling
- Supports request cancellation
- Has retry logic for transient failures
- Is testable with dependency injection`);

    this.taskPrompts.set('controller', `Generate an Express controller that:
- Handles all HTTP methods appropriately
- Validates request inputs
- Returns proper HTTP status codes
- Implements proper error handling
- Is documented with JSDoc`);

    this.taskPrompts.set('model', `Generate a database model that:
- Has proper TypeScript types
- Includes validation rules
- Implements relationships correctly
- Has appropriate indexes
- Includes timestamps and soft delete if appropriate`);

    this.taskPrompts.set('migration', `Generate a database migration that:
- Creates the required schema changes
- Is reversible (includes down migration)
- Handles existing data appropriately
- Is idempotent where possible`);

    this.taskPrompts.set('bicep-module', `Generate a Bicep module that:
- Has proper parameter validation with decorators
- Uses secure parameter handling for secrets
- Implements proper resource naming
- Outputs all necessary values for dependent resources
- Follows Azure Well-Architected Framework principles`);
  }

  /**
   * Compose a complete prompt for code generation
   * @param {Object} options - Prompt options
   * @returns {Object} { system: string, user: string }
   */
  composeCodePrompt(options) {
    const {
      task,           // 'component', 'service', 'model', etc.
      framework,      // 'react', 'express', etc.
      requirements,   // Feature requirements
      context,        // Existing code context
      constraints,    // Coding standards, patterns
      outputFormat    // 'code-only', 'with-explanation'
    } = options;

    const system = this.buildSystemPrompt(framework, task);
    const user = this.buildUserPrompt({
      task,
      framework,
      requirements,
      context,
      constraints,
      outputFormat
    });

    return { system, user };
  }

  /**
   * Build system prompt with framework knowledge
   * @param {string} framework - Framework name
   * @param {string} task - Task type
   * @returns {string}
   */
  buildSystemPrompt(framework, task) {
    let prompt = this.systemPrompts.get(framework) || this.getGenericSystemPrompt();

    // Add skills if registry available
    if (this.skillsRegistry) {
      const skills = this.getRelevantSkills(framework, task);
      if (skills.length > 0) {
        prompt += '\n\nAdditional Best Practices:\n' + skills.join('\n');
      }
    }

    return prompt;
  }

  /**
   * Build user prompt with requirements and context
   * @param {Object} options - Prompt options
   * @returns {string}
   */
  buildUserPrompt(options) {
    const { task, framework, requirements, context, constraints, outputFormat } = options;
    
    let prompt = '';

    // Add context section
    if (context) {
      prompt += this.formatContext(context);
    }

    // Add requirements section
    prompt += this.formatRequirements(requirements);

    // Add task description
    const taskPrompt = this.taskPrompts.get(task) || '';
    prompt += '\n## Task\n' + taskPrompt;

    // Add constraints
    if (constraints) {
      prompt += '\n\n## Constraints\n' + this.formatConstraints(constraints);
    }

    // Add output format instructions
    prompt += this.getOutputFormatInstructions(outputFormat || 'code-only');

    return prompt;
  }

  /**
   * Format context information
   * @param {Object} context - Context object
   * @returns {string}
   */
  formatContext(context) {
    let formatted = '## Context\n\n';

    if (context.projectName) {
      formatted += `Project: ${context.projectName}\n`;
    }

    if (context.scenario) {
      formatted += `Scenario: ${context.scenario}\n`;
    }

    if (context.existingFiles && context.existingFiles.length > 0) {
      formatted += '\nExisting Files:\n';
      context.existingFiles.forEach(file => {
        formatted += `- ${file.path}\n`;
        if (file.exports) {
          formatted += `  Exports: ${file.exports.join(', ')}\n`;
        }
      });
    }

    if (context.imports) {
      formatted += '\nAvailable Imports:\n';
      formatted += context.imports.map(i => `- ${i}`).join('\n');
    }

    return formatted + '\n';
  }

  /**
   * Format requirements
   * @param {Object|string} requirements - Requirements
   * @returns {string}
   */
  formatRequirements(requirements) {
    if (typeof requirements === 'string') {
      return '## Requirements\n\n' + requirements + '\n';
    }

    let formatted = '## Requirements\n\n';

    if (requirements.name) {
      formatted += `Name: ${requirements.name}\n`;
    }

    if (requirements.description) {
      formatted += `Description: ${requirements.description}\n`;
    }

    if (requirements.features && requirements.features.length > 0) {
      formatted += '\nFeatures:\n';
      requirements.features.forEach(f => {
        formatted += `- ${f}\n`;
      });
    }

    if (requirements.props && requirements.props.length > 0) {
      formatted += '\nProps:\n';
      requirements.props.forEach(p => {
        formatted += `- ${p.name}: ${p.type}${p.required ? ' (required)' : ''}\n`;
        if (p.description) {
          formatted += `  ${p.description}\n`;
        }
      });
    }

    if (requirements.methods && requirements.methods.length > 0) {
      formatted += '\nMethods:\n';
      requirements.methods.forEach(m => {
        formatted += `- ${m.name}(${m.params || ''}): ${m.returns || 'void'}\n`;
        if (m.description) {
          formatted += `  ${m.description}\n`;
        }
      });
    }

    if (requirements.endpoints && requirements.endpoints.length > 0) {
      formatted += '\nEndpoints:\n';
      requirements.endpoints.forEach(e => {
        formatted += `- ${e.method} ${e.path}: ${e.description}\n`;
      });
    }

    if (requirements.fields && requirements.fields.length > 0) {
      formatted += '\nFields:\n';
      requirements.fields.forEach(f => {
        formatted += `- ${f.name}: ${f.type}${f.required ? ' (required)' : ''}\n`;
      });
    }

    return formatted;
  }

  /**
   * Format constraints
   * @param {Object|string} constraints - Constraints
   * @returns {string}
   */
  formatConstraints(constraints) {
    if (typeof constraints === 'string') {
      return constraints;
    }

    let formatted = '';

    if (constraints.patterns) {
      formatted += 'Patterns to follow:\n';
      constraints.patterns.forEach(p => {
        formatted += `- ${p}\n`;
      });
    }

    if (constraints.avoid) {
      formatted += '\nPatterns to avoid:\n';
      constraints.avoid.forEach(a => {
        formatted += `- ${a}\n`;
      });
    }

    if (constraints.dependencies) {
      formatted += '\nAllowed dependencies:\n';
      constraints.dependencies.forEach(d => {
        formatted += `- ${d}\n`;
      });
    }

    return formatted;
  }

  /**
   * Get output format instructions
   * @param {string} format - Output format type
   * @returns {string}
   */
  getOutputFormatInstructions(format) {
    const formats = {
      'code-only': `

## Output Format
Return ONLY the code, no explanations or markdown code blocks.
Use TypeScript where applicable.`,

      'with-explanation': `

## Output Format
First provide a brief explanation of the implementation approach.
Then provide the complete code.
Use TypeScript where applicable.`,

      'json': `

## Output Format
Return the response as valid JSON with the following structure:
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "file content here"
    }
  ],
  "explanation": "brief explanation"
}`
    };

    return formats[format] || formats['code-only'];
  }

  /**
   * Get generic system prompt
   * @returns {string}
   */
  getGenericSystemPrompt() {
    return `You are an expert software developer with broad knowledge across multiple frameworks and languages.

Follow these general principles:
- Write clean, maintainable code
- Use meaningful variable and function names
- Implement proper error handling
- Add documentation where appropriate
- Follow SOLID principles
- Consider security best practices`;
  }

  /**
   * Get relevant skills from registry
   * @param {string} framework - Framework name
   * @param {string} task - Task type
   * @returns {string[]}
   */
  getRelevantSkills(framework, task) {
    if (!this.skillsRegistry) {
      return [];
    }

    // This would integrate with the actual skills registry
    // For now, return empty array
    return [];
  }

  /**
   * Register a custom system prompt
   * @param {string} framework - Framework name
   * @param {string} prompt - System prompt
   */
  registerSystemPrompt(framework, prompt) {
    this.systemPrompts.set(framework, prompt);
  }

  /**
   * Register a custom task prompt
   * @param {string} task - Task name
   * @param {string} prompt - Task prompt
   */
  registerTaskPrompt(task, prompt) {
    this.taskPrompts.set(task, prompt);
  }

  /**
   * Get available frameworks
   * @returns {string[]}
   */
  getAvailableFrameworks() {
    return Array.from(this.systemPrompts.keys());
  }

  /**
   * Get available tasks
   * @returns {string[]}
   */
  getAvailableTasks() {
    return Array.from(this.taskPrompts.keys());
  }
}

module.exports = PromptComposer;
