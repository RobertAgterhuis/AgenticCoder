/**
 * MicroservicesGenerator - Microservices Architecture Generator
 * 
 * Generates Docker Compose configurations, API Gateway configs,
 * service definitions, and Kubernetes manifests.
 */

const BaseGenerator = require('./BaseGenerator');

class MicroservicesGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'MicroservicesGenerator',
      framework: 'microservices',
      version: 'latest',
      language: 'yaml',
      ...options
    });
    
    this.templatePath = 'architecture/microservices';
    this.supportedTypes = ['dockerCompose', 'apiGateway', 'service', 'kubernetes'];
  }

  /**
   * Generate Docker Compose configuration
   */
  async generateDockerCompose(context) {
    const { 
      projectName,
      services = [],
      networks = [],
      volumes = [],
      version = '3.8'
    } = context;
    
    const templateData = {
      version,
      services: this.buildServices(services),
      networks: this.buildNetworks(networks, services),
      volumes: this.buildVolumes(volumes, services)
    };
    
    return this.generateDockerComposeYaml(templateData);
  }

  /**
   * Generate API Gateway configuration
   */
  async generateApiGateway(context) {
    const { 
      type = 'nginx',
      routes = [],
      rateLimit,
      cors,
      auth
    } = context;
    
    const templateData = {
      type,
      routes: this.buildRoutes(routes),
      rateLimit,
      cors: this.buildCorsConfig(cors),
      auth: this.buildAuthConfig(auth)
    };
    
    if (type === 'nginx') {
      return this.generateNginxConfig(templateData);
    } else if (type === 'envoy') {
      return this.generateEnvoyConfig(templateData);
    } else if (type === 'traefik') {
      return this.generateTraefikConfig(templateData);
    }
    
    return this.generateGenericGatewayConfig(templateData);
  }

  /**
   * Generate a microservice definition
   */
  async generateService(context) {
    const { 
      name,
      image,
      ports = [],
      environment = {},
      volumes = [],
      depends = [],
      healthCheck,
      replicas = 1
    } = context;
    
    const templateData = {
      name: this.toKebabCase(name),
      image,
      ports: this.buildPorts(ports),
      environment: this.buildEnvironment(environment),
      volumes: this.buildServiceVolumes(volumes),
      depends,
      healthCheck: this.buildHealthCheck(healthCheck),
      replicas
    };
    
    return templateData;
  }

  /**
   * Generate Kubernetes manifests
   */
  async generateKubernetes(context) {
    const { 
      name,
      namespace = 'default',
      type = 'deployment',
      replicas = 1,
      image,
      ports = [],
      environment = {},
      resources = {},
      probes = {}
    } = context;
    
    const templateData = {
      name: this.toKebabCase(name),
      namespace,
      replicas,
      image,
      ports: this.buildPorts(ports),
      environment: this.buildK8sEnv(environment),
      resources: this.buildResources(resources),
      probes: this.buildProbes(probes)
    };
    
    switch (type) {
      case 'deployment':
        return this.generateK8sDeployment(templateData);
      case 'service':
        return this.generateK8sService(templateData);
      case 'ingress':
        return this.generateK8sIngress(templateData);
      case 'configmap':
        return this.generateK8sConfigMap(templateData);
      case 'secret':
        return this.generateK8sSecret(templateData);
      default:
        return this.generateK8sDeployment(templateData);
    }
  }

  // YAML generation methods
  generateDockerComposeYaml(data) {
    const lines = [];
    
    lines.push(`version: '${data.version}'`);
    lines.push('');
    lines.push('services:');
    
    for (const service of data.services) {
      lines.push(`  ${service.name}:`);
      if (service.build) {
        lines.push(`    build:`);
        lines.push(`      context: ${service.build.context || '.'}`);
        if (service.build.dockerfile) {
          lines.push(`      dockerfile: ${service.build.dockerfile}`);
        }
      } else if (service.image) {
        lines.push(`    image: ${service.image}`);
      }
      
      if (service.container_name) {
        lines.push(`    container_name: ${service.container_name}`);
      }
      
      if (service.ports?.length) {
        lines.push('    ports:');
        for (const port of service.ports) {
          lines.push(`      - "${port}"`);
        }
      }
      
      if (Object.keys(service.environment || {}).length) {
        lines.push('    environment:');
        for (const [key, value] of Object.entries(service.environment)) {
          lines.push(`      ${key}: ${value}`);
        }
      }
      
      if (service.volumes?.length) {
        lines.push('    volumes:');
        for (const vol of service.volumes) {
          lines.push(`      - ${vol}`);
        }
      }
      
      if (service.depends_on?.length) {
        lines.push('    depends_on:');
        for (const dep of service.depends_on) {
          if (typeof dep === 'string') {
            lines.push(`      - ${dep}`);
          } else {
            lines.push(`      ${dep.name}:`);
            lines.push(`        condition: ${dep.condition}`);
          }
        }
      }
      
      if (service.healthcheck) {
        lines.push('    healthcheck:');
        lines.push(`      test: ${JSON.stringify(service.healthcheck.test)}`);
        if (service.healthcheck.interval) lines.push(`      interval: ${service.healthcheck.interval}`);
        if (service.healthcheck.timeout) lines.push(`      timeout: ${service.healthcheck.timeout}`);
        if (service.healthcheck.retries) lines.push(`      retries: ${service.healthcheck.retries}`);
      }
      
      if (service.networks?.length) {
        lines.push('    networks:');
        for (const net of service.networks) {
          lines.push(`      - ${net}`);
        }
      }
      
      if (service.restart) {
        lines.push(`    restart: ${service.restart}`);
      }
      
      lines.push('');
    }
    
    if (data.networks?.length) {
      lines.push('networks:');
      for (const net of data.networks) {
        lines.push(`  ${net.name}:`);
        if (net.driver) lines.push(`    driver: ${net.driver}`);
        if (net.external) lines.push(`    external: true`);
      }
      lines.push('');
    }
    
    if (data.volumes?.length) {
      lines.push('volumes:');
      for (const vol of data.volumes) {
        lines.push(`  ${vol.name}:`);
        if (vol.driver) lines.push(`    driver: ${vol.driver}`);
        if (vol.external) lines.push(`    external: true`);
      }
    }
    
    return lines.join('\n');
  }

  generateNginxConfig(data) {
    const lines = [];
    
    lines.push('# NGINX API Gateway Configuration');
    lines.push('# Generated by AgenticCoder');
    lines.push('');
    lines.push('upstream backend {');
    
    for (const route of data.routes) {
      if (route.upstream) {
        lines.push(`    server ${route.upstream};`);
      }
    }
    
    lines.push('}');
    lines.push('');
    lines.push('server {');
    lines.push('    listen 80;');
    lines.push('    server_name localhost;');
    lines.push('');
    
    if (data.cors) {
      lines.push('    # CORS Configuration');
      lines.push(`    add_header Access-Control-Allow-Origin "${data.cors.origin || '*'}";`);
      lines.push(`    add_header Access-Control-Allow-Methods "${data.cors.methods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS'}";`);
      lines.push(`    add_header Access-Control-Allow-Headers "${data.cors.headers?.join(', ') || 'Content-Type, Authorization'}";`);
      lines.push('');
    }
    
    if (data.rateLimit) {
      lines.push('    # Rate Limiting');
      lines.push(`    limit_req_zone $binary_remote_addr zone=api:${data.rateLimit.zone || '10m'} rate=${data.rateLimit.rate || '10r/s'};`);
      lines.push('');
    }
    
    for (const route of data.routes) {
      lines.push(`    location ${route.path} {`);
      if (route.upstream) {
        lines.push(`        proxy_pass http://${route.upstream};`);
        lines.push('        proxy_http_version 1.1;');
        lines.push('        proxy_set_header Upgrade $http_upgrade;');
        lines.push('        proxy_set_header Connection "upgrade";');
        lines.push('        proxy_set_header Host $host;');
        lines.push('        proxy_set_header X-Real-IP $remote_addr;');
      }
      if (data.rateLimit) {
        lines.push(`        limit_req zone=api burst=${data.rateLimit.burst || 20};`);
      }
      lines.push('    }');
      lines.push('');
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  generateTraefikConfig(data) {
    const config = {
      http: {
        routers: {},
        services: {},
        middlewares: {}
      }
    };
    
    for (const route of data.routes) {
      const routeName = this.toKebabCase(route.name || route.path.replace(/\//g, '-'));
      
      config.http.routers[routeName] = {
        rule: `PathPrefix(\`${route.path}\`)`,
        service: routeName,
        middlewares: []
      };
      
      config.http.services[routeName] = {
        loadBalancer: {
          servers: [{ url: route.upstream }]
        }
      };
    }
    
    if (data.rateLimit) {
      config.http.middlewares.rateLimit = {
        rateLimit: {
          average: data.rateLimit.average || 100,
          burst: data.rateLimit.burst || 50
        }
      };
    }
    
    return this.toYaml(config);
  }

  generateEnvoyConfig(data) {
    // Simplified Envoy config
    const config = {
      static_resources: {
        listeners: [{
          address: { socket_address: { address: '0.0.0.0', port_value: 8080 } },
          filter_chains: [{
            filters: [{
              name: 'envoy.filters.network.http_connection_manager',
              typed_config: {
                '@type': 'type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager',
                stat_prefix: 'ingress_http',
                route_config: {
                  name: 'local_route',
                  virtual_hosts: [{
                    name: 'backend',
                    domains: ['*'],
                    routes: data.routes.map(r => ({
                      match: { prefix: r.path },
                      route: { cluster: r.name }
                    }))
                  }]
                }
              }
            }]
          }]
        }],
        clusters: data.routes.map(r => ({
          name: r.name,
          connect_timeout: '0.25s',
          type: 'STRICT_DNS',
          load_assignment: {
            cluster_name: r.name,
            endpoints: [{
              lb_endpoints: [{
                endpoint: {
                  address: {
                    socket_address: {
                      address: r.upstream?.split(':')[0] || 'localhost',
                      port_value: parseInt(r.upstream?.split(':')[1]) || 8080
                    }
                  }
                }
              }]
            }]
          }
        }))
      }
    };
    
    return this.toYaml(config);
  }

  generateGenericGatewayConfig(data) {
    return JSON.stringify(data, null, 2);
  }

  generateK8sDeployment(data) {
    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: data.name,
        namespace: data.namespace,
        labels: { app: data.name }
      },
      spec: {
        replicas: data.replicas,
        selector: { matchLabels: { app: data.name } },
        template: {
          metadata: { labels: { app: data.name } },
          spec: {
            containers: [{
              name: data.name,
              image: data.image,
              ports: data.ports.map(p => ({ containerPort: typeof p === 'object' ? p.container : parseInt(p.split(':')[1] || p) })),
              env: data.environment,
              resources: data.resources,
              ...data.probes
            }]
          }
        }
      }
    };
    
    return this.toYaml(deployment);
  }

  generateK8sService(data) {
    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: data.name,
        namespace: data.namespace
      },
      spec: {
        selector: { app: data.name },
        ports: data.ports.map(p => ({
          port: typeof p === 'object' ? p.service : parseInt(p.split(':')[0]),
          targetPort: typeof p === 'object' ? p.container : parseInt(p.split(':')[1] || p.split(':')[0])
        })),
        type: 'ClusterIP'
      }
    };
    
    return this.toYaml(service);
  }

  generateK8sIngress(data) {
    const ingress = {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: `${data.name}-ingress`,
        namespace: data.namespace
      },
      spec: {
        rules: [{
          http: {
            paths: [{
              path: '/',
              pathType: 'Prefix',
              backend: {
                service: {
                  name: data.name,
                  port: { number: data.ports[0]?.service || 80 }
                }
              }
            }]
          }
        }]
      }
    };
    
    return this.toYaml(ingress);
  }

  generateK8sConfigMap(data) {
    const configMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${data.name}-config`,
        namespace: data.namespace
      },
      data: Object.fromEntries(data.environment.map(e => [e.name, e.value]))
    };
    
    return this.toYaml(configMap);
  }

  generateK8sSecret(data) {
    const secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: `${data.name}-secret`,
        namespace: data.namespace
      },
      type: 'Opaque',
      data: {}
    };
    
    return this.toYaml(secret);
  }

  // Helper methods
  buildServices(services) {
    return services.map(s => ({
      name: this.toKebabCase(s.name),
      image: s.image,
      build: s.build,
      container_name: s.containerName,
      ports: s.ports,
      environment: s.environment || {},
      volumes: s.volumes || [],
      depends_on: s.depends || [],
      healthcheck: s.healthCheck,
      networks: s.networks || ['default'],
      restart: s.restart || 'unless-stopped'
    }));
  }

  buildNetworks(networks, services) {
    if (networks.length > 0) return networks;
    return [{ name: 'default', driver: 'bridge' }];
  }

  buildVolumes(volumes, services) {
    const allVolumes = [...volumes];
    for (const service of services) {
      for (const vol of service.volumes || []) {
        if (typeof vol === 'string' && vol.includes(':')) {
          const volName = vol.split(':')[0];
          if (!volName.startsWith('.') && !volName.startsWith('/')) {
            if (!allVolumes.find(v => v.name === volName)) {
              allVolumes.push({ name: volName });
            }
          }
        }
      }
    }
    return allVolumes;
  }

  buildRoutes(routes) {
    return routes.map(r => ({
      name: r.name || this.toKebabCase(r.path),
      path: r.path,
      upstream: r.upstream || r.service,
      methods: r.methods || ['GET', 'POST', 'PUT', 'DELETE'],
      auth: r.auth
    }));
  }

  buildCorsConfig(cors) {
    if (!cors) return null;
    return {
      origin: cors.origin || '*',
      methods: cors.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: cors.headers || ['Content-Type', 'Authorization']
    };
  }

  buildAuthConfig(auth) {
    if (!auth) return null;
    return {
      type: auth.type || 'jwt',
      ...auth
    };
  }

  buildPorts(ports) {
    return ports.map(p => {
      if (typeof p === 'object') return `${p.host}:${p.container}`;
      return p.toString();
    });
  }

  buildEnvironment(env) {
    return env;
  }

  buildServiceVolumes(volumes) {
    return volumes;
  }

  buildHealthCheck(healthCheck) {
    if (!healthCheck) return null;
    return {
      test: healthCheck.test || ['CMD', 'curl', '-f', 'http://localhost/health'],
      interval: healthCheck.interval || '30s',
      timeout: healthCheck.timeout || '10s',
      retries: healthCheck.retries || 3
    };
  }

  buildK8sEnv(env) {
    return Object.entries(env).map(([name, value]) => ({ name, value: String(value) }));
  }

  buildResources(resources) {
    return {
      requests: {
        memory: resources.memory?.request || '64Mi',
        cpu: resources.cpu?.request || '100m'
      },
      limits: {
        memory: resources.memory?.limit || '128Mi',
        cpu: resources.cpu?.limit || '500m'
      }
    };
  }

  buildProbes(probes) {
    const result = {};
    
    if (probes.liveness) {
      result.livenessProbe = {
        httpGet: { path: probes.liveness.path || '/health', port: probes.liveness.port || 8080 },
        initialDelaySeconds: probes.liveness.initialDelay || 15,
        periodSeconds: probes.liveness.period || 20
      };
    }
    
    if (probes.readiness) {
      result.readinessProbe = {
        httpGet: { path: probes.readiness.path || '/ready', port: probes.readiness.port || 8080 },
        initialDelaySeconds: probes.readiness.initialDelay || 5,
        periodSeconds: probes.readiness.period || 10
      };
    }
    
    return result;
  }

  toYaml(obj, indent = 0) {
    // Simple YAML serializer
    const spaces = '  '.repeat(indent);
    let result = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      if (Array.isArray(value)) {
        result += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            result += `${spaces}- `;
            const itemYaml = this.toYaml(item, 0).split('\n');
            result += itemYaml[0] + '\n';
            for (let i = 1; i < itemYaml.length; i++) {
              if (itemYaml[i]) result += `${spaces}  ${itemYaml[i]}\n`;
            }
          } else {
            result += `${spaces}- ${item}\n`;
          }
        }
      } else if (typeof value === 'object') {
        result += `${spaces}${key}:\n`;
        result += this.toYaml(value, indent + 1);
      } else {
        result += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return result;
  }
}

module.exports = MicroservicesGenerator;
