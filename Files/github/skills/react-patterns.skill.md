# React Patterns Skill

## Overview
**Skill ID**: `react-patterns`  
**Version**: 1.0  
**Domain**: React.js component patterns and architectural approaches  
**Phase**: 13 (@react-specialist)  
**Maturity**: Production-Ready

React Patterns skill encompasses functional component architecture, composition patterns, performance optimization, and modern React conventions (React 16.8+, Hooks, Suspense).

---

## Core Concepts

### 1. Functional Component Architecture

**Definition**: Components as pure JavaScript functions that accept props and return JSX.

```typescript
// ✅ Standard functional component
interface UserCardProps {
  userId: string;
  onDelete?: (id: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ userId, onDelete }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return (
    <div className="user-card">
      <h2>{user?.name}</h2>
      <button onClick={() => onDelete?.(userId)}>Delete</button>
    </div>
  );
};
```

**Key Principles**:
- Pure functions: Same input → Same output
- No side effects in render body (use useEffect)
- Props immutable
- State isolated

### 2. Hooks Composition

**Definition**: Functions that let you "hook into" React state and lifecycle features.

```typescript
// Custom hook encapsulating logic
function useFetchUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}

// Usage in component
const UserProfile = ({ userId }: { userId: string }) => {
  const { user, loading, error } = useFetchUser(userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{user?.name}</div>;
};
```

**Standard Hooks**:
- `useState`: Local component state
- `useEffect`: Side effects (API calls, subscriptions, DOM updates)
- `useContext`: Access context values
- `useReducer`: Complex state logic
- `useCallback`: Memoize function references
- `useMemo`: Memoize expensive computations
- `useRef`: Direct DOM access, persisting values
- `useLayoutEffect`: Synchronous side effects

### 3. Render Props Pattern

**Definition**: Component accepts function-as-child to share logic.

```typescript
interface RenderPropsComponentProps {
  children: (state: { count: number; increment: () => void }) => React.ReactNode;
}

const Counter: React.FC<RenderPropsComponentProps> = ({ children }) => {
  const [count, setCount] = useState(0);

  return children({
    count,
    increment: () => setCount(c => c + 1)
  });
};

// Usage
<Counter>
  {({ count, increment }) => (
    <button onClick={increment}>Count: {count}</button>
  )}
</Counter>
```

**Use Cases**:
- Share stateful logic without wrapping
- Multiple consumers accessing same logic
- Complex branching logic

### 4. Compound Components Pattern

**Definition**: Related components work together, sharing internal state.

```typescript
// Main component manages state
const Accordion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <AccordionContext.Provider value={{ openId, setOpenId }}>
      <div className="accordion">
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// Sub-components consume context
interface AccordionItemProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ id, title, children }) => {
  const { openId, setOpenId } = useContext(AccordionContext);
  const isOpen = openId === id;

  return (
    <div>
      <button onClick={() => setOpenId(isOpen ? null : id)}>
        {title}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
};

// Usage: API is intuitive
<Accordion>
  <AccordionItem id="1" title="Section 1">Content 1</AccordionItem>
  <AccordionItem id="2" title="Section 2">Content 2</AccordionItem>
</Accordion>
```

**Benefits**:
- Implicit state sharing
- Flexible composition
- Type-safe with TypeScript
- Prevents prop drilling

### 5. Higher-Order Component (HOC) Pattern

**Definition**: Function that takes component and returns enhanced component.

```typescript
// HOC pattern (use sparingly, prefer hooks)
function withUserData<P extends { user: User }>(
  Component: React.ComponentType<P>
) {
  return function WithUserDataComponent(props: Omit<P, 'user'>) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      fetchCurrentUser().then(setUser);
    }, []);

    if (!user) return <div>Loading...</div>;

    return <Component {...(props as P)} user={user} />;
  };
}

const UserProfile = ({ user }: { user: User }) => (
  <div>{user.name}</div>
);

export const ProfileWithData = withUserData(UserProfile);
```

**⚠️ Note**: Modern approach is custom Hooks. HOCs add complexity and can break references.

### 6. Container/Presentational Separation

**Definition**: Smart containers handle logic; dumb presenters handle UI.

```typescript
// Container (logic)
const UserListContainer = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then(users => {
      setUsers(users);
      setLoading(false);
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteUser(id).then(() => {
      setUsers(users => users.filter(u => u.id !== id));
    });
  }, []);

  return (
    <UserListPresenter
      users={users}
      loading={loading}
      onDelete={handleDelete}
    />
  );
};

// Presenter (pure UI)
interface UserListPresenterProps {
  users: User[];
  loading: boolean;
  onDelete: (id: string) => void;
}

const UserListPresenter: React.FC<UserListPresenterProps> = ({
  users,
  loading,
  onDelete
}) => {
  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name}
          <button onClick={() => onDelete(user.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
};
```

**Benefits**:
- Presenters easily testable (pure functions)
- Containers reusable logic
- Clear separation of concerns

---

## Best Practices

### 1. Dependency Array Management

```typescript
// ✅ GOOD: Dependencies explicitly listed
useEffect(() => {
  console.log(`User: ${userId}`);
}, [userId]); // Re-runs when userId changes

// ❌ BAD: Missing dependency
useEffect(() => {
  console.log(`User: ${userId}`);
}, []); // Stale closure - uses old userId

// ✅ GOOD: Including object props requires stabilization
const userConfig = useMemo(() => ({ id: userId }), [userId]);

useEffect(() => {
  fetchUserConfig(userConfig);
}, [userConfig]);
```

**Rule**: List all dependencies used in effect. ESLint `exhaustive-deps` helps.

### 2. Stable References with useCallback

```typescript
// ❌ BAD: New function on every render
<UserList onSelect={() => handleSelect(userId)} />

// ✅ GOOD: Stable reference
const handleSelect = useCallback((id: string) => {
  // handle selection
}, [userId]); // userId is dependency, function is memoized

<UserList onSelect={handleSelect} />
```

### 3. Conditional Rendering Patterns

```typescript
// ✅ GOOD: Early returns
const UserDetail = ({ userId }: { userId?: string }) => {
  if (!userId) return <div>No user selected</div>;

  const { user, loading, error } = useFetchUser(userId);

  if (loading) return <UserSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <UserProfile user={user} />;
};

// ✅ GOOD: Ternary for boolean conditions
<div>
  {isLoading ? <Spinner /> : <Content />}
</div>

// ✅ GOOD: && for show/hide
{hasPermission && <AdminPanel />}
```

### 4. Key Prop Management

```typescript
// ❌ BAD: Using index as key
{items.map((item, index) => (
  <ItemComponent key={index} item={item} /> // Causes bugs if list reorders
))}

// ✅ GOOD: Stable unique identifier
{items.map(item => (
  <ItemComponent key={item.id} item={item} />
))}

// ✅ GOOD: When no unique ID
{items.map((item, index) => (
  <ItemComponent key={`${item.name}-${index}`} item={item} />
))}
```

### 5. Performance Optimization

```typescript
// ✅ GOOD: Memoize expensive components
interface ExpensiveListProps {
  items: Item[];
  onSelect: (item: Item) => void;
}

const ExpensiveList = React.memo<ExpensiveListProps>(
  ({ items, onSelect }) => {
    console.log('Rendering list'); // Only logs when items/onSelect change
    return (
      <ul>
        {items.map(item => (
          <li key={item.id} onClick={() => onSelect(item)}>
            {item.name}
          </li>
        ))}
      </ul>
    );
  },
  // Custom comparison
  (prevProps, nextProps) => {
    return prevProps.items === nextProps.items &&
           prevProps.onSelect === nextProps.onSelect;
  }
);

// ✅ GOOD: Code splitting with lazy
const AdminPanel = React.lazy(() => import('./AdminPanel'));

<Suspense fallback={<div>Loading admin...</div>}>
  <AdminPanel />
</Suspense>
```

### 6. Error Boundaries

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error) => React.ReactNode;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback?.(this.state.error!) || 
             <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary fallback={error => <ErrorPage error={error} />}>
  <App />
</ErrorBoundary>
```

---

## Anti-Patterns (What to Avoid)

### 1. State in Render

```typescript
// ❌ BAD: Creating state on every render
const BadComponent = () => {
  const [count, setCount] = useState(() => {
    return computeExpensiveValue(); // Called every render!
  });

  return <div>{count}</div>;
};

// ✅ GOOD: Lazy initialization
const GoodComponent = () => {
  const [count, setCount] = useState(() => computeExpensiveValue());
  return <div>{count}</div>;
};
```

### 2. Missing Cleanup in Effects

```typescript
// ❌ BAD: Memory leak from subscription
useEffect(() => {
  const subscription = userService.subscribe(handleUserChange);
  // Subscription never cleaned up!
}, []);

// ✅ GOOD: Cleanup function
useEffect(() => {
  const subscription = userService.subscribe(handleUserChange);
  return () => subscription.unsubscribe(); // Cleanup
}, []);
```

### 3. Fetching in Render

```typescript
// ❌ BAD: Fetch triggers infinite loop
const BadList = () => {
  const [items, setItems] = useState([]);
  
  items.length === 0 && fetchItems().then(setItems);
  
  return <ul>{items.map(i => <li key={i.id}>{i}</li>)}</ul>;
};

// ✅ GOOD: Fetch in effect
const GoodList = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems().then(setItems);
  }, []);

  return <ul>{items.map(i => <li key={i.id}>{i}</li>)}</ul>;
};
```

### 4. Mutating State Directly

```typescript
// ❌ BAD: React won't detect state change
const [user, setUser] = useState({ name: 'John' });
user.name = 'Jane'; // Mutation!

// ✅ GOOD: Create new object
setUser({ ...user, name: 'Jane' });

// ✅ GOOD: Using immer pattern with reducer
const [state, setState] = useReducer((state, action) => {
  switch (action.type) {
    case 'UPDATE_NAME':
      return { ...state, user: { ...state.user, name: action.payload } };
  }
}, initialState);
```

### 5. Props Destructuring in Signature vs. Body

```typescript
// ⚠️ INCONSISTENT: Mixing patterns
const Component = (props: Props) => {
  const { userId } = props;
  const { onSelect } = props;
  
  return <div>...</div>;
};

// ✅ GOOD: Consistent destructuring
const Component = ({ userId, onSelect }: Props) => {
  return <div>...</div>;
};
```

### 6. Circular Component References

```typescript
// ❌ BAD: ComponentA imports ComponentB, ComponentB imports ComponentA
// ComponentA.tsx
import ComponentB from './ComponentB';

// ComponentB.tsx
import ComponentA from './ComponentA'; // Circular dependency!

// ✅ GOOD: Use abstraction or refactor structure
// Abstract interface
interface SharedComponent {
  render(): React.ReactNode;
}

// Or move shared logic to parent
const Parent = () => (
  <>
    <ComponentA />
    <ComponentB />
  </>
);
```

---

## Practical Examples

### Example 1: Data Fetching Pattern

```typescript
interface UseFetchOptions {
  skip?: boolean;
  refetchInterval?: number;
}

function useFetch<T>(
  url: string,
  options?: UseFetchOptions
): { data: T | null; loading: boolean; error: Error | null; refetch: () => Promise<T> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (options?.skip) return;

    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [url, options?.skip]);

  useEffect(() => {
    fetchData();

    if (options?.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, options?.refetchInterval]);

  return { data, loading, error, refetch: fetchData };
}

// Usage
const UserList = () => {
  const { data: users, loading, error } = useFetch<User[]>('/api/users');

  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <ul>
      {users?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
};
```

### Example 2: Form State Management

```typescript
interface FormState {
  [key: string]: string | number | boolean;
}

function useForm<T extends FormState>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setValues(v => ({
      ...v,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(t => ({ ...t, [e.target.name]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        setErrors({ _form: error instanceof Error ? error.message : 'Submit failed' } as any);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors
  };
}

// Usage
const LoginForm = () => {
  const form = useForm(
    { email: '', password: '' },
    async (values) => {
      await loginUser(values);
    }
  );

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.touched.email && form.errors.email && (
        <span>{form.errors.email}</span>
      )}
      <button type="submit" disabled={form.isSubmitting}>
        Login
      </button>
    </form>
  );
};
```

### Example 3: List Management

```typescript
interface UseListState<T> {
  items: T[];
  add: (item: T) => void;
  remove: (id: string) => void;
  update: (id: string, item: Partial<T>) => void;
  clear: () => void;
}

function useList<T extends { id: string }>(
  initialItems: T[] = []
): UseListState<T> {
  const [items, setItems] = useState(initialItems);

  const add = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const update = useCallback((id: string, updates: Partial<T>) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  return { items, add, remove, update, clear };
}

// Usage
const TodoList = () => {
  const todos = useList<Todo>([{ id: '1', title: 'Task 1', done: false }]);

  return (
    <div>
      <ul>
        {todos.items.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={e => todos.update(todo.id, { done: e.target.checked })}
            />
            {todo.title}
            <button onClick={() => todos.remove(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <button onClick={() => todos.clear()}>Clear All</button>
    </div>
  );
};
```

---

## When to Use

| Pattern | Use When | Avoid When |
|---------|----------|-----------|
| Functional Components + Hooks | Modern React (16.8+), most components | Need class-specific features (error boundaries, getSnapshotBeforeUpdate) |
| Compound Components | Complex UI with shared state (Accordion, Tabs) | Simple independent components |
| Render Props | Sharing logic across multiple components | Simple state management (prefer Context + Hooks) |
| Custom Hooks | Extracting stateful logic, data fetching | One-time logic in single component |
| useContext + Hooks | Avoid prop drilling in deep trees | High-frequency updates (consider state management library) |
| React.memo | Expensive components with same props | All components (adds overhead) |
| Suspense | Code splitting, concurrent features | Error handling (combine with Error Boundary) |

---

## Related Skills
- `state-management`: Redux, Context, Zustand patterns
- `error-handling`: Error boundaries, try-catch in effects
- `ui-component-library`: Reusable component design
- `react-performance`: useCallback, useMemo, code splitting

---

## Validation Criteria

When this skill is applied:
- ✅ Components are functional with hooks
- ✅ Custom hooks extract reusable logic
- ✅ useEffect dependencies are complete
- ✅ useCallback prevents unnecessary renders
- ✅ Error boundaries wrap risky sections
- ✅ Components have proper TypeScript types
- ✅ No memory leaks from subscriptions
- ✅ Keys are unique and stable
- ✅ Conditional rendering is readable
- ✅ ESLint react/hooks rules pass

---

## Further Reading
- Official React Hooks Docs: https://react.dev/reference/react
- React Patterns Guide: https://reactpatterns.com/
- Kent C. Dodds Blog: https://kentcdodds.com/
