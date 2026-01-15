# Feature F05: Angular Frontend Support

**Status**: Planned  
**Priority**: Medium  
**Complexity**: High  
**Estimated Effort**: 4-5 weeks  
**Target Phase**: Phase 2 Integration

---

## Problem Statement

### Current Gap
In AGENT_ACTIVATION_GUIDE.md staat bij **@react-specialist**:

```
❌ SKIPS when:
- Frontend framework: Vue, Angular, Svelte
- Backend-only project
- Native mobile development
```

**Betekenis**: Als gebruiker Angular kiest als frontend framework:
- ❌ Geen agent voor Angular frontend implementation
- ❌ Geen Angular-specific patterns (RxJS, Dependency Injection)
- ❌ Geen skill voor Angular best practices
- ❌ Geen schemas voor Angular component generation
- ❌ Geen integration met Angular CLI

### Business Impact
- **Angular heeft 15-20% market share** (vooral enterprise)
- Dominante keuze in **Fortune 500 bedrijven**
- Google-backed framework met enterprise support
- TypeScript-first approach (100% TypeScript)
- Mature ecosystem met Angular Material
- Sterk in grote enterprise applicaties

---

## Proposed Solution

### New Components Needed

#### 1. Agent: @angular-specialist
**Responsibility**: Angular frontend implementation  
**Phase**: 13 (parallel met @react-specialist, @vue-specialist)  
**Activation**: `IF frontend_framework == "Angular"`

**Output**:
- Angular components (TypeScript + HTML + CSS)
- Services (Dependency Injection)
- NgRx store (state management)
- Routing configuration (Angular Router)
- HTTP interceptors
- Guards and Resolvers
- Pipes and Directives
- Unit tests (Jasmine/Karma or Jest)
- E2E tests (Cypress/Playwright)

#### 2. Skill: angular-patterns
**Type**: Code skill  
**Used by**: @angular-specialist

**Content**:
- Component architecture (Smart vs Dumb components)
- Dependency Injection patterns
- RxJS operators and observables
- Angular lifecycle hooks
- Template syntax and directives
- Forms (Reactive Forms, Template-driven Forms)
- Change Detection strategies
- Angular Material integration

#### 3. Skill: angular-state-management
**Type**: Code skill  
**Used by**: @angular-specialist

**Content**:
- NgRx store setup
- Actions, Reducers, Selectors
- Effects (side effects handling)
- Entity adapter patterns
- Store DevTools integration
- Facade pattern for state management

#### 4. Schemas (6 files)
```
.github/schemas/agents/
├── @angular-specialist.input.schema.json
└── @angular-specialist.output.schema.json

.github/schemas/skills/
├── angular-patterns.input.schema.json
├── angular-patterns.output.schema.json
├── angular-state-management.input.schema.json
└── angular-state-management.output.schema.json
```

---

## Implementation Phases

### Phase 1: Research & Design (Week 1-2)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] Angular 17+ features analysis (Signals, Standalone Components)
- [ ] NgRx vs Akita vs NgXS decision (NgRx is de facto standard)
- [ ] Angular CLI integration patterns
- [ ] Dependency Injection patterns
- [ ] RxJS best practices
- [ ] Standalone Components vs NgModules (Angular 17+ trend)

**Review Points**:
- Angular Signals (nieuw in v16+) support? (Yes)
- Standalone Components of NgModules? (Beide ondersteunen)
- NgRx as default state management? (Yes for complex apps)
- Angular Material of andere UI library?

---

### Phase 2: Agent Specification (Week 2-3)
**Duration**: 10 dagen  
**Deliverables**:
- [ ] @angular-specialist.agent.md (450+ lines)
  - Angular component generation (Standalone + NgModule)
  - Service creation with Dependency Injection
  - NgRx store setup (actions, reducers, effects, selectors)
  - Angular Router configuration
  - HTTP interceptor setup
  - Guards and Resolvers
  - Reactive Forms patterns
  - Angular Material integration
  - Unit testing (Jest preferred over Jasmine)
  - E2E testing setup
  - Hands off to @dotnet-specialist or other backend

**Review Points**:
- Is @angular-specialist op zelfde niveau als @react-specialist?
- Zijn alle Angular 17+ features gedekt?
- Is RxJS complexity goed gedocumenteerd?
- Is output format compatible met backend agents?

---

### Phase 3: Skill Definitions (Week 3)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] angular-patterns.skill.md (250+ lines)
  - Component architecture (Smart/Dumb, Standalone)
  - Dependency Injection best practices
  - RxJS operators (map, filter, switchMap, combineLatest)
  - Angular lifecycle hooks (ngOnInit, ngOnDestroy, etc.)
  - Template syntax (ngFor, ngIf, ngSwitch)
  - Reactive Forms patterns
  - Change Detection strategies (OnPush)
  - Angular Signals (new in v16+)
  - Custom directives and pipes

- [ ] angular-state-management.skill.md (200+ lines)
  - NgRx architecture (Store, Actions, Reducers, Effects)
  - Entity adapter patterns
  - Selectors with memoization
  - Effects for async operations
  - Store DevTools integration
  - Facade pattern implementation
  - Testing NgRx code

**Review Points**:
- Zijn skills op enterprise niveau?
- Is NgRx complexity begrijpelijk?
- Zijn RxJS patterns modern?

---

### Phase 4: Schema Creation (Week 3-4)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] @angular-specialist.input.schema.json
  ```json
  {
    "frontend_architecture": {
      "project_structure": "src/app/features, src/app/core, src/app/shared",
      "component_type": "standalone | module-based",
      "ui_library": "Angular Material | PrimeNG | Clarity",
      "use_signals": true
    },
    "components_to_build": [
      {
        "name": "TodoListComponent",
        "type": "feature | shared | ui",
        "inputs": ["@Input() todos: Todo[]"],
        "outputs": ["@Output() todoAdded = new EventEmitter<Todo>()"],
        "standalone": true
      }
    ],
    "state_management": {
      "use_ngrx": true,
      "features": ["todos", "auth"],
      "use_entity_adapter": true
    },
    "routing": {
      "lazy_loading": true,
      "guards": ["AuthGuard", "AdminGuard"]
    },
    "api_integration": {
      "base_url": "https://api.example.com",
      "auth_method": "JWT",
      "use_interceptors": true
    },
    "testing_framework": "Jest | Jasmine"
  }
  ```

- [ ] @angular-specialist.output.schema.json
  ```json
  {
    "artifacts": {
      "components": [
        {
          "file": "src/app/features/todos/todo-list/todo-list.component.ts",
          "content": "@Component({...})\nexport class TodoListComponent {...}"
        },
        {
          "file": "src/app/features/todos/todo-list/todo-list.component.html",
          "content": "<div *ngFor=\"let todo of todos\">...</div>"
        },
        {
          "file": "src/app/features/todos/todo-list/todo-list.component.scss",
          "content": ".todo-list { padding: 1rem; }"
        }
      ],
      "services": [
        {
          "file": "src/app/core/services/todo.service.ts",
          "content": "@Injectable({ providedIn: 'root' })\nexport class TodoService {...}"
        }
      ],
      "store": [
        {
          "file": "src/app/state/todos/todos.actions.ts",
          "content": "export const loadTodos = createAction('[Todos] Load Todos');"
        },
        {
          "file": "src/app/state/todos/todos.reducer.ts",
          "content": "export const todosReducer = createReducer(...);"
        },
        {
          "file": "src/app/state/todos/todos.effects.ts",
          "content": "@Injectable()\nexport class TodosEffects {...}"
        },
        {
          "file": "src/app/state/todos/todos.selectors.ts",
          "content": "export const selectAllTodos = createSelector(...);"
        }
      ],
      "tests": [
        {
          "file": "src/app/features/todos/todo-list/todo-list.component.spec.ts",
          "content": "describe('TodoListComponent', () => {...});"
        }
      ]
    },
    "code_quality": {
      "type_coverage": 100,
      "components_generated": 15,
      "services_generated": 8
    },
    "next_phase": "@dotnet-specialist"
  }
  ```

- [ ] angular-patterns skill schemas (input/output)
- [ ] angular-state-management skill schemas (input/output)

**Review Points**:
- Zijn schemas consistent met andere frontend frameworks?
- Is NgRx structure correct gemodelleerd?
- Zijn Standalone Components supported?

---

### Phase 5: Integration with Existing System (Week 4)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] Update @code-architect.agent.md
  - Add Angular to frontend framework options
  - Add Angular-specific architecture patterns
  - Add RxJS patterns
  - Add NgRx state management patterns
  
- [ ] Update AGENT_ACTIVATION_GUIDE.md
  - Add @angular-specialist activation criteria
  - Update Phase 13 alternatives (React OR Vue OR Angular)
  - Update decision tree
  
- [ ] Update PHASE_FLOW.md
  - Update Phase 13 alternatives
  - Add Angular timing estimates (90-150m - complexer dan React/Vue)
  
- [ ] Update SYSTEM_ARCHITECTURE.md
  - Add @angular-specialist to Implementation Tier
  - Update agent inventory

**Review Points**:
- Conflicteert Angular path met React/Vue paths?
- Is Phase 13 decision logic helder?
- Is Angular complexity timing gereflecteerd?

---

### Phase 6: Scenario Integration (Week 5)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] Update S01 with Angular alternative
  - S01: Can use Angular instead of React
  - Component count similar (~15 components)
  - State management with NgRx
  - Higher complexity (RxJS, DI)
  
- [ ] Create Angular deployment example
  - Angular CLI build configuration
  - Static hosting (Azure Static Web Apps preferred)
  - Environment configuration
  - Production optimizations

**Review Points**:
- Is Angular alternative voor S01 realistisch?
- Zijn build/deploy instructions helder?
- Is complexity fair gerepresenteerd?

---

## System Impact Analysis

### Modified Components
| Component | Change | Lines Added | Review Needed |
|-----------|--------|-------------|---------------|
| @code-architect.agent.md | Add Angular framework option | ~100 | YES |
| AGENT_ACTIVATION_GUIDE.md | Add 1 agent | ~900 | YES |
| PHASE_FLOW.md | Update Phase 13 alternatives | ~250 | YES |
| SYSTEM_ARCHITECTURE.md | Add Angular specialist | ~450 | YES |
| README.md | Update agent count | ~20 | YES |

### New Components
| Component | Type | Lines | Review Needed |
|-----------|------|-------|---------------|
| @angular-specialist.agent.md | Agent spec | ~450 | YES |
| angular-patterns.skill.md | Skill spec | ~250 | YES |
| angular-state-management.skill.md | Skill spec | ~200 | YES |
| 6 schema files | JSON schemas | ~1,200 | YES |
| **Total New** | - | **~2,100 lines** | - |

---

## Testing Considerations (User Will Test)

### Test Scenarios
1. **S01 Angular Alternative**: Todo app met Angular + NgRx
2. **Angular + .NET backend**: Full-stack enterprise app
3. **Angular Material**: UI component library integration
4. **Standalone Components**: Modern Angular approach

### Validation Points
- [ ] @angular-specialist generates valid Angular 17+ code
- [ ] Dependency Injection is correct
- [ ] NgRx store is properly structured
- [ ] RxJS operators are used correctly
- [ ] Angular Router configuration is correct
- [ ] TypeScript strict mode compliance
- [ ] Unit tests are executable (Jest)

---

## Dependencies

### Prerequisites
- Phase 1 (existing system) must be 100% complete ✅
- @code-architect must support frontend framework selection ✅
- @react-specialist exists as reference ✅

### Parallel Work
- Can be developed parallel with F04 (Vue), F06 (Svelte)
- Can be developed parallel with F01-F03 (Cloud platforms)

### Blocking For
- None (standalone frontend framework)

---

## Success Criteria

### Must Have
- ✅ @angular-specialist agent fully documented (450+ lines)
- ✅ 2 Angular skills documented (450+ lines total)
- ✅ 6 schema files created with 100% coverage
- ✅ Phase 13 decision logic supports React OR Vue OR Angular
- ✅ S01 Angular alternative documented
- ✅ All existing documentation updated
- ✅ Angular 17+ Signals support

### Should Have
- NgRx Entity adapter patterns
- Angular Material integration guide
- Standalone Components as default
- RxJS best practices documented

### Nice to Have
- Angular Universal (SSR) support
- Angular PWA capabilities
- Micro-frontend architecture (Module Federation)

---

## Review Checklist

### Architecture Review
- [ ] Zijn @angular-specialist responsibilities duidelijk?
- [ ] Is NgRx de standaard state management? (Yes for complex apps)
- [ ] Is Dependency Injection goed uitgelegd?
- [ ] Is output compatible met backend agents?
- [ ] Is RxJS complexity manageable?

### Integration Review
- [ ] Conflicteert Angular met React/Vue in Phase 13?
- [ ] Is orchestrator logic updated?
- [ ] Zijn schema dependencies opgelost?
- [ ] Is timing realistisch (Angular is complexer)?

### Documentation Review
- [ ] Zijn alle documentatie files updated?
- [ ] Is agent count correct?
- [ ] Zijn decision trees helder?
- [ ] Is Angular 17+ feature set gedekt?

### Quality Review
- [ ] Zijn schemas syntactisch correct?
- [ ] Is NgRx structure correct?
- [ ] Zijn RxJS patterns modern?
- [ ] Is TypeScript strict mode enforced?

---

## Risks & Mitigations

### Risk 1: Angular Complexity
**Impact**: High  
**Probability**: Medium  
**Mitigation**: 
- Focus op moderne Angular (v17+)
- Gebruik Standalone Components (simpler dan NgModules)
- Duidelijke RxJS patterns documenteren
- Goede voorbeelden in skills

### Risk 2: NgRx Learning Curve
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**: 
- Provide clear NgRx patterns in skill
- Use Entity Adapter for boilerplate reduction
- Document Facade pattern for simplified API

### Risk 3: RxJS Complexity
**Impact**: High  
**Probability**: High  
**Mitigation**: 
- Focus op meest gebruikte operators
- Provide clear observable patterns
- Document unsubscribe strategies

### Risk 4: Angular vs React/Vue Consistency
**Impact**: Medium  
**Probability**: Low  
**Mitigation**: 
- Ensure output format is compatible
- Maintain consistent agent interface
- Use same orchestration patterns

---

## Angular-Specific Considerations

### Why Angular is Different

**1. TypeScript-First**
- 100% TypeScript (geen JSX)
- Stricter type checking
- Better IDE support

**2. Dependency Injection**
- Built-in DI container
- Service lifecycle management
- Testability benefits

**3. RxJS Observable-Based**
- Async data streams everywhere
- Learning curve higher
- Powerful but complex

**4. Opinionated Framework**
- Less choice = more consistency
- Built-in routing, forms, HTTP
- Enterprise-ready out of the box

**5. Larger Bundle Size**
- ~50KB minimum (vs React ~40KB)
- Mitigated by tree-shaking in modern Angular

---

## Next Steps

1. **Review dit document** - Valideer Angular approach
2. **Goedkeuring voor Phase 1** - Start Angular research
3. **NgRx vs simpler alternatives?** - For smaller apps, consider services only

---

**Status**: ⏳ Awaiting Review  
**Reviewer**: [User]  
**Next Document**: F06-Svelte-Frontend-Support.md

