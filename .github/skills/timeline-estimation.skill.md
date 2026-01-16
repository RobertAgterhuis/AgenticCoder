# timeline-estimation Skill

**Skill ID**: `timeline-estimation`  
**Purpose**: Estimate project timelines, sprint durations, and delivery dates  
**Used By**: @coordinator agent  
**Type**: Planning and forecasting

---

## Knowledge Areas

- Agile estimation techniques (story points, velocity)
- Risk-based contingency planning
- Critical path analysis
- Team capacity modeling
- Historical velocity data interpretation

---

## Input Contract

```json
{
  "stories": [...],
  "team_size": 5,
  "team_velocity": 40,
  "sprint_duration_weeks": 2,
  "buffer_percentage": 20
}
```

---

## Output Contract

```json
{
  "total_story_points": 180,
  "estimated_sprints": 5,
  "estimated_weeks": 10,
  "estimated_delivery_date": "2026-03-24",
  "timeline_breakdown": [...]
}
```

---

## Core Capabilities

### 1. Calculate Story Points Total

**Aggregation by Epic**:

```markdown
# Epic Breakdown

## Epic 1: User Authentication (32 points)
- Story 1: User registration (8 points)
- Story 2: User login (5 points)
- Story 3: Password reset (5 points)
- Story 4: Email verification (3 points)
- Story 5: Session management (5 points)
- Story 6: OAuth integration (6 points)

## Epic 2: Dashboard (28 points)
- Story 7: Basic dashboard (8 points)
- Story 8: Data widgets (8 points)
- Story 9: User profile (5 points)
- Story 10: Settings page (7 points)

## Total Story Points: 180
## Average Story Size: 7.2 points
```

### 2. Estimate Team Velocity

**Velocity Calculation Models**:

#### New Team (No History)
```
Initial velocity = team_size × 8 points per person per sprint
Example: 5 developers × 8 = 40 points/sprint

Rationale:
- New teams need ramp-up time
- Unknown unknowns reduce velocity
- Conservative estimate for planning
```

#### Established Team (Historical Data)
```
Velocity = average of last 3 sprints

Example:
Sprint 1: 42 points
Sprint 2: 38 points
Sprint 3: 45 points
Average: 41.67 points/sprint
```

#### Scaling Factors by Team Size

| Team Size | Base Velocity | Communication Overhead | Effective Velocity |
|-----------|---------------|------------------------|-------------------|
| 1-2 devs  | 16 points     | 0%                     | 16 points         |
| 3-5 devs  | 40 points     | 10%                    | 36 points         |
| 6-10 devs | 80 points     | 20%                    | 64 points         |
| 11-20 devs| 160 points    | 30%                    | 112 points        |
| 20+ devs  | 320 points    | 40%                    | 192 points        |

**Rationale**: Larger teams have more communication overhead

### 3. Calculate Sprint Count

**Formula**:
```
Sprints Needed = Total Story Points / Team Velocity

Example:
180 points / 40 points per sprint = 4.5 sprints → round up to 5 sprints
```

**Rounding Rules**:
- Always round **up** (better to over-estimate than under-deliver)
- Add 0.5 sprint if remainder > 0.3 (significant partial sprint)

### 4. Apply Risk Buffer

**Buffer Percentages by Project Risk**:

| Risk Level | Buffer % | Example (10 weeks) | Rationale |
|------------|----------|-------------------|-----------|
| **Low**    | 10%      | +1 week = 11 weeks | Known tech, small team |
| **Medium** | 20%      | +2 weeks = 12 weeks | Some unknowns, medium team |
| **High**   | 30%      | +3 weeks = 13 weeks | New tech, large team |
| **Critical** | 50%    | +5 weeks = 15 weeks | Greenfield, regulatory |

**Risk Factors**:
- New technology stack (+10%)
- Distributed team (+5%)
- Complex integrations (+10%)
- Regulatory requirements (+15%)
- No product owner availability (+10%)

**Example Calculation**:
```
Base estimate: 10 weeks
Risk factors: New tech (10%) + Distributed team (5%) = 15% buffer
Timeline with buffer: 10 × 1.15 = 11.5 weeks → round to 12 weeks
```

### 5. Create Timeline Breakdown

**Sprint-by-Sprint Plan**:

```markdown
# Timeline Breakdown (5 sprints × 2 weeks = 10 weeks)

## Sprint 1 (Weeks 1-2): Foundation
- Story 1: User registration (8 points)
- Story 2: User login (5 points)
- Story 3: Password reset (5 points)
- Story 11: Database setup (3 points)
- Story 12: API scaffold (5 points)
**Total: 26 points** (65% of velocity - leave room for setup)

## Sprint 2 (Weeks 3-4): Authentication Complete
- Story 4: Email verification (3 points)
- Story 5: Session management (5 points)
- Story 6: OAuth integration (6 points)
- Story 13: Error handling (5 points)
- Story 14: Logging setup (3 points)
**Total: 22 points** (55% of velocity)

## Sprint 3 (Weeks 5-6): Dashboard Foundation
- Story 7: Basic dashboard (8 points)
- Story 8: Data widgets (8 points)
- Story 15: API integration (8 points)
**Total: 24 points** (60% of velocity)

## Sprint 4 (Weeks 7-8): User Features
- Story 9: User profile (5 points)
- Story 10: Settings page (7 points)
- Story 16: Admin panel (8 points)
**Total: 20 points** (50% of velocity)

## Sprint 5 (Weeks 9-10): Polish & Hardening
- Story 17: Performance optimization (8 points)
- Story 18: Security audit (5 points)
- Story 19: Documentation (3 points)
- Story 20: Bug fixes (5 points)
**Total: 21 points** (52% of velocity)

**Grand Total: 113 points**
**Buffer Remaining: 67 points for unknowns**
```

### 6. Calculate Delivery Date

**Date Calculation**:
```typescript
function calculateDeliveryDate(
  startDate: Date,
  sprintCount: number,
  sprintDurationWeeks: number
): Date {
  const totalWeeks = sprintCount * sprintDurationWeeks;
  const deliveryDate = new Date(startDate);
  deliveryDate.setDate(deliveryDate.getDate() + (totalWeeks * 7));
  return deliveryDate;
}

// Example
const start = new Date('2026-01-13');
const delivery = calculateDeliveryDate(start, 5, 2);
// Result: 2026-03-24 (10 weeks later)
```

### 7. Critical Path Analysis

**Dependency-Based Timeline**:

```markdown
# Critical Path

## Phase 1: Foundation (Weeks 1-2) ← BLOCKING
- Database setup
- API scaffold
- User authentication

↓ (Cannot proceed without these)

## Phase 2: Core Features (Weeks 3-6)
- Dashboard (depends on auth)
- User profile (depends on auth)

↓

## Phase 3: Advanced Features (Weeks 7-8)
- Admin panel (depends on auth + user profile)
- Integrations (depends on API scaffold)

↓

## Phase 4: Launch Prep (Weeks 9-10)
- Performance optimization
- Security audit
- Documentation

## Critical Path Duration: 10 weeks (cannot be compressed)
```

**Parallel Work Opportunities**:
- Frontend and backend can develop in parallel after API contracts defined
- Testing can run alongside feature development
- Documentation can be written incrementally

---

## Estimation Techniques

### Technique 1: Story Point Estimation (Recommended)

**Fibonacci Scale** (1, 2, 3, 5, 8, 13, 21):
- 1 point: <1 hour (trivial)
- 2 points: 1-2 hours (very simple)
- 3 points: 0.5 day (simple)
- 5 points: 1 day (medium)
- 8 points: 1-2 days (complex)
- 13 points: 2-3 days (very complex)
- 21 points: >3 days (epic - should be split)

### Technique 2: T-Shirt Sizing

**Quick Estimation**:
- XS: 1-2 points
- S: 3-5 points
- M: 5-8 points
- L: 8-13 points
- XL: 13-21 points (split into smaller stories)

### Technique 3: Historical Comparison

**Reference Stories**:
```
"How does this story compare to the user login story (5 points)?"
- Simpler → 3 points
- Similar → 5 points
- More complex → 8 points
```

---

## Adjustment Factors

### Team Experience Level

| Experience | Velocity Multiplier | Example (40 base) |
|------------|---------------------|-------------------|
| Junior     | 0.7×                | 28 points         |
| Mid-level  | 1.0×                | 40 points         |
| Senior     | 1.3×                | 52 points         |

### Project Complexity

| Complexity | Timeline Multiplier | Example (10 weeks) |
|------------|---------------------|-------------------|
| Simple     | 1.0×                | 10 weeks          |
| Moderate   | 1.2×                | 12 weeks          |
| Complex    | 1.5×                | 15 weeks          |
| Very Complex | 2.0×              | 20 weeks          |

---

## Performance Characteristics

- **Estimation time**: ~10-15 minutes for 50 stories
- **Accuracy**: ±20% for established teams, ±40% for new teams
- **Re-estimation**: Every 2-3 sprints as velocity stabilizes

---

## Testing Strategy

- Test with historical project data (compare estimate vs actual)
- Validate velocity assumptions against industry benchmarks
- Check critical path for logical dependencies
- Verify buffer percentages align with risk factors

---

## Used By

- **@coordinator Agent**: Creates phased implementation plan with timelines

---

## Handoff Chain

```
@backlog (stories with points)
  ↓ story_list
@coordinator (estimates timeline) ← timeline-estimation skill
  ↓ phase_timeline
@reporter (tracks progress against timeline)
```

---

## Example Output

```json
{
  "total_story_points": 180,
  "team_velocity": 40,
  "estimated_sprints": 5,
  "sprint_duration_weeks": 2,
  "base_timeline_weeks": 10,
  "risk_buffer_weeks": 2,
  "total_timeline_weeks": 12,
  "start_date": "2026-01-13",
  "estimated_delivery": "2026-04-06",
  "confidence": "Medium (±20%)",
  "critical_path": ["Foundation", "Core Features", "Launch Prep"],
  "parallel_work_possible": true
}
```

---

## Filename: `timeline-estimation.skill.md`
