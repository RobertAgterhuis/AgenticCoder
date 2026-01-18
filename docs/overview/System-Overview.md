# System Overview

## What is AgenticCoder?

AgenticCoder is an **AI-powered code generation platform** that uses multiple specialized agents working together to create complete, production-ready applications.

Unlike simple code generators, AgenticCoder:

- Uses **39 specialized agents** each expert in their domain
- Follows a **structured 16-phase workflow**
- Learns from errors and **auto-generates fixes**
- Produces **infrastructure-as-code** alongside application code
- Includes **security scanning** from the start

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     PROJECT SPECIFICATION                    │
│              "Build a SaaS with React + .NET + Azure"        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1-8: PLANNING                       │
│   @plan → @doc → @backlog → @architect → @code-architect    │
│                                                              │
│   Output: Requirements, Architecture, Backlog, Designs       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  PHASE 9-12: INFRASTRUCTURE                  │
│   @azure-architect → @bicep-specialist → Validation          │
│                                                              │
│   Output: Azure Architecture, Bicep Templates, AVM Modules   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 PHASE 13-15: IMPLEMENTATION                  │
│   @frontend-specialist → @backend-specialist → @database     │
│   + 20+ specialized agents per technology stack              │
│                                                              │
│   Output: Complete Application Code                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 16: DELIVERY                        │
│   @qa → @devops-specialist → @reporter                      │
│                                                              │
│   Output: Tests, CI/CD Pipelines, Documentation              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Agent System

The brain of AgenticCoder. 39 specialized agents collaborate to handle different aspects:

- **Planning Agents:** @plan, @doc, @backlog, @architect
- **Azure Agents:** @azure-architect, @bicep-specialist, @keyvault-specialist
- **Implementation Agents:** @frontend-specialist, @backend-specialist, @database-specialist
- **Quality Agents:** @qa, @devops-specialist, @reporter

### 2. Workflow Engine

Orchestrates the 16 phases ensuring proper sequencing and data flow between agents.

### 3. Self-Learning System

Classifies errors, detects patterns, and generates fixes automatically.

### 4. MCP Integration

Connects to external services (Azure Pricing, Resource Graph, Documentation) via Model Context Protocol.

### 5. Security Module

Built-in security scanning, secret detection, and audit logging.

## Supported Technology Stacks

| Layer | Technologies |
|-------|--------------|
| Frontend | React, Vue, Angular, Svelte, Next.js, Blazor |
| Backend | Node.js, .NET, Python, Go, Java |
| Database | PostgreSQL, MySQL, MongoDB, Cosmos DB, SQL Server |
| Cloud | Azure (primary), AWS/GCP (planned) |
| IaC | Bicep (Azure), Terraform (planned) |
| CI/CD | GitHub Actions, Azure DevOps |

## Use Cases

### 1. Greenfield Projects

Generate complete new applications from a project description.

### 2. Modernization

Migrate legacy applications to cloud-native architectures.

### 3. Infrastructure

Generate Azure infrastructure from requirements using Bicep and AVM modules.

### 4. Prototyping

Rapid MVP creation for validation and testing.

## Next Steps

- [Quick Start](Quick-Start) - Get AgenticCoder running
- [Concepts](Concepts) - Understand agents, phases, skills
- [Architecture](Architecture) - Deep dive into system design
