# 🔄 .github Folder Migration Guide

**Status**: `.github` → `.github-legacy` rename **COMPLETE** ✅  
**Date**: January 13, 2026  
**Next Step**: Create new `.github/` structure in Sprint 3

---

## ✅ What Was Done

```powershell
# Executed command:
Rename-Item -Path ".github" -NewName ".github-legacy"
```

**Result**:
- ✅ Old `.github/` folder preserved as `.github-legacy/`
- ✅ Clean slate for new AgenticCoder v1.0 structure
- ✅ Zero risk of overwriting existing agents/skills
- ✅ Side-by-side comparison possible during migration

---

## 📂 Current Folder Structure

```
d:\repositories\AgenticCoder\
├── .github-legacy/          ← OLD (ProjectPlan Template Framework)
│   ├── agents/              (9 original agents)
│   ├── skills/              (8 original skills)
│   └── ...
│
├── AgenticCoderPlan/        ← PLANNING DOCS (Plans A-H)
│   ├── 00-START-HERE.md
│   ├── AgenticCoderPlan-A.md through H.md
│   ├── COMPLETION-STATUS.md
│   ├── MIGRATION-GUIDE.md (this file)
│   └── ...
│
└── (no .github folder yet)  ← TO BE CREATED in Sprint 3
```

---

## 🎯 What's in .github-legacy/

**Preserved Content**:
```
.github-legacy/
├── agents/
│   ├── @plan.agent.md
│   ├── doc-writer.agent.md
│   ├── backlog-strategist.agent.md
│   ├── implementation-coordinator.agent.md
│   ├── qa-validator.agent.md
│   ├── reporter.agent.md
│   └── ... (3 more)
│
├── skills/
│   ├── adaptive-discovery.skill.md
│   ├── requirements-analysis.skill.md
│   ├── cost-analysis.skill.md
│   ├── architecture-design.skill.md
│   ├── implementation-guidance.skill.md
│   ├── testing-validation.skill.md
│   └── ... (2 more)
│
└── ... (other legacy files)
```

**Usage**:
- 📖 Reference during Sprint 3-5 migration
- 🔍 Code snippets and logic comparison
- 🧪 Fallback if issues arise
- 📚 Team onboarding (see evolution)

---

## 🚀 Next Steps (Sprint 3)

### Step 1: Create New .github/ Structure

**Run these commands** (Sprint 3, Week 1):

```powershell
# Navigate to repo root
cd d:\repositories\AgenticCoder

# Create new folder structure (per Plan-C Part 3)
New-Item -Path ".github" -ItemType Directory
New-Item -Path ".github/agents" -ItemType Directory
New-Item -Path ".github/skills" -ItemType Directory
New-Item -Path ".github/mcp" -ItemType Directory
New-Item -Path ".github/scenarios" -ItemType Directory
New-Item -Path ".github/schemas" -ItemType Directory
New-Item -Path ".github/templates" -ItemType Directory
New-Item -Path ".github/workflows" -ItemType Directory
New-Item -Path ".github/actions" -ItemType Directory
New-Item -Path ".github/docs" -ItemType Directory

Write-Host "✅ New .github structure created!"
```

### Step 2: Copy Templates (Sprint 3, Week 1)

```powershell
# Templates are defined in Plan-C Part 3
# Create files based on those specifications:

# 1. .github/templates/agent-template.md
# 2. .github/templates/skill-template.md
# 3. .github/templates/scenario-template.md
# 4. .github/templates/bicep-template/ (folder)
```

### Step 3: Copy Schemas (Sprint 3, Week 2)

```powershell
# Copy all 71 schemas from Plan-H into .github/schemas/
# Structure:
# .github/schemas/agents/
# .github/schemas/artifacts/
# .github/schemas/mcp/
# .github/schemas/config/
```

### Step 4: Migrate Agents (Sprint 3-5)

**For each agent**:

```powershell
# Example for @plan agent:

# 1. Copy from legacy
Copy-Item ".github-legacy/agents/@plan.agent.md" -Destination ".github/agents/@plan.agent.md"

# 2. Update to new format:
# - Add schema references (Plan-H)
# - Update to new template format (Plan-C Part 3)
# - Add MCP server integration if needed (Plan-E)

# 3. Create input/output schemas:
# - .github/schemas/agents/@plan.input.schema.json
# - .github/schemas/agents/@plan.output.schema.json

# 4. Test the agent

# 5. Repeat for remaining 12 agents
```

### Step 5: Migrate Skills (Sprint 4)

```powershell
# Similar process for 9 skills
# Copy from .github-legacy/skills/ to .github/skills/
# Update format, add schemas, test
```

### Step 6: Add New Components (Sprint 4-5)

```powershell
# Add NEW items (not in legacy):
# - MCP configurations (.github/mcp/)
# - Test scenarios (.github/scenarios/)
# - CI/CD workflows (.github/workflows/)
# - Custom actions (.github/actions/)
```

---

## 📋 Migration Checklist

### Phase 1: Structure Setup (Sprint 3, Week 1)
- [ ] Create `.github/` folder with all subdirectories
- [ ] Add 4 templates (agent, skill, scenario, bicep)
- [ ] Add README.md files to each subfolder
- [ ] Copy MCP configuration from Plan-E

### Phase 2: Schema Setup (Sprint 3, Week 2)
- [ ] Create `.github/schemas/` structure
- [ ] Add all 71 schemas from Plan-H
- [ ] Validate schema format (JSON Schema 2020-12)
- [ ] Test schema validation scripts

### Phase 3: Agent Migration (Sprint 3-5)
- [ ] @plan (migrate + update)
- [ ] doc-writer (migrate + update)
- [ ] backlog-strategist (migrate + update)
- [ ] implementation-coordinator (migrate + update)
- [ ] qa-validator (migrate + update)
- [ ] reporter (migrate + update)
- [ ] azure-principal-architect (NEW from azure-agentic-infraops)
- [ ] bicep-plan (NEW from azure-agentic-infraops)
- [ ] bicep-implement (NEW from azure-agentic-infraops)
- [ ] deploy-coordinator (NEW)
- [ ] diagram-generator (NEW from azure-agentic-infraops)
- [ ] adr-generator (NEW from azure-agentic-infraops)
- [ ] workload-documentation-generator (NEW from azure-agentic-infraops)

### Phase 4: Skill Migration (Sprint 4)
- [ ] adaptive-discovery (migrate + update)
- [ ] requirements-analysis (migrate + update)
- [ ] cost-analysis (migrate + update)
- [ ] architecture-design (migrate + update)
- [ ] implementation-guidance (migrate + update)
- [ ] testing-validation (migrate + update)
- [ ] bicep-generation (NEW)
- [ ] deployment-orchestration (NEW)
- [ ] azure-governance (NEW)

### Phase 5: New Components (Sprint 4-5)
- [ ] S01-S05 scenarios (from Plan-G)
- [ ] MCP server configs (from Plan-E)
- [ ] CI/CD workflows (baseline)
- [ ] Documentation files

---

## 🔍 Comparison Commands

**Check what's in legacy**:
```powershell
# List all agents in legacy
Get-ChildItem ".github-legacy/agents" -Filter "*.md" | Select-Object Name

# List all skills in legacy
Get-ChildItem ".github-legacy/skills" -Filter "*.md" | Select-Object Name

# Compare file sizes
$legacy = Get-ChildItem ".github-legacy" -Recurse -File | Measure-Object -Property Length -Sum
$new = Get-ChildItem ".github" -Recurse -File | Measure-Object -Property Length -Sum
Write-Host "Legacy: $($legacy.Count) files, $([math]::Round($legacy.Sum/1KB, 2)) KB"
Write-Host "New: $($new.Count) files, $([math]::Round($new.Sum/1KB, 2)) KB"
```

**Side-by-side comparison**:
```powershell
# Compare old vs new agent file
code --diff ".github-legacy/agents/@plan.agent.md" ".github/agents/@plan.agent.md"
```

---

## 📊 Migration Metrics

| Metric | Legacy | New (Target) | Status |
|--------|--------|--------------|--------|
| **Agents** | 9 | 13 | 🟡 Migration needed |
| **Skills** | 8 | 9 | 🟡 Migration needed |
| **Scenarios** | 0 | 5 | 🟢 New in v1.0 |
| **Schemas** | 0 | 71 | 🟢 New in v1.0 |
| **Templates** | 0 | 4 | 🟢 New in v1.0 |
| **MCP Servers** | 0 | 3 | 🟢 New in v1.0 |

---

## ⚠️ Important Notes

### Do NOT Delete .github-legacy/

**Keep it because**:
- Reference implementation for existing agents
- Code logic to copy/adapt
- Rollback option if issues arise
- Team training/onboarding resource

**When to remove**:
- After v1.0 successful release (Sprint 11+)
- After team confirmation
- After archiving to `.zip` (optional)

### Naming Convention Changes

**Old** (in `.github-legacy/`):
```
@plan.agent.md
doc-writer.agent.md
adaptive-discovery.skill.md
```

**New** (in `.github/`):
```
@plan.agent.md              ← Same
doc-writer.agent.md         ← Same
adaptive-discovery.skill.md ← Same
```

**Naming stays same!** But add schemas:
```
.github/schemas/agents/@plan.input.schema.json
.github/schemas/agents/@plan.output.schema.json
```

---

## 🎓 Reference Documents

**For folder structure**:
- [Plan-C Part 3](./AgenticCoderPlan-C.md#part-3-github-folder-structure--templates) - Complete layout

**For schemas**:
- [Plan-H](./AgenticCoderPlan-H.md) - All 71 schemas

**For scenarios**:
- [Plan-G](./AgenticCoderPlan-G.md) - S01-S05 scenarios

**For MCP servers**:
- [Plan-E](./AgenticCoderPlan-E.md) - MCP architecture

**For templates**:
- [Plan-C Part 3.2](./AgenticCoderPlan-C.md#32-file-templates) - Copy-ready templates

---

## ✅ Status Summary

**Completed**:
- ✅ `.github` renamed to `.github-legacy` (preserves old structure)
- ✅ Planning documents updated to reference legacy folder
- ✅ Clean slate ready for new structure

**Next Actions** (Sprint 3):
1. Create new `.github/` folder structure
2. Add templates and schemas
3. Begin agent migration (one by one)
4. Test each migrated component

**Timeline**:
- Sprint 3-4: Structure + migration (Weeks 3-4)
- Sprint 5-6: Agent/skill implementation (Weeks 5-6)
- Sprint 7-8: Testing with scenarios (Weeks 7-8)

---

**Current Status**: ✅ Ready for Sprint 3 execution  
**Confidence**: 🟢 High (clean separation, zero data loss, gradual migration)
