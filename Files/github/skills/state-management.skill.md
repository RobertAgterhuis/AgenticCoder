# State Management Skill

## Overview
**Skill ID**: `state-management`  
**Version**: 1.0  
**Domain**: Global and local state management patterns in React  
**Phase**: 13 (@react-specialist)  
**Maturity**: Production-Ready

State management skill covers Context API, Redux, Zustand, Jotai, and Recoil patterns for managing application state across component hierarchies, with emphasis on choosing the right tool for the problem scale.

---

## Core Concepts

### 1. Context API Pattern

**Definition**: Built-in React solution for passing data without prop drilling.

```typescript
// Create typed context
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

// Provider component
interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Usage
const ThemedButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === 'light' ? '#fff' : '#333',
        color: theme === 'light' ? '#333' : '#fff'
      }}
    >
      Switch Theme (current: {theme})
    </button>
  );
};

// App setup
<ThemeProvider>
  <App />
</ThemeProvider>
```

**Strengths**:
- ✅ Built-in, no dependencies
- ✅ Good for infrequently changing data (theme, auth)
- ✅ Simple to understand

**Weaknesses**:
- ❌ All consumers re-render on any context change
- ❌ No built-in devtools
- ❌ Complex state logic requires separate useReducer

### 2. useReducer Pattern

**Definition**: Hook for complex state with multiple related state variables.

```typescript
// Define state and action types
interface TodoState {
  todos: Todo[];
  filter: 'all' | 'active' | 'completed';
  loading: boolean;
}

type TodoAction =
  | { type: 'ADD_TODO'; payload: Todo }
  | { type: 'REMOVE_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: string }
  | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'completed' }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducer function
function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload]
      };
    case 'REMOVE_TODO':
      return {
        ...state,
        todos: state.todos.filter(t => t.id !== action.payload)
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(t =>
          t.id === action.payload ? { ...t, done: !t.done } : t
        )
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// Usage
const initialState: TodoState = {
  todos: [],
  filter: 'all',
  loading: false
};

const TodoApp = () => {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  const handleAddTodo = (todo: Todo) => {
    dispatch({ type: 'ADD_TODO', payload: todo });
  };

  const handleRemoveTodo = (id: string) => {
    dispatch({ type: 'REMOVE_TODO', payload: id });
  };

  const filteredTodos = state.todos.filter(t => {
    if (state.filter === 'active') return !t.done;
    if (state.filter === 'completed') return t.done;
    return true;
  });

  return (
    <div>
      <TodoList
        todos={filteredTodos}
        onAdd={handleAddTodo}
        onRemove={handleRemoveTodo}
      />
    </div>
  );
};
```

**Best For**:
- Multiple state variables that change together
- Complex state transitions
- Testing (pure functions)

### 3. Redux Pattern

**Definition**: Predictable state management with single source of truth, actions, and reducers.

```typescript
import { createSlice, configureStore, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';
import { useDispatch, useSelector } from 'react-redux';

// Slice (combines reducer + actions)
interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    loading: false,
    error: null
  } as UserState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setUser(state, action: PayloadAction<User>) {
      state.currentUser = action.payload;
      state.error = null;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

// Thunk for async operations
import { createAsyncThunk } from '@reduxjs/toolkit';

const fetchUser = createAsyncThunk<User, string, { rejectValue: string }>(
  'user/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Extended slice with thunk handlers
const userSliceWithAsync = createSlice({
  name: 'user',
  initialState: {
    currentUser: null,
    loading: false,
    error: null
  } as UserState,
  reducers: {
    clearUser(state) {
      state.currentUser = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.loading = false;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.error = action.payload || 'Unknown error';
        state.loading = false;
      });
  }
});

// Store configuration
const store = configureStore({
  reducer: {
    user: userSliceWithAsync.reducer
  }
});

// Selectors (for accessing state)
const selectUser = (state: RootState) => state.user.currentUser;
const selectUserLoading = (state: RootState) => state.user.loading;
const selectUserError = (state: RootState) => state.user.error;

// Usage in component
const UserProfile = ({ userId }: { userId: string }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);

  useEffect(() => {
    dispatch(fetchUser(userId));
  }, [userId, dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
};

// App setup
<Provider store={store}>
  <App />
</Provider>
```

**When to Use**:
- ✅ Large applications with complex state
- ✅ Predictability and testability critical
- ✅ Middleware for logging, analytics
- ✅ Time-travel debugging needed

**Overhead**:
- ❌ Boilerplate (actions, reducers, selectors)
- ❌ Learning curve
- ❌ Overkill for simple apps

### 4. Zustand Pattern

**Definition**: Lightweight, minimal state management without boilerplate.

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Simple store
interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}));

// Usage
const Counter = () => {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
};

// Advanced: With middleware (devtools, persistence)
interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  fetchUser: (id: string) => Promise<void>;
}

const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }),
        logout: () => set({ user: null }),
        fetchUser: async (id: string) => {
          const response = await fetch(`/api/users/${id}`);
          const user = await response.json();
          set({ user });
        }
      }),
      { name: 'user-store' } // localStorage key
    )
  )
);

// With selectors for performance
const useUserName = () => useUserStore((state) => state.user?.name);

const UserGreeting = () => {
  const name = useUserName(); // Only re-renders if name changes
  return <div>Hello, {name}</div>;
};
```

**Strengths**:
- ✅ Minimal boilerplate
- ✅ React hooks API (familiar)
- ✅ Tree-shakeable, tiny bundle
- ✅ Excellent middleware ecosystem

**Best For**:
- Small to medium apps
- Teams preferring hooks API
- Quick prototyping

### 5. Jotai Pattern

**Definition**: Primitive, bottom-up state management with atoms.

```typescript
import { atom, useAtom, useSetAtom, useAtomValue } from 'jotai';

// Atoms (primitive state units)
const countAtom = atom(0);
const userAtom = atom<User | null>(null);
const isLoadingAtom = atom(false);

// Derived atoms
const doubleCountAtom = atom((get) => get(countAtom) * 2);

const userEmailAtom = atom(
  (get) => get(userAtom)?.email,
  (get, set, newEmail: string) => {
    const user = get(userAtom);
    if (user) {
      set(userAtom, { ...user, email: newEmail });
    }
  }
);

// Usage: Reading and writing
const Counter = () => {
  const [count, setCount] = useAtom(countAtom);
  const double = useAtomValue(doubleCountAtom);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {double}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
};

// Async atoms
const userAtomAsync = atom(async (get) => {
  const userId = get(userIdAtom);
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
});

const UserProfile = () => {
  const user = useAtomValue(userAtomAsync);

  return <div>{user.name}</div>;
};

// Atoms with side effects
const submitAtom = atom(null, async (get, set, email: string) => {
  set(isLoadingAtom, true);
  try {
    const response = await api.submit(email);
    set(successMessageAtom, response.message);
  } catch (error) {
    set(errorAtom, error.message);
  } finally {
    set(isLoadingAtom, false);
  }
});

// Usage
const Form = () => {
  const submit = useSetAtom(submitAtom);

  return (
    <button onClick={() => submit('user@example.com')}>
      Submit
    </button>
  );
};
```

**When to Use**:
- ✅ Fine-grained reactivity needed
- ✅ Complex derived state
- ✅ Async state operations
- ✅ Want bottom-up composition

### 6. Recoil Pattern

**Definition**: Facebook's state management with atoms and selectors.

```typescript
import { atom, selector, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

// Atoms
const userAtom = atom<User | null>({
  key: 'user',
  default: null
});

const todosAtom = atom<Todo[]>({
  key: 'todos',
  default: []
});

// Selectors (derived state, caching, async)
const completedTodosSelector = selector({
  key: 'completedTodos',
  get: ({ get }) => {
    const todos = get(todosAtom);
    return todos.filter(t => t.done);
  }
});

const userByIdSelector = selector<User | null>({
  key: 'userById',
  get: ({ get }) => {
    return get(userAtom);
  }
});

// Async selector
const userAsyncSelector = selector({
  key: 'userAsync',
  get: async ({ get }) => {
    const userId = get(userIdAtom);
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }
});

// Usage
const TodoList = () => {
  const [todos, setTodos] = useRecoilState(todosAtom);
  const completedCount = useRecoilValue(completedTodosSelector);

  return (
    <div>
      <p>Completed: {completedCount}</p>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </div>
  );
};

// Async handling with Suspense
const UserProfile = () => {
  const user = useRecoilValue(userAsyncSelector);

  return <div>{user?.name}</div>;
};

// App with Suspense boundary
<RecoilRoot>
  <Suspense fallback={<div>Loading...</div>}>
    <UserProfile />
  </Suspense>
</RecoilRoot>
```

**Strengths**:
- ✅ Selectors for memoized derived state
- ✅ First-class async support
- ✅ Concurrent React features
- ✅ Effects for side effects

---

## Best Practices

### 1. Choosing the Right Tool

```
Simple App:
  └─ Local useState
  
Medium App with Prop Drilling:
  └─ Context API + useReducer
  
Medium App, Quick Setup:
  └─ Zustand
  
Large App, Complex State:
  └─ Redux + Redux Toolkit
  
Fine-grained Reactivity:
  └─ Jotai or Recoil
```

### 2. Avoiding Context Performance Issues

```typescript
// ❌ BAD: All consumers re-render on any change
const AppContext = createContext<AppState | undefined>(undefined);

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AppState>(initialState);
  return <AppContext.Provider value={state}>{children}</AppContext.Provider>;
};

// ✅ GOOD: Split contexts by update frequency
const StateContext = createContext<Readonly<AppState> | undefined>(undefined);
const DispatchContext = createContext<AppDispatch | undefined>(undefined);

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

// ✅ GOOD: Selector pattern with useMemo
const useAppState = <T,>(selector: (state: AppState) => T) => {
  const state = useContext(StateContext);
  return useMemo(() => selector(state), [state, selector]);
};

// Only re-renders if selected value changes
const userName = useAppState(state => state.user.name);
```

### 3. Normalized State Structure

```typescript
// ❌ BAD: Nested, denormalized (hard to update)
{
  users: [
    { id: 1, name: 'John', posts: [{ id: 1, title: 'Post 1' }] },
    { id: 2, name: 'Jane', posts: [{ id: 2, title: 'Post 2' }] }
  ]
}

// ✅ GOOD: Normalized (easy to query and update)
{
  users: {
    byId: {
      1: { id: 1, name: 'John' },
      2: { id: 2, name: 'Jane' }
    },
    allIds: [1, 2]
  },
  posts: {
    byId: {
      1: { id: 1, title: 'Post 1', authorId: 1 },
      2: { id: 2, title: 'Post 2', authorId: 2 }
    },
    allIds: [1, 2]
  }
}

// Query: Get user and their posts
const user = state.users.byId[userId];
const userPosts = state.posts.allIds
  .map(postId => state.posts.byId[postId])
  .filter(post => post.authorId === userId);
```

### 4. Handling Async State

```typescript
// ❌ BAD: Success/loading/error scattered
interface State {
  user: User;
  isLoading: boolean;
  error: string | null;
  loadingError: string | null; // redundant
}

// ✅ GOOD: Single source of truth
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

interface State {
  user: AsyncState<User>;
  posts: AsyncState<Post[]>;
}

// Usage
const UserProfile = ({ userId }: { userId: string }) => {
  const [userState, dispatch] = useReducer(
    userReducer,
    { status: 'idle' } as AsyncState<User>
  );

  useEffect(() => {
    dispatch({ type: 'LOADING' });
    fetchUser(userId)
      .then(user => dispatch({ type: 'SUCCESS', payload: user }))
      .catch(error => dispatch({ type: 'ERROR', payload: error }));
  }, [userId]);

  if (userState.status === 'idle' || userState.status === 'loading') {
    return <Spinner />;
  }

  if (userState.status === 'error') {
    return <ErrorBoundary error={userState.error} />;
  }

  return <div>{userState.data.name}</div>;
};
```

### 5. Immutability Helpers

```typescript
// Using Immer pattern
import produce from 'immer';

// Redux Toolkit handles Immer automatically
const userSlice = createSlice({
  name: 'user',
  initialState: { todos: [] },
  reducers: {
    // Can "mutate" inside - Immer handles immutability
    toggleTodo(state, action: PayloadAction<string>) {
      const todo = state.todos.find(t => t.id === action.payload);
      if (todo) {
        todo.done = !todo.done; // looks like mutation, actually immutable
      }
    }
  }
});

// Without Immer (verbose)
const toggleTodo = (state: State, id: string) => ({
  ...state,
  todos: state.todos.map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  )
});
```

---

## Anti-Patterns (What to Avoid)

### 1. Global State for All Data

```typescript
// ❌ BAD: Everything in global store
const globalStore = {
  user: { /* user data */ },
  theme: { /* theme data */ },
  modal: { isOpen: boolean },
  formValues: { /* form state */ },
  uiFlags: { /* dozens of flags */ }
};

// ✅ GOOD: Only global-scope data in store
const globalStore = {
  user: { /* authenticated user */ },
  theme: { /* user preference */ },
  authToken: { /* session */ }
};
// Component-local state for form, modal, UI flags
```

### 2. Over-selecting from Store

```typescript
// ❌ BAD: Re-renders on entire state change
const state = useRecoilValue(appStateAtom);
const name = state.user.name;

// ✅ GOOD: Select only needed data
const name = useRecoilValue(userNameSelector);
```

### 3. Not Memoizing Context Values

```typescript
// ❌ BAD: New object on every render
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ✅ GOOD: Memoize to prevent unnecessary re-renders
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState('light');
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 4. Storing Derived State

```typescript
// ❌ BAD: Duplicate data
const store = {
  user: { id: 1, name: 'John', email: 'john@example.com' },
  userEmail: 'john@example.com' // Duplicate!
};

// ✅ GOOD: Compute when needed
const userEmail = store.user.email;
```

### 5. Mixing Sync and Async in Reducer

```typescript
// ❌ BAD: Async in reducer
const reducer = (state: State, action: Action) => {
  if (action.type === 'FETCH') {
    fetch('/api/data').then(data => {
      // Where do we dispatch this?
    });
  }
};

// ✅ GOOD: Handle async in thunk/effect
dispatch(
  (dispatch, getState) => {
    fetch('/api/data')
      .then(data => dispatch({ type: 'SET_DATA', payload: data }));
  }
);
```

---

## Comparison Table

| Feature | Context | Redux | Zustand | Jotai | Recoil |
|---------|---------|-------|---------|-------|--------|
| Bundle Size | 0kb | 7kb | 3kb | 6kb | 9kb |
| Learning Curve | Low | High | Medium | Medium | High |
| Devtools | ❌ | ✅ | ✅ | ✅ | ✅ |
| Middleware | ❌ | ✅ | ✅ | ✅ | ✅ |
| Async Support | Manual | Good | Good | Excellent | Excellent |
| Derived State | Manual | Selectors | Selectors | Atoms | Selectors |
| Best For | Simple | Complex | Medium | Fine-grained | Experimental |

---

## Validation Criteria

When this skill is applied:
- ✅ Store chosen based on app complexity
- ✅ State structure is normalized
- ✅ Async state handled predictably
- ✅ Selectors prevent unnecessary re-renders
- ✅ Context values are memoized
- ✅ No global state for local concerns
- ✅ DevTools configured (if applicable)
- ✅ No prop drilling for shared state
- ✅ Side effects isolated and testable

---

## Further Reading
- Redux Toolkit: https://redux-toolkit.js.org/
- Zustand: https://github.com/pmndrs/zustand
- Jotai: https://jotai.org/
- Recoil: https://recoiljs.org/
