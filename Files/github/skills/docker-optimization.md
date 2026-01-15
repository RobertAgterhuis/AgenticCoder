# Skill: Docker Optimization (@docker-optimization)

## Metadata

```yaml
name: docker-optimization
agents: ["@docker-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Docker Optimization** skill provides techniques for reducing Docker image sizes, improving build performance, and optimizing runtime efficiency.

## Scope

**Included**:
- Image size reduction strategies
- Layer caching optimization
- Build performance tuning
- Security scanning integration
- Registry push optimization

**Excluded**:
- Dockerfile pattern generation (see docker-container-patterns)
- Orchestration scaling (see kubernetes skills)

---

## Optimization Strategy 1: Multi-Stage Build Size Reduction

### Before (Single Stage)
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# Result: ~900MB
```

### After (Multi-Stage)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]

# Result: ~150MB (83% reduction!)
```

**Size Breakdown**:
- Base image (node:18-alpine): 170MB
- Dependencies: ~80MB (optimized)
- App code: ~5MB
- Build artifacts excluded: ~705MB saved

---

## Optimization Strategy 2: Alpine Base Images

### Image Size Comparison

| Base Image | Size | Use Case |
|-----------|------|----------|
| ubuntu:22.04 | 77MB | Full OS, rarely needed |
| debian:11-slim | 69MB | Some system tools needed |
| node:18 | 900MB | Node.js with npm, bower, etc. |
| node:18-slim | 200MB | Node.js with slim deps |
| node:18-alpine | 170MB | Node.js minimal, best choice |
| node:18-alpine (node-gyp free) | 120MB | Pure JavaScript apps |

### Recommendation Matrix

| Use Case | Recommended | Size | Reason |
|----------|------------|------|--------|
| Node.js API | node:18-alpine | 170MB | Stable, widely tested |
| Python ML | python:3.11-slim | 130MB | Scientific packages work |
| Go API | golang:1.21-alpine | 380MB (build), scratch 10MB | Compile to binary |
| Java API | eclipse-temurin:17-alpine | 280MB | JVM requires Alpine |
| .NET | mcr.microsoft.com/dotnet/aspnet:7.0 | 200MB | MS optimized |

---

## Optimization Strategy 3: Layer Caching

### Principle: Stable Dependencies First

```dockerfile
# Order matters!

# Stage 1: STABLE - changes rarely, cache well
FROM node:18-alpine
WORKDIR /app

# This layer caches unless package.json changes
COPY package*.json ./
RUN npm ci

# Stage 2: SEMI-STABLE - changes occasionally
COPY tsconfig.json webpack.config.js ./

# Stage 3: VOLATILE - changes frequently, invalidates cache
COPY src/ ./src/
RUN npm run build
```

### Cache Hit Example

**Iteration 1**: Full build
```
Step 1/5: FROM node:18-alpine               1.2s  (pull)
Step 2/5: COPY package*.json ./             0.1s  
Step 3/5: RUN npm ci                        15s   (install 150 packages)
Step 4/5: COPY src/ ./src/                  0.1s  
Step 5/5: RUN npm run build                 8s    
Total: 24s
```

**Iteration 2**: Changed only src files
```
Step 1/5: FROM node:18-alpine               cached
Step 2/5: COPY package*.json ./             cached
Step 3/5: RUN npm ci                        cached  (10s saved!)
Step 4/5: COPY src/ ./src/                  0.1s
Step 5/5: RUN npm run build                 8s
Total: 8s  (67% faster!)
```

---

## Optimization Strategy 4: .dockerignore

### Effective .dockerignore Patterns

```
# Git
.git
.gitignore
.gitattributes

# Node.js
node_modules/
npm-debug.log*
.npm

# Python
__pycache__/
*.py[cod]
*$py.class
*.egg-info/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# CI/CD
.github/
.gitlab-ci.yml
.travis.yml

# Misc
README.md
LICENSE
.env*
secrets/
```

### Impact on Build Context

| Without .dockerignore | With .dockerignore | Reduction |
|----------------------|------------------|-----------|
| ~500MB (node_modules) | ~50MB | 90% smaller |
| 2-3s to send context | 0.3s | 7x faster |

---

## Optimization Strategy 5: Dependency Cleanup

### Node.js Package Cleanup

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install only
RUN npm ci

# Prune devDependencies
RUN npm prune --production

# Optional: Clean npm cache (saves ~50MB)
RUN npm cache clean --force

# Verify final size
# Original: 280MB → After: 95MB (66% reduction)

COPY . .
CMD ["node", "dist/index.js"]
```

### Python Dependencies

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Using Poetry with virtual environment
COPY pyproject.toml poetry.lock ./
RUN pip install --user --no-cache-dir poetry && \
    poetry config virtualenvs.in-project true && \
    poetry install --no-dev --no-interaction

# Using pip with requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Clean pip cache
RUN find /usr/local -name "*.pyc" -delete && \
    find /usr/local -name "__pycache__" -delete
```

---

## Optimization Strategy 6: Build Arguments for Size Control

```dockerfile
FROM node:18-alpine AS builder
ARG BUILD_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:${BUILD_ENV}

FROM node:18-alpine
ARG INCLUDE_SOURCE_MAPS=false
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

# Optional: Include source maps only in development
RUN if [ "$INCLUDE_SOURCE_MAPS" = "true" ]; then \
    COPY --from=builder /app/dist/*.map ./dist/; \
    fi

CMD ["node", "dist/index.js"]
```

**Build Commands**:
```bash
# Production (no source maps)
docker build -t myapp:prod .

# Development (with source maps)
docker build --build-arg INCLUDE_SOURCE_MAPS=true -t myapp:dev .
```

---

## Optimization Strategy 7: Image Scanning & Hardening

### Multi-Step Security Pipeline

```dockerfile
# Step 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2: Security scan (integrate Trivy/Grype)
FROM builder AS security-scan
RUN npm audit --production --audit-level=moderate || true

# Step 3: Final image
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache tini curl
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

RUN addgroup -g 1001 nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:3000/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

---

## Optimization Strategy 8: Build Performance Tuning

### Parallel Stage Building

```dockerfile
# builder1: Compile backend
FROM golang:1.21-alpine AS builder1
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY cmd/api ./cmd/api
RUN go build -o api ./cmd/api

# builder2: Bundle frontend (runs in parallel)
FROM node:18-alpine AS builder2
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Final stage: Combine both
FROM alpine:latest
COPY --from=builder1 /build/api ./api
COPY --from=builder2 /build/dist ./www
CMD ["./api"]
```

---

## Optimization Strategy 9: Registry-Level Optimization

### Layer Compression

```bash
# Enable compression for faster pulls
docker push myregistry.azurecr.io/myapp:v1.0.0

# Monitor registry size
az acr repository show-manifests \
  --repository myapp \
  --registry myregistry
```

### Image Tagging Strategy

```bash
# Semantic versioning
docker tag myapp:build-123 myapp:v1.0.0
docker tag myapp:build-123 myapp:latest

# Multi-tag push (reuses layers)
docker push myapp:v1.0.0
docker push myapp:latest  # Fast! Same layers
```

---

## Optimization Checklist

- [ ] Use Alpine base images (saves 60-70%)
- [ ] Multi-stage builds (saves 30-50%)
- [ ] .dockerignore patterns (saves 80%+ context)
- [ ] Order Dockerfile by stability (improves cache)
- [ ] Remove dev dependencies (saves 20-40%)
- [ ] Clean package manager caches (saves 5-10%)
- [ ] Non-root user (security + smallest footprint)
- [ ] Health checks (no overhead, orchestration ready)
- [ ] Security scanning (Trivy/Grype integration)
- [ ] Build argument flexibility (reduce rebuilds)

---

## Size Optimization Results

### Real-World Example: Node.js API

| Version | Size | Build Time | Security Issues |
|---------|------|-----------|-----------------|
| Unoptimized | 900MB | 45s | 12 vulnerabilities |
| Alpine base | 170MB | 40s | 12 vulnerabilities |
| Multi-stage | 85MB | 40s | 12 vulnerabilities |
| Deps pruned | 65MB | 42s | 0 vulnerabilities |
| Hardened | 65MB | 45s | 0 vulnerabilities |
| **Total gain** | **93% smaller** | **Same speed** | **Secure** |

---

## Related Documentation

- Skill: `docker-container-patterns.md` - Dockerfile patterns
- Agent: `docker-specialist.md` - Containerization agent

## Version History

- **1.0.0** (2026-01-13): Initial Docker optimization skill
