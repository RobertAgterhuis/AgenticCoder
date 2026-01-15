# Skill: Go Best Practices (@go-best-practices)

## Metadata

```yaml
name: go-best-practices
agents: ["@go-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Go Best Practices** skill provides comprehensive guidance on building production-ready Go applications with emphasis on performance, testing, deployment, concurrency, and code quality.

## Scope

**Included**:
- Performance optimization and profiling
- Testing strategies (unit, integration, benchmarks)
- Concurrency patterns and goroutine management
- Memory management and GC tuning
- Build and deployment optimization
- Docker containerization
- Monitoring and observability
- Security best practices

**Excluded**:
- Specific framework tutorials (see framework skills)
- Advanced system programming
- Unsafe code patterns (not recommended)

## Core Pattern 1: Profiling and Optimization

```go
// CPU and memory profiling
package main

import (
    "fmt"
    "os"
    "runtime"
    "runtime/pprof"
    "runtime/trace"
)

func profileCPU() {
    cpuFile, _ := os.Create("cpu.prof")
    defer cpuFile.Close()
    
    pprof.StartCPUProfile(cpuFile)
    defer pprof.StopCPUProfile()
    
    // Your code here
}

func profileMemory() {
    memFile, _ := os.Create("mem.prof")
    defer memFile.Close()
    
    // Run code
    runtime.GC()
    pprof.WriteHeapProfile(memFile)
}

func enableTracing() {
    traceFile, _ := os.Create("trace.out")
    defer traceFile.Close()
    
    trace.Start(traceFile)
    defer trace.Stop()
    
    // Your code here
}

// Analysis commands:
// go tool pprof cpu.prof
// go tool pprof mem.prof
// go tool trace trace.out

// Benchmark tests
func BenchmarkUserLookup(b *testing.B) {
    cache := NewUserCache()
    user := &User{ID: 1, Name: "John"}
    cache.Set("1", user)
    
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        cache.Get("1")
    }
}

// Run benchmarks
// go test -bench=. -benchmem

// Memory optimization
type UserOptimized struct {
    ID   int32    // Use int32 instead of int64 if possible
    Age  uint8    // Use smaller types when appropriate
    Name string   // Pointer fields can be more efficient in large structs
}

// Use value receivers for small structs
func (u *User) UpdateName(name string) {
    u.Name = name
}

// Use pointer receivers for large structs
func (u *LargeStruct) UpdateData(data interface{}) {
    u.Data = data
}
```

## Core Pattern 2: Testing Strategy

```go
// Unit tests with table-driven approach
package services

import (
    "context"
    "testing"
)

func TestCreateUser(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        wantErr bool
        wantID  int64
    }{
        {
            name:    "valid name",
            input:   "John",
            wantErr: false,
            wantID:  1,
        },
        {
            name:    "empty name",
            input:   "",
            wantErr: true,
            wantID:  0,
        },
        {
            name:    "long name",
            input:   string(make([]byte, 1000)),
            wantErr: true,
            wantID:  0,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            user, err := CreateUser(context.Background(), tt.input)
            
            if (err != nil) != tt.wantErr {
                t.Errorf("CreateUser() error = %v, wantErr %v", err, tt.wantErr)
                return
            }
            
            if !tt.wantErr && user.ID != tt.wantID {
                t.Errorf("CreateUser() ID = %v, want %v", user.ID, tt.wantID)
            }
        })
    }
}

// Integration tests
func TestUserServiceIntegration(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration test")
    }
    
    db := setupTestDatabase(t)
    defer db.Close()
    
    service := NewUserService(db)
    
    // Create user
    user, err := service.CreateUser(context.Background(), "test@example.com", "password")
    if err != nil {
        t.Fatalf("CreateUser failed: %v", err)
    }
    
    // Retrieve user
    retrieved, err := service.GetUserByID(context.Background(), user.ID)
    if err != nil {
        t.Fatalf("GetUserByID failed: %v", err)
    }
    
    if retrieved.Email != user.Email {
        t.Errorf("Email mismatch: got %v, want %v", retrieved.Email, user.Email)
    }
}

// Mocking with interfaces
type UserRepository interface {
    GetUser(ctx context.Context, id int64) (*User, error)
    SaveUser(ctx context.Context, user *User) error
}

type MockUserRepository struct {
    users map[int64]*User
}

func (m *MockUserRepository) GetUser(ctx context.Context, id int64) (*User, error) {
    user, ok := m.users[id]
    if !ok {
        return nil, ErrNotFound
    }
    return user, nil
}

func (m *MockUserRepository) SaveUser(ctx context.Context, user *User) error {
    m.users[user.ID] = user
    return nil
}

func TestUserServiceWithMock(t *testing.T) {
    mockRepo := &MockUserRepository{
        users: map[int64]*User{
            1: {ID: 1, Name: "John"},
        },
    }
    
    service := NewUserService(mockRepo)
    
    user, err := service.GetUser(context.Background(), 1)
    if err != nil {
        t.Fatalf("GetUser failed: %v", err)
    }
    
    if user.Name != "John" {
        t.Errorf("Name mismatch: got %v, want John", user.Name)
    }
}

// Subtests for organization
func TestUserService(t *testing.T) {
    t.Run("Creation", func(t *testing.T) {
        // Test creation
    })
    
    t.Run("Retrieval", func(t *testing.T) {
        // Test retrieval
    })
    
    t.Run("Update", func(t *testing.T) {
        // Test update
    })
}
```

## Core Pattern 3: Goroutine Safety

```go
// Proper goroutine synchronization
package workers

import (
    "context"
    "sync"
)

// Use WaitGroup for synchronization
func ProcessItemsWithWaitGroup(items []int) {
    var wg sync.WaitGroup
    
    for _, item := range items {
        wg.Add(1)
        go func(item int) {
            defer wg.Done()
            ProcessItem(item)
        }(item)  // Pass item as parameter to avoid closure issues
    }
    
    wg.Wait()
}

// Use context for cancellation
func ProcessItemsWithContext(ctx context.Context, items []int) error {
    var wg sync.WaitGroup
    errChan := make(chan error, len(items))
    
    for _, item := range items {
        wg.Add(1)
        go func(item int) {
            defer wg.Done()
            
            select {
            case <-ctx.Done():
                errChan <- ctx.Err()
                return
            default:
                if err := ProcessItem(item); err != nil {
                    errChan <- err
                }
            }
        }(item)
    }
    
    wg.Wait()
    close(errChan)
    
    for err := range errChan {
        if err != nil {
            return err
        }
    }
    return nil
}

// Protect shared state with mutex
type SafeCounter struct {
    mu    sync.Mutex
    count int
}

func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.count++
}

func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.count
}

// Use RWMutex for read-heavy workloads
type Cache struct {
    mu    sync.RWMutex
    items map[string]interface{}
}

func (c *Cache) Get(key string) (interface{}, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    item, ok := c.items[key]
    return item, ok
}

func (c *Cache) Set(key string, value interface{}) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    c.items[key] = value
}

// Use channels for communication
func MergeResults(in1, in2 <-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int)
    
    output := func(in <-chan int) {
        defer wg.Done()
        for val := range in {
            out <- val
        }
    }
    
    wg.Add(2)
    go output(in1)
    go output(in2)
    
    go func() {
        wg.Wait()
        close(out)
    }()
    
    return out
}
```

## Core Pattern 4: Error Handling

```go
// Proper error handling with wrapping
package main

import (
    "errors"
    "fmt"
)

func ProcessData(filename string) error {
    data, err := readFile(filename)
    if err != nil {
        return fmt.Errorf("failed to read file %s: %w", filename, err)
    }
    
    if err := validateData(data); err != nil {
        return fmt.Errorf("validation failed: %w", err)
    }
    
    return nil
}

// Error type checking
var (
    ErrNotFound = errors.New("not found")
    ErrInvalid  = errors.New("invalid input")
)

func GetUser(id int) (*User, error) {
    if id <= 0 {
        return nil, fmt.Errorf("%w: user id must be positive", ErrInvalid)
    }
    
    // lookup...
    return nil, ErrNotFound
}

func handleError(err error) {
    if errors.Is(err, ErrNotFound) {
        // Handle not found
    } else if errors.Is(err, ErrInvalid) {
        // Handle invalid
    }
}

// Custom error types
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on %s: %s", e.Field, e.Message)
}

func ValidateEmail(email string) error {
    if !strings.Contains(email, "@") {
        return &ValidationError{
            Field:   "email",
            Message: "must contain @",
        }
    }
    return nil
}

// Handle errors in defer
func WriteData(filename string, data []byte) error {
    file, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer file.Close()
    
    if _, err := file.Write(data); err != nil {
        return err  // Error during write
    }
    
    return nil
}
```

## Core Pattern 5: Build Optimization

```go
// Build configuration
// Makefile
.PHONY: build test lint docker

build:
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
        -ldflags="-w -s -X main.Version=$(VERSION) -X main.BuildTime=$(DATE)" \
        -o bin/api ./cmd/api

build-local:
    go build -o bin/api ./cmd/api

test:
    go test -v -race -coverprofile=coverage.out ./...

test-short:
    go test -short -v ./...

coverage:
    go test -v -race -coverprofile=coverage.out ./...
    go tool cover -html=coverage.out

lint:
    golangci-lint run ./...

fmt:
    go fmt ./...
    goimports -w .

vet:
    go vet ./...

docker:
    docker build -t api:latest .

clean:
    rm -rf bin/

# Optimized Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o api ./cmd/api

# Final image
FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /app
COPY --from=builder /build/api .

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget --quiet --tries=1 --spider http://localhost:8000/health || exit 1

CMD ["./api"]
```

## Core Pattern 6: Logging and Observability

```go
// Structured logging with zerolog
package main

import (
    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func init() {
    zerolog.SetGlobalLevel(zerolog.InfoLevel)
    log.Logger = log.With().Caller().Logger()
}

func ProcessUser(userID int64) error {
    log.Info().
        Int64("user_id", userID).
        Msg("processing user")
    
    if err := validateUser(userID); err != nil {
        log.Error().
            Int64("user_id", userID).
            Err(err).
            Msg("validation failed")
        return err
    }
    
    log.Info().
        Int64("user_id", userID).
        Msg("user processed successfully")
    
    return nil
}

// Metrics with Prometheus
package metrics

import (
    "github.com/prometheus/client_golang/prometheus"
)

var (
    httpRequestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total HTTP requests",
        },
        []string{"method", "path", "status"},
    )
    
    httpDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "path"},
    )
)

func init() {
    prometheus.MustRegister(httpRequestsTotal, httpDuration)
}

// Health checks
func HealthCheck(c *gin.Context) {
    checks := map[string]bool{
        "database": checkDatabase(),
        "redis":    checkRedis(),
        "disk":     checkDiskSpace(),
    }
    
    allHealthy := true
    for _, healthy := range checks {
        if !healthy {
            allHealthy = false
            break
        }
    }
    
    status := http.StatusOK
    if !allHealthy {
        status = http.StatusServiceUnavailable
    }
    
    c.JSON(status, gin.H{
        "status": "healthy",
        "checks": checks,
    })
}
```

## Core Pattern 7: Configuration Management

```go
// Environment-based configuration
package config

import (
    "os"
    "strconv"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    Log      LogConfig
}

type ServerConfig struct {
    Host string
    Port int
}

type DatabaseConfig struct {
    URL              string
    MaxConnections   int
    ConnectionTimeout int
}

type RedisConfig struct {
    Host string
    Port int
}

type LogConfig struct {
    Level string
    JSON  bool
}

func LoadConfig() *Config {
    return &Config{
        Server: ServerConfig{
            Host: getEnv("SERVER_HOST", "0.0.0.0"),
            Port: getEnvInt("SERVER_PORT", 8000),
        },
        Database: DatabaseConfig{
            URL:              getEnv("DATABASE_URL", ""),
            MaxConnections:   getEnvInt("DB_MAX_CONNECTIONS", 25),
            ConnectionTimeout: getEnvInt("DB_TIMEOUT", 30),
        },
        Redis: RedisConfig{
            Host: getEnv("REDIS_HOST", "localhost"),
            Port: getEnvInt("REDIS_PORT", 6379),
        },
        Log: LogConfig{
            Level: getEnv("LOG_LEVEL", "info"),
            JSON:  getEnvBool("LOG_JSON", false),
        },
    }
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
    value := os.Getenv(key)
    if value == "" {
        return defaultValue
    }
    
    intValue, err := strconv.Atoi(value)
    if err != nil {
        return defaultValue
    }
    return intValue
}

func getEnvBool(key string, defaultValue bool) bool {
    value := os.Getenv(key)
    if value == "" {
        return defaultValue
    }
    
    return value == "true" || value == "1"
}
```

## Core Pattern 8: Dependency Injection

```go
// Constructor-based dependency injection
package main

type UserService struct {
    repo    UserRepository
    cache   Cache
    logger  Logger
}

func NewUserService(repo UserRepository, cache Cache, logger Logger) *UserService {
    return &UserService{
        repo:   repo,
        cache:  cache,
        logger: logger,
    }
}

func (s *UserService) GetUser(ctx context.Context, id int64) (*User, error) {
    // Try cache first
    if user, ok := s.cache.Get(fmt.Sprintf("user:%d", id)); ok {
        return user.(*User), nil
    }
    
    // Get from repository
    user, err := s.repo.GetUser(ctx, id)
    if err != nil {
        s.logger.Error("failed to get user", "id", id, "error", err)
        return nil, err
    }
    
    // Cache result
    s.cache.Set(fmt.Sprintf("user:%d", id), user)
    
    return user, nil
}

// Application struct for wiring dependencies
type App struct {
    UserService *UserService
    Handler     *Handler
    Server      *http.Server
}

func NewApp(config *Config) *App {
    // Initialize dependencies
    logger := NewLogger(config.Log)
    repo := NewUserRepository(config.Database)
    cache := NewCache(config.Redis)
    
    userService := NewUserService(repo, cache, logger)
    handler := NewHandler(userService)
    
    server := &http.Server{
        Addr:    ":" + strconv.Itoa(config.Server.Port),
        Handler: handler.Routes(),
    }
    
    return &App{
        UserService: userService,
        Handler:     handler,
        Server:      server,
    }
}

func (a *App) Run() error {
    return a.Server.ListenAndServe()
}
```

## Anti-Patterns

### ❌ Goroutine Leaks

```go
// BAD: Goroutine leak - no cancellation
func FetchData(url string) {
    go func() {
        for {
            // Infinite loop, never exits
            http.Get(url)
        }
    }()
}

// GOOD: Use context for cancellation
func FetchData(ctx context.Context, url string) {
    go func() {
        for {
            select {
            case <-ctx.Done():
                return
            default:
                http.Get(url)
            }
        }
    }()
}
```

### ❌ Race Conditions

```go
// BAD: Data race
var count int
go func() { count++ }()
go func() { count++ }()

// GOOD: Use synchronization
var count int
var mu sync.Mutex

go func() {
    mu.Lock()
    count++
    mu.Unlock()
}()
```

### ❌ Ignoring Errors

```go
// BAD
file, _ := os.Open("data.txt")  // Error ignored!
json.Unmarshal(data, &obj)      // Error ignored!

// GOOD
file, err := os.Open("data.txt")
if err != nil {
    return err
}

if err := json.Unmarshal(data, &obj); err != nil {
    return err
}
```

## Schema Reference

- `go-specialist.input.schema.json` - Agent input requirements
- `go-specialist.output.schema.json` - Generated file structure

## Related Documentation

- Skill: `go-api-patterns.md` - API design patterns
- Agent: `go-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Go best practices
