# Skill: Vue Component Patterns

## Metadata

```yaml
name: vue-component-patterns
category: code
type: implementation
framework: Vue.js
created: 2026-01-13
version: 1.0.0
```

## Purpose

Provides comprehensive patterns and best practices for building Vue.js components using the Composition API, including component architecture, props/events design, composable creation, and advanced patterns for scalable Vue applications.

## Scope

### Included

- Single File Component (SFC) structure with `<script setup>`
- Composition API patterns (ref, reactive, computed, watch)
- Props and events type-safe definitions
- Composable design and reusability
- Component communication patterns (props down, events up, provide/inject)
- Slot patterns for flexible components
- Lifecycle hooks in Composition API
- Template refs and DOM access
- Async component patterns
- Component testing patterns

### Excluded

- Options API patterns (legacy Vue 2 style)
- Class component syntax
- Vue 2 specific features
- Custom render functions (advanced use case)
- Vuex patterns (use Pinia instead)

## Core Patterns

### 1. Single File Component Structure

**Standard Component Template:**

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed, onMounted } from 'vue'
import type { PropType } from 'vue'

// 2. Type definitions
interface User {
  id: number
  name: string
}

// 3. Props
interface Props {
  title: string
  users?: User[]
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  users: () => [],
  showHeader: true
})

// 4. Emits
const emit = defineEmits<{
  (e: 'select', user: User): void
  (e: 'update:modelValue', value: string): void
}>()

// 5. State
const searchQuery = ref('')
const isLoading = ref(false)

// 6. Computed
const filteredUsers = computed(() => 
  props.users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

// 7. Methods
const handleSelect = (user: User) => {
  emit('select', user)
}

// 8. Lifecycle
onMounted(() => {
  console.log('Component mounted')
})
</script>

<template>
  <div class="user-selector">
    <header v-if="showHeader">
      <h2>{{ title }}</h2>
      <input 
        v-model="searchQuery"
        type="search"
        placeholder="Search users..."
      />
    </header>
    
    <div v-if="isLoading" class="loading">Loading...</div>
    
    <ul v-else class="user-list">
      <li 
        v-for="user in filteredUsers" 
        :key="user.id"
        @click="handleSelect(user)"
      >
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.user-selector {
  padding: 1rem;
  
  .loading {
    text-align: center;
    padding: 2rem;
  }
}
</style>
```

### 2. Props Patterns

**Type-Safe Props with Defaults:**

```typescript
// Simple props
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Complex props with validation
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger'
  size: 'sm' | 'md' | 'lg'
  disabled?: boolean
  icon?: string
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  disabled: false
})

// Array/Object defaults (must be factory functions)
interface ListProps {
  items: string[]
  config: {
    pageSize: number
    sortOrder: 'asc' | 'desc'
  }
}

const props = withDefaults(defineProps<ListProps>(), {
  items: () => [],
  config: () => ({ pageSize: 10, sortOrder: 'asc' })
})

// Props destructuring (loses reactivity - use carefully)
const { title } = defineProps<Props>() // ❌ Not reactive

// Keep reactive access
const props = defineProps<Props>() // ✅ Reactive
console.log(props.title)

// Or use toRefs for destructuring
import { toRefs } from 'vue'
const props = defineProps<Props>()
const { title } = toRefs(props) // ✅ Reactive
```

**Props Validation:**

```typescript
// Runtime validation with TypeScript
interface Props {
  email: string
  age: number
}

const props = defineProps<Props>()

// Additional runtime validation
const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const isValid = computed(() => validateEmail(props.email) && props.age >= 18)
```

### 3. Events Patterns

**Type-Safe Event Emission:**

```typescript
// Simple events
const emit = defineEmits<{
  (e: 'save'): void
  (e: 'cancel'): void
}>()

emit('save')

// Events with payload
const emit = defineEmits<{
  (e: 'update', id: number, data: object): void
  (e: 'delete', id: number): void
  (e: 'error', error: Error): void
}>()

emit('update', 123, { name: 'John' })
emit('delete', 456)
emit('error', new Error('Failed'))

// v-model pattern
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// In template
// <CustomInput v-model="searchQuery" />

// Multiple v-models
const emit = defineEmits<{
  (e: 'update:firstName', value: string): void
  (e: 'update:lastName', value: string): void
}>()

// <UserForm v-model:first-name="first" v-model:last-name="last" />
```

### 4. Composable Patterns

**Creating Reusable Composables:**

```typescript
// composables/useCounter.ts
import { ref, computed, Ref } from 'vue'

export interface UseCounterOptions {
  min?: number
  max?: number
  step?: number
}

export function useCounter(
  initialValue = 0,
  options: UseCounterOptions = {}
) {
  const { min = -Infinity, max = Infinity, step = 1 } = options
  
  const count = ref(initialValue)
  
  const isAtMin = computed(() => count.value <= min)
  const isAtMax = computed(() => count.value >= max)
  const canIncrement = computed(() => !isAtMax.value)
  const canDecrement = computed(() => !isAtMin.value)
  
  function increment() {
    if (count.value + step <= max) {
      count.value += step
    }
  }
  
  function decrement() {
    if (count.value - step >= min) {
      count.value -= step
    }
  }
  
  function reset() {
    count.value = initialValue
  }
  
  function set(value: number) {
    if (value >= min && value <= max) {
      count.value = value
    }
  }
  
  return {
    count: readonly(count), // Expose as readonly
    isAtMin,
    isAtMax,
    canIncrement,
    canDecrement,
    increment,
    decrement,
    reset,
    set
  }
}

// Usage in component
const counter = useCounter(0, { min: 0, max: 10, step: 2 })
```

**Async Composable Pattern:**

```typescript
// composables/useFetch.ts
import { ref, Ref, unref, watchEffect } from 'vue'

export interface UseFetchOptions {
  immediate?: boolean
  onError?: (error: Error) => void
  onSuccess?: (data: any) => void
}

export function useFetch<T>(
  url: Ref<string> | string,
  options: UseFetchOptions = {}
) {
  const { immediate = true, onError, onSuccess } = options
  
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)
  
  async function execute() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(unref(url))
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      data.value = result
      onSuccess?.(result)
    } catch (err) {
      error.value = err as Error
      onError?.(err as Error)
    } finally {
      isLoading.value = false
    }
  }
  
  if (immediate) {
    execute()
  }
  
  // Re-fetch when URL changes
  watchEffect(() => {
    if (unref(url)) {
      execute()
    }
  })
  
  return {
    data: readonly(data),
    error: readonly(error),
    isLoading: readonly(isLoading),
    execute
  }
}

// Usage
const url = ref('/api/users')
const { data, isLoading, error, execute } = useFetch<User[]>(url)

// Refetch manually
execute()

// Change URL (triggers refetch)
url.value = '/api/users?page=2'
```

**State Management Composable:**

```typescript
// composables/useLocalStorage.ts
import { ref, watch, Ref } from 'vue'

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): Ref<T> {
  // Initialize with stored value or default
  const storedValue = localStorage.getItem(key)
  const data = ref<T>(
    storedValue ? JSON.parse(storedValue) : defaultValue
  ) as Ref<T>
  
  // Watch for changes and persist
  watch(
    data,
    (newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue))
    },
    { deep: true }
  )
  
  return data
}

// Usage
const preferences = useLocalStorage('user-preferences', {
  theme: 'dark',
  language: 'en'
})

// Changes automatically sync to localStorage
preferences.value.theme = 'light'
```

### 5. Component Communication Patterns

**Props Down, Events Up:**

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const message = ref('Hello')
const responses = ref<string[]>([])

const handleResponse = (response: string) => {
  responses.value.push(response)
}
</script>

<template>
  <div>
    <ChildComponent 
      :message="message"
      @response="handleResponse"
    />
    <ul>
      <li v-for="(r, i) in responses" :key="i">{{ r }}</li>
    </ul>
  </div>
</template>

<!-- ChildComponent.vue -->
<script setup lang="ts">
interface Props {
  message: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'response', response: string): void
}>()

const sendResponse = () => {
  emit('response', `Received: ${props.message}`)
}
</script>

<template>
  <div>
    <p>{{ message }}</p>
    <button @click="sendResponse">Send Response</button>
  </div>
</template>
```

**Provide/Inject for Deep Hierarchies:**

```typescript
// Parent component
import { provide, ref } from 'vue'

const theme = ref('dark')
const updateTheme = (newTheme: string) => {
  theme.value = newTheme
}

// Provide to all descendants
provide('theme', readonly(theme))
provide('updateTheme', updateTheme)

// Deep child component
import { inject, Ref } from 'vue'

const theme = inject<Ref<string>>('theme')
const updateTheme = inject<(theme: string) => void>('updateTheme')

// Type-safe provide/inject with InjectionKey
// types/injectionKeys.ts
import { InjectionKey, Ref } from 'vue'

export interface ThemeContext {
  theme: Ref<string>
  updateTheme: (theme: string) => void
}

export const themeKey: InjectionKey<ThemeContext> = Symbol('theme')

// Parent
provide(themeKey, { theme, updateTheme })

// Child
const themeContext = inject(themeKey)
if (themeContext) {
  themeContext.updateTheme('light')
}
```

**Event Bus Pattern (for unrelated components):**

```typescript
// utils/eventBus.ts
import { ref } from 'vue'

type EventCallback = (payload?: any) => void

class EventBus {
  private events: Map<string, EventCallback[]> = new Map()
  
  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }
  
  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
  
  emit(event: string, payload?: any) {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(payload))
    }
  }
}

export const eventBus = new EventBus()

// Component A
import { onUnmounted } from 'vue'
import { eventBus } from '@/utils/eventBus'

const handleNotification = (message: string) => {
  console.log('Notification:', message)
}

eventBus.on('notification', handleNotification)

onUnmounted(() => {
  eventBus.off('notification', handleNotification)
})

// Component B
eventBus.emit('notification', 'Hello from Component B!')
```

### 6. Slot Patterns

**Basic Slots:**

```vue
<!-- Button.vue -->
<template>
  <button class="btn">
    <slot>Default Text</slot>
  </button>
</template>

<!-- Usage -->
<Button>Custom Text</Button>
<Button /> <!-- Shows "Default Text" -->
```

**Named Slots:**

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <header class="card__header">
      <slot name="header">Default Header</slot>
    </header>
    
    <main class="card__body">
      <slot>Default content</slot>
    </main>
    
    <footer class="card__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<!-- Usage -->
<Card>
  <template #header>
    <h2>Custom Header</h2>
  </template>
  
  <p>Main content here</p>
  
  <template #footer>
    <button>Action</button>
  </template>
</Card>
```

**Scoped Slots:**

```vue
<!-- List.vue -->
<script setup lang="ts">
interface Props {
  items: any[]
}

const props = defineProps<Props>()
</script>

<template>
  <ul class="list">
    <li v-for="(item, index) in items" :key="index">
      <slot :item="item" :index="index">
        {{ item }}
      </slot>
    </li>
  </ul>
</template>

<!-- Usage -->
<List :items="users">
  <template #default="{ item, index }">
    <div>
      <strong>{{ index + 1 }}.</strong>
      {{ item.name }} - {{ item.email }}
    </div>
  </template>
</List>
```

**Renderless Components Pattern:**

```vue
<!-- FetchData.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  url: string
}

const props = defineProps<Props>()

const data = ref(null)
const isLoading = ref(false)
const error = ref<Error | null>(null)

onMounted(async () => {
  isLoading.value = true
  
  try {
    const response = await fetch(props.url)
    data.value = await response.json()
  } catch (err) {
    error.value = err as Error
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <slot 
    :data="data" 
    :isLoading="isLoading" 
    :error="error"
  />
</template>

<!-- Usage -->
<FetchData url="/api/users">
  <template #default="{ data, isLoading, error }">
    <div v-if="isLoading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <ul v-else>
      <li v-for="user in data" :key="user.id">{{ user.name }}</li>
    </ul>
  </template>
</FetchData>
```

### 7. Template Refs

**Accessing DOM Elements:**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const inputRef = ref<HTMLInputElement>()
const containerRef = ref<HTMLDivElement>()

onMounted(() => {
  // Focus input on mount
  inputRef.value?.focus()
  
  // Get container dimensions
  if (containerRef.value) {
    const width = containerRef.value.offsetWidth
    console.log('Container width:', width)
  }
})

const focusInput = () => {
  inputRef.value?.focus()
}
</script>

<template>
  <div ref="containerRef">
    <input 
      ref="inputRef"
      type="text"
      placeholder="Enter text..."
    />
    <button @click="focusInput">Focus Input</button>
  </div>
</template>
```

**Component Refs:**

```vue
<!-- ChildComponent.vue -->
<script setup lang="ts">
const count = ref(0)

const increment = () => {
  count.value++
}

// Expose methods to parent
defineExpose({
  increment,
  count
})
</script>

<!-- ParentComponent.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const childRef = ref<InstanceType<typeof ChildComponent>>()

const callChildMethod = () => {
  childRef.value?.increment()
  console.log('Child count:', childRef.value?.count)
}
</script>

<template>
  <div>
    <ChildComponent ref="childRef" />
    <button @click="callChildMethod">Increment Child</button>
  </div>
</template>
```

### 8. Lifecycle Hooks

**Composition API Lifecycle:**

```typescript
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onActivated,
  onDeactivated,
  onErrorCaptured
} from 'vue'

// Setup phase (runs immediately)
console.log('Setup phase')

// Before component is mounted to DOM
onBeforeMount(() => {
  console.log('Before mount')
})

// After component is mounted to DOM
onMounted(() => {
  console.log('Mounted - can access DOM')
  // Fetch data, set up subscriptions, etc.
})

// Before reactive data changes cause re-render
onBeforeUpdate(() => {
  console.log('Before update')
})

// After reactive data changes and re-render
onUpdated(() => {
  console.log('Updated')
})

// Before component is unmounted
onBeforeUnmount(() => {
  console.log('Before unmount')
  // Clean up subscriptions, timers, etc.
})

// After component is unmounted
onUnmounted(() => {
  console.log('Unmounted')
})

// For <keep-alive> components
onActivated(() => {
  console.log('Component activated')
})

onDeactivated(() => {
  console.log('Component deactivated')
})

// Error handling
onErrorCaptured((err, instance, info) => {
  console.error('Error captured:', err, info)
  return false // Return false to stop propagation
})
```

**Common Lifecycle Patterns:**

```typescript
// Data fetching
onMounted(async () => {
  isLoading.value = true
  try {
    data.value = await fetchData()
  } finally {
    isLoading.value = false
  }
})

// Cleanup
onBeforeUnmount(() => {
  // Clear timers
  if (timer) {
    clearInterval(timer)
  }
  
  // Unsubscribe from events
  eventBus.off('event', handler)
  
  // Cancel pending requests
  abortController.abort()
})

// Window event listeners
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

## Advanced Patterns

### 1. Dynamic Components

```vue
<script setup lang="ts">
import { ref, Component } from 'vue'
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'
import ComponentC from './ComponentC.vue'

const currentComponent = ref<Component>(ComponentA)

const components: Record<string, Component> = {
  a: ComponentA,
  b: ComponentB,
  c: ComponentC
}

const switchComponent = (key: string) => {
  currentComponent.value = components[key]
}
</script>

<template>
  <div>
    <button @click="switchComponent('a')">A</button>
    <button @click="switchComponent('b')">B</button>
    <button @click="switchComponent('c')">C</button>
    
    <component :is="currentComponent" />
    
    <!-- With keep-alive to preserve state -->
    <keep-alive>
      <component :is="currentComponent" />
    </keep-alive>
  </div>
</template>
```

### 2. Async Components

```typescript
import { defineAsyncComponent } from 'vue'

// Simple async component
const AsyncComponent = defineAsyncComponent(
  () => import('./HeavyComponent.vue')
)

// With loading and error components
const AsyncComponentAdvanced = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200, // Delay before showing loading component
  timeout: 3000, // Timeout for loading
  suspensible: false,
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) {
      retry() // Retry loading
    } else {
      fail() // Give up
    }
  }
})
```

### 3. Teleport Pattern

```vue
<script setup lang="ts">
import { ref } from 'vue'

const isModalOpen = ref(false)
</script>

<template>
  <div class="component">
    <button @click="isModalOpen = true">Open Modal</button>
    
    <!-- Teleport to body (outside Vue app) -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="modal">
        <div class="modal__backdrop" @click="isModalOpen = false" />
        <div class="modal__content">
          <h2>Modal Title</h2>
          <p>Modal content</p>
          <button @click="isModalOpen = false">Close</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
```

### 4. Composable Composition

```typescript
// Combine multiple composables
export function useUserManagement() {
  const { data: user, isLoading, error, execute } = useFetch<User>('/api/user')
  const { data: preferences } = useLocalStorage('preferences', {})
  const { increment, decrement, count } = useCounter(0)
  
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  return {
    user,
    isLoading,
    error,
    preferences,
    isAdmin,
    refreshUser: execute,
    loginCount: count,
    incrementLogin: increment
  }
}
```

## Schema Reference

This skill's input and output structures are defined in:
- `docs/schemas/skills/vue-component-patterns.input.schema.json`
- `docs/schemas/skills/vue-component-patterns.output.schema.json`

## Version History

- **1.0.0** (2026-01-13): Initial Vue 3 Composition API patterns

## Related Documentation

- Agent: `vue-specialist.md`
- Related Skills: `vue-best-practices.md`
- Official Docs: https://vuejs.org/guide/
