# Express.js Patterns Skill

**Skill ID**: `express-patterns`  
**Version**: 1.0.0  
**Category**: Backend Patterns

---

## 📋 Overview

Comprehensive patterns for building production-ready Express.js APIs including middleware composition, routing strategies, error handling, and request validation.

---

## 🔧 Middleware Patterns

### 1. Middleware Chain Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Express Middleware Pipeline                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Request ──►                                                   │
│              ┌─────────┐                                        │
│              │ Logger  │  ──► Log request details               │
│              └────┬────┘                                        │
│                   ▼                                             │
│              ┌─────────┐                                        │
│              │ Parser  │  ──► Parse JSON/URL-encoded body       │
│              └────┬────┘                                        │
│                   ▼                                             │
│              ┌─────────┐                                        │
│              │Security │  ──► Helmet, CORS, Rate Limit          │
│              └────┬────┘                                        │
│                   ▼                                             │
│              ┌─────────┐                                        │
│              │  Auth   │  ──► JWT/Session validation            │
│              └────┬────┘                                        │
│                   ▼                                             │
│              ┌─────────┐                                        │
│              │Validate │  ──► Request validation                │
│              └────┬────┘                                        │
│                   ▼                                             │
│              ┌─────────┐                                        │
│              │ Route   │  ──► Business logic                    │
│              │ Handler │                                        │
│              └────┬────┘                                        │
│                   ▼                                             │
│              ┌─────────┐                                        │
│              │ Error   │  ──► Global error handling             │
│              │ Handler │                                        │
│              └─────────┘                                        │
│                   ▼                                             │
│              Response ◄──                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Custom Middleware Factory

```typescript
// middleware/factory.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Generic middleware factory
type AsyncHandler<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function createAsyncMiddleware<T extends Request = Request>(
  handler: AsyncHandler<T>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req as T, res, next)).catch(next);
  };
}

// Conditional middleware
export function conditionalMiddleware(
  condition: (req: Request) => boolean,
  middleware: RequestHandler
): RequestHandler {
  return (req, res, next) => {
    if (condition(req)) {
      return middleware(req, res, next);
    }
    next();
  };
}

// Middleware with options
interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const { windowMs, max, keyGenerator = (req) => req.ip || 'unknown' } = options;
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = requests.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      requests.set(key, record);
    }
    
    record.count++;
    
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', record.resetTime);
    
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests'
      });
    }
    
    next();
  };
}
```

### 3. Request Context Middleware

```typescript
// middleware/context.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  tenantId?: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function contextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const context: RequestContext = {
    requestId: req.headers['x-request-id'] as string || uuidv4(),
    startTime: Date.now()
  };
  
  res.setHeader('X-Request-ID', context.requestId);
  
  asyncLocalStorage.run(context, () => {
    next();
  });
}

// Helper to get current context
export function getContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

// Helper to update context
export function updateContext(updates: Partial<RequestContext>): void {
  const context = getContext();
  if (context) {
    Object.assign(context, updates);
  }
}
```

---

## 🛣️ Routing Patterns

### 1. Modular Router Structure

```typescript
// routes/v1/index.ts
import { Router } from 'express';
import userRoutes from './users';
import orderRoutes from './orders';
import productRoutes from './products';

const router = Router();

// Route modules
router.use('/users', userRoutes);
router.use('/orders', orderRoutes);
router.use('/products', productRoutes);

export default router;

// routes/v1/users.ts
import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createUserSchema, updateUserSchema } from '../../validators/user.validator';

const router = Router();
const controller = new UserController();

// Public routes
router.post('/', validate(createUserSchema), controller.create);
router.post('/login', controller.login);

// Protected routes
router.use(authenticate);
router.get('/', controller.getAll);
router.get('/me', controller.getCurrentUser);
router.get('/:id', controller.getById);
router.put('/:id', validate(updateUserSchema), controller.update);
router.delete('/:id', controller.delete);

export default router;
```

### 2. Resource-Based Routing

```typescript
// utils/resource-router.ts
import { Router, RequestHandler } from 'express';

interface ResourceOptions {
  middleware?: RequestHandler[];
  only?: ('index' | 'show' | 'create' | 'update' | 'destroy')[];
  except?: ('index' | 'show' | 'create' | 'update' | 'destroy')[];
}

interface ResourceController {
  index?: RequestHandler;
  show?: RequestHandler;
  create?: RequestHandler;
  update?: RequestHandler;
  destroy?: RequestHandler;
}

export function createResource(
  controller: ResourceController,
  options: ResourceOptions = {}
): Router {
  const router = Router();
  const { middleware = [], only, except } = options;
  
  const shouldInclude = (action: string): boolean => {
    if (only) return only.includes(action as any);
    if (except) return !except.includes(action as any);
    return true;
  };
  
  if (shouldInclude('index') && controller.index) {
    router.get('/', ...middleware, controller.index);
  }
  
  if (shouldInclude('create') && controller.create) {
    router.post('/', ...middleware, controller.create);
  }
  
  if (shouldInclude('show') && controller.show) {
    router.get('/:id', ...middleware, controller.show);
  }
  
  if (shouldInclude('update') && controller.update) {
    router.put('/:id', ...middleware, controller.update);
    router.patch('/:id', ...middleware, controller.update);
  }
  
  if (shouldInclude('destroy') && controller.destroy) {
    router.delete('/:id', ...middleware, controller.destroy);
  }
  
  return router;
}

// Usage
import { createResource } from '../utils/resource-router';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const controller = new UserController();
const userRouter = createResource(controller, {
  middleware: [authenticate],
  except: ['destroy']
});
```

### 3. Versioned API Pattern

```typescript
// routes/index.ts
import { Router, Application } from 'express';
import v1Routes from './v1';
import v2Routes from './v2';

export function setupRoutes(app: Application): void {
  // API versioning via URL path
  app.use('/api/v1', v1Routes);
  app.use('/api/v2', v2Routes);
  
  // Optional: header-based versioning
  app.use('/api', (req, res, next) => {
    const version = req.headers['api-version'] || 'v1';
    
    switch (version) {
      case 'v2':
        return v2Routes(req, res, next);
      default:
        return v1Routes(req, res, next);
    }
  });
}
```

---

## ✅ Validation Patterns

### 1. Zod Schema Validation

```typescript
// validators/user.validator.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain uppercase letter')
      .regex(/[a-z]/, 'Password must contain lowercase letter')
      .regex(/[0-9]/, 'Password must contain digit'),
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .transform(val => val.trim()),
    role: z.enum(['user', 'admin', 'moderator']).optional().default('user')
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID')
  }),
  body: z.object({
    email: z.string().email('Invalid email format').optional(),
    fullName: z.string().min(2).max(100).optional(),
    role: z.enum(['user', 'admin', 'moderator']).optional()
  })
});

export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['createdAt', 'email', 'fullName']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional()
  })
});

// Type inference
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>['query'];

// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      // Replace with parsed/transformed values
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (!details[path]) details[path] = [];
          details[path].push(err.message);
        });
        
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details
          }
        });
        return;
      }
      next(error);
    }
  };
}
```

### 2. Custom Validators

```typescript
// validators/custom.ts
import { z } from 'zod';

// Reusable validators
export const uuid = z.string().uuid();
export const email = z.string().email().toLowerCase();
export const password = z
  .string()
  .min(8)
  .regex(/[A-Z]/)
  .regex(/[a-z]/)
  .regex(/[0-9]/);

// Date range validator
export const dateRange = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date()
  })
  .refine(
    data => data.endDate >= data.startDate,
    { message: 'End date must be after start date' }
  );

// Pagination with cursor
export const cursorPagination = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  direction: z.enum(['forward', 'backward']).default('forward')
});

// File upload validator
export const fileUpload = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  mimetype: z.string().regex(/^image\/(jpeg|png|gif|webp)$/),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB')
});

// Conditional validation
export const conditionalAddress = z
  .object({
    hasAddress: z.boolean(),
    street: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional()
  })
  .refine(
    data => {
      if (data.hasAddress) {
        return data.street && data.city && data.zipCode;
      }
      return true;
    },
    { message: 'Address fields are required when hasAddress is true' }
  );
```

---

## 🚨 Error Handling Patterns

### 1. Custom Error Classes

```typescript
// errors/index.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details })
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
  }
}
```

### 2. Global Error Handler

```typescript
// middleware/error.middleware.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../errors';
import { logger } from '../utils/logger';
import { getContext } from './context';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const context = getContext();
  
  // Log error with context
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: context?.requestId,
    path: req.path,
    method: req.method,
    userId: context?.userId,
    body: sanitizeBody(req.body)
  });
  
  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.toJSON(),
      requestId: context?.requestId
    });
    return;
  }
  
  // Handle specific library errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid authentication token' },
      requestId: context?.requestId
    });
    return;
  }
  
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Authentication token has expired' },
      requestId: context?.requestId
    });
    return;
  }
  
  // Handle unknown errors
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'An unexpected error occurred' : err.message,
      ...(!isProd && { stack: err.stack })
    },
    requestId: context?.requestId
  });
};

function sanitizeBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
  const sanitized = { ...body as Record<string, unknown> };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
```

---

## 📊 Response Formatting

### 1. Standardized Response Helper

```typescript
// utils/response.ts
import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode: number = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data
    });
  }
  
  static created<T>(res: Response, data: T): Response {
    return this.success(res, data, 201);
  }
  
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
  
  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number
  ): Response {
    const totalPages = Math.ceil(total / limit);
    
    return res.json({
      success: true,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  }
  
  static cursor<T>(
    res: Response,
    items: T[],
    nextCursor: string | null,
    prevCursor: string | null
  ): Response {
    return res.json({
      success: true,
      data: items,
      meta: {
        nextCursor,
        prevCursor,
        hasMore: nextCursor !== null
      }
    });
  }
}

// Usage in controller
class UserController {
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as GetUsersQuery;
    const { items, total } = await this.userService.findAll({ page, limit });
    
    return ApiResponse.paginated(res, items, total, page, limit);
  });
  
  create = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.create(req.body);
    return ApiResponse.created(res, user);
  });
}
```

---

## 🔒 Security Middleware

### 1. Security Headers Setup

```typescript
// middleware/security.ts
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { Application } from 'express';

export function setupSecurity(app: Application): void {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
  
  // CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [];
      
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
  }));
  
  // Rate limiting
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    }
  }));
}
```

---

## 🏷️ Tags

`express` `middleware` `routing` `validation` `error-handling` `security` `patterns`
