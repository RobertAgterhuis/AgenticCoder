# phase-planning Skill

**Skill ID**: `phase-planning`  
**Purpose**: Design and structure implementation phases appropriate to team, methodology, and timeline  
**Used By**: @coordinator agent  
**Type**: Planning and strategy

---

## Knowledge Areas

- Agile/Scrum framework
- Waterfall methodology
- Kanban principles
- Risk-based planning
- Critical path analysis
- Team velocity estimation
- Release planning

---

## Input Contract

```json
{
  "epics": [...],
  "stories": [...],
  "team_size": 6,
  "methodology": "Agile Scrum | Waterfall | Kanban",
  "timeline_constraint_days": 180,
  "project_risk_level": "Medium"
}
```

---

## Output Contract

```json
{
  "phases_created": 5,
  "total_duration_days": 120,
  "phases": [
    {
      "phase_number": 0,
      "name": "Foundation & Setup",
      "duration_days": 3,
      "epics_included": []
    }
  ],
  "dependencies": [...],
  "critical_path_length_days": 95
}
```

---

## Core Capabilities

### 1. Determine Optimal Phase Count

Based on project scope:

```
Team Size × Timeline = Ideal Phase Count

1-3 people, 3 months    → 2-3 phases (minimal ceremony)
6 people, 6 months      → 5-7 phases (standard Scrum)
10+ people, 12 months   → 8-12 phases (SAFe-style)
```

### 2. Create Phase Structure by Methodology

**Agile/Scrum**:
- 2-week sprints
- Clear sprint goals
- Story-based tasks
- Daily standup ceremonies
- Sprint retrospectives

**Waterfall**:
- Sequential phases
- Formal phase gates
- Requirements → Design → Development → Testing → Deployment
- Limited overlap
- Formal sign-offs

**Kanban**:
- Continuous flow
- WIP limits per column
- Pull-based work
- No fixed phases
- Continuous improvement

**Hybrid**:
- Waterfall planning + Agile execution
- Fixed release gates, flexible sprints
- Best for regulated industries

### 3. Allocate Epics to Phases

**MVP-First Principle**:
```
Phase 1: 30-40% of epics (core MVP only)
Phase 2: 30-40% of epics (enhanced features)
Phase 3+: 20-30% of epics (nice-to-haves, hardening)
```

**Example Allocation** (7 epics total):
- Phase 1: EPIC-1 (Auth), EPIC-2 (Dashboard) = 2 epics
- Phase 2: EPIC-3 (Reporting), EPIC-4 (Integration) = 2 epics
- Phase 3: EPIC-5 (Advanced), EPIC-6 (Performance) = 2 epics
- Phase 4: EPIC-7 (Security), Testing & Release = 1 epic

### 4. Estimate Phase Duration

**Story Points to Days Conversion**:
```
Team velocity (story points per week) = Capacity

Example: Team of 6, 2-week sprint, 50 story points capacity
- Phase with 150 story points = 3 sprints = 6 weeks

Days = (Total Story Points / Weekly Velocity) × 7
```

**Add 20% Buffer**:
```
Estimated Days = Days Calculated + (Days Calculated × 0.20)

Example: 100 days estimated → 120 days final (with buffer)
```

### 5. Identify Critical Path

**Critical Path Analysis**:
1. Identify epic dependencies
2. Calculate longest path through dependencies
3. This is the minimum project duration
4. Buffer is added on top

**Example**:
```
Phase 0 (3 days) → Phase 1 (15 days) → Phase 2 (15 days) → Phase 3 (10 days)
Critical Path = 3 + 15 + 15 + 10 = 43 days
With 20% buffer = 52 days
```

### 6. Create Phase Checklist

Each phase gets:
- [ ] Development tasks
- [ ] Code review & QA
- [ ] Integration testing
- [ ] Documentation updates
- [ ] Staging deployment
- [ ] Go/no-go decision
- [ ] Production deployment

---

## Implementation Options

### Option 1: Formula-Based (Recommended)

```
NumPhases = ceil(TotalStoryPoints / (WeeklyVelocity × 2))
PhaseSize = TotalStoryPoints / NumPhases
PhaseDays = (PhaseSize / WeeklyVelocity) × 7 × 1.2
```

### Option 2: Risk-Based

Weight phases by risk level:
- High-risk items early (fresh team, resolve early)
- Medium-risk mid-project
- Low-risk later (team experienced)

### Option 3: Business Value Sequencing

Order phases by business value:
- Phase 1: Highest value features
- Phase 2: Next highest value
- Phase 3+: Lower priority features

---

## Performance Characteristics

- **Phase structure design**: <30 seconds for typical project
- **Dependency analysis**: <1 minute for complex projects
- **Timeline estimation**: <2 minutes
- **Total planning**: 3-5 minutes per project

---

## Testing Strategy

- Test phase allocation logic
- Verify dependencies don't create cycles
- Check timeline estimation accuracy
- Validate against actual historical data

---

## Used By

- **@coordinator Agent**: Creates phase structure and timeline

---

## Handoff Chain

```
@doc (documents)
  ↓ requirements_summary
@backlog (creates epics/stories)
  ↓ epics + story_points
@coordinator (allocates to phases) ← phase-planning skill
  ↓ phase_definitions
@qa (creates validation strategy)
```

---

## Filename**: `phase-planning.skill.md`
