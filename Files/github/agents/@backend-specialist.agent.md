# @backend-specialist Agent (Phase 11)

**Agent ID**: `@backend-specialist`  
**Phase**: 11  
**Purpose**: Implement backend APIs, services, and business logic  
**Triggers From**: @code-architect (code_structure)  
**Hands Off To**: @devops-specialist (api_endpoints, deployment_config)

---

## Core Responsibilities

### 1. REST API Implementation

**Express.js/Node.js Pattern**:

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { authRoutes } from './api/routes/auth.routes';
import { userRoutes } from './api/routes/user.routes';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(helmet()); // Security headers
  app.use(cors()); // CORS
  app.use(express.json()); // JSON parsing
  app.use(requestLogger); // Logging

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
};

// src/main.ts
import { createApp } from './app';

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
```

### 2. Service Layer

**Service Implementation**:

```typescript
// src/domain/user/User.service.ts
import { IUserRepository } from './User.repository';
import { Logger } from '../../shared/logging/Logger';

export interface IUserService {
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

    // Persistence
    await this.userRepository.save(user);

    // Logging
    this.logger.info('User created', {
      userId: user.id,
      email: user.email,
    });

    // Publish event for notifications
    UserEvents.userCreated.emit({
      userId: user.id,
      email: user.email,
    });

    return user;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const user = await this.getUserById(id);
    user.update(data);
    await this.userRepository.save(user);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
    this.logger.info('User deleted', { userId: id });
  }
}
```

### 3. Repository Pattern

**Data Access Layer**:

```typescript
// src/data/repositories/User.repository.ts
import { Database } from '../database/connection';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

export class UserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] ? UserMapper.toDomain(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.db.query(query, [email]);
    return result.rows[0] ? UserMapper.toDomain(result.rows[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await this.db.query(query);
    return result.rows.map(UserMapper.toDomain);
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    const query = `
      INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        email = $2, name = $3, updated_at = $6
    `;
    await this.db.query(query, [
      data.id,
      data.email,
      data.name,
      data.passwordHash,
      data.createdAt,
      data.updatedAt,
    ]);
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM users WHERE id = $1';
    await this.db.query(query, [id]);
  }
}

// Mapper for domain/persistence conversion
class UserMapper {
  static toDomain(raw: any): User {
    return new User({
      id: raw.id,
      email: raw.email,
      name: raw.name,
      passwordHash: raw.password_hash,
      createdAt: raw.created_at,
    });
  }

  static toPersistence(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: new Date(),
    };
  }
}
```

### 4. Route Handlers

**Controller Pattern**:

```typescript
// src/api/controllers/User.controller.ts
import { Request, Response, NextFunction } from 'express';
import { IUserService } from '../../domain/user/User.service';

export class UserController {
  constructor(private userService: IUserService) {}

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      await this.userService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

// src/api/routes/user.routes.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { CreateUserSchema } from '../../types/schemas';
import { UserController } from '../controllers/User.controller';

export const createUserRoutes = (controller: UserController) => {
  const router = express.Router();

  router.post(
    '/',
    validate(CreateUserSchema),
    controller.createUser.bind(controller)
  );

  router.get('/:id', authenticate, controller.getUserById.bind(controller));

  router.put(
    '/:id',
    authenticate,
    validate(UpdateUserSchema),
    controller.updateUser.bind(controller)
  );

  router.delete('/:id', authenticate, controller.deleteUser.bind(controller));

  return router;
};
```

### 5. Authentication

**JWT Authentication Pattern**:

```typescript
// src/shared/security/auth/JwtService.ts
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

export class JwtService {
  private secret = process.env.JWT_SECRET || 'your-secret-key';
  private expiresIn = '24h';

  generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.secret, { expiresIn: '7d' });
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }
}

// Middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const payload = jwtService.verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access control
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

### 6. Error Handling

**Global Error Handler**:

```typescript
// src/shared/exceptions/Exception.ts
export class ApplicationException extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
  }
}

export class ValidationError extends ApplicationException {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends ApplicationException {
  constructor(message: string) {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends ApplicationException {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class UnauthorizedError extends ApplicationException {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

// Error handler middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error', error);

  if (error instanceof ApplicationException) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  // Unknown error
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
```

### 7. Validation

**Input Validation Middleware**:

```typescript
// src/api/middleware/validation.ts
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validated = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
};

// Schema definitions
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;
```

### 8. Testing

**Unit Tests with Vitest**:

```typescript
// src/domain/user/User.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './User.service';

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    userService = new UserService(mockRepository, new Logger());
  });

  it('should create a user', async () => {
    mockRepository.findByEmail.mockResolvedValue(null);

    const result = await userService.createUser({
      email: 'test@example.com',
      name: 'Test',
      password: 'password123',
    });

    expect(result.email).toBe('test@example.com');
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should throw error if email exists', async () => {
    mockRepository.findByEmail.mockResolvedValue({ id: '1' });

    await expect(
      userService.createUser({
        email: 'existing@example.com',
        name: 'Test',
        password: 'password123',
      })
    ).rejects.toThrow('Email already exists');
  });
});
```

---

## Output Artifacts

**Files Created**:
- Service implementations (10+ services)
- Repository implementations (database access)
- API routes and controllers
- Authentication/authorization system
- Input validation schemas
- Error handling system
- Type definitions
- Unit and integration tests

---

## Filename: `@backend-specialist.agent.md`
