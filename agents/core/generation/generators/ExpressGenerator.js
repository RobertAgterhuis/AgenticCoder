/**
 * ExpressGenerator - Generates complete Express.js backend application code
 * 
 * Produces:
 * - Routes with validation
 * - Controllers with error handling
 * - Services with business logic
 * - Middleware (auth, validation, error handling)
 * - Models/Types
 * - Application entry points
 */

const BaseGenerator = require('./BaseGenerator');

class ExpressGenerator extends BaseGenerator {
  /**
   * @param {Object} templateRegistry - Template registry instance
   * @param {Object} promptComposer - Prompt composer instance
   */
  constructor(templateRegistry, promptComposer) {
    super('express', { framework: 'express', version: '4.x' });
    this.templateRegistry = templateRegistry;
    this.promptComposer = promptComposer;
  }

  /**
   * Check if this generator supports the given tech stack
   */
  supports(techStack) {
    const backend = techStack.backend;
    return backend && (
      backend.framework === 'express' ||
      backend.framework === 'node-express'
    );
  }

  /**
   * Priority - Express generator runs after React
   */
  get priority() {
    return 90;
  }

  /**
   * Generate all Express files for a project
   */
  async generate(context) {
    const files = [];
    const requirements = context.requirements;

    // Generate routes
    if (requirements.routes || requirements.entities) {
      const entities = requirements.entities || [];
      for (const entity of entities) {
        files.push(await this.generateRoute(context, entity));
      }
      files.push(await this.generateRouteIndex(context, entities));
    }

    // Generate controllers
    if (requirements.entities) {
      for (const entity of requirements.entities) {
        files.push(await this.generateController(context, entity));
      }
    }

    // Generate services
    if (requirements.entities) {
      for (const entity of requirements.entities) {
        files.push(await this.generateService(context, entity));
      }
    }

    // Generate models/types
    if (requirements.entities) {
      for (const entity of requirements.entities) {
        files.push(await this.generateModel(context, entity));
      }
      files.push(await this.generateModelsIndex(context, requirements.entities));
    }

    // Generate middleware
    files.push(await this.generateAuthMiddleware(context));
    files.push(await this.generateErrorMiddleware(context));
    files.push(await this.generateValidationMiddleware(context));
    files.push(await this.generateMiddlewareIndex(context));

    // Generate core application files
    files.push(await this.generateApp(context));
    files.push(await this.generateServer(context));
    files.push(await this.generateConfig(context));

    // Generate configuration files
    files.push(await this.generatePackageJson(context));
    files.push(await this.generateTsConfig(context));
    files.push(await this.generateEnvExample(context));

    return files;
  }

  /**
   * Generate a route file
   */
  async generateRoute(context, entity) {
    const name = this.toCamelCase(entity.name);
    const Name = this.toPascalCase(entity.name);
    const plural = entity.plural || `${name}s`;

    const content = `import { Router } from 'express';
import { ${Name}Controller } from '../controllers/${name}.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { ${name}Schema } from '../validators/${name}.validator';

const router = Router();
const controller = new ${Name}Controller();

/**
 * @route GET /api/${plural}
 * @desc Get all ${plural}
 */
router.get('/', authenticate, controller.getAll.bind(controller));

/**
 * @route GET /api/${plural}/:id
 * @desc Get ${name} by ID
 */
router.get('/:id', authenticate, controller.getById.bind(controller));

/**
 * @route POST /api/${plural}
 * @desc Create new ${name}
 */
router.post('/', authenticate, validate(${name}Schema.create), controller.create.bind(controller));

/**
 * @route PUT /api/${plural}/:id
 * @desc Update ${name}
 */
router.put('/:id', authenticate, validate(${name}Schema.update), controller.update.bind(controller));

/**
 * @route DELETE /api/${plural}/:id
 * @desc Delete ${name}
 */
router.delete('/:id', authenticate, controller.delete.bind(controller));

export default router;
`;
    return this.createFile(`backend/src/routes/${name}.routes.ts`, content, 'route');
  }

  /**
   * Generate routes index file
   */
  async generateRouteIndex(context, entities) {
    let imports = "import { Router } from 'express';\n";
    let mounts = '';

    entities.forEach(entity => {
      const name = this.toCamelCase(entity.name);
      const plural = entity.plural || `${name}s`;
      imports += `import ${name}Routes from './${name}.routes';\n`;
      mounts += `router.use('/${plural}', ${name}Routes);\n`;
    });

    const content = `${imports}
const router = Router();

${mounts}
export default router;
`;
    return this.createFile('backend/src/routes/index.ts', content, 'route');
  }

  /**
   * Generate a controller file
   */
  async generateController(context, entity) {
    const name = this.toCamelCase(entity.name);
    const Name = this.toPascalCase(entity.name);

    const content = `import { Request, Response, NextFunction } from 'express';
import { ${Name}Service } from '../services/${name}.service';
import { AppError } from '../middleware/error.middleware';

export class ${Name}Controller {
  private service: ${Name}Service;

  constructor() {
    this.service = new ${Name}Service();
  }

  /**
   * Get all ${name}s
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await this.service.findAll(req.query);
      res.json({ data: items });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ${name} by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await this.service.findById(req.params.id);
      if (!item) {
        throw new AppError('${Name} not found', 404);
      }
      res.json({ data: item });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new ${name}
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await this.service.create(req.body);
      res.status(201).json({ data: item });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ${name}
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await this.service.update(req.params.id, req.body);
      if (!item) {
        throw new AppError('${Name} not found', 404);
      }
      res.json({ data: item });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete ${name}
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
`;
    return this.createFile(`backend/src/controllers/${name}.controller.ts`, content, 'controller');
  }

  /**
   * Generate a service file
   */
  async generateService(context, entity) {
    const name = this.toCamelCase(entity.name);
    const Name = this.toPascalCase(entity.name);

    const content = `import { prisma } from '../config/database';
import { ${Name}, Create${Name}Input, Update${Name}Input } from '../models/${name}.model';

export class ${Name}Service {
  /**
   * Find all ${name}s
   */
  async findAll(filters: Record<string, any> = {}): Promise<${Name}[]> {
    const { page = 1, limit = 10, ...where } = filters;
    
    return prisma.${name}.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find ${name} by ID
   */
  async findById(id: string): Promise<${Name} | null> {
    return prisma.${name}.findUnique({
      where: { id },
    });
  }

  /**
   * Create new ${name}
   */
  async create(data: Create${Name}Input): Promise<${Name}> {
    return prisma.${name}.create({
      data,
    });
  }

  /**
   * Update ${name}
   */
  async update(id: string, data: Update${Name}Input): Promise<${Name} | null> {
    return prisma.${name}.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete ${name}
   */
  async delete(id: string): Promise<void> {
    await prisma.${name}.delete({
      where: { id },
    });
  }
}
`;
    return this.createFile(`backend/src/services/${name}.service.ts`, content, 'service');
  }

  /**
   * Generate a model/types file
   */
  async generateModel(context, entity) {
    const name = this.toCamelCase(entity.name);
    const Name = this.toPascalCase(entity.name);
    const fields = entity.fields || [];

    let fieldDefs = '';
    let createFields = '';
    let updateFields = '';

    fields.forEach(field => {
      const optional = field.required ? '' : '?';
      const createOptional = field.generated || !field.required ? '?' : '';
      fieldDefs += `  ${field.name}${optional}: ${field.type};\n`;
      if (!field.generated) {
        createFields += `  ${field.name}${createOptional}: ${field.type};\n`;
        updateFields += `  ${field.name}?: ${field.type};\n`;
      }
    });

    const content = `/**
 * ${Name} model types
 */

export interface ${Name} {
  id: string;
${fieldDefs}  createdAt: Date;
  updatedAt: Date;
}

export interface Create${Name}Input {
${createFields}}

export interface Update${Name}Input {
${updateFields}}
`;
    return this.createFile(`backend/src/models/${name}.model.ts`, content, 'model');
  }

  /**
   * Generate models index
   */
  async generateModelsIndex(context, entities) {
    let exports = '';
    entities.forEach(entity => {
      const name = this.toCamelCase(entity.name);
      exports += `export * from './${name}.model';\n`;
    });

    return this.createFile('backend/src/models/index.ts', exports, 'index');
  }

  /**
   * Generate auth middleware
   */
  async generateAuthMiddleware(context) {
    const content = `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';

interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add role-based authorization logic here
    next();
  };
}
`;
    return this.createFile('backend/src/middleware/auth.middleware.ts', content, 'middleware');
  }

  /**
   * Generate error middleware
   */
  async generateErrorMiddleware(context) {
    const content = `import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  console.error('Unexpected error:', err);
  
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    status: 'error',
    message: \`Route \${req.originalUrl} not found\`,
  });
}
`;
    return this.createFile('backend/src/middleware/error.middleware.ts', content, 'middleware');
  }

  /**
   * Generate validation middleware
   */
  async generateValidationMiddleware(context) {
    const content = `import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error.middleware';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(e => e.message).join(', ');
        return next(new AppError(\`Validation error: \${messages}\`, 400));
      }
      next(error);
    }
  };
}
`;
    return this.createFile('backend/src/middleware/validation.middleware.ts', content, 'middleware');
  }

  /**
   * Generate middleware index
   */
  async generateMiddlewareIndex(context) {
    const content = `export * from './auth.middleware';
export * from './error.middleware';
export * from './validation.middleware';
`;
    return this.createFile('backend/src/middleware/index.ts', content, 'index');
  }

  /**
   * Generate app.ts
   */
  async generateApp(context) {
    const content = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
`;
    return this.createFile('backend/src/app.ts', content, 'app');
  }

  /**
   * Generate server.ts
   */
  async generateServer(context) {
    const content = `import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('Database connected');

    // Start server
    app.listen(PORT, () => {
      console.log(\`Server running on port \${PORT}\`);
      console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
`;
    return this.createFile('backend/src/server.ts', content, 'entry');
  }

  /**
   * Generate config/database.ts
   */
  async generateConfig(context) {
    const content = `import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

export async function connectDatabase() {
  await prisma.$connect();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
`;
    return this.createFile('backend/src/config/database.ts', content, 'config');
  }

  /**
   * Generate package.json
   */
  async generatePackageJson(context) {
    const pkg = {
      name: `${this.toKebabCase(context.projectName)}-backend`,
      version: "0.1.0",
      main: "dist/server.js",
      scripts: {
        dev: "tsx watch src/server.ts",
        build: "tsc",
        start: "node dist/server.js",
        "db:generate": "prisma generate",
        "db:push": "prisma db push",
        "db:migrate": "prisma migrate dev",
        "db:seed": "tsx prisma/seed.ts",
        lint: "eslint src --ext .ts",
        test: "jest"
      },
      dependencies: {
        "@prisma/client": "^5.7.0",
        "compression": "^1.7.4",
        "cors": "^2.8.5",
        "dotenv": "^16.3.1",
        "express": "^4.18.2",
        "helmet": "^7.1.0",
        "jsonwebtoken": "^9.0.2",
        "zod": "^3.22.4"
      },
      devDependencies: {
        "@types/compression": "^1.7.5",
        "@types/cors": "^2.8.17",
        "@types/express": "^4.17.21",
        "@types/jsonwebtoken": "^9.0.5",
        "@types/node": "^20.10.4",
        "prisma": "^5.7.0",
        "tsx": "^4.6.2",
        "typescript": "^5.3.3"
      }
    };

    return this.createFile(
      'backend/package.json',
      JSON.stringify(pkg, null, 2),
      'config'
    );
  }

  /**
   * Generate tsconfig.json
   */
  async generateTsConfig(context) {
    const config = {
      compilerOptions: {
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        lib: ["ES2022"],
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"]
    };

    return this.createFile(
      'backend/tsconfig.json',
      JSON.stringify(config, null, 2),
      'config'
    );
  }

  /**
   * Generate .env.example
   */
  async generateEnvExample(context) {
    const content = `# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"

# Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
`;
    return this.createFile('backend/.env.example', content, 'config');
  }
}

module.exports = ExpressGenerator;
