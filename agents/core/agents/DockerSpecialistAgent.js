import { BaseAgent } from '../base/BaseAgent.js';
import { EventEmitter } from 'events';

/**
 * DockerSpecialistAgent - Container Configuration and Optimization
 * 
 * Generates production-ready Docker configurations including Dockerfiles,
 * docker-compose.yml, and optimization recommendations.
 */
export class DockerSpecialistAgent extends BaseAgent {
  constructor(spec = {}) {
    const defaultSpec = {
      id: 'docker-specialist',
      name: 'Docker Specialist Agent',
      description: 'Generates Docker configurations and containerization strategies',
      inputSchema: {
        type: 'object',
        properties: {
          application: { type: 'object' },
          services: { type: 'array' },
          environment: { type: 'string' }
        },
        required: ['application', 'services']
      },
      outputSchema: {
        type: 'object',
        properties: {
          dockerfiles: { type: 'object' },
          composeFile: { type: 'string' },
          recommendations: { type: 'array' }
        }
      }
    };

    super({ ...defaultSpec, ...spec });
    this.configCache = new Map();
  }

  async _onInitialize() {
    this.configCache.clear();
  }

  async _onExecute(input, context, executionId) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const { application, services, environment = 'production' } = input;

    // Generate Dockerfiles for each service
    const dockerfiles = await this.generateDockerfiles(services, application);

    // Generate docker-compose.yml
    const composeFile = await this.generateComposeFile(services, application, environment);

    // Generate .dockerignore
    const dockerignore = await this.generateDockerignore(application);

    // Generate optimization recommendations
    const recommendations = await this.generateRecommendations(services, application);

    // Generate health check configurations
    const healthChecks = await this.generateHealthChecks(services);

    const result = {
      executionId,
      dockerfiles,
      composeFile,
      dockerignore,
      healthChecks,
      recommendations,
      summary: {
        services: services.length,
        dockerfilesGenerated: Object.keys(dockerfiles).length,
        recommendationsCount: recommendations.length
      }
    };

    this.configCache.set(executionId, result);

    this.emit('docker-config-generated', {
      executionId,
      services: services.length,
      dockerfiles: Object.keys(dockerfiles).length
    });

    return {
      success: true,
      executionId,
      dockerfiles,
      composeFile,
      dockerignore,
      healthChecks,
      recommendations,
      summary: result.summary
    };
  }

  async generateDockerfiles(services, application) {
    const dockerfiles = {};

    for (const service of services) {
      const dockerfile = await this.generateDockerfile(service, application);
      dockerfiles[service.name] = dockerfile;
    }

    return dockerfiles;
  }

  async generateDockerfile(service, application) {
    const lines = [];
    const runtime = service.runtime || 'node';
    const version = service.version || this.getDefaultVersion(runtime);

    // Multi-stage build
    lines.push(`# Build stage`);
    lines.push(`FROM ${this.getBaseImage(runtime, version)} AS builder`);
    lines.push('');
    lines.push('WORKDIR /app');
    lines.push('');

    // Copy dependency files first
    if (runtime === 'node') {
      lines.push('# Copy dependency files');
      lines.push('COPY package*.json ./');
      lines.push('');
      lines.push('# Install dependencies');
      lines.push('RUN npm ci --only=production');
      lines.push('');
    } else if (runtime === 'python') {
      lines.push('# Copy dependency files');
      lines.push('COPY requirements.txt ./');
      lines.push('');
      lines.push('# Install dependencies');
      lines.push('RUN pip install --no-cache-dir -r requirements.txt');
      lines.push('');
    } else if (runtime === 'java') {
      lines.push('# Copy build files');
      lines.push('COPY pom.xml ./');
      lines.push('COPY src ./src');
      lines.push('');
      lines.push('# Build application');
      lines.push('RUN mvn clean package -DskipTests');
      lines.push('');
    }

    // Copy application code
    lines.push('# Copy application code');
    lines.push('COPY . .');
    lines.push('');

    // Build step (if needed)
    if (service.buildCommand) {
      lines.push('# Build application');
      lines.push(`RUN ${service.buildCommand}`);
      lines.push('');
    }

    // Production stage
    lines.push('# Production stage');
    lines.push(`FROM ${this.getBaseImage(runtime, version, true)} AS production`);
    lines.push('');
    lines.push('WORKDIR /app');
    lines.push('');

    // Create non-root user
    lines.push('# Create non-root user');
    lines.push('RUN addgroup --system --gid 1001 appgroup && \\');
    lines.push('    adduser --system --uid 1001 --ingroup appgroup appuser');
    lines.push('');

    // Copy from builder
    if (runtime === 'node') {
      lines.push('# Copy dependencies and application');
      lines.push('COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules');
      lines.push('COPY --from=builder --chown=appuser:appgroup /app/package*.json ./');
      lines.push('COPY --from=builder --chown=appuser:appgroup /app/dist ./dist');
    } else if (runtime === 'python') {
      lines.push('# Copy dependencies and application');
      lines.push('COPY --from=builder --chown=appuser:appgroup /app ./');
    } else if (runtime === 'java') {
      lines.push('# Copy JAR file');
      lines.push('COPY --from=builder --chown=appuser:appgroup /app/target/*.jar app.jar');
    }
    lines.push('');

    // Switch to non-root user
    lines.push('USER appuser');
    lines.push('');

    // Expose port
    const port = service.port || 3000;
    lines.push(`EXPOSE ${port}`);
    lines.push('');

    // Health check
    lines.push('# Health check');
    lines.push(`HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \\`);
    lines.push(`  CMD ${this.getHealthCheckCommand(runtime, port)}`);
    lines.push('');

    // Start command
    lines.push('# Start application');
    const startCommand = service.startCommand || this.getDefaultStartCommand(runtime);
    lines.push(`CMD ${JSON.stringify(startCommand.split(' '))}`);

    return lines.join('\n');
  }

  async generateComposeFile(services, application, environment) {
    const config = {
      version: '3.8',
      services: {},
      networks: {
        app_network: {
          driver: 'bridge'
        }
      },
      volumes: {}
    };

    for (const service of services) {
      const serviceConfig = {
        build: {
          context: `./${service.name}`,
          dockerfile: 'Dockerfile'
        },
        container_name: `${application.name}-${service.name}`,
        restart: 'unless-stopped',
        networks: ['app_network'],
        environment: this.getEnvironmentVariables(service, environment)
      };

      // Add port mapping
      if (service.port) {
        serviceConfig.ports = [`${service.port}:${service.port}`];
      }

      // Add volumes
      if (service.volumes) {
        serviceConfig.volumes = service.volumes;
        // Add named volumes to the volumes section
        service.volumes.forEach(vol => {
          const volumeName = vol.split(':')[0];
          if (!volumeName.startsWith('.') && !volumeName.startsWith('/')) {
            config.volumes[volumeName] = {};
          }
        });
      }

      // Add dependencies
      if (service.dependsOn) {
        serviceConfig.depends_on = service.dependsOn;
      }

      // Add health check
      if (service.healthcheck !== false) {
        serviceConfig.healthcheck = {
          test: this.getHealthCheckTest(service),
          interval: '30s',
          timeout: '3s',
          retries: 3,
          start_period: '40s'
        };
      }

      // Add resource limits
      serviceConfig.deploy = {
        resources: {
          limits: {
            cpus: service.cpuLimit || '1',
            memory: service.memoryLimit || '512M'
          },
          reservations: {
            cpus: service.cpuReservation || '0.5',
            memory: service.memoryReservation || '256M'
          }
        }
      };

      config.services[service.name] = serviceConfig;
    }

    return this.yamlStringify(config);
  }

  async generateDockerignore(application) {
    const lines = [
      '# Dependencies',
      'node_modules/',
      'bower_components/',
      '__pycache__/',
      '*.pyc',
      '.venv/',
      'venv/',
      '',
      '# Build outputs',
      'dist/',
      'build/',
      'target/',
      '*.jar',
      '*.war',
      '',
      '# Development files',
      '.git/',
      '.gitignore',
      '.env',
      '.env.local',
      '*.log',
      '',
      '# IDE',
      '.vscode/',
      '.idea/',
      '*.swp',
      '*.swo',
      '',
      '# Testing',
      'coverage/',
      '.nyc_output/',
      '*.test.js',
      '*.spec.js',
      '',
      '# Documentation',
      'docs/',
      'README.md',
      '*.md',
      '',
      '# CI/CD',
      '.github/',
      '.gitlab-ci.yml',
      'Jenkinsfile',
      '',
      '# Docker',
      'Dockerfile*',
      'docker-compose*.yml',
      '.dockerignore'
    ];

    return lines.join('\n');
  }

  async generateRecommendations(services, application) {
    const recommendations = [];

    // Multi-stage builds
    recommendations.push({
      category: 'optimization',
      priority: 'high',
      title: 'Use Multi-Stage Builds',
      description: 'Reduce image size by using multi-stage builds to separate build and runtime dependencies.',
      implemented: true
    });

    // Non-root user
    recommendations.push({
      category: 'security',
      priority: 'high',
      title: 'Run as Non-Root User',
      description: 'All services should run as non-root users to minimize security risks.',
      implemented: true
    });

    // Health checks
    recommendations.push({
      category: 'reliability',
      priority: 'high',
      title: 'Implement Health Checks',
      description: 'Add health checks to all services for better container orchestration and monitoring.',
      implemented: true
    });

    // Resource limits
    recommendations.push({
      category: 'performance',
      priority: 'medium',
      title: 'Set Resource Limits',
      description: 'Define CPU and memory limits to prevent resource exhaustion.',
      implemented: true
    });

    // Layer caching
    recommendations.push({
      category: 'optimization',
      priority: 'medium',
      title: 'Optimize Layer Caching',
      description: 'Copy dependency files before application code to leverage Docker layer caching.',
      implemented: true
    });

    // Secrets management
    recommendations.push({
      category: 'security',
      priority: 'high',
      title: 'Use Docker Secrets',
      description: 'Store sensitive data using Docker secrets or external secret management solutions.',
      implemented: false,
      action: 'Consider using Docker Swarm secrets or Kubernetes secrets for production deployments.'
    });

    // Image scanning
    recommendations.push({
      category: 'security',
      priority: 'high',
      title: 'Scan Images for Vulnerabilities',
      description: 'Regularly scan container images for security vulnerabilities.',
      implemented: false,
      action: 'Integrate tools like Trivy, Snyk, or Docker Scout into your CI/CD pipeline.'
    });

    // Minimal base images
    recommendations.push({
      category: 'optimization',
      priority: 'medium',
      title: 'Use Minimal Base Images',
      description: 'Use Alpine or distroless images to reduce attack surface and image size.',
      implemented: true
    });

    return recommendations;
  }

  async generateHealthChecks(services) {
    const healthChecks = {};

    for (const service of services) {
      healthChecks[service.name] = {
        endpoint: service.healthCheckEndpoint || '/health',
        interval: 30,
        timeout: 3,
        retries: 3,
        startPeriod: 40
      };
    }

    return healthChecks;
  }

  getBaseImage(runtime, version, slim = false) {
    const images = {
      node: slim ? `node:${version}-alpine` : `node:${version}`,
      python: slim ? `python:${version}-slim` : `python:${version}`,
      java: slim ? `openjdk:${version}-jre-slim` : `openjdk:${version}`,
      go: slim ? `golang:${version}-alpine` : `golang:${version}`,
      ruby: slim ? `ruby:${version}-alpine` : `ruby:${version}`
    };
    return images[runtime] || `${runtime}:${version}`;
  }

  getDefaultVersion(runtime) {
    const versions = {
      node: '20',
      python: '3.11',
      java: '17',
      go: '1.21',
      ruby: '3.2'
    };
    return versions[runtime] || 'latest';
  }

  getHealthCheckCommand(runtime, port) {
    const commands = {
      node: `node -e "require('http').get('http://localhost:${port}/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"`,
      python: `python -c "import urllib.request; urllib.request.urlopen('http://localhost:${port}/health')"`,
      java: `curl -f http://localhost:${port}/health || exit 1`,
      go: `wget --no-verbose --tries=1 --spider http://localhost:${port}/health || exit 1`,
      ruby: `curl -f http://localhost:${port}/health || exit 1`
    };
    return commands[runtime] || `curl -f http://localhost:${port}/health || exit 1`;
  }

  getDefaultStartCommand(runtime) {
    const commands = {
      node: 'node dist/index.js',
      python: 'python app.py',
      java: 'java -jar app.jar',
      go: './app',
      ruby: 'ruby app.rb'
    };
    return commands[runtime] || 'npm start';
  }

  getHealthCheckTest(service) {
    const port = service.port || 3000;
    const endpoint = service.healthCheckEndpoint || '/health';
    return [`CMD-SHELL`, `curl -f http://localhost:${port}${endpoint} || exit 1`];
  }

  getEnvironmentVariables(service, environment) {
    const baseEnv = {
      NODE_ENV: environment,
      PORT: service.port?.toString() || '3000'
    };

    if (service.environment) {
      return { ...baseEnv, ...service.environment };
    }

    return baseEnv;
  }

  yamlStringify(obj, indent = 0) {
    const lines = [];
    const indentStr = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`${indentStr}${key}:`);
        lines.push(this.yamlStringify(value, indent + 1));
      } else if (Array.isArray(value)) {
        lines.push(`${indentStr}${key}:`);
        value.forEach(item => {
          if (typeof item === 'object') {
            lines.push(`${indentStr}  -`);
            const itemLines = this.yamlStringify(item, indent + 2).split('\n');
            itemLines.forEach((line, idx) => {
              if (idx === 0) {
                lines.push(line.replace(`${indentStr}    `, `${indentStr}    `));
              } else {
                lines.push(line);
              }
            });
          } else {
            lines.push(`${indentStr}  - ${item}`);
          }
        });
      } else {
        const valueStr = typeof value === 'string' && value.includes(':') ? `'${value}'` : value;
        lines.push(`${indentStr}${key}: ${valueStr}`);
      }
    }

    return lines.join('\n');
  }

  getConfig(executionId) {
    return this.configCache.get(executionId);
  }

  listConfigurations() {
    return Array.from(this.configCache.values()).map(c => ({
      id: c.executionId,
      services: c.summary.services,
      dockerfiles: c.summary.dockerfilesGenerated
    }));
  }

  async _onCleanup() {
    // Cleanup if needed
  }
}

export default DockerSpecialistAgent;
