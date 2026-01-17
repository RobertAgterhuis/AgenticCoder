/**
 * SkillIntegration.js
 * 
 * Enables skills to be loaded and applied during code generation.
 * Parses .skill.md files and injects skill context into generation prompts.
 * 
 * @module agents/core/generation/SkillIntegration
 */

const fs = require('fs').promises;
const path = require('path');

class SkillIntegration {
  /**
   * Create a Skill Integration
   * @param {string} skillsPath - Path to the skills directory
   */
  constructor(skillsPath) {
    this.skillsPath = skillsPath;
    this.skills = new Map();
    this.skillCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Load skill from .skill.md file
   * @param {string} skillName - Name of the skill to load
   * @returns {Promise<Object>} Parsed skill object
   */
  async loadSkill(skillName) {
    // Check cache
    const cached = this.skillCache.get(skillName);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.skill;
    }

    // Try multiple possible paths
    const possiblePaths = [
      path.join(this.skillsPath, `${skillName}.skill.md`),
      path.join(this.skillsPath, skillName, `${skillName}.skill.md`),
      path.join(this.skillsPath, skillName, 'skill.md'),
      path.join(this.skillsPath, `${skillName}.md`),
    ];

    let content = null;
    let foundPath = null;

    for (const skillPath of possiblePaths) {
      try {
        content = await fs.readFile(skillPath, 'utf-8');
        foundPath = skillPath;
        break;
      } catch (error) {
        // Try next path
      }
    }

    if (!content) {
      throw new Error(`Skill '${skillName}' not found in ${this.skillsPath}`);
    }

    const skill = this.parseSkill(content, skillName);
    skill.path = foundPath;
    
    // Cache the skill
    this.skillCache.set(skillName, {
      skill,
      timestamp: Date.now(),
    });
    
    this.skills.set(skillName, skill);
    return skill;
  }

  /**
   * Parse skill markdown into structured data
   * @param {string} content - Raw markdown content
   * @param {string} skillName - Name of the skill
   * @returns {Object} Parsed skill object
   */
  parseSkill(content, skillName) {
    const skill = {
      name: skillName,
      purpose: '',
      description: '',
      patterns: [],
      bestPractices: [],
      antiPatterns: [],
      codeExamples: [],
      references: [],
      tags: [],
      applicableTo: [],
    };

    // Extract title/name from first H1
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      skill.title = titleMatch[1].trim();
    }

    // Extract sections
    skill.purpose = this.extractSection(content, 'Purpose') || 
                    this.extractSection(content, 'Overview') || '';
    skill.description = this.extractSection(content, 'Description') || skill.purpose;
    skill.patterns = this.extractListSection(content, 'Patterns') ||
                     this.extractListSection(content, 'Design Patterns') || [];
    skill.bestPractices = this.extractListSection(content, 'Best Practices') ||
                          this.extractListSection(content, 'Guidelines') || [];
    skill.antiPatterns = this.extractListSection(content, 'Anti-Patterns') ||
                         this.extractListSection(content, 'Avoid') ||
                         this.extractListSection(content, 'Common Mistakes') || [];
    skill.codeExamples = this.extractCodeBlocks(content);
    skill.references = this.extractListSection(content, 'References') ||
                       this.extractListSection(content, 'Resources') || [];
    skill.tags = this.extractTags(content);
    skill.applicableTo = this.extractListSection(content, 'Applicable To') ||
                         this.extractListSection(content, 'Use Cases') || [];

    return skill;
  }

  /**
   * Extract a section from markdown content
   * @param {string} content - Markdown content
   * @param {string} sectionName - Name of section to extract
   * @returns {string|null} Section content or null
   */
  extractSection(content, sectionName) {
    // Match ## Section Name or ### Section Name
    const regex = new RegExp(
      `^#{2,3}\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=^#{2,3}\\s|$)`,
      'mi'
    );
    const match = content.match(regex);
    
    if (match) {
      return match[1].trim();
    }
    return null;
  }

  /**
   * Extract a list section from markdown content
   * @param {string} content - Markdown content
   * @param {string} sectionName - Name of section to extract
   * @returns {Array<string>} Array of list items
   */
  extractListSection(content, sectionName) {
    const section = this.extractSection(content, sectionName);
    if (!section) return [];

    const items = [];
    const lines = section.split('\n');
    
    for (const line of lines) {
      // Match list items (-, *, or numbered)
      const listMatch = line.match(/^[\s]*[-*]\s+(.+)$/) ||
                        line.match(/^[\s]*\d+\.\s+(.+)$/);
      if (listMatch) {
        items.push(listMatch[1].trim());
      }
    }
    
    return items;
  }

  /**
   * Extract code blocks from markdown content
   * @param {string} content - Markdown content
   * @returns {Array<Object>} Array of code block objects
   */
  extractCodeBlocks(content) {
    const codeBlocks = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
      });
    }
    
    return codeBlocks;
  }

  /**
   * Extract tags from markdown content
   * @param {string} content - Markdown content
   * @returns {Array<string>} Array of tags
   */
  extractTags(content) {
    const tags = [];
    
    // Look for Tags: section or inline tags
    const tagsSection = this.extractSection(content, 'Tags');
    if (tagsSection) {
      const tagMatches = tagsSection.match(/`([^`]+)`/g);
      if (tagMatches) {
        tags.push(...tagMatches.map(t => t.replace(/`/g, '')));
      }
    }
    
    // Look for YAML frontmatter tags
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const tagsMatch = frontmatterMatch[1].match(/tags:\s*\[(.*?)\]/);
      if (tagsMatch) {
        tags.push(...tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '')));
      }
    }
    
    return [...new Set(tags)]; // Deduplicate
  }

  /**
   * Get relevant skills for a framework/task combination
   * @param {string} framework - The framework name
   * @param {string} task - The task type (optional)
   * @returns {Promise<Array<Object>>} Array of loaded skills
   */
  async getSkillsForContext(framework, task = null) {
    const skillMap = {
      // Frontend frameworks
      react: ['react-patterns', 'state-management', 'error-handling', 'testing-patterns'],
      vue: ['vue-patterns', 'state-management', 'error-handling'],
      nextjs: ['nextjs-patterns', 'react-patterns', 'ssr-patterns'],
      angular: ['angular-patterns', 'rxjs-patterns', 'testing-patterns'],
      
      // Backend frameworks
      express: ['express-patterns', 'error-handling', 'api-design', 'security-patterns'],
      nestjs: ['nestjs-patterns', 'dependency-injection', 'api-design'],
      fastapi: ['fastapi-patterns', 'python-patterns', 'api-design'],
      dotnet: ['dotnet-webapi', 'dotnet-patterns', 'entity-framework'],
      
      // Database
      postgresql: ['sql-schema-design', 'database-design', 'migration-patterns'],
      azuresql: ['azure-sql-patterns', 'tsql-programming', 'database-design'],
      cosmosdb: ['cosmos-db-patterns', 'nosql-patterns'],
      sqlserver: ['sql-schema-design', 'tsql-programming'],
      
      // Architecture
      microservices: ['microservices-patterns', 'api-gateway', 'service-mesh'],
      serverless: ['serverless-patterns', 'azure-functions', 'event-driven'],
      'event-driven': ['event-driven-patterns', 'message-queues', 'cqrs'],
      
      // Azure Infrastructure
      bicep: ['azure-bicep-mastery', 'infrastructure-automation', 'azure-best-practices'],
      entraid: ['entra-id-patterns', 'oauth-patterns', 'security-patterns'],
      keyvault: ['keyvault-patterns', 'secrets-management', 'security-patterns'],
      storage: ['azure-storage-patterns', 'blob-patterns'],
      networking: ['azure-networking-patterns', 'security-patterns'],
      monitoring: ['azure-monitoring-patterns', 'observability'],
      containerapps: ['container-apps-patterns', 'container-patterns'],
    };
    
    const skillNames = skillMap[framework?.toLowerCase()] || [];
    
    // Add task-specific skills
    if (task) {
      const taskSkills = {
        testing: ['testing-patterns', 'unit-testing', 'integration-testing'],
        security: ['security-patterns', 'oauth-patterns', 'secrets-management'],
        performance: ['performance-patterns', 'caching-patterns', 'optimization'],
        deployment: ['deployment-patterns', 'ci-cd', 'infrastructure-automation'],
      };
      
      const additionalSkills = taskSkills[task?.toLowerCase()] || [];
      skillNames.push(...additionalSkills);
    }
    
    // Load all skills (with error handling for missing skills)
    const loadedSkills = [];
    for (const skillName of [...new Set(skillNames)]) {
      try {
        const skill = await this.loadSkill(skillName);
        loadedSkills.push(skill);
      } catch (error) {
        console.warn(`Skill '${skillName}' not found: ${error.message}`);
      }
    }
    
    return loadedSkills;
  }

  /**
   * Format skills for prompt injection
   * @param {Array<Object>} skills - Array of skill objects
   * @param {Object} options - Formatting options
   * @returns {string} Formatted skills text
   */
  formatSkillsForPrompt(skills, options = {}) {
    if (!skills || skills.length === 0) {
      return '';
    }

    const { 
      includeExamples = true, 
      maxExamples = 2,
      compact = false 
    } = options;

    const sections = [];

    for (const skill of skills) {
      const skillSection = [];
      
      skillSection.push(`## ${skill.title || skill.name}`);
      
      if (skill.purpose && !compact) {
        skillSection.push(`\n${skill.purpose}`);
      }

      if (skill.bestPractices && skill.bestPractices.length > 0) {
        skillSection.push('\n### Best Practices:');
        for (const practice of skill.bestPractices.slice(0, compact ? 5 : 10)) {
          skillSection.push(`- ${practice}`);
        }
      }

      if (skill.patterns && skill.patterns.length > 0) {
        skillSection.push('\n### Patterns to Follow:');
        for (const pattern of skill.patterns.slice(0, compact ? 3 : 5)) {
          skillSection.push(`- ${pattern}`);
        }
      }

      if (skill.antiPatterns && skill.antiPatterns.length > 0) {
        skillSection.push('\n### Anti-Patterns to Avoid:');
        for (const antiPattern of skill.antiPatterns.slice(0, compact ? 3 : 5)) {
          skillSection.push(`- ${antiPattern}`);
        }
      }

      if (includeExamples && skill.codeExamples && skill.codeExamples.length > 0) {
        skillSection.push('\n### Code Examples:');
        for (const example of skill.codeExamples.slice(0, maxExamples)) {
          skillSection.push(`\n\`\`\`${example.language}`);
          skillSection.push(example.code);
          skillSection.push('```');
        }
      }

      sections.push(skillSection.join('\n'));
    }

    return sections.join('\n\n---\n\n');
  }

  /**
   * Get skill by name (from cache if available)
   * @param {string} skillName - Name of the skill
   * @returns {Object|null} Skill object or null
   */
  getSkill(skillName) {
    return this.skills.get(skillName) || null;
  }

  /**
   * List all loaded skills
   * @returns {Array<string>} Array of skill names
   */
  listLoadedSkills() {
    return Array.from(this.skills.keys());
  }

  /**
   * Clear skill cache
   */
  clearCache() {
    this.skillCache.clear();
  }

  /**
   * Preload common skills
   * @param {Array<string>} skillNames - Array of skill names to preload
   */
  async preloadSkills(skillNames) {
    const results = await Promise.allSettled(
      skillNames.map(name => this.loadSkill(name))
    );
    
    const loaded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[SkillIntegration] Preloaded ${loaded} skills, ${failed} failed`);
    
    return {
      loaded,
      failed,
      skills: results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.name),
    };
  }

  /**
   * Search skills by tag
   * @param {string} tag - Tag to search for
   * @returns {Array<Object>} Matching skills
   */
  searchByTag(tag) {
    const matching = [];
    for (const [name, skill] of this.skills) {
      if (skill.tags && skill.tags.includes(tag)) {
        matching.push(skill);
      }
    }
    return matching;
  }
}

module.exports = SkillIntegration;
