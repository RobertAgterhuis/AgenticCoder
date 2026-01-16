# Phase 2: Frontend Framework Expansion

**Duration:** 2 weken  
**Status:** ⬜ Not Started  
**Priority:** 🔴 Critical

---

## 🎯 Phase Objective

Uitbreiden van frontend capabilities naar Vue.js, Next.js, en Angular. Dit maakt het mogelijk om projecten te genereren met verschillende frontend frameworks afhankelijk van requirements.

---

## 📊 Current State vs Target State

| Framework | Current | Target |
|-----------|---------|--------|
| React | ✅ @react-specialist | ✅ Behouden |
| Vue.js | ❌ None | 🆕 @vue-specialist |
| Next.js | ❌ None | 🆕 @nextjs-specialist |
| Angular | ❌ None | 🆕 @angular-specialist |
| Vite | Partial | 🆕 vite-tooling skill |

---

## 📋 Tasks

### Task 2.1: @vue-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Vue.js 3 specialist met Composition API, Pinia state management, en Vue ecosystem expertise.

**Agent Definition:**

```markdown
# @vue-specialist Agent

**Agent ID**: `@vue-specialist`  
**Phase**: 10  
**Purpose**: Design and implement Vue.js 3 applications  
**Triggers From**: @frontend-specialist, @code-architect  
**Hands Off To**: @devops-specialist

---

## Core Responsibilities

### 1. Vue.js Architecture
- Composition API patterns
- Options API (legacy support)
- Single File Components (SFC)
- Script setup syntax
- Composables design

### 2. State Management
- Pinia store patterns
- Store composition
- State persistence
- DevTools integration
- TypeScript integration

### 3. Routing
- Vue Router 4
- Route guards
- Dynamic routes
- Nested routes
- Navigation patterns

### 4. Build & Tooling
- Vite configuration
- TypeScript integration
- ESLint + Prettier
- Vitest testing
- Cypress E2E

### 5. Component Patterns
- Props validation
- Emit declarations
- Provide/Inject
- Teleport usage
- Suspense patterns
```

**Technology Stack:**
```
Framework:     Vue 3.4+
State:         Pinia
Router:        Vue Router 4
Build:         Vite 5+
Styling:       Tailwind CSS / UnoCSS
Testing:       Vitest + Vue Test Utils
E2E:           Cypress / Playwright
TypeScript:    5.0+
```

**Project Structure:**
```
src/
├── components/
│   ├── common/
│   │   ├── AppHeader.vue
│   │   ├── AppFooter.vue
│   │   └── AppNavigation.vue
│   ├── features/
│   │   └── [feature]/
│   │       ├── [Feature]List.vue
│   │       ├── [Feature]Item.vue
│   │       └── [Feature]Form.vue
│   └── ui/
│       ├── BaseButton.vue
│       ├── BaseInput.vue
│       └── BaseModal.vue
├── composables/
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useNotification.ts
├── stores/
│   ├── auth.ts
│   ├── user.ts
│   └── index.ts
├── views/
│   ├── HomeView.vue
│   ├── LoginView.vue
│   └── DashboardView.vue
├── router/
│   └── index.ts
├── types/
│   └── index.ts
├── App.vue
└── main.ts
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Vue 3 Composition API patterns defined
- [ ] Pinia integration documented
- [ ] TypeScript support
- [ ] Handoff protocols defined

**Files to Create:**
- `.github/agents/@vue-specialist.agent.md`
- `.github/schemas/vue-specialist.input.schema.json`
- `.github/schemas/vue-specialist.output.schema.json`

---

### Task 2.2: @nextjs-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Next.js 14+ specialist met App Router, Server Components, en full-stack React expertise.

**Agent Definition:**

```markdown
# @nextjs-specialist Agent

**Agent ID**: `@nextjs-specialist`  
**Phase**: 10  
**Purpose**: Design and implement Next.js applications  
**Triggers From**: @frontend-specialist, @code-architect  
**Hands Off To**: @devops-specialist, @azure-architect

---

## Core Responsibilities

### 1. App Router Architecture
- Server Components (default)
- Client Components ('use client')
- Layouts and templates
- Loading and error states
- Route groups
- Parallel routes
- Intercepting routes

### 2. Data Fetching
- Server-side fetching
- Static generation (SSG)
- Server-side rendering (SSR)
- Incremental Static Regeneration (ISR)
- Client-side SWR/React Query

### 3. API Routes
- Route Handlers (app/api)
- Middleware
- Edge functions
- API authentication
- Rate limiting

### 4. Performance
- Image optimization
- Font optimization
- Script optimization
- Streaming SSR
- Partial prerendering

### 5. Deployment
- Vercel deployment
- Azure Static Web Apps
- Docker containerization
- Edge runtime
```

**Technology Stack:**
```
Framework:     Next.js 14+
React:         18.2+
State:         Zustand / Jotai
Styling:       Tailwind CSS
ORM:           Prisma / Drizzle
Auth:          NextAuth.js / Clerk
Testing:       Jest + React Testing Library
E2E:           Playwright
TypeScript:    5.0+
```

**Project Structure:**
```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx
│   └── settings/
│       └── page.tsx
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts
│   └── [resource]/
│       └── route.ts
├── components/
│   ├── ui/
│   └── features/
├── lib/
│   ├── db.ts
│   └── auth.ts
├── types/
├── layout.tsx
├── page.tsx
├── loading.tsx
├── error.tsx
└── not-found.tsx
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] App Router patterns defined
- [ ] Server/Client component guidelines
- [ ] API Routes patterns
- [ ] Azure deployment support

**Files to Create:**
- `.github/agents/@nextjs-specialist.agent.md`
- `.github/schemas/nextjs-specialist.input.schema.json`
- `.github/schemas/nextjs-specialist.output.schema.json`

---

### Task 2.3: @angular-specialist Agent

**Priority:** 🟡 High  
**Estimated:** 2 dagen

**Description:**  
Angular 17+ specialist met standalone components, signals, en enterprise Angular patterns.

**Agent Definition:**

```markdown
# @angular-specialist Agent

**Agent ID**: `@angular-specialist`  
**Phase**: 10  
**Purpose**: Design and implement Angular applications  
**Triggers From**: @frontend-specialist, @code-architect  
**Hands Off To**: @devops-specialist

---

## Core Responsibilities

### 1. Angular Architecture
- Standalone components (default)
- Modules (legacy support)
- Services and DI
- Signals for state
- Control flow (@if, @for, @switch)

### 2. State Management
- Signals
- NgRx (complex apps)
- Component store
- RxJS patterns

### 3. Routing
- Router configuration
- Guards (functional)
- Resolvers
- Lazy loading
- Route animations

### 4. Forms
- Reactive forms
- Template-driven forms
- Custom validators
- Dynamic forms
- Form arrays

### 5. HTTP & Backend
- HttpClient
- Interceptors
- Error handling
- Caching strategies
- Retry logic
```

**Technology Stack:**
```
Framework:     Angular 17+
State:         Signals / NgRx
Routing:       Angular Router
Styling:       Angular Material / Tailwind
Testing:       Jasmine + Karma / Jest
E2E:           Cypress / Playwright
TypeScript:    5.0+
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Standalone component patterns
- [ ] Signals state management
- [ ] Enterprise patterns documented
- [ ] Integration with backend services

**Files to Create:**
- `.github/agents/@angular-specialist.agent.md`
- `.github/schemas/angular-specialist.input.schema.json`
- `.github/schemas/angular-specialist.output.schema.json`

---

### Task 2.4: vue-patterns Skill

**Priority:** 🔴 Critical  
**Estimated:** 1.5 dagen

**Description:**  
Vue.js 3 best practices, Composition API patterns, en component design guidelines.

**Skill Topics:**

```markdown
# Vue Patterns Skill

## Core Patterns

### 1. Composable Pattern

​```typescript
// composables/useFetch.ts
export function useFetch<T>(url: string) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(true)

  const execute = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(url)
      data.value = await response.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  onMounted(execute)

  return { data, error, loading, refresh: execute }
}
​```

### 2. Pinia Store Pattern

​```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  async function login(credentials: LoginCredentials) {
    const response = await api.login(credentials)
    user.value = response.user
  }

  function logout() {
    user.value = null
  }

  return { user, isAuthenticated, login, logout }
})
​```

### 3. Component Props Pattern

​```vue
<script setup lang="ts">
interface Props {
  title: string
  items: Item[]
  loading?: boolean
  variant?: 'primary' | 'secondary'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  variant: 'primary'
})

const emit = defineEmits<{
  select: [item: Item]
  delete: [id: string]
}>()
</script>
​```
```

**Acceptance Criteria:**
- [ ] Composition API patterns
- [ ] Pinia store patterns
- [ ] Component communication patterns
- [ ] TypeScript integration
- [ ] Testing patterns

**Files to Create:**
- `.github/skills/vue-patterns.skill.md`

---

### Task 2.5: nextjs-patterns Skill

**Priority:** 🔴 Critical  
**Estimated:** 1.5 dagen

**Description:**  
Next.js 14+ patterns voor App Router, Server Components, en data fetching strategies.

**Skill Topics:**
- Server vs Client Components
- Data fetching patterns
- Caching strategies
- Route handlers
- Middleware patterns
- Authentication patterns
- Error handling
- Loading states
- Metadata API
- Image optimization

**Files to Create:**
- `.github/skills/nextjs-patterns.skill.md`

---

### Task 2.6: vite-tooling Skill

**Priority:** 🟡 High  
**Estimated:** 1 dag

**Description:**  
Vite configuration, plugins, en build optimization voor alle frontend frameworks.

**Skill Topics:**
- Vite configuration
- Plugin ecosystem
- Environment variables
- Build optimization
- Dev server configuration
- HMR configuration
- Library mode
- SSR support
- Multi-page apps

**Files to Create:**
- `.github/skills/vite-tooling.skill.md`

---

### Task 2.7: angular-patterns Skill

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
Angular 17+ patterns met standalone components, signals, en enterprise patterns.

**Skill Topics:**
- Standalone components
- Signals state management
- Control flow syntax
- Dependency injection
- RxJS patterns
- Form patterns
- HTTP patterns
- Testing patterns

**Files to Create:**
- `.github/skills/angular-patterns.skill.md`

---

## 📁 Files Created This Phase

```
.github/agents/
├── @vue-specialist.agent.md
├── @nextjs-specialist.agent.md
└── @angular-specialist.agent.md

.github/skills/
├── vue-patterns.skill.md
├── nextjs-patterns.skill.md
├── vite-tooling.skill.md
└── angular-patterns.skill.md

.github/schemas/
├── vue-specialist.input.schema.json
├── vue-specialist.output.schema.json
├── nextjs-specialist.input.schema.json
├── nextjs-specialist.output.schema.json
├── angular-specialist.input.schema.json
└── angular-specialist.output.schema.json
```

---

## ✅ Phase Completion Checklist

- [ ] @vue-specialist agent complete
- [ ] @nextjs-specialist agent complete
- [ ] @angular-specialist agent complete
- [ ] vue-patterns skill complete
- [ ] nextjs-patterns skill complete
- [ ] vite-tooling skill complete
- [ ] angular-patterns skill complete
- [ ] All schemas defined
- [ ] Integration with @frontend-specialist
- [ ] Framework selection logic documented

---

## 🔗 Navigation

← [01-PHASE-DATABASES.md](01-PHASE-DATABASES.md) | → [03-PHASE-ARCHITECTURE.md](03-PHASE-ARCHITECTURE.md)
