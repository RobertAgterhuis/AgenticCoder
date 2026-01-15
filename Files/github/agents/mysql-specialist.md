# Agent: MySQL Specialist (@mysql-specialist)

## Metadata

```yaml
name: mysql-specialist
handle: "@mysql-specialist"
type: implementation
phase: 15 (Database Implementation)
activation_condition: "Database: MySQL"
triggers_from: "@code-architect"
hands_off_to: "@docker-specialist (optional), @devops-specialist"
created: 2026-01-13
status: active
version: 1.0.0
```

## Purpose

The **MySQL Specialist** designs and generates optimized MySQL database schemas with proper indexing, normalization, and performance configurations. Handles migrations, connection pooling, and production-ready database setup.

## Key Features

- **Schema Design** - Normalized database structures
- **Indexing Strategy** - Optimized query performance
- **Migrations** - Version control for schema changes
- **Connection Pooling** - HikariCP, Drizzle, or similar
- **Performance** - Query optimization, EXPLAIN analysis
- **Backups** - Backup strategies and automation
- **Replication** - Read replicas and high availability
- **Monitoring** - Query logs, slow query analysis

## Responsibilities

1. **Schema Generation** - Create optimized database tables
2. **Index Design** - Composite and single-column indexes
3. **Relationships** - Foreign keys and constraints
4. **Migrations** - Version control with Flyway or Liquibase
5. **Performance** - Query optimization and monitoring
6. **Backups** - Automated backup configurations
7. **Scaling** - Partitioning and replication setup

## Activation Conditions

```
IF database == "MySQL" OR database == "MariaDB" THEN
  ACTIVATE @mysql-specialist
  REQUIRE_SKILLS:
    - mysql-schema-patterns
    - mysql-optimization
  PHASE: 13 (Database & Infrastructure)
  TIMING: 4-8 hours
END IF
```

## Sample Schema

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS app_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE app_db;

-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE KEY,
    email VARCHAR(255) NOT NULL UNIQUE KEY,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Roles table
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User roles junction table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit log table
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100),
    resource_id BIGINT,
    changes JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_resource (resource_type, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sessions table
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Migrations Example

```sql
-- V1_2_0__Add_user_preferences.sql
ALTER TABLE users ADD COLUMN theme VARCHAR(20) DEFAULT 'light';
ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';

-- V1_2_1__Create_user_preferences_table.sql
CREATE TABLE user_preferences (
    user_id BIGINT PRIMARY KEY,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_digest ENUM('daily', 'weekly', 'none') DEFAULT 'weekly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Connection Configuration

```java
// application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/app_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: ${DB_USER:root}
    password: ${DB_PASSWORD:password}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 20000
      idle-timeout: 300000
      max-lifetime: 1200000
      auto-commit: true
      leak-detection-threshold: 60000
  
  jpa:
    database-platform: org.hibernate.dialect.MySQL8Dialect
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true
        jdbc:
          batch_size: 20
          fetch_size: 50
        order_inserts: true
        order_updates: true
```

## Query Optimization Examples

```sql
-- Bad: N+1 query problem
SELECT * FROM users;
-- Then loop and query roles...

-- Good: Single JOIN
SELECT u.*, r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.is_active = TRUE
ORDER BY u.created_at DESC;

-- Optimization: Use EXPLAIN
EXPLAIN SELECT u.*, r.name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Index for common queries
CREATE INDEX idx_active_created 
ON users(is_active, created_at DESC);

-- Partitioning by date for large tables
ALTER TABLE audit_logs PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```

## Backup Configuration

```yaml
# backup-config.yml
backup:
  schedule:
    full: "0 2 * * 0"  # Weekly Sunday at 2 AM
    incremental: "0 3 * * *"  # Daily at 3 AM
  
  retention:
    full_backups: 12  # Keep 12 weekly backups (3 months)
    incremental_backups: 7  # Keep 7 daily incremental backups
  
  storage:
    path: /backups/mysql
    remote:
      enabled: true
      type: s3
      bucket: app-db-backups
      region: us-east-1
  
  encryption:
    enabled: true
    algorithm: AES-256
    key_vault: aws-kms
```

## Monitoring Queries

```sql
-- Slow query log check
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
SET GLOBAL long_query_time = 2;

-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'app_db'
ORDER BY data_length DESC;

-- Monitor active queries
SELECT 
    id,
    user,
    host,
    db,
    command,
    time,
    state,
    info
FROM information_schema.processlist
WHERE db = 'app_db';

-- Check index usage
SELECT 
    object_schema,
    object_name,
    count_read,
    count_write
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE object_schema = 'app_db'
ORDER BY count_read DESC;
```

## Output Structure

```
database/
├── schema/
│   ├── 001_init.sql
│   ├── 002_create_audit_log.sql
│   └── 003_create_sessions.sql
├── migrations/
│   ├── V1_0_0__Initial_schema.sql
│   ├── V1_1_0__Add_user_preferences.sql
│   └── V1_2_0__Add_audit_timestamps.sql
├── seeds/
│   ├── roles.sql
│   └── default_data.sql
├── procedures/
│   └── cleanup_expired_sessions.sql
├── triggers/
│   └── audit_user_changes.sql
├── backups/
│   └── backup_config.yml
├── config/
│   ├── my.cnf
│   └── application.yml
├── monitoring/
│   └── queries.sql
└── documentation/
    └── schema_design.md
```

## Integration Points

- **Receives from**: @requirements-analyst, @database-specialist, backend specialists
- **Provides to**: All backend specialists (Node, Python, Go, Java)
- **Collaborates with**: @infrastructure-specialist, @security-specialist

## Quality Standards

1. **Normalization** - 3NF minimum, denormalization justified
2. **Indexing** - Indexed for common queries, EXPLAIN analysis
3. **Performance** - Query response time <100ms for common operations
4. **Backup** - Automated daily with 3-month retention
5. **Security** - Encryption at rest/transit, access control

## Skills Used

- **mysql-schema-patterns** - Database design, normalization, relationships
- **mysql-optimization** - Indexing, query optimization, monitoring

## Related Documentation

- Skills: `mysql-schema-patterns.md`, `mysql-optimization.md`
- Schemas: Agent input/output schemas
- Official Docs: https://dev.mysql.com/doc/

## Version History

- **1.0.0** (2026-01-13): Initial MySQL database specialist
