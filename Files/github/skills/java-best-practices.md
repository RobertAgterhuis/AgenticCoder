# Skill: Java Best Practices (@java-best-practices)

## Metadata

```yaml
name: java-best-practices
agents: ["@java-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Java Best Practices** skill provides comprehensive guidance on building production-ready Spring Boot applications with emphasis on performance, security, testing, monitoring, and deployment.

## Scope

**Included**:
- Performance optimization and profiling
- Security best practices and authentication
- Testing strategies (unit, integration, E2E)
- Build and deployment optimization
- Docker containerization
- Monitoring and observability
- Code quality and style standards
- Memory management and GC tuning

**Excluded**:
- Advanced Spring Cloud microservices
- GraphQL implementations
- Low-level JVM tuning (advanced topic)

## Core Pattern 1: Performance Optimization

```java
// Connection pooling configuration
@Configuration
public class DataSourceConfig {
    
    @Bean
    public HikariConfig hikariConfig() {
        HikariConfig config = new HikariConfig();
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(20000);
        config.setIdleTimeout(300000);
        config.setMaxLifetime(1200000);
        config.setAutoCommit(true);
        config.setLeakDetectionThreshold(60000);
        
        return config;
    }
    
    @Bean
    public DataSource dataSource(HikariConfig hikariConfig) {
        return new HikariDataSource(hikariConfig);
    }
}

// Query optimization with JPQL
@Query("SELECT new com.example.dto.UserDTO(u.id, u.name, u.email) FROM User u WHERE u.id = :id")
Optional<UserDTO> findUserDTOById(@Param("id") Long id);

// Lazy loading to prevent N+1
@Entity
public class User {
    @OneToMany(fetch = FetchType.LAZY, mappedBy = "user")
    private List<Post> posts;
}

// Batch processing
@Transactional
public void processBatch(List<User> users) {
    for (int i = 0; i < users.size(); i++) {
        userRepository.save(users.get(i));
        
        if ((i + 1) % 100 == 0) {
            entityManager.flush();
            entityManager.clear();
        }
    }
}

// Caching strategy
@Service
@Transactional(readOnly = true)
public class UserService {
    
    @Cacheable("users")
    public User getUser(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    @CacheEvict(value = "users", key = "#id")
    public void updateUser(Long id, UserUpdate update) {
        // Update logic
    }
}
```

## Core Pattern 2: Security Best Practices

```java
// Spring Security configuration
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .and()
            .authorizeRequests()
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/api/users/**").hasRole("USER")
                .antMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .formLogin()
                .loginPage("/login")
                .permitAll()
            .and()
            .logout()
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login")
                .permitAll()
            .and()
            .cors().and()
            .httpBasic();
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
    
    @Bean
    public UserDetailsService userDetailsService() {
        return new CustomUserDetailsService();
    }
}

// JWT token provider
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private long jwtExpirationMs;
    
    public String generateToken(String username) {
        return Jwts.builder()
            .setSubject(username)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
    
    public String getUsernameFromToken(String token) {
        return Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}

// Input validation and sanitization
@Service
@RequiredArgsConstructor
public class UserService {
    
    public void createUser(UserCreateRequest request) {
        // Validate input
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ValidationException("Name is required");
        }
        
        // Sanitize input
        String sanitizedName = HtmlUtils.htmlEscape(request.getName());
        String sanitizedEmail = request.getEmail().toLowerCase().trim();
        
        // Create with sanitized data
        User user = User.builder()
            .name(sanitizedName)
            .email(sanitizedEmail)
            .build();
        
        userRepository.save(user);
    }
}

// HTTPS enforcement
@Configuration
public class HttpsConfig {
    
    @Bean
    public ServletWebServerFactory servletWebServerFactory() {
        TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
        
        factory.addConnectorCustomizers(connector -> {
            connector.setScheme("https");
            connector.setSecure(true);
            connector.setPort(8443);
        });
        
        return factory;
    }
}
```

## Core Pattern 3: Testing Strategy

```java
// Unit tests
@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    @DisplayName("Should create user with valid input")
    void shouldCreateUser() {
        // Arrange
        UserCreateRequest request = new UserCreateRequest();
        request.setName("John");
        request.setEmail("john@example.com");
        request.setPassword("SecurePass123!");
        
        User expectedUser = User.builder()
            .id(1L)
            .name("John")
            .email("john@example.com")
            .build();
        
        when(userRepository.save(any(User.class))).thenReturn(expectedUser);
        
        // Act
        UserResponse result = userService.createUser(request);
        
        // Assert
        assertNotNull(result);
        assertEquals("john@example.com", result.getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }
}

// Integration tests
@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private UserRepository userRepository;
    
    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }
    
    @Test
    @DisplayName("Should create user via REST endpoint")
    void shouldCreateUserViaRest() throws Exception {
        String json = """
            {
                "name": "John",
                "email": "john@example.com",
                "password": "SecurePass123!"
            }
            """;
        
        mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content(json))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("john@example.com"));
    }
}

// Test containers for database testing
@SpringBootTest
@Testcontainers
public class UserRepositoryTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("testdb")
        .withUsername("testuser")
        .withPassword("testpass");
    
    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void shouldFindUserByEmail() {
        User user = User.builder()
            .name("John")
            .email("john@example.com")
            .build();
        
        userRepository.save(user);
        
        Optional<User> found = userRepository.findByEmail("john@example.com");
        
        assertTrue(found.isPresent());
        assertEquals("John", found.get().getName());
    }
}
```

## Core Pattern 4: Logging and Monitoring

```java
// SLF4J with Logback
@Slf4j
@Service
public class UserService {
    
    public UserResponse createUser(UserCreateRequest request) {
        log.info("Creating user with email: {}", request.getEmail());
        
        try {
            // Create user logic
            log.debug("User created with ID: {}", user.getId());
            return toResponse(user);
        } catch (Exception e) {
            log.error("Failed to create user with email: {}", request.getEmail(), e);
            throw e;
        }
    }
}

// Micrometer metrics
@Component
@RequiredArgsConstructor
public class UserMetrics {
    
    private final MeterRegistry meterRegistry;
    
    public void recordUserCreation() {
        Counter.builder("users.created")
            .description("Total users created")
            .register(meterRegistry)
            .increment();
    }
    
    public void recordProcessingTime(long duration) {
        Timer.builder("user.processing.time")
            .description("User processing duration")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(meterRegistry)
            .record(duration, TimeUnit.MILLISECONDS);
    }
}

// Actuator endpoints configuration
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,info,prometheus
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true

// Custom health indicator
@Component
public class DatabaseHealthIndicator extends AbstractHealthIndicator {
    
    @Autowired
    private DataSource dataSource;
    
    @Override
    protected void doHealthCheck(Health.Builder builder) {
        try {
            Connection connection = dataSource.getConnection();
            connection.close();
            builder.up().withDetail("database", "MySQL");
        } catch (Exception e) {
            builder.down().withException(e);
        }
    }
}
```

## Core Pattern 5: Build Optimization

```java
// Maven POM configuration
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>api</artifactId>
    <version>1.0.0</version>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>

// Gradle build
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.0'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.example'
version = '1.0.0'
sourceCompatibility = '17'

configurations {
    compileOnly {
        extendsFrom annotationProcessor
    }
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    runtimeOnly 'com.mysql:mysql-connector-j'
    
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

test {
    useJUnitPlatform()
}
```

## Core Pattern 6: Docker Deployment

```dockerfile
# Multi-stage build
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

# Runtime image
FROM eclipse-temurin:17-jdk-alpine

RUN apk add --no-cache curl

WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar

RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/actuator/health || exit 1

ENTRYPOINT ["java", "-Xmx512m", "-Xms256m", "-jar", "app.jar"]
```

## Core Pattern 7: Configuration Management

```java
// Application properties
spring:
  application:
    name: api
  
  server:
    port: 8000
    servlet:
      context-path: /
  
  datasource:
    url: jdbc:mysql://localhost:3306/app_db?useSSL=false&serverTimezone=UTC
    username: ${DB_USER:root}
    password: ${DB_PASSWORD:password}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
  
  jpa:
    hibernate:
      ddl-auto: validate
    database-platform: org.hibernate.dialect.MySQL8Dialect
  
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=1000,expireAfterWrite=10m
  
  security:
    user:
      name: admin
      password: admin

// Environment-specific profiles
# application-prod.yml
spring:
  datasource:
    url: jdbc:mysql://prod-db:3306/app_db
    username: ${DB_USER}
    password: ${DB_PASSWORD}
  
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true

// Configuration properties class
@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {
    private String name;
    private String version;
    private int maxRequestSize = 10485760;
    private int cacheExpirySeconds = 3600;
}
```

## Core Pattern 8: Code Quality

```java
// Checkstyle configuration
<module name="Checker">
    <module name="LineLength">
        <property name="max" value="120"/>
    </module>
    <module name="TreeWalker">
        <module name="NeedBraces"/>
        <module name="MethodLength">
            <property name="max" value="50"/>
        </module>
        <module name="ParameterNumber">
            <property name="max" value="5"/>
        </module>
    </module>
</module>

// SonarQube analysis
// pom.xml
<properties>
    <sonar.projectKey>com.example:api</sonar.projectKey>
    <sonar.host.url>http://sonarqube:9000</sonar.host.url>
</properties>

// Run analysis
// mvn clean verify sonar:sonar

// SpotBugs for bug detection
<plugin>
    <groupId>com.github.spotbugs</groupId>
    <artifactId>spotbugs-maven-plugin</artifactId>
    <version>4.7.3.4</version>
</plugin>
```

## Anti-Patterns

### ❌ Mutable Shared State

```java
// BAD: Mutable shared state
@Service
public class UserService {
    private List<User> cachedUsers = new ArrayList<>();  // Not thread-safe!
}

// GOOD: Use immutable or synchronized
@Service
@RequiredArgsConstructor
public class UserService {
    private final Cache cache;  // Thread-safe cache
}
```

### ❌ Missing Null Checks

```java
// BAD: Potential null pointer exception
public void processUser(User user) {
    String email = user.getEmail().toLowerCase();  // User could be null!
}

// GOOD: Explicit null handling
public void processUser(User user) {
    if (user == null || user.getEmail() == null) {
        throw new ValidationException("User and email are required");
    }
    String email = user.getEmail().toLowerCase();
}

// Or use Optional
public void processUser(Optional<User> user) {
    user.ifPresent(u -> {
        String email = u.getEmail().toLowerCase();
    });
}
```

### ❌ Resource Leaks

```java
// BAD: Resource leak
public byte[] readFile(String filename) throws IOException {
    FileInputStream fis = new FileInputStream(filename);
    return fis.readAllBytes();  // Stream not closed!
}

// GOOD: Try-with-resources
public byte[] readFile(String filename) throws IOException {
    try (FileInputStream fis = new FileInputStream(filename)) {
        return fis.readAllBytes();  // Auto-closed
    }
}
```

## Schema Reference

- `java-specialist.input.schema.json` - Agent input requirements
- `java-specialist.output.schema.json` - Generated file structure

## Related Documentation

- Skill: `java-api-patterns.md` - API design patterns
- Agent: `java-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Java best practices
