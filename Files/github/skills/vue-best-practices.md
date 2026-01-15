# Skill: Vue Best Practices

## Metadata

```yaml
name: vue-best-practices
category: code
type: quality
framework: Vue.js
created: 2026-01-13
version: 1.0.0
```

## Purpose

Provides comprehensive best practices for Vue.js development including performance optimization, TypeScript integration, testing strategies, security considerations, accessibility, and production deployment guidelines.

## Core Best Practices

### 1. Performance Optimization

**Lazy Loading Routes:**

```typescript
// router/index.ts
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/Dashboard.vue'),
    // Webpack magic comment for better chunk naming
    // component: () => import(/* webpackChunkName: "dashboard" */ '@/views/Dashboard.vue')
  },
  {
    path: '/admin',
    component: () => import('@/views/Admin.vue'),
    children: [
      {
        path: 'users',
        component: () => import('@/views/admin/Users.vue')
      }
    ]
  }
]
```

**Lazy Loading Components:**

```typescript
import { defineAsyncComponent } from 'vue'

// Simple lazy loading
const HeavyChart = defineAsyncComponent(
  () => import('@/components/HeavyChart.vue')
)

// With loading state
const HeavyChart = defineAsyncComponent({
  loader: () => import('@/components/HeavyChart.vue'),
  loadingComponent: () => import('@/components/LoadingSpinner.vue'),
  delay: 200,
  timeout: 3000
})
```

**Optimize Reactivity:**

```typescript
import { ref, reactive, shallowRef, shallowReactive, readonly } from 'vue'

// Use shallowRef for large objects that don't need deep reactivity
const largeList = shallowRef([/* thousands of items */])

// Use shallowReactive for objects with known structure
const config = shallowReactive({
  theme: 'dark',
  locale: 'en'
})

// Use readonly to prevent unnecessary reactivity
const constantData = readonly({ apiUrl: 'https://api.example.com' })

// For non-reactive data, use plain objects
const staticConfig = {
  maxRetries: 3,
  timeout: 5000
}
```

**Virtual Scrolling:**

```vue
<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

const allItems = ref(Array.from({ length: 100000 }, (_, i) => i))

const { list, containerProps, wrapperProps } = useVirtualList(
  allItems,
  {
    itemHeight: 50,
    overscan: 10
  }
)
</script>

<template>
  <div v-bind="containerProps" style="height: 600px; overflow-y: auto;">
    <div v-bind="wrapperProps">
      <div
        v-for="item in list"
        :key="item.index"
        style="height: 50px;"
      >
        Item #{{ item.data }}
      </div>
    </div>
  </div>
</template>
```

**Computed Caching:**

```typescript
// ✅ Good - computed values are cached
const expensiveComputed = computed(() => {
  return items.value.map(item => /* expensive operation */)
})

// ❌ Bad - recalculates on every render
const expensiveMethod = () => {
  return items.value.map(item => /* expensive operation */)
}
```

**V-once for Static Content:**

```vue
<template>
  <!-- Content that never changes -->
  <div v-once>
    <h1>{{ staticTitle }}</h1>
    <p>{{ staticDescription }}</p>
  </div>
</template>
```

**Key Optimization:**

```vue
<template>
  <!-- ✅ Good - stable unique key -->
  <div v-for="user in users" :key="user.id">
    {{ user.name }}
  </div>
  
  <!-- ❌ Bad - index as key (problematic with reordering) -->
  <div v-for="(user, index) in users" :key="index">
    {{ user.name }}
  </div>
  
  <!-- ❌ Terrible - random key (forces re-render every time) -->
  <div v-for="user in users" :key="Math.random()">
    {{ user.name }}
  </div>
</template>
```

### 2. TypeScript Integration

**Component Type Safety:**

```typescript
// Strong typing for props
interface UserCardProps {
  user: {
    id: number
    name: string
    email: string
    role: 'admin' | 'user'
  }
  showActions?: boolean
}

const props = withDefaults(defineProps<UserCardProps>(), {
  showActions: true
})

// Strong typing for emits
const emit = defineEmits<{
  (e: 'edit', userId: number): void
  (e: 'delete', userId: number): void
  (e: 'update', user: User): void
}>()

// Type-safe template refs
const inputRef = ref<HTMLInputElement>()
const componentRef = ref<InstanceType<typeof MyComponent>>()
```

**Shared Types:**

```typescript
// types/models.ts
export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export type UserRole = 'admin' | 'user' | 'guest'

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// types/api.ts
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
}
```

**Generic Composables:**

```typescript
export function usePagination<T>(
  fetchFn: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
  initialPageSize = 10
) {
  const items = ref<T[]>([])
  const page = ref(1)
  const pageSize = ref(initialPageSize)
  const total = ref(0)
  const isLoading = ref(false)
  
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
  
  async function fetchPage(pageNum: number) {
    isLoading.value = true
    try {
      const response = await fetchFn(pageNum, pageSize.value)
      items.value = response.data
      total.value = response.total
      page.value = pageNum
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    items: readonly(items),
    page: readonly(page),
    pageSize: readonly(pageSize),
    total: readonly(total),
    totalPages,
    isLoading: readonly(isLoading),
    fetchPage
  }
}
```

**TSConfig for Vue:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    
    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. State Management Best Practices

**Store Organization:**

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  // ===== STATE =====
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // ===== GETTERS =====
  const isAuthenticated = computed(() => !!user.value && !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userName = computed(() => user.value?.name ?? 'Guest')
  
  // ===== ACTIONS =====
  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await authApi.login(credentials)
      user.value = response.user
      token.value = response.token
      localStorage.setItem('token', response.token)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }
  
  // ===== RETURN =====
  return {
    // State
    user: readonly(user),
    token: readonly(token),
    isLoading: readonly(isLoading),
    error: readonly(error),
    // Getters
    isAuthenticated,
    isAdmin,
    userName,
    // Actions
    login,
    logout
  }
})
```

**Store Composition:**

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore() // Use another store
  
  const users = ref<User[]>([])
  
  const currentUser = computed(() => 
    users.value.find(u => u.id === authStore.user?.id)
  )
  
  return { users, currentUser }
})
```

**Store Persistence:**

```typescript
import { defineStore } from 'pinia'
import { watch } from 'vue'

export const usePreferencesStore = defineStore('preferences', () => {
  const STORAGE_KEY = 'user-preferences'
  
  // Initialize from localStorage
  const storedPrefs = localStorage.getItem(STORAGE_KEY)
  const preferences = ref<Preferences>(
    storedPrefs ? JSON.parse(storedPrefs) : defaultPreferences
  )
  
  // Persist changes
  watch(
    preferences,
    (newPrefs) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs))
    },
    { deep: true }
  )
  
  return { preferences }
})
```

### 4. Security Best Practices

**XSS Prevention:**

```vue
<script setup lang="ts">
// ✅ Good - Vue escapes by default
const userInput = ref('<script>alert("XSS")</script>')
</script>

<template>
  <!-- Safe - Vue escapes HTML -->
  <div>{{ userInput }}</div>
  
  <!-- ⚠️ Dangerous - renders raw HTML -->
  <div v-html="userInput"></div>
  
  <!-- ✅ Safe - sanitize before using v-html -->
  <div v-html="sanitizeHtml(userInput)"></div>
</template>
```

**Sanitization Utility:**

```typescript
import DOMPurify from 'dompurify'

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title']
  })
}
```

**Secure API Calls:**

```typescript
// utils/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true, // Include cookies
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      useAuthStore().logout()
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export { api }
```

**Environment Variables:**

```typescript
// ✅ Good - use env variables for config
const apiUrl = import.meta.env.VITE_API_URL
const appVersion = import.meta.env.VITE_APP_VERSION

// ❌ Bad - hardcode secrets
const apiKey = 'sk_live_1234567890' // Never do this!

// .env.local (not committed to git)
VITE_API_URL=https://api.production.com
VITE_API_KEY=sk_live_1234567890

// .env.development (can be committed)
VITE_API_URL=http://localhost:5000
VITE_API_KEY=sk_test_1234567890
```

**CSRF Protection:**

```typescript
// For state-changing requests, include CSRF token
api.post('/api/users', userData, {
  headers: {
    'X-CSRF-Token': getCsrfToken()
  }
})

function getCsrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
}
```

### 5. Accessibility Best Practices

**Semantic HTML:**

```vue
<template>
  <!-- ✅ Good - semantic elements -->
  <header>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <article>
      <h1>Article Title</h1>
      <p>Article content...</p>
    </article>
  </main>
  
  <footer>
    <p>&copy; 2026 Company</p>
  </footer>
  
  <!-- ❌ Bad - div soup -->
  <div class="header">
    <div class="nav">
      <div class="nav-item">Home</div>
    </div>
  </div>
</template>
```

**ARIA Attributes:**

```vue
<template>
  <!-- Buttons -->
  <button 
    aria-label="Close dialog"
    @click="closeDialog"
  >
    <span aria-hidden="true">&times;</span>
  </button>
  
  <!-- Loading states -->
  <div 
    v-if="isLoading"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    Loading data...
  </div>
  
  <!-- Form inputs -->
  <label for="email-input">Email Address</label>
  <input 
    id="email-input"
    v-model="email"
    type="email"
    aria-required="true"
    aria-invalid="!!emailError"
    aria-describedby="email-error"
  />
  <span 
    v-if="emailError" 
    id="email-error"
    role="alert"
  >
    {{ emailError }}
  </span>
  
  <!-- Custom components -->
  <div 
    role="tablist"
    aria-label="Account settings"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      role="tab"
      :aria-selected="activeTab === tab.id"
      :tabindex="activeTab === tab.id ? 0 : -1"
      @click="activeTab = tab.id"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
```

**Keyboard Navigation:**

```vue
<script setup lang="ts">
const activeIndex = ref(0)
const items = ref(['Item 1', 'Item 2', 'Item 3'])

const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % items.value.length
      break
    case 'ArrowUp':
      event.preventDefault()
      activeIndex.value = (activeIndex.value - 1 + items.value.length) % items.value.length
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectItem(activeIndex.value)
      break
    case 'Escape':
      event.preventDefault()
      close()
      break
  }
}
</script>

<template>
  <div 
    role="listbox"
    @keydown="handleKeydown"
    tabindex="0"
  >
    <div
      v-for="(item, index) in items"
      :key="index"
      role="option"
      :aria-selected="index === activeIndex"
      :class="{ active: index === activeIndex }"
    >
      {{ item }}
    </div>
  </div>
</template>
```

**Focus Management:**

```vue
<script setup lang="ts">
import { ref, nextTick } from 'vue'

const dialogRef = ref<HTMLElement>()
const firstFocusableRef = ref<HTMLElement>()
const isOpen = ref(false)

async function openDialog() {
  isOpen.value = true
  await nextTick()
  firstFocusableRef.value?.focus()
}

function closeDialog() {
  isOpen.value = false
  // Return focus to trigger element
  triggerRef.value?.focus()
}

// Trap focus within dialog
function handleTabKey(event: KeyboardEvent) {
  const focusableElements = dialogRef.value?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  if (!focusableElements || focusableElements.length === 0) return
  
  const first = focusableElements[0] as HTMLElement
  const last = focusableElements[focusableElements.length - 1] as HTMLElement
  
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    ref="dialogRef"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    @keydown.tab="handleTabKey"
    @keydown.esc="closeDialog"
  >
    <h2 id="dialog-title" ref="firstFocusableRef" tabindex="-1">
      Dialog Title
    </h2>
    <!-- Dialog content -->
    <button @click="closeDialog">Close</button>
  </div>
</template>
```

### 6. Testing Best Practices

**Component Testing:**

```typescript
// __tests__/Button.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from '@/components/Button.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })
    
    expect(wrapper.text()).toBe('Click me')
  })
  
  it('emits click event when clicked', async () => {
    const wrapper = mount(Button)
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
  
  it('does not emit when disabled', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true }
    })
    
    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeUndefined()
  })
  
  it('applies variant classes', () => {
    const wrapper = mount(Button, {
      props: { variant: 'danger' }
    })
    
    expect(wrapper.classes()).toContain('btn--danger')
  })
})
```

**Composable Testing:**

```typescript
// __tests__/useCounter.spec.ts
import { describe, it, expect } from 'vitest'
import { useCounter } from '@/composables/useCounter'

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { count } = useCounter()
    expect(count.value).toBe(0)
  })
  
  it('initializes with custom value', () => {
    const { count } = useCounter(10)
    expect(count.value).toBe(10)
  })
  
  it('increments counter', () => {
    const { count, increment } = useCounter(0)
    increment()
    expect(count.value).toBe(1)
  })
  
  it('respects max value', () => {
    const { count, increment } = useCounter(9, { max: 10 })
    increment()
    increment() // Should not exceed max
    expect(count.value).toBe(10)
  })
})
```

**Store Testing:**

```typescript
// __tests__/auth.store.spec.ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('initializes with no user', () => {
    const store = useAuthStore()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
  
  it('logs in successfully', async () => {
    const store = useAuthStore()
    
    // Mock API
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: { id: 1, name: 'John' },
          token: 'abc123'
        })
      })
    )
    
    await store.login({ email: 'john@example.com', password: 'password' })
    
    expect(store.user).toEqual({ id: 1, name: 'John' })
    expect(store.isAuthenticated).toBe(true)
  })
  
  it('handles login error', async () => {
    const store = useAuthStore()
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401
      })
    )
    
    await expect(store.login({ email: 'wrong', password: 'wrong' }))
      .rejects.toThrow()
    
    expect(store.user).toBeNull()
  })
})
```

### 7. Build and Deployment

**Production Build Optimization:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false, // Disable in production
    
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['vuetify'], // Or your UI library
        }
      }
    },
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs
        drop_debugger: true
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500
  },
  
  // Production optimizations
  esbuild: {
    drop: ['console', 'debugger'] // Remove in production
  }
})
```

**Environment-Specific Configs:**

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  
  return {
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    
    server: {
      port: 3000,
      proxy: mode === 'development' ? {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true
        }
      } : undefined
    }
  }
})
```

**Docker Deployment:**

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
  listen 80;
  server_name _;
  
  root /usr/share/nginx/html;
  index index.html;
  
  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
  
  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

## Anti-Patterns to Avoid

### 1. Reactive Anti-Patterns

```typescript
// ❌ Bad - mutating props
const props = defineProps<{ user: User }>()
props.user.name = 'New Name' // Never mutate props!

// ✅ Good - emit event to parent
const emit = defineEmits<{ (e: 'update:user', user: User): void }>()
emit('update:user', { ...props.user, name: 'New Name' })

// ❌ Bad - losing reactivity
const { count } = useCounterStore() // Not reactive
count++ // Won't trigger updates

// ✅ Good - maintain reactivity
const store = useCounterStore()
store.count++ // Reactive

// Or use storeToRefs
const { count } = storeToRefs(useCounterStore())
count.value++ // Reactive
```

### 2. Performance Anti-Patterns

```vue
<script setup lang="ts">
// ❌ Bad - method in template
const getFullName = () => `${user.firstName} ${user.lastName}`
</script>

<template>
  <!-- Called on every render -->
  <div>{{ getFullName() }}</div>
</template>

<!-- ✅ Good - use computed -->
<script setup lang="ts">
const fullName = computed(() => `${user.firstName} ${user.lastName}`)
</script>

<template>
  <!-- Cached, only recalculates when dependencies change -->
  <div>{{ fullName }}</div>
</template>
```

### 3. Memory Leak Anti-Patterns

```typescript
// ❌ Bad - not cleaning up
onMounted(() => {
  window.addEventListener('resize', handleResize)
  const interval = setInterval(fetchData, 5000)
  // Never cleaned up!
})

// ✅ Good - cleanup in onUnmounted
onMounted(() => {
  window.addEventListener('resize', handleResize)
  const interval = setInterval(fetchData, 5000)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    clearInterval(interval)
  })
})
```

## Schema Reference

This skill's input and output structures are defined in:
- `docs/schemas/skills/vue-best-practices.input.schema.json`
- `docs/schemas/skills/vue-best-practices.output.schema.json`

## Version History

- **1.0.0** (2026-01-13): Initial best practices for Vue 3

## Related Documentation

- Agent: `vue-specialist.md`
- Related Skills: `vue-component-patterns.md`
- Official Docs: https://vuejs.org/guide/best-practices/
