import { BaseAgent } from '../base/BaseAgent.js';
import { EventEmitter } from 'events';

/**
 * ADRGeneratorAgent - Architecture Decision Records Generator
 * 
 * Generates and manages Architecture Decision Records (ADRs) following
 * the MADR (Markdown Architecture Decision Record) template and best practices.
 */
export class ADRGeneratorAgent extends BaseAgent {
  constructor(spec = {}) {
    const defaultSpec = {
      id: 'adr-generator',
      name: 'ADR Generator Agent',
      description: 'Generates Architecture Decision Records documenting key architectural choices',
      inputSchema: {
        type: 'object',
        properties: {
          decision: { type: 'object' },
          context: { type: 'object' },
          alternatives: { type: 'array' }
        },
        required: ['decision', 'context']
      },
      outputSchema: {
        type: 'object',
        properties: {
          adr: { type: 'object' },
          markdown: { type: 'string' }
        }
      }
    };

    super({ ...defaultSpec, ...spec });
    this.adrCache = new Map();
    this.adrCounter = 1;
  }

  async _onInitialize() {
    this.adrCache.clear();
    this.adrCounter = 1;
  }

  async _onExecute(input, context, executionId) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const { decision, context: decisionContext, alternatives = [] } = input;

    // Generate ADR number
    const adrNumber = this.adrCounter++;

    // Create ADR
    const adr = await this.createADR(
      adrNumber,
      decision,
      decisionContext,
      alternatives
    );

    // Generate markdown
    const markdown = await this.generateMarkdown(adr);

    // Generate metadata
    const metadata = this.generateMetadata(adr);

    const result = {
      executionId,
      adr,
      markdown,
      metadata,
      fileName: `ADR-${String(adrNumber).padStart(4, '0')}-${this.slugify(decision.title)}.md`
    };

    this.adrCache.set(executionId, result);

    this.emit('adr-created', {
      executionId,
      adrNumber,
      title: decision.title,
      status: adr.status
    });

    return {
      success: true,
      executionId,
      adr,
      markdown,
      metadata,
      fileName: result.fileName,
      summary: {
        adrNumber,
        title: decision.title,
        status: adr.status,
        deciders: adr.deciders?.length || 0,
        alternativesConsidered: alternatives.length
      }
    };
  }

  async createADR(number, decision, context, alternatives) {
    return {
      number,
      title: decision.title,
      date: new Date().toISOString().split('T')[0],
      status: decision.status || 'proposed',
      deciders: decision.deciders || [],
      context: {
        background: context.background || '',
        problem: context.problem || '',
        goals: context.goals || [],
        constraints: context.constraints || [],
        assumptions: context.assumptions || []
      },
      decision: {
        description: decision.description,
        rationale: decision.rationale || '',
        implications: decision.implications || []
      },
      alternatives: alternatives.map((alt, index) => ({
        name: alt.name,
        description: alt.description,
        pros: alt.pros || [],
        cons: alt.cons || [],
        rejected: alt.rejected !== false
      })),
      consequences: {
        positive: decision.consequences?.positive || [],
        negative: decision.consequences?.negative || [],
        risks: decision.consequences?.risks || []
      },
      links: decision.links || [],
      supersededBy: null,
      supersedes: decision.supersedes || null
    };
  }

  async generateMarkdown(adr) {
    const sections = [];

    // Header
    sections.push(`# ADR-${String(adr.number).padStart(4, '0')}: ${adr.title}\n`);

    // Metadata
    sections.push('## Metadata\n');
    sections.push(`- **Status:** ${this.getStatusBadge(adr.status)}`);
    sections.push(`- **Date:** ${adr.date}`);
    if (adr.deciders.length > 0) {
      sections.push(`- **Deciders:** ${adr.deciders.join(', ')}`);
    }
    if (adr.supersedes) {
      sections.push(`- **Supersedes:** ADR-${String(adr.supersedes).padStart(4, '0')}`);
    }
    sections.push('');

    // Context
    sections.push('## Context\n');
    if (adr.context.background) {
      sections.push('### Background\n');
      sections.push(adr.context.background);
      sections.push('');
    }
    if (adr.context.problem) {
      sections.push('### Problem Statement\n');
      sections.push(adr.context.problem);
      sections.push('');
    }
    if (adr.context.goals.length > 0) {
      sections.push('### Goals\n');
      adr.context.goals.forEach(goal => sections.push(`- ${goal}`));
      sections.push('');
    }
    if (adr.context.constraints.length > 0) {
      sections.push('### Constraints\n');
      adr.context.constraints.forEach(constraint => sections.push(`- ${constraint}`));
      sections.push('');
    }
    if (adr.context.assumptions.length > 0) {
      sections.push('### Assumptions\n');
      adr.context.assumptions.forEach(assumption => sections.push(`- ${assumption}`));
      sections.push('');
    }

    // Decision
    sections.push('## Decision\n');
    sections.push(adr.decision.description);
    sections.push('');
    if (adr.decision.rationale) {
      sections.push('### Rationale\n');
      sections.push(adr.decision.rationale);
      sections.push('');
    }

    // Alternatives Considered
    if (adr.alternatives.length > 0) {
      sections.push('## Alternatives Considered\n');
      adr.alternatives.forEach((alt, index) => {
        sections.push(`### ${index + 1}. ${alt.name}\n`);
        sections.push(alt.description);
        sections.push('');
        if (alt.pros.length > 0) {
          sections.push('**Pros:**');
          alt.pros.forEach(pro => sections.push(`- ✅ ${pro}`));
          sections.push('');
        }
        if (alt.cons.length > 0) {
          sections.push('**Cons:**');
          alt.cons.forEach(con => sections.push(`- ❌ ${con}`));
          sections.push('');
        }
      });
    }

    // Consequences
    sections.push('## Consequences\n');
    if (adr.consequences.positive.length > 0) {
      sections.push('### Positive\n');
      adr.consequences.positive.forEach(pos => sections.push(`- ✅ ${pos}`));
      sections.push('');
    }
    if (adr.consequences.negative.length > 0) {
      sections.push('### Negative\n');
      adr.consequences.negative.forEach(neg => sections.push(`- ⚠️ ${neg}`));
      sections.push('');
    }
    if (adr.consequences.risks.length > 0) {
      sections.push('### Risks\n');
      adr.consequences.risks.forEach(risk => sections.push(`- 🔴 ${risk}`));
      sections.push('');
    }

    // Implementation
    if (adr.decision.implications.length > 0) {
      sections.push('## Implementation Notes\n');
      adr.decision.implications.forEach(impl => sections.push(`- ${impl}`));
      sections.push('');
    }

    // Links
    if (adr.links.length > 0) {
      sections.push('## Links\n');
      adr.links.forEach(link => {
        sections.push(`- [${link.title || link.url}](${link.url})`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  generateMetadata(adr) {
    return {
      version: '1.0.0',
      template: 'MADR',
      tags: this.extractTags(adr),
      category: this.categorizeDecision(adr),
      impact: this.assessImpact(adr),
      stakeholders: adr.deciders || [],
      lastModified: new Date().toISOString()
    };
  }

  extractTags(adr) {
    const tags = [];
    const title = adr.title.toLowerCase();
    
    // Technology tags
    if (title.includes('database')) tags.push('database');
    if (title.includes('api')) tags.push('api');
    if (title.includes('security')) tags.push('security');
    if (title.includes('performance')) tags.push('performance');
    if (title.includes('cloud')) tags.push('cloud');
    if (title.includes('microservice')) tags.push('microservices');
    if (title.includes('frontend')) tags.push('frontend');
    if (title.includes('backend')) tags.push('backend');
    
    // Architecture patterns
    if (title.includes('architecture')) tags.push('architecture');
    if (title.includes('pattern')) tags.push('pattern');
    if (title.includes('design')) tags.push('design');
    
    return tags.length > 0 ? tags : ['general'];
  }

  categorizeDecision(adr) {
    const title = adr.title.toLowerCase();
    
    if (title.includes('infrastructure') || title.includes('deployment')) {
      return 'infrastructure';
    }
    if (title.includes('database') || title.includes('storage')) {
      return 'data';
    }
    if (title.includes('api') || title.includes('interface')) {
      return 'integration';
    }
    if (title.includes('security') || title.includes('authentication')) {
      return 'security';
    }
    if (title.includes('frontend') || title.includes('ui')) {
      return 'frontend';
    }
    if (title.includes('backend') || title.includes('service')) {
      return 'backend';
    }
    
    return 'architecture';
  }

  assessImpact(adr) {
    let score = 0;
    
    // More alternatives = higher impact
    score += adr.alternatives.length * 10;
    
    // More consequences = higher impact
    score += adr.consequences.positive.length * 5;
    score += adr.consequences.negative.length * 10;
    score += adr.consequences.risks.length * 15;
    
    // More deciders = higher impact
    score += adr.deciders.length * 5;
    
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  getStatusBadge(status) {
    const badges = {
      proposed: '🟡 Proposed',
      accepted: '✅ Accepted',
      rejected: '❌ Rejected',
      deprecated: '⚠️ Deprecated',
      superseded: '🔄 Superseded'
    };
    return badges[status] || status;
  }

  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // ADR Management
  async updateADRStatus(executionId, newStatus) {
    const cached = this.adrCache.get(executionId);
    if (!cached) {
      throw new Error(`ADR not found: ${executionId}`);
    }

    cached.adr.status = newStatus;
    cached.markdown = await this.generateMarkdown(cached.adr);
    
    this.emit('adr-updated', {
      executionId,
      adrNumber: cached.adr.number,
      newStatus
    });

    return cached;
  }

  async supersede(executionId, supersedingAdrNumber) {
    const cached = this.adrCache.get(executionId);
    if (!cached) {
      throw new Error(`ADR not found: ${executionId}`);
    }

    cached.adr.status = 'superseded';
    cached.adr.supersededBy = supersedingAdrNumber;
    cached.markdown = await this.generateMarkdown(cached.adr);
    
    return cached;
  }

  getADR(executionId) {
    return this.adrCache.get(executionId);
  }

  listADRs() {
    return Array.from(this.adrCache.values()).map(item => ({
      number: item.adr.number,
      title: item.adr.title,
      status: item.adr.status,
      date: item.adr.date,
      category: item.metadata.category,
      impact: item.metadata.impact
    }));
  }

  searchADRs(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const item of this.adrCache.values()) {
      const { adr, metadata } = item;
      
      if (
        adr.title.toLowerCase().includes(lowerQuery) ||
        adr.decision.description.toLowerCase().includes(lowerQuery) ||
        metadata.tags.some(tag => tag.includes(lowerQuery)) ||
        metadata.category.includes(lowerQuery)
      ) {
        results.push({
          number: adr.number,
          title: adr.title,
          status: adr.status,
          relevance: this.calculateRelevance(adr, query)
        });
      }
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  calculateRelevance(adr, query) {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const lowerTitle = adr.title.toLowerCase();
    
    if (lowerTitle === lowerQuery) score += 100;
    else if (lowerTitle.includes(lowerQuery)) score += 50;
    
    if (adr.decision.description.toLowerCase().includes(lowerQuery)) score += 25;
    
    return score;
  }

  generateADRIndex() {
    const adrs = this.listADRs();
    
    const sections = ['# Architecture Decision Records\n'];
    sections.push('This document provides an index of all ADRs in this project.\n');
    
    // Group by status
    const byStatus = {
      accepted: [],
      proposed: [],
      deprecated: [],
      superseded: [],
      rejected: []
    };

    adrs.forEach(adr => {
      if (byStatus[adr.status]) {
        byStatus[adr.status].push(adr);
      }
    });

    // Generate sections
    Object.entries(byStatus).forEach(([status, items]) => {
      if (items.length > 0) {
        sections.push(`## ${status.charAt(0).toUpperCase() + status.slice(1)} (${items.length})\n`);
        items.forEach(adr => {
          sections.push(`- [ADR-${String(adr.number).padStart(4, '0')}: ${adr.title}](ADR-${String(adr.number).padStart(4, '0')}-${this.slugify(adr.title)}.md) - ${adr.date} - Impact: ${adr.impact}`);
        });
        sections.push('');
      }
    });

    return sections.join('\n');
  }

  async _onCleanup() {
    // Cleanup if needed
  }
}

export default ADRGeneratorAgent;
