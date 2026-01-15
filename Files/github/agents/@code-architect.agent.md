# @code-architect Agent (Phase 8)

**Agent ID**: `@code-architect`  
**Phase**: 8  
**Purpose**: Translate architecture into code structure, patterns, and technical design  
**Triggers From**: @architect (architecture_decisions)  
**Hands Off To**: 
- **Architecture Tier** (conditional): @azure-architect, @bicep-specialist, @database-specialist
- **Frontend Specialists** (conditional): @react-specialist, @vue-specialist, @angular-specialist, @svelte-specialist, @frontend-specialist
- **Backend Specialists** (conditional): @dotnet-specialist, @nodejs-specialist, @python-specialist, @go-specialist, @java-specialist, @backend-specialist
- **Database Specialists** (conditional): @mysql-specialist, @database-specialist
- **Infrastructure** (conditional): @docker-specialist
- **CI/CD**: @devops-specialist (always)

---

## Core Responsibilities

### 1. Design Code Structure

**From Architecture to Code**:
- Translate architecture decisions into folder structure
- Define module/package boundaries
- Create layer architecture (presentation, business logic, data access)
- Establish naming conventions and file organization

**Example: Modular Monolith Structure**

```
src/
├── api/                          # HTTP API Layer
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── products.routes.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error-handler.ts
│   └── controllers/
│       ├── auth.controller.ts
│       ├── users.controller.ts
│       └── products.controller.ts
│
├── domain/                       # Business Logic (Domain Models)
│   ├── user/
│   │   ├── User.model.ts
│   │   ├── User.service.ts
│   │   ├── User.repository.ts
│   │   └── User.validator.ts
│   ├── product/
│   │   ├── Product.model.ts
│   │   ├── Product.service.ts
│   │   └── Product.repository.ts
│   └── shared/
│       ├── BaseEntity.ts
│       ├── Result.ts
│       └── Exception.ts
│
├── data/                         # Data Access Layer
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── connection.ts
│   ├── repositories/
│   │   └── [Implementations]
│   └── types.ts
│
├── shared/                       # Cross-Cutting Concerns
│   ├── logging/
│   │   ├── Logger.ts
│   │   └── formatters/
│   ├── tracing/
│   │   ├── Tracer.ts
│   │   └── correlation-id.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── env.ts
│   ├── security/
│   │   ├── auth/
│   │   ├── encryption/
│   │   └── rbac/
│   └── utils/
│       ├── helpers.ts
│       └── validators.ts
│
├── app.ts                        # Application Bootstrap
└── main.ts                       # Entry Point
```

### 2. Define Layer Architecture

**Layered Architecture Pattern**:

```
┌────────────────────────────────────────┐
│    API Layer (Controllers, Routes)     │  HTTP Requests/Responses
├────────────────────────────────────────┤
│  Application/Service Layer             │  Business Logic Orchestration
├────────────────────────────────────────┤
│  Domain Layer (Models, Services)       │  Core Business Logic & Rules
├────────────────────────────────────────┤
│  Infrastructure Layer (Repositories)   │  Data Access, External Services
├────────────────────────────────────────┤
│  Shared/Cross-Cutting (Logging, Auth)  │  Infrastructure Concerns
└────────────────────────────────────────┘
```

**Responsibility by Layer**:

| Layer | Responsibility | Example |
|-------|-----------------|---------|
| **API** | HTTP request/response handling | Routes, controllers, serialization |
| **Application** | Use case orchestration | Workflows, business processes |
| **Domain** | Business rules and logic | Models, validators, calculations |
| **Infrastructure** | Data & external services | Database, APIs, messaging |
| **Shared** | Cross-cutting concerns | Logging, config, security |

### 3. Design Patterns & Conventions

**Core Design Patterns**:

#### Repository Pattern
```typescript
// Repository Interface
interface IUserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// Implementation
class UserRepository implements IUserRepository {
  constructor(private db: Database) {}
  
  async findById(id: string): Promise<User> {
    const row = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return UserMapper.toDomain(row);
  }
}
```

**Benefits**: Abstraction, testability, swappable implementations

#### Service Pattern
```typescript
class UserService {
  constructor(
    private userRepository: IUserRepository,
    private logger: Logger
  ) {}

  async createUser(data: CreateUserDTO): Promise<User> {
    // Business logic
    const user = User.create(data);
    await this.userRepository.save(user);
    this.logger.info('User created', { userId: user.id });
    return user;
  }
}
```

**Benefits**: Reusable business logic, dependency injection, testability

#### Dependency Injection
```typescript
// Container setup
const container = new Container();
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<UserService>(TYPES.UserService).to(UserService);

// Usage
const userService = container.get<UserService>(TYPES.UserService);
```

**Benefits**: Loose coupling, testability, easy to swap implementations

#### Factory Pattern
```typescript
class ServiceFactory {
  static createUserService(database: Database): UserService {
    const repository = new UserRepository(database);
    return new UserService(repository, new Logger());
  }
}
```

**Benefits**: Complex object creation, encapsulation

#### Observer Pattern (Events)
```typescript
class UserEvents {
  static userCreated = new Event<UserCreatedPayload>();
}

// Publish
UserEvents.userCreated.emit({ userId: '123', email: 'user@example.com' });

// Subscribe
UserEvents.userCreated.subscribe((payload) => {
  // Send welcome email
});
```

**Benefits**: Decoupling, async processing

### 4. API Contract Definition

**REST Endpoint Conventions**:

```
GET    /api/v1/users              # List users
GET    /api/v1/users/:id          # Get user
POST   /api/v1/users              # Create user
PUT    /api/v1/users/:id          # Update user
DELETE /api/v1/users/:id          # Delete user
```

**Request/Response Format**:

```json
{
  "method": "POST",
  "path": "/api/v1/users",
  "request": {
    "body": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  },
  "response": {
    "status": 201,
    "body": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2026-01-13T10:00:00Z"
    }
  }
}
```

**Error Response Format**:

```json
{
  "status": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "constraint": "format"
    }
  }
}
```

### 5. Data Model Design

**Domain Model Mapping**:

```typescript
// Database Schema
Table: users
├── id: UUID (PK)
├── email: VARCHAR (UNIQUE)
├── name: VARCHAR
├── passwordHash: VARCHAR
├── createdAt: TIMESTAMP
└── updatedAt: TIMESTAMP

// Domain Model
class User extends AggregateRoot {
  readonly id: UserId;
  readonly email: Email;
  readonly name: Name;
  private passwordHash: string;

  static create(props: CreateUserProps): User { ... }
  
  changeEmail(newEmail: Email): void { ... }
  
  verifyPassword(password: string): boolean { ... }
}

// Data Transfer Object (DTO)
interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
}

// Mapper
class UserMapper {
  static toDomain(raw: any): User { ... }
  static toDTO(user: User): UserDTO { ... }
}
```

**Benefits**: Type safety, clear boundaries, testability

### 6. Cross-Cutting Concerns

**Logging Structure**:
```typescript
class Logger {
  info(message: string, context?: object) { ... }
  error(message: string, error: Error, context?: object) { ... }
  warn(message: string, context?: object) { ... }
  debug(message: string, context?: object) { ... }
}

// Usage
this.logger.info('User created', {
  userId: user.id,
  email: user.email
});
```

**Configuration Management**:
```typescript
// Environment-based config
interface AppConfig {
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  logging: LoggingConfig;
}

const config: AppConfig = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: 20
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h'
  }
};
```

**Security Patterns**:
```typescript
// Input Validation Middleware
async function validateRequest(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  });
  
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error });
  
  req.validated = value;
  next();
}

// Auth Middleware
async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Implementation Options

### Option 1: Clean Architecture with Dependency Injection

```
High-level modules do not depend on low-level modules;
both depend on abstractions
```

**Benefits**: Maximum testability, flexibility, clean code
**Overhead**: More boilerplate, learning curve
**Suitable for**: Large teams, long-term projects

### Option 2: Layered Architecture (Simpler)

```
Layers: API → Services → Repositories → Database
Each layer depends on layer below it
```

**Benefits**: Simple, easy to understand, quick to build
**Overhead**: Less flexible, harder to test lower layers
**Suitable for**: MVP, small teams, rapid development

### Option 3: Modular Monolith

```
Independent modules with clear boundaries
Modules can be extracted to microservices later
```

**Benefits**: Good for scaling teams, clear ownership
**Overhead**: Requires discipline, module communication overhead
**Suitable for**: Growing teams, complex domains

---

## Output Artifacts

### 1. Folder Structure Template

**File**: `ProjectPlan/02-Architecture/Code-Structure.md`

```markdown
# Code Structure

## Overview
Monolithic Node.js/TypeScript application with layered architecture

## Directory Structure
[As shown above in code examples]

## Module Responsibilities
- **api/**: HTTP layer, request/response handling
- **domain/**: Business logic and rules
- **data/**: Data access and persistence
- **shared/**: Cross-cutting concerns

## Naming Conventions
- Files: kebab-case (user.service.ts)
- Classes: PascalCase (UserService)
- Functions: camelCase (createUser)
- Constants: UPPER_SNAKE_CASE (MAX_USERS)
```

### 2. Architecture Decision Records

**File**: `ProjectPlan/02-Architecture/Design-Patterns.md`

```markdown
# Design Patterns & Technical Decisions

## ADR-003: Use Repository Pattern for Data Access
**Status**: Accepted

**Decision**: All data access goes through Repository interface

**Consequences**:
- ✅ Testable services (mock repositories)
- ✅ Swappable database implementations
- ❌ Extra indirection layer
```

### 3. API Contract Document

**File**: `ProjectPlan/02-Architecture/API-Contracts.md`

```markdown
# REST API Contracts

## User Service

### POST /api/v1/users
Create a new user

**Request**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securePassword123"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-13T10:00:00Z"
}
```
```

### 4. Testing Strategy

**File**: `ProjectPlan/02-Architecture/Testing-Strategy.md`

```markdown
# Testing Strategy

## Unit Tests
- Test individual functions/methods
- Mock external dependencies
- Coverage target: >80%

## Integration Tests
- Test module interactions
- Use test database
- Coverage target: >60% of critical paths

## Example Unit Test
```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    userService = new UserService(mockRepository);
  });

  it('should create user with valid email', async () => {
    const result = await userService.createUser({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123'
    });

    expect(result.email).toBe('test@example.com');
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```
```

---

## Frontend-Specific Architecture Design

**Note**: These responsibilities are part of Phase 8 output. @frontend-specialist (Phase 10) is deprecated; frontend architecture is now defined here.

### Frontend Code Structure

**Technology Stack**:
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand or TanStack Query
- **Component Library**: Shadcn/ui or Radix UI
- **Testing**: Vitest + React Testing Library

**Project Structure**:

```
src/
├── components/                          # Reusable UI components
│   ├── common/                         # Shared across features
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── Sidebar.tsx
│   ├── features/                       # Feature-specific components
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
│   └── ui/                            # Base UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Card.tsx
├── hooks/                              # Custom React hooks
│   ├── useAuth.ts
│   ├── useFetch.ts
│   └── useLocalStorage.ts
├── services/                           # API & data services
│   ├── api/
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   └── client.ts                 # Axios/Fetch client config
│   └── storage/
│       └── localStorage.service.ts
├── store/                              # State management
│   ├── authStore.ts                  # Zustand auth state
│   ├── userStore.ts                  # Zustand user state
│   └── index.ts
├── types/                              # TypeScript types
│   ├── api.types.ts                  # API response types
│   ├── domain.types.ts               # Domain models
│   └── common.types.ts               # Shared types
├── utils/                              # Utility functions
│   ├── helpers.ts
│   ├── validators.ts
│   └── formatters.ts
├── pages/                              # Page components (routes)
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── NotFoundPage.tsx
│   └── ErrorPage.tsx
├── App.tsx                             # Root component
├── main.tsx                            # Entry point
└── styles/
    ├── globals.css
    └── tailwind.css
```

### Frontend Component Patterns

**Base UI Component Pattern**:
```typescript
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
  disabled,
  ...rest
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
};
```

**Feature Component Pattern**:
```typescript
interface UserListProps {
  initialFilter?: string;
}

export const UserList: React.FC<UserListProps> = ({ initialFilter = '' }) => {
  const { users, isLoading, error } = useUsers({ filter: initialFilter });
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="user-list">
      {users.map(user => (
        <UserItem
          key={user.id}
          user={user}
          onSelect={() => navigate(`/users/${user.id}`)}
        />
      ))}
    </div>
  );
};
```

### Frontend State Management

**Zustand Store Pattern**:
```typescript
import create from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, password) => {
    const response = await authService.login(email, password);
    set({
      user: response.user,
      isAuthenticated: true,
    });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

**TanStack Query (React Query) Pattern**:
```typescript
export function useUsers(filter?: string) {
  return useQuery({
    queryKey: ['users', filter],
    queryFn: () => userService.listUsers(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## Backend-Specific Architecture Design

**Note**: These responsibilities are part of Phase 8 output. @backend-specialist (Phase 11) is deprecated; backend architecture is now defined here.

### Backend Code Structure

**Technology Stack**:
- **Framework**: Express.js or ASP.NET Core
- **Language**: TypeScript or C#
- **ORM**: Prisma, TypeORM, or Entity Framework Core
- **Authentication**: JWT or OAuth2
- **Validation**: Zod or FluentValidation
- **Testing**: Jest or xUnit

**Project Structure** (Express/Node.js):

```
src/
├── api/                                # HTTP API Layer
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── products.routes.ts
│   │   └── index.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error-handler.ts
│   │   └── request-logger.ts
│   └── controllers/
│       ├── auth.controller.ts
│       ├── users.controller.ts
│       └── products.controller.ts
│
├── domain/                             # Business Logic Layer
│   ├── user/
│   │   ├── User.model.ts
│   │   ├── User.service.ts
│   │   ├── User.repository.ts
│   │   └── User.validator.ts
│   ├── product/
│   │   ├── Product.model.ts
│   │   ├── Product.service.ts
│   │   ├── Product.repository.ts
│   │   └── Product.validator.ts
│   └── shared/
│       ├── BaseEntity.ts
│       ├── Result.ts
│       └── Exception.ts
│
├── data/                               # Data Access Layer
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   ├── connection.ts
│   │   └── schema.prisma (or TypeORM entities)
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── product.repository.ts
│   │   └── base.repository.ts
│   └── types.ts
│
├── shared/                             # Cross-Cutting Concerns
│   ├── logging/
│   │   ├── Logger.ts
│   │   └── formatters/
│   ├── tracing/
│   │   ├── Tracer.ts
│   │   └── correlation-id.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── env.ts
│   ├── security/
│   │   ├── auth/
│   │   ├── encryption/
│   │   └── rbac/
│   └── utils/
│       ├── helpers.ts
│       └── validators.ts
│
├── app.ts                              # Application Setup
└── main.ts                             # Entry Point
```

### Backend Service Patterns

**Service Implementation Pattern**:
```typescript
interface IUserService {
  createUser(data: CreateUserDTO): Promise<User>;
  getUserById(id: string): Promise<User>;
  updateUser(id: string, data: UpdateUserDTO): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private logger: Logger
  ) {}

  async createUser(data: CreateUserDTO): Promise<User> {
    // Validation
    if (await this.userRepository.findByEmail(data.email)) {
      throw new ConflictError('Email already exists');
    }

    // Business logic
    const user = User.create(data);
    user.encryptPassword(data.password);

    // Persistence
    await this.userRepository.save(user);

    // Logging
    this.logger.info('User created', {
      userId: user.id,
      email: user.email,
    });

    return user;
  }
}
```

**Repository Pattern** (Data Access Abstraction):
```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(filter?: UserFilter): Promise<User[]>;
}

export class UserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.db.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return row ? UserMapper.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    const dto = UserMapper.toDatabase(user);
    await this.db.query(
      'INSERT INTO users (...) VALUES (...)',
      Object.values(dto)
    );
  }
}
```

### Backend API Contract Definition

**REST API Conventions**:
```
GET    /api/v1/users              # List users
GET    /api/v1/users/:id          # Get user
POST   /api/v1/users              # Create user
PUT    /api/v1/users/:id          # Update user
DELETE /api/v1/users/:id          # Delete user
```

**Request/Response Format**:
```json
{
  "method": "POST",
  "path": "/api/v1/users",
  "request": {
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer <jwt>"
    },
    "body": {
      "email": "user@example.com",
      "name": "John Doe",
      "password": "securePassword123"
    }
  },
  "response": {
    "status": 201,
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2026-01-13T10:00:00Z"
    }
  }
}
```

### Backend Dependency Injection

**Container Setup Pattern**:
```typescript
import { Container } from 'inversify';

const container = new Container();

// Register repositories
container.bind<IUserRepository>(TYPES.UserRepository).to(UserRepository);
container.bind<IProductRepository>(TYPES.ProductRepository).to(ProductRepository);

// Register services
container.bind<IUserService>(TYPES.UserService).to(UserService);
container.bind<IProductService>(TYPES.ProductService).to(ProductService);

// Register middleware
container.bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware);

export { container };
```

---

## Handoff to Implementation Specialists

**Output Contract**:
```json
{
  "code_structure_defined": true,
  "layer_architecture": "Layered",
  "design_patterns": ["Repository", "Service", "DTO", "Observer", "DI"],
  "frontend_architecture_defined": true,
  "frontend_component_patterns": ["Base UI", "Feature", "Page", "Hook"],
  "frontend_state_management": "Zustand or TanStack Query",
  "backend_architecture_defined": true,
  "backend_service_patterns": ["Service", "Repository", "DI"],
  "api_contracts_defined": true,
  "folder_structure": "src/api, src/domain, src/data, src/shared",
  "naming_conventions": "kebab-case files, PascalCase classes",
  "estimated_classes": 50,
  "estimated_modules": 8,
  "deprecated_phases": [10, 11]
}
```

**Note on Phases 10-11 (Deprecated)**:
- ~~@frontend-specialist (Phase 10)~~: Functionality merged into Phase 8 (@code-architect)
- ~~@backend-specialist (Phase 11)~~: Functionality merged into Phase 8 (@code-architect)

Frontend and backend design specifications are now produced in Phase 8, allowing specialists to proceed directly to:
- Phase 9: @azure-architect & @bicep-specialist (Infrastructure)
- Phase 13: @react-specialist (Frontend implementation)
- Phase 14: @dotnet-specialist (Backend implementation)
- Phase 15: @database-specialist (Database implementation)

**Next Steps**:
- @react-specialist (Phase 13): Builds React components following frontend architecture
- @dotnet-specialist (Phase 14): Implements C# services and controllers following backend architecture
- @database-specialist (Phase 15): Designs schema following domain model definitions
- @azure-architect & @bicep-specialist (Phases 9): Designs infrastructure for deployment

---

## Filename: `@code-architect.agent.md`
