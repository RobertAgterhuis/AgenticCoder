import { ArchitectAgent } from '../agents/ArchitectAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('ArchitectAgent', () => {
  let architect;

  beforeEach(async () => {
    architect = new ArchitectAgent();
    await architect.initialize();
  });

  afterEach(async () => {
    await architect.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(architect.id).toBe('architect');
      expect(architect.name).toBe('Solution Architect');
      expect(architect.state).toBe('ready');
    });

    it('should setup architecture cache', () => {
      expect(architect.architectureCache).toBeDefined();
      expect(architect.architectureCache.size).toBe(0);
    });

    it('should setup design patterns', () => {
      expect(architect.designPatterns).toBeDefined();
      expect(architect.designPatterns.length).toBeGreaterThan(0);
    });

    it('should setup tech stack options', () => {
      expect(architect.techStackOptions).toBeDefined();
      expect(Object.keys(architect.techStackOptions).length).toBeGreaterThan(0);
    });
  });

  describe('Architecture Design', () => {
    it('should design architecture from requirements', async () => {
      const input = {
        title: 'E-commerce Platform',
        requirements: {
          scalability: 'high',
          performance: 'critical',
          security: 'high',
          expectedUsers: '1 million'
        }
      };

      const result = await architect.execute(input);

      expect(result.success).toBe(true);
      expect(result.architecture).toBeDefined();
      expect(result.architecture.title).toContain('E-commerce');
    });

    it('should create comprehensive architecture document', async () => {
      const input = {
        title: 'Web Application',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const arch = result.architecture;

      expect(arch).toHaveProperty('analysis');
      expect(arch).toHaveProperty('technology');
      expect(arch).toHaveProperty('components');
      expect(arch).toHaveProperty('layers');
      expect(arch).toHaveProperty('patterns');
      expect(arch).toHaveProperty('infrastructure');
      expect(arch).toHaveProperty('dataFlow');
      expect(arch).toHaveProperty('securityArchitecture');
      expect(arch).toHaveProperty('scalabilityPlan');
      expect(arch).toHaveProperty('deploymentStrategy');
      expect(arch).toHaveProperty('riskMitigation');
      expect(arch).toHaveProperty('estimations');
      expect(arch).toHaveProperty('recommendations');
    });
  });

  describe('Analysis', () => {
    it('should analyze requirements comprehensively', async () => {
      const input = {
        title: 'Test App',
        requirements: {
          scalability: 'high',
          performance: 'critical',
          security: 'high'
        }
      };

      const result = await architect.execute(input);
      const analysis = result.architecture.analysis;

      expect(analysis).toHaveProperty('scalabilityNeeds');
      expect(analysis).toHaveProperty('performanceNeeds');
      expect(analysis).toHaveProperty('reliabilityNeeds');
      expect(analysis).toHaveProperty('securityNeeds');
      expect(analysis).toHaveProperty('complexity');
    });

    it('should assess scalability needs', async () => {
      const input = {
        title: 'Scalable App',
        requirements: {
          scalability: 'high',
          expectedUsers: '1 million'
        }
      };

      const result = await architect.execute(input);
      expect(result.architecture.analysis.scalabilityNeeds).toBe('high');
    });

    it('should assess performance needs', async () => {
      const input = {
        title: 'High Performance App',
        requirements: {
          performance: 'critical',
          latencyRequired: true
        }
      };

      const result = await architect.execute(input);
      expect(result.architecture.analysis.performanceNeeds).toBe('high');
    });
  });

  describe('Technology Stack Selection', () => {
    it('should select appropriate frontend technology', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'high' }
      };

      const result = await architect.execute(input);
      const techStack = result.architecture.technology.recommended;

      expect(techStack).toHaveProperty('frontend');
      expect(['React', 'Vue.js', 'Angular']).toContain(techStack.frontend);
    });

    it('should select appropriate backend technology', async () => {
      const input = {
        title: 'App',
        requirements: { performance: 'critical' }
      };

      const result = await architect.execute(input);
      const techStack = result.architecture.technology.recommended;

      expect(techStack).toHaveProperty('backend');
      expect(['Go', 'Node.js', '.NET']).toContain(techStack.backend);
    });

    it('should select appropriate database technology', async () => {
      const input = {
        title: 'App',
        requirements: { dataVolume: 'large' }
      };

      const result = await architect.execute(input);
      const techStack = result.architecture.technology.recommended;

      expect(techStack).toHaveProperty('database');
      expect(['PostgreSQL', 'MongoDB', 'Azure SQL']).toContain(techStack.database);
    });

    it('should select infrastructure platform', async () => {
      const input = {
        title: 'App',
        requirements: { infrastructure: 'Azure' }
      };

      const result = await architect.execute(input);
      const techStack = result.architecture.technology.recommended;

      expect(techStack).toHaveProperty('infrastructure');
      expect(['Azure', 'AWS']).toContain(techStack.infrastructure);
    });

    it('should provide alternative tech stacks', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'high' }
      };

      const result = await architect.execute(input);
      const alternatives = result.architecture.technology.alternatives;

      expect(Array.isArray(alternatives)).toBe(true);
      expect(alternatives.length).toBeGreaterThan(0);
    });
  });

  describe('Component Definition', () => {
    it('should define system components', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const components = result.architecture.components;

      expect(Array.isArray(components)).toBe(true);
      expect(components.length).toBeGreaterThan(0);
    });

    it('should include essential components', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const components = result.architecture.components;
      const componentIds = components.map(c => c.id);

      expect(componentIds).toContain('api-gateway');
      expect(componentIds).toContain('auth-service');
      expect(componentIds).toContain('backend-services');
      expect(componentIds).toContain('database');
    });

    it('should define component responsibilities', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const components = result.architecture.components;
      const component = components[0];

      expect(component).toHaveProperty('id');
      expect(component).toHaveProperty('name');
      expect(component).toHaveProperty('type');
      expect(component).toHaveProperty('purpose');
      expect(component).toHaveProperty('technology');
      expect(component).toHaveProperty('responsibilities');
      expect(component).toHaveProperty('dependencies');
    });
  });

  describe('Architecture Layers', () => {
    it('should define architecture layers', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const layers = result.architecture.layers;

      expect(Array.isArray(layers)).toBe(true);
      expect(layers.length).toBeGreaterThan(0);
    });

    it('should include standard layers', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const layers = result.architecture.layers;
      const layerNames = layers.map(l => l.layer);

      expect(layerNames).toContain('Presentation Layer');
      expect(layerNames).toContain('Application Layer');
      expect(layerNames).toContain('Data Layer');
      expect(layerNames).toContain('Infrastructure Layer');
    });
  });

  describe('Architectural Patterns', () => {
    it('should identify applicable patterns', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'high' }
      };

      const result = await architect.execute(input);
      const patterns = result.architecture.patterns;

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should describe pattern benefits and tradeoffs', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const patterns = result.architecture.patterns;
      const pattern = patterns[0];

      expect(pattern).toHaveProperty('pattern');
      expect(pattern).toHaveProperty('applicable');
      expect(pattern).toHaveProperty('benefits');
      expect(pattern).toHaveProperty('tradeoffs');
    });

    it('should recommend microservices for high scalability', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'high' }
      };

      const result = await architect.execute(input);
      const patterns = result.architecture.patterns;
      const microservices = patterns.find(p => p.pattern === 'Microservices');

      expect(microservices).toBeDefined();
      expect(microservices.applicable).toBe(true);
    });
  });

  describe('Infrastructure Planning', () => {
    it('should plan infrastructure', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const infrastructure = result.architecture.infrastructure;

      expect(infrastructure).toHaveProperty('containerization');
      expect(infrastructure).toHaveProperty('orchestration');
      expect(infrastructure).toHaveProperty('networking');
      expect(infrastructure).toHaveProperty('storage');
    });

    it('should define containerization strategy', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const infrastructure = result.architecture.infrastructure;

      expect(infrastructure.containerization.technology).toBe('Docker');
      expect(Array.isArray(infrastructure.containerization.images)).toBe(true);
    });

    it('should define orchestration strategy', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const infrastructure = result.architecture.infrastructure;

      expect(infrastructure.orchestration.technology).toBe('Kubernetes');
      expect(infrastructure.orchestration.clusters).toBeDefined();
    });
  });

  describe('Security Architecture', () => {
    it('should design security architecture', async () => {
      const input = {
        title: 'App',
        requirements: { security: 'high' }
      };

      const result = await architect.execute(input);
      const security = result.architecture.securityArchitecture;

      expect(security).toHaveProperty('authentication');
      expect(security).toHaveProperty('authorization');
      expect(security).toHaveProperty('encryption');
      expect(security).toHaveProperty('network');
      expect(security).toHaveProperty('dataProtection');
    });

    it('should specify authentication method', async () => {
      const input = {
        title: 'App',
        requirements: { security: 'high' }
      };

      const result = await architect.execute(input);
      const security = result.architecture.securityArchitecture;

      expect(security.authentication.method).toBeDefined();
      expect(security.authentication.provider).toBeDefined();
    });

    it('should enable MFA for high security', async () => {
      const input = {
        title: 'App',
        requirements: { security: 'high' }
      };

      const result = await architect.execute(input);
      const security = result.architecture.securityArchitecture;

      expect(security.authentication.mfa).toBe(true);
    });
  });

  describe('Scalability Planning', () => {
    it('should plan scalability strategy', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'high' }
      };

      const result = await architect.execute(input);
      const scalability = result.architecture.scalabilityPlan;

      expect(scalability).toHaveProperty('horizontalScaling');
      expect(scalability).toHaveProperty('verticalScaling');
      expect(scalability).toHaveProperty('caching');
      expect(scalability).toHaveProperty('cdnStrategy');
    });

    it('should enable horizontal scaling for high scalability', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'high' }
      };

      const result = await architect.execute(input);
      const scalability = result.architecture.scalabilityPlan;

      expect(scalability.horizontalScaling.enabled).toBe(true);
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate development cost', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const estimations = result.architecture.estimations;

      expect(estimations.developmentCost).toBeGreaterThan(0);
    });

    it('should estimate development time', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const estimations = result.architecture.estimations;

      expect(estimations.developmentTime).toBeDefined();
      expect(typeof estimations.developmentTime).toBe('string');
    });

    it('should estimate team size', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const estimations = result.architecture.estimations;

      expect(estimations.teamSize).toBeDefined();
      expect(typeof estimations.teamSize).toBe('string');
    });

    it('should increase cost for high scalability', async () => {
      const input1 = { title: 'App', requirements: { scalability: 'medium' } };
      const input2 = { title: 'App', requirements: { scalability: 'high' } };

      const result1 = await architect.execute(input1);
      const result2 = await architect.execute(input2);

      expect(result2.architecture.estimations.developmentCost)
        .toBeGreaterThan(result1.architecture.estimations.developmentCost);
    });
  });

  describe('Alternative Designs', () => {
    it('should evaluate alternative designs', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const alternatives = result.architecture.alternativeDesigns;

      expect(Array.isArray(alternatives)).toBe(true);
      expect(alternatives.length).toBeGreaterThan(0);
    });

    it('should describe pros and cons of alternatives', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const alternatives = result.architecture.alternativeDesigns;
      const alternative = alternatives[0];

      expect(alternative).toHaveProperty('alternative');
      expect(alternative).toHaveProperty('pros');
      expect(alternative).toHaveProperty('cons');
      expect(alternative).toHaveProperty('recommendedWhen');
    });
  });

  describe('Risk Management', () => {
    it('should identify architectural risks', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'high' }
      };

      const result = await architect.execute(input);
      const risks = result.architecture.riskMitigation;

      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThan(0);
    });

    it('should assess risk probability and impact', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'high' }
      };

      const result = await architect.execute(input);
      const risks = result.architecture.riskMitigation;
      const risk = risks[0];

      expect(risk).toHaveProperty('risk');
      expect(risk).toHaveProperty('probability');
      expect(risk).toHaveProperty('impact');
      expect(risk).toHaveProperty('mitigation');
    });
  });

  describe('Caching', () => {
    it('should cache architecture designs', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);
      const cached = architect.getArchitecture(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.id).toBe(result.executionId);
    });

    it('should list cached architectures', async () => {
      const input1 = { title: 'App 1', requirements: { scalability: 'medium' } };
      const input2 = { title: 'App 2', requirements: { scalability: 'high' } };

      const result1 = await architect.execute(input1);
      const result2 = await architect.execute(input2);

      const list = architect.listArchitectures();
      expect(list.length).toBe(2);
      expect(list.map(a => a.id)).toContain(result1.executionId);
      expect(list.map(a => a.id)).toContain(result2.executionId);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      expect(async () => {
        await architect.execute(null);
      }).rejects.toThrow();
    });

    it('should reject input without title or requirements', async () => {
      expect(async () => {
        await architect.execute({});
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit architecture-designed event', async () => {
      const events = [];
      architect.on('architecture-designed', (evt) => {
        events.push(evt);
      });

      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      await architect.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('componentCount');
    });
  });

  describe('Summary', () => {
    it('should generate execution summary', async () => {
      const input = {
        title: 'App',
        requirements: { scalability: 'medium' }
      };

      const result = await architect.execute(input);

      expect(result.summary).toHaveProperty('components');
      expect(result.summary).toHaveProperty('layers');
      expect(result.summary).toHaveProperty('patterns');
      expect(result.summary).toHaveProperty('estimatedCost');
      expect(result.summary).toHaveProperty('estimatedTime');
      expect(result.summary).toHaveProperty('recommendedTechStack');
    });
  });
});
