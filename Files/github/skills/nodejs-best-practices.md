# Skill: Node.js Best Practices (@nodejs-best-practices)

## Metadata

```yaml
name: nodejs-best-practices
agents: ["@nodejs-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Node.js Best Practices** skill provides comprehensive guidance on building robust, scalable, and secure Node.js applications with emphasis on performance, testing, security, and production deployment.

## Scope

**Included**:
- Performance optimization (clustering, streams)
- Testing strategies (unit, integration, load testing)
- Security best practices (headers, validation, secrets)
- Error handling and logging
- Concurrency patterns
- Production deployment and monitoring
- Docker containerization
- Load balancing and scaling

**Excluded**:
- Framework-specific details (see api-patterns skill)
- Database implementation (see database skills)
- Frontend concerns (see frontend skills)

## Core Pattern 1: Cluster & Performance

```javascript
// cluster.js - Multi-process architecture
import cluster from 'cluster';
import os from 'os';
import express from 'express';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart
  });
} else {
  // Worker process
  const app = express();
  
  app.get('/', (req, res) => {
    res.json({ pid: process.pid });
  });
  
  app.listen(3000, () => {
    console.log(`Worker ${process.pid} listening`);
  });
}
```

## Core Pattern 2: Stream Processing

```javascript
// stream.js - Efficient memory usage
import fs from 'fs';
import { Transform } from 'stream';
import zlib from 'zlib';

// Large file processing with streams
const readStream = fs.createReadStream('large-file.txt');
const gzip = zlib.createGzip();
const writeStream = fs.createWriteStream('large-file.txt.gz');

readStream
  .pipe(gzip)
  .pipe(writeStream)
  .on('error', (err) => console.error('Stream error:', err));

// Custom transform stream
const uppercase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

fs.createReadStream('input.txt')
  .pipe(uppercase)
  .pipe(fs.createWriteStream('output.txt'));
```

## Core Pattern 3: Security Headers

```javascript
// security.js - Express middleware
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// CSRF protection
const csrfProtection = csrf({ cookie: false });
app.post('/form', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## Core Pattern 4: Error Handling

```javascript
// errorHandler.js - Centralized error handling
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async wrapper
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes
app.get('/user/:id', catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json(user);
}));

// Global error handler (must be last)
app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;
  
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

## Core Pattern 5: Logging & Monitoring

```javascript
// logger.js - Winston logging
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    ...(process.env.NODE_ENV !== 'production' && [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ])
  ]
});

// Express middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration
    });
  });
  next();
});
```

## Core Pattern 6: Input Validation

```javascript
// validation.js - Zod schema validation
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name too short'),
  age: z.number().int().min(18, 'Must be 18+'),
  role: z.enum(['user', 'admin']).optional()
});

app.post('/users', catchAsync(async (req, res) => {
  const validated = createUserSchema.parse(req.body);
  const user = await User.create(validated);
  res.status(201).json(user);
}));

// Error handling for validation
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      status: 'error',
      errors: err.flatten()
    });
  }
  next(err);
});
```

## Core Pattern 7: Testing Strategy

```javascript
// test/user.test.js - Vitest with Supertest
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';

describe('User API', () => {
  let testUser;
  
  beforeEach(async () => {
    await User.deleteMany();
    testUser = await User.create({
      email: 'test@example.com',
      name: 'Test User'
    });
  });
  
  afterEach(async () => {
    await User.deleteMany();
  });
  
  it('should get user by id', async () => {
    const res = await request(app)
      .get(`/users/${testUser._id}`);
    
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('test@example.com');
  });
  
  it('should create new user', async () => {
    const res = await request(app)
      .post('/users')
      .send({
        email: 'new@example.com',
        name: 'New User'
      });
    
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
  });
  
  it('should validate email format', async () => {
    const res = await request(app)
      .post('/users')
      .send({
        email: 'invalid-email',
        name: 'User'
      });
    
    expect(res.status).toBe(400);
  });
});
```

## Core Pattern 8: Docker Deployment

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

COPY --from=builder /app/dist ./dist

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node healthcheck.js

EXPOSE 3000
USER node

CMD ["node", "dist/server.js"]
```

## Core Pattern 9: Concurrency Management

```javascript
// concurrency.js - Promise control patterns
import pLimit from 'p-limit';

// Limit concurrent promises
const limit = pLimit(5); // Max 5 concurrent

const tasks = Array.from({ length: 100 }, (_, i) => 
  limit(() => processItem(i))
);

const results = await Promise.all(tasks);

// Worker queue pattern
import Queue from 'bull';

const emailQueue = new Queue('email', {
  redis: process.env.REDIS_URL
});

// Producer
emailQueue.add({ to: 'user@example.com' });

// Consumer
emailQueue.process(async (job) => {
  await sendEmail(job.data);
});

emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err);
});
```

## Anti-Patterns

### ❌ Synchronous Operations

```javascript
// BAD: Blocking event loop
const data = fs.readFileSync('huge-file.json');
app.get('/data', (req, res) => res.json(JSON.parse(data)));

// GOOD: Async/streaming
app.get('/data', async (req, res) => {
  const stream = fs.createReadStream('huge-file.json');
  res.setHeader('Content-Type', 'application/json');
  stream.pipe(res);
});
```

### ❌ Unhandled Promise Rejections

```javascript
// BAD: No error handling
app.get('/data', async (req, res) => {
  const data = await fetchData(); // Can reject!
  res.json(data);
});

// GOOD: Proper error handling
app.get('/data', catchAsync(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));
```

### ❌ Hardcoded Secrets

```javascript
// BAD: Secrets in code
const apiKey = 'sk-1234567890abcdef';

// GOOD: Use environment variables
const apiKey = process.env.API_KEY;
```

## Configuration Best Practices

```javascript
// config.js - Centralized configuration
export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  
  // Database
  db: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DB_POOL_SIZE) || 10
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL,
    ttl: parseInt(process.env.REDIS_TTL) || 3600
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET,
    corsOrigin: process.env.CORS_ORIGIN,
    trustProxy: process.env.TRUST_PROXY === 'true'
  },
  
  // Validation
  validate() {
    const required = ['DATABASE_URL', 'JWT_SECRET'];
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required env var: ${key}`);
      }
    }
  }
};

config.validate();
```

## Schema Reference

- `nodejs-specialist.input.schema.json` - Project requirements
- `nodejs-specialist.output.schema.json` - Generated API structure

## Related Documentation

- Skill: `nodejs-api-patterns.md` - API patterns and middleware
- Agent: `nodejs-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Node.js best practices
