# @nodejs-specialist Agent

**Agent ID**: `@nodejs-specialist`  
**Version**: 1.0.0  
**Phase**: 9  
**Classification**: Backend Specialist

---

## 🎯 Purpose

Design and implement Node.js backend services using Express.js, NestJS, and modern TypeScript patterns with focus on performance, scalability, and maintainability.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | Node.js Backend Development |
| **Primary Technology** | Node.js, Express.js, NestJS, TypeScript |
| **Input Schema** | `nodejs-specialist.input.schema.json` |
| **Output Schema** | `nodejs-specialist.output.schema.json` |
| **Triggers From** | @backend-specialist, @code-architect, @coordinator |
| **Hands Off To** | @devops-specialist, @container-specialist, @database-specialist |

---

## 🔧 Core Responsibilities

### 1. Node.js Architecture

#### Event Loop Understanding
```
┌───────────────────────────────────────────────────────────────┐
│                      Node.js Event Loop                        │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│   ┌─────────────┐                                              │
│   │   timers    │  setTimeout, setInterval callbacks           │
│   └──────┬──────┘                                              │
│          ▼                                                     │
│   ┌─────────────┐                                              │
│   │   pending   │  I/O callbacks                               │
│   │  callbacks  │                                              │
│   └──────┬──────┘                                              │
│          ▼                                                     │
│   ┌─────────────┐                                              │
│   │    idle,    │  Internal use                                │
│   │   prepare   │                                              │
│   └──────┬──────┘                                              │
│          ▼                                                     │
│   ┌─────────────┐   ◄── incoming connections, data, etc.       │
│   │    poll     │  Retrieve new I/O events                     │
│   └──────┬──────┘                                              │
│          ▼                                                     │
│   ┌─────────────┐                                              │
│   │    check    │  setImmediate callbacks                      │
│   └──────┬──────┘                                              │
│          ▼                                                     │
│   ┌─────────────┐                                              │
│   │    close    │  close event callbacks                       │
│   │  callbacks  │                                              │
│   └─────────────┘                                              │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

#### Async/Await Best Practices
```typescript
// ✅ Good: Parallel execution when possible
async function fetchUserData(userId: string): Promise<UserData> {
  const [user, orders, preferences] = await Promise.all([
    userService.findById(userId),
    orderService.findByUserId(userId),
    preferenceService.findByUserId(userId)
  ]);
  
  return { user, orders, preferences };
}

// ✅ Good: Error handling with async/await
async function processOrder(orderId: string): Promise<Order> {
  try {
    const order = await orderService.findById(orderId);
    if (!order) {
      throw new NotFoundError(`Order ${orderId} not found`);
    }
    
    await paymentService.process(order);
    await inventoryService.reserve(order.items);
    await notificationService.sendConfirmation(order);
    
    return order;
  } catch (error) {
    if (error instanceof PaymentError) {
      await orderService.markPaymentFailed(orderId, error.message);
    }
    throw error;
  }
}

// ✅ Good: Graceful async iteration
async function* streamOrders(query: OrderQuery): AsyncGenerator<Order> {
  let cursor: string | undefined;
  
  do {
    const batch = await orderService.findBatch(query, cursor);
    for (const order of batch.items) {
      yield order;
    }
    cursor = batch.nextCursor;
  } while (cursor);
}

// Usage
for await (const order of streamOrders({ status: 'pending' })) {
  await processOrder(order.id);
}
```

#### Error Handling Patterns
```typescript
// Custom error classes
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details: Record<string, string[]>
  ) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// Global error handler
process.on('uncaughtException', (error: Error) => {
  logger.fatal('Uncaught Exception:', error);
  // Graceful shutdown
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  // Log but don't exit - let the event loop continue
});
```

### 2. Express.js Architecture

#### Project Structure
```
src/
├── controllers/
│   ├── user.controller.ts
│   ├── order.controller.ts
│   └── index.ts
├── services/
│   ├── user.service.ts
│   ├── order.service.ts
│   └── index.ts
├── repositories/
│   ├── user.repository.ts
│   ├── order.repository.ts
│   └── index.ts
├── middleware/
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── validation.middleware.ts
│   ├── logger.middleware.ts
│   └── rate-limit.middleware.ts
├── routes/
│   ├── user.routes.ts
│   ├── order.routes.ts
│   └── index.ts
├── models/
│   ├── user.model.ts
│   └── order.model.ts
├── validators/
│   ├── user.validator.ts
│   └── order.validator.ts
├── utils/
│   ├── logger.ts
│   ├── helpers.ts
│   └── async-handler.ts
├── config/
│   ├── index.ts
│   ├── database.ts
│   └── env.ts
├── types/
│   ├── express.d.ts
│   └── index.ts
├── app.ts
└── server.ts
```

#### Express App Setup
```typescript
// app.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import routes from './routes';
import { logger } from './utils/logger';

export function createApp(): Application {
  const app = express();
  
  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
  }));
  
  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Compression
  app.use(compression());
  
  // Logging
  app.use(pinoHttp({ logger }));
  
  // Rate limiting
  app.use('/api', rateLimiter);
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  // API routes
  app.use('/api/v1', routes);
  
  // 404 handler
  app.use(notFoundHandler);
  
  // Error handler (must be last)
  app.use(errorHandler);
  
  return app;
}
```

#### Middleware Patterns
```typescript
// auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwtSecret) as AuthRequest['user'];
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    
    const hasRole = roles.some(role => req.user!.roles.includes(role));
    if (!hasRole) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }
    
    next();
  };
};

// validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../errors';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: Record<string, string[]> = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (!details[path]) details[path] = [];
          details[path].push(err.message);
        });
        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

// error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError && { details: err.details })
      }
    });
    return;
  }
  
  // Unknown error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred'
        : err.message
    }
  });
};
```

#### Controller Pattern
```typescript
// user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

export class UserController {
  constructor(private userService: UserService) {}
  
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query;
    
    const result = await this.userService.findAll({
      page: Number(page),
      limit: Math.min(Number(limit), 100),
      sort: String(sort),
      order: order as 'asc' | 'desc'
    });
    
    res.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    });
  });
  
  getById = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.findById(req.params.id);
    res.json({ success: true, data: user });
  });
  
  create = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.create(req.body);
    res.status(201).json({ success: true, data: user });
  });
  
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await this.userService.update(req.params.id, req.body);
    res.json({ success: true, data: user });
  });
  
  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.userService.delete(req.params.id);
    res.status(204).send();
  });
}

// async-handler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### 3. NestJS Architecture

#### Module Structure
```typescript
// users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService]
})
export class UsersModule {}
```

#### Controller with Decorators
```typescript
// users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User
  ) {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
  }
}
```

#### Service with Repository
```typescript
// users/users.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserCreatedEvent } from './events/user-created.event';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<User>> {
    return this.usersRepository.findAll(query);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword
    });

    this.eventEmitter.emit('user.created', new UserCreatedEvent(user));

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<User> {
    const user = await this.findById(id);
    
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.usersRepository.update(id, updateUserDto);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.usersRepository.delete(id);
  }
}
```

#### Guards and Interceptors
```typescript
// auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

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

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}

// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({
        success: true,
        data,
        ...(data?.meta && { meta: data.meta })
      }))
    );
  }
}

// common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        this.logger.log(`${method} ${url} ${statusCode} - ${Date.now() - now}ms`);
      })
    );
  }
}
```

### 4. Database Integration

#### Prisma Setup
```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase is not allowed in production');
    }
    // Clean in correct order due to foreign keys
    await this.orderItem.deleteMany();
    await this.order.deleteMany();
    await this.user.deleteMany();
  }
}

// users/users.repository.ts (Prisma version)
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { [sort]: order },
      }),
      this.prisma.user.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
```

### 5. Performance Optimization

#### Worker Threads for CPU-Intensive Tasks
```typescript
// utils/worker-pool.ts
import { Worker } from 'worker_threads';
import { cpus } from 'os';

interface Task<T, R> {
  data: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
}

export class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private freeWorkers: Worker[] = [];
  private taskQueue: Task<T, R>[] = [];

  constructor(
    private workerScript: string,
    private poolSize: number = cpus().length
  ) {
    for (let i = 0; i < this.poolSize; i++) {
      this.addWorker();
    }
  }

  private addWorker(): void {
    const worker = new Worker(this.workerScript);
    
    worker.on('message', (result: R) => {
      const task = this.taskQueue.shift();
      if (task) {
        this.runTask(worker, task);
      } else {
        this.freeWorkers.push(worker);
      }
    });
    
    worker.on('error', (error) => {
      console.error('Worker error:', error);
      // Replace failed worker
      this.workers = this.workers.filter(w => w !== worker);
      this.addWorker();
    });
    
    this.workers.push(worker);
    this.freeWorkers.push(worker);
  }

  private runTask(worker: Worker, task: Task<T, R>): void {
    worker.postMessage(task.data);
    worker.once('message', task.resolve);
    worker.once('error', task.reject);
  }

  async execute(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const task: Task<T, R> = { data, resolve, reject };
      
      const worker = this.freeWorkers.pop();
      if (worker) {
        this.runTask(worker, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  async destroy(): Promise<void> {
    await Promise.all(this.workers.map(w => w.terminate()));
  }
}
```

#### Caching with Redis
```typescript
// cache/cache.service.ts
import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService {
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({ url: process.env.REDIS_URL });
    await this.client.connect();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}

// Decorator for caching
export function Cacheable(keyPrefix: string, ttlSeconds: number = 3600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService = this.cacheService as CacheService;
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      await cacheService.set(cacheKey, result, ttlSeconds);
      return result;
    };

    return descriptor;
  };
}
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @backend-specialist | Node.js/TypeScript backend needed |
| @code-architect | Node.js architecture design |
| @coordinator | Direct Node.js request |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @devops-specialist | CI/CD pipeline setup |
| @container-specialist | Docker containerization |
| @database-specialist | Database design |

---

## 📝 Framework Selection Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                  Node.js Framework Selection                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Express.js:                                                     │
│  ├── Small to medium APIs                                       │
│  ├── Maximum flexibility needed                                 │
│  ├── Quick prototypes                                           │
│  ├── Existing Express expertise                                 │
│  └── Minimal boilerplate preferred                              │
│                                                                  │
│  NestJS:                                                         │
│  ├── Enterprise applications                                     │
│  ├── Large teams                                                 │
│  ├── Strong typing throughout                                   │
│  ├── Microservices architecture                                 │
│  ├── Angular-like structure familiar                            │
│  └── Built-in testing support                                   │
│                                                                  │
│  Fastify:                                                        │
│  ├── High performance critical                                  │
│  ├── Schema-based validation                                    │
│  └── JSON serialization heavy                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Related Skills

- [express-patterns.skill.md](../skills/express-patterns.skill.md)
- [nestjs-patterns.skill.md](../skills/nestjs-patterns.skill.md)
- [node-performance.skill.md](../skills/node-performance.skill.md)

---

## 🏷️ Tags

`nodejs` `express` `nestjs` `typescript` `backend` `api` `rest` `microservices` `prisma`
