import { PlannerAgent } from '../agents/PlannerAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('PlannerAgent', () => {
  let planner;

  beforeEach(async () => {
    planner = new PlannerAgent();
    await planner.initialize();
  });

  afterEach(async () => {
    await planner.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(planner.id).toBe('plan');
      expect(planner.name).toBe('Requirements Planner');
      expect(planner.state).toBe('ready');
    });

    it('should setup requirement cache', () => {
      expect(planner.requirementCache).toBeDefined();
      expect(planner.requirementCache.size).toBe(0);
    });
  });

  describe('Requirement Parsing', () => {
    it('should parse simple requirements', async () => {
      const input = {
        requirements: 'Build a web application. It should have a user login. Admin dashboard required.',
        techStack: ['React', 'Node.js', 'MongoDB'],
        timeline: '4 weeks'
      };

      const result = await planner.execute(input);

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.document.requirements.functional).toBeDefined();
    });

    it('should extract functional requirements', async () => {
      const input = {
        requirements: 'User login system. Admin can manage users. System tracks activity.',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      const result = await planner.execute(input);
      const functional = result.document.requirements.functional;

      expect(functional.length).toBeGreaterThan(0);
      functional.forEach(req => {
        expect(req).toHaveProperty('id');
        expect(req).toHaveProperty('description');
        expect(req).toHaveProperty('type');
        expect(req.type).toBe('functional');
      });
    });

    it('should extract non-functional requirements', async () => {
      const input = {
        requirements: 'High performance required. Must be secure. Should scale to 1M users.',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      const result = await planner.execute(input);
      const nonFunctional = result.document.requirements.nonFunctional;

      expect(nonFunctional.length).toBeGreaterThan(0);
      nonFunctional.forEach(req => {
        expect(req.type).toBe('non-functional');
      });
    });

    it('should extract constraints', async () => {
      const input = {
        requirements: 'Budget limited to $50K. Must complete in 3 months. Uses AWS only.',
        techStack: ['React'],
        timeline: '3 months'
      };

      const result = await planner.execute(input);
      const constraints = result.document.requirements.constraints;

      expect(constraints.length).toBeGreaterThan(0);
      constraints.forEach(req => {
        expect(req.type).toBe('constraint');
      });
    });
  });

  describe('Entity Extraction', () => {
    it('should identify system entities', async () => {
      const input = {
        requirements: 'The application includes a web interface and API service.',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      const result = await planner.execute(input);
      const entities = result.document.entities;

      if (entities.systems) {
        expect(Array.isArray(entities.systems)).toBe(true);
      }
    });

    it('should identify user entities', async () => {
      const input = {
        requirements: 'Users can login. Admins manage the system. Customers view products.',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      const result = await planner.execute(input);
      const entities = result.document.entities;

      if (entities.users) {
        expect(Array.isArray(entities.users)).toBe(true);
      }
    });
  });

  describe('Component Decomposition', () => {
    it('should decompose requirements into components', async () => {
      const input = {
        requirements: 'User registration. Email verification. Password reset. Profile management.',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      const result = await planner.execute(input);
      const components = result.document.components;

      expect(components).toBeDefined();
      expect(Array.isArray(components)).toBe(true);
    });

    it('should generate scope from components', async () => {
      const input = {
        requirements: 'Build system with users and products.',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      const result = await planner.execute(input);
      const scope = result.document.scope;

      expect(scope).toHaveProperty('included');
      expect(scope).toHaveProperty('itemCount');
      expect(scope).toHaveProperty('estimatedComplexity');
    });
  });

  describe('Risk Identification', () => {
    it('should identify risks from requirements', async () => {
      const input = {
        requirements: 'Complex system using unproven technology.',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      const result = await planner.execute(input);
      const risks = result.document.risks;

      expect(Array.isArray(risks)).toBe(true);
      risks.forEach(risk => {
        expect(risk).toHaveProperty('id');
        expect(risk).toHaveProperty('severity');
      });
    });
  });

  describe('Document Generation', () => {
    it('should generate complete requirement document', async () => {
      const input = {
        requirements: 'Build web app with user login and dashboard.',
        techStack: ['React', 'Node.js'],
        timeline: '4 weeks'
      };

      const result = await planner.execute(input);
      const doc = result.document;

      expect(doc).toHaveProperty('id');
      expect(doc).toHaveProperty('title');
      expect(doc).toHaveProperty('summary');
      expect(doc).toHaveProperty('requirements');
      expect(doc).toHaveProperty('entities');
      expect(doc).toHaveProperty('components');
      expect(doc).toHaveProperty('scope');
      expect(doc).toHaveProperty('risks');
      expect(doc).toHaveProperty('assumptions');
      expect(doc).toHaveProperty('successCriteria');
      expect(doc).toHaveProperty('metadata');
    });

    it('should include tech stack in document', async () => {
      const techStack = ['React', 'Node.js', 'PostgreSQL'];
      const input = {
        requirements: 'Build app',
        techStack,
        timeline: '4 weeks'
      };

      const result = await planner.execute(input);
      expect(result.document.techStack).toEqual(techStack);
    });

    it('should include timeline in document', async () => {
      const timeline = '4 weeks';
      const input = {
        requirements: 'Build app',
        techStack: ['React'],
        timeline
      };

      const result = await planner.execute(input);
      expect(result.document.timeline).toBe(timeline);
    });
  });

  describe('Caching', () => {
    it('should cache requirement document', async () => {
      const input = {
        requirements: 'Build app',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      const result = await planner.execute(input);
      const cached = planner.getRequirement(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.id).toBe(result.executionId);
    });

    it('should list cached requirements', async () => {
      const input1 = { requirements: 'App 1', techStack: ['React'], timeline: '2 weeks' };
      const input2 = { requirements: 'App 2', techStack: ['Vue'], timeline: '4 weeks' };

      const result1 = await planner.execute(input1);
      const result2 = await planner.execute(input2);

      const list = planner.listRequirements();
      expect(list.length).toBe(2);
      expect(list.map(r => r.id)).toContain(result1.executionId);
      expect(list.map(r => r.id)).toContain(result2.executionId);
    });
  });

  describe('Error Handling', () => {
    it('should reject empty requirements', async () => {
      const input = {
        requirements: '',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      expect(async () => {
        await planner.execute(input);
      }).rejects.toThrow();
    });

    it('should reject null requirements', async () => {
      const input = {
        requirements: null,
        techStack: ['React'],
        timeline: '2 weeks'
      };

      expect(async () => {
        await planner.execute(input);
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit requirements-parsed event', async () => {
      const events = [];
      planner.on('requirements-parsed', (evt) => {
        events.push(evt);
      });

      const input = {
        requirements: 'Build app with features.',
        techStack: ['React'],
        timeline: '2 weeks'
      };

      await planner.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('functionalCount');
      expect(events[0]).toHaveProperty('entityCount');
    });
  });
});
