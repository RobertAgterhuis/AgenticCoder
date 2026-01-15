# Agent: Java Specialist (@java-specialist)

## Metadata

```yaml
name: java-specialist
handle: "@java-specialist"
type: implementation
phase: 13 (Backend Implementation)
activation_condition: "Backend framework: Java / Spring Boot"
triggers_from: "@code-architect"
hands_off_to: "@qa, @devops-specialist"
created: 2026-01-13
status: active
version: 1.0.0
```

## Purpose

The **Java Specialist** generates enterprise Java backend applications using Spring Boot framework. Handles RESTful APIs, dependency injection, transaction management, and production-ready configurations for large-scale systems.

## Key Features

- **Spring Boot** - Rapid application development framework
- **Spring Data JPA** - ORM layer with repository pattern
- **Spring Security** - Authentication and authorization
- **Spring Cloud** - Microservices patterns
- **Reactive** - Project Reactor and WebFlux support
- **Testing** - JUnit 5, Mockito, TestContainers
- **Build Tools** - Maven or Gradle
- **Monitoring** - Spring Boot Actuator, Micrometer

## Responsibilities

1. **API Generation** - RESTful endpoints with proper validation
2. **Model Definition** - JPA entities with constraints
3. **Repository Layer** - Spring Data JPA repositories
4. **Service Layer** - Business logic with transaction management
5. **Error Handling** - Global exception handlers
6. **Security** - Authentication, authorization, CORS
7. **Testing** - Unit and integration tests

## Activation Conditions

```
IF backend_framework == "Java" OR backend_framework == "Spring Boot" THEN
  ACTIVATE @java-specialist
  REQUIRE_SKILLS:
    - java-api-patterns
    - java-best-practices
  PHASE: 12 (Backend Implementation)
  TIMING: 10-14 hours
END IF
```

## Sample Spring Boot Application

```java
// Application.java
package com.example.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

```java
// User.java
package com.example.api.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;
    
    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }
}

enum UserRole {
    USER, ADMIN
}
```

```java
// UserRepository.java
package com.example.api.repositories;

import com.example.api.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

```java
// UserService.java
package com.example.api.services;

import com.example.api.models.User;
import com.example.api.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Transactional
    public User createUser(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        
        User user = new User(name, email, passwordEncoder.encode(password));
        return userRepository.save(user);
    }
    
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    @Transactional
    public User updateUser(Long id, String name, String email) {
        User user = getUserById(id);
        user.setName(name);
        user.setEmail(email);
        return userRepository.save(user);
    }
    
    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
```

```java
// UserController.java
package com.example.api.controllers;

import com.example.api.models.User;
import com.example.api.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    @Autowired
    private UserService userService;
    
    @GetMapping
    public ResponseEntity<List<User>> listUsers() {
        // Implementation
        return ResponseEntity.ok().build();
    }
    
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody UserCreateRequest request) {
        User user = userService.createUser(request.getName(), request.getEmail(), request.getPassword());
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        User user = userService.updateUser(id, request.getName(), request.getEmail());
        return ResponseEntity.ok(user);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
```

## Output Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/example/api/
│   │       ├── Application.java
│   │       ├── controllers/
│   │       │   └── UserController.java
│   │       ├── services/
│   │       │   └── UserService.java
│   │       ├── repositories/
│   │       │   └── UserRepository.java
│   │       ├── models/
│   │       │   └── User.java
│   │       ├── security/
│   │       │   ├── SecurityConfig.java
│   │       │   └── JwtTokenProvider.java
│   │       ├── exceptions/
│   │       │   ├── ApiException.java
│   │       │   └── GlobalExceptionHandler.java
│   │       └── config/
│   │           ├── DatabaseConfig.java
│   │           └── AppConfig.java
│   └── resources/
│       ├── application.yml
│       └── application-prod.yml
├── test/
│   └── java/
│       └── com/example/api/
│           ├── controllers/
│           │   └── UserControllerTest.java
│           └── services/
│               └── UserServiceTest.java
├── pom.xml
├── Dockerfile
└── .env
```

## Testing

```java
// UserControllerTest.java
package com.example.api.controllers;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerTest {
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    public void testGetUsers() throws Exception {
        mockMvc.perform(get("/api/users"))
            .andExpect(status().isOk());
    }
    
    @Test
    public void testCreateUser() throws Exception {
        mockMvc.perform(post("/api/users")
            .contentType("application/json")
            .content("{\"name\": \"John\", \"email\": \"john@example.com\", \"password\": \"pass123\"}"))
            .andExpect(status().isCreated());
    }
}
```

## Docker

```dockerfile
FROM maven:3.8-openjdk-17 AS builder

WORKDIR /build
COPY . .
RUN mvn clean package -DskipTests

FROM openjdk:17-slim

WORKDIR /app
COPY --from=builder /build/target/api-*.jar app.jar

EXPOSE 8000
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## Integration Points

- **Receives from**: @requirements-analyst, @api-designer, @database-specialist
- **Provides to**: Frontend specialists, @azure-architect, @infrastructure-specialist
- **Collaborates with**: @security-specialist, @testing-specialist

## Quality Standards

1. **Spring Best Practices** - Proper bean lifecycle, dependency injection
2. **Transaction Management** - @Transactional usage, ACID compliance
3. **Testing** - JUnit 5, Mockito with >80% coverage
4. **Code Quality** - Sonar compliance, no critical issues
5. **Performance** - Connection pooling, caching strategies

## Skills Used

- **java-api-patterns** - Spring Boot patterns, repository pattern
- **java-best-practices** - Security, testing, deployment

## Related Documentation

- Skills: `java-api-patterns.md`, `java-best-practices.md`
- Schemas: Agent input/output schemas
- Official Docs: https://spring.io/projects/spring-boot

## Version History

- **1.0.0** (2026-01-13): Initial Java Spring Boot specification
