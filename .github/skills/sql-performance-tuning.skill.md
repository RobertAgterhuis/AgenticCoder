# SQL Performance Tuning Skill

## Overview
**Skill ID**: `sql-performance-tuning`  
**Version**: 1.0  
**Domain**: SQL Server and Azure SQL query optimization, indexing, and monitoring  
**Phase**: 15 (@sql-server-specialist, @azure-sql-specialist)  
**Maturity**: Production-Ready

SQL Performance Tuning skill covers execution plan analysis, index optimization, Query Store, statistics management, query hints, and performance monitoring for SQL Server and Azure SQL Database.

---

## Core Concepts

### 1. Execution Plan Analysis

**Reading Execution Plans**:

```sql
-- Enable actual execution plan
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- Run your query
SELECT o.OrderId, o.OrderDate, c.CustomerName
FROM dbo.Orders o
INNER JOIN dbo.Customers c ON o.CustomerId = c.CustomerId
WHERE o.OrderDate >= '2026-01-01';

-- Key metrics to look for:
-- 1. Logical reads (memory I/O)
-- 2. Physical reads (disk I/O)
-- 3. Scan count
-- 4. CPU time
-- 5. Elapsed time
```

**Common Execution Plan Operators**:

| Operator | Performance | When Good | When Bad |
|----------|-------------|-----------|----------|
| **Clustered Index Seek** | ✅ Excellent | Small result set | - |
| **Index Seek** | ✅ Good | Selective queries | - |
| **Index Scan** | ⚠️ Variable | Full table needed | Large table, selective query |
| **Table Scan** | ❌ Usually Bad | Heap, no indexes | Large table |
| **Key Lookup** | ⚠️ Expensive | Few lookups | Many lookups |
| **Hash Match** | ⚠️ Variable | Large joins | Memory grants |
| **Nested Loops** | ✅ Good for small | Small outer input | Large outer input |
| **Sort** | ⚠️ Expensive | ORDER BY needed | Unnecessary sorts |
| **Parallelism** | ⚠️ Variable | Large operations | OLTP queries |

**Identifying Problems**:

```sql
-- Find expensive operators by estimated cost
-- In SSMS: Look for thick arrows (more rows) and high percentages

-- Query to find missing indexes from execution plans
SELECT 
    CONVERT(DECIMAL(18,2), migs.avg_user_impact * (migs.user_seeks + migs.user_scans)) AS Impact,
    OBJECT_NAME(mid.object_id, mid.database_id) AS TableName,
    mid.equality_columns,
    mid.inequality_columns,
    mid.included_columns,
    migs.user_seeks,
    migs.user_scans,
    migs.avg_user_impact
FROM sys.dm_db_missing_index_group_stats AS migs
INNER JOIN sys.dm_db_missing_index_groups AS mig 
    ON migs.group_handle = mig.index_group_handle
INNER JOIN sys.dm_db_missing_index_details AS mid 
    ON mig.index_handle = mid.index_handle
WHERE mid.database_id = DB_ID()
ORDER BY Impact DESC;
```

### 2. Index Optimization

**Index Types and Usage**:

```sql
-- Clustered Index (1 per table, defines physical order)
CREATE CLUSTERED INDEX IX_Orders_OrderDate
ON dbo.Orders (OrderDate);

-- OR as primary key
ALTER TABLE dbo.Orders 
ADD CONSTRAINT PK_Orders PRIMARY KEY CLUSTERED (OrderId);

-- Nonclustered Index (up to 999 per table)
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId
ON dbo.Orders (CustomerId);

-- Covering Index (includes all needed columns)
CREATE NONCLUSTERED INDEX IX_Orders_Customer_Covering
ON dbo.Orders (CustomerId, OrderDate)
INCLUDE (TotalAmount, Status, OrderNumber);

-- Filtered Index (partial index)
CREATE NONCLUSTERED INDEX IX_Orders_Pending
ON dbo.Orders (OrderDate, CustomerId)
WHERE Status = 'Pending'
AND IsDeleted = 0;

-- Columnstore Index (analytics)
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_Orders_Analytics
ON dbo.Orders (OrderDate, CustomerId, TotalAmount, Status);

-- Unique Index
CREATE UNIQUE NONCLUSTERED INDEX UX_Orders_OrderNumber
ON dbo.Orders (OrderNumber);
```

**Index Design Guidelines**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Index Column Order Rules                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Equality columns FIRST (WHERE col = value)                               │
│ 2. Inequality columns SECOND (WHERE col > value)                            │
│ 3. ORDER BY columns THIRD                                                   │
│ 4. SELECT columns in INCLUDE (not in key)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Example Query:                                                              │
│   SELECT OrderId, TotalAmount                                               │
│   FROM Orders                                                               │
│   WHERE Status = 'Pending'     -- Equality                                  │
│     AND OrderDate > '2026-01-01' -- Inequality                              │
│   ORDER BY CustomerId           -- Sort                                     │
│                                                                             │
│ Optimal Index:                                                              │
│   CREATE INDEX IX_Orders_StatusDateCustomer                                 │
│   ON Orders (Status, OrderDate, CustomerId)                                 │
│   INCLUDE (OrderId, TotalAmount);                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Identify Unused Indexes**:

```sql
-- Find unused or rarely used indexes
SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    ius.user_seeks,
    ius.user_scans,
    ius.user_lookups,
    ius.user_updates,
    -- Writes vs Reads ratio
    CASE 
        WHEN (ius.user_seeks + ius.user_scans + ius.user_lookups) = 0 
        THEN 'Never Read'
        ELSE CAST(ius.user_updates AS VARCHAR) + ':' + 
             CAST(ius.user_seeks + ius.user_scans + ius.user_lookups AS VARCHAR)
    END AS WriteReadRatio
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats ius 
    ON i.object_id = ius.object_id 
    AND i.index_id = ius.index_id
    AND ius.database_id = DB_ID()
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1
    AND i.type_desc <> 'HEAP'
    AND i.is_primary_key = 0
    AND i.is_unique_constraint = 0
ORDER BY ius.user_seeks + ius.user_scans + ius.user_lookups ASC;
```

**Index Fragmentation**:

```sql
-- Check fragmentation
SELECT 
    OBJECT_NAME(ips.object_id) AS TableName,
    i.name AS IndexName,
    ips.index_type_desc,
    ips.avg_fragmentation_in_percent,
    ips.page_count,
    ips.avg_page_space_used_in_percent,
    CASE 
        WHEN ips.avg_fragmentation_in_percent < 5 THEN 'None needed'
        WHEN ips.avg_fragmentation_in_percent < 30 THEN 'REORGANIZE'
        ELSE 'REBUILD'
    END AS RecommendedAction
FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
WHERE ips.avg_fragmentation_in_percent > 5
    AND ips.page_count > 1000  -- Only indexes with significant pages
ORDER BY ips.avg_fragmentation_in_percent DESC;

-- Rebuild or reorganize
ALTER INDEX IX_Orders_CustomerId ON dbo.Orders REORGANIZE;  -- < 30% fragmentation
ALTER INDEX IX_Orders_CustomerId ON dbo.Orders REBUILD;     -- >= 30% fragmentation

-- Online rebuild (Enterprise or Azure SQL)
ALTER INDEX IX_Orders_CustomerId ON dbo.Orders 
REBUILD WITH (ONLINE = ON, RESUMABLE = ON, MAX_DURATION = 60 MINUTES);
```

### 3. Query Store

**Enable and Configure**:

```sql
-- Enable Query Store
ALTER DATABASE [YourDatabase]
SET QUERY_STORE = ON (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30),
    DATA_FLUSH_INTERVAL_SECONDS = 900,
    INTERVAL_LENGTH_MINUTES = 60,
    MAX_STORAGE_SIZE_MB = 1000,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO
);
```

**Find Resource-Intensive Queries**:

```sql
-- Top queries by total CPU time
SELECT TOP 20
    q.query_id,
    qt.query_sql_text,
    rs.count_executions,
    rs.avg_cpu_time / 1000 AS avg_cpu_ms,
    rs.avg_duration / 1000 AS avg_duration_ms,
    rs.avg_logical_io_reads,
    rs.avg_physical_io_reads,
    p.plan_id,
    TRY_CONVERT(XML, p.query_plan) AS QueryPlan
FROM sys.query_store_query q
INNER JOIN sys.query_store_query_text qt ON q.query_text_id = qt.query_text_id
INNER JOIN sys.query_store_plan p ON q.query_id = p.query_id
INNER JOIN sys.query_store_runtime_stats rs ON p.plan_id = rs.plan_id
INNER JOIN sys.query_store_runtime_stats_interval rsi ON rs.runtime_stats_interval_id = rsi.runtime_stats_interval_id
WHERE rsi.start_time >= DATEADD(day, -7, GETUTCDATE())
ORDER BY rs.avg_cpu_time * rs.count_executions DESC;
```

**Find Regressed Queries**:

```sql
-- Queries with plan regression
SELECT 
    q.query_id,
    qt.query_sql_text,
    first_plan.plan_id AS original_plan_id,
    last_plan.plan_id AS current_plan_id,
    first_stats.avg_duration / 1000 AS original_avg_ms,
    last_stats.avg_duration / 1000 AS current_avg_ms,
    (last_stats.avg_duration - first_stats.avg_duration) / first_stats.avg_duration * 100 AS regression_percent
FROM sys.query_store_query q
INNER JOIN sys.query_store_query_text qt ON q.query_text_id = qt.query_text_id
INNER JOIN sys.query_store_plan first_plan ON q.query_id = first_plan.query_id
INNER JOIN sys.query_store_plan last_plan ON q.query_id = last_plan.query_id
INNER JOIN sys.query_store_runtime_stats first_stats ON first_plan.plan_id = first_stats.plan_id
INNER JOIN sys.query_store_runtime_stats last_stats ON last_plan.plan_id = last_stats.plan_id
WHERE first_plan.plan_id < last_plan.plan_id
    AND last_stats.avg_duration > first_stats.avg_duration * 1.5  -- 50% regression
ORDER BY regression_percent DESC;

-- Force a good plan
EXEC sp_query_store_force_plan @query_id = 123, @plan_id = 456;

-- Unforce a plan
EXEC sp_query_store_unforce_plan @query_id = 123, @plan_id = 456;
```

### 4. Statistics Management

**Understand Statistics**:

```sql
-- View statistics details
DBCC SHOW_STATISTICS ('dbo.Orders', 'IX_Orders_CustomerId');

-- View all statistics on a table
SELECT 
    s.name AS StatisticsName,
    STATS_DATE(s.object_id, s.stats_id) AS LastUpdated,
    s.auto_created,
    s.user_created,
    s.no_recompute,
    sp.rows,
    sp.modification_counter,
    sp.rows_sampled,
    CAST(sp.rows_sampled * 100.0 / sp.rows AS DECIMAL(5,2)) AS SamplePercent
FROM sys.stats s
CROSS APPLY sys.dm_db_stats_properties(s.object_id, s.stats_id) sp
WHERE s.object_id = OBJECT_ID('dbo.Orders')
ORDER BY sp.modification_counter DESC;
```

**Update Statistics**:

```sql
-- Update specific statistics
UPDATE STATISTICS dbo.Orders IX_Orders_CustomerId;

-- Update all statistics on a table
UPDATE STATISTICS dbo.Orders;

-- Update with full scan (most accurate)
UPDATE STATISTICS dbo.Orders WITH FULLSCAN;

-- Update with sample
UPDATE STATISTICS dbo.Orders WITH SAMPLE 50 PERCENT;

-- Update all statistics in database
EXEC sp_updatestats;
```

**Automatic Statistics**:

```sql
-- Check auto-statistics settings
SELECT 
    name,
    is_auto_create_stats_on,
    is_auto_update_stats_on,
    is_auto_update_stats_async_on
FROM sys.databases
WHERE name = DB_NAME();

-- Enable async stats update (recommended for OLTP)
ALTER DATABASE [YourDatabase] SET AUTO_UPDATE_STATISTICS_ASYNC ON;
```

### 5. Query Optimization Techniques

**SARGable Queries**:

```sql
-- ❌ Non-SARGable (cannot use index)
SELECT * FROM Orders WHERE YEAR(OrderDate) = 2026;
SELECT * FROM Orders WHERE OrderNumber LIKE '%123';
SELECT * FROM Orders WHERE ISNULL(Status, 'Unknown') = 'Pending';

-- ✅ SARGable (can use index)
SELECT * FROM Orders WHERE OrderDate >= '2026-01-01' AND OrderDate < '2027-01-01';
SELECT * FROM Orders WHERE OrderNumber LIKE '123%';
SELECT * FROM Orders WHERE Status = 'Pending';
```

**Eliminate Key Lookups**:

```sql
-- Original query causing key lookup
SELECT OrderId, CustomerId, TotalAmount, ShippingAddress
FROM dbo.Orders
WHERE CustomerId = 123
ORDER BY OrderDate DESC;

-- Existing index causes key lookup for ShippingAddress
-- CREATE INDEX IX_Orders_CustomerId ON Orders (CustomerId)

-- Create covering index
CREATE INDEX IX_Orders_Customer_Covering
ON dbo.Orders (CustomerId, OrderDate DESC)
INCLUDE (OrderId, TotalAmount, ShippingAddress);
```

**Optimize JOINs**:

```sql
-- Ensure join columns have matching data types
-- Ensure join columns are indexed

-- For large tables, consider breaking into batches
;WITH BatchedOrders AS (
    SELECT TOP 10000 OrderId, CustomerId, TotalAmount
    FROM dbo.Orders
    WHERE ProcessedAt IS NULL
    ORDER BY OrderId
)
UPDATE o
SET ProcessedAt = SYSDATETIME()
FROM dbo.Orders o
INNER JOIN BatchedOrders b ON o.OrderId = b.OrderId;
```

### 6. Query Hints

**Index Hints**:

```sql
-- Force specific index
SELECT OrderId, OrderDate, TotalAmount
FROM dbo.Orders WITH (INDEX(IX_Orders_OrderDate))
WHERE OrderDate >= '2026-01-01';

-- Force index seek (fail if scan required)
SELECT OrderId, OrderDate, TotalAmount
FROM dbo.Orders WITH (FORCESEEK)
WHERE OrderDate >= '2026-01-01';

-- Force index scan
SELECT SUM(TotalAmount)
FROM dbo.Orders WITH (FORCESCAN)
WHERE Status = 'Completed';
```

**Join Hints**:

```sql
-- Force hash join
SELECT o.OrderId, c.CustomerName
FROM dbo.Orders o
INNER HASH JOIN dbo.Customers c ON o.CustomerId = c.CustomerId;

-- Force merge join (requires sorted input)
SELECT o.OrderId, c.CustomerName
FROM dbo.Orders o
INNER MERGE JOIN dbo.Customers c ON o.CustomerId = c.CustomerId;

-- Force loop join
SELECT o.OrderId, c.CustomerName
FROM dbo.Orders o
INNER LOOP JOIN dbo.Customers c ON o.CustomerId = c.CustomerId;
```

**Query Hints**:

```sql
-- Optimize for specific value
SELECT * FROM dbo.Orders
WHERE CustomerId = @CustomerId
OPTION (OPTIMIZE FOR (@CustomerId = 123));

-- Optimize for unknown (average selectivity)
SELECT * FROM dbo.Orders
WHERE CustomerId = @CustomerId
OPTION (OPTIMIZE FOR UNKNOWN);

-- Recompile (new plan every execution)
SELECT * FROM dbo.Orders
WHERE OrderDate >= @StartDate
OPTION (RECOMPILE);

-- Max degree of parallelism
SELECT SUM(TotalAmount) FROM dbo.Orders
OPTION (MAXDOP 4);

-- Disable parallelism
SELECT SUM(TotalAmount) FROM dbo.Orders
OPTION (MAXDOP 1);
```

### 7. Wait Statistics

**Identify Performance Bottlenecks**:

```sql
-- Current wait statistics
SELECT 
    wait_type,
    wait_time_ms / 1000.0 AS wait_time_sec,
    waiting_tasks_count,
    wait_time_ms / waiting_tasks_count AS avg_wait_ms,
    signal_wait_time_ms / 1000.0 AS signal_wait_sec,
    (wait_time_ms - signal_wait_time_ms) / 1000.0 AS resource_wait_sec
FROM sys.dm_os_wait_stats
WHERE wait_type NOT IN (
    'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE',
    'SLEEP_TASK', 'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH',
    'WAITFOR', 'LOGMGR_QUEUE', 'CHECKPOINT_QUEUE', 
    'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT',
    'BROKER_TO_FLUSH', 'BROKER_TASK_STOP', 'CLR_MANUAL_EVENT',
    'CLR_AUTO_EVENT', 'DISPATCHER_QUEUE_SEMAPHORE',
    'FT_IFTS_SCHEDULER_IDLE_WAIT', 'XE_DISPATCHER_WAIT',
    'XE_DISPATCHER_JOIN', 'SQLTRACE_INCREMENTAL_FLUSH_SLEEP'
)
AND waiting_tasks_count > 0
ORDER BY wait_time_ms DESC;
```

**Common Wait Types and Solutions**:

| Wait Type | Cause | Solution |
|-----------|-------|----------|
| `CXPACKET` | Parallelism overhead | Tune MAXDOP, add indexes |
| `PAGEIOLATCH_*` | Disk I/O | Add memory, faster storage |
| `SOS_SCHEDULER_YIELD` | CPU pressure | Add CPU, optimize queries |
| `ASYNC_NETWORK_IO` | Slow client | Client optimization |
| `WRITELOG` | Transaction log I/O | Faster log storage |
| `LCK_M_*` | Lock contention | Optimize transactions |
| `RESOURCE_SEMAPHORE` | Memory grants | Add memory, optimize queries |

### 8. Azure SQL Specific

**Resource Governance Monitoring**:

```sql
-- Current resource utilization
SELECT 
    end_time,
    avg_cpu_percent,
    avg_data_io_percent,
    avg_log_write_percent,
    avg_memory_usage_percent,
    max_worker_percent,
    max_session_percent
FROM sys.dm_db_resource_stats
ORDER BY end_time DESC;

-- Query data over time (last hour)
SELECT 
    DATEPART(minute, end_time) AS Minute,
    AVG(avg_cpu_percent) AS AvgCPU,
    MAX(avg_cpu_percent) AS MaxCPU,
    AVG(avg_data_io_percent) AS AvgDataIO,
    AVG(avg_log_write_percent) AS AvgLogWrite
FROM sys.dm_db_resource_stats
WHERE end_time > DATEADD(hour, -1, GETUTCDATE())
GROUP BY DATEPART(minute, end_time)
ORDER BY Minute;
```

**Automatic Tuning Status**:

```sql
-- Check automatic tuning options
SELECT 
    name,
    desired_state_desc,
    actual_state_desc,
    reason_desc
FROM sys.database_automatic_tuning_options;

-- View automatic tuning recommendations
SELECT 
    reason,
    score,
    state_transition_reason_desc,
    JSON_VALUE(details, '$.implementationDetails.script') AS Script
FROM sys.dm_db_tuning_recommendations;
```

---

## Performance Monitoring Queries

**Session-Level Monitoring**:

```sql
-- Currently running queries
SELECT 
    r.session_id,
    r.status,
    r.command,
    r.wait_type,
    r.wait_time,
    r.cpu_time,
    r.total_elapsed_time / 1000 AS elapsed_sec,
    r.reads,
    r.writes,
    r.logical_reads,
    SUBSTRING(t.text, (r.statement_start_offset/2)+1,
        ((CASE r.statement_end_offset WHEN -1 THEN DATALENGTH(t.text)
          ELSE r.statement_end_offset END - r.statement_start_offset)/2)+1) AS current_statement,
    p.query_plan
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
CROSS APPLY sys.dm_exec_query_plan(r.plan_handle) p
WHERE r.session_id > 50  -- Exclude system sessions
ORDER BY r.cpu_time DESC;
```

---

## Quick Reference

| Issue | First Check | Solution |
|-------|-------------|----------|
| Slow query | Execution plan | Add/modify indexes |
| High CPU | Query Store | Optimize queries |
| High I/O | Wait stats | Add memory, faster storage |
| Blocking | Lock waits | Shorter transactions |
| Plan regression | Query Store | Force good plan |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
