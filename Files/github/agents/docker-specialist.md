# Agent: Docker Containerization Specialist (@docker-specialist)

**Classification**: DevOps & Containerization  
**Phase**: 15 (Infrastructure & Containerization)  
**Tier**: Implementation (Conditional)  
**Status**: ✅ Complete Specification  

---

## Agent Purpose

The **Docker Containerization Specialist** generates production-ready Docker configurations for containerizing applications across multiple languages and frameworks. It creates multi-stage Dockerfiles optimized for security, performance, and minimal image sizes.

**Primary Responsibility**: Generate Dockerfile(s) with best practices, container orchestration readiness, and environment-specific configurations.

---

## When This Agent Activates

| Trigger | Condition |
|---------|-----------|
| **Automatic** | When @code-architect output includes `requires_containerization == true` |
| **Explicit** | When user specifies containerization as deployment requirement |
| **Implicit** | When using Kubernetes/container orchestration platforms |

### Activation Decision Logic

```
IF @code-architect.status == "success"
AND (requires_containerization == true
     OR deployment_platform IN ["Docker", "Kubernetes", "ECS", "AKS"])
THEN activate @docker-specialist (Phase 12)
```

---

## Input Specification

```json
{
  "projectName": "string",
  "framework": "string (express, fastapi, spring-boot, etc.)",
  "language": "string (javascript, python, java, go, etc.)",
  "baseImage": "string (optional, defaults to language-specific)",
  "ports": [8000, 3000],
  "environment": {
    "NODE_ENV": "production",
    "LOG_LEVEL": "info"
  },
  "healthCheck": {
    "enabled": true,
    "endpoint": "/health",
    "interval": 30
  },
  "optimization": {
    "multi_stage": true,
    "layer_caching": true,
    "min_image_size": true
  },
  "security": {
    "non_root_user": true,
    "read_only_fs": false,
    "secrets_management": "environment_variables"
  }
}
```

---

## Output Specification

```json
{
  "dockerfile": "string (complete Dockerfile content)",
  "dockerCompose": "string (docker-compose.yml for local development)",
  "dockerignore": "string (.dockerignore file)",
  "entrypoint": "string (entrypoint.sh script if needed)",
  "healthCheck": {
    "type": "HTTP|CMD|HEALTHCHECK instruction",
    "command": "string",
    "interval": 30,
    "timeout": 5,
    "retries": 3
  },
  "images": {
    "base": "node:18-alpine (example)",
    "final": "node:18-alpine-slim (optimized)"
  },
  "optimizations": [
    "Multi-stage build reduces final image by 60%",
    "Alpine base reduces from 900MB to 150MB",
    "Layer caching enables faster rebuilds"
  ],
  "securityRecommendations": [
    "Run container as non-root user",
    "Use read-only filesystem where possible",
    "Scan image with Trivy/Grype before deployment"
  ],
  "buildInstructions": {
    "local": "docker build -t myapp:latest .",
    "production": "docker build --no-cache -t myapp:v1.0.0 .",
    "push": "docker push myregistry.azurecr.io/myapp:v1.0.0"
  }
}
```

---

## Supported Technologies

### Languages & Frameworks

| Language | Frameworks | Base Images |
|----------|-----------|-------------|
| **Node.js** | Express, Fastify, NestJS | node:18-alpine, node:20-slim |
| **Python** | FastAPI, Django, Flask | python:3.11-slim, python:3.11-alpine |
| **Java** | Spring Boot, Quarkus | eclipse-temurin:17-jdk-alpine, amazoncorretto:17 |
| **Go** | Gin, Echo | golang:1.21-alpine, golang:1.21-slim |
| **C#/.NET** | ASP.NET Core | mcr.microsoft.com/dotnet/aspnet:7.0 |
| **Ruby** | Rails, Sinatra | ruby:3.2-alpine, ruby:3.2-slim |
| **PHP** | Laravel, Symfony | php:8.2-fpm-alpine, php:8.2-apache |

### Deployment Targets

- Docker (local & registry)
- Docker Compose (multi-container)
- Kubernetes (with health checks, resource limits)
- Azure Container Instances (ACI)
- AWS ECS/Fargate
- Google Cloud Run
- Self-hosted container platforms

---

## Key Features

### 1. Multi-Stage Builds

```dockerfile
# Stage 1: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Benefits**:
- Reduces final image by 50-80%
- Separates build tools from runtime
- Improves security (no build dependencies in production)

### 2. Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js || exit 1
```

**Ensures**:
- Container health validation
- Automatic restart of failed containers
- Orchestration platform visibility

### 3. Security Hardening

```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy with correct ownership
COPY --chown=nodejs:nodejs --from=builder /app/dist ./

USER nodejs
```

**Protects Against**:
- Privilege escalation
- Unauthorized access
- Container escape attacks

### 4. Optimization Strategies

| Strategy | Benefit | Implementation |
|----------|---------|-----------------|
| **Alpine Base** | 50% smaller images | `FROM node:18-alpine` |
| **Layer Caching** | Faster rebuilds | Order Dockerfile by change frequency |
| **Dependency Separation** | Smaller final layer | Install only production deps |
| **.dockerignore** | Reduce build context | Exclude node_modules, .git, etc. |
| **Build Cache** | Faster CI/CD | Use `--cache-from` in pipelines |

---

## Generated Artifacts

### 1. Dockerfile
- Multi-stage build configuration
- Health checks configured
- Security best practices applied
- Optimized for target framework

### 2. docker-compose.yml
- Local development setup
- Database service integration (if needed)
- Volume mounts for hot reload
- Environment variable management

### 3. .dockerignore
- Standard patterns for language/framework
- Reduces build context size
- Improves build performance

### 4. Entrypoint Script (if needed)
- Environment variable handling
- Database migration execution
- Graceful shutdown handling

### 5. Build Instructions
- Local development build
- Production build with caching
- Registry push commands
- Multi-architecture builds (arm64, amd64)

---

## Configuration Patterns

### Pattern 1: Development Mode

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**Use When**: Local development, fast iteration needed

---

### Pattern 2: Production Optimized

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN addgroup -g 1001 nodejs && adduser -u 1001 -S nodejs nodejs
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --chown=nodejs:nodejs --from=builder /app/dist ./dist
USER nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD node healthcheck.js
CMD ["node", "dist/index.js"]
```

**Benefits**:
- Minimal image size
- Security hardened
- Health checks built-in
- Fast restart capability

---

### Pattern 3: Database Integration

```dockerfile
FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Wait for DB and run migrations
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "main:app"]
```

---

### Pattern 4: Microservices Ready

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

FROM scratch
COPY --from=builder /app/app .
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080
CMD ["./app"]
```

**Size**: ~10MB (minimal runtime)

---

## Related Skills

- **@docker-container-patterns** - Container design patterns and configurations
- **@docker-optimization** - Image optimization, caching, and performance

---

## Skill Integration

### Uses Skills

| Skill | Purpose | Inputs |
|-------|---------|--------|
| `@docker-container-patterns` | Generate Dockerfile patterns | framework, language, use_case |
| `@docker-optimization` | Optimize image size & performance | current_dockerfile, target_size |

### Outputs To

- **Deployment Phase**: Container images ready for registry push
- **Kubernetes Agent** (F13): Deployment manifests using generated images
- **CI/CD Agent**: Docker build steps in pipeline

---

## Success Metrics

✅ **Image Size**: < 200MB for most applications (< 100MB for Go/Alpine)
✅ **Build Time**: < 2 minutes for typical builds (with layer caching)
✅ **Security Scan**: 0 critical vulnerabilities
✅ **Health Checks**: Working within 10 seconds of container start
✅ **Startup Time**: < 5 seconds for production images

---

## Version History

- **1.0.0** (2026-01-13): Initial Docker Containerization Specialist
  - Multi-stage build generation
  - Health check configuration
  - Security hardening
  - Framework-specific optimizations
