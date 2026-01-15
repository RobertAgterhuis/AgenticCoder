# Skill: Java API Patterns (@java-api-patterns)

## Metadata

```yaml
name: java-api-patterns
agents: ["@java-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Java API Patterns** skill provides comprehensive patterns for building enterprise RESTful APIs using Spring Boot. Covers dependency injection, reactive programming, database patterns, error handling, and production-ready configurations.

## Scope

**Included**:
- Spring Boot application structure
- Controller and service layers
- Spring Data JPA repositories
- Exception handling and validation
- Request/response mapping
- Database transactions
- Security and authentication
- Testing with Spring Boot Test

**Excluded**:
- GraphQL (separate implementation)
- gRPC (different protocol)
- Microservices deployment orchestration
- Advanced Spring Cloud patterns

## Core Pattern 1: Controller Layer

```java
// RestController with proper validation and error handling
package com.example.api.controllers;

import com.example.api.models.User;
import com.example.api.services.UserService;
import com.example.api.dto.UserCreateRequest;
import com.example.api.dto.UserUpdateRequest;
import com.example.api.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @GetMapping
    public ResponseEntity<Page<UserResponse>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserResponse> users = search != null && !search.isEmpty()
            ? userService.searchUsers(search, pageable)
            : userService.listUsers(pageable);
        
        return ResponseEntity.ok(users);
    }
    
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        UserResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request
    ) {
        UserResponse user = userService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
```

## Core Pattern 2: Service Layer

```java
// Service layer with transaction management
package com.example.api.services;

import com.example.api.models.User;
import com.example.api.repositories.UserRepository;
import com.example.api.dto.UserCreateRequest;
import com.example.api.dto.UserUpdateRequest;
import com.example.api.dto.UserResponse;
import com.example.api.exceptions.ResourceNotFoundException;
import com.example.api.exceptions.ConflictException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public Page<UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
            .map(this::toResponse);
    }
    
    public Page<UserResponse> searchUsers(String query, Pageable pageable) {
        return userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            query, query, pageable
        ).map(this::toResponse);
    }
    
    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }
        
        User user = User.builder()
            .name(request.getName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .build();
        
        User saved = userRepository.save(user);
        return toResponse(saved);
    }
    
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return toResponse(user);
    }
    
    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }
        
        User updated = userRepository.save(user);
        return toResponse(updated);
    }
    
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }
    
    private UserResponse toResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
```

## Core Pattern 3: Repository Pattern with Custom Queries

```java
// Spring Data JPA repository with custom queries
package com.example.api.repositories;

import com.example.api.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
        String name,
        String email,
        Pageable pageable
    );
    
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.isActive = true")
    Optional<User> findActiveByEmail(@Param("email") String email);
    
    @Query("SELECT u FROM User u WHERE u.createdAt > :from AND u.createdAt < :to")
    List<User> findRecentUsers(
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );
    
    @Query(value = "SELECT * FROM users WHERE role = :role ORDER BY created_at DESC",
           nativeQuery = true)
    Page<User> findByRole(@Param("role") String role, Pageable pageable);
}
```

## Core Pattern 4: Exception Handling

```java
// Global exception handling
package com.example.api.exceptions;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class APIException extends RuntimeException {
    private final String code;
    private final HttpStatus status;
    
    public APIException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

public class ResourceNotFoundException extends APIException {
    public ResourceNotFoundException(String resource, String field, Object value) {
        super(
            "RESOURCE_NOT_FOUND",
            String.format("%s with %s=%s not found", resource, field, value),
            HttpStatus.NOT_FOUND
        );
    }
}

public class ConflictException extends APIException {
    public ConflictException(String message) {
        super("CONFLICT", message, HttpStatus.CONFLICT);
    }
}

public class ValidationException extends APIException {
    public ValidationException(String message) {
        super("VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST);
    }
}

// Global exception handler
package com.example.api.exceptions;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(APIException.class)
    public ResponseEntity<ErrorResponse> handleAPIException(APIException ex, WebRequest request) {
        log.error("API Exception: {}", ex.getMessage());
        
        ErrorResponse response = ErrorResponse.builder()
            .code(ex.getCode())
            .message(ex.getMessage())
            .path(request.getDescription(false).replace("uri=", ""))
            .timestamp(LocalDateTime.now())
            .build();
        
        return new ResponseEntity<>(response, ex.getStatus());
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
        MethodArgumentNotValidException ex,
        WebRequest request
    ) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ErrorResponse response = ErrorResponse.builder()
            .code("VALIDATION_ERROR")
            .message("Request validation failed")
            .path(request.getDescription(false).replace("uri=", ""))
            .timestamp(LocalDateTime.now())
            .details(errors)
            .build();
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, WebRequest request) {
        log.error("Unexpected error", ex);
        
        ErrorResponse response = ErrorResponse.builder()
            .code("INTERNAL_SERVER_ERROR")
            .message("An unexpected error occurred")
            .path(request.getDescription(false).replace("uri=", ""))
            .timestamp(LocalDateTime.now())
            .build();
        
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

## Core Pattern 5: Validation

```java
// Request validation with annotations
package com.example.api.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {
    
    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
        message = "Password must contain lowercase, uppercase, digit, and special character"
    )
    private String password;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    
    @Size(min = 1, max = 100, message = "Name must be between 1 and 100 characters")
    private String name;
    
    @Email(message = "Email must be valid")
    private String email;
}

// Custom validators
package com.example.api.validation;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.lang.annotation.*;

@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UniqueEmailValidator.class)
public @interface UniqueEmail {
    String message() default "Email must be unique";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {
    
    private final UserRepository userRepository;
    
    public UniqueEmailValidator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        return !userRepository.existsByEmail(email);
    }
}
```

## Core Pattern 6: Pagination and Sorting

```java
// Proper pagination handling
@GetMapping
public ResponseEntity<Page<UserResponse>> listUsers(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(defaultValue = "createdAt") String sortBy,
    @RequestParam(defaultValue = "DESC") Sort.Direction direction
) {
    // Validate pagination parameters
    if (page < 0 || size < 1 || size > 100) {
        throw new ValidationException("Invalid pagination parameters");
    }
    
    Sort sort = Sort.by(direction, sortBy);
    Pageable pageable = PageRequest.of(page, size, sort);
    
    Page<UserResponse> result = userService.listUsers(pageable);
    
    return ResponseEntity.ok()
        .header("X-Total-Elements", String.valueOf(result.getTotalElements()))
        .header("X-Total-Pages", String.valueOf(result.getTotalPages()))
        .header("X-Current-Page", String.valueOf(result.getNumber()))
        .body(result);
}
```

## Core Pattern 7: Caching

```java
// Spring Cache abstraction
package com.example.api.services;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;

@Service
@RequiredArgsConstructor
public class UserService {
    
    @Cacheable(value = "users", key = "#id")
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return toResponse(user);
    }
    
    @CachePut(value = "users", key = "#result.id")
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        // Update logic
        return userService.updateUser(id, request);
    }
    
    @CacheEvict(value = "users", key = "#id")
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    @CacheEvict(value = "users", allEntries = true)
    public void clearCache() {
    }
}

// Cache configuration
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("users", "posts");
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .expireAfterWrite(10, TimeUnit.MINUTES)
            .maximumSize(1000));
        return cacheManager;
    }
}
```

## Core Pattern 8: Database Relationships

```java
// One-to-Many relationships
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Post> posts = new ArrayList<>();
}

@Entity
@Table(name = "posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}

// Many-to-Many relationships
@Entity
@Table(name = "users")
public class User {
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
}

@Entity
@Table(name = "roles")
public class Role {
    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new HashSet<>();
}
```

## Anti-Patterns

### ❌ N+1 Queries

```java
// BAD: N+1 query problem
List<User> users = userRepository.findAll();
for (User user : users) {
    List<Post> posts = postRepository.findByUserId(user.getId());  // Separate query per user!
}

// GOOD: Use eager loading
@Query("SELECT u FROM User u LEFT JOIN FETCH u.posts")
List<User> findAllWithPosts();

// Or use projection
@Query("SELECT new com.example.dto.UserWithPosts(u.id, u.name, p) FROM User u LEFT JOIN u.posts p")
List<UserWithPosts> findAllWithPostsProjection();
```

### ❌ Loose Transactions

```java
// BAD: No transaction management
public void transferMoney(Account from, Account to, BigDecimal amount) {
    from.withdraw(amount);  // If next line fails, partial update
    to.deposit(amount);
}

// GOOD: Transactional
@Transactional
public void transferMoney(Account from, Account to, BigDecimal amount) {
    from.withdraw(amount);
    to.deposit(amount);
    // All or nothing
}
```

### ❌ Missing Validation

```java
// BAD: No validation
public void createUser(String name, String email, String password) {
    // No checks!
}

// GOOD: Comprehensive validation
public void createUser(@NotBlank @Size(min=1, max=100) String name,
                      @NotBlank @Email String email,
                      @NotBlank @Size(min=8) String password) {
    // Validation automatic
}
```

## Schema Reference

- `java-specialist.input.schema.json` - Agent input requirements
- `java-specialist.output.schema.json` - Generated file structure

## Related Documentation

- Skill: `java-best-practices.md` - Performance and deployment
- Agent: `java-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Java API patterns
