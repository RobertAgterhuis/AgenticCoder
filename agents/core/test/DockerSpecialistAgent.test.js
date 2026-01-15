import { DockerSpecialistAgent } from '../agents/DockerSpecialistAgent.js';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('DockerSpecialistAgent', () => {
  let dockerSpecialist;

  beforeEach(async () => {
    dockerSpecialist = new DockerSpecialistAgent();
    await dockerSpecialist.initialize();
  });

  afterEach(async () => {
    await dockerSpecialist.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with correct specification', () => {
      expect(dockerSpecialist.id).toBe('docker-specialist');
      expect(dockerSpecialist.name).toBe('Docker Specialist Agent');
      expect(dockerSpecialist.state).toBe('ready');
    });

    it('should initialize config cache', () => {
      expect(dockerSpecialist.configCache).toBeDefined();
      expect(dockerSpecialist.configCache.size).toBe(0);
    });
  });

  describe('Dockerfile Generation', () => {
    it('should generate Dockerfile for Node.js service', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', version: '20', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerfiles.api).toBeDefined();
      expect(result.dockerfiles.api).toContain('FROM node:20');
      expect(result.dockerfiles.api).toContain('npm ci');
    });

    it('should generate Dockerfile for Python service', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'python', version: '3.11', port: 8000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerfiles.api).toContain('FROM python:3.11');
      expect(result.dockerfiles.api).toContain('pip install');
    });

    it('should use multi-stage builds', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerfiles.api).toContain('AS builder');
      expect(result.dockerfiles.api).toContain('AS production');
    });

    it('should create non-root user', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerfiles.api).toContain('adduser');
      expect(result.dockerfiles.api).toContain('USER appuser');
    });

    it('should include health check', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerfiles.api).toContain('HEALTHCHECK');
    });

    it('should expose correct port', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 8080 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerfiles.api).toContain('EXPOSE 8080');
    });

    it('should use Alpine images for production', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', version: '20', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerfiles.api).toContain('alpine');
    });
  });

  describe('Docker Compose Generation', () => {
    it('should generate docker-compose.yml', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.composeFile).toBeDefined();
      expect(result.composeFile).toContain('version:');
      expect(result.composeFile).toContain('services:');
    });

    it('should include service configuration', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.composeFile).toContain('api:');
      expect(result.composeFile).toContain('build:');
    });

    it('should include port mappings', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.composeFile).toContain('ports:');
      expect(result.composeFile).toContain('3000:3000');
    });

    it('should include networks', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.composeFile).toContain('networks:');
      expect(result.composeFile).toContain('app_network');
    });

    it('should include health checks', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.composeFile).toContain('healthcheck:');
    });

    it('should include resource limits', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.composeFile).toContain('deploy:');
      expect(result.composeFile).toContain('resources:');
    });

    it('should handle service dependencies', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000, dependsOn: ['database'] },
          { name: 'database', runtime: 'postgres', port: 5432 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.composeFile).toContain('depends_on:');
    });
  });

  describe('Dockerignore Generation', () => {
    it('should generate .dockerignore', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerignore).toBeDefined();
    });

    it('should exclude node_modules', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerignore).toContain('node_modules/');
    });

    it('should exclude build outputs', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerignore).toContain('dist/');
      expect(result.dockerignore).toContain('build/');
    });

    it('should exclude .git directory', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerignore).toContain('.git/');
    });
  });

  describe('Recommendations', () => {
    it('should generate recommendations', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should include security recommendations', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      const securityRecs = result.recommendations.filter(r => r.category === 'security');
      expect(securityRecs.length).toBeGreaterThan(0);
    });

    it('should include optimization recommendations', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      const optimizationRecs = result.recommendations.filter(r => r.category === 'optimization');
      expect(optimizationRecs.length).toBeGreaterThan(0);
    });

    it('should prioritize recommendations', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      const highPriority = result.recommendations.filter(r => r.priority === 'high');
      expect(highPriority.length).toBeGreaterThan(0);
    });
  });

  describe('Health Checks', () => {
    it('should generate health check configurations', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.healthChecks).toBeDefined();
      expect(result.healthChecks.api).toBeDefined();
    });

    it('should include health check endpoint', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000, healthCheckEndpoint: '/status' }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.healthChecks.api.endpoint).toBe('/status');
    });

    it('should use default health check endpoint', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.healthChecks.api.endpoint).toBe('/health');
    });
  });

  describe('Multiple Services', () => {
    it('should handle multiple services', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 },
          { name: 'worker', runtime: 'node', port: 3001 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(Object.keys(result.dockerfiles).length).toBe(2);
      expect(result.dockerfiles.api).toBeDefined();
      expect(result.dockerfiles.worker).toBeDefined();
    });

    it('should support different runtimes', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 },
          { name: 'worker', runtime: 'python', port: 8000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.dockerfiles.api).toContain('node');
      expect(result.dockerfiles.worker).toContain('python');
    });
  });

  describe('Summary Generation', () => {
    it('should generate summary', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.summary).toBeDefined();
      expect(result.summary.services).toBe(1);
      expect(result.summary.dockerfilesGenerated).toBe(1);
    });

    it('should count recommendations', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);

      expect(result.summary.recommendationsCount).toBeGreaterThan(0);
    });
  });

  describe('Caching', () => {
    it('should cache configuration', async () => {
      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      const result = await dockerSpecialist.execute(input);
      const cached = dockerSpecialist.getConfig(result.executionId);

      expect(cached).toBeDefined();
      expect(cached.executionId).toBe(result.executionId);
    });

    it('should list configurations', async () => {
      await dockerSpecialist.execute({
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      });

      const list = dockerSpecialist.listConfigurations();

      expect(list.length).toBe(1);
      expect(list[0].services).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid input', async () => {
      await expect(async () => {
        await dockerSpecialist.execute(null);
      }).rejects.toThrow();
    });

    it('should reject missing required fields', async () => {
      await expect(async () => {
        await dockerSpecialist.execute({});
      }).rejects.toThrow();
    });
  });

  describe('Events', () => {
    it('should emit docker-config-generated event', async () => {
      const events = [];
      dockerSpecialist.on('docker-config-generated', (evt) => {
        events.push(evt);
      });

      const input = {
        application: { name: 'myapp' },
        services: [
          { name: 'api', runtime: 'node', port: 3000 }
        ]
      };

      await dockerSpecialist.execute(input);

      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('executionId');
      expect(events[0]).toHaveProperty('services');
    });
  });
});
