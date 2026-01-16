# Entity Framework Core Skill

## Overview
**Skill ID**: `entity-framework`  
**Version**: 1.0  
**Domain**: Entity Framework Core (ORM) patterns and data access patterns  
**Phase**: 14 (@dotnet-specialist)  
**Maturity**: Production-Ready

Entity Framework Core skill covers DbContext configuration, entity relationships, migrations, LINQ queries, performance optimization, and repository patterns for data access layer in .NET applications.

---

## Core Concepts

### 1. DbContext Configuration

**Definition**: Central class for interacting with the database through entities.

```csharp
public class ApplicationDbContext : DbContext
{
    // Constructor with options
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Entity sets (tables)
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;

    // Override OnModelCreating for fluent configuration
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User entity configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.Property(u => u.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(u => u.Email)
                .HasMaxLength(255)
                .IsRequired();

            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()"); // SQL Server

            entity.HasQueryFilter(u => !u.IsDeleted); // Soft delete filter
        });

        // Product entity configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(p => p.Price)
                .HasColumnType("decimal(18, 2)")
                .IsRequired();

            entity.HasIndex(p => p.Sku)
                .IsUnique();
        });

        // Relationships
        ConfigureUserOrderRelationship(modelBuilder);
        ConfigureOrderItemRelationship(modelBuilder);
    }

    private void ConfigureUserOrderRelationship(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>()
            .HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete
    }

    private void ConfigureOrderItemRelationship(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItem>()
            .HasOne(oi => oi.Product)
            .WithMany()
            .HasForeignKey(oi => oi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    // Override SaveChanges for audit trail
    public override async Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess = true,
        CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries();

        foreach (var entry in entries)
        {
            if (entry.Entity is IAuditableEntity auditableEntity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        auditableEntity.CreatedAt = DateTime.UtcNow;
                        auditableEntity.UpdatedAt = DateTime.UtcNow;
                        break;

                    case EntityState.Modified:
                        auditableEntity.UpdatedAt = DateTime.UtcNow;
                        break;
                }
            }

            if (entry.Entity is ISoftDelete softDeleteEntity)
            {
                if (entry.State == EntityState.Deleted)
                {
                    entry.State = EntityState.Modified;
                    softDeleteEntity.IsDeleted = true;
                }
            }
        }

        return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }
}

// Marker interfaces
public interface IAuditableEntity
{
    DateTime CreatedAt { get; set; }
    DateTime UpdatedAt { get; set; }
}

public interface ISoftDelete
{
    bool IsDeleted { get; set; }
}

// Entity definitions
public class User : IAuditableEntity, ISoftDelete
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public ICollection<Order> Orders { get; set; } = [];
}

public class Order : IAuditableEntity, ISoftDelete
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal Total { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }

    public User User { get; set; } = null!;
    public ICollection<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

public class Product : IAuditableEntity, ISoftDelete
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Sku { get; set; } = null!;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}

public enum OrderStatus
{
    Pending = 0,
    Confirmed = 1,
    Shipped = 2,
    Delivered = 3,
    Cancelled = 4
}
```

**Key Configuration Points**:
- ✅ DbSet properties for each entity
- ✅ Fluent configuration in OnModelCreating
- ✅ Column type specification (e.g., decimal(18,2))
- ✅ Indexes for performance
- ✅ Relationships (foreign keys, cascade behavior)
- ✅ Query filters for soft deletes
- ✅ Audit trail in SaveChangesAsync

### 2. Entity Relationships

**Definition**: Configuring associations between entities (1:1, 1:N, N:N).

```csharp
// One-to-Many: User has many Orders
modelBuilder.Entity<Order>()
    .HasOne(o => o.User)           // Each Order has one User
    .WithMany(u => u.Orders)        // Each User has many Orders
    .HasForeignKey(o => o.UserId)   // Foreign key
    .OnDelete(DeleteBehavior.Restrict); // Delete behavior

// Many-to-Many: Students and Courses
public class Student
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public ICollection<StudentCourse> Enrollments { get; set; } = [];
}

public class Course
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public ICollection<StudentCourse> Enrollments { get; set; } = [];
}

public class StudentCourse
{
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public DateTime EnrolledDate { get; set; }
    public decimal Grade { get; set; }

    public Student Student { get; set; } = null!;
    public Course Course { get; set; } = null!;
}

// Configure many-to-many
modelBuilder.Entity<StudentCourse>()
    .HasKey(sc => new { sc.StudentId, sc.CourseId });

modelBuilder.Entity<StudentCourse>()
    .HasOne(sc => sc.Student)
    .WithMany(s => s.Enrollments)
    .HasForeignKey(sc => sc.StudentId);

modelBuilder.Entity<StudentCourse>()
    .HasOne(sc => sc.Course)
    .WithMany(c => c.Enrollments)
    .HasForeignKey(sc => sc.CourseId);

// Delete behaviors
enum DeleteBehavior
{
    NoAction = 0,      // No action (may violate FK constraint)
    Cascade = 1,       // Delete dependent records
    SetNull = 2,       // Set FK to NULL (if nullable)
    Restrict = 3,      // Prevent deletion if dependents exist
    ClientSetNull = 4  // Set NULL in memory before delete
}
```

### 3. LINQ Queries

**Definition**: Language Integrated Query for database access.

```csharp
public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _dbContext;

    public UserRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Simple query
    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Users
            .AsNoTracking() // No tracking - better performance for read-only
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    // Include related data
    public async Task<User?> GetWithOrdersAsync(Guid id)
    {
        return await _dbContext.Users
            .Include(u => u.Orders)      // Load related orders
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    // Nested includes
    public async Task<User?> GetWithOrderDetailsAsync(Guid id)
    {
        return await _dbContext.Users
            .Include(u => u.Orders)
                .ThenInclude(o => o.Items) // Include order items in orders
                    .ThenInclude(oi => oi.Product) // Include products in order items
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    // Filtering
    public async Task<List<Order>> GetActiveOrdersAsync(Guid userId)
    {
        return await _dbContext.Orders
            .Where(o => o.UserId == userId)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();
    }

    // Projection (select specific columns)
    public async Task<List<OrderDto>> GetOrdersSummaryAsync(Guid userId)
    {
        return await _dbContext.Orders
            .Where(o => o.UserId == userId)
            .Select(o => new OrderDto
            {
                Id = o.Id,
                OrderDate = o.OrderDate,
                Total = o.Total,
                Status = o.Status.ToString(),
                ItemCount = o.Items.Count
            })
            .ToListAsync();
    }

    // Paging
    public async Task<PagedResult<UserDto>> GetPagedAsync(int page, int pageSize)
    {
        var query = _dbContext.Users.AsNoTracking();

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto { Id = u.Id, Name = u.Name, Email = u.Email })
            .ToListAsync();

        return new PagedResult<UserDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Complex query with grouping and aggregation
    public async Task<List<UserOrderSummary>> GetUserOrderSummaryAsync()
    {
        return await _dbContext.Orders
            .Where(o => o.Status != OrderStatus.Cancelled)
            .GroupBy(o => o.UserId)
            .Select(g => new UserOrderSummary
            {
                UserId = g.Key,
                TotalOrders = g.Count(),
                TotalSpent = g.Sum(o => o.Total),
                AverageOrderValue = g.Average(o => o.Total),
                LastOrderDate = g.Max(o => o.OrderDate)
            })
            .ToListAsync();
    }

    // Raw SQL (for complex queries)
    public async Task<List<User>> GetByCustomQueryAsync(string sqlQuery, params object[] parameters)
    {
        return await _dbContext.Users
            .FromSqlInterpolated($"{sqlQuery}")
            .ToListAsync();
    }
}

public class OrderDto
{
    public Guid Id { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal Total { get; set; }
    public string Status { get; set; } = null!;
    public int ItemCount { get; set; }
}

public class UserOrderSummary
{
    public Guid UserId { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal AverageOrderValue { get; set; }
    public DateTime LastOrderDate { get; set; }
}
```

**LINQ Best Practices**:
- ✅ Use `AsNoTracking()` for read-only queries
- ✅ Use `Include()` to load related data
- ✅ Use projections (`.Select()`) to load only needed columns
- ✅ Always use `async` methods (`FirstOrDefaultAsync`, `ToListAsync`, etc.)
- ✅ Apply filters before `.ToList()` (server-side evaluation)

### 4. Migrations

**Definition**: Version control for database schema changes.

```csharp
// Using EF Core CLI
// dotnet ef migrations add InitialCreate
// dotnet ef database update

// Generated migration structure
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Users", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Users_Email",
            table: "Users",
            column: "Email",
            unique: true);

        migrationBuilder.CreateTable(
            name: "Products",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Sku = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                StockQuantity = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Products", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Users");
        migrationBuilder.DropTable(name: "Products");
    }
}

// Seed data migration
public partial class SeedInitialData : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.InsertData(
            table: "Users",
            columns: new[] { "Id", "Name", "Email", "PasswordHash" },
            values: new object[] {
                Guid.NewGuid(),
                "Admin User",
                "admin@example.com",
                "hashed_password"
            });

        migrationBuilder.InsertData(
            table: "Products",
            columns: new[] { "Id", "Name", "Sku", "Price", "StockQuantity" },
            values: new object[] {
                Guid.NewGuid(),
                "Sample Product",
                "SKU001",
                99.99m,
                100
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DeleteData(table: "Users", keyColumn: "Id", keyValue: Guid.NewGuid());
    }
}
```

### 5. Change Tracking & Unit of Work

**Definition**: EF Core tracks entity changes and commits atomically.

```csharp
// Unit of Work pattern
public interface IUnitOfWork : IAsyncDisposable
{
    IUserRepository Users { get; }
    IProductRepository Products { get; }
    IOrderRepository Orders { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _dbContext;
    private IUserRepository? _userRepository;
    private IProductRepository? _productRepository;
    private IOrderRepository? _orderRepository;

    public UnitOfWork(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IUserRepository Users =>
        _userRepository ??= new UserRepository(_dbContext);

    public IProductRepository Products =>
        _productRepository ??= new ProductRepository(_dbContext);

    public IOrderRepository Orders =>
        _orderRepository ??= new OrderRepository(_dbContext);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async ValueTask DisposeAsync()
    {
        await _dbContext.DisposeAsync();
    }
}

// Usage in service
public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;

    public OrderService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<OrderDto> CreateOrderAsync(CreateOrderRequest request)
    {
        // Start transaction
        var strategy = _unitOfWork.CreateExecutionStrategy(); // For SQL Server
        return await strategy.ExecuteAsync(async () =>
        {
            var user = await _unitOfWork.Users.GetByIdAsync(request.UserId);
            if (user is null)
                throw new UserNotFoundException(request.UserId);

            var order = new Order
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Pending
            };

            // Add items
            foreach (var itemRequest in request.Items)
            {
                var product = await _unitOfWork.Products.GetByIdAsync(itemRequest.ProductId);
                if (product is null)
                    throw new ProductNotFoundException(itemRequest.ProductId);

                var item = new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = order.Id,
                    ProductId = product.Id,
                    Quantity = itemRequest.Quantity,
                    UnitPrice = product.Price
                };

                order.Items.Add(item);
                order.Total += item.UnitPrice * item.Quantity;

                // Reduce stock
                product.StockQuantity -= itemRequest.Quantity;
            }

            // Save atomically
            await _unitOfWork.SaveChangesAsync();

            return new OrderDto { Id = order.Id, Total = order.Total };
        });
    }
}
```

---

## Best Practices

### 1. Use AsNoTracking for Read-Only Queries

```csharp
// ❌ BAD: Tracking unnecessary entities
var users = await _dbContext.Users
    .Where(u => u.Email.Contains(search))
    .ToListAsync();

// ✅ GOOD: No tracking for read-only
var users = await _dbContext.Users
    .AsNoTracking()
    .Where(u => u.Email.Contains(search))
    .ToListAsync();
```

### 2. Eager Load Related Data with Include

```csharp
// ❌ BAD: N+1 query problem
var users = await _dbContext.Users.ToListAsync();
foreach (var user in users)
{
    var orders = await _dbContext.Orders
        .Where(o => o.UserId == user.Id)
        .ToListAsync(); // Separate query per user!
}

// ✅ GOOD: Single query with eager loading
var users = await _dbContext.Users
    .Include(u => u.Orders)
    .ThenInclude(o => o.Items)
    .AsNoTracking()
    .ToListAsync();
```

### 3. Project to DTOs

```csharp
// ❌ BAD: Load entire entities, then map
var users = await _dbContext.Users.ToListAsync();
return users.Select(u => new UserDto { Id = u.Id, Name = u.Name });

// ✅ GOOD: Project in query (only needed columns)
return await _dbContext.Users
    .AsNoTracking()
    .Select(u => new UserDto { Id = u.Id, Name = u.Name })
    .ToListAsync();
```

### 4. Async All The Way

```csharp
// ❌ BAD: Synchronous calls
public User GetUser(Guid id)
{
    return _dbContext.Users.FirstOrDefault(u => u.Id == id); // Blocks!
}

// ✅ GOOD: Fully async
public async Task<User?> GetUserAsync(Guid id)
{
    return await _dbContext.Users
        .FirstOrDefaultAsync(u => u.Id == id);
}
```

### 5. Configure Soft Deletes with Query Filters

```csharp
// ✅ GOOD: Query filter automatically excludes deleted
modelBuilder.Entity<User>()
    .HasQueryFilter(u => !u.IsDeleted);

// Now all queries automatically exclude soft-deleted users
var activeUsers = await _dbContext.Users.ToListAsync(); // Only active users

// To include deleted, use IgnoreQueryFilters
var allUsers = await _dbContext.Users
    .IgnoreQueryFilters()
    .ToListAsync();
```

---

## Anti-Patterns (What to Avoid)

### 1. Change Tracking for Read-Only Data

```csharp
// ❌ BAD: Tracking when not needed
var report = _dbContext.Orders
    .Where(o => o.Status == OrderStatus.Completed)
    .ToList(); // Tracks all entities!

// ✅ GOOD: No tracking for reports
var report = _dbContext.Orders
    .AsNoTracking()
    .Where(o => o.Status == OrderStatus.Completed)
    .ToList();
```

### 2. Lazy Loading Hidden Queries

```csharp
// ❌ BAD: Accidental queries (if lazy loading enabled)
var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id);
var orderCount = user.Orders.Count; // Triggers query!

// ✅ GOOD: Explicit loading
var user = await _dbContext.Users
    .Include(u => u.Orders)
    .FirstOrDefaultAsync(u => u.Id == id);
var orderCount = user.Orders.Count; // No query
```

### 3. Filtering After ToList

```csharp
// ❌ BAD: Filtering in memory
var userOrders = _dbContext.Orders
    .ToList() // All orders to memory!
    .Where(o => o.UserId == userId && o.Status == OrderStatus.Completed)
    .ToList();

// ✅ GOOD: Filter on server
var userOrders = _dbContext.Orders
    .Where(o => o.UserId == userId && o.Status == OrderStatus.Completed)
    .ToListAsync();
```

### 4. Storing DbContext in Static Fields

```csharp
// ❌ BAD: Static DbContext
public static ApplicationDbContext DbContext { get; set; }

// ✅ GOOD: Scoped dependency injection
builder.Services.AddScoped<ApplicationDbContext>();
```

---

## Validation Criteria

When this skill is applied:
- ✅ DbContext properly configured with Fluent API
- ✅ All relationships explicitly configured
- ✅ Query filters for soft deletes
- ✅ Audit fields (CreatedAt, UpdatedAt) managed
- ✅ Migrations version-controlled
- ✅ AsNoTracking() for read-only queries
- ✅ Include() for eager loading
- ✅ Projections to DTOs
- ✅ All queries async (async/await)
- ✅ Unit of Work pattern for transactions
- ✅ No N+1 query problems
- ✅ Proper delete behaviors (Cascade, Restrict, etc.)

---

## Further Reading
- EF Core Docs: https://learn.microsoft.com/ef/core/
- Fluent API: https://learn.microsoft.com/ef/core/modeling/
- Query Performance: https://learn.microsoft.com/ef/core/performance/query-performance-considerations
