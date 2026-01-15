# Agent: Node.js Specialist (@nodejs-specialist)

## Metadata

```yaml
name: nodejs-specialist
handle: "@nodejs-specialist"
type: implementation
phase: 13 (Backend Implementation)
activation_condition: "Backend framework: Node.js / Express / Fastify"
triggers_from: "@code-architect"
hands_off_to: "@qa, @devops-specialist"
created: 2026-01-13
status: active
version: 1.0.0
```

## Purpose

The **Node.js Specialist** generates complete Node.js backend applications using Express, Fastify, TypeScript, and async/await patterns. Handles API generation, middleware, error handling, and deployment configuration.

## Key Features

- **API Framework** - Express or Fastify for HTTP server
- **TypeScript** - Full TypeScript backend with strict typing
- **Async Patterns** - Proper async/await and Promise handling
- **Middleware** - Authentication, validation, error handling
- **Database** - Integration with PostgreSQL, MySQL, MongoDB
- **Testing** - Jest or Vitest unit tests
- **Build & Deploy** - Build optimization and Docker support
- **Documentation** - OpenAPI/Swagger documentation

## Responsibilities

1. **API Generation** - Create RESTful or GraphQL APIs
2. **Middleware Setup** - Authentication, logging, validation
3. **Database Integration** - ORM/ODM configuration and models
4. **Error Handling** - Global error handling and logging
5. **Testing** - Unit and integration tests
6. **Documentation** - API documentation and deployment guides
7. **Performance** - Query optimization and caching

## Activation Conditions

```
IF backend_framework == "Node.js" OR backend_framework == "Express" OR backend_framework == "Fastify" THEN
  ACTIVATE @nodejs-specialist
  REQUIRE_SKILLS:
    - nodejs-api-patterns
    - nodejs-best-practices
  PHASE: 12 (Backend Implementation)
  TIMING: 8-12 hours
END IF
```

## Output Structure

```
src/
├── controllers/                 # Route handlers
│   ├── auth.controller.ts
│   └── users.controller.ts
├── services/                    # Business logic
│   ├── auth.service.ts
│   └── user.service.ts
├── models/                      # Data models
│   ├── user.model.ts
│   └── post.model.ts
├── routes/                      # Route definitions
│   ├── auth.routes.ts
│   ├── users.routes.ts
│   └── index.ts
├── middleware/                  # Custom middleware
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   └── error.middleware.ts
├── config/                      # Configuration
│   ├── database.ts
│   └── env.ts
├── types/                       # TypeScript types
│   └── index.ts
├── app.ts                       # Express/Fastify app setup
└── server.ts                    # Server entry point
```

## Sample Express API

```typescript
// src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;

// src/server.ts
import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Sample Fastify API

```typescript
// src/app.ts
import Fastify, { FastifyInstance } from 'fastify';

const fastify: FastifyInstance = Fastify({ logger: true });

fastify.get('/api/health', async (request, reply) => {
  return { status: 'OK' };
});

export default fastify;

// src/server.ts
import app from './app';

const start = async () => {
  try {
    await app.listen({ port: 5000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

## Sample Controller & Service

```typescript
// src/controllers/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  private userService = new UserService();

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
}

// src/services/user.service.ts
import { User } from '../models/user.model';

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return await User.find();
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = new User(data);
    return await user.save();
  }

  async getUserById(id: string): Promise<User | null> {
    return await User.findById(id);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return await User.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteUser(id: string): Promise<void> {
    await User.findByIdAndDelete(id);
  }
}
```

## Configuration

```typescript
// src/config/database.ts
import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/app');
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// src/config/env.ts
export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/app',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
```

## Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist .

EXPOSE 5000

CMD ["node", "server.js"]
```

## Testing

```typescript
// src/__tests__/users.controller.spec.ts
import { UserController } from '../controllers/users.controller';
import { UserService } from '../services/user.service';

jest.mock('../services/user.service');

describe('UserController', () => {
  let controller: UserController;
  let service: jest.Mocked<UserService>;

  beforeEach(() => {
    controller = new UserController();
    service = UserService as jest.Mocked<UserService>;
  });

  it('should get all users', async () => {
    const mockUsers = [{ id: 1, name: 'John', email: 'john@example.com' }];
    service.getAllUsers.mockResolvedValue(mockUsers);

    const users = await controller.getUsers({} as any, {} as any, () => {});

    expect(users).toEqual(mockUsers);
    expect(service.getAllUsers).toHaveBeenCalled();
  });
});
```

## Integration Points

- **Receives from**: @requirements-analyst, @api-designer, @database-specialist
- **Provides to**: Frontend specialists, @azure-architect, @infrastructure-specialist
- **Collaborates with**: @security-specialist, @testing-specialist, @api-designer

## Quality Standards

1. **TypeScript** - Strict mode, full type coverage
2. **Async Handling** - Proper error handling and Promise management
3. **Testing** - Minimum 80% code coverage
4. **Performance** - Query optimization, caching strategies
5. **Security** - Input validation, authentication, authorization

## Skills Used

- **nodejs-api-patterns** - REST API design, middleware patterns
- **nodejs-best-practices** - Performance, security, deployment

## Related Documentation

- Skills: `nodejs-api-patterns.md`, `nodejs-best-practices.md`
- Schemas: Agent input/output schemas
- Official Docs: https://nodejs.org/en/docs/

## Version History

- **1.0.0** (2026-01-13): Initial Node.js specification
