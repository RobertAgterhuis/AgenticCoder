# backlog-planning Skill

**Skill ID**: `backlog-planning`  
**Purpose**: Transform epics and user stories into prioritized, sized, and sequenced backlog items  
**Used By**: @backlog agent  
**Type**: Planning and structuring

---

## Knowledge Areas

- Backlog refinement techniques
- User story creation and sizing
- Epic decomposition
- Priority frameworks (MoSCoW, RICE, Kano)
- Dependency management
- Story point estimation
- Backlog sequencing strategies

---

## Input Contract

```json
{
  "epics": [...],
  "business_goals": [...],
  "team_velocity": 40,
  "prioritization_method": "RICE | MoSCoW | Value vs Risk",
  "dependencies": [...]
}
```

---

## Output Contract

```json
{
  "backlog_created": true,
  "stories_created": 42,
  "epics_decomposed": 7,
  "prioritized_backlog": [...]
}
```

---

## Core Capabilities

### 1. Decompose Epics into Stories

**Epic to Stories Mapping**:

```markdown
# Epic: User Authentication

**Size**: 5 stories  
**Priority**: Critical  
**Value**: High  
**Risk**: Low  

## Story: User Registration
**Points**: 8  
**As a**: new user  
**I want**: to create an account with email/password  
**So that**: I can access the platform

## Story: User Login
**Points**: 5  
**As a**: existing user  
**I want**: to login with email/password  
**So that**: I can access my account

## Story: Password Reset
**Points**: 5  
**As a**: user  
**I want**: to reset my password via email link  
**So that**: I can recover access if I forget my password

## Story: Email Verification
**Points**: 3  
**As a**: system  
**I want**: to verify user email addresses  
**So that**: I can prevent fake accounts

## Story: Session Management
**Points**: 5  
**As a**: system  
**I want**: to manage user sessions securely  
**So that**: I can prevent unauthorized access
```

**Decomposition Rules**:
- Each story should be completable in 1-2 days
- Story points range: 1-21 (Fibonacci)
- No story should span multiple epics
- Each story has clear acceptance criteria
- Stories are independent (minimize dependencies)

### 2. Create User Stories

**Story Template**:
```markdown
## Story ID: [STORY-123]

**Epic**: [EPIC-1]  
**Status**: Backlog  
**Priority**: [Critical|High|Medium|Low]  
**Story Points**: [1-21]  

### User Story
As a **[role]**  
I want to **[feature/action]**  
So that **[benefit]**

### Acceptance Criteria
- [ ] Given [context] when [action] then [expected result]
- [ ] Given [context] when [action] then [expected result]
- [ ] Given [context] when [action] then [expected result]

### Technical Notes
- [Any architectural decisions]
- [Technology constraints]
- [Integration points]

### Dependencies
- Depends on: [STORY-X, STORY-Y]
- Blocks: [STORY-Z]

### Definition of Done
- [ ] Code written and reviewed
- [ ] Unit tests >80% coverage
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Product owner approval
```

### 3. Size Stories with Story Points

**Fibonacci Scale** (1, 2, 3, 5, 8, 13, 21):

| Points | Complexity | Duration | Example |
|--------|-----------|----------|---------|
| **1** | Trivial | <1 hour | Fix typo, update variable name |
| **2** | Very Simple | 1-2 hours | Simple bug fix, small refactor |
| **3** | Simple | 0.5 day | Single component, basic feature |
| **5** | Medium | 1 day | Multiple components, moderate feature |
| **8** | Complex | 1-2 days | Feature with dependencies, integration |
| **13** | Very Complex | 2-3 days | Major feature, multiple integrations |
| **21** | Epic/Too Large | >3 days | Should be split into smaller stories |

**Sizing Heuristics**:
- Compare to recent completed stories
- Consider unknowns (add points for unknowns)
- Team consensus (planning poker)
- If >13 points: Consider breaking down

### 4. Prioritize Backlog

**RICE Prioritization**:
```
Priority = (Reach × Impact × Confidence) / Effort

Reach: How many users affected (0-100)
Impact: How big is the impact (1=minimal, 4=massive)
Confidence: How confident are we (0-100%)
Effort: How many person-weeks to build (1-50)

Example:
- Story A: (50 × 4 × 80%) / 4 = 40 (High priority)
- Story B: (10 × 3 × 60%) / 2 = 9 (Low priority)
```

**MoSCoW Prioritization**:
```
Must Have (50% of backlog):   Core MVP features
Should Have (30%):             Important but not MVP
Could Have (15%):              Nice-to-have features
Won't Have (5%):               Explicitly deferred
```

**Value vs Risk Matrix**:
```
High Value + Low Risk    → Do first
High Value + High Risk   → Do early (mitigate risk)
Low Value + Low Risk     → Do last
Low Value + High Risk    → Don't do
```

### 5. Sequence Backlog

**Sequencing Principles**:

1. **MVP First**: Deliver core features before nice-to-haves
2. **Risk First**: Tackle high-risk items early
3. **Dependency First**: Complete blockers before dependent stories
4. **Learning First**: Validate assumptions early
5. **Value First**: Higher business value first (if low risk)

**Example Backlog Sequence** (20 stories, velocity 5/week):

```
Week 1: Stories 1-5 (MVP core)
Week 2: Stories 6-10 (MVP completion)
Week 3: Stories 11-15 (Enhanced features)
Week 4: Stories 16-20 (Polish & hardening)
```

### 6. Create Backlog Refinement Output

**Refined Backlog Document**:
```markdown
# Backlog - Prioritized & Sized

## Current Sprint Backlog
[Sprint-specific stories with story points]

## Future Backlog (Prioritized)

### Phase 1: MVP (Stories 1-10)
Total Points: 42

- [ ] STORY-001: User registration (8 points)
- [ ] STORY-002: User login (5 points)
- [ ] STORY-003: Dashboard (8 points)
...

### Phase 2: Enhanced Features (Stories 11-15)
Total Points: 28

- [ ] STORY-011: Advanced search (5 points)
...

### Phase 3: Polish & Hardening (Stories 16-20)
Total Points: 22

- [ ] STORY-016: Performance optimization (8 points)
...

## Backlog Health
- Total stories: 20
- Total points: 92
- Estimated velocity: 10/week
- Estimated duration: 9-10 weeks
- Dependencies: 3 blocking relationships
```

### 7. Manage Dependencies

**Dependency Mapping**:
```markdown
## Story Dependencies

### STORY-003: Dashboard
- Depends on: STORY-001, STORY-002
- Blocked by: STORY-002 (must complete login first)
- Can start: After STORY-001 is merged

### STORY-010: Integrations
- Depends on: STORY-005, STORY-006
- Blocks: STORY-015 (reporting needs integration data)

## Parallel Work
- STORY-001, STORY-004, STORY-007 can run in parallel
- STORY-002 blocks STORY-003, STORY-008
```

---

## Implementation Options

### Option 1: Manual Breakdown (Recommended for small projects)

Product Owner + Tech Lead workshop:
1. Read epic
2. Break into stories
3. Size with planning poker
4. Identify dependencies
5. Order by priority

### Option 2: Data-Driven (For larger projects)

Use historical data:
- Average story size in codebase
- Team velocity over time
- Complexity scoring system
- Automated dependency detection

### Option 3: Hybrid (Most common)

- Manual breakdown of epic
- Automated complexity scoring
- Team sizing with planning poker
- Automated dependency detection

---

## Performance Characteristics

- **Epic breakdown**: ~15-30 minutes per epic
- **Story sizing**: ~5 minutes per story (with team)
- **Dependency mapping**: <1 minute per story
- **Full backlog refinement**: 4-6 hours for 50 stories

---

## Testing Strategy

- Test backlog completeness (no stories left in epic)
- Test sizing consistency (similar complexity = similar points)
- Test dependency validity (no circular dependencies)
- Test prioritization logic (RICE scores calculated correctly)

---

## Used By

- **@backlog Agent**: Creates stories from epics using this skill

---

## Handoff Chain

```
@coordinator (phases + epics)
  ↓ epic_list
@backlog (creates stories) ← backlog-planning skill
  ↓ prioritized_backlog
@reporter (tracks progress against backlog)
```

---

## Filename**: `backlog-planning.skill.md`
