# Skill: Svelte Patterns (@svelte-patterns)

## Metadata

```yaml
name: svelte-patterns
agents: ["@svelte-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Svelte Patterns** skill provides comprehensive patterns for building reactive, performant Svelte applications. Covers component reactivity, stores, animations, and SvelteKit patterns.

## Scope

**Included**:
- Reactive declarations and statements
- Store patterns (writable, readable, derived)
- Component lifecycle and bindings
- Form handling and validation
- Animations and transitions
- SvelteKit routing
- Context and slot patterns

**Excluded**:
- GraphQL (separate implementation)
- Advanced build optimization
- SSR in-depth (see SvelteKit docs)

## Core Pattern 1: Reactive Declarations

```svelte
<!-- Reactive variable declaration -->
<script>
    let count = 0;
    let message = 'Hello';
    
    // Reactive declaration - recomputes when dependencies change
    $: doubled = count * 2;
    $: quadrupled = doubled * 2;
    
    // Reactive statement - runs when dependency changes
    $: if (count > 5) {
        console.log(`Count is now ${count}`);
    }
    
    function increment() {
        count += 1;  // Triggers reactive updates
    }
</script>

<button on:click={increment}>
    Count: {count}
</button>

<p>Doubled: {doubled}</p>
<p>Quadrupled: {quadrupled}</p>
```

## Core Pattern 2: Writable Stores

```svelte
<!-- store.js -->
<script>
    import { writable, derived } from 'svelte/store';
    
    // Create writable store
    export const user = writable({
        id: null,
        name: '',
        email: '',
        role: 'user'
    });
    
    // Update store
    export function updateUser(updates) {
        user.update(u => ({ ...u, ...updates }));
    }
    
    // Derived store (read-only computed value)
    export const isAdmin = derived(user, $user => $user.role === 'admin');
    
    // Complex derived store
    export const userDisplay = derived(user, $user => ({
        fullName: `${$user.name}`,
        initials: $user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase(),
        isAuthenticated: !!$user.id
    }));
</script>

<!-- Component.svelte -->
<script>
    import { user, updateUser, isAdmin } from './store.js';
</script>

{#if $isAdmin}
    <button>Admin Panel</button>
{/if}

{#if $user.id}
    <p>Welcome {$user.name}</p>
{:else}
    <p>Please log in</p>
{/if}
```

## Core Pattern 3: Store Subscription and Cleanup

```svelte
<script>
    import { user, notifications } from './store.js';
    import { onDestroy } from 'svelte';
    
    let userData = null;
    let notificationList = [];
    
    // Subscribe to store
    const unsubscribeUser = user.subscribe(value => {
        userData = value;
    });
    
    // Multiple subscriptions
    const unsubscribeNotifications = notifications.subscribe(value => {
        notificationList = value;
    });
    
    // Cleanup subscriptions on component destroy
    onDestroy(() => {
        unsubscribeUser();
        unsubscribeNotifications();
    });
</script>

<!-- Auto-subscription with $ syntax (preferred) -->
<script>
    import { user } from './store.js';
</script>

<!-- $ prefix auto-subscribes and unsubscribes -->
<p>Welcome {$user.name}</p>

<!-- Reactive update -->
<input bind:value={$user.email} />
```

## Core Pattern 4: Form Binding and Validation

```svelte
<script>
    import { writable } from 'svelte/store';
    
    let formData = {
        name: '',
        email: '',
        password: '',
        rememberMe: false
    };
    
    let errors = {};
    
    function validateForm() {
        errors = {};
        
        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }
        
        if (!formData.email.includes('@')) {
            errors.email = 'Valid email is required';
        }
        
        if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }
        
        return Object.keys(errors).length === 0;
    }
    
    async function handleSubmit() {
        if (!validateForm()) return;
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                console.log('Registration successful');
            }
        } catch (error) {
            console.error('Registration failed', error);
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit}>
    <div>
        <label>
            Name:
            <input bind:value={formData.name} />
        </label>
        {#if errors.name}
            <span class="error">{errors.name}</span>
        {/if}
    </div>
    
    <div>
        <label>
            Email:
            <input type="email" bind:value={formData.email} />
        </label>
        {#if errors.email}
            <span class="error">{errors.email}</span>
        {/if}
    </div>
    
    <div>
        <label>
            Password:
            <input type="password" bind:value={formData.password} />
        </label>
        {#if errors.password}
            <span class="error">{errors.password}</span>
        {/if}
    </div>
    
    <label>
        <input type="checkbox" bind:checked={formData.rememberMe} />
        Remember me
    </label>
    
    <button type="submit">Register</button>
</form>

<style>
    .error {
        color: red;
        font-size: 0.875rem;
    }
</style>
```

## Core Pattern 5: Animations and Transitions

```svelte
<script>
    import { transition, fade, slide, scale } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    
    let visible = false;
    let items = ['Item 1', 'Item 2', 'Item 3'];
</script>

<!-- Fade transition -->
{#if visible}
    <div transition:fade>
        This element fades in and out
    </div>
{/if}

<!-- Slide transition -->
{#if visible}
    <div transition:slide={{ duration: 300 }}>
        This element slides in
    </div>
{/if}

<!-- Scale with easing -->
{#if visible}
    <div transition:scale={{ duration: 500, easing: quintOut }}>
        This element scales in
    </div>
{/if}

<!-- In and out transitions -->
<div in:fade={{ delay: 200 }} out:fade={{ duration: 200 }}>
    Custom in/out transitions
</div>

<!-- List transitions -->
{#each items as item, i (item)}
    <div transition:slide={{ delay: i * 100 }}>
        {item}
    </div>
{/each}

<button on:click={() => (visible = !visible)}>Toggle</button>
```

## Core Pattern 6: Scoped Styling

```svelte
<script>
    let isActive = false;
</script>

<button class:active={isActive} on:click={() => (isActive = !isActive)}>
    Toggle
</button>

<div class="container">
    <h2>Scoped Styles</h2>
    <p>These styles only apply to this component</p>
</div>

<style>
    /* Scoped to this component only */
    button {
        padding: 0.5rem 1rem;
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
    }
    
    button:hover {
        background-color: #e0e0e0;
    }
    
    button.active {
        background-color: #007bff;
        color: white;
    }
    
    .container {
        padding: 2rem;
        background-color: #f9f9f9;
        border-radius: 8px;
    }
    
    /* Dynamic styling with variables */
    :root {
        --primary-color: #007bff;
        --padding: 1rem;
    }
    
    h2 {
        color: var(--primary-color);
        padding: var(--padding);
    }
</style>
```

## Core Pattern 7: Component Communication

```svelte
<!-- Parent.svelte -->
<script>
    import Child from './Child.svelte';
    
    let parentMessage = 'Hello from parent';
    let childMessage = '';
    
    function handleChildEvent(event) {
        childMessage = event.detail.message;
    }
</script>

<div>
    <h2>Parent Component</h2>
    <p>Message from child: {childMessage}</p>
</div>

<Child title={parentMessage} on:messageFromChild={handleChildEvent} />

<!-- Child.svelte -->
<script>
    import { createEventDispatcher } from 'svelte';
    
    export let title = 'Default title';
    
    const dispatch = createEventDispatcher();
    
    function sendMessage() {
        dispatch('messageFromChild', {
            message: 'Hello from child'
        });
    }
</script>

<div>
    <h3>{title}</h3>
    <button on:click={sendMessage}>Send Message</button>
</div>
```

## Core Pattern 8: Context and Slots

```svelte
<!-- Context example: Theme provider -->
<script>
    import { setContext } from 'svelte';
    import { writable } from 'svelte/store';
    
    const theme = writable('light');
    
    setContext('theme', theme);
</script>

<!-- Child component accessing context -->
<script>
    import { getContext } from 'svelte';
    
    const theme = getContext('theme');
</script>

<div class={$theme}>
    Current theme: {$theme}
</div>

<!-- Slot example: Reusable card component -->
<!-- Card.svelte -->
<script>
    export let title = 'Card Title';
    export let elevation = 2;
</script>

<div class="card" class:elevated={elevation > 0}>
    <h3>{title}</h3>
    <slot></slot>
</div>

<style>
    .card {
        padding: 1rem;
        border-radius: 8px;
        background: white;
    }
    
    .elevated {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
</style>

<!-- Using Card with slots -->
<Card title="Welcome">
    <p>This content goes into the default slot</p>
</Card>
```

## Advanced Pattern 1: Custom Stores

```svelte
<!-- Custom observable store -->
<script>
    function createObservable(initialValue) {
        let value = initialValue;
        const subscribers = new Set();
        
        return {
            subscribe(fn) {
                fn(value);
                subscribers.add(fn);
                
                return () => subscribers.delete(fn);
            },
            set(newValue) {
                if (newValue !== value) {
                    value = newValue;
                    subscribers.forEach(fn => fn(value));
                }
            },
            update(fn) {
                this.set(fn(value));
            },
            get() {
                return value;
            }
        };
    }
    
    export const count = createObservable(0);
</script>
```

## Advanced Pattern 2: Action Directives

```svelte
<script>
    function clickOutside(node) {
        function handleClick(event) {
            if (node && !node.contains(event.target)) {
                node.dispatchEvent(new CustomEvent('clickOutside'));
            }
        }
        
        document.addEventListener('click', handleClick, true);
        
        return {
            destroy() {
                document.removeEventListener('click', handleClick, true);
            }
        };
    }
    
    let showDropdown = true;
</script>

<div use:clickOutside on:clickOutside={() => (showDropdown = false)}>
    {#if showDropdown}
        <div class="dropdown">
            <button>Option 1</button>
            <button>Option 2</button>
        </div>
    {/if}
</div>
```

## Anti-Patterns

### ❌ Mutating Store Values Directly

```svelte
<!-- BAD: Direct mutation -->
<script>
    import { user } from './store.js';
    
    $user.email = 'new@example.com';  // Won't trigger updates!
</script>

<!-- GOOD: Use update -->
<script>
    import { user } from './store.js';
    
    user.update(u => ({ ...u, email: 'new@example.com' }));
</script>
```

### ❌ Unnecessary Subscriptions

```svelte
<!-- BAD: Manual subscription in onMount -->
<script>
    import { user } from './store.js';
    import { onMount } from 'svelte';
    
    let userData;
    
    onMount(() => {
        return user.subscribe(value => {
            userData = value;
        });
    });
</script>

<!-- GOOD: Use $ auto-subscription -->
<script>
    import { user } from './store.js';
</script>

<p>{$user.name}</p>
```

### ❌ Reactive Statements Without Dependencies

```svelte
<!-- BAD: Missing dependency -->
<script>
    let count = 0;
    let total = 0;
    
    $: total = count + 1;  // Works but unclear
</script>

<!-- GOOD: Clear dependencies -->
<script>
    let count = 0;
    let multiplier = 2;
    
    $: total = count * multiplier;  // Clear what triggers update
</script>
```

## Schema Reference

- `svelte-specialist.input.schema.json` - Component requirements
- `svelte-specialist.output.schema.json` - Generated structure

## Related Documentation

- Skill: `svelte-best-practices.md` - Performance and optimization
- Agent: `svelte-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Svelte patterns
