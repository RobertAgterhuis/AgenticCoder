import { DiagramGeneratorAgent } from '../agents/DiagramGeneratorAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('DiagramGeneratorAgent', () => {
  let diagramGenerator;

  beforeEach(async () => {
    diagramGenerator = new DiagramGeneratorAgent();
    await diagramGenerator.initialize();
  });

  afterEach(async () => {
    await diagramGenerator.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(diagramGenerator.id).toBe('diagram-generator');
      expect(diagramGenerator.name).toBe('Diagram Generator Agent');
      expect(diagramGenerator.state).toBe('ready');
    });

    it('should initialize diagram cache', () => {
      expect(diagramGenerator.diagramCache).toBeDefined();
      expect(diagramGenerator.diagramCache.size).toBe(0);
    });

    it('should initialize templates', () => {
      expect(diagramGenerator.templates).toBeDefined();
    });
  });

  describe('C4 Context Diagram', () => {
    it('should generate C4 context diagram', async () => {
      const input = {
        architecture: {},
        components: [
          { name: 'Web App', description: 'Main application' },
          { name: 'API', description: 'Backend API' }
        ],
        diagramTypes: ['c4-context']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBe(1);
      expect(result.diagrams[0].type).toBe('c4-context');
      expect(result.diagrams[0].format).toBe('plantuml');
    });

    it('should include PlantUML content', async () => {
      const input = {
        architecture: {},
        components: [{ name: 'System' }],
        diagramTypes: ['c4-context']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.content).toContain('@startuml');
      expect(diagram.content).toContain('@enduml');
      expect(diagram.content).toContain('C4_Context.puml');
    });

    it('should include Mermaid alternative', async () => {
      const input = {
        architecture: {},
        components: [{ name: 'System' }],
        diagramTypes: ['c4-context']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.mermaidAlternative).toBeDefined();
      expect(diagram.mermaidAlternative).toContain('graph TB');
    });
  });

  describe('C4 Container Diagram', () => {
    it('should generate C4 container diagram', async () => {
      const input = {
        architecture: {},
        components: [
          {
            name: 'Application',
            containers: [
              { name: 'Web App', technology: 'React' },
              { name: 'API', technology: 'Node.js' }
            ]
          }
        ],
        diagramTypes: ['c4-container']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBe(1);
      expect(result.diagrams[0].type).toBe('c4-container');
    });

    it('should include container details', async () => {
      const input = {
        architecture: {},
        components: [
          {
            name: 'App',
            containers: [{ name: 'API', technology: 'Node.js' }]
          }
        ],
        diagramTypes: ['c4-container']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.content).toContain('Container');
      expect(diagram.content).toContain('API');
    });
  });

  describe('C4 Component Diagram', () => {
    it('should generate C4 component diagram', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['c4-component']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBe(1);
      expect(result.diagrams[0].type).toBe('c4-component');
    });

    it('should show component relationships', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['c4-component']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.content).toContain('Component');
      expect(diagram.content).toContain('Rel');
    });
  });

  describe('Sequence Diagram', () => {
    it('should generate sequence diagram', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['sequence']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBe(1);
      expect(result.diagrams[0].type).toBe('sequence');
    });

    it('should include actors and participants', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['sequence']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.content).toContain('actor');
      expect(diagram.content).toContain('participant');
    });

    it('should show message flows', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['sequence']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.content).toContain('->');
      expect(diagram.content).toContain('-->');
    });
  });

  describe('Deployment Diagram', () => {
    it('should generate deployment diagram', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['deployment']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBe(1);
      expect(result.diagrams[0].type).toBe('deployment');
    });

    it('should show infrastructure components', async () => {
      const input = {
        architecture: { cloudProvider: 'AWS' },
        components: [],
        diagramTypes: ['deployment']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.content).toContain('AWS');
      expect(diagram.description).toContain('deployment');
    });
  });

  describe('Network Diagram', () => {
    it('should generate network diagram', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['network']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBe(1);
      expect(result.diagrams[0].type).toBe('network');
    });

    it('should show network topology', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['network']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.content).toContain('VPC');
      expect(diagram.content).toContain('Subnet');
    });
  });

  describe('ER Diagram', () => {
    it('should generate entity relationship diagram', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['entity-relationship']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBe(1);
      expect(result.diagrams[0].type).toBe('entity-relationship');
    });

    it('should show entities and relationships', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['entity-relationship']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.content).toContain('entity');
      expect(diagram.mermaidAlternative).toContain('erDiagram');
    });
  });

  describe('Flowchart', () => {
    it('should generate flowchart', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['flowchart']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBe(1);
      expect(result.diagrams[0].type).toBe('flowchart');
    });

    it('should show process flow', async () => {
      const input = {
        architecture: {},
        components: [],
        diagramTypes: ['flowchart']
      };

      const result = await diagramGenerator.execute(input);
      const diagram = result.diagrams[0];

      expect(diagram.content).toContain('start');
      expect(diagram.content).toContain('stop');
    });
  });

  describe('Multiple Diagrams', () => {
    it('should generate multiple diagram types', async () => {
      const input = {
        architecture: {},
        components: [{ name: 'App' }],
        diagramTypes: ['c4-context', 'sequence', 'deployment']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBe(3);
      expect(result.diagrams.map(d => d.type)).toContain('c4-context');
      expect(result.diagrams.map(d => d.type)).toContain('sequence');
      expect(result.diagrams.map(d => d.type)).toContain('deployment');
    });

    it('should count formats correctly', async () => {
      const input = {
        architecture: {},
        components: [{ name: 'App' }],
        diagramTypes: ['c4-context', 'sequence']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.formats.plantuml).toBe(2);
    });
  });

  describe('Default Diagram Types', () => {
    it('should use default diagram types when not specified', async () => {
      const input = {
        architecture: {},
        components: [{ name: 'App' }]
      };

      const result = await diagramGenerator.execute(input);

      expect(result.diagrams.length).toBeGreaterThan(0);
    });
  });

  describe('Caching', () => {
    it('should cache generated diagrams', async () => {
      const input = {
        architecture: {},
        components: [{ name: 'App' }],
        diagramTypes: ['c4-context']
      };

      const result = await diagramGenerator.execute(input);
      const cached = diagramGenerator.getDiagrams(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.executionId).toBe(result.executionId);
    });

    it('should list all cached diagrams', async () => {
      await diagramGenerator.execute({
        architecture: {},
        components: [{ name: 'App1' }],
        diagramTypes: ['c4-context']
      });

      await diagramGenerator.execute({
        architecture: {},
        components: [{ name: 'App2' }],
        diagramTypes: ['sequence']
      });

      const list = diagramGenerator.listDiagrams();
      expect(list.length).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      await expect(async () => {
        await diagramGenerator.execute(null);
      }).rejects.toThrow();
    });

    it('should reject missing required fields', async () => {
      await expect(async () => {
        await diagramGenerator.execute({ architecture: {} });
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit diagrams-generated event', async () => {
      const events = [];
      diagramGenerator.on('diagrams-generated', (evt) => {
        events.push(evt);
      });

      const input = {
        architecture: {},
        components: [{ name: 'App' }],
        diagramTypes: ['c4-context']
      };

      await diagramGenerator.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('diagramCount');
    });
  });

  describe('Summary Generation', () => {
    it('should generate execution summary', async () => {
      const input = {
        architecture: {},
        components: [{ name: 'App' }],
        diagramTypes: ['c4-context', 'sequence']
      };

      const result = await diagramGenerator.execute(input);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalDiagrams).toBe(2);
      expect(result.summary.types).toHaveLength(2);
    });
  });
});
