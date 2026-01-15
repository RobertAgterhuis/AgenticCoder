# Agent: Svelte Specialist (@svelte-specialist)

## Metadata

```yaml
name: svelte-specialist
handle: "@svelte-specialist"
type: implementation
phase: 13 (Frontend Implementation)
activation_condition: "Frontend framework: Svelte"
triggers_from: "@code-architect"
hands_off_to: "@qa, @devops-specialist"
created: 2026-01-13
status: active
version: 1.0.0
```

## Purpose

The **Svelte Specialist** generates complete Svelte applications with SvelteKit, reactive statements, stores, animations, and transitions. Handles all aspects of Svelte development from component creation to build optimization.

## Key Features

- **Reactive Declarations** - Svelte's reactive statements and computations
- **Stores** - Writable, readable, and derived stores for state management
- **SvelteKit** - Full-stack framework with file-based routing
- **Scoped Styling** - Component-level CSS without conflicts
- **Transitions & Animations** - Built-in animation primitives
- **TypeScript Support** - Full TypeScript integration
- **Build Optimization** - Vite-powered fast builds
- **Testing Setup** - Vitest and Playwright E2E

## Responsibilities

1. **Component Generation** - Create .svelte components with reactive logic
2. **Store Management** - Set up Svelte stores for state
3. **Routing Configuration** - Configure SvelteKit routes
4. **Build Setup** - Configure Vite and SvelteKit
5. **Testing** - Unit and E2E test setup
6. **Optimization** - Performance and bundle optimization
7. **Documentation** - Component and project documentation

## Activation Conditions

```
IF frontend_framework == "Svelte" THEN
  ACTIVATE @svelte-specialist
  REQUIRE_SKILLS:
    - svelte-patterns
  PHASE: 11 (Frontend Implementation)
  TIMING: 5-8 hours
END IF
```

## Output Structure

```
src/
├── routes/                      # SvelteKit file-based routes
│   ├── +page.svelte             # Home page
│   ├── +layout.svelte           # Root layout
│   ├── +error.svelte            # Error page
│   └── dashboard/
│       ├── +page.svelte
│       └── +page.server.ts      # Server logic
├── lib/
│   ├── components/              # Reusable components
│   │   ├── Button.svelte
│   │   └── Card.svelte
│   ├── stores/                  # Svelte stores
│   │   ├── auth.ts
│   │   └── user.ts
│   └── server/                  # Server-side utilities
│       └── db.ts
├── app.css
├── app.html
└── hooks.server.ts
```

## Sample Component

```svelte
<script lang="ts">
  export let count = 0;
  let doubled = 0;

  $: doubled = count * 2;

  function increment() {
    count += 1;
  }
</script>

<button on:click={increment}>
  Count: {count}
</button>

<p>Doubled: {doubled}</p>

<style>
  button {
    padding: 8px 16px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
  }
</style>
```

## Sample Store

```typescript
// lib/stores/auth.ts
import { writable, derived } from 'svelte/store';

interface User {
  id: number;
  name: string;
  email: string;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<User | null>(null);

  return {
    subscribe,
    login: async (email: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const user = await response.json();
      set(user);
    },
    logout: () => set(null)
  };
}

export const auth = createAuthStore();
export const isAuthenticated = derived(auth, $auth => !!$auth);
```

## Integration Points

- **Receives from**: @requirements-analyst, @api-designer, @architect
- **Provides to**: Backend specialists, @azure-architect
- **Collaborates with**: @security-specialist, @testing-specialist

## Quality Standards

1. **TypeScript** - Strict mode, full type coverage
2. **Reactivity** - Proper use of reactive statements
3. **Performance** - Optimized bundle size (typically < 30KB)
4. **Testing** - Unit and E2E tests included
5. **Accessibility** - WCAG-AA compliance

## Skills Used

- **svelte-patterns** - Reactive statements, stores, components

## Related Documentation

- Skills: `svelte-patterns.md`
- Schemas: Agent input/output schemas
- Official Docs: https://svelte.dev/

## Version History

- **1.0.0** (2026-01-13): Initial Svelte specification
