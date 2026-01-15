# Skill: Svelte Best Practices (@svelte-best-practices)

## Metadata

```yaml
name: svelte-best-practices
agents: ["@svelte-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Svelte Best Practices** skill provides guidance on building performant, maintainable, and scalable Svelte applications with emphasis on performance optimization, testing, and production deployment.

## Scope

**Included**:
- Performance optimization
- Testing strategies (unit and E2E)
- Code organization and structure
- SvelteKit conventions
- Build optimization
- Deployment strategies
- Accessibility best practices
- State management patterns

**Excluded**:
- CSS frameworks (Tailwind config)
- Advanced build customization
- Low-level Svelte internals

## Core Pattern 1: Performance Optimization

```svelte
<!-- Lazy loading components -->
<script>
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    
    let HeavyComponent = null;
    
    onMount(async () => {
        if (browser) {
            HeavyComponent = (await import('./HeavyComponent.svelte')).default;
        }
    });
</script>

{#if HeavyComponent}
    <svelte:component this={HeavyComponent} />
{:else}
    <p>Loading component...</p>
{/if}

<!-- Virtual scrolling for large lists -->
<script>
    import { VirtualScroll } from 'svelte-virtual-scroll';
    
    let items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
</script>

<VirtualScroll {items} let:item height={40}>
    <div class="item">{item.name}</div>
</VirtualScroll>

<!-- Image optimization -->
<img 
    src="image.jpg" 
    alt="Description"
    loading="lazy"
    decoding="async"
    width="400"
    height="300"
/>

<!-- Code splitting with dynamic imports -->
<script>
    async function loadFeature() {
        const { feature } = await import('./feature.js');
        feature();
    }
</script>
```

## Core Pattern 2: Testing Strategy

```svelte
<!-- Unit test example with Vitest -->
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import Counter from './Counter.svelte';

describe('Counter', () => {
    it('should increment count', async () => {
        render(Counter);
        
        const button = screen.getByText('Increment');
        await fireEvent.click(button);
        
        expect(screen.getByText('Count: 1')).toBeInTheDocument();
    });
    
    it('should decrement count', async () => {
        render(Counter);
        
        const button = screen.getByText('Decrement');
        await fireEvent.click(button);
        
        expect(screen.getByText('Count: -1')).toBeInTheDocument();
    });
});

<!-- E2E test with Playwright -->
import { test, expect } from '@playwright/test';

test('counter increments', async ({ page }) => {
    await page.goto('/');
    
    const button = page.getByText('Increment');
    await button.click();
    
    await expect(page.getByText('Count: 1')).toBeVisible();
});

<!-- Component props testing -->
<script>
    import { render } from '@testing-library/svelte';
    import Card from './Card.svelte';
    
    it('should render with custom title', () => {
        const { getByText } = render(Card, {
            props: { title: 'Custom Title' }
        });
        
        expect(getByText('Custom Title')).toBeInTheDocument();
    });
</script>
```

## Core Pattern 3: Code Organization

```
src/
├── routes/
│   ├── +page.svelte          # Home page
│   ├── +layout.svelte        # Root layout
│   ├── about/
│   │   └── +page.svelte      # /about
│   └── blog/
│       └── [slug]
│           └── +page.svelte  # /blog/:slug
├── lib/
│   ├── components/           # Reusable components
│   │   ├── Header.svelte
│   │   ├── Footer.svelte
│   │   └── Card.svelte
│   ├── stores/               # Svelte stores
│   │   ├── user.js
│   │   └── theme.js
│   ├── api/                  # API utilities
│   │   ├── client.js
│   │   └── endpoints.js
│   ├── utils/                # Utility functions
│   │   ├── formatters.js
│   │   └── validators.js
│   └── types/                # TypeScript types
│       └── index.d.ts
├── hooks.server.js           # Server hooks
└── app.css                   # Global styles

<!-- Proper SvelteKit page structure -->
<!-- src/routes/+page.svelte -->
<script lang="ts">
    import Card from '$lib/components/Card.svelte';
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<svelte:head>
    <title>Home</title>
</svelte:head>

<h1>Welcome</h1>
{#each data.posts as post}
    <Card title={post.title} content={post.content} />
{/each}

<!-- src/routes/+page.server.ts -->
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    const response = await fetch('/api/posts');
    const posts = await response.json();
    
    return { posts };
};
```

## Core Pattern 4: Server-Side Rendering

```svelte
<!-- src/routes/products/+page.server.ts -->
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
    const response = await fetch(`/api/products/${params.id}`);
    
    if (!response.ok) {
        throw error(404, 'Product not found');
    }
    
    const product = await response.json();
    
    return { product };
};

<!-- src/routes/products/+page.svelte -->
<script lang="ts">
    import type { PageData } from './$types';
    
    export let data: PageData;
    
    $: ({ product } = data);
</script>

<svelte:head>
    <title>{product.name}</title>
</svelte:head>

<h1>{product.name}</h1>
<p>{product.description}</p>
<p>Price: ${product.price}</p>
```

## Core Pattern 5: API Integration

```svelte
<!-- src/lib/api/client.ts -->
export async function apiCall(
    endpoint: string,
    options: RequestInit = {}
) {
    const response = await fetch(`/api${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    return response.json();
}

<!-- Component with API integration -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { apiCall } from '$lib/api/client';
    
    let users = [];
    let loading = true;
    let error: string | null = null;
    
    onMount(async () => {
        try {
            users = await apiCall('/users');
        } catch (e) {
            error = e instanceof Error ? e.message : 'Unknown error';
        } finally {
            loading = false;
        }
    });
</script>

{#if loading}
    <p>Loading...</p>
{:else if error}
    <p class="error">{error}</p>
{:else}
    <ul>
        {#each users as user (user.id)}
            <li>{user.name}</li>
        {/each}
    </ul>
{/if}
```

## Core Pattern 6: Accessibility

```svelte
<!-- Accessible form component -->
<script lang="ts">
    let email = '';
    let error = '';
    
    function handleSubmit() {
        if (!email.includes('@')) {
            error = 'Invalid email address';
        } else {
            error = '';
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit}>
    <div class="form-group">
        <label for="email">Email Address</label>
        <input
            id="email"
            type="email"
            bind:value={email}
            aria-describedby={error ? 'email-error' : null}
            required
        />
        {#if error}
            <span id="email-error" role="alert" class="error">
                {error}
            </span>
        {/if}
    </div>
    
    <button type="submit" disabled={!email}>Submit</button>
</form>

<style>
    .form-group {
        margin-bottom: 1rem;
    }
    
    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }
    
    input {
        width: 100%;
        padding: 0.5rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    
    .error {
        color: #d32f2f;
        font-size: 0.875rem;
    }
</style>

<!-- Semantic HTML for navigation -->
<nav>
    <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
        <li><a href="/contact">Contact</a></li>
    </ul>
</nav>
```

## Core Pattern 7: Build Optimization

```javascript
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    plugins: [svelte()],
    
    build: {
        // Code splitting
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor': ['svelte'],
                    'ui': ['./src/lib/components']
                }
            }
        },
        
        // Minification
        minify: 'terser',
        
        // Source maps
        sourcemap: false,
        
        // Report compressed size
        reportCompressedSize: true
    },
    
    // Environment variables
    define: {
        __VERSION__: JSON.stringify('1.0.0')
    }
});

// svelte.config.js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
    preprocess: vitePreprocess(),
    
    kit: {
        adapter: adapter(),
        
        // Optimization
        inlineStylesToHead: true
    }
};
```

## Core Pattern 8: State Management

```svelte
<!-- Store composition pattern -->
<script>
    import { writable, derived } from 'svelte/store';
    
    // Base store
    const todos = writable([
        { id: 1, text: 'Learn Svelte', completed: false }
    ]);
    
    // Derived store for completed count
    export const completedCount = derived(todos, $todos =>
        $todos.filter(t => t.completed).length
    );
    
    // Derived store for filtered todos
    export const filteredTodos = derived(todos, $todos => $todos);
    
    // Helper functions
    export function addTodo(text) {
        todos.update(t => [...t, {
            id: Math.max(...t.map(x => x.id), 0) + 1,
            text,
            completed: false
        }]);
    }
    
    export function toggleTodo(id) {
        todos.update(t => t.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    }
    
    export function removeTodo(id) {
        todos.update(t => t.filter(todo => todo.id !== id));
    }
</script>

<!-- Using state management -->
<script>
    import { todos, completedCount, addTodo, toggleTodo } from './store.js';
</script>

<h2>Todos ({$completedCount} completed)</h2>

<input 
    type="text"
    placeholder="Add a new todo"
    on:keydown={e => {
        if (e.key === 'Enter' && e.target.value) {
            addTodo(e.target.value);
            e.target.value = '';
        }
    }}
/>

<ul>
    {#each $todos as todo (todo.id)}
        <li class:completed={todo.completed}>
            <input
                type="checkbox"
                checked={todo.completed}
                on:change={() => toggleTodo(todo.id)}
            />
            {todo.text}
        </li>
    {/each}
</ul>
```

## Anti-Patterns

### ❌ Over-complicating Reactive Statements

```svelte
<!-- BAD: Complex nested reactive statements -->
<script>
    let a = 0;
    $: if (a > 0) {
        $: b = a * 2;
    }
</script>

<!-- GOOD: Simple, clear reactive statement -->
<script>
    let a = 0;
    $: b = a > 0 ? a * 2 : 0;
</script>
```

### ❌ Memory Leaks from Event Listeners

```svelte
<!-- BAD: No cleanup -->
<script>
    onMount(() => {
        window.addEventListener('resize', handleResize);
    });
</script>

<!-- GOOD: With cleanup -->
<script>
    import { onDestroy } from 'svelte';
    
    onMount(() => {
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    });
</script>
```

### ❌ Blocking Async Operations

```svelte
<!-- BAD: Blocking in onMount -->
<script>
    onMount(async () => {
        await fetch('/api/data');  // Blocks rendering
    });
</script>

<!-- GOOD: Non-blocking with load function -->
<!-- src/routes/+page.server.ts -->
export const load: PageServerLoad = async ({ fetch }) => {
    const data = await fetch('/api/data');
    return { data };
};
```

## Schema Reference

- `svelte-specialist.input.schema.json` - Component requirements
- `svelte-specialist.output.schema.json` - Generated structure

## Related Documentation

- Skill: `svelte-patterns.md` - Component patterns
- Agent: `svelte-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Svelte best practices
