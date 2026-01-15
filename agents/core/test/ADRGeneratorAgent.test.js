import { ADRGeneratorAgent } from '../agents/ADRGeneratorAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('ADRGeneratorAgent', () => {
  let adrGenerator;

  beforeEach(async () => {
    adrGenerator = new ADRGeneratorAgent();
    await adrGenerator.initialize();
  });

  afterEach(async () => {
    await adrGenerator.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(adrGenerator.id).toBe('adr-generator');
      expect(adrGenerator.name).toBe('ADR Generator Agent');
      expect(adrGenerator.state).toBe('ready');
    });

    it('should initialize ADR cache', () => {
      expect(adrGenerator.adrCache).toBeDefined();
      expect(adrGenerator.adrCache.size).toBe(0);
    });

    it('should initialize ADR counter', () => {
      expect(adrGenerator.adrCounter).toBe(1);
    });
  });

  describe('ADR Creation', () => {
    it('should create ADR with required fields', async () => {
      const input = {
        decision: {
          title: 'Use PostgreSQL as Primary Database',
          description: 'We will use PostgreSQL for all relational data storage'
        },
        context: {
          background: 'Need to select a database for the application',
          problem: 'Must choose between SQL and NoSQL options'
        }
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr).toBeDefined();
      expect(result.adr.number).toBe(1);
      expect(result.adr.title).toBe(input.decision.title);
      expect(result.adr.status).toBe('proposed');
    });

    it('should auto-increment ADR numbers', async () => {
      const input = {
        decision: { title: 'Decision 1', description: 'First decision' },
        context: { background: 'Context' }
      };

      const result1 = await adrGenerator.execute(input);
      const result2 = await adrGenerator.execute(input);

      expect(result1.adr.number).toBe(1);
      expect(result2.adr.number).toBe(2);
    });

    it('should include date in ADR', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.date).toBeDefined();
      expect(result.adr.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should include deciders', async () => {
      const input = {
        decision: {
          title: 'Test',
          description: 'Test',
          deciders: ['Alice', 'Bob']
        },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.deciders).toEqual(['Alice', 'Bob']);
    });
  });

  describe('Context Section', () => {
    it('should include context background', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: {
          background: 'This is the background',
          problem: 'This is the problem'
        }
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.context.background).toBe('This is the background');
      expect(result.adr.context.problem).toBe('This is the problem');
    });

    it('should include goals', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: {
          background: 'Test',
          goals: ['Goal 1', 'Goal 2']
        }
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.context.goals).toEqual(['Goal 1', 'Goal 2']);
    });

    it('should include constraints', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: {
          background: 'Test',
          constraints: ['Constraint 1', 'Constraint 2']
        }
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.context.constraints).toEqual(['Constraint 1', 'Constraint 2']);
    });
  });

  describe('Alternatives', () => {
    it('should include alternatives considered', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: { background: 'Test' },
        alternatives: [
          {
            name: 'MySQL',
            description: 'Use MySQL instead',
            pros: ['Fast', 'Popular'],
            cons: ['Less features']
          }
        ]
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.alternatives.length).toBe(1);
      expect(result.adr.alternatives[0].name).toBe('MySQL');
      expect(result.adr.alternatives[0].pros).toEqual(['Fast', 'Popular']);
    });

    it('should mark alternatives as rejected by default', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: { background: 'Test' },
        alternatives: [{ name: 'Alt', description: 'Test' }]
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.alternatives[0].rejected).toBe(true);
    });
  });

  describe('Consequences', () => {
    it('should include positive consequences', async () => {
      const input = {
        decision: {
          title: 'Test',
          description: 'Test',
          consequences: {
            positive: ['Better performance', 'Easier to maintain']
          }
        },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.consequences.positive).toEqual(['Better performance', 'Easier to maintain']);
    });

    it('should include negative consequences', async () => {
      const input = {
        decision: {
          title: 'Test',
          description: 'Test',
          consequences: {
            negative: ['Higher cost', 'Increased complexity']
          }
        },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.consequences.negative).toEqual(['Higher cost', 'Increased complexity']);
    });

    it('should include risks', async () => {
      const input = {
        decision: {
          title: 'Test',
          description: 'Test',
          consequences: {
            risks: ['Vendor lock-in', 'Learning curve']
          }
        },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.adr.consequences.risks).toEqual(['Vendor lock-in', 'Learning curve']);
    });
  });

  describe('Markdown Generation', () => {
    it('should generate markdown output', async () => {
      const input = {
        decision: { title: 'Test Decision', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.markdown).toBeDefined();
      expect(result.markdown).toContain('# ADR-0001: Test Decision');
      expect(result.markdown).toContain('## Context');
      expect(result.markdown).toContain('## Decision');
    });

    it('should include status badge', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test', status: 'accepted' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.markdown).toContain('✅ Accepted');
    });

    it('should include alternatives section', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: { background: 'Test' },
        alternatives: [{ name: 'Alt1', description: 'Test alternative' }]
      };

      const result = await adrGenerator.execute(input);

      expect(result.markdown).toContain('## Alternatives Considered');
      expect(result.markdown).toContain('Alt1');
    });

    it('should include consequences section', async () => {
      const input = {
        decision: {
          title: 'Test',
          description: 'Test',
          consequences: { positive: ['Pro1'], negative: ['Con1'] }
        },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.markdown).toContain('## Consequences');
      expect(result.markdown).toContain('✅ Pro1');
      expect(result.markdown).toContain('⚠️ Con1');
    });
  });

  describe('Metadata', () => {
    it('should generate metadata', async () => {
      const input = {
        decision: { title: 'Database Selection', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.template).toBe('MADR');
      expect(result.metadata.tags).toBeDefined();
      expect(result.metadata.category).toBeDefined();
      expect(result.metadata.impact).toBeDefined();
    });

    it('should extract tags from title', async () => {
      const input = {
        decision: { title: 'Database API Security', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.metadata.tags).toContain('database');
      expect(result.metadata.tags).toContain('api');
      expect(result.metadata.tags).toContain('security');
    });

    it('should categorize decisions', async () => {
      const infraInput = {
        decision: { title: 'Infrastructure deployment', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(infraInput);

      expect(result.metadata.category).toBe('infrastructure');
    });

    it('should assess impact', async () => {
      const highImpactInput = {
        decision: {
          title: 'Test',
          description: 'Test',
          deciders: ['A', 'B', 'C'],
          consequences: {
            positive: ['P1', 'P2'],
            negative: ['N1', 'N2'],
            risks: ['R1', 'R2', 'R3']
          }
        },
        context: { background: 'Test' },
        alternatives: [
          { name: 'A1', description: 'T1' },
          { name: 'A2', description: 'T2' }
        ]
      };

      const result = await adrGenerator.execute(highImpactInput);

      expect(result.metadata.impact).toBe('high');
    });
  });

  describe('File Naming', () => {
    it('should generate proper file name', async () => {
      const input = {
        decision: { title: 'Use PostgreSQL Database', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.fileName).toMatch(/^ADR-0001-use-postgresql-database\.md$/);
    });

    it('should slugify file names', async () => {
      const input = {
        decision: { title: 'Use REST API (v2)!', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);

      expect(result.fileName).toMatch(/^ADR-0001-use-rest-api-v2\.md$/);
    });
  });

  describe('ADR Management', () => {
    it('should update ADR status', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);
      const updated = await adrGenerator.updateADRStatus(result.executionId, 'accepted');

      expect(updated.adr.status).toBe('accepted');
    });

    it('should supersede ADRs', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);
      const superseded = await adrGenerator.supersede(result.executionId, 5);

      expect(superseded.adr.status).toBe('superseded');
      expect(superseded.adr.supersededBy).toBe(5);
    });
  });

  describe('ADR Search', () => {
    it('should list all ADRs', async () => {
      await adrGenerator.execute({
        decision: { title: 'ADR 1', description: 'Test' },
        context: { background: 'Test' }
      });

      await adrGenerator.execute({
        decision: { title: 'ADR 2', description: 'Test' },
        context: { background: 'Test' }
      });

      const list = adrGenerator.listADRs();

      expect(list.length).toBe(2);
      expect(list[0].number).toBe(1);
      expect(list[1].number).toBe(2);
    });

    it('should search ADRs by title', async () => {
      await adrGenerator.execute({
        decision: { title: 'Database Selection', description: 'Test' },
        context: { background: 'Test' }
      });

      await adrGenerator.execute({
        decision: { title: 'API Design', description: 'Test' },
        context: { background: 'Test' }
      });

      const results = adrGenerator.searchADRs('database');

      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Database Selection');
    });
  });

  describe('ADR Index', () => {
    it('should generate ADR index', async () => {
      await adrGenerator.execute({
        decision: { title: 'Test 1', description: 'Test' },
        context: { background: 'Test' }
      });

      const index = adrGenerator.generateADRIndex();

      expect(index).toContain('# Architecture Decision Records');
      expect(index).toContain('ADR-0001');
    });
  });

  describe('Caching', () => {
    it('should cache ADRs', async () => {
      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: { background: 'Test' }
      };

      const result = await adrGenerator.execute(input);
      const cached = adrGenerator.getADR(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.adr.number).toBe(result.adr.number);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      await expect(async () => {
        await adrGenerator.execute(null);
      }).rejects.toThrow();
    });

    it('should reject missing required fields', async () => {
      await expect(async () => {
        await adrGenerator.execute({ decision: { title: 'Test' } });
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit adr-created event', async () => {
      const events = [];
      adrGenerator.on('adr-created', (evt) => {
        events.push(evt);
      });

      const input = {
        decision: { title: 'Test', description: 'Test' },
        context: { background: 'Test' }
      };

      await adrGenerator.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('adrNumber');
      expect(events[0]).toHaveProperty('title');
    });
  });

  describe('Summary Generation', () => {
    it('should generate execution summary', async () => {
      const input = {
        decision: {
          title: 'Test',
          description: 'Test',
          deciders: ['Alice', 'Bob']
        },
        context: { background: 'Test' },
        alternatives: [{ name: 'Alt1', description: 'Test' }]
      };

      const result = await adrGenerator.execute(input);

      expect(result.summary).toBeDefined();
      expect(result.summary.adrNumber).toBe(1);
      expect(result.summary.deciders).toBe(2);
      expect(result.summary.alternativesConsidered).toBe(1);
    });
  });
});
