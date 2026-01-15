# Quick Start Guide

Start binnen **15 minuten** met je eerste AgenticCoder project.

## 📋 Inhoudsopgave

- [Vereisten](#vereisten)
- [Stap 1: Kies je Scenario](#stap-1-kies-je-scenario)
- [Stap 2: Start Planning](#stap-2-start-planning)
- [Stap 3: Monitor Voortgang](#stap-3-monitor-voortgang)
- [Stap 4: Review Artifacts](#stap-4-review-artifacts)
- [Stap 5: Deploy](#stap-5-deploy)
- [Volgende Stappen](#volgende-stappen)

## Vereisten

Voordat je start, zorg dat je het volgende hebt:

### ✅ Software
- **VS Code** met GitHub Copilot extensie
- **Git** voor version control
- **Node.js 18+** (voor frontend projecten)
- **.NET 8+** (voor backend projecten)
- **Azure CLI** (optioneel, voor cloud deployment)

### ✅ Kennis
- Basiskennis van software ontwikkeling
- Begrip van je project requirements
- Keuze van technologie stack

### ✅ Toegang
- GitHub Copilot actieve licentie
- Azure subscription (optioneel, voor cloud deployment)

## Stap 1: Kies je Scenario

AgenticCoder biedt **5 pre-configured scenarios**. Kies degene die het beste past bij je project:

### 🎯 Scenario Selectie Matrix

| Jouw Situatie | Kies Scenario | Kenmerken |
|---------------|---------------|-----------|
| Ik ben solo developer, wil snel een MVP | **S01** | 4-6 weken, $35/maand, monolith |
| Klein team (2-5 devs), startup product | **S02** | 12-16 weken, $480/maand, modular monolith |
| Medium team (8-15 devs), SaaS platform | **S03** | 24-32 weken, multi-tenant, microservices |
| Groot team (40+), enterprise systeem | **S04** | 48-60 weken, event sourcing, multi-region |
| Healthcare/Finance met compliance | **S05** | 36-48 weken, HIPAA/PCI, encrypted |

### 📖 Scenario Details

#### S01: Simple MVP (Aanbevolen voor beginners)
```yaml
Team: 1 solo developer
Duur: 4-6 weken
Kosten: $35/maand
Stack: React + Node.js + PostgreSQL
Deployment: Azure App Service (B1)
Use Cases: 
  - Proof of concept
  - Internal tool
  - Portfolio project
```

#### S02: Small Team Startup
```yaml
Team: 3 developers
Duur: 12-16 weken
Kosten: $480/maand
Stack: React + Express + PostgreSQL + Redis + Stripe
Deployment: Azure App Service + Static Web Apps
Use Cases:
  - E-commerce platform
  - SaaS MVP
  - Mobile app backend
```

#### S03: Medium Team SaaS
```yaml
Team: 10 developers
Duur: 24-32 weken
Kosten: $2K-5K/maand
Stack: React + Node.js + PostgreSQL + Kafka + Redis
Deployment: Azure Kubernetes Service (AKS)
Use Cases:
  - Multi-tenant SaaS
  - Real-time analytics
  - Event-driven architecture
```

#### S04: Large Team Enterprise
```yaml
Team: 50 people (10 teams)
Duur: 48-60 weken
Kosten: $20K+/maand
Stack: React + Java/Go + PostgreSQL + Kafka + Event Sourcing
Deployment: Multi-region AKS with geo-replication
Use Cases:
  - Banking systems
  - Payment processing
  - High-scale distributed systems
```

#### S05: Regulated Healthcare
```yaml
Team: 12 people (3 teams)
Duur: 36-48 weken
Kosten: $10K+/maand
Stack: React + Node.js + PostgreSQL + Encryption + Audit Logging
Deployment: HIPAA-compliant Azure with private endpoints
Use Cases:
  - Electronic Health Records (EHR)
  - Telemedicine platform
  - Patient management system
```

### 🎬 Voorbeeld: Ik kies S01 (Simple MVP)

Voor deze guide gebruiken we **S01: Simple MVP** als voorbeeld.

## Stap 2: Start Planning

Nu je een scenario hebt gekozen, start je het project met de @plan agent.

### 2.1 Open VS Code

1. Open VS Code in je project directory
2. Open GitHub Copilot Chat (Ctrl+Shift+I / Cmd+Shift+I)

### 2.2 Activeer @plan Agent

Typ in Copilot Chat:

```
@plan start een nieuw project voor een taakbeheer applicatie (todo app) 
met de volgende features:
- Gebruikers kunnen taken aanmaken, bewerken en verwijderen
- Taken hebben een titel, beschrijving en status (todo/in progress/done)
- Filter taken op status
- Gebruik scenario S01 (Simple MVP)
```

### 2.3 @plan Agent Output

De @plan agent genereert:

```
📋 PROJECT PLAN OUTPUT

Project: Todo App MVP
Scenario: S01-simple-mvp
Duration: 4-6 weken
Team: 1 developer

✅ GENERATED ARTIFACTS:
1. project-overview.md
2. requirements-specification.md
3. scope-definition.md
4. success-criteria.md

📊 PROJECT SCOPE:
- Frontend: React 18 met Vite
- Backend: Express.js API
- Database: PostgreSQL
- Deployment: Azure App Service B1

🎯 NEXT PHASE: @doc (Documentatie)
```

### 2.4 Controleer Generated Files

De @plan agent heeft files aangemaakt in:
```
output/
└── phase01-plan/
    ├── project-overview.md
    ├── requirements-specification.md
    ├── scope-definition.md
    └── success-criteria.md
```

**👀 Review deze files** voordat je doorgaat naar de volgende fase!

## Stap 3: Monitor Voortgang

Het systeem doorloopt automatisch alle 12 fases. Monitor de voortgang:

### 3.1 Fase Overzicht

```
Phase 1:  @plan               ✅ Complete (5 min)
Phase 2:  @doc                🔄 Running... (10 min)
Phase 3:  @backlog            ⏳ Pending
Phase 4:  @coordinator        ⏳ Pending
Phase 5:  @qa                 ⏳ Pending
Phase 6:  @reporter           ⏳ Pending
Phase 7:  @architect          ⏳ Pending
Phase 8:  @code-architect     ⏳ Pending
Phase 9:  @react-specialist   ⏳ Pending
Phase 10: @dotnet-specialist  ⏳ Pending
Phase 11: @database-specialist ⏳ Pending
Phase 12: @azure-devops-specialist ⏳ Pending
```

### 3.2 Activeer Volgende Fase (Optioneel)

Het systeem gaat **automatisch** verder, maar je kunt ook **handmatig** de volgende fase starten:

```
@doc documenteer het todo app project op basis van de planning
```

### 3.3 Check Agent Output

Elke agent genereert specifieke artifacts:

| Agent | Output Directory | Generated Files |
|-------|------------------|-----------------|
| @plan | `output/phase01-plan/` | project-overview.md, requirements.md |
| @doc | `output/phase02-doc/` | technical-spec.md, api-spec.md |
| @backlog | `output/phase03-backlog/` | user-stories.md, tasks.md |
| @coordinator | `output/phase04-coordinator/` | task-assignments.md |
| @qa | `output/phase05-qa/` | test-strategy.md, test-cases.md |
| @reporter | `output/phase06-reporter/` | monitoring-plan.md |
| @architect | `output/phase07-architect/` | architecture-diagram.md |
| @code-architect | `output/phase08-code-architect/` | code-structure.md |
| @react-specialist | `output/phase09-react/` | components/, pages/, hooks/ |
| @dotnet-specialist | `output/phase10-dotnet/` | controllers/, services/ |
| @database-specialist | `output/phase11-database/` | schema.sql, migrations/ |
| @azure-devops-specialist | `output/phase12-devops/` | azure-pipelines.yml |

## Stap 4: Review Artifacts

Na alle 12 fases heb je een **complete codebase**. Review de gegenereerde code:

### 4.1 Frontend (React)

```
output/phase09-react/
├── src/
│   ├── components/
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── TaskForm.tsx
│   │   └── TaskFilter.tsx
│   ├── pages/
│   │   └── HomePage.tsx
│   ├── hooks/
│   │   └── useTasks.ts
│   ├── services/
│   │   └── taskService.ts
│   └── App.tsx
├── package.json
└── vite.config.ts
```

### 4.2 Backend (Express)

```
output/phase10-dotnet/
├── src/
│   ├── controllers/
│   │   └── TaskController.ts
│   ├── services/
│   │   └── TaskService.ts
│   ├── models/
│   │   └── Task.ts
│   └── server.ts
├── package.json
└── tsconfig.json
```

### 4.3 Database (SQL)

```
output/phase11-database/
├── schema.sql
├── migrations/
│   ├── 001_create_tasks_table.sql
│   └── 002_add_task_indexes.sql
└── seed-data.sql
```

### 4.4 DevOps (CI/CD)

```
output/phase12-devops/
├── azure-pipelines.yml
├── infrastructure/
│   ├── main.bicep
│   ├── app-service.bicep
│   └── database.bicep
└── deploy.sh
```

### 4.5 Test de Code Lokaal

```bash
# 1. Setup database
psql -U postgres -f output/phase11-database/schema.sql

# 2. Start backend
cd output/phase10-dotnet
npm install
npm run dev

# 3. Start frontend (in nieuwe terminal)
cd output/phase09-react
npm install
npm run dev

# 4. Open browser
open http://localhost:5173
```

### 4.6 Valideer Functionaliteit

Test de belangrijkste features:
- ✅ Taak aanmaken werkt
- ✅ Taak bewerken werkt
- ✅ Taak verwijderen werkt
- ✅ Filter op status werkt
- ✅ API endpoints reageren correct

## Stap 5: Deploy

Deploy je applicatie naar Azure met de gegenereerde CI/CD pipeline.

### 5.1 Setup Azure Resources

```bash
# Login naar Azure
az login

# Maak resource groep
az group create --name todo-app-rg --location westeurope

# Deploy infrastructure (Bicep)
cd output/phase12-devops/infrastructure
az deployment group create \
  --resource-group todo-app-rg \
  --template-file main.bicep
```

### 5.2 Setup CI/CD Pipeline

```bash
# 1. Commit code naar Git
git init
git add .
git commit -m "Initial commit - Generated by AgenticCoder"

# 2. Push naar GitHub
git remote add origin https://github.com/jouw-username/todo-app.git
git push -u origin main

# 3. Setup GitHub Actions
# Copy azure-pipelines.yml naar .github/workflows/
mkdir -p .github/workflows
cp output/phase12-devops/azure-pipelines.yml .github/workflows/deploy.yml

# 4. Configure secrets
# Ga naar GitHub repo → Settings → Secrets
# Voeg toe: AZURE_CREDENTIALS, DATABASE_CONNECTION_STRING
```

### 5.3 Trigger Deployment

```bash
# Push wijzigingen
git add .github/workflows/deploy.yml
git commit -m "Add CI/CD pipeline"
git push

# Pipeline start automatisch!
# Check voortgang op GitHub Actions tab
```

### 5.4 Verify Deployment

```bash
# Get app URL
az webapp show \
  --resource-group todo-app-rg \
  --name todo-app \
  --query defaultHostName \
  --output tsv

# Open in browser
open https://todo-app.azurewebsites.net
```

## Volgende Stappen

🎉 **Gefeliciteerd!** Je hebt je eerste AgenticCoder project succesvol voltooid.

### 📚 Leer Meer

- **Architectuur begrijpen** → Lees [Architecture Guide](architecture.md)
- **Agent flows in detail** → Bekijk [Agent Flows](agent-flows.md)
- **Andere scenarios proberen** → Check [Scenarios Guide](scenarios-guide.md)
- **Advanced features** → Zie [Configuration Guide](configuration.md)

### 🔧 Customisatie

Wil je de gegenereerde code aanpassen?

1. **Frontend styling** → Update CSS/Tailwind configuratie
2. **Backend logic** → Pas services en controllers aan
3. **Database schema** → Voeg nieuwe migraties toe
4. **CI/CD** → Update pipeline YAML

Zie [Best Practices](best-practices.md) voor aanbevelingen.

### 🎯 Probeer Andere Scenarios

Nu je S01 hebt voltooid, probeer een complexer scenario:

```
@plan start een e-commerce platform met Stripe integratie
gebruik scenario S02 (Small Team Startup)
```

### 💡 Tips voor Volgende Projecten

1. **Start altijd met requirements** - Hoe duidelijker je input, hoe beter de output
2. **Review elke fase** - Controleer output voordat je verder gaat
3. **Test lokaal eerst** - Valideer functionaliteit voordat je deployt
4. **Gebruik version control** - Commit regelmatig tijdens ontwikkeling
5. **Monitor je Azure costs** - Houd resource usage in de gaten

### 🐛 Problemen?

Zie [Troubleshooting Guide](troubleshooting.md) voor oplossingen van veelvoorkomende problemen.

---

**Vragen?** Open een issue in de repository of bekijk de volledige documentatie.

**Klaar voor meer?** → [Scenarios Guide](scenarios-guide.md) | [Architecture Guide](architecture.md)
