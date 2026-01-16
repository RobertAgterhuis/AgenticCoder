# AgenticCoder Documentation

**Welkom bij AgenticCoder** - Een geautomatiseerd multi-agent systeem voor end-to-end software ontwikkeling.

## 📋 Inhoudsopgave

- [Wat is AgenticCoder?](#wat-is-agenticcoder)
- [Kernconcepten](#kernconcepten)
- [Documentatie Structuur](#documentatie-structuur)
- [Snelle Start](#snelle-start)
- [Belangrijke Links](#belangrijke-links)

## Wat is AgenticCoder?

AgenticCoder is een intelligent orchestration systeem dat **17 gespecialiseerde AI agents** coördineert om complete software projecten te bouwen - van requirements tot deployment. Het systeem:

- ✅ **Automatiseert volledige ontwikkelcyclus** - Van planning tot productie
- ✅ **Orkestreert 17 specialist agents** - Elk expert in hun domein
- ✅ **Valideert met JSON schemas** - Type-safe communicatie tussen agents
- ✅ **Ondersteunt 15 technologie skills** - 6 code skills + 9 process skills
- ✅ **Biedt 5 referentie scenarios** - Van MVP tot enterprise schaal

## Kernconcepten

### 🤖 Agent Architectuur

AgenticCoder bestaat uit **3 lagen van agents** (17 totaal):

```
┌──────────────────────────────────────────────────────────────┐
│         ORCHESTRATION LAYER (8 agents - ALWAYS RUN)         │
│  @plan → @doc → @backlog → @coordinator → @qa              │
│         @reporter → @architect → @code-architect             │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│       INFRASTRUCTURE LAYER (2 agents - CONDITIONAL)          │
│  @azure-architect  @bicep-specialist                         │
│  @devops-specialist  @azure-devops-specialist                │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│       IMPLEMENTATION LAYER (7 agents - CONDITIONAL)          │
│  @react-specialist  @dotnet-specialist                       │
│  @database-specialist  [3 more platform-specific agents]     │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│    TECHNOLOGY SKILLS (15 skills - 6 code + 9 process)       │
│  Code: react-patterns, state-mgmt, dotnet-webapi,            │
│         entity-framework, sql-schema, azure-pipelines         │
│  Process: phase-planning, architecture-design,               │
│          adaptive-discovery, backlog-planning, & more        │
└──────────────────────────────────────────────────────────────┘
```

### 📊 Werk Flow

Elk project doorloopt **16 gestructureerde fases** (8 verplicht, 8 voorwaardelijk):

**Verplichte Fases (1-8):**
1. **Planning** (@plan) - Begrijp requirements en stel project scope vast
2. **Documentatie** (@doc) - Schrijf technische specificaties
3. **Backlog** (@backlog) - Maak user stories en taken
4. **Coördinatie** (@coordinator) - Wijs taken toe aan specialisten
5. **QA Planning** (@qa) - Definieer test strategieën
6. **Rapportage** (@reporter) - Set up monitoring en dashboards
7. **Architectuur** (@architect) - Ontwerp high-level architectuur
8. **Code Architectuur** (@code-architect) - Definieer code structuur

**Voorwaardelijke Fases (9-16):**
9. **Azure Architectuur** (@azure-architect) - Alleen als Azure gekozen
9. **Bicep IaC** (@bicep-specialist) - Alleen als Infrastructure-as-Code nodig
12. **DevOps (GitHub)** (@devops-specialist) - GitHub Actions (standaard)
13. **Frontend** (@react-specialist) - Alleen als React gekozen
14. **Backend** (@dotnet-specialist) - Alleen als .NET Core gekozen
15. **Database** (@database-specialist) - Alleen als database nodig
16. **DevOps (Azure)** (@azure-devops-specialist) - Alleen als Azure DevOps gekozen

### 🎯 Scenarios

AgenticCoder ondersteunt **5 pre-configured scenarios**:

| Scenario | Team Grootte | Duur | Kosten | Gebruik |
|----------|--------------|------|--------|---------|
| **S01: Simple MVP** | 1 (solo dev) | 4-6 weken | $35/maand | Proof of concept, prototyping |
| **S02: Small Startup** | 3 devs | 12-16 weken | $480/maand | E-commerce, SaaS MVP |
| **S03: Medium SaaS** | 10 devs | 24-32 weken | $2K-5K/maand | Multi-tenant platform |
| **S04: Large Enterprise** | 50 people | 48-60 weken | $20K+/maand | Banking, distributed systems |
| **S05: Regulated Healthcare** | 12 people | 36-48 weken | $10K+/maand | HIPAA compliance, EHR |

## Documentatie Structuur

Deze documentatie is opgedeeld in de volgende secties:

### 🚀 [Quick Start Guide](quick-start.md)
Begin binnen 15 minuten met je eerste project. Leer hoe je:
- Een nieuw project start
- De juiste scenario kiest
- Agents activeert en monitort
- Gegenereerde code valideert

### 🤖 [Agent Activation Guide](AGENT_ACTIVATION_GUIDE.md)
Complete referentie voor alle 17 agents:
- Wanneer elk agent activateert
- Wat zijn de activering voorwaarden
- Welke prerequisites zijn nodig
- Welke output produceert elk agent

### 🔄 [Phase Flow Guide](PHASE_FLOW.md)
Volledige fase-overzicht met afhankelijkheden:
- Alle 16 fases in detail
- Afhankelijkheden tussen fases
- Parallellisatie mogelijkheden
- Timing en kritieke paden per scenario

### 🏗️ [System Architecture Guide](SYSTEM_ARCHITECTURE.md)
Diepgaande uitleg van de volledige architectuur:
- Agent orchestration patterns
- Schema validatie mechanisme
- Artifact storage en handoff
- Technology skill system (6 code + 9 process)

### 📖 [Agent Flows](agent-flows.md)
Visualisatie en uitleg van alle agent workflows:
- Agent handoff mechanismen
- Data flow tussen agents
- Error handling en recovery
- Real-world scenario mappings

### 📊 [Scenarios Guide](scenarios-guide.md)
Gedetailleerde beschrijving van alle 5 scenarios:
- Wanneer welk scenario te gebruiken
- Concrete voorbeelden per scenario
- Kosten breakdown
- Technology stack per scenario

### ⚙️ [Configuration Guide](configuration.md)
Leer hoe je AgenticCoder configureert:
- Agent parameters aanpassen
- Custom skills toevoegen
- Schema's uitbreiden
- Output directories configureren

### ✅ [Best Practices](best-practices.md)
Tips en tricks voor optimaal gebruik:
- Project structuur best practices
- Agent communication patterns
- Performance optimalisatie
- Troubleshooting veelvoorkomende problemen

### 🔧 [Troubleshooting](troubleshooting.md)
Oplossingen voor veelvoorkomende problemen:
- Agent errors en oplossingen
- Schema validation failures
- Performance issues
- Recovery procedures

### 🔍 [System Audit Report](AUDIT_REPORT.md)
Audit van AgenticCoder systeem:
- Discrepancies tussen documentatie en werkelijkheid
- Inventory van alle agents en skills
- Schema validatie status
- Fixes die zijn toegepast

## Snelle Start

Wil je direct beginnen? Volg deze 4 stappen:

### 1. Kies je Scenario

```bash
# Voor solo MVP project
Gebruik: S01-simple-mvp.scenario.md

# Voor startup met klein team
Gebruik: S02-small-team-startup.scenario.md
```

### 2. Start de Orchestrator

Activeer de eerste agent in VS Code:
```
@plan start een nieuw [jouw project beschrijving]
```

### 3. Laat Agents Werken

Het systeem zal automatisch alle verplichte fases (1-8) doorlopen:
- Planning → Documentatie → Backlog → ... → Code Architectuur

Daarna activeren voorwaardelijke fases (9-16) op basis van je architectuurbeslissingen:
- Azure gekozen? → @azure-architect + @bicep-specialist
- React frontend? → @react-specialist
- .NET backend? → @dotnet-specialist
- Database? → @database-specialist
- GitHub of Azure DevOps? → @devops-specialist OF @azure-devops-specialist

### 4. Review & Deploy

Na alle relevante fases heb je:
- ✅ Complete codebase (frontend + backend + database - naar keuze)
- ✅ CI/CD pipeline configuratie (GitHub Actions OF Azure DevOps)
- ✅ Infrastructure as Code (Bicep - indien Azure)
- ✅ Database schema en migrations (indien nodig)
- ✅ Deployment documentatie en runbooks

**→ Zie [Quick Start Guide](quick-start.md) voor gedetailleerde instructies**

## Belangrijke Links

### 📁 Project Structuur
```
AgenticCoder/
├── .github/
│   ├── agents/           # 17 agent specificaties
│   ├── schemas/          # Validatie schemas (agents + skills)
│   │   ├── agents/       # 17 agent schemas (34 input/output files)
│   │   ├── artifacts/    # 4 artifact schemas
│   │   └── skills/       # 15 skill schemas (30 input/output files)
│   ├── skills/           # 15 technology skills (6 code + 9 process)
│   └── scenarios/        # 5 referentie scenarios
└── docs/                 # Deze documentatie (incl. guides en audit)
```

### 🎓 Leer Meer

- **Nieuw bij AgenticCoder?** → Start met [Quick Start Guide](quick-start.md)
- **Wil je weten welke agents bestaan?** → Lees [Agent Activation Guide](AGENT_ACTIVATION_GUIDE.md)
- **Zoek je fase-overzicht?** → Bekijk [Phase Flow Guide](PHASE_FLOW.md)
- **Wil je de architectuur begrijpen?** → Lees [System Architecture Guide](SYSTEM_ARCHITECTURE.md)
- **Zoek je concrete voorbeelden?** → Bekijk [Scenarios Guide](scenarios-guide.md)
- **Problemen?** → Check [Troubleshooting](troubleshooting.md)

### 📚 Agent Specificaties

AgenticCoder bevat **17 agents** (8 orchestratie + 4 infrastructuur + 5 implementatie):

**Orchestration Agents** (Altijd actief, Fase 1-8):
- [@plan.agent.md](../.github/agents/@plan.agent.md) - Project planning
- [@doc.agent.md](../.github/agents/@doc.agent.md) - Documentatie
- [@backlog.agent.md](../.github/agents/@backlog.agent.md) - Backlog management
- [@coordinator.agent.md](../.github/agents/@coordinator.agent.md) - Task coördinatie
- [@qa.agent.md](../.github/agents/@qa.agent.md) - Quality assurance
- [@reporter.agent.md](../.github/agents/@reporter.agent.md) - Rapportage & monitoring
- [@architect.agent.md](../.github/agents/@architect.agent.md) - Architectuur design
- [@code-architect.agent.md](../.github/agents/@code-architect.agent.md) - Code structuur (incl. frontend+backend)

**Infrastructure Agents** (Voorwaardelijk, Fase 9-12):
- [@azure-architect.agent.md](../.github/agents/@azure-architect.agent.md) - Azure cloud architectuur
- [@bicep-specialist.agent.md](../.github/agents/@bicep-specialist.agent.md) - Infrastructure-as-Code (Bicep)
- [@devops-specialist.agent.md](../.github/agents/@devops-specialist.agent.md) - DevOps (GitHub Actions)
- [@azure-devops-specialist.agent.md](../.github/agents/@azure-devops-specialist.agent.md) - DevOps (Azure DevOps)

**Implementation Agents** (Voorwaardelijk, Fase 13-16):
- [@react-specialist.agent.md](../.github/agents/@react-specialist.agent.md) - React frontend
- [@dotnet-specialist.agent.md](../.github/agents/@dotnet-specialist.agent.md) - .NET backend
- [@database-specialist.agent.md](../.github/agents/@database-specialist.agent.md) - Database design

**→ Voor gedetailleerde info over activering zie [Agent Activation Guide](AGENT_ACTIVATION_GUIDE.md)**

### 🛠️ Technology Skills

AgenticCoder ondersteunt **15 technology skills** (6 code + 9 process):

**Code Skills** (voor implementation):
- [react-patterns.skill.md](../.github/skills/react-patterns.skill.md) - React best practices & components
- [state-management.skill.md](../.github/skills/state-management.skill.md) - Zustand, Redux, TanStack Query
- [dotnet-webapi.skill.md](../.github/skills/dotnet-webapi.skill.md) - ASP.NET Core Web API
- [entity-framework.skill.md](../.github/skills/entity-framework.skill.md) - Entity Framework Core ORM
- [sql-schema-design.skill.md](../.github/skills/sql-schema-design.skill.md) - Database design patterns
- [azure-pipelines.skill.md](../.github/skills/azure-pipelines.skill.md) - Azure DevOps pipelines

**Process Skills** (voor orchestration & planning):
- adaptive-discovery.skill.md - Dynamic requirement gathering
- phase-planning.skill.md - Project phase organization
- requirements-analysis.skill.md - Req. specification
- architecture-design.skill.md - System architecture
- infrastructure-automation.skill.md - IaC automation
- error-handling.skill.md - Error management
- technical-writing.skill.md - Documentation
- backlog-planning.skill.md - Backlog management
- timeline-estimation.skill.md - Project estimation

### 🎯 Scenarios

Alle scenarios zijn gedocumenteerd in `.github/scenarios/`:
- [S01-simple-mvp.scenario.md](../.github/scenarios/S01-simple-mvp.scenario.md) - Solo MVP (4-6 weken)
- [S02-small-team-startup.scenario.md](../.github/scenarios/S02-small-team-startup.scenario.md) - Startup (12-16 weken)
- [S03-medium-team-saas.scenario.md](../.github/scenarios/S03-medium-team-saas.scenario.md) - SaaS platform (24-32 weken)
- [S04-large-team-enterprise.scenario.md](../.github/scenarios/S04-large-team-enterprise.scenario.md) - Enterprise (48-60 weken)
- [S05-regulated-healthcare.scenario.md](../.github/scenarios/S05-regulated-healthcare.scenario.md) - Healthcare HIPAA (36-48 weken)

## Veelgestelde Vragen

### Hoeveel agents heeft AgenticCoder?

**17 agents totaal:**
- **8 orchestration agents** (Phases 1-8) - Altijd actief
- **4 infrastructure agents** (Phases 9-12) - Voorwaardelijk gebaseerd op cloud/CI-CD keuze
- **5 implementation agents** (Phases 13-16) - Voorwaardelijk gebaseerd op tech stack keuze

### Hoe werken voorwaardelijke phases?

Na Phase 8 (@code-architect) worden agenten geactiveerd op basis van jouw architecture beslissingen:

```
Architecture Decision → Activates Agents
─────────────────────────────────────────
Azure platform       → @azure-architect + @bicep-specialist
React frontend       → @react-specialist
.NET Core backend    → @dotnet-specialist
Database needed      → @database-specialist
GitHub (default)     → @devops-specialist
Azure DevOps (explicit) → @azure-devops-specialist
```

Agents 13-15 (Frontend/Backend/Database) kunnen **parallel** runnen.

### Wat zijn de "technology skills"?

AgenticCoder heeft **15 technology skills**:
- **6 Code Skills**: react-patterns, state-management, dotnet-webapi, entity-framework, sql-schema-design, azure-pipelines
- **9 Process Skills**: adaptive-discovery, phase-planning, requirements-analysis, architecture-design, infrastructure-automation, error-handling, technical-writing, backlog-planning, timeline-estimation

**→ Zie [Agent Activation Guide](AGENT_ACTIVATION_GUIDE.md) voor volledige details**

## Support & Community

### � Documentatie
- **Agent Activation?** → [AGENT_ACTIVATION_GUIDE.md](AGENT_ACTIVATION_GUIDE.md)
- **Phase Flow?** → [PHASE_FLOW.md](PHASE_FLOW.md)
- **System Overview?** → [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- **What Happened?** → [AUDIT_REPORT.md](AUDIT_REPORT.md)
- **DevOps Details?** → [DEVOPS_AGENT_CLARIFICATION.md](DEVOPS_AGENT_CLARIFICATION.md)

### �🐛 Bug Reports
Found een probleem? Open een issue in de repository.

### 💡 Feature Requests
Ideeën voor nieuwe features? Deel ze in de discussions.

### 📖 Contributing
Wil je bijdragen? Check de CONTRIBUTING.md guide.

---

**Klaar om te beginnen?** → [Quick Start Guide](quick-start.md)

**Vragen?** → [Troubleshooting Guide](troubleshooting.md)

**Wil je meer leren?** → [Architecture Guide](architecture.md)
