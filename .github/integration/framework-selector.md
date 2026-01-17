# Framework Selector

## Overview

This document defines the logic for automatic framework and technology selection based on project requirements.

---

## Selection Decision Trees

### Frontend Framework Selection

```
                    ┌─────────────────────┐
                    │ Frontend Required?  │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   SEO Critical?     │
                    └─────────┬───────────┘
                        Yes   │   No
                    ┌─────────┴───────────┐
                    │                     │
            ┌───────▼───────┐     ┌───────▼───────┐
            │   Next.js     │     │ Enterprise?   │
            │    (SSR)      │     │ Large Team?   │
            └───────────────┘     └───────┬───────┘
                                    Yes   │   No
                                  ┌───────┴───────┐
                                  │               │
                          ┌───────▼───────┐ ┌─────▼─────┐
                          │   Angular     │ │ SPA Type? │
                          └───────────────┘ └─────┬─────┘
                                            Simple│Complex
                                          ┌───────┴───────┐
                                          │               │
                                  ┌───────▼───────┐ ┌─────▼─────┐
                                  │     Vue       │ │   React   │
                                  │   (Default)   │ │           │
                                  └───────────────┘ └───────────┘
```

### Frontend Selection Rules

| Condition | Framework | Rationale |
|-----------|-----------|-----------|
| SSR/SEO required | Next.js | Built-in SSR, ISR, SEO optimization |
| Enterprise/large team | Angular | Strong typing, dependency injection, opinionated |
| Simple SPA | Vue | Easy learning curve, great developer experience |
| Complex SPA (default) | React | Large ecosystem, flexibility, hiring pool |
| Static site with interactivity | Next.js | Static export + hydration |
| Rapid prototyping | Vue | Fastest development cycle |
| Microsoft ecosystem | React | Common pairing with .NET backends |

---

### Backend Framework Selection

```
                    ┌─────────────────────┐
                    │   Backend Needed?   │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │  Microsoft Stack?   │
                    └─────────┬───────────┘
                        Yes   │   No
                    ┌─────────┴───────────┐
                    │                     │
            ┌───────▼───────┐     ┌───────▼───────┐
            │    .NET       │     │  ML/Data?     │
            │  (ASP.NET)    │     └───────┬───────┘
            └───────────────┘         Yes │   No
                                  ┌───────┴───────┐
                                  │               │
                          ┌───────▼───────┐ ┌─────▼─────┐
                          │   FastAPI     │ │Enterprise?│
                          │   (Python)    │ └─────┬─────┘
                          └───────────────┘   Yes │   No
                                          ┌───────┴───────┐
                                          │               │
                                  ┌───────▼───────┐ ┌─────▼─────┐
                                  │    NestJS     │ │  Express  │
                                  │  (TypeScript) │ │ (Default) │
                                  └───────────────┘ └───────────┘
```

### Backend Selection Rules

| Condition | Framework | Rationale |
|-----------|-----------|-----------|
| Microsoft ecosystem | .NET | Native Azure integration, C# expertise |
| ML/Data/AI integration | FastAPI | Python ecosystem, async support |
| Enterprise Node.js | NestJS | Structure, DI, decorators, TypeORM |
| Simple API | Express | Minimal, flexible, fast development |
| Real-time/WebSocket heavy | NestJS | Built-in WebSocket support |
| Existing Python codebase | FastAPI | Easy integration, type hints |
| Microservices | NestJS | Modular architecture, built for services |

---

### Database Selection

```
                    ┌─────────────────────┐
                    │  Database Needed?   │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   Document Model?   │
                    └─────────┬───────────┘
                        Yes   │   No
                    ┌─────────┴───────────┐
                    │                     │
            ┌───────▼───────┐     ┌───────▼───────┐
            │   Cosmos DB   │     │ Azure Deploy? │
            │   (NoSQL)     │     └───────┬───────┘
            └───────────────┘         Yes │   No
                                  ┌───────┴───────┐
                                  │               │
                          ┌───────▼───────┐ ┌─────▼─────┐
                          │  Azure SQL    │ │SQL Server │
                          │   Database    │ │(On-prem)  │
                          └───────────────┘ └───────────┘
```

### Database Selection Rules

| Condition | Database | Rationale |
|-----------|----------|-----------|
| Document/flexible schema | Cosmos DB | Global distribution, multi-model |
| Azure deployment | Azure SQL | Managed, auto-tuning, serverless option |
| On-premises requirement | SQL Server | Full control, compliance |
| High write throughput | Cosmos DB | Horizontal scaling, partition keys |
| Complex transactions | Azure SQL | ACID, stored procedures |
| Time-series data | Cosmos DB | TTL, change feed |
| Relational with joins | Azure SQL | Optimized for relational queries |

---

### Architecture Pattern Selection

```
                    ┌─────────────────────┐
                    │  Scale Required?    │
                    └─────────┬───────────┘
                        High  │   Normal
                    ┌─────────┴───────────┐
                    │                     │
            ┌───────▼───────┐     ┌───────▼───────┐
            │ Multiple Teams│     │    Monolith   │
            │  or Domains?  │     │   (Default)   │
            └───────┬───────┘     └───────────────┘
                Yes │   No
            ┌───────┴───────┐
            │               │
    ┌───────▼───────┐ ┌─────▼─────────┐
    │ Microservices │ │ Event-Driven? │
    └───────────────┘ └───────┬───────┘
                          Yes │   No
                      ┌───────┴───────┐
                      │               │
              ┌───────▼───────┐ ┌─────▼─────┐
              │ Event-Driven  │ │ Serverless│
              │ Architecture  │ │ (Cost opt)│
              └───────────────┘ └───────────┘
```

### Architecture Selection Rules

| Condition | Pattern | Rationale |
|-----------|---------|-----------|
| Simple application | Monolith | Lower complexity, faster delivery |
| High scale + multiple teams | Microservices | Independent deployment, scaling |
| Real-time/async processing | Event-Driven | Decoupling, eventual consistency |
| Cost-sensitive + burst traffic | Serverless | Pay-per-use, auto-scale to zero |
| Complex domain | Microservices + DDD | Bounded contexts, domain events |
| Integration-heavy | Event-Driven | Loose coupling, resilience |

---

## Selection API

### TypeScript Interface

```typescript
interface ProjectRequirements {
  // Business requirements
  seoRequired: boolean;
  enterpriseGrade: boolean;
  teamSize: number;
  
  // Technical requirements
  microsoftStack: boolean;
  mlIntegration: boolean;
  realTimeFeatures: boolean;
  
  // Infrastructure requirements
  deploymentTarget: 'azure' | 'on-premises' | 'hybrid';
  scaleRequirements: 'low' | 'medium' | 'high';
  costOptimization: boolean;
  
  // Data requirements
  dataModel: 'relational' | 'document' | 'mixed';
  globalDistribution: boolean;
}

interface FrameworkSelection {
  frontend: 'react' | 'vue' | 'nextjs' | 'angular';
  backend: 'express' | 'nestjs' | 'fastapi' | 'dotnet';
  database: 'azure-sql' | 'sql-server' | 'cosmos-db';
  architecture: 'monolith' | 'microservices' | 'event-driven' | 'serverless';
}

function selectFrameworks(requirements: ProjectRequirements): FrameworkSelection {
  return {
    frontend: selectFrontend(requirements),
    backend: selectBackend(requirements),
    database: selectDatabase(requirements),
    architecture: selectArchitecture(requirements),
  };
}
```

### Selection Functions

```typescript
function selectFrontend(req: ProjectRequirements): string {
  if (req.seoRequired) return 'nextjs';
  if (req.enterpriseGrade || req.teamSize > 10) return 'angular';
  if (req.teamSize < 5) return 'vue';
  return 'react';  // Default
}

function selectBackend(req: ProjectRequirements): string {
  if (req.microsoftStack) return 'dotnet';
  if (req.mlIntegration) return 'fastapi';
  if (req.enterpriseGrade) return 'nestjs';
  return 'express';  // Default
}

function selectDatabase(req: ProjectRequirements): string {
  if (req.dataModel === 'document' || req.globalDistribution) return 'cosmos-db';
  if (req.deploymentTarget === 'azure') return 'azure-sql';
  return 'sql-server';
}

function selectArchitecture(req: ProjectRequirements): string {
  if (req.scaleRequirements === 'low') return 'monolith';
  if (req.teamSize > 5 || req.scaleRequirements === 'high') return 'microservices';
  if (req.realTimeFeatures) return 'event-driven';
  if (req.costOptimization) return 'serverless';
  return 'monolith';  // Default
}
```

---

## Override Mechanism

Users can override automatic selection:

```json
{
  "overrides": {
    "frontend": "angular",
    "backend": null,
    "database": null,
    "architecture": "microservices"
  }
}
```

- `null` = use automatic selection
- Specific value = override automatic selection

---

## Selection Confidence

Each selection includes a confidence score:

| Confidence | Score | Meaning |
|------------|-------|---------|
| High | 0.9+ | Strong match, single clear winner |
| Medium | 0.7-0.9 | Good match, alternatives possible |
| Low | <0.7 | Weak match, recommend user input |

---

## Related Documents

- [agent-registry.json](agent-registry.json) - Available agents
- [skill-registry.json](skill-registry.json) - Available skills
- [agent-handoff-matrix.md](agent-handoff-matrix.md) - Handoff protocols

---

## Tags

`framework-selection` `decision-tree` `automation` `configuration`
