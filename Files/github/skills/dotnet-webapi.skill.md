# .NET Web API Skill

## Overview
**Skill ID**: `dotnet-webapi`  
**Version**: 1.0  
**Domain**: ASP.NET Core Web API design and architecture  
**Phase**: 14 (@dotnet-specialist)  
**Maturity**: Production-Ready

.NET Web API skill covers ASP.NET Core controller patterns, routing, model binding, dependency injection, middleware, and REST API design principles for building scalable, maintainable web services.

---

## Core Concepts

### 1. Controller Architecture

**Definition**: Controllers handle HTTP requests and coordinate domain logic.

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    // Dependency injection via constructor
    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    // GET /api/users/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUserAsync(Guid id)
    {
        _logger.LogInformation("Getting user {UserId}", id);

        var user = await _userService.GetUserByIdAsync(id);
        if (user is null)
        {
            _logger.LogWarning("User not found: {UserId}", id);
            return NotFound();
        }

        return Ok(user);
    }

    // POST /api/users
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> CreateUserAsync([FromBody] CreateUserRequest request)
    {
        var user = await _userService.CreateUserAsync(request);
        return CreatedAtAction(nameof(GetUserAsync), new { id = user.Id }, user);
    }

    // PUT /api/users/{id}
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateUserAsync(Guid id, [FromBody] UpdateUserRequest request)
    {
        await _userService.UpdateUserAsync(id, request);
        return NoContent();
    }

    // DELETE /api/users/{id}
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUserAsync(Guid id)
    {
        await _userService.DeleteUserAsync(id);
        return NoContent();
    }
}
```

**Key Principles**:
- Single Responsibility: Handle HTTP concerns only
- Dependency Injection: Dependencies provided via constructor
- Async/Await: All I/O operations async
- Status Codes: Appropriate HTTP status codes (200, 201, 204, 400, 404, 500)
- Documentation: Attributes document responses

### 2. Routing Patterns

**Definition**: Map HTTP requests to controller actions.

```csharp
// Convention-based routing (deprecated, avoid)
app.MapDefaultControllerRoute(); // Maps to {controller=Home}/{action=Index}/{id?}

// Attribute-based routing (preferred)
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    // GET /api/products
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAllAsync() { }

    // GET /api/products/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductDto>> GetByIdAsync(Guid id) { }

    // POST /api/products
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateAsync([FromBody] CreateProductRequest request) { }

    // PUT /api/products/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] UpdateProductRequest request) { }

    // DELETE /api/products/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAsync(Guid id) { }

    // Custom routes
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> PublishAsync(Guid id) { }

    [HttpGet("by-category/{category}")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetByCategoryAsync(string category) { }
}

// Versioning
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class OrdersController : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetAsync() { }
}
```

**Best Practices**:
- ✅ Use `[Route("api/[controller]")]` for consistency
- ✅ Name actions descriptively: `GetUserAsync`, not `Get`
- ✅ Use route constraints: `{id:guid}`, `{pageNumber:int}`
- ✅ Implement versioning for breaking changes

### 3. Model Binding & Validation

**Definition**: Automatically convert HTTP data to .NET types with validation.

```csharp
// Request DTOs (Data Transfer Objects)
public class CreateUserRequest
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public required string Name { get; init; }

    [Required]
    [EmailAddress]
    public required string Email { get; init; }

    [Required]
    [StringLength(255, MinimumLength = 8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)")]
    public required string Password { get; init; }

    [Phone]
    public string? PhoneNumber { get; init; }
}

// Model binding sources
[ApiController]
[Route("api/[controller]")]
public class ExampleController : ControllerBase
{
    // [FromRoute] - from URL {id}
    [HttpGet("{id:guid}")]
    public ActionResult Get([FromRoute] Guid id) { }

    // [FromQuery] - from query string ?page=1&size=10
    [HttpGet]
    public ActionResult GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    { }

    // [FromBody] - from request body (implicit default for POST/PUT)
    [HttpPost]
    public ActionResult Create([FromBody] CreateUserRequest request) { }

    // [FromHeader] - from HTTP headers
    [HttpPost]
    public ActionResult CreateWithAuth(
        [FromHeader] string authorization,
        [FromBody] CreateUserRequest request)
    { }

    // Multiple sources
    [HttpPost("{userId:guid}/posts")]
    public ActionResult CreatePost(
        [FromRoute] Guid userId,
        [FromBody] CreatePostRequest request)
    { }
}

// Custom validation
public class UniqueEmailAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is not string email)
            return ValidationResult.Success;

        var dbContext = context.GetRequiredService<ApplicationDbContext>();
        var exists = dbContext.Users.Any(u => u.Email == email);

        return exists
            ? new ValidationResult("Email already exists", new[] { context.MemberName! })
            : ValidationResult.Success;
    }
}

public class CreateUserRequest
{
    [UniqueEmail]
    public required string Email { get; init; }
}
```

**Key Points**:
- ✅ Use `[Required]`, `[StringLength]`, `[EmailAddress]` attributes
- ✅ Custom validation attributes for domain rules
- ✅ DTOs for API contracts (never expose domain entities directly)
- ✅ `required` keyword (C# 11) ensures non-null
- ✅ `init` keyword prevents modification after creation

### 4. Dependency Injection Configuration

**Definition**: Register and resolve dependencies in ASP.NET Core.

```csharp
// Program.cs - Dependency Injection setup
var builder = WebApplication.CreateBuilder(args);

// Add services (dependency injection container)
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repository pattern (data access)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();

// Business logic services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();

// Transient (new instance every time)
builder.Services.AddTransient<IEmailSender, EmailSender>();

// Singleton (one instance for app lifetime)
builder.Services.AddSingleton<ICacheService, CacheService>();

// Options pattern (strongly-typed configuration)
builder.Services.Configure<ApiOptions>(builder.Configuration.GetSection("Api"));

// Logging
builder.Services.AddLogging(config =>
{
    config.ClearProviders();
    config.AddConsole();
    config.AddDebug();
});

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:SecretKey"]!))
        };
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWeb", builder =>
        builder.WithOrigins("https://example.com")
               .AllowAnyMethod()
               .AllowAnyHeader());
});

var app = builder.Build();

// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowWeb");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

**Lifetimes**:
- **Transient**: New instance per request (lightweight, stateless)
- **Scoped**: One instance per HTTP request (typical for DbContext)
- **Singleton**: One instance for app lifetime (cache, config)

### 5. Error Handling Middleware

**Definition**: Centralized exception handling and consistent error responses.

```csharp
// Custom exception class
public class BusinessException : Exception
{
    public string Code { get; }

    public BusinessException(string message, string code = "BUSINESS_ERROR")
        : base(message)
    {
        Code = code;
    }
}

public class ResourceNotFoundException : BusinessException
{
    public ResourceNotFoundException(string resource, Guid id)
        : base($"{resource} with ID {id} not found", "NOT_FOUND") { }
}

// Error response DTO
public class ErrorResponse
{
    public string Message { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? Details { get; set; }
    public Dictionary<string, string[]>? ValidationErrors { get; set; }
}

// Exception handling middleware
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception");
            await HandleExceptionAsync(context, exception);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse();

        switch (exception)
        {
            case ResourceNotFoundException ex:
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                response = new ErrorResponse
                {
                    Message = ex.Message,
                    Code = ex.Code
                };
                break;

            case ValidationException ex:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                response = new ErrorResponse
                {
                    Message = "Validation failed",
                    Code = "VALIDATION_ERROR",
                    ValidationErrors = ex.Errors
                        .GroupBy(e => e.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())
                };
                break;

            case BusinessException ex:
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                response = new ErrorResponse
                {
                    Message = ex.Message,
                    Code = ex.Code
                };
                break;

            default:
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                response = new ErrorResponse
                {
                    Message = "An unexpected error occurred",
                    Code = "INTERNAL_SERVER_ERROR"
                };
                break;
        }

        return context.Response.WriteAsJsonAsync(response);
    }
}

// Register in Program.cs
app.UseMiddleware<ExceptionHandlingMiddleware>();
```

### 6. Authentication & Authorization

**Definition**: Secure APIs with JWT authentication and role-based authorization.

```csharp
// JWT token generation
public interface ITokenService
{
    string GenerateToken(User user);
}

public class JwtTokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// Authentication controller
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ITokenService _tokenService;

    public AuthController(IUserService userService, ITokenService tokenService)
    {
        _userService = userService;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> LoginAsync([FromBody] LoginRequest request)
    {
        var user = await _userService.AuthenticateAsync(request.Email, request.Password);
        if (user is null)
            return Unauthorized("Invalid credentials");

        var token = _tokenService.GenerateToken(user);
        return Ok(new LoginResponse { Token = token, User = user });
    }
}

// Protected controller
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    // Requires authentication
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAllAsync() { }

    // Requires admin role
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteAsync(Guid id) { }

    // Custom authorization policy
    [HttpPut("{id:guid}")]
    [Authorize(Policy = "OwnProfile")]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] UpdateUserRequest request) { }
}

// Custom authorization policy
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("OwnProfile", policy =>
        policy.Requirements.Add(new OwnProfileRequirement()));
});

builder.Services.AddSingleton<IAuthorizationHandler, OwnProfileHandler>();
```

---

## Best Practices

### 1. Async/Await Everywhere

```csharp
// ✅ GOOD: All async operations use async/await
[HttpGet("{id:guid}")]
public async Task<ActionResult<UserDto>> GetUserAsync(Guid id)
{
    var user = await _userService.GetUserByIdAsync(id);
    if (user is null)
        return NotFound();

    return Ok(user);
}

// ❌ BAD: Blocking calls
[HttpGet("{id:guid}")]
public ActionResult<UserDto> GetUser(Guid id)
{
    var user = _userService.GetUserById(id); // Blocking!
    return Ok(user);
}

// ❌ BAD: Unnecessary Task wrapping
public async Task<User> GetUserAsync(Guid id)
{
    return await Task.FromResult(new User()); // Not actually async
}
```

### 2. Proper HTTP Status Codes

```csharp
// ✅ GOOD: Appropriate status codes
[HttpPost]
public async Task<ActionResult<UserDto>> CreateUserAsync([FromBody] CreateUserRequest request)
{
    var user = await _userService.CreateUserAsync(request);
    return CreatedAtAction(nameof(GetUserAsync), new { id = user.Id }, user); // 201 Created
}

[HttpGet("{id:guid}")]
public async Task<ActionResult<UserDto>> GetUserAsync(Guid id)
{
    var user = await _userService.GetUserByIdAsync(id);
    return user is null ? NotFound() : Ok(user); // 404 or 200
}

[HttpPut("{id:guid}")]
public async Task<IActionResult> UpdateUserAsync(Guid id, [FromBody] UpdateUserRequest request)
{
    await _userService.UpdateUserAsync(id, request);
    return NoContent(); // 204 No Content
}

// ❌ BAD: Always returning 200
[HttpPost]
public ActionResult<UserDto> CreateUser([FromBody] CreateUserRequest request)
{
    var user = _userService.CreateUser(request);
    return Ok(user); // Should be CreatedAtAction (201)
}
```

### 3. Controller Responsibility

```csharp
// ✅ GOOD: Thin controller, logic in service
[HttpPost]
public async Task<ActionResult<UserDto>> CreateUserAsync([FromBody] CreateUserRequest request)
{
    var user = await _userService.CreateUserAsync(request); // Service handles business logic
    return CreatedAtAction(nameof(GetUserAsync), new { id = user.Id }, user);
}

// ❌ BAD: Business logic in controller
[HttpPost]
public ActionResult<UserDto> CreateUser([FromBody] CreateUserRequest request)
{
    if (request.Age < 18)
        return BadRequest("User must be 18+"); // Business rule in controller!

    var user = new User { Name = request.Name, Email = request.Email };
    _dbContext.Users.Add(user);
    _dbContext.SaveChanges();

    return CreatedAtAction(nameof(GetUser), new { id = user.Id }, user);
}
```

### 4. Logging Best Practices

```csharp
// ✅ GOOD: Structured logging
_logger.LogInformation("Creating user with email {Email}", request.Email);
_logger.LogError(exception, "Failed to process order {OrderId}", orderId);

// ❌ BAD: String interpolation (loses structure)
_logger.LogInformation($"Creating user with email {request.Email}");
```

### 5. Swagger/OpenAPI Documentation

```csharp
[ApiController]
[Route("api/[controller]")]
[Tags("Users")]
public class UsersController : ControllerBase
{
    /// <summary>
    /// Gets a user by ID
    /// </summary>
    /// <param name="id">The user ID</param>
    /// <returns>The user details</returns>
    /// <response code="200">User found</response>
    /// <response code="404">User not found</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetUserAsync(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    /// <summary>
    /// Creates a new user
    /// </summary>
    /// <param name="request">User creation details</param>
    /// <returns>The created user</returns>
    /// <response code="201">User created successfully</response>
    /// <response code="400">Invalid request data</response>
    [HttpPost]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> CreateUserAsync([FromBody] CreateUserRequest request)
    {
        var user = await _userService.CreateUserAsync(request);
        return CreatedAtAction(nameof(GetUserAsync), new { id = user.Id }, user);
    }
}
```

---

## Anti-Patterns (What to Avoid)

### 1. Exposing Domain Models

```csharp
// ❌ BAD: Returning domain entity
[HttpGet("{id:guid}")]
public ActionResult<User> GetUser(Guid id) // Exposes internal model
{
    return _userRepository.GetById(id);
}

// ✅ GOOD: Return DTO (Data Transfer Object)
[HttpGet("{id:guid}")]
public ActionResult<UserDto> GetUserAsync(Guid id)
{
    var user = await _userService.GetUserByIdAsync(id);
    return Ok(new UserDto { Id = user.Id, Name = user.Name, Email = user.Email });
}
```

### 2. Synchronous Database Calls

```csharp
// ❌ BAD: Blocking calls
public ActionResult<UserDto> GetUser(Guid id)
{
    var user = _dbContext.Users.FirstOrDefault(u => u.Id == id); // Blocks thread!
    return Ok(user);
}

// ✅ GOOD: Async database calls
public async Task<ActionResult<UserDto>> GetUserAsync(Guid id)
{
    var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
    return Ok(user);
}
```

### 3. Catching Generic Exception

```csharp
// ❌ BAD: Generic catch loses exception info
[HttpPost]
public ActionResult<UserDto> CreateUser([FromBody] CreateUserRequest request)
{
    try
    {
        var user = _userService.CreateUser(request);
        return Ok(user);
    }
    catch (Exception ex) // Too broad!
    {
        return StatusCode(500, "Internal server error");
    }
}

// ✅ GOOD: Specific exception handling
[HttpPost]
public async Task<ActionResult<UserDto>> CreateUserAsync([FromBody] CreateUserRequest request)
{
    try
    {
        var user = await _userService.CreateUserAsync(request);
        return CreatedAtAction(nameof(GetUserAsync), new { id = user.Id }, user);
    }
    catch (DuplicateEmailException)
    {
        return BadRequest("Email already exists");
    }
    catch (BusinessException ex)
    {
        return BadRequest(ex.Message);
    }
}
```

### 4. Tight Coupling to Infrastructure

```csharp
// ❌ BAD: Controller depends on DbContext
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _dbContext;

    [HttpGet("{id}")]
    public ActionResult GetUser(string id)
    {
        var user = _dbContext.Users.FirstOrDefault(u => u.Id == id); // Direct DB access!
        return Ok(user);
    }
}

// ✅ GOOD: Controller depends on abstraction (service/repository)
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetUserAsync(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        return Ok(user);
    }
}
```

---

## Practical Example: Complete Controller

```csharp
[ApiController]
[Route("api/v1/products")]
[Tags("Products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IMapper _mapper;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(
        IProductService productService,
        IMapper mapper,
        ILogger<ProductsController> logger)
    {
        _productService = productService;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>Gets all products with pagination</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<ProductDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<ProductDto>>> GetAllAsync(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        _logger.LogInformation("Getting products page {Page}, size {PageSize}", page, pageSize);

        var result = await _productService.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    /// <summary>Gets a product by ID</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProductDto>> GetByIdAsync(Guid id)
    {
        _logger.LogInformation("Getting product {ProductId}", id);

        var product = await _productService.GetByIdAsync(id);
        if (product is null)
        {
            _logger.LogWarning("Product not found: {ProductId}", id);
            return NotFound();
        }

        return Ok(product);
    }

    /// <summary>Creates a new product</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ProductDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProductDto>> CreateAsync([FromBody] CreateProductRequest request)
    {
        _logger.LogInformation("Creating product: {ProductName}", request.Name);

        var product = await _productService.CreateAsync(request);
        return CreatedAtAction(nameof(GetByIdAsync), new { id = product.Id }, product);
    }

    /// <summary>Updates a product</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] UpdateProductRequest request)
    {
        _logger.LogInformation("Updating product {ProductId}", id);

        await _productService.UpdateAsync(id, request);
        return NoContent();
    }

    /// <summary>Deletes a product</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAsync(Guid id)
    {
        _logger.LogInformation("Deleting product {ProductId}", id);

        await _productService.DeleteAsync(id);
        return NoContent();
    }
}
```

---

## Validation Criteria

When this skill is applied:
- ✅ All endpoints are async (Task-based)
- ✅ Appropriate HTTP status codes returned
- ✅ Controllers thin, logic in services
- ✅ Dependency injection used for all dependencies
- ✅ DTOs used for API contracts
- ✅ Input validation with attributes
- ✅ Authentication/authorization configured
- ✅ Error handling centralized (middleware)
- ✅ Swagger documentation present
- ✅ Structured logging in place
- ✅ No synchronous database calls
- ✅ No direct DbContext access from controllers

---

## Further Reading
- ASP.NET Core Docs: https://learn.microsoft.com/aspnet/core/
- REST API Best Practices: https://restfulapi.net/
- Martin Fowler's API Design: https://martinfowler.com/articles/
