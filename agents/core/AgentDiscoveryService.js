/**
 * Agent Discovery Service
 * Provides REST API endpoints for agent discovery and routing
 */

const express = require('express');
const { AGENT_SPECIFICATIONS, AgentSpecificationIndex } = require('./AgentSpecifications');

/**
 * Create Express router for agent discovery API
 */
function createAgentDiscoveryRouter() {
  const router = express.Router();
  const index = new AgentSpecificationIndex(AGENT_SPECIFICATIONS);

  /**
   * GET /agents - List all agents with optional filtering
   * Query params: tier, category, phase, capability, skill
   */
  router.get('/agents', (req, res) => {
    let agents = index.listAll();

    if (req.query.tier) {
      agents = agents.filter(a => a.tier === req.query.tier);
    }

    if (req.query.category) {
      agents = agents.filter(a => a.category === req.query.category);
    }

    if (req.query.phase) {
      agents = agents.filter(a => (a.phases || []).includes(req.query.phase));
    }

    if (req.query.capability) {
      agents = agents.filter(a => (a.capabilities || []).includes(req.query.capability));
    }

    if (req.query.skill) {
      agents = agents.filter(a => (a.skills || []).includes(req.query.skill));
    }

    res.json({
      count: agents.length,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        tier: a.tier,
        category: a.category,
        status: a.status
      }))
    });
  });

  /**
   * GET /agents/:id - Get agent details
   */
  router.get('/agents/:id', (req, res) => {
    const agent = index.getAgent(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(agent);
  });

  /**
   * GET /agents/:id/predecessors - Get agents that typically run before
   */
  router.get('/agents/:id/predecessors', (req, res) => {
    const agent = index.getAgent(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const predecessors = (agent.predecessors || [])
      .map(id => index.getAgent(id))
      .filter(a => a);

    res.json({ predecessors });
  });

  /**
   * GET /agents/:id/successors - Get agents that typically run after
   */
  router.get('/agents/:id/successors', (req, res) => {
    const agent = index.getAgent(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const successors = (agent.successors || [])
      .map(id => index.getAgent(id))
      .filter(a => a);

    res.json({ successors });
  });

  /**
   * GET /agents/:id/workflow-path - Get full workflow path including agent
   */
  router.get('/agents/:id/workflow-path', (req, res) => {
    const agent = index.getAgent(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const predecessors = (agent.predecessors || [])
      .map(id => index.getAgent(id))
      .filter(a => a);

    const successors = (agent.successors || [])
      .map(id => index.getAgent(id))
      .filter(a => a);

    res.json({
      agent,
      predecessors,
      successors
    });
  });

  /**
   * GET /agents/by-tier/:tier - Get all agents for a tier
   */
  router.get('/agents/by-tier/:tier', (req, res) => {
    const agents = index.listByTier(req.params.tier);

    res.json({
      tier: req.params.tier,
      count: agents.length,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        category: a.category
      }))
    });
  });

  /**
   * GET /agents/by-category/:category - Get all agents for a category
   */
  router.get('/agents/by-category/:category', (req, res) => {
    const agents = index.listByCategory(req.params.category);

    res.json({
      category: req.params.category,
      count: agents.length,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        tier: a.tier
      }))
    });
  });

  /**
   * GET /agents/by-phase/:phase - Get all agents for a phase
   */
  router.get('/agents/by-phase/:phase', (req, res) => {
    const decodedPhase = decodeURIComponent(req.params.phase);
    const agents = index.listByPhase(decodedPhase);

    res.json({
      phase: decodedPhase,
      count: agents.length,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        tier: a.tier
      }))
    });
  });

  /**
   * GET /agents/by-capability/:capability - Get all agents with capability
   */
  router.get('/agents/by-capability/:capability', (req, res) => {
    const agents = index.listByCapability(req.params.capability);

    res.json({
      capability: req.params.capability,
      count: agents.length,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name
      }))
    });
  });

  /**
   * GET /agents/by-skill/:skill - Get all agents with skill
   */
  router.get('/agents/by-skill/:skill', (req, res) => {
    const agents = index.listBySkill(req.params.skill);

    res.json({
      skill: req.params.skill,
      count: agents.length,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name
      }))
    });
  });

  /**
   * GET /agents/search - Search agents by name or description
   */
  router.get('/agents/search', (req, res) => {
    const q = (req.query.q || '').toLowerCase();

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const results = index.listAll().filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );

    res.json({
      query: q,
      count: results.length,
      agents: results.map(a => ({
        id: a.id,
        name: a.name,
        tier: a.tier,
        category: a.category
      }))
    });
  });

  /**
   * GET /stats - Get registry statistics
   */
  router.get('/stats', (req, res) => {
    const stats = index.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      ...stats,
      tierBreakdown: Object.fromEntries(
        Array.from(index.byTier.entries()).map(([tier, agents]) => [
          tier,
          { count: agents.length, agents: agents.map(a => a.id) }
        ])
      ),
      categoryBreakdown: Object.fromEntries(
        Array.from(index.byCategory.entries()).map(([cat, agents]) => [
          cat,
          { count: agents.length }
        ])
      )
    });
  });

  /**
   * GET /workflows/:phase - Get complete workflow for a phase
   */
  router.get('/workflows/:phase', (req, res) => {
    const decodedPhase = decodeURIComponent(req.params.phase);
    const agents = index.listByPhase(decodedPhase);

    res.json({
      phase: decodedPhase,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        tier: a.tier
      })),
      count: agents.length
    });
  });

  /**
   * GET /workflows/complete - Get all phases and their agents
   */
  router.get('/workflows/complete', (req, res) => {
    const phases = [
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
      'Phase 12: DevOps & Deployment'
    ];

    const workflow = phases.map(phase => {
      const agents = index.listByPhase(phase);
      return {
        phase,
        agents: agents.map(a => ({
          id: a.id,
          name: a.name
        })),
        count: agents.length
      };
    });

    res.json({ workflow });
  });

  /**
   * POST /agents/route - Route to best agent for a capability
   */
  router.post('/agents/route', (req, res) => {
    const { capability, context } = req.body;

    if (!capability) {
      return res.status(400).json({ error: 'Capability required' });
    }

    const candidates = index.listByCapability(capability);

    if (candidates.length === 0) {
      return res.status(404).json({
        error: 'No agents found with capability',
        capability
      });
    }

    // Smart routing based on context
    let selected = candidates[0];

    if (context?.tier) {
      const tierMatch = candidates.find(a => a.tier === context.tier);
      if (tierMatch) selected = tierMatch;
    }

    if (context?.category) {
      const categoryMatch = candidates.find(a => a.category === context.category);
      if (categoryMatch) selected = categoryMatch;
    }

    if (context?.phase) {
      const phaseMatch = candidates.find(a => (a.phases || []).includes(context.phase));
      if (phaseMatch) selected = phaseMatch;
    }

    res.json({
      capability,
      candidates: candidates.map(a => a.id),
      selected: {
        id: selected.id,
        name: selected.name,
        tier: selected.tier
      }
    });
  });

  return router;
}

module.exports = {
  createAgentDiscoveryRouter
};
