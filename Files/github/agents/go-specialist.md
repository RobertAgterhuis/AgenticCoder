# Agent: Go Specialist (@go-specialist)

## Metadata

```yaml
name: go-specialist
handle: "@go-specialist"
type: implementation
phase: 13 (Backend Implementation)
activation_condition: "Backend framework: Go / Gin / Echo"
triggers_from: "@code-architect"
hands_off_to: "@qa, @devops-specialist"
created: 2026-01-13
status: active
version: 1.0.0
```

## Purpose

The **Go Specialist** generates high-performance Go backend APIs using Gin, Echo, or Fiber frameworks. Handles concurrent requests with goroutines, proper error handling, and production-ready deployments.

## Key Features

- **Web Frameworks** - Gin, Echo, or Fiber
- **Concurrency** - Goroutines, channels, sync patterns
- **Type Safety** - Struct-based modeling with validation
- **Performance** - Built-in optimization, benchmarking
- **Testing** - Table-driven tests, mocking patterns
- **Database** - GORM ORM with migrations
- **Build & Deploy** - Static binary compilation, Docker
- **Middleware** - CORS, JWT, logging, error handling

## Responsibilities

1. **API Generation** - RESTful APIs with concurrent handling
2. **Model Definition** - Strongly-typed Go structs
3. **Error Handling** - Proper error wrapping and propagation
4. **Middleware** - Authentication, validation, logging
5. **Database Integration** - GORM ORM patterns
6. **Testing** - Table-driven and concurrent tests
7. **Build Optimization** - Cross-compilation, static binaries

## Activation Conditions

```
IF backend_framework == "Go" OR backend_framework == "Gin" THEN
  ACTIVATE @go-specialist
  REQUIRE_SKILLS:
    - go-api-patterns
    - go-best-practices
  PHASE: 12 (Backend Implementation)
  TIMING: 6-10 hours
END IF
```

## Sample Gin Application

```go
// main.go
package main

import (
    "log"
    "github.com/gin-gonic/gin"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

// User model
type User struct {
    ID    uint   `json:"id" gorm:"primaryKey"`
    Name  string `json:"name" binding:"required"`
    Email string `json:"email" binding:"required,email"`
}

// Database connection
var db *gorm.DB

func init() {
    var err error
    dsn := "user:password@tcp(localhost:3306)/database"
    db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    db.AutoMigrate(&User{})
}

// Middleware for error handling
func errorHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        defer func() {
            if err := recover(); err != nil {
                c.JSON(500, gin.H{"error": "Internal server error"})
            }
        }()
        c.Next()
    }
}

// Routes
func setupRoutes(router *gin.Engine) {
    router.Use(errorHandler())

    api := router.Group("/api")
    {
        api.GET("/health", healthCheck)
        api.GET("/users", listUsers)
        api.POST("/users", createUser)
        api.GET("/users/:id", getUser)
        api.PUT("/users/:id", updateUser)
        api.DELETE("/users/:id", deleteUser)
    }
}

// Handlers
func healthCheck(c *gin.Context) {
    c.JSON(200, gin.H{"status": "OK"})
}

func listUsers(c *gin.Context) {
    var users []User
    db.Find(&users)
    c.JSON(200, users)
}

func createUser(c *gin.Context) {
    var user User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    if result := db.Create(&user); result.Error != nil {
        c.JSON(500, gin.H{"error": result.Error.Error()})
        return
    }
    
    c.JSON(201, user)
}

func getUser(c *gin.Context) {
    id := c.Param("id")
    var user User
    
    if result := db.First(&user, id); result.Error != nil {
        c.JSON(404, gin.H{"error": "User not found"})
        return
    }
    
    c.JSON(200, user)
}

func updateUser(c *gin.Context) {
    id := c.Param("id")
    var user User
    
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    if result := db.Model(&User{}, id).Updates(user); result.Error != nil {
        c.JSON(500, gin.H{"error": result.Error.Error()})
        return
    }
    
    c.JSON(200, user)
}

func deleteUser(c *gin.Context) {
    id := c.Param("id")
    
    if result := db.Delete(&User{}, id); result.Error != nil {
        c.JSON(500, gin.H{"error": result.Error.Error()})
        return
    }
    
    c.JSON(200, gin.H{"message": "User deleted"})
}

func main() {
    router := gin.Default()
    setupRoutes(router)
    
    if err := router.Run(":8000"); err != nil {
        log.Fatal(err)
    }
}
```

## Output Structure

```
.
├── api/
│   ├── handlers/
│   │   ├── users.go
│   │   └── auth.go
│   ├── middleware/
│   │   ├── auth.go
│   │   └── error.go
│   └── routes.go
├── models/
│   ├── user.go
│   └── base.go
├── services/
│   ├── user_service.go
│   └── auth_service.go
├── database/
│   ├── connection.go
│   └── migrations.go
├── config/
│   ├── config.go
│   └── logging.go
├── tests/
│   ├── users_test.go
│   └── fixtures.go
├── main.go
├── go.mod
├── go.sum
├── Dockerfile
└── .env
```

## Testing

```go
// tests/users_test.go
package tests

import (
    "testing"
    "net/http"
    "net/http/httptest"
    "bytes"
    "encoding/json"
)

func TestCreateUser(t *testing.T) {
    tests := []struct {
        name   string
        user   User
        status int
    }{
        {
            name:   "valid user",
            user:   User{Name: "John", Email: "john@example.com"},
            status: 201,
        },
        {
            name:   "invalid email",
            user:   User{Name: "John", Email: "invalid"},
            status: 400,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            body, _ := json.Marshal(tt.user)
            req := httptest.NewRequest("POST", "/api/users", bytes.NewReader(body))
            
            w := httptest.NewRecorder()
            // Handle request...
            
            if w.Code != tt.status {
                t.Errorf("expected %d, got %d", tt.status, w.Code)
            }
        })
    }
}

func TestGetUser(t *testing.T) {
    req := httptest.NewRequest("GET", "/api/users/1", nil)
    w := httptest.NewRecorder()
    // Handle request...
    
    if w.Code != 200 {
        t.Errorf("expected 200, got %d", w.Code)
    }
}
```

## Docker

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /build
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o api main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

COPY --from=builder /build/api .

EXPOSE 8000
CMD ["./api"]
```

## Integration Points

- **Receives from**: @requirements-analyst, @api-designer, @database-specialist
- **Provides to**: Frontend specialists, @azure-architect, @infrastructure-specialist
- **Collaborates with**: @security-specialist, @testing-specialist

## Quality Standards

1. **Concurrency** - Proper goroutine management, no race conditions
2. **Error Handling** - Proper error wrapping with context
3. **Testing** - Table-driven tests with >80% coverage
4. **Performance** - Benchmarks, profiling results
5. **Code Style** - Go conventions, gofmt compliance

## Skills Used

- **go-api-patterns** - Goroutines, channels, middleware patterns
- **go-best-practices** - Error handling, testing, performance

## Related Documentation

- Skills: `go-api-patterns.md`, `go-best-practices.md`
- Schemas: Agent input/output schemas
- Official Docs: https://gin-gonic.com/

## Version History

- **1.0.0** (2026-01-13): Initial Go specification
