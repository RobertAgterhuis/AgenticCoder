# Phase 5: Backend Framework Expansion

**Duration:** 1.5 weken  
**Status:** ⬜ Not Started  
**Priority:** 🟡 High

---

## 🎯 Phase Objective

Uitbreiden van backend capabilities met Node.js/Express patterns, Python/FastAPI, en NestJS voor enterprise Node.js development.

---

## 📊 Backend Capability Matrix

| Framework | Current | Target | Use Case |
|-----------|---------|--------|----------|
| .NET/C# | ✅ @dotnet-specialist | ✅ Behouden | Enterprise |
| Express.js | ❌ Basic only | 🆕 Full support | Simple APIs |
| NestJS | ❌ None | 🆕 Full support | Enterprise Node |
| FastAPI | ❌ None | 🆕 Full support | Python APIs |
| Node.js Core | ❌ None | 🆕 Full support | Foundation |

---

## 📋 Tasks

### Task 5.1: @nodejs-specialist Agent

**Priority:** 🟡 High  
**Estimated:** 2 dagen

**Description:**  
Node.js specialist voor server-side JavaScript/TypeScript development, inclusief Express en NestJS expertise.

**Agent Definition:**

```markdown
# @nodejs-specialist Agent

**Agent ID**: `@nodejs-specialist`  
**Phase**: 9  
**Purpose**: Design and implement Node.js backend services  
**Triggers From**: @backend-specialist, @code-architect  
**Hands Off To**: @devops-specialist, @container-specialist

---

## Core Responsibilities

### 1. Node.js Architecture
- Event loop understanding
- Async/await patterns
- Error handling
- Memory management
- Performance optimization
- Worker threads
- Cluster mode

### 2. Express.js
- Middleware patterns
- Router design
- Error handling middleware
- Request validation
- Response formatting
- Security middleware

### 3. NestJS (Enterprise)
- Module structure
- Dependency injection
- Controllers
- Services
- Guards & Interceptors
- Pipes & Filters
- Microservices

### 4. Database Integration
- Prisma ORM
- TypeORM
- Sequelize
- MongoDB/Mongoose
- Connection pooling
- Transactions
```

**Express.js Project Structure:**
```
src/
├── controllers/
│   ├── userController.ts
│   ├── orderController.ts
│   └── index.ts
├── services/
│   ├── userService.ts
│   ├── orderService.ts
│   └── index.ts
├── repositories/
│   ├── userRepository.ts
│   ├── orderRepository.ts
│   └── index.ts
├── middleware/
│   ├── auth.ts
│   ├── errorHandler.ts
│   ├── validator.ts
│   └── logger.ts
├── routes/
│   ├── userRoutes.ts
│   ├── orderRoutes.ts
│   └── index.ts
├── models/
│   ├── user.ts
│   └── order.ts
├── utils/
│   ├── logger.ts
│   └── helpers.ts
├── config/
│   └── index.ts
├── types/
│   └── index.ts
├── app.ts
└── server.ts
```

**NestJS Project Structure:**
```
src/
├── modules/
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   ├── orders/
│   │   └── ... (same structure)
│   └── auth/
│       ├── auth.module.ts
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── guards/
│       │   └── jwt-auth.guard.ts
│       └── strategies/
│           └── jwt.strategy.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
│   └── configuration.ts
├── prisma/
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] Express.js patterns defined
- [ ] NestJS patterns defined
- [ ] Database integration patterns
- [ ] Testing patterns

**Files to Create:**
- `.github/agents/@nodejs-specialist.agent.md`
- `.github/schemas/nodejs-specialist.input.schema.json`
- `.github/schemas/nodejs-specialist.output.schema.json`

---

### Task 5.2: @python-specialist Agent

**Priority:** 🟡 High  
**Estimated:** 2 dagen

**Description:**  
Python specialist voor FastAPI, Django REST, en Python backend services.

**Agent Definition:**

```markdown
# @python-specialist Agent

**Agent ID**: `@python-specialist`  
**Phase**: 9  
**Purpose**: Design and implement Python backend services  
**Triggers From**: @backend-specialist, @code-architect  
**Hands Off To**: @devops-specialist, @container-specialist

---

## Core Responsibilities

### 1. FastAPI
- Async endpoints
- Pydantic models
- Dependency injection
- Background tasks
- WebSockets
- OpenAPI documentation

### 2. Database Integration
- SQLAlchemy 2.0
- Alembic migrations
- async database drivers
- Connection pooling

### 3. Project Structure
- Clean architecture
- Domain-driven design
- Repository pattern
- Service layer

### 4. Testing
- pytest
- pytest-asyncio
- Test fixtures
- Mocking
- Integration tests
```

**FastAPI Project Structure:**
```
src/
├── api/
│   ├── v1/
│   │   ├── endpoints/
│   │   │   ├── users.py
│   │   │   ├── orders.py
│   │   │   └── __init__.py
│   │   ├── router.py
│   │   └── __init__.py
│   └── deps.py
├── core/
│   ├── config.py
│   ├── security.py
│   └── __init__.py
├── db/
│   ├── base.py
│   ├── session.py
│   └── __init__.py
├── models/
│   ├── user.py
│   ├── order.py
│   └── __init__.py
├── schemas/
│   ├── user.py
│   ├── order.py
│   └── __init__.py
├── services/
│   ├── user_service.py
│   ├── order_service.py
│   └── __init__.py
├── repositories/
│   ├── user_repository.py
│   ├── order_repository.py
│   └── __init__.py
├── main.py
└── __init__.py
```

**Acceptance Criteria:**
- [ ] Agent specification complete
- [ ] FastAPI patterns defined
- [ ] SQLAlchemy integration
- [ ] Async patterns
- [ ] Testing patterns

**Files to Create:**
- `.github/agents/@python-specialist.agent.md`
- `.github/schemas/python-specialist.input.schema.json`
- `.github/schemas/python-specialist.output.schema.json`

---

### Task 5.3: express-patterns Skill

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
Express.js best practices en design patterns.

**Skill Topics:**

```markdown
# Express Patterns Skill

## Core Patterns

### 1. Middleware Chain Pattern

​```typescript
// Error handling middleware (must be last)
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Auth middleware
const authenticate: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new UnauthorizedError('No token provided');
    
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid token'));
  }
};
​```

### 2. Controller Pattern

​```typescript
class UserController {
  constructor(private userService: UserService) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const users = await this.userService.findAll({ page: +page, limit: +limit });
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.userService.findById(req.params.id);
      if (!user) throw new NotFoundError('User not found');
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
}
​```

### 3. Validation Pattern

​```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    name: z.string().min(2).max(100),
    password: z.string().min(8)
  })
});

const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      next(new ValidationError(error));
    }
  };
};

// Usage
router.post('/users', validate(createUserSchema), userController.create);
​```
```

**Acceptance Criteria:**
- [ ] Middleware patterns
- [ ] Controller patterns
- [ ] Validation patterns
- [ ] Error handling
- [ ] Testing patterns

**Files to Create:**
- `.github/skills/express-patterns.skill.md`

---

### Task 5.4: fastapi-patterns Skill

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
FastAPI best practices en design patterns.

**Skill Topics:**

```markdown
# FastAPI Patterns Skill

## Core Patterns

### 1. Dependency Injection

​```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await user_service.get_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    return user
​```

### 2. Router Pattern

​```python
from fastapi import APIRouter, Depends, HTTPException
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await user_service.get_all(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    user = await user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
​```

### 3. Pydantic Models

​```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=2, max_length=100)

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
​```
```

**Acceptance Criteria:**
- [ ] Dependency injection patterns
- [ ] Router organization
- [ ] Pydantic model patterns
- [ ] Async database patterns
- [ ] Error handling

**Files to Create:**
- `.github/skills/fastapi-patterns.skill.md`

---

### Task 5.5: nestjs-patterns Skill

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
NestJS enterprise patterns voor Node.js.

**Skill Topics:**

```markdown
# NestJS Patterns Skill

## Core Patterns

### 1. Module Pattern

​```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
​```

### 2. Service Pattern

​```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.usersRepository.create(createUserDto);
    
    this.eventEmitter.emit('user.created', new UserCreatedEvent(user));
    
    return user;
  }

  async findAll(query: PaginationQuery): Promise<PaginatedResult<User>> {
    return this.usersRepository.findAll(query);
  }
}
​```

### 3. Guard Pattern

​```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) return true;
    
    return super.canActivate(context);
  }
}
​```
```

**Acceptance Criteria:**
- [ ] Module organization
- [ ] Dependency injection
- [ ] Guards and interceptors
- [ ] Pipes and filters
- [ ] Testing patterns

**Files to Create:**
- `.github/skills/nestjs-patterns.skill.md`

---

## 📁 Files Created This Phase

```
.github/agents/
├── @nodejs-specialist.agent.md
└── @python-specialist.agent.md

.github/skills/
├── express-patterns.skill.md
├── fastapi-patterns.skill.md
└── nestjs-patterns.skill.md

.github/schemas/
├── nodejs-specialist.input.schema.json
├── nodejs-specialist.output.schema.json
├── python-specialist.input.schema.json
└── python-specialist.output.schema.json
```

---

## ✅ Phase Completion Checklist

- [ ] @nodejs-specialist agent complete
- [ ] @python-specialist agent complete
- [ ] express-patterns skill complete
- [ ] fastapi-patterns skill complete
- [ ] nestjs-patterns skill complete
- [ ] All schemas defined
- [ ] Integration with @backend-specialist
- [ ] Framework selection logic documented

---

## 🔗 Navigation

← [04-PHASE-INFRASTRUCTURE.md](04-PHASE-INFRASTRUCTURE.md) | → [06-PHASE-AZURE-ECOSYSTEM.md](06-PHASE-AZURE-ECOSYSTEM.md)
