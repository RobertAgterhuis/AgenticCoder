# Skill: MySQL Optimization (@mysql-optimization)

## Metadata

```yaml
name: mysql-optimization
agents: ["@mysql-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **MySQL Optimization** skill provides comprehensive guidance on query optimization, performance tuning, indexing strategies, and monitoring for production MySQL databases. Covers query analysis, execution plans, and system tuning.

## Scope

**Included**:
- Query optimization and EXPLAIN analysis
- Index design and optimization
- Query rewriting techniques
- Connection pooling and configuration
- Memory and cache management
- Slow query identification
- Performance monitoring
- Partitioning strategies

**Excluded**:
- Replication setup (see operations)
- Backup and recovery (see operations)
- Cluster configuration (advanced)

## Core Pattern 1: EXPLAIN Analysis

```sql
-- Understand query execution plans

-- Simple EXPLAIN
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- Returns:
-- id | select_type | table | type | key | key_len | rows | filtered | Extra
-- 1  | SIMPLE      | users | ref  | idx_email | 255 | 1 | 100.00 | NULL

-- Detailed EXPLAIN with JSON
EXPLAIN FORMAT=JSON SELECT * FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.email = 'test@example.com';

-- Key EXPLAIN metrics:
-- type: ALL (table scan), index, range, ref, eq_ref, const
-- key: Index used (NULL means no index)
-- key_len: Bytes used from index
-- rows: Estimated rows examined
-- Extra: Additional info (Using where, Using index, etc.)

-- Good EXPLAIN indicators:
-- - type = const/eq_ref/ref (avoid ALL)
-- - key != NULL (index is used)
-- - rows is small relative to table size
-- - Extra shows "Using index" (covering index)

-- Queries to analyze
EXPLAIN SELECT * FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY o.created_at DESC;
```

## Core Pattern 2: Index Optimization

```sql
-- Index design patterns

-- Single column index for filtering
CREATE INDEX idx_status ON orders(status);
SELECT * FROM orders WHERE status = 'shipped';

-- Composite index for multiple conditions
CREATE INDEX idx_user_status ON orders(user_id, status);
SELECT * FROM orders WHERE user_id = 1 AND status = 'shipped';
-- Query can use leftmost columns

-- Covering index (all needed columns in index)
CREATE INDEX idx_covering ON orders(user_id, status, total_amount);
SELECT user_id, status, total_amount FROM orders WHERE user_id = 1;
-- Query satisfied entirely from index (no table access)

-- Index for sorting and filtering
CREATE INDEX idx_date_range ON orders(created_at, user_id);
SELECT * FROM orders 
WHERE user_id = 1 
ORDER BY created_at DESC;

-- String column optimization
CREATE INDEX idx_email_prefix ON users(email(10));
-- Store only first 10 chars in index for text columns

-- Index selectivity matters
-- GOOD: Email (high selectivity, many distinct values)
CREATE INDEX idx_email ON users(email);

-- LESS GOOD: Gender (low selectivity, few distinct values)
-- Don't index ENUM with 2-3 values; still use if part of composite

-- Regular expression matching
EXPLAIN SELECT * FROM products 
WHERE name LIKE 'Samsung%';  -- GOOD: Uses index (left prefix)

EXPLAIN SELECT * FROM products 
WHERE name LIKE '%Samsung%';  -- BAD: Full table scan

-- Remove unused indexes
SELECT object_schema, object_name, count_read, count_write
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE count_read = 0 AND object_schema != 'mysql'
ORDER BY count_write DESC;
```

## Core Pattern 3: Query Rewriting

```sql
-- Original slow query (N+1 problem pattern)
SELECT * FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY);
-- Then for each order, query:
SELECT * FROM users WHERE id = ?;
-- This creates N additional queries!

-- GOOD: Single JOIN query
SELECT o.*, u.name, u.email
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Use IN instead of OR for multiple conditions
-- BAD
SELECT * FROM orders 
WHERE user_id = 1 OR user_id = 2 OR user_id = 3;

-- GOOD
SELECT * FROM orders 
WHERE user_id IN (1, 2, 3);

-- Use LIMIT with WHERE clause
-- BAD: Get all, sort, then limit
SELECT * FROM orders 
ORDER BY created_at DESC
LIMIT 10;

-- GOOD: Let index do the work
SELECT * FROM orders 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC
LIMIT 10;

-- Aggregate optimization
-- BAD: Multiple passes
SELECT COUNT(*) as total,
       (SELECT COUNT(*) FROM orders WHERE status = 'shipped') as shipped,
       (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending
FROM orders;

-- GOOD: Single pass with CASE
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM orders;

-- Use EXISTS instead of IN for subqueries
-- When subquery returns many rows
SELECT * FROM users u
WHERE EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.user_id = u.id 
    AND o.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
);

-- Push predicates down
-- BAD: Join first, then filter
SELECT * FROM (
    SELECT * FROM orders o
    JOIN users u ON o.user_id = u.id
) t
WHERE t.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY);

-- GOOD: Filter before join
SELECT * FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY);
```

## Core Pattern 4: Connection Pool Configuration

```java
// HikariCP configuration for MySQL
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/db
    username: user
    password: password
    hikari:
      # Pool sizing
      maximum-pool-size: 20        # Max connections
      minimum-idle: 5              # Min idle connections
      
      # Timeouts
      connection-timeout: 20000    # 20 seconds
      idle-timeout: 300000         # 5 minutes
      max-lifetime: 1200000        # 20 minutes
      
      # Connection validation
      connection-test-query: "SELECT 1"
      pool-pre-ping: true          # Ping before using
      leak-detection-threshold: 60000  # 60 seconds
      
      # Auto-commit
      auto-commit: true
      
      # Connection init SQL
      connection-init-sql: "SET SESSION transaction_isolation='READ-COMMITTED'"

# Tuning guidelines:
# maximum-pool-size = (CPU_CORES * 2) + 5
# minimum-idle = maximum-pool-size / 2
```

## Core Pattern 5: Slow Query Analysis

```sql
-- Enable slow query logging
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
SET GLOBAL long_query_time = 2;  -- Log queries > 2 seconds

-- Analyze slow log
-- Use tools: mysqldumpslow, pt-query-digest

-- Example: mysqldumpslow
mysqldumpslow -t 10 /var/log/mysql/slow.log | head -20
-- Shows top 10 slowest queries

-- Find problematic queries
SELECT query_time, query
FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 10;

-- Information schema for running queries
SELECT 
    ID,
    USER,
    HOST,
    DB,
    COMMAND,
    TIME,
    STATE,
    INFO
FROM information_schema.PROCESSLIST
WHERE COMMAND != 'Sleep'
ORDER BY TIME DESC;

-- Kill long-running query
KILL QUERY 12345;  -- Just cancel query
KILL CONNECTION 12345;  -- Close connection
```

## Core Pattern 6: Performance Metrics

```sql
-- Key performance metrics to monitor

-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
    ROUND((data_length / 1024 / 1024), 2) AS data_mb,
    ROUND((index_length / 1024 / 1024), 2) AS index_mb
FROM information_schema.tables
WHERE table_schema = 'app_db'
ORDER BY size_mb DESC;

-- Monitor query statistics (MySQL 5.7+)
SELECT 
    schema_name,
    digest_text,
    count_star,
    avg_timer_wait,
    sum_select_full_join
FROM performance_schema.events_statements_summary_by_digest
ORDER BY count_star DESC
LIMIT 10;

-- Check key efficiency
SELECT 
    object_schema,
    object_name,
    count_read,
    count_write,
    count_delete,
    count_insert,
    count_update
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE object_schema = 'app_db'
ORDER BY count_read + count_write DESC;

-- Monitor InnoDB metrics
SHOW ENGINE INNODB STATUS\G
-- Look for: buffer pool hit rate, lock waits, row operations

-- Row lock analysis
SELECT * FROM information_schema.INNODB_LOCKS;
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
```

## Core Pattern 7: Partitioning Strategy

```sql
-- Range partitioning by date
CREATE TABLE audit_logs_partitioned (
    id BIGINT,
    user_id BIGINT,
    action VARCHAR(50),
    created_at TIMESTAMP,
    
    PRIMARY KEY (id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);

-- List partitioning by region
CREATE TABLE orders_by_region (
    id BIGINT,
    order_number VARCHAR(50),
    region VARCHAR(50),
    
    PRIMARY KEY (id, region)
) ENGINE=InnoDB
PARTITION BY LIST (region) (
    PARTITION p_us VALUES IN ('US', 'CA', 'MX'),
    PARTITION p_eu VALUES IN ('UK', 'DE', 'FR', 'IT'),
    PARTITION p_asia VALUES IN ('JP', 'CN', 'IN'),
    PARTITION p_other VALUES IN (DEFAULT)
);

-- Partition maintenance
-- Add new partition
ALTER TABLE audit_logs_partitioned 
ADD PARTITION (PARTITION p2026 VALUES LESS THAN (2027));

-- Drop old partition
ALTER TABLE audit_logs_partitioned 
DROP PARTITION p2023;

-- Check partition distribution
SELECT 
    partition_name,
    partition_expression,
    partition_description,
    TABLE_ROWS
FROM information_schema.PARTITIONS
WHERE TABLE_SCHEMA = 'app_db'
AND TABLE_NAME = 'audit_logs_partitioned'
ORDER BY partition_name;
```

## Core Pattern 8: Caching Strategy

```sql
-- Query result caching (MySQL 5.7 - deprecated in 8.0)
-- Use application-level caching instead (Redis, Memcached)

-- Materialized view pattern
CREATE TABLE user_stats_cache (
    user_id BIGINT PRIMARY KEY,
    total_orders INT,
    total_spent DECIMAL(12, 2),
    last_order_date TIMESTAMP,
    last_refreshed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Refresh strategy (periodic)
-- Run every hour:
REPLACE INTO user_stats_cache (user_id, total_orders, total_spent, last_order_date)
SELECT 
    u.id,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;

-- Aggregate table pattern
CREATE TABLE daily_order_summary (
    summary_date DATE PRIMARY KEY,
    total_orders INT,
    total_revenue DECIMAL(12, 2),
    average_order_value DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Update daily
INSERT INTO daily_order_summary (summary_date, total_orders, total_revenue, average_order_value)
SELECT 
    DATE(created_at) as summary_date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value
FROM orders
WHERE DATE(created_at) = CURDATE() - INTERVAL 1 DAY
ON DUPLICATE KEY UPDATE
    total_orders = VALUES(total_orders),
    total_revenue = VALUES(total_revenue),
    average_order_value = VALUES(average_order_value);
```

## Anti-Patterns

### ❌ Missing WHERE Clause

```sql
-- BAD: Full table scan
SELECT * FROM users;

-- GOOD: Be specific
SELECT * FROM users WHERE status = 'active';
```

### ❌ Sorting on Non-Indexed Columns

```sql
-- BAD: No index, requires sorting all rows
SELECT * FROM users ORDER BY created_at;

-- GOOD: Index for sorting
CREATE INDEX idx_created_at ON users(created_at);
SELECT * FROM users ORDER BY created_at LIMIT 10;
```

### ❌ Function Calls in WHERE

```sql
-- BAD: Index not used (function disqualifies index)
SELECT * FROM orders WHERE YEAR(created_at) = 2024;

-- GOOD: Date range
SELECT * FROM orders 
WHERE created_at >= '2024-01-01' 
AND created_at < '2025-01-01';
```

## Schema Reference

- `mysql-specialist.input.schema.json` - Database requirements
- `mysql-specialist.output.schema.json` - Optimization plan output

## Related Documentation

- Skill: `mysql-schema-patterns.md` - Database design
- Agent: `mysql-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial MySQL optimization patterns
