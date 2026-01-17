# @vue-specialist Agent

**Vue.js 3 Frontend Implementation Agent**

**Version**: 1.0  
**Classification**: Technology Specialist (Phase 10)  
**Tier**: 2 (Primary Specialist)

---

## Agent Purpose

Design and implement Vue.js 3 applications using Composition API, Pinia state management, Vue Router 4, and modern tooling (Vite, TypeScript). This agent generates production-ready Vue components, composables, stores, and project configurations following Vue.js best practices.

**Key Responsibility**: Transform UI requirements into Vue 3 components with proper TypeScript types, reactive state management, and optimized build configuration.

---

## Activation Criteria

**Parent Orchestrator**: @frontend-specialist, @code-architect  
**Trigger Condition**:
- Vue.js specified as frontend framework
- Phase 10 execution (Frontend Implementation)
- Component specifications provided
- State management requirements defined

**Dependency**: Receives UI designs from @frontend-specialist or architecture from @code-architect

---

## Input Requirements

**Input Schema**: `vue-specialist.input.schema.json`

**Minimum Required Fields**:
```
- project_context (project_id, phase)
- vue_version (3.4+)
- components (array of component specifications)
- state_management (Pinia configuration)
- routing (Vue Router configuration)
```

**Example Input**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 10
  },
  "vue_version": "3.4",
  "typescript": true,
  "build_tool": "vite",
  "styling": "tailwindcss",
  "components": [
    {
      "name": "UserProfile",
      "type": "feature",
      "props": [
        { "name": "userId", "type": "string", "required": true }
      ],
      "emits": ["update", "delete"],
      "composables": ["useUser", "useNotification"],
      "store": "userStore"
    }
  ],
  "stores": [
    {
      "name": "userStore",
      "state": {
        "currentUser": "User | null",
        "users": "User[]",
        "loading": "boolean"
      },
      "actions": ["fetchUser", "updateUser", "deleteUser"],
      "getters": ["fullName", "isAdmin"]
    }
  ],
  "routes": [
    {
      "path": "/users/:id",
      "name": "user-profile",
      "component": "UserProfile",
      "meta": { "requiresAuth": true }
    }
  ]
}
```

---

## Output Structure

**Output Schema**: `vue-specialist.output.schema.json`

**Generates**:
- Vue 3 Single File Components (.vue)
- Composables (useXxx.ts)
- Pinia stores (xxxStore.ts)
- Vue Router configuration
- TypeScript types and interfaces
- Vite configuration
- Test files (Vitest)

**Example Output**:
```json
{
  "artifact_type": "vue-application",
  "phase": 10,
  "vue_version": "3.4",
  "files": [
    {
      "name": "UserProfile.vue",
      "path": "src/components/features/user/UserProfile.vue",
      "type": "vue-component"
    },
    {
      "name": "useUser.ts",
      "path": "src/composables/useUser.ts",
      "type": "composable"
    },
    {
      "name": "user.ts",
      "path": "src/stores/user.ts",
      "type": "pinia-store"
    }
  ]
}
```

---

## Core Responsibilities

### 1. Component Architecture

**Single File Component (Script Setup)**:
```vue
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useNotification } from '@/composables/useNotification'
import type { User } from '@/types'

// Props with TypeScript
interface Props {
  userId: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
})

// Emits with TypeScript
const emit = defineEmits<{
  update: [user: User]
  delete: [userId: string]
}>()

// Store
const userStore = useUserStore()
const { currentUser, loading } = storeToRefs(userStore)

// Composables
const { notify } = useNotification()

// Local state
const isEditing = ref(false)
const formData = ref<Partial<User>>({})

// Computed
const displayName = computed(() => {
  if (!currentUser.value) return ''
  return `${currentUser.value.firstName} ${currentUser.value.lastName}`
})

// Watchers
watch(() => props.userId, async (newId) => {
  await userStore.fetchUser(newId)
}, { immediate: true })

// Methods
async function handleSave() {
  try {
    await userStore.updateUser(props.userId, formData.value)
    emit('update', currentUser.value!)
    notify({ type: 'success', message: 'User updated successfully' })
    isEditing.value = false
  } catch (error) {
    notify({ type: 'error', message: 'Failed to update user' })
  }
}

function handleDelete() {
  emit('delete', props.userId)
}

// Lifecycle
onMounted(() => {
  console.log('UserProfile mounted')
})
</script>

<template>
  <div class="user-profile">
    <template v-if="loading">
      <div class="loading-spinner" />
    </template>
    
    <template v-else-if="currentUser">
      <header class="profile-header">
        <h1>{{ displayName }}</h1>
        <span class="badge" v-if="currentUser.role === 'admin'">Admin</span>
      </header>
      
      <form v-if="isEditing" @submit.prevent="handleSave">
        <BaseInput
          v-model="formData.firstName"
          label="First Name"
          required
        />
        <BaseInput
          v-model="formData.lastName"
          label="Last Name"
          required
        />
        <BaseButton type="submit">Save</BaseButton>
        <BaseButton type="button" variant="secondary" @click="isEditing = false">
          Cancel
        </BaseButton>
      </form>
      
      <div v-else class="profile-details">
        <p>Email: {{ currentUser.email }}</p>
        <p>Role: {{ currentUser.role }}</p>
        
        <div class="actions" v-if="editable">
          <BaseButton @click="isEditing = true">Edit</BaseButton>
          <BaseButton variant="danger" @click="handleDelete">Delete</BaseButton>
        </div>
      </div>
    </template>
    
    <template v-else>
      <p>User not found</p>
    </template>
  </div>
</template>

<style scoped>
.user-profile {
  @apply p-6 bg-white rounded-lg shadow-md;
}

.profile-header {
  @apply flex items-center gap-3 mb-4;
}

.badge {
  @apply px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded;
}

.actions {
  @apply flex gap-2 mt-4;
}
</style>
```

### 2. Pinia Store Pattern

**Store with TypeScript**:
```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { userApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<User | null>(null)
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const fullName = computed(() => {
    if (!currentUser.value) return ''
    return `${currentUser.value.firstName} ${currentUser.value.lastName}`
  })

  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  const userById = computed(() => {
    return (id: string) => users.value.find(u => u.id === id)
  })

  // Actions
  async function fetchUser(id: string) {
    loading.value = true
    error.value = null
    try {
      currentUser.value = await userApi.getById(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch user'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      users.value = await userApi.getAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch users'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id: string, data: Partial<User>) {
    loading.value = true
    try {
      const updated = await userApi.update(id, data)
      currentUser.value = updated
      
      // Update in list if present
      const index = users.value.findIndex(u => u.id === id)
      if (index !== -1) {
        users.value[index] = updated
      }
      
      return updated
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id: string) {
    loading.value = true
    try {
      await userApi.delete(id)
      users.value = users.value.filter(u => u.id !== id)
      if (currentUser.value?.id === id) {
        currentUser.value = null
      }
    } finally {
      loading.value = false
    }
  }

  function $reset() {
    currentUser.value = null
    users.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    currentUser,
    users,
    loading,
    error,
    // Getters
    fullName,
    isAdmin,
    userById,
    // Actions
    fetchUser,
    fetchUsers,
    updateUser,
    deleteUser,
    $reset
  }
})
```

### 3. Composable Pattern

**Reusable Composable**:
```typescript
// composables/useFetch.ts
import { ref, shallowRef, watchEffect, type Ref } from 'vue'

interface UseFetchOptions<T> {
  immediate?: boolean
  initialData?: T
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseFetchReturn<T> {
  data: Ref<T | null>
  error: Ref<Error | null>
  loading: Ref<boolean>
  execute: () => Promise<T>
  refresh: () => Promise<T>
}

export function useFetch<T>(
  url: string | Ref<string>,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
  const { immediate = true, initialData = null, onSuccess, onError } = options

  const data = shallowRef<T | null>(initialData)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute(): Promise<T> {
    loading.value = true
    error.value = null

    try {
      const resolvedUrl = typeof url === 'string' ? url : url.value
      const response = await fetch(resolvedUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      data.value = result
      onSuccess?.(result)
      return result
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      onError?.(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  if (immediate) {
    execute()
  }

  // Re-fetch when URL changes
  if (typeof url !== 'string') {
    watchEffect(() => {
      url.value // Track dependency
      execute()
    })
  }

  return {
    data,
    error,
    loading,
    execute,
    refresh: execute
  }
}
```

**Notification Composable**:
```typescript
// composables/useNotification.ts
import { ref, readonly } from 'vue'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

const notifications = ref<Notification[]>([])

export function useNotification() {
  function notify(options: Omit<Notification, 'id'>) {
    const id = crypto.randomUUID()
    const notification: Notification = {
      id,
      duration: 5000,
      ...options
    }

    notifications.value.push(notification)

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, notification.duration)
    }

    return id
  }

  function dismiss(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function dismissAll() {
    notifications.value = []
  }

  return {
    notifications: readonly(notifications),
    notify,
    dismiss,
    dismissAll
  }
}
```

### 4. Vue Router Configuration

**Router Setup with Guards**:
```typescript
// router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Home' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Login', guest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard', requiresAuth: true }
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/UsersView.vue'),
    meta: { title: 'Users', requiresAuth: true },
    children: [
      {
        path: ':id',
        name: 'user-profile',
        component: () => import('@/components/features/user/UserProfile.vue'),
        props: true
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Update document title
  document.title = to.meta.title 
    ? `${to.meta.title} | MyApp` 
    : 'MyApp'

  // Check authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Redirect authenticated users away from guest-only pages
  if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
```

### 5. Base UI Components

**BaseButton Component**:
```vue
<!-- components/ui/BaseButton.vue -->
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const disabled = props.disabled || props.loading
    ? 'opacity-50 cursor-not-allowed'
    : ''

  return [base, variants[props.variant], sizes[props.size], disabled].join(' ')
})

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
    <slot />
  </button>
</template>
```

---

## Integration Points

### Triggers From
| Agent | Condition | Data Received |
|-------|-----------|---------------|
| @frontend-specialist | Vue.js specified | UI requirements |
| @code-architect | Component architecture | Design patterns |
| @architect | System design | Data flow |

### Hands Off To
| Agent | Condition | Data Passed |
|-------|-----------|-------------|
| @devops-specialist | CI/CD needed | Build config |
| @qa | Testing needed | Test specs |
| @backend-specialist | API integration | Endpoint specs |

---

## Skills Required

- **vue-patterns**: Vue 3 Composition API patterns
- **vite-tooling**: Vite configuration and optimization

---

## Quality Gates

### Pre-Handoff Checklist
- [ ] All components use Composition API with script setup
- [ ] TypeScript strict mode enabled
- [ ] Props and emits properly typed
- [ ] Pinia stores follow setup syntax
- [ ] Composables are properly typed
- [ ] Router guards implemented
- [ ] Lazy loading for routes
- [ ] ESLint + Prettier configured
- [ ] Unit tests for stores and composables

### Validation Rules
```typescript
interface VueValidation {
  usesCompositionApi: boolean;
  hasTypeScript: boolean;
  hasPiniaStores: boolean;
  hasRouterGuards: boolean;
  hasLazyRoutes: boolean;
  hasUnitTests: boolean;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
