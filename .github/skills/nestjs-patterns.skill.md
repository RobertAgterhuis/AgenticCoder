# NestJS Patterns Skill

**Skill ID**: `nestjs-patterns`  
**Version**: 1.0.0  
**Category**: Backend Patterns

---

## 📋 Overview

Comprehensive patterns for building enterprise-grade NestJS applications including modules, services, guards, interceptors, pipes, and microservices communication.

---

## 🏗️ Module Architecture

### 1. Module Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS Module Structure                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   AppModule (Root)                                               │
│   ├── ConfigModule (Global)                                     │
│   ├── DatabaseModule (Global)                                   │
│   ├── AuthModule                                                │
│   │   ├── AuthController                                        │
│   │   ├── AuthService                                           │
│   │   ├── JwtStrategy                                           │
│   │   └── Guards/                                               │
│   ├── UsersModule                                               │
│   │   ├── UsersController                                       │
│   │   ├── UsersService                                          │
│   │   ├── UsersRepository                                       │
│   │   └── Entities/DTOs                                         │
│   ├── OrdersModule                                              │
│   │   ├── OrdersController                                      │
│   │   ├── OrdersService                                         │
│   │   └── Events/                                               │
│   └── SharedModule                                              │
│       ├── Services/                                             │
│       ├── Pipes/                                                 │
│       └── Interceptors/                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Feature Module Pattern

```typescript
// users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';
import { UsersSubscriber } from './subscribers/users.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([User])
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersRepository,
    UsersSubscriber
  ],
  exports: [UsersService] // Export for use in other modules
})
export class UsersModule {}
```

### 3. Dynamic Module Pattern

```typescript
// config/config.module.ts
import { DynamicModule, Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

interface ConfigModuleOptions {
  envFilePath?: string;
  isGlobal?: boolean;
  validationSchema?: any;
}

@Module({})
export class ConfigModule {
  static forRoot(options: ConfigModuleOptions = {}): DynamicModule {
    const { envFilePath = '.env', isGlobal = true, validationSchema } = options;
    
    return {
      module: ConfigModule,
      global: isGlobal,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options
        },
        {
          provide: ConfigService,
          useFactory: () => {
            return new ConfigService(envFilePath, validationSchema);
          }
        }
      ],
      exports: [ConfigService]
    };
  }
  
  static forFeature(keys: string[]): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_KEYS',
          useValue: keys
        }
      ]
    };
  }
}
```

### 4. Async Module Pattern

```typescript
// database/database.module.ts
import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigService } from '../config/config.service';

@Module({})
export class DatabaseModule {
  static forRootAsync(): DynamicModule {
    return TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('DB_LOGGING') === 'true',
        ssl: configService.get('DB_SSL') === 'true' 
          ? { rejectUnauthorized: false } 
          : false
      })
    });
  }
}
```

---

## 🎮 Controller Patterns

### 1. RESTful Controller

```typescript
// users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
  SerializeOptions
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(TransformInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  async findAll(
    @Query() pagination: PaginationDto
  ): Promise<{ data: User[]; meta: any }> {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<User> {
    return this.usersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user (admin only)' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
```

### 2. Custom Decorators

```typescript
// auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;
    
    return data ? user?.[data] : user;
  }
);

// auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// common/decorators/api-paginated-response.decorator.ts
import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';

export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) }
              }
            }
          }
        ]
      }
    })
  );
};
```

---

## 🛡️ Guard Patterns

### 1. Authentication Guard

```typescript
// auth/guards/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException(
        info?.message || 'Authentication required'
      );
    }
    return user;
  }
}
```

### 2. Role-Based Guard

```typescript
// auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

### 3. Throttle Guard

```typescript
// common/guards/throttle.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';

interface ThrottleOptions {
  ttl: number;  // Time window in seconds
  limit: number; // Max requests in window
}

export const THROTTLE_KEY = 'throttle';
export const Throttle = (options: ThrottleOptions) => 
  SetMetadata(THROTTLE_KEY, options);

@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redis: Redis
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<ThrottleOptions>(
      THROTTLE_KEY,
      context.getHandler()
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);
    
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, options.ttl);
    }
    
    if (current > options.limit) {
      const ttl = await this.redis.ttl(key);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retryAfter: ttl
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private generateKey(request: any): string {
    const ip = request.ip || request.connection.remoteAddress;
    const path = request.route.path;
    return `throttle:${ip}:${path}`;
  }
}
```

---

## 🔄 Interceptor Patterns

### 1. Transform Interceptor

```typescript
// common/interceptors/transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        // Handle paginated responses
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return {
            success: true,
            data: data.data,
            meta: data.meta
          };
        }
        
        return {
          success: true,
          data
        };
      })
    );
  }
}
```

### 2. Logging Interceptor

```typescript
// common/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body } = request;
    
    const requestId = request.headers['x-request-id'] || uuidv4();
    request.requestId = requestId;
    response.setHeader('X-Request-ID', requestId);
    
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log({
          requestId,
          method,
          url,
          statusCode: response.statusCode,
          duration: `${duration}ms`,
          userId: request.user?.id
        });
      }),
      catchError(error => {
        const duration = Date.now() - startTime;
        this.logger.error({
          requestId,
          method,
          url,
          statusCode: error.status || 500,
          duration: `${duration}ms`,
          error: error.message,
          stack: error.stack
        });
        throw error;
      })
    );
  }
}
```

### 3. Cache Interceptor

```typescript
// common/interceptors/cache.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

export const CacheKey = (key: string) => SetMetadata(CACHE_KEY, key);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL, ttl);

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private redis: Redis
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    
    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const fullKey = this.buildKey(cacheKey, request);
    
    const cached = await this.redis.get(fullKey);
    if (cached) {
      return of(JSON.parse(cached));
    }

    const ttl = this.reflector.get<number>(CACHE_TTL, context.getHandler()) || 300;

    return next.handle().pipe(
      tap(async response => {
        await this.redis.setex(fullKey, ttl, JSON.stringify(response));
      })
    );
  }

  private buildKey(key: string, request: any): string {
    const params = JSON.stringify(request.params);
    const query = JSON.stringify(request.query);
    return `${key}:${params}:${query}`;
  }
}
```

---

## 🔧 Pipe Patterns

### 1. Validation Pipe Configuration

```typescript
// common/pipes/validation.pipe.ts
import {
  ValidationPipe,
  ValidationPipeOptions,
  BadRequestException
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

export const validationPipeOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true
  },
  exceptionFactory: (errors: ValidationError[]) => {
    const details = formatErrors(errors);
    return new BadRequestException({
      statusCode: 400,
      error: 'Validation Error',
      message: 'Input validation failed',
      details
    });
  }
};

function formatErrors(
  errors: ValidationError[],
  parentPath = ''
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const path = parentPath 
      ? `${parentPath}.${error.property}` 
      : error.property;

    if (error.constraints) {
      result[path] = Object.values(error.constraints);
    }

    if (error.children?.length) {
      Object.assign(result, formatErrors(error.children, path));
    }
  }

  return result;
}

// main.ts
app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
```

### 2. Custom Transform Pipes

```typescript
// common/pipes/parse-uuid.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!isUUID(value)) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} must be a valid UUID`
      );
    }
    return value;
  }
}

// common/pipes/parse-int-with-default.pipe.ts
@Injectable()
export class ParseIntWithDefaultPipe implements PipeTransform<string, number> {
  constructor(private readonly defaultValue: number) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? this.defaultValue : parsed;
  }
}

// Usage
@Get()
async findAll(
  @Query('page', new ParseIntWithDefaultPipe(1)) page: number,
  @Query('limit', new ParseIntWithDefaultPipe(20)) limit: number
) {
  // page and limit will have default values if not provided
}
```

---

## 📡 Event Patterns

### 1. Event Emitter Integration

```typescript
// events/events.module.ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true
    })
  ]
})
export class EventsModule {}

// users/events/user-created.event.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

// users/users.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEvent } from './events/user-created.event';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.usersRepository.create(createUserDto);
    
    this.eventEmitter.emit(
      'user.created',
      new UserCreatedEvent(user.id, user.email)
    );
    
    return user;
  }
}

// notifications/listeners/user.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../users/events/user-created.event';

@Injectable()
export class UserListener {
  @OnEvent('user.created')
  async handleUserCreated(event: UserCreatedEvent) {
    // Send welcome email
    console.log(`Sending welcome email to ${event.email}`);
  }

  @OnEvent('user.*')
  async handleAllUserEvents(event: any) {
    // Log all user events
    console.log('User event:', event);
  }
}
```

---

## 🧪 Testing Patterns

### 1. Unit Testing Services

```typescript
// users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  describe('create', () => {
    it('should create a user and emit event', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      const createdUser = {
        id: 'uuid',
        email: createUserDto.email,
        createdAt: new Date()
      };

      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(createdUser as any);

      const result = await service.create(createUserDto as any);

      expect(result).toEqual(createdUser);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'user.created',
        expect.any(Object)
      );
    });

    it('should throw ConflictException if email exists', async () => {
      repository.findByEmail.mockResolvedValue({ id: 'existing' } as any);

      await expect(
        service.create({ email: 'test@example.com' } as any)
      ).rejects.toThrow(ConflictException);
    });
  });
});
```

### 2. E2E Testing

```typescript
// test/users.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { validationPipeOptions } from '../src/common/pipes/validation.pipe';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
    await app.init();

    // Get auth token
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });
    authToken = authResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
    it('should create a user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          fullName: 'New User'
        })
        .expect(201)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe('newuser@test.com');
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({ email: 'invalid' })
        .expect(400);
    });
  });

  describe('GET /users/:id', () => {
    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });
});
```

---

## 🏷️ Tags

`nestjs` `modules` `controllers` `services` `guards` `interceptors` `pipes` `decorators` `testing` `events`
