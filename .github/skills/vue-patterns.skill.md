# Vue.js 3 Patterns Skill

**Vue 3 Composition API, Reactivity, and Advanced Patterns**

**Version**: 1.0  
**Category**: Frontend Framework  
**Related Agents**: @vue-specialist, @frontend-specialist

---

## Skill Overview

This skill covers Vue 3 patterns including Composition API, Pinia state management, Vue Router 4, and advanced features like Teleport, Suspense, and provide/inject.

---

## Core Concepts

### 1. Composition API Fundamentals

#### Script Setup Syntax
```vue
<script setup lang="ts">
import { ref, reactive, computed, watch, watchEffect, onMounted } from 'vue'

// Ref for primitives
const count = ref(0)

// Reactive for objects
const user = reactive({
  name: 'John',
  age: 30
})

// Computed with getter
const doubleCount = computed(() => count.value * 2)

// Computed with getter and setter
const fullName = computed({
  get: () => `${user.firstName} ${user.lastName}`,
  set: (value: string) => {
    const [first, last] = value.split(' ')
    user.firstName = first
    user.lastName = last
  }
})

// Watch single source
watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`)
})

// Watch multiple sources
watch([count, () => user.name], ([newCount, newName]) => {
  console.log(`Count: ${newCount}, Name: ${newName}`)
})

// Watch with options
watch(
  () => user.name,
  (newName) => { console.log(newName) },
  { immediate: true, deep: false }
)

// WatchEffect - auto tracks dependencies
watchEffect(() => {
  console.log(`Count is ${count.value}`)
})

// Lifecycle hooks
onMounted(() => {
  console.log('Component mounted')
})
</script>
```

### 2. Props and Emits with TypeScript

#### Typed Props
```vue
<script setup lang="ts">
// Runtime declaration
const props = defineProps({
  title: String,
  count: {
    type: Number,
    required: true
  },
  items: {
    type: Array as PropType<Item[]>,
    default: () => []
  }
})

// Type-based declaration (recommended)
interface Props {
  userId: string
  name?: string
  isAdmin?: boolean
  items?: Item[]
}

const props = withDefaults(defineProps<Props>(), {
  name: 'Guest',
  isAdmin: false,
  items: () => []
})
</script>
```

#### Typed Emits
```vue
<script setup lang="ts">
// Runtime declaration
const emit = defineEmits(['update', 'delete'])

// Type-based declaration (recommended)
const emit = defineEmits<{
  update: [id: string, data: UpdateData]
  delete: [id: string]
  'custom-event': [payload: CustomPayload]
}>()

// Usage
emit('update', '123', { name: 'Updated' })
</script>
```

### 3. Pinia Store Patterns

#### Setup Store (Composition API Style)
```typescript
// stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Product } from '@/types'

export const useCartStore = defineStore('cart', () => {
  // State
  const items = ref<CartItem[]>([])
  const couponCode = ref<string | null>(null)
  const loading = ref(false)

  // Getters
  const totalItems = computed(() => 
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const discount = computed(() => {
    if (!couponCode.value) return 0
    // Apply discount logic
    return couponCode.value === 'SAVE10' ? subtotal.value * 0.1 : 0
  })

  const total = computed(() => subtotal.value - discount.value)

  const itemById = computed(() => {
    return (id: string) => items.value.find(item => item.id === id)
  })

  // Actions
  function addItem(product: Product, quantity = 1) {
    const existing = items.value.find(item => item.productId === product.id)
    
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({
        id: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity
      })
    }
  }

  function removeItem(itemId: string) {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  function updateQuantity(itemId: string, quantity: number) {
    const item = items.value.find(item => item.id === itemId)
    if (item) {
      item.quantity = Math.max(0, quantity)
      if (item.quantity === 0) {
        removeItem(itemId)
      }
    }
  }

  function applyCoupon(code: string) {
    couponCode.value = code
  }

  function clearCart() {
    items.value = []
    couponCode.value = null
  }

  // Persist to localStorage
  function $hydrate() {
    const saved = localStorage.getItem('cart')
    if (saved) {
      items.value = JSON.parse(saved)
    }
  }

  function $persist() {
    localStorage.setItem('cart', JSON.stringify(items.value))
  }

  return {
    // State
    items,
    couponCode,
    loading,
    // Getters
    totalItems,
    subtotal,
    discount,
    total,
    itemById,
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    applyCoupon,
    clearCart,
    $hydrate,
    $persist
  }
})
```

#### Using Store in Components
```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

// Destructure reactive state with storeToRefs
const { items, totalItems, total } = storeToRefs(cartStore)

// Actions can be destructured directly
const { addItem, removeItem } = cartStore
</script>
```

### 4. Vue Router 4 Patterns

#### Route Configuration
```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('@/views/ProductsView.vue'),
    children: [
      {
        path: ':id',
        name: 'product-detail',
        component: () => import('@/views/ProductDetailView.vue'),
        props: true // Pass route params as props
      }
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  
  if (to.meta.role && authStore.user?.role !== to.meta.role) {
    return { name: 'forbidden' }
  }
})

export default router
```

#### Using Router in Components
```vue
<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Access route params
const productId = computed(() => route.params.id as string)

// Navigation
function goToProduct(id: string) {
  router.push({ name: 'product-detail', params: { id } })
}

// With query params
function search(query: string) {
  router.push({ 
    name: 'products', 
    query: { q: query, page: 1 } 
  })
}

// Replace (no history entry)
function replace() {
  router.replace({ name: 'home' })
}

// Go back
function goBack() {
  router.back()
}
</script>
```

### 5. Provide/Inject Pattern

#### Typed Provide/Inject
```typescript
// injection-keys.ts
import type { InjectionKey, Ref } from 'vue'

export interface ThemeContext {
  theme: Ref<'light' | 'dark'>
  toggleTheme: () => void
}

export const ThemeKey: InjectionKey<ThemeContext> = Symbol('theme')

// Parent component
<script setup lang="ts">
import { provide, ref } from 'vue'
import { ThemeKey } from '@/injection-keys'

const theme = ref<'light' | 'dark'>('light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

provide(ThemeKey, {
  theme,
  toggleTheme
})
</script>

// Child component (any depth)
<script setup lang="ts">
import { inject } from 'vue'
import { ThemeKey } from '@/injection-keys'

const themeContext = inject(ThemeKey)

if (!themeContext) {
  throw new Error('Theme context not provided')
}

const { theme, toggleTheme } = themeContext
</script>
```

### 6. Teleport

#### Modal with Teleport
```vue
<script setup lang="ts">
import { ref } from 'vue'

const showModal = ref(false)
</script>

<template>
  <button @click="showModal = true">Open Modal</button>
  
  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h2>Modal Title</h2>
        <p>Modal content here...</p>
        <button @click="showModal = false">Close</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
}
</style>
```

### 7. Suspense and Async Components

#### Async Component with Suspense
```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const AsyncUserProfile = defineAsyncComponent({
  loader: () => import('./UserProfile.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,
  timeout: 10000
})
</script>

<template>
  <Suspense>
    <template #default>
      <AsyncUserProfile :user-id="userId" />
    </template>
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

#### Async Setup
```vue
<script setup lang="ts">
// This component must be wrapped in Suspense
const response = await fetch('/api/user')
const user = await response.json()
</script>

<template>
  <div>{{ user.name }}</div>
</template>
```

### 8. Custom Composables

#### useFetch Composable
```typescript
// composables/useFetch.ts
import { ref, shallowRef, isRef, unref, watchEffect, type Ref, type MaybeRef } from 'vue'

interface UseFetchOptions {
  immediate?: boolean
  refetch?: boolean
}

interface UseFetchReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  loading: Ref<boolean>
  execute: () => Promise<void>
}

export function useFetch<T = unknown>(
  url: MaybeRef<string>,
  options: UseFetchOptions = {}
): UseFetchReturn<T> {
  const { immediate = true, refetch = false } = options

  const data = shallowRef<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(unref(url))
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      data.value = await response.json()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      loading.value = false
    }
  }

  if (immediate) {
    execute()
  }

  if (refetch && isRef(url)) {
    watchEffect(() => {
      url.value // Track
      execute()
    })
  }

  return { data, error, loading, execute }
}
```

#### useLocalStorage Composable
```typescript
// composables/useLocalStorage.ts
import { ref, watch, type Ref } from 'vue'

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): Ref<T> {
  const stored = localStorage.getItem(key)
  const data = ref<T>(stored ? JSON.parse(stored) : defaultValue) as Ref<T>

  watch(
    data,
    (newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue))
    },
    { deep: true }
  )

  return data
}
```

#### useDebounce Composable
```typescript
// composables/useDebounce.ts
import { ref, watch, type Ref } from 'vue'

export function useDebounce<T>(value: Ref<T>, delay = 300): Ref<T> {
  const debouncedValue = ref(value.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(value, (newValue) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return debouncedValue
}

// Usage
const searchQuery = ref('')
const debouncedQuery = useDebounce(searchQuery, 500)

watch(debouncedQuery, (query) => {
  // Fetch results
})
```

---

## Anti-Patterns

### ❌ Don't: Mutate Props
```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>()
// BAD: Mutating props
props.count++ // Error!
</script>
```

### ✅ Do: Emit Events or Use Local State
```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>()
const emit = defineEmits<{ update: [value: number] }>()

// GOOD: Emit event for parent to handle
function increment() {
  emit('update', props.count + 1)
}
</script>
```

### ❌ Don't: Use Reactive for Primitives
```typescript
// BAD: Reactive doesn't work with primitives
const count = reactive(0) // Won't be reactive!
```

### ✅ Do: Use Ref for Primitives
```typescript
// GOOD: Use ref for primitives
const count = ref(0)
```

### ❌ Don't: Destructure Reactive Objects
```typescript
const state = reactive({ count: 0, name: 'John' })
// BAD: Loses reactivity
const { count, name } = state
```

### ✅ Do: Use toRefs or Direct Access
```typescript
const state = reactive({ count: 0, name: 'John' })
// GOOD: Preserve reactivity
const { count, name } = toRefs(state)
// Or access directly
console.log(state.count)
```

### ❌ Don't: Access .value in Template
```vue
<!-- BAD: Don't use .value in template -->
<template>
  <p>{{ count.value }}</p>
</template>
```

### ✅ Do: Let Vue Unwrap Refs
```vue
<!-- GOOD: Vue auto-unwraps refs in templates -->
<template>
  <p>{{ count }}</p>
</template>
```

---

## Quick Reference

### Reactivity API
| API | Use Case |
|-----|----------|
| `ref()` | Primitive values |
| `reactive()` | Objects/arrays |
| `computed()` | Derived state |
| `watch()` | React to changes |
| `watchEffect()` | Auto-track dependencies |
| `toRef()` | Property to ref |
| `toRefs()` | All properties to refs |
| `shallowRef()` | No deep reactivity |

### Lifecycle Hooks
| Hook | Timing |
|------|--------|
| `onBeforeMount` | Before DOM mount |
| `onMounted` | After DOM mount |
| `onBeforeUpdate` | Before re-render |
| `onUpdated` | After re-render |
| `onBeforeUnmount` | Before unmount |
| `onUnmounted` | After unmount |
| `onErrorCaptured` | Error from descendants |

### Component Communication
| Pattern | Direction |
|---------|-----------|
| Props | Parent → Child |
| Emits | Child → Parent |
| Provide/Inject | Ancestor → Descendant |
| Pinia Store | Any ↔ Any |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
