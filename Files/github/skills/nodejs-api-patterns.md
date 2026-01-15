# Skill: Node.js API Patterns (@nodejs-api-patterns)

## Metadata

```yaml
name: nodejs-api-patterns
agents: ["@nodejs-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Node.js API Patterns** skill provides proven patterns for building REST APIs with Express and Fastify frameworks, covering routing, middleware, validation, error handling, and database integration.

## Scope

**Included**:
- Express and Fastify routing
- Middleware implementation
- Request validation
- Async error handling
- Database connection patterns
- JSON response formatting
- Controller and service patterns
- API documentation

**Excluded**:
- GraphQL patterns
- WebSocket implementation
- gRPC services
- Message queues

## Core Pattern 1: Express Router Setup

```javascript
// src/routes/users.js
const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUser } = require('../middleware/validation');

// GET /api/users
router.get('/', authenticate, userController.listUsers);

// GET /api/users/:id
router.get('/:id', authenticate, userController.getUser);

// POST /api/users
router.post(
    '/',
    authenticate,
    authorize('admin'),
    validateUser,
    userController.createUser
);

// PUT /api/users/:id
router.put(
    '/:id',
    authenticate,
    validateUser,
    userController.updateUser
);

// DELETE /api/users/:id
router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    userController.deleteUser
);

module.exports = router;

// src/app.js
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(require('./middleware/logger'));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

module.exports = app;
```

## Core Pattern 2: Middleware Chains

```javascript
// src/middleware/logger.js
const logger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
        );
    });
    
    next();
};

module.exports = logger;

// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticate, authorize };

// src/middleware/validation.js
const { body, validationResult } = require('express-validator');

const validateUser = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).trim(),
    body('name').notEmpty().trim().escape(),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateUser };

// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation failed' });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
```

## Core Pattern 3: Async Error Handling

```javascript
// src/utils/asyncHandler.js
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;

// src/controllers/userController.js
const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

const listUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const users = await userService.listUsers(page, limit);
    
    res.json({
        success: true,
        data: users
    });
});

const getUser = asyncHandler(async (req, res) => {
    const user = await userService.getUser(req.params.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        success: true,
        data: user
    });
});

const createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);
    
    res.status(201).json({
        success: true,
        data: user
    });
});

module.exports = { listUsers, getUser, createUser };
```

## Core Pattern 4: Fastify Router

```javascript
// src/routes/users.js (Fastify)
async function userRoutes(fastify) {
    const userController = require('../controllers/userController');
    
    // GET /api/users
    fastify.get('/users', {
        onRequest: [fastify.authenticate],
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' }
                }
            }
        }
    }, userController.listUsers);
    
    // POST /api/users
    fastify.post('/users', {
        onRequest: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    name: { type: 'string' }
                }
            }
        }
    }, userController.createUser);
}

module.exports = userRoutes;

// src/app.js (Fastify)
const fastify = require('fastify')({
    logger: true
});

// Register plugins
fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET
});

fastify.decorate('authenticate', async function(request) {
    try {
        await request.jwtVerify();
    } catch (error) {
        throw fastify.httpErrors.unauthorized('Invalid token');
    }
});

// Register routes
fastify.register(require('./routes/users'));

module.exports = fastify;
```

## Core Pattern 5: Service Layer

```javascript
// src/services/userService.js
const db = require('../db');
const bcrypt = require('bcrypt');

class UserService {
    async listUsers(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        
        const users = await db.query(
            'SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        
        return users;
    }
    
    async getUser(id) {
        const [user] = await db.query(
            'SELECT id, email, name, created_at FROM users WHERE id = ?',
            [id]
        );
        
        return user;
    }
    
    async createUser(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        
        const result = await db.query(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            [data.email, hashedPassword, data.name]
        );
        
        return this.getUser(result.insertId);
    }
    
    async updateUser(id, data) {
        await db.query(
            'UPDATE users SET email = ?, name = ? WHERE id = ?',
            [data.email, data.name, id]
        );
        
        return this.getUser(id);
    }
    
    async deleteUser(id) {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
    }
}

module.exports = new UserService();
```

## Core Pattern 6: Database Connection

```javascript
// src/db/index.js
const mysql = require('mysql2/promise');

let pool;

async function initDb() {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    
    return pool;
}

async function query(sql, values) {
    const connection = await pool.getConnection();
    try {
        const [results] = await connection.execute(sql, values);
        return results;
    } finally {
        connection.release();
    }
}

async function closeDb() {
    if (pool) {
        await pool.end();
    }
}

module.exports = {
    initDb,
    query,
    closeDb
};

// src/server.js
const app = require('./app');
const db = require('./db');

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await db.initDb();
        console.log('Database connected');
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully');
    await db.closeDb();
    process.exit(0);
});
```

## Core Pattern 7: Request Pagination

```javascript
// src/utils/pagination.js
function getPaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 10);
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
}

function createPaginatedResponse(data, page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    
    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
}

module.exports = { getPaginationParams, createPaginatedResponse };

// Usage in controller
const asyncHandler = require('../utils/asyncHandler');
const { getPaginationParams, createPaginatedResponse } = require('../utils/pagination');
const userService = require('../services/userService');

const listUsers = asyncHandler(async (req, res) => {
    const { limit, offset } = getPaginationParams(req.query);
    
    const [users, [{ count }]] = await Promise.all([
        userService.listUsers(limit, offset),
        userService.countUsers()
    ]);
    
    res.json(createPaginatedResponse(users, req.query.page, limit, count));
});
```

## Core Pattern 8: Error Response Format

```javascript
// src/utils/errorResponse.js
class ApiError extends Error {
    constructor(message, statusCode, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}

function errorResponse(err) {
    const statusCode = err.statusCode || 500;
    const response = {
        success: false,
        error: {
            message: err.message,
            code: err.code || 'INTERNAL_ERROR'
        }
    };
    
    if (Object.keys(err.details || {}).length > 0) {
        response.error.details = err.details;
    }
    
    return { statusCode, response };
}

module.exports = { ApiError, errorResponse };

// Usage
const { ApiError } = require('../utils/errorResponse');

const getUser = asyncHandler(async (req, res) => {
    const user = await userService.getUser(req.params.id);
    
    if (!user) {
        throw new ApiError('User not found', 404, {
            userId: req.params.id
        });
    }
    
    res.json({ success: true, data: user });
});
```

## Anti-Patterns

### ❌ Unhandled Promise Rejections

```javascript
// BAD: No error handling
app.get('/users', async (req, res) => {
    const users = await userService.listUsers();
    res.json(users);
});

// GOOD: With error handling wrapper
const asyncHandler = require('./asyncHandler');

app.get('/users', asyncHandler(async (req, res) => {
    const users = await userService.listUsers();
    res.json(users);
}));
```

### ❌ Synchronous Middleware

```javascript
// BAD: Blocking I/O
app.use((req, res, next) => {
    const user = fs.readFileSync('./user.json');  // Blocks all requests
    next();
});

// GOOD: Async middleware
app.use(async (req, res, next) => {
    const user = await fs.promises.readFile('./user.json');
    next();
});
```

### ❌ Direct Database in Routes

```javascript
// BAD: No separation of concerns
app.get('/users/:id', async (req, res) => {
    const user = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(user);
});

// GOOD: Proper layering
app.get('/users/:id', asyncHandler(async (req, res) => {
    const user = await userService.getUser(req.params.id);
    res.json(user);
}));
```

## Schema Reference

- `nodejs-specialist.input.schema.json` - API requirements
- `nodejs-specialist.output.schema.json` - Response structure

## Related Documentation

- Skill: `nodejs-best-practices.md` - Performance and security
- Agent: `nodejs-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Node.js API patterns
