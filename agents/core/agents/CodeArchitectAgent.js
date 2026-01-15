import { BaseAgent } from '../BaseAgent.js';
import { AGENT_SPECIFICATIONS } from '../AgentSpecifications.js';

/**
 * Code Architect Agent - Code Architecture Design
 * 
 * Responsibilities:
 * - Design code-level architecture and structure
 * - Identify and recommend design patterns
 * - Design API contracts and interfaces
 * - Plan code organization and module structure
 * - Define coding standards and conventions
 * - Design data models and entities
 * - Create class diagrams and relationships
 * - Plan testing strategy
 */
export class CodeArchitectAgent extends BaseAgent {
  constructor(options = {}) {
    const codeArchitectSpec = AGENT_SPECIFICATIONS.find(s => s.id === 'code-architect');
    
    super(codeArchitectSpec, {
      timeout: 50000,
      maxRetries: 2,
      ...options
    });

    this.designCache = new Map();
    this.designPatterns = this._initializeDesignPatterns();
    this.codingStandards = this._initializeCodingStandards();
  }

  /**
   * Initialize code architect - setup design frameworks
   */
  async _onInitialize() {
    console.log('[CodeArchitect] Initializing Code Architect...');
    this._setupDesignFramework();
  }

  /**
   * Core execution - design code architecture
   */
  async _onExecute(input, context, executionId) {
    console.log(`[CodeArchitect] Designing code architecture: ${executionId}`);

    try {
      // Validate input
      const requirements = this._validateCodeInput(input);
      
      // Analyze requirements
      const analysis = this._analyzeRequirements(requirements);
      
      // Design code architecture
      const design = {
        id: executionId,
        title: `Code Architecture: ${requirements.title || 'System Code Design'}`,
        executionId,
        analysis,
        codeStructure: this._designCodeStructure(analysis, requirements),
        modules: this._defineModules(analysis, requirements),
        entities: this._designDataModels(requirements),
        apiDesign: this._designAPIs(requirements),
        designPatterns: this._selectDesignPatterns(analysis),
        classHierarchy: this._designClassHierarchy(requirements),
        layeredStructure: this._designLayeredStructure(analysis),
        dependencies: this._planDependencies(analysis),
        codingStandards: this._defineCodingStandards(requirements),
        errorHandling: this._designErrorHandling(analysis),
        loggingStrategy: this._planLogging(analysis),
        testingStrategy: this._planTesting(analysis),
        performanceConsiderations: this._identifyPerformanceIssues(analysis),
        securityConsiderations: this._identifySecurityIssues(requirements),
        scalabilityPatterns: this._identifyScalabilityPatterns(analysis),
        migrations: this._planMigrations(requirements),
        recommendations: this._generateRecommendations(analysis),
        codeExamples: this._generateCodeExamples(analysis),
        metadata: {
          createdAt: new Date().toISOString(),
          executionId,
          version: '1.0.0',
          framework: 'Enterprise Code Architecture'
        }
      };

      // Cache design
      this.designCache.set(executionId, design);

      this.emit('code-architecture-designed', {
        executionId,
        moduleCount: design.modules.length,
        patternCount: design.designPatterns.length,
        entityCount: design.entities.length,
        apiCount: design.apiDesign.endpoints.length,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        executionId,
        design,
        status: 'designed',
        summary: {
          modules: design.modules.length,
          patterns: design.designPatterns.length,
          entities: design.entities.length,
          apis: design.apiDesign.endpoints.length,
          testCoverage: design.testingStrategy.targetCoverage
        }
      };

    } catch (error) {
      this.emit('code-design-failed', {
        executionId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Analyze requirements to understand code architecture needs
   */
  _analyzeRequirements(requirements) {
    return {
      complexity: this._assessCodeComplexity(requirements),
      scalability: this._assessScalability(requirements),
      maintainability: this._assessMaintainability(requirements),
      testability: this._assessTestability(requirements),
      performance: this._assessPerformanceNeeds(requirements),
      security: this._assessSecurityNeeds(requirements)
    };
  }

  /**
   * Design overall code structure
   */
  _designCodeStructure(analysis, requirements) {
    return {
      style: analysis.complexity === 'high' ? 'Layered + Modular' : 'Modular',
      topLevelDirs: [
        { name: 'src', purpose: 'Source code', structure: ['domain', 'application', 'infrastructure', 'presentation'] },
        { name: 'tests', purpose: 'Test suites', structure: ['unit', 'integration', 'e2e'] },
        { name: 'config', purpose: 'Configuration', structure: ['dev', 'staging', 'prod'] },
        { name: 'docs', purpose: 'Documentation', structure: ['api', 'architecture', 'guides'] },
        { name: 'scripts', purpose: 'Utility scripts', structure: ['build', 'deploy', 'seed'] }
      ],
      buildSystem: requirements.techStack?.includes('.NET') ? 'MSBuild' : 'npm/webpack',
      packageStructure: 'Monorepo or Microrepo depending on team size'
    };
  }

  /**
   * Define logical modules
   */
  _defineModules(analysis, requirements) {
    const modules = [
      {
        name: 'Authentication Module',
        purpose: 'User authentication and session management',
        exports: ['AuthService', 'TokenProvider', 'SessionManager'],
        dependencies: ['Database', 'Cache'],
        testStrategy: 'Unit + Integration'
      },
      {
        name: 'Authorization Module',
        purpose: 'Role and permission management',
        exports: ['RoleManager', 'PermissionValidator', 'AccessControl'],
        dependencies: ['Authentication', 'Database'],
        testStrategy: 'Unit + Integration'
      },
      {
        name: 'Domain Module',
        purpose: 'Core business logic and entities',
        exports: ['Entities', 'ValueObjects', 'Aggregates', 'DomainServices'],
        dependencies: [],
        testStrategy: 'Unit + Domain-Driven'
      },
      {
        name: 'Application Services',
        purpose: 'Use case orchestration',
        exports: ['CommandHandlers', 'QueryHandlers', 'EventHandlers'],
        dependencies: ['Domain', 'Infrastructure'],
        testStrategy: 'Unit + Integration'
      },
      {
        name: 'Infrastructure Module',
        purpose: 'External service integration',
        exports: ['Repositories', 'UnitOfWork', 'ExternalServiceClients'],
        dependencies: ['Domain'],
        testStrategy: 'Unit + Integration'
      },
      {
        name: 'Presentation Module',
        purpose: 'API endpoints and controllers',
        exports: ['Controllers', 'DTOs', 'Middleware'],
        dependencies: ['Application Services', 'Authentication'],
        testStrategy: 'Unit + E2E'
      },
      {
        name: 'Shared Utilities',
        purpose: 'Cross-cutting concerns',
        exports: ['Logger', 'DateUtils', 'StringUtils', 'Validators'],
        dependencies: [],
        testStrategy: 'Unit'
      }
    ];

    return modules;
  }

  /**
   * Design data models and entities
   */
  _designDataModels(requirements) {
    return [
      {
        name: 'User Entity',
        attributes: [
          { name: 'id', type: 'UUID', required: true, unique: true },
          { name: 'email', type: 'string', required: true, unique: true },
          { name: 'username', type: 'string', required: true },
          { name: 'passwordHash', type: 'string', required: true },
          { name: 'roles', type: 'Role[]', required: false },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: 'datetime', required: true },
          { name: 'updatedAt', type: 'datetime', required: true }
        ],
        relationships: ['User > Profile (1:1)', 'User > Roles (M:N)', 'User > Audit (1:N)'],
        validations: ['Email unique and valid', 'Password strength minimum 8 chars']
      },
      {
        name: 'Product Entity',
        attributes: [
          { name: 'id', type: 'UUID', required: true },
          { name: 'name', type: 'string', required: true },
          { name: 'description', type: 'string', required: false },
          { name: 'price', type: 'decimal', required: true },
          { name: 'stock', type: 'integer', required: true, default: 0 },
          { name: 'category', type: 'string', required: true },
          { name: 'status', type: 'enum', values: ['active', 'inactive', 'archived'] },
          { name: 'createdAt', type: 'datetime', required: true }
        ],
        relationships: ['Product > Category (N:1)', 'Product > Reviews (1:N)'],
        validations: ['Price >= 0', 'Stock >= 0', 'Name length 3-255']
      },
      {
        name: 'Order Entity',
        attributes: [
          { name: 'id', type: 'UUID', required: true },
          { name: 'userId', type: 'UUID', required: true },
          { name: 'items', type: 'OrderItem[]', required: true },
          { name: 'total', type: 'decimal', required: true },
          { name: 'status', type: 'enum', values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
          { name: 'createdAt', type: 'datetime', required: true }
        ],
        relationships: ['Order > User (N:1)', 'Order > OrderItems (1:N)', 'Order > Payments (1:N)'],
        validations: ['User exists', 'At least one item', 'Total >= sum of items']
      }
    ];
  }

  /**
   * Design API contracts
   */
  _designAPIs(requirements) {
    return {
      endpoints: [
        {
          path: '/api/v1/auth/register',
          method: 'POST',
          description: 'Register new user',
          request: { email: 'string', password: 'string', username: 'string' },
          response: { userId: 'UUID', token: 'string' },
          statusCodes: [201, 400, 409],
          authentication: 'None'
        },
        {
          path: '/api/v1/auth/login',
          method: 'POST',
          description: 'User login',
          request: { email: 'string', password: 'string' },
          response: { token: 'string', expiresIn: 'number' },
          statusCodes: [200, 401, 404],
          authentication: 'None'
        },
        {
          path: '/api/v1/users/:id',
          method: 'GET',
          description: 'Get user profile',
          request: {},
          response: { id: 'UUID', email: 'string', username: 'string', roles: 'string[]' },
          statusCodes: [200, 404],
          authentication: 'Bearer Token'
        },
        {
          path: '/api/v1/products',
          method: 'GET',
          description: 'List products with pagination',
          request: { page: 'number', limit: 'number', category: 'string' },
          response: { items: 'Product[]', total: 'number', page: 'number' },
          statusCodes: [200, 400],
          authentication: 'Optional'
        },
        {
          path: '/api/v1/orders',
          method: 'POST',
          description: 'Create order',
          request: { items: 'OrderItem[]', shippingAddress: 'string' },
          response: { orderId: 'UUID', status: 'string' },
          statusCodes: [201, 400, 401],
          authentication: 'Bearer Token'
        }
      ],
      versioningStrategy: 'URL path versioning (v1, v2, etc.)',
      rateLimiting: 'Token bucket - 100 requests/minute per user',
      cachingStrategy: 'HTTP cache headers + distributed cache',
      errorFormat: {
        success: false,
        error: { code: 'string', message: 'string', timestamp: 'ISO8601' }
      }
    };
  }

  /**
   * Select and recommend design patterns
   */
  _selectDesignPatterns(analysis) {
    return [
      {
        pattern: 'Repository Pattern',
        purpose: 'Abstract data access layer',
        benefits: ['Decoupling', 'Testability', 'Flexibility'],
        implementation: 'GenericRepository<T> with IQueryable support'
      },
      {
        pattern: 'Dependency Injection',
        purpose: 'Manage object dependencies',
        benefits: ['Loose coupling', 'Testing', 'Flexibility'],
        implementation: 'Constructor injection with IoC container'
      },
      {
        pattern: 'Service Locator (selective)',
        purpose: 'Late binding for specific scenarios',
        benefits: ['Dynamic loading', 'Plugin architecture'],
        tradeoffs: ['Hidden dependencies', 'Harder testing']
      },
      {
        pattern: 'Factory Pattern',
        purpose: 'Object creation abstraction',
        benefits: ['Decoupling', 'Flexibility'],
        implementation: 'Factory<T> for complex object creation'
      },
      {
        pattern: 'Strategy Pattern',
        purpose: 'Interchangeable algorithms',
        benefits: ['Flexibility', 'Runtime selection'],
        implementation: 'IPaymentStrategy for payment methods'
      },
      {
        pattern: 'Observer Pattern',
        purpose: 'Event notification system',
        benefits: ['Decoupling', 'Real-time updates'],
        implementation: 'Event handlers and publishers'
      },
      {
        pattern: 'Command Pattern',
        purpose: 'Encapsulate requests as objects',
        benefits: ['Undo/Redo', 'Queuing', 'Logging'],
        implementation: 'ICommand interface with handlers'
      },
      {
        pattern: 'Mediator Pattern',
        purpose: 'Centralize complex communications',
        benefits: ['Decoupling', 'Centralized control'],
        implementation: 'CQRS with MediatR or similar'
      }
    ];
  }

  /**
   * Design class hierarchy and relationships
   */
  _designClassHierarchy(requirements) {
    return {
      baseClasses: [
        {
          name: 'BaseEntity',
          properties: ['Id', 'CreatedAt', 'UpdatedAt', 'IsDeleted'],
          methods: ['Equals', 'GetHashCode'],
          purpose: 'Base for all domain entities'
        },
        {
          name: 'BaseService',
          methods: ['Logger', 'ErrorHandler', 'Validation'],
          purpose: 'Base for all services'
        },
        {
          name: 'BaseRepository<T>',
          methods: ['Add', 'Update', 'Delete', 'GetById', 'GetAll'],
          purpose: 'Base data access'
        }
      ],
      interfaces: [
        { name: 'IRepository<T>', purpose: 'Data access contract' },
        { name: 'IService<T>', purpose: 'Business logic contract' },
        { name: 'IUnitOfWork', purpose: 'Transaction management' },
        { name: 'IValidator<T>', purpose: 'Validation rules' },
        { name: 'ILogger', purpose: 'Logging abstraction' },
        { name: 'ICache', purpose: 'Caching abstraction' }
      ],
      abstractClasses: [
        { name: 'AggregateRoot', purpose: 'DDD aggregate root' },
        { name: 'ValueObject', purpose: 'DDD value object' },
        { name: 'CommandHandler<T>', purpose: 'CQRS command handling' }
      ]
    };
  }

  /**
   * Design layered structure
   */
  _designLayeredStructure(analysis) {
    return {
      layers: [
        {
          layer: 'Domain Layer',
          responsibility: 'Core business logic and rules',
          contents: ['Entities', 'ValueObjects', 'Aggregates', 'DomainServices', 'Specifications'],
          dependencies: [],
          testStrategy: 'Unit tests (100% coverage)'
        },
        {
          layer: 'Application Layer',
          responsibility: 'Use case orchestration and workflows',
          contents: ['CommandHandlers', 'QueryHandlers', 'ApplicationServices', 'DTOs'],
          dependencies: ['Domain'],
          testStrategy: 'Unit + Integration tests'
        },
        {
          layer: 'Infrastructure Layer',
          responsibility: 'External service integration and persistence',
          contents: ['Repositories', 'DataContext', 'ExternalServiceClients', 'Mappers'],
          dependencies: ['Domain', 'Application'],
          testStrategy: 'Unit + Integration tests'
        },
        {
          layer: 'Presentation Layer',
          responsibility: 'API endpoints and request handling',
          contents: ['Controllers', 'ApiModels', 'Middleware', 'Filters'],
          dependencies: ['Application'],
          testStrategy: 'Unit + E2E tests'
        }
      ],
      crossCuttingConcerns: [
        'Logging',
        'Error Handling',
        'Validation',
        'Caching',
        'Security',
        'Performance Monitoring'
      ]
    };
  }

  /**
   * Plan dependencies and versioning
   */
  _planDependencies(analysis) {
    return {
      externalDependencies: [
        { name: 'Entity Framework Core', version: '7.0+', purpose: 'ORM' },
        { name: 'AutoMapper', version: '12.0+', purpose: 'DTO mapping' },
        { name: 'FluentValidation', version: '11.0+', purpose: 'Validation' },
        { name: 'Serilog', version: '3.0+', purpose: 'Structured logging' },
        { name: 'MediatR', version: '12.0+', purpose: 'CQRS mediator' }
      ],
      versioningStrategy: 'Semantic versioning (major.minor.patch)',
      dependencyManagement: 'Centralized version control in package file',
      vulnerabilityScanning: 'Automated scanning with each build'
    };
  }

  /**
   * Define coding standards
   */
  _defineCodingStandards(requirements) {
    return {
      namingConventions: {
        classes: 'PascalCase',
        methods: 'PascalCase',
        properties: 'PascalCase',
        variables: 'camelCase',
        constants: 'UPPER_SNAKE_CASE',
        privateMembers: '_camelCase'
      },
      fileOrganization: {
        onePublicClassPerFile: true,
        fileNameMatchesClassName: true,
        logicalGroupingByFeature: true
      },
      codeStyle: {
        indentation: 'Spaces (2 or 4)',
        lineLength: '120 characters max',
        blankLines: 'Between methods and logical sections'
      },
      documentation: {
        xmlComments: 'Public APIs only',
        commentingApproach: 'Why, not what',
        minimumCoverage: '80%'
      },
      bestPractices: [
        'Fail fast with validation',
        'Explicit error handling',
        'SOLID principles adherence',
        'DRY (Don\'t Repeat Yourself)',
        'Single Responsibility Principle'
      ]
    };
  }

  /**
   * Design error handling strategy
   */
  _designErrorHandling(analysis) {
    return {
      strategy: 'Layered error handling with custom exceptions',
      customExceptions: [
        { name: 'ValidationException', layer: 'Domain', httpStatus: 400 },
        { name: 'BusinessRuleException', layer: 'Domain', httpStatus: 422 },
        { name: 'NotFoundException', layer: 'Application', httpStatus: 404 },
        { name: 'UnauthorizedException', layer: 'Application', httpStatus: 401 },
        { name: 'ForbiddenException', layer: 'Application', httpStatus: 403 }
      ],
      globalErrorHandler: 'Middleware for consistent error responses',
      loggingRequirement: 'All errors must be logged with context',
      userMessages: 'Safe error messages to clients'
    };
  }

  /**
   * Plan logging strategy
   */
  _planLogging(analysis) {
    return {
      framework: 'Structured logging (Serilog)',
      levels: ['Debug', 'Information', 'Warning', 'Error', 'Fatal'],
      events: [
        'Method entry/exit (Debug)',
        'Business operations (Information)',
        'Warnings (Warning)',
        'Errors (Error)',
        'Critical failures (Fatal)'
      ],
      contextInformation: [
        'Correlation ID',
        'User ID',
        'Operation duration',
        'Exception details',
        'Request/Response payloads'
      ],
      retention: '30 days for logs, 1 year for audit trails'
    };
  }

  /**
   * Plan testing strategy
   */
  _planTesting(analysis) {
    return {
      targetCoverage: '80%+',
      pyramid: {
        unit: { percentage: 70, framework: 'xUnit or NUnit' },
        integration: { percentage: 20, framework: 'xUnit + TestContainers' },
        e2e: { percentage: 10, framework: 'Postman or Cypress' }
      },
      testingApproaches: [
        'Arrange-Act-Assert (AAA)',
        'Given-When-Then (BDD)',
        'Property-based testing for edge cases'
      ],
      mockingStrategy: 'Moq for interfaces, TestDoubles for entities',
      ciIntegration: 'Tests run on every commit'
    };
  }

  /**
   * Identify performance considerations
   */
  _identifyPerformanceIssues(analysis) {
    return [
      {
        issue: 'N+1 Query Problem',
        solution: 'Use eager loading with Include() or explicit joins',
        priority: 'High'
      },
      {
        issue: 'Large object allocations',
        solution: 'Use object pooling for frequently created objects',
        priority: 'Medium'
      },
      {
        issue: 'Inefficient algorithm complexity',
        solution: 'Profile and optimize hot paths, use appropriate data structures',
        priority: 'High'
      },
      {
        issue: 'Excessive database calls',
        solution: 'Batch operations, use caching, reduce roundtrips',
        priority: 'High'
      },
      {
        issue: 'Memory leaks',
        solution: 'Proper IDisposable implementation, event handler cleanup',
        priority: 'Critical'
      }
    ];
  }

  /**
   * Identify security considerations
   */
  _identifySecurityIssues(requirements) {
    return [
      {
        issue: 'SQL Injection',
        solution: 'Use parameterized queries (EF Core handles this)',
        mitigation: 'Input validation, least privilege database user'
      },
      {
        issue: 'Cross-Site Scripting (XSS)',
        solution: 'Output encoding, CSP headers',
        mitigation: 'Input validation, safe HTML rendering'
      },
      {
        issue: 'CSRF Attacks',
        solution: 'Anti-CSRF tokens in POST requests',
        mitigation: 'SameSite cookie attributes'
      },
      {
        issue: 'Sensitive Data Exposure',
        solution: 'Encryption at rest and in transit',
        mitigation: 'Data classification, access controls'
      },
      {
        issue: 'Broken Authentication',
        solution: 'Strong password policies, MFA, secure token handling',
        mitigation: 'OAuth 2.0, JWT with secure claims'
      }
    ];
  }

  /**
   * Identify scalability patterns
   */
  _identifyScalabilityPatterns(analysis) {
    return [
      { pattern: 'Caching layers', description: 'Redis for session and query caching' },
      { pattern: 'Database indexing', description: 'Strategic indexes on frequently queried columns' },
      { pattern: 'Query optimization', description: 'Minimize data transfer and processing' },
      { pattern: 'Async/await', description: 'Non-blocking operations for I/O' },
      { pattern: 'Message queues', description: 'Decouple async operations' },
      { pattern: 'Database partitioning', description: 'Horizontal data scaling' }
    ];
  }

  /**
   * Plan migrations and upgrades
   */
  _planMigrations(requirements) {
    return {
      strategy: 'Database migration framework (EF Core Migrations)',
      versionControl: 'All migrations in source control',
      rollback: 'Every migration must support rollback',
      testing: 'Migrations tested in staging environment',
      downtime: 'Zero-downtime migrations preferred',
      versioning: 'Semantic versioning for database versions'
    };
  }

  /**
   * Get cached design
   */
  getDesign(executionId) {
    return this.designCache.get(executionId);
  }

  /**
   * List all cached designs
   */
  listDesigns() {
    return Array.from(this.designCache.entries()).map(([id, design]) => ({
      id,
      title: design.title,
      createdAt: design.metadata.createdAt,
      moduleCount: design.modules.length,
      patternCount: design.designPatterns.length
    }));
  }

  /**
   * Cleanup resources
   */
  async _onCleanup() {
    console.log('[CodeArchitect] Cleaning up Code Architect...');
    this.designCache.clear();
  }

  // ===== Private Helper Methods =====

  _setupDesignFramework() {
    // Setup design framework
  }

  _validateCodeInput(input) {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid code architecture input: must be an object');
    }
    if (!input.title && !input.requirements) {
      throw new Error('Code architecture input must have title or requirements');
    }
    return input;
  }

  _assessCodeComplexity(requirements) {
    const complexity = (requirements.entities?.length || 0) + 
                      (requirements.features?.length || 0) +
                      (requirements.integrations?.length || 0);
    return complexity > 15 ? 'high' : 'medium';
  }

  _assessScalability(requirements) {
    return requirements.expectedLoad?.includes('high') ? 'high' : 'medium';
  }

  _assessMaintainability(requirements) {
    return requirements.teamSize && requirements.teamSize > 5 ? 'critical' : 'important';
  }

  _assessTestability(requirements) {
    return 'critical'; // Always critical
  }

  _assessPerformanceNeeds(requirements) {
    return requirements.performance === 'critical' ? 'high' : 'medium';
  }

  _assessSecurityNeeds(requirements) {
    return requirements.security === 'high' || requirements.dataClassification === 'sensitive' ? 'high' : 'medium';
  }

  _generateRecommendations(analysis) {
    const recommendations = [];

    recommendations.push('Apply SOLID principles to all code');
    recommendations.push('Use dependency injection container for object management');
    recommendations.push('Implement comprehensive logging throughout application');
    recommendations.push('Achieve at least 80% code coverage with unit tests');
    recommendations.push('Use async/await for I/O operations');
    recommendations.push('Implement proper error handling with custom exceptions');
    recommendations.push('Use configuration management for environment-specific settings');

    if (analysis.complexity === 'high') {
      recommendations.push('Consider CQRS pattern for command and query separation');
      recommendations.push('Implement event sourcing for audit trail');
    }

    if (analysis.scalability === 'high') {
      recommendations.push('Implement caching strategy at multiple levels');
      recommendations.push('Use async message processing for heavy operations');
    }

    return recommendations;
  }

  _generateCodeExamples(analysis) {
    return [
      {
        pattern: 'Repository Pattern',
        language: 'C#',
        code: `public interface IRepository<T> where T : BaseEntity {
  Task<T> GetByIdAsync(Guid id);
  Task<IEnumerable<T>> GetAllAsync();
  Task AddAsync(T entity);
  Task UpdateAsync(T entity);
  Task DeleteAsync(T entity);
}`
      },
      {
        pattern: 'Service with DI',
        language: 'C#',
        code: `public class UserService : IUserService {
  private readonly IRepository<User> _userRepository;
  private readonly ILogger<UserService> _logger;
  
  public UserService(IRepository<User> userRepository, ILogger<UserService> logger) {
    _userRepository = userRepository;
    _logger = logger;
  }
  
  public async Task<UserDto> GetUserAsync(Guid id) {
    var user = await _userRepository.GetByIdAsync(id);
    return user != null ? MapToDto(user) : null;
  }
}`
      }
    ];
  }

  _initializeDesignPatterns() {
    return [
      'Repository',
      'Factory',
      'Strategy',
      'Observer',
      'Command',
      'Mediator',
      'Decorator',
      'Adapter'
    ];
  }

  _initializeCodingStandards() {
    return {
      language: 'C#',
      framework: '.NET Core',
      conventions: 'Microsoft C# Coding Conventions'
    };
  }
}
