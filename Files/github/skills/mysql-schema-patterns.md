# Skill: MySQL Schema Patterns (@mysql-schema-patterns)

## Metadata

```yaml
name: mysql-schema-patterns
agents: ["@mysql-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **MySQL Schema Patterns** skill provides comprehensive patterns for designing normalized, efficient, and scalable MySQL database schemas. Covers table design, relationships, constraints, and data modeling best practices.

## Scope

**Included**:
- Normalized schema design (1NF through BCNF)
- Primary and foreign key patterns
- Data types and constraints
- Relationships (one-to-one, one-to-many, many-to-many)
- Temporal data patterns
- JSON storage patterns
- Audit and soft delete patterns
- Partition strategies

**Excluded**:
- Replication configuration (see infrastructure)
- Backup/recovery (see operations)
- Query optimization (see optimization skill)

## Core Pattern 1: Normalized Schema Design

```sql
-- Example: E-commerce system with proper normalization

-- 1. Users table - 3NF
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Product categories - separate table for normalization
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_slug (slug),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Products - reference category, not store it
CREATE TABLE products (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description LONGTEXT,
    category_id BIGINT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_slug (slug),
    INDEX idx_category_id (category_id),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Orders - user reference
CREATE TABLE orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(12, 2) NOT NULL,
    shipping_address VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Order items - separate table for many-to-many
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id),
    UNIQUE KEY idx_order_product (order_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Core Pattern 2: Many-to-Many Relationships

```sql
-- Example: Users with roles (many-to-many)

CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Junction table for many-to-many
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    
    INDEX idx_role_id (role_id),
    INDEX idx_assigned_at (assigned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Example: Products with tags (many-to-many with additional data)

CREATE TABLE tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Junction table with additional data
CREATE TABLE product_tags (
    product_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    popularity INT DEFAULT 0,  -- Track which tags are most used
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (product_id, tag_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    
    INDEX idx_tag_id (tag_id),
    INDEX idx_popularity (popularity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Core Pattern 3: Temporal Data and Soft Deletes

```sql
-- Soft delete pattern - mark deleted without removing

CREATE TABLE articles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    author_id BIGINT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,  -- Soft delete
    
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_is_published (is_published),
    INDEX idx_deleted_at (deleted_at),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Query active articles
-- SELECT * FROM articles WHERE deleted_at IS NULL;

-- Audit log pattern - track all changes

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    entity_type VARCHAR(100) NOT NULL,
    entity_id BIGINT NOT NULL,
    action ENUM('create', 'update', 'delete') NOT NULL,
    old_values JSON,  -- Store previous values
    new_values JSON,  -- Store new values
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Version history pattern - maintain version history

CREATE TABLE article_versions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    article_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    author_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_summary VARCHAR(500),
    
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY idx_article_version (article_id, version_number),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Core Pattern 4: Hierarchical Data

```sql
-- Hierarchical categories with nested set model

CREATE TABLE categories_nested (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    lft INT NOT NULL,  -- Left boundary
    rgt INT NOT NULL,  -- Right boundary
    depth INT NOT NULL,
    parent_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories_nested(id) ON DELETE CASCADE,
    INDEX idx_lft_rgt (lft, rgt),
    INDEX idx_parent_id (parent_id),
    UNIQUE INDEX idx_name_parent (name, parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Queries with nested set model are efficient:
-- Get all descendants: WHERE lft > parent.lft AND rgt < parent.rgt
-- Get all ancestors: WHERE lft < node.lft AND rgt > node.rgt
-- Get children only: WHERE parent_id = ?
```

## Core Pattern 5: JSON Storage

```sql
-- Store semi-structured data in JSON

CREATE TABLE user_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    preferences JSON DEFAULT '{}',  -- Flexible schema
    metadata JSON DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Example JSON structure:
{
    "theme": "dark",
    "language": "en",
    "timezone": "UTC",
    "notifications": {
        "email": true,
        "push": true,
        "sms": false
    }
}

-- Query JSON fields
SELECT user_id, JSON_EXTRACT(preferences, '$.theme') AS theme
FROM user_settings
WHERE JSON_EXTRACT(preferences, '$.notifications.email') = true;

-- Update JSON
UPDATE user_settings
SET preferences = JSON_SET(preferences, '$.theme', 'light')
WHERE user_id = 1;
```

## Core Pattern 6: Composite Primary Keys

```sql
-- When natural compound keys make sense

CREATE TABLE inventory (
    warehouse_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (warehouse_id, product_id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Unique constraints
CREATE TABLE user_email_verification (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY idx_user_email (user_id, email),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Core Pattern 7: Enum and Status Columns

```sql
-- Use ENUM for fixed set of values

CREATE TABLE orders_enum (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method ENUM('credit_card', 'paypal', 'bank_transfer', 'cryptocurrency') DEFAULT 'credit_card',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Benefits:
-- - Fixed storage size (1-2 bytes instead of VARCHAR)
-- - Data integrity (only valid values allowed)
-- - Better query performance
```

## Core Pattern 8: Indexing Strategy

```sql
-- Key indexing patterns

CREATE TABLE optimized_table (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    -- Foreign key index
    FOREIGN KEY (user_id) REFERENCES users(id),
    
    -- Unique index
    UNIQUE INDEX idx_email (email),
    
    -- Single column index for filtering
    INDEX idx_status (status),
    
    -- Composite index for range queries
    INDEX idx_created_updated (created_at, updated_at),
    
    -- Covering index (includes all needed columns)
    INDEX idx_user_status_created (user_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Index selection guidelines:
-- 1. Primary key: Always required (clustered index)
-- 2. Foreign keys: Index for JOIN performance
-- 3. WHERE clauses: Index columns used for filtering
-- 4. ORDER BY/GROUP BY: Index for sorting
-- 5. JOIN ON: Index the joined columns
-- 6. UNIQUE constraints: Use unique index
```

## Anti-Patterns

### ❌ Over-normalization

```sql
-- BAD: Too many tables
CREATE TABLE users_first_names (id, first_name);
CREATE TABLE users_last_names (id, last_name);
CREATE TABLE users_emails (id, email);
-- This requires too many JOINs!

-- GOOD: Balance normalization with practicality
CREATE TABLE users (
    id, first_name, last_name, email
    -- Simple queries, reasonable performance
);
```

### ❌ Missing Indexes

```sql
-- BAD: No index on frequently queried columns
CREATE TABLE articles (
    id, title, author_id, created_at
    -- Queries slow without indexes
);

-- GOOD: Index appropriately
CREATE TABLE articles (
    id, title, author_id, created_at,
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at)
);
```

### ❌ Text in Numeric Columns

```sql
-- BAD: Store numbers as text
CREATE TABLE prices (id, price VARCHAR(10));  -- "199.99"

-- GOOD: Use numeric types
CREATE TABLE prices (id, price DECIMAL(10,2));  -- 199.99
-- Better for: sorting, calculations, storage
```

## Schema Reference

- `mysql-specialist.input.schema.json` - Design requirements
- `mysql-specialist.output.schema.json` - Generated schema structure

## Related Documentation

- Skill: `mysql-optimization.md` - Performance tuning
- Agent: `mysql-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial MySQL schema patterns
