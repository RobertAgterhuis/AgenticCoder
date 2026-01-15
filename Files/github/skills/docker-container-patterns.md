# Skill: Docker Container Patterns (@docker-container-patterns)

## Metadata

```yaml
name: docker-container-patterns
agents: ["@docker-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Docker Container Patterns** skill provides comprehensive Dockerfile patterns and configurations for different application types, languages, and deployment scenarios.

## Scope

**Included**:
- Language-specific Dockerfiles (Node.js, Python, Java, Go, .NET, Ruby, PHP)
- Framework-specific optimizations
- Multi-stage build patterns
- Database integration patterns
- Health check implementations
- Entrypoint scripts

**Excluded**:
- Image optimization (see docker-optimization skill)
- Container orchestration (see kubernetes skills)
- Registry management and scanning

---

## Pattern 1: Node.js Express API

```dockerfile
# Development Stage
FROM node:18-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

---

# Production Stage
FROM node:18-alpine AS prod
WORKDIR /app
RUN apk add --no-cache tini
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --chown=nodejs:nodejs . .
USER nodejs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s CMD node healthcheck.js || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

**Key Points**:
- `npm ci` for reproducible builds
- `--only=production` removes dev dependencies
- Non-root user for security
- Tini for proper signal handling
- Health check for orchestration

---

## Pattern 2: Python FastAPI

```dockerfile
FROM python:3.11-slim AS builder

WORKDIR /build
RUN pip install --user --no-cache-dir poetry
COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.in-project true && \
    poetry install --no-dev --no-interaction

---

FROM python:3.11-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PATH="/app/.venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/.venv /app/.venv

COPY . .

RUN addgroup --system fastapi && adduser --system --group fastapi
USER fastapi

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Features**:
- Poetry for dependency management
- Slim image base (Python 3.11)
- curl for health checks
- Non-root user
- Graceful health endpoint

---

## Pattern 3: Java Spring Boot

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline

COPY . .
RUN mvn clean package -DskipTests

---

FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Add user
RUN addgroup -g 1001 spring && adduser -u 1001 -D -G spring spring

# Copy JAR from builder
COPY --from=builder /build/target/*.jar app.jar
COPY --from=builder /build/src/main/resources/application.yml ./

RUN chown -R spring:spring /app

# JVM optimization
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:InitiatingHeapOccupancyPercent=35 -XX:+UseStringDeduplication"

USER spring

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
```

**Optimizations**:
- Maven layer caching
- Alpine base image
- G1GC for efficient memory
- Spring Boot Actuator health endpoint
- User-based security

---

## Pattern 4: Go Gin API (Minimal)

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o app .

---

FROM scratch

COPY --from=builder /build/app .
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD [ "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/health" ]

CMD ["./app"]
```

**Ultra-Minimal**:
- `scratch` base (only compiled binary)
- Final size: ~10-15MB
- No OS dependencies
- Lightning fast startup

---

## Pattern 5: .NET Core ASP.NET

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS builder

WORKDIR /build
COPY *.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app

---

FROM mcr.microsoft.com/dotnet/aspnet:7.0

WORKDIR /app
RUN groupadd -g 1001 dotnet && useradd -u 1001 -G dotnet dotnet

COPY --from=builder /app .
RUN chown -R dotnet:dotnet /app

USER dotnet

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:5000/health || exit 1

ENV ASPNETCORE_URLS=http://+:5000 ASPNETCORE_ENVIRONMENT=Production
CMD ["dotnet", "MyApp.dll"]
```

---

## Pattern 6: Database with Entrypoint

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Entrypoint script
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh && \
    adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s CMD python -m ping || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "wsgi:app"]
```

**entrypoint.sh**:
```bash
#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "PostgreSQL started"

echo "Running migrations..."
alembic upgrade head

echo "Starting application..."
exec "$@"
```

---

## Pattern 7: Docker Compose (Development)

```yaml
version: '3.9'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/appdb
      NODE_ENV: development
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 3s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
```

---

## Pattern 8: Multi-Architecture Build

```dockerfile
# Build for multiple architectures
FROM --platform=$BUILDPLATFORM golang:1.21-alpine AS builder

ARG TARGETARCH
ARG TARGETOS

WORKDIR /build
COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -o app .

FROM alpine:latest

COPY --from=builder /build/app .
CMD ["./app"]
```

**Build Command**:
```bash
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .
```

---

## Anti-Patterns to Avoid

### ❌ Large Base Images

```dockerfile
# BAD
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y node npm

# GOOD
FROM node:18-alpine
```

### ❌ Layering Large Files

```dockerfile
# BAD
COPY . .
RUN rm -rf node_modules

# GOOD
COPY package*.json ./
RUN npm ci
COPY . .
```

### ❌ Running as Root

```dockerfile
# BAD
RUN npm start

# GOOD
RUN adduser -S appuser
USER appuser
CMD ["npm", "start"]
```

### ❌ No Health Checks

```dockerfile
# GOOD
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
```

---

## Configuration Best Practices

1. **Order by Frequency of Change**: Keep stable dependencies early, changing code last
2. **Minimize Layers**: Combine RUN commands with `&&` to reduce layer count
3. **Use .dockerignore**: Exclude unnecessary files (node_modules, .git, etc.)
4. **Stage Names**: Use descriptive names (builder, test, runtime, etc.)
5. **Environment Variables**: Set defaults but allow overrides
6. **Health Checks**: Always implement them for orchestration

---

## Related Documentation

- Skill: `docker-optimization.md` - Image optimization techniques
- Agent: `docker-specialist.md` - Containerization agent

## Version History

- **1.0.0** (2026-01-13): Initial Docker container patterns
