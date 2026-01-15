/**
 * Agent Specifications & Discovery Tests
 */

import { test, describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { AGENT_SPECIFICATIONS, AgentSpecificationIndex } from '../core/AgentSpecifications.js';

describe('Agent Specifications', () => {
  let index;

  before(() => {
    index = new AgentSpecificationIndex(AGENT_SPECIFICATIONS);
  });

  it('should have 35 agent specifications', () => {
    assert.strictEqual(AGENT_SPECIFICATIONS.length, 35);
  });

  it('should have all required tiers', () => {
    const tiers = new Set(AGENT_SPECIFICATIONS.map(a => a.tier));
    assert.strictEqual(tiers.has('Orchestration'), true);
    assert.strictEqual(tiers.has('Architecture'), true);
    assert.strictEqual(tiers.has('Implementation'), true);
  });

  it('should have 9 orchestration agents', () => {
    const orchestrationAgents = AGENT_SPECIFICATIONS.filter(a => a.tier === 'Orchestration');
    assert.strictEqual(orchestrationAgents.length, 9);
  });

  it('should have 8 architecture agents', () => {
    const architectureAgents = AGENT_SPECIFICATIONS.filter(a => a.tier === 'Architecture');
    assert.strictEqual(architectureAgents.length, 8);
  });

  it('should have 18 implementation agents', () => {
    const implementationAgents = AGENT_SPECIFICATIONS.filter(a => a.tier === 'Implementation');
    assert.strictEqual(implementationAgents.length, 18);
  });

  it('should have unique agent IDs', () => {
    const ids = AGENT_SPECIFICATIONS.map(a => a.id);
    const uniqueIds = new Set(ids);
    assert.strictEqual(ids.length, uniqueIds.size);
  });

  it('should have all required fields in specifications', () => {
    AGENT_SPECIFICATIONS.forEach(spec => {
      assert.strictEqual(typeof spec.id, 'string');
      assert.strictEqual(typeof spec.name, 'string');
      assert.strictEqual(typeof spec.tier, 'string');
      assert.strictEqual(typeof spec.category, 'string');
      assert.strictEqual(typeof spec.version, 'string');
      assert.strictEqual(typeof spec.status, 'string');
      assert.strictEqual(typeof spec.description, 'string');
      assert(Array.isArray(spec.capabilities));
      assert(Array.isArray(spec.phases || []));
    });
  });

  it('should validate phases against expected phases', () => {
    const expectedPhases = [
      'Phase 1: Requirements Discovery',
      'Phase 2: Architecture Planning',
      'Phase 3: Infrastructure Assessment',
      'Phase 4: Design Artifacts',
      'Phase 5: Infrastructure Planning',
      'Phase 6: Database Architecture',
      'Phase 7: Application Planning',
      'Phase 8: Infrastructure Implementation',
      'Phase 9: Frontend Implementation',
      'Phase 10: Backend Implementation',
      'Phase 11: Integration & Testing',
      'Phase 12: DevOps & Deployment',
      'All Phases'
    ];

    AGENT_SPECIFICATIONS.forEach(spec => {
      (spec.phases || []).forEach(phase => {
        assert(expectedPhases.includes(phase), `Invalid phase: ${phase} for agent ${spec.id}`);
      });
    });
  });

  it('should build index correctly', () => {
    assert.strictEqual(index.listAll().length, 35);
  });

  it('should retrieve agent by ID', () => {
    const agent = index.getAgent('plan');
    assert.strictEqual(agent.name, 'Requirements Planner');
    assert.strictEqual(agent.tier, 'Orchestration');
  });

  it('should list agents by tier', () => {
    const orchestration = index.listByTier('Orchestration');
    assert.strictEqual(orchestration.length, 9);

    const architecture = index.listByTier('Architecture');
    assert.strictEqual(architecture.length, 8);

    const implementation = index.listByTier('Implementation');
    assert.strictEqual(implementation.length, 18);
  });

  it('should list agents by category', () => {
    const frontend = index.listByCategory('Frontend');
    assert.strictEqual(frontend.length, 5);

    const backend = index.listByCategory('Backend');
    assert.strictEqual(backend.length, 6);

    const infrastructure = index.listByCategory('Infrastructure');
    assert.strictEqual(infrastructure.length, 6); // 4 core infra + docker + kubernetes

    const database = index.listByCategory('Database');
    assert.strictEqual(database.length, 4); // 1 Architecture + 3 Implementation
  });

  it('should list agents by phase', () => {
    const phase1 = index.listByPhase('Phase 1: Requirements Discovery');
    assert(phase1.length > 0);

    const phase12 = index.listByPhase('Phase 12: DevOps & Deployment');
    assert(phase12.length > 0);
  });

  it('should list agents by capability', () => {
    const apiGeneration = index.listByCapability('api-creation');
    assert(apiGeneration.length > 0);
  });

  it('should list agents by skill', () => {
    const reactSkill = index.listBySkill('react');
    assert(reactSkill.some(a => a.id === 'react-specialist'));

    const dotnetSkill = index.listBySkill('csharp');
    assert(dotnetSkill.some(a => a.id === 'dotnet-specialist'));
  });

  it('should validate predecessor/successor relationships', () => {
    AGENT_SPECIFICATIONS.forEach(spec => {
      // Check predecessors exist
      (spec.predecessors || []).forEach(predId => {
        const predAgent = index.getAgent(predId);
        assert(predAgent, `Predecessor ${predId} not found for ${spec.id}`);
      });

      // Check successors exist
      (spec.successors || []).forEach(succId => {
        const succAgent = index.getAgent(succId);
        assert(succAgent, `Successor ${succId} not found for ${spec.id}`);
      });
    });
  });

  it('should get correct statistics', () => {
    const stats = index.getStats();
    assert.strictEqual(stats.totalAgents, 35);
    assert(stats.byTier['Orchestration'] === 9);
    assert(stats.byTier['Architecture'] === 8);
    assert(stats.byTier['Implementation'] === 18);
    assert(stats.capabilities > 0);
    assert(stats.skills > 0);
  });

  it('should find agents for specific workflow path', () => {
    // Test complete workflow path from @plan
    const plan = index.getAgent('plan');
    assert.strictEqual(plan.id, 'plan');
    assert.strictEqual(plan.tier, 'Orchestration');
    assert(plan.successors.includes('architect') || plan.successors.includes('code-architect'));
  });

  it('should have no null/undefined values in specifications', () => {
    AGENT_SPECIFICATIONS.forEach(spec => {
      assert(spec.id !== null && spec.id !== undefined);
      assert(spec.name !== null && spec.name !== undefined);
      assert(spec.tier !== null && spec.tier !== undefined);
    });
  });

  it('should categorize frontend agents correctly', () => {
    const frontend = index.listByCategory('Frontend');
    const ids = frontend.map(a => a.id);

    assert(ids.includes('react-specialist'));
    assert(ids.includes('vue-specialist'));
    assert(ids.includes('angular-specialist'));
    assert(ids.includes('svelte-specialist'));
    assert(ids.includes('frontend-specialist'));
  });

  it('should categorize backend agents correctly', () => {
    const backend = index.listByCategory('Backend');
    const ids = backend.map(a => a.id);

    assert(ids.includes('dotnet-specialist'));
    assert(ids.includes('nodejs-specialist'));
    assert(ids.includes('python-specialist'));
    assert(ids.includes('go-specialist'));
    assert(ids.includes('java-specialist'));
    assert(ids.includes('backend-specialist'));
  });

  it('should have implementations for orchestration agents', () => {
    const orchestration = index.listByTier('Orchestration');
    const mustHaveAgents = ['plan', 'coordinator', 'qa', 'architect'];

    mustHaveAgents.forEach(agentId => {
      assert(orchestration.some(a => a.id === agentId), `Missing orchestration agent: ${agentId}`);
    });
  });
});
