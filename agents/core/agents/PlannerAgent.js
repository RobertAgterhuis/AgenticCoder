import { BaseAgent } from '../BaseAgent.js';
import { AGENT_SPECIFICATIONS } from '../AgentSpecifications.js';

/**
 * Planner Agent - Requirements Planner
 * 
 * Responsibilities:
 * - Parses user requirements
 * - Extracts key entities and concepts
 * - Decomposes requirements into components
 * - Generates structured requirement documents
 * - Validates completeness and consistency
 */
export class PlannerAgent extends BaseAgent {
  constructor(options = {}) {
    const plannerSpec = AGENT_SPECIFICATIONS.find(s => s.id === 'plan');
    
    super(plannerSpec, {
      timeout: 45000,
      maxRetries: 2,
      ...options
    });

    this.requirementCache = new Map();
    this.entityIndex = new Map();
  }

  /**
   * Initialize planner - setup requirement parsing templates
   */
  async _onInitialize() {
    console.log('[Planner] Initializing Requirements Planner...');
    this._setupParsingTemplates();
  }

  /**
   * Core execution - parse and structure requirements
   */
  async _onExecute(input, context, executionId) {
    console.log(`[Planner] Processing requirements: ${executionId}`);

    try {
      // Parse input requirements
      const parsed = this._parseRequirements(input.requirements);
      
      // Extract entities
      const entities = this._extractEntities(parsed);
      
      // Decompose into components
      const components = this._decomposeRequirements(parsed);
      
      // Generate structured document
      const document = {
        id: executionId,
        title: this._generateTitle(parsed),
        summary: this._generateSummary(parsed),
        requirements: {
          functional: this._extractFunctionalRequirements(parsed),
          nonFunctional: this._extractNonFunctionalRequirements(parsed),
          constraints: this._extractConstraints(parsed)
        },
        entities,
        components,
        techStack: input.techStack || [],
        timeline: input.timeline,
        scope: this._defineScope(components),
        risks: this._identifyRisks(parsed),
        assumptions: this._listAssumptions(parsed),
        successCriteria: this._defineSuccessCriteria(parsed),
        metadata: {
          createdAt: new Date().toISOString(),
          executionId,
          version: '1.0.0'
        }
      };

      // Cache requirement
      this.requirementCache.set(executionId, document);

      this.emit('requirements-parsed', {
        executionId,
        functionalCount: document.requirements.functional.length,
        entityCount: Object.keys(entities).length,
        componentCount: components.length,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        executionId,
        document,
        status: 'parsed',
        summary: {
          requirements: document.requirements.functional.length,
          entities: Object.keys(entities).length,
          components: components.length,
          timeline: input.timeline
        }
      };

    } catch (error) {
      this.emit('parsing-failed', {
        executionId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Parse raw requirements text
   */
  _parseRequirements(requirements) {
    if (!requirements) {
      throw new Error('Requirements cannot be empty');
    }

    return {
      raw: requirements,
      sentences: this._splitIntoSentences(requirements),
      keywords: this._extractKeywords(requirements),
      structure: this._analyzeStructure(requirements)
    };
  }

  /**
   * Extract entities from requirements
   */
  _extractEntities(parsed) {
    const entities = {};
    const keywords = parsed.keywords;

    // Group keywords by type
    const systemEntities = keywords.filter(k => 
      this._isSystemEntity(k)
    );
    const userEntities = keywords.filter(k => 
      this._isUserEntity(k)
    );
    const dataEntities = keywords.filter(k => 
      this._isDataEntity(k)
    );

    if (systemEntities.length > 0) {
      entities.systems = systemEntities;
    }
    if (userEntities.length > 0) {
      entities.users = userEntities;
    }
    if (dataEntities.length > 0) {
      entities.data = dataEntities;
    }

    return entities;
  }

  /**
   * Decompose requirements into components
   */
  _decomposeRequirements(parsed) {
    const components = [];
    const sentences = parsed.sentences;

    for (const sentence of sentences) {
      const component = this._sentenceToComponent(sentence);
      if (component) {
        components.push(component);
      }
    }

    // Group related components
    const grouped = this._groupComponents(components);
    return grouped;
  }

  /**
   * Extract functional requirements
   */
  _extractFunctionalRequirements(parsed) {
    const functional = [];
    const keywords = parsed.keywords;

    const functionalKeywords = ['user', 'system', 'application', 'feature', 'function', 
                               'capability', 'action', 'process', 'workflow'];

    for (const keyword of keywords) {
      if (functionalKeywords.some(fk => keyword.toLowerCase().includes(fk))) {
        functional.push({
          id: `FR-${functional.length + 1}`,
          description: keyword,
          type: 'functional',
          priority: this._determinePriority(keyword)
        });
      }
    }

    return functional;
  }

  /**
   * Extract non-functional requirements
   */
  _extractNonFunctionalRequirements(parsed) {
    const nonFunctional = [];
    const keywords = parsed.keywords;

    const nfKeywords = ['performance', 'security', 'scalability', 'reliability', 
                        'availability', 'latency', 'throughput', 'capacity',
                        'maintainability', 'usability', 'accessibility'];

    for (const keyword of keywords) {
      if (nfKeywords.some(nfk => keyword.toLowerCase().includes(nfk))) {
        nonFunctional.push({
          id: `NFR-${nonFunctional.length + 1}`,
          description: keyword,
          type: 'non-functional',
          category: this._categorizeNFR(keyword)
        });
      }
    }

    return nonFunctional;
  }

  /**
   * Extract constraints
   */
  _extractConstraints(parsed) {
    const constraints = [];
    const keywords = parsed.keywords;

    const constraintKeywords = ['budget', 'timeline', 'resource', 'limitation', 'constraint',
                               'regulation', 'compliance', 'standard', 'must', 'required'];

    for (const keyword of keywords) {
      if (constraintKeywords.some(ck => keyword.toLowerCase().includes(ck))) {
        constraints.push({
          id: `CON-${constraints.length + 1}`,
          description: keyword,
          type: 'constraint'
        });
      }
    }

    return constraints;
  }

  /**
   * Get cached requirement document
   */
  getRequirement(executionId) {
    return this.requirementCache.get(executionId);
  }

  /**
   * List all cached requirements
   */
  listRequirements() {
    return Array.from(this.requirementCache.entries()).map(([id, doc]) => ({
      id,
      title: doc.title,
      createdAt: doc.metadata.createdAt,
      requirementCount: doc.requirements.functional.length,
      entityCount: Object.keys(doc.entities).length
    }));
  }

  /**
   * Cleanup resources
   */
  async _onCleanup() {
    console.log('[Planner] Cleaning up Requirements Planner...');
    this.requirementCache.clear();
    this.entityIndex.clear();
  }

  // ===== Private Helper Methods =====

  _setupParsingTemplates() {
    // Setup templates for requirement patterns
  }

  _splitIntoSentences(text) {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  _extractKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    // Remove common words
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    return words.filter(w => w.length > 3 && !commonWords.has(w));
  }

  _analyzeStructure(text) {
    return {
      hasListItems: text.includes('-') || text.includes('•'),
      hasSections: text.includes('\n\n'),
      sentenceCount: this._splitIntoSentences(text).length
    };
  }

  _isSystemEntity(keyword) {
    const systemKeywords = ['system', 'application', 'module', 'service', 'component', 'interface'];
    return systemKeywords.some(sk => keyword.toLowerCase().includes(sk));
  }

  _isUserEntity(keyword) {
    const userKeywords = ['user', 'admin', 'customer', 'client', 'stakeholder', 'actor'];
    return userKeywords.some(uk => keyword.toLowerCase().includes(uk));
  }

  _isDataEntity(keyword) {
    const dataKeywords = ['data', 'database', 'table', 'field', 'record', 'document', 'file'];
    return dataKeywords.some(dk => keyword.toLowerCase().includes(dk));
  }

  _sentenceToComponent(sentence) {
    if (sentence.trim().length < 10) return null;
    
    return {
      id: `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      description: sentence.trim(),
      keywords: this._extractKeywords(sentence)
    };
  }

  _groupComponents(components) {
    // Group components by keywords
    const grouped = [];
    const processed = new Set();

    for (const comp of components) {
      if (processed.has(comp.id)) continue;

      const group = {
        id: `GROUP-${grouped.length + 1}`,
        name: this._generateGroupName(comp),
        components: [comp],
        keywords: [...new Set(comp.keywords)]
      };

      // Find related components
      for (const other of components) {
        if (other.id === comp.id || processed.has(other.id)) continue;
        
        const similarity = this._calculateSimilarity(comp.keywords, other.keywords);
        if (similarity > 0.3) {
          group.components.push(other);
          processed.add(other.id);
        }
      }

      grouped.push(group);
      processed.add(comp.id);
    }

    return grouped;
  }

  _generateTitle(parsed) {
    const keywords = parsed.keywords;
    if (keywords.length > 0) {
      return `Requirements: ${keywords.slice(0, 3).join(', ')}`;
    }
    return 'System Requirements Document';
  }

  _generateSummary(parsed) {
    return `Parsed ${parsed.sentences.length} sentences with ${parsed.keywords.length} key concepts`;
  }

  _defineScope(components) {
    return {
      included: components.map(c => c.name || 'unnamed'),
      itemCount: components.length,
      estimatedComplexity: components.length > 5 ? 'high' : 'medium'
    };
  }

  _identifyRisks(parsed) {
    const risks = [];
    
    if (parsed.keywords.includes('complex')) {
      risks.push({ id: 'R1', description: 'High complexity identified', severity: 'medium' });
    }
    
    if (parsed.keywords.some(k => k.includes('new') || k.includes('unproven'))) {
      risks.push({ id: 'R2', description: 'Unproven technology', severity: 'high' });
    }

    return risks;
  }

  _listAssumptions(parsed) {
    return [
      'System will be developed using specified tech stack',
      'Requirements will remain stable during development',
      'Adequate resources will be available',
      'Stakeholders will provide timely feedback'
    ];
  }

  _defineSuccessCriteria(parsed) {
    return [
      'All requirements implemented and tested',
      'System meets performance requirements',
      'User acceptance testing passes',
      'Documentation complete'
    ];
  }

  _determinePriority(keyword) {
    if (keyword.toLowerCase().includes('must') || keyword.toLowerCase().includes('critical')) {
      return 'P0';
    }
    if (keyword.toLowerCase().includes('should') || keyword.toLowerCase().includes('important')) {
      return 'P1';
    }
    return 'P2';
  }

  _categorizeNFR(keyword) {
    const kw = keyword.toLowerCase();
    if (kw.includes('performance') || kw.includes('latency')) return 'performance';
    if (kw.includes('security') || kw.includes('safe')) return 'security';
    if (kw.includes('scalab')) return 'scalability';
    if (kw.includes('reliab') || kw.includes('avail')) return 'reliability';
    return 'other';
  }

  _calculateSimilarity(keywords1, keywords2) {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const common = keywords1.filter(k => keywords2.includes(k)).length;
    return common / Math.max(keywords1.length, keywords2.length);
  }

  _generateGroupName(component) {
    const keywords = component.keywords.slice(0, 2);
    return keywords.join('-') || 'component';
  }
}
