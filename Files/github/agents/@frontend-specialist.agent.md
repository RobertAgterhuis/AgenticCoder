# @frontend-specialist Agent (Phase 10)

**Agent ID**: `@frontend-specialist`  
**Phase**: 10  
**Purpose**: Design and implement UI components, frontend architecture  
**Triggers From**: @code-architect (code_structure)  
**Hands Off To**: @devops-specialist (frontend_components, build_config)

---

## Core Responsibilities

### 1. Frontend Architecture Design

**Technology Stack** (Recommended):
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (fast, modern)
- **Styling**: Tailwind CSS (utility-first)
- **State Management**: Zustand or TanStack Query
- **Component Library**: Shadcn/ui or Radix UI
- **Testing**: Vitest + React Testing Library
- **Type Safety**: TypeScript + Zod for schema validation

**Project Structure**:

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── Sidebar.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── AuthGuard.tsx
│   │   ├── users/
│   │   │   ├── UserList.tsx
│   │   │   ├── UserDetail.tsx
│   │   │   └── UserForm.tsx
│   │   └── dashboard/
│   │       ├── Dashboard.tsx
│   │       └── DashboardCards.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Card.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useLocalStorage.ts
├── services/
│   ├── api/
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   └── client.ts
│   └── storage/
│       └── localStorage.service.ts
├── store/
│   ├── authStore.ts
│   ├── userStore.ts
│   └── index.ts
├── types/
│   ├── api.types.ts
│   ├── domain.types.ts
│   └── common.types.ts
├── utils/
│   ├── helpers.ts
│   ├── validators.ts
│   └── formatters.ts
├── pages/
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── NotFoundPage.tsx
│   └── ErrorPage.tsx
├── App.tsx
├── main.tsx
└── styles/
    ├── globals.css
    └── tailwind.css
```

### 2. Component Architecture

**Component Composition Pattern**:

```typescript
// ui/Button.tsx - Base UI Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};

// features/auth/LoginForm.tsx - Feature Component
interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <ErrorMessage message={error} />}
      <Button type="submit" isLoading={isLoading}>
        Login
      </Button>
    </form>
  );
};
```

### 3. State Management

**Zustand Pattern** (Recommended for simplicity):

```typescript
// store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (credentials) => {
    const response = await authService.login(credentials);
    set({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
    });
    localStorage.setItem('token', response.token);
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('token');
  },
}));

// Usage in component
const LoginPage = () => {
  const { login, isLoading } = useAuthStore();
  // Component code
};
```

### 4. API Integration

**API Client Pattern**:

```typescript
// services/api/client.ts
import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 10000,
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Redirect to login
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string) {
    return this.client.get<T>(url);
  }

  post<T>(url: string, data: any) {
    return this.client.post<T>(url, data);
  }

  put<T>(url: string, data: any) {
    return this.client.put<T>(url, data);
  }

  delete<T>(url: string) {
    return this.client.delete<T>(url);
  }
}

export const apiClient = new ApiClient();

// services/api/auth.service.ts
export const authService = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (data: RegisterDTO) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },
};
```

### 5. Routing

**React Router V6 Pattern**:

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomePage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Error Routes */}
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// components/common/ProtectedRoute.tsx
export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```

### 6. Form Handling

**React Hook Form + Zod**:

```typescript
// types/forms.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters'),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

// features/auth/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authService.login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <Input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}

      <Button type="submit">Login</Button>
    </form>
  );
};
```

### 7. Styling

**Tailwind CSS Configuration**:

```typescript
// tailwind.config.ts
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
      },
    },
  },
  plugins: [],
};

// src/styles/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn {
    @apply px-4 py-2 rounded font-medium transition-colors;
  }

  .btn-primary {
    @apply bg-blue-500 text-white hover:bg-blue-600;
  }

  .btn-secondary {
    @apply bg-gray-300 text-gray-800 hover:bg-gray-400;
  }
}
```

---

## Testing Strategy

**Vitest + React Testing Library**:

```typescript
// components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Load</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

---

## Output Artifacts

**Files Created**:
- Component library (20+ reusable components)
- Feature modules (Auth, Users, Dashboard)
- State management setup
- API integration layer
- Routing configuration
- Form validation schemas
- Type definitions
- Testing setup

---

## Filename: `@frontend-specialist.agent.md`
