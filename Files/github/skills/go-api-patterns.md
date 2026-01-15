# Skill: Go API Patterns (@go-api-patterns)

## Metadata

```yaml
name: go-api-patterns
agents: ["@go-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Go API Patterns** skill provides comprehensive patterns for building high-performance REST APIs using Go frameworks (Gin, Echo, Fiber). Covers goroutines, channels, middleware, error handling, and concurrent request processing.

## Scope

**Included**:
- RESTful API design with Gin, Echo, Fiber
- Goroutines and concurrent request handling
- Channel-based patterns
- Middleware architecture
- Error handling strategies
- Database access patterns
- Testing approaches
- Build and deployment

**Excluded**:
- GraphQL (separate implementation)
- gRPC (different protocol)
- WebSockets (separate skill)
- Microservices orchestration

## Core Pattern 1: Gin Router Setup

```go
// main.go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "github.com/gin-contrib/requestid"
    "log"
)

type Server struct {
    router *gin.Engine
    port   string
}

func NewServer(port string) *Server {
    gin.SetMode(gin.ReleaseMode)
    r := gin.Default()
    
    // Middleware
    r.Use(cors.Default())
    r.Use(requestid.New())
    
    return &Server{
        router: r,
        port:   port,
    }
}

func (s *Server) RegisterRoutes(handlers *Handlers) {
    api := s.router.Group("/api")
    {
        users := api.Group("/users")
        {
            users.GET("", handlers.ListUsers)
            users.POST("", handlers.CreateUser)
            users.GET("/:id", handlers.GetUser)
            users.PUT("/:id", handlers.UpdateUser)
            users.DELETE("/:id", handlers.DeleteUser)
        }
    }
    
    // Health check
    s.router.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "OK"})
    })
}

func (s *Server) Start() error {
    return s.router.Run(":" + s.port)
}

func main() {
    server := NewServer("8000")
    handlers := NewHandlers()
    server.RegisterRoutes(handlers)
    
    if err := server.Start(); err != nil {
        log.Fatal(err)
    }
}
```

## Core Pattern 2: Handler and Service Pattern

```go
// handlers/user_handler.go
package handlers

import (
    "net/http"
    "strconv"
    "github.com/gin-gonic/gin"
    "yourapp/services"
    "yourapp/models"
)

type Handlers struct {
    userService *services.UserService
}

func NewHandlers() *Handlers {
    return &Handlers{
        userService: services.NewUserService(),
    }
}

func (h *Handlers) ListUsers(c *gin.Context) {
    skip := c.DefaultQuery("skip", "0")
    limit := c.DefaultQuery("limit", "10")
    
    skipInt, _ := strconv.Atoi(skip)
    limitInt, _ := strconv.Atoi(limit)
    
    users, total, err := h.userService.ListUsers(c.Request.Context(), skipInt, limitInt)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "error": "Failed to fetch users",
        })
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "items": users,
        "total": total,
        "skip":  skipInt,
        "limit": limitInt,
    })
}

func (h *Handlers) CreateUser(c *gin.Context) {
    var req struct {
        Name     string `json:"name" binding:"required,min=1,max=100"`
        Email    string `json:"email" binding:"required,email"`
        Password string `json:"password" binding:"required,min=8"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{
            "error": err.Error(),
        })
        return
    }
    
    user, err := h.userService.CreateUser(c.Request.Context(), req.Name, req.Email, req.Password)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{
            "error": "Email already registered",
        })
        return
    }
    
    c.JSON(http.StatusCreated, user)
}

func (h *Handlers) GetUser(c *gin.Context) {
    id, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
        return
    }
    
    user, err := h.userService.GetUserByID(c.Request.Context(), id)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(http.StatusOK, user)
}

func (h *Handlers) UpdateUser(c *gin.Context) {
    id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
    
    var req struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.userService.UpdateUser(c.Request.Context(), id, req.Name, req.Email)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(http.StatusOK, user)
}

func (h *Handlers) DeleteUser(c *gin.Context) {
    id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
    
    if err := h.userService.DeleteUser(c.Request.Context(), id); err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }
    
    c.Status(http.StatusNoContent)
}

// services/user_service.go
package services

import (
    "context"
    "yourapp/database"
    "yourapp/models"
)

type UserService struct {
    db *database.Database
}

func NewUserService() *UserService {
    return &UserService{
        db: database.GetDB(),
    }
}

func (s *UserService) ListUsers(ctx context.Context, skip, limit int) ([]models.User, int64, error) {
    users, total, err := s.db.GetUsers(ctx, skip, limit)
    return users, total, err
}

func (s *UserService) CreateUser(ctx context.Context, name, email, password string) (*models.User, error) {
    user := &models.User{
        Name:     name,
        Email:    email,
        Password: HashPassword(password),
    }
    
    if err := s.db.CreateUser(ctx, user); err != nil {
        return nil, err
    }
    
    return user, nil
}

func (s *UserService) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
    return s.db.GetUserByID(ctx, id)
}

func (s *UserService) UpdateUser(ctx context.Context, id int64, name, email string) (*models.User, error) {
    user, err := s.db.GetUserByID(ctx, id)
    if err != nil {
        return nil, err
    }
    
    user.Name = name
    user.Email = email
    
    if err := s.db.UpdateUser(ctx, user); err != nil {
        return nil, err
    }
    
    return user, nil
}

func (s *UserService) DeleteUser(ctx context.Context, id int64) error {
    return s.db.DeleteUser(ctx, id)
}
```

## Core Pattern 3: Goroutines for Concurrent Processing

```go
// Concurrent request processing with goroutines
package services

import (
    "context"
    "sync"
)

type BulkProcessor struct {
    concurrency int
    workChan    chan WorkItem
    wg          sync.WaitGroup
}

type WorkItem struct {
    ID   int64
    Data interface{}
}

type ProcessResult struct {
    ID    int64
    Error error
}

func NewBulkProcessor(concurrency int) *BulkProcessor {
    return &BulkProcessor{
        concurrency: concurrency,
        workChan:    make(chan WorkItem, 100),
    }
}

func (bp *BulkProcessor) ProcessAsync(ctx context.Context, items []WorkItem) <-chan ProcessResult {
    resultChan := make(chan ProcessResult, len(items))
    
    // Start worker goroutines
    for i := 0; i < bp.concurrency; i++ {
        bp.wg.Add(1)
        go func() {
            defer bp.wg.Done()
            bp.worker(ctx, resultChan)
        }()
    }
    
    // Submit work
    go func() {
        for _, item := range items {
            select {
            case bp.workChan <- item:
            case <-ctx.Done():
                return
            }
        }
        close(bp.workChan)
    }()
    
    // Wait for completion
    go func() {
        bp.wg.Wait()
        close(resultChan)
    }()
    
    return resultChan
}

func (bp *BulkProcessor) worker(ctx context.Context, results chan<- ProcessResult) {
    for {
        select {
        case item, ok := <-bp.workChan:
            if !ok {
                return
            }
            
            // Process item
            result := ProcessResult{ID: item.ID}
            // ... processing logic ...
            
            select {
            case results <- result:
            case <-ctx.Done():
                return
            }
            
        case <-ctx.Done():
            return
        }
    }
}

// Usage
processor := NewBulkProcessor(10)
results := processor.ProcessAsync(ctx, items)

for result := range results {
    if result.Error != nil {
        log.Printf("Failed to process item %d: %v", result.ID, result.Error)
    } else {
        log.Printf("Processed item %d successfully", result.ID)
    }
}
```

## Core Pattern 4: Channel-Based Communication

```go
// Worker pool pattern with channels
package workers

type Task interface {
    Execute(ctx context.Context) error
}

type WorkerPool struct {
    workers  int
    taskChan chan Task
    done     chan struct{}
}

func NewWorkerPool(workers int) *WorkerPool {
    return &WorkerPool{
        workers:  workers,
        taskChan: make(chan Task, 100),
        done:     make(chan struct{}),
    }
}

func (wp *WorkerPool) Start() {
    for i := 0; i < wp.workers; i++ {
        go wp.worker()
    }
}

func (wp *WorkerPool) worker() {
    for {
        select {
        case task, ok := <-wp.taskChan:
            if !ok {
                return
            }
            
            ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
            if err := task.Execute(ctx); err != nil {
                log.Printf("Task failed: %v", err)
            }
            cancel()
            
        case <-wp.done:
            return
        }
    }
}

func (wp *WorkerPool) Submit(task Task) {
    wp.taskChan <- task
}

func (wp *WorkerPool) Stop() {
    close(wp.done)
    close(wp.taskChan)
}
```

## Core Pattern 5: Error Handling

```go
// Comprehensive error handling
package errors

import (
    "fmt"
    "github.com/gin-gonic/gin"
    "net/http"
)

type APIError struct {
    Code       string `json:"code"`
    Message    string `json:"message"`
    StatusCode int    `json:"-"`
    Err        error  `json:"-"`
}

func (e *APIError) Error() string {
    return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Predefined errors
var (
    ErrNotFound = &APIError{
        Code:       "NOT_FOUND",
        Message:    "Resource not found",
        StatusCode: http.StatusNotFound,
    }
    
    ErrUnauthorized = &APIError{
        Code:       "UNAUTHORIZED",
        Message:    "Unauthorized access",
        StatusCode: http.StatusUnauthorized,
    }
    
    ErrValidation = &APIError{
        Code:       "VALIDATION_ERROR",
        Message:    "Request validation failed",
        StatusCode: http.StatusBadRequest,
    }
    
    ErrConflict = &APIError{
        Code:       "CONFLICT",
        Message:    "Resource already exists",
        StatusCode: http.StatusConflict,
    }
)

// Error wrapping
func Wrap(code, message string, err error) *APIError {
    return &APIError{
        Code:       code,
        Message:    message,
        StatusCode: http.StatusInternalServerError,
        Err:        err,
    }
}

// Middleware for error handling
func ErrorHandlerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{
                    "error": "Internal server error",
                })
            }
        }()
        
        c.Next()
        
        // Handle errors set by handlers
        if len(c.Errors) > 0 {
            lastErr := c.Errors.Last()
            
            if apiErr, ok := lastErr.Err.(*APIError); ok {
                c.JSON(apiErr.StatusCode, gin.H{
                    "error": gin.H{
                        "code":    apiErr.Code,
                        "message": apiErr.Message,
                    },
                })
            } else {
                c.JSON(http.StatusInternalServerError, gin.H{
                    "error": "Internal server error",
                })
            }
        }
    }
}
```

## Core Pattern 6: Middleware

```go
// Custom middleware for logging, auth, etc.
package middleware

import (
    "github.com/gin-gonic/gin"
    "time"
    "log"
)

func LoggingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        startTime := time.Now()
        
        c.Next()
        
        duration := time.Since(startTime)
        statusCode := c.Writer.Status()
        
        log.Printf(
            "%s %s %d %v",
            c.Request.Method,
            c.Request.RequestURI,
            statusCode,
            duration,
        )
    }
}

func AuthMiddleware(secret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.JSON(401, gin.H{"error": "Missing token"})
            c.Abort()
            return
        }
        
        // Validate token
        claims, err := ValidateToken(token, secret)
        if err != nil {
            c.JSON(401, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        c.Set("user_id", claims.UserID)
        c.Next()
    }
}

func CORSMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
        c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(200)
            return
        }
        
        c.Next()
    }
}
```

## Core Pattern 7: Database Access

```go
// GORM usage patterns
package database

import (
    "context"
    "gorm.io/gorm"
    "yourapp/models"
)

type Database struct {
    db *gorm.DB
}

func NewDatabase(db *gorm.DB) *Database {
    return &Database{db: db}
}

// Get single record
func (d *Database) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
    var user models.User
    if err := d.db.WithContext(ctx).First(&user, id).Error; err != nil {
        return nil, err
    }
    return &user, nil
}

// Get multiple records with pagination
func (d *Database) GetUsers(ctx context.Context, skip, limit int) ([]models.User, int64, error) {
    var users []models.User
    var total int64
    
    // Count total
    if err := d.db.WithContext(ctx).Model(&models.User{}).Count(&total).Error; err != nil {
        return nil, 0, err
    }
    
    // Get paginated results
    if err := d.db.WithContext(ctx).Offset(skip).Limit(limit).Find(&users).Error; err != nil {
        return nil, 0, err
    }
    
    return users, total, nil
}

// Create record
func (d *Database) CreateUser(ctx context.Context, user *models.User) error {
    return d.db.WithContext(ctx).Create(user).Error
}

// Update record
func (d *Database) UpdateUser(ctx context.Context, user *models.User) error {
    return d.db.WithContext(ctx).Model(user).Updates(user).Error
}

// Delete record
func (d *Database) DeleteUser(ctx context.Context, id int64) error {
    return d.db.WithContext(ctx).Delete(&models.User{}, id).Error
}

// Batch operations
func (d *Database) CreateUsers(ctx context.Context, users []models.User) error {
    return d.db.WithContext(ctx).CreateInBatches(users, 100).Error
}
```

## Core Pattern 8: Caching

```go
// In-memory caching with sync.Map
package cache

import (
    "sync"
    "time"
)

type CacheItem struct {
    Value      interface{}
    ExpiresAt  time.Time
}

type Cache struct {
    data sync.Map
}

func (c *Cache) Set(key string, value interface{}, ttl time.Duration) {
    c.data.Store(key, CacheItem{
        Value:     value,
        ExpiresAt: time.Now().Add(ttl),
    })
}

func (c *Cache) Get(key string) (interface{}, bool) {
    if val, ok := c.data.Load(key); ok {
        item := val.(CacheItem)
        if time.Now().Before(item.ExpiresAt) {
            return item.Value, true
        }
        c.data.Delete(key)
    }
    return nil, false
}

func (c *Cache) Delete(key string) {
    c.data.Delete(key)
}

// Usage
cache := &Cache{}
cache.Set("user:1", user, 5*time.Minute)
if user, ok := cache.Get("user:1"); ok {
    // Use cached user
}
```

## Anti-Patterns

### ❌ Ignoring Context

```go
// BAD: No context handling
func GetUser(userID int64) (*User, error) {
    // No context, can't timeout or cancel
    return db.GetUser(userID)
}

// GOOD: Use context
func GetUser(ctx context.Context, userID int64) (*User, error) {
    return db.GetUserWithContext(ctx, userID)
}
```

### ❌ Unbounded Goroutines

```go
// BAD: Creates unlimited goroutines
for _, item := range items {
    go process(item)
}

// GOOD: Use worker pool with bounded goroutines
pool := NewWorkerPool(10)
for _, item := range items {
    pool.Submit(item)
}
```

### ❌ Not Handling Errors

```go
// BAD
db.CreateUser(user)  // Error ignored!

// GOOD
if err := db.CreateUser(user); err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}
```

## Schema Reference

- `go-specialist.input.schema.json` - Agent input requirements
- `go-specialist.output.schema.json` - Generated file structure

## Related Documentation

- Skill: `go-best-practices.md` - Performance and deployment
- Agent: `go-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Go API patterns
