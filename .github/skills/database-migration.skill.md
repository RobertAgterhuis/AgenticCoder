# Database Migration Skill

## Overview
**Skill ID**: `database-migration`  
**Version**: 1.0  
**Domain**: Database schema versioning, migration strategies, and data movement  
**Phase**: 15 (@sql-server-specialist, @azure-sql-specialist)  
**Maturity**: Production-Ready

Database Migration skill covers schema versioning, migration patterns, zero-downtime deployments, data migration strategies, and rollback procedures for SQL Server and Azure SQL.

---

## Core Concepts

### 1. Migration Strategies

**Migration Types**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Database Migration Types                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Schema Migration                                                            │
│ ├── DDL changes (CREATE, ALTER, DROP)                                       │
│ ├── Index modifications                                                     │
│ ├── Constraint changes                                                      │
│ └── View/SP/Function updates                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Data Migration                                                              │
│ ├── Data transformation                                                     │
│ ├── Data cleansing                                                          │
│ ├── Data movement (table to table)                                          │
│ └── Reference data updates                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Platform Migration                                                          │
│ ├── SQL Server version upgrade                                              │
│ ├── On-prem to Azure SQL                                                    │
│ ├── Azure SQL tier changes                                                  │
│ └── Cross-database migration                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Migration File Structure

**Naming Convention**:

```
migrations/
├── V001__Create_Initial_Schema.sql
├── V002__Add_Customer_Table.sql
├── V003__Add_Order_Tables.sql
├── V004__Add_Indexes.sql
├── V005__Add_Audit_Triggers.sql
├── R__Create_Views.sql           # Repeatable (recreated each time)
├── R__Create_StoredProcedures.sql
└── U001__Undo_Add_Customer_Table.sql  # Undo scripts (optional)
```

**Migration Script Template**:

```sql
/*
============================================================================
Migration:      V003__Add_Order_Tables.sql
Description:    Create Orders and OrderItems tables with relationships
Author:         @sql-server-specialist
Created:        2026-01-17
Estimated Time: < 1 minute
Rollback:       U003__Undo_Add_Order_Tables.sql

Dependencies:
  - V002__Add_Customer_Table.sql (Customers table must exist)

Change History:
  Date        Author          Description
  ----------  --------------  ------------------------------------------------
  2026-01-17  Initial         Created tables
============================================================================
*/

-- Pre-flight check
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Customers')
BEGIN
    RAISERROR('Dependency not met: Customers table does not exist', 16, 1);
    RETURN;
END

-- Idempotency check
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Orders')
BEGIN
    PRINT 'Migration V003 already applied - skipping';
    RETURN;
END

BEGIN TRANSACTION;
BEGIN TRY

    PRINT 'Creating Orders table...';
    
    CREATE TABLE dbo.Orders (
        OrderId         INT IDENTITY(1,1) NOT NULL,
        CustomerId      INT NOT NULL,
        OrderNumber     NVARCHAR(50) NOT NULL,
        OrderDate       DATETIME2(3) NOT NULL CONSTRAINT DF_Orders_OrderDate DEFAULT (SYSDATETIME()),
        TotalAmount     DECIMAL(18,2) NOT NULL CONSTRAINT DF_Orders_TotalAmount DEFAULT (0),
        Status          NVARCHAR(50) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT (N'Pending'),
        CreatedAt       DATETIME2(3) NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT (SYSDATETIME()),
        
        CONSTRAINT PK_Orders PRIMARY KEY CLUSTERED (OrderId),
        CONSTRAINT FK_Orders_Customer FOREIGN KEY (CustomerId) 
            REFERENCES dbo.Customers(CustomerId),
        CONSTRAINT UQ_Orders_OrderNumber UNIQUE (OrderNumber)
    );
    
    PRINT 'Creating OrderItems table...';
    
    CREATE TABLE dbo.OrderItems (
        OrderItemId     INT IDENTITY(1,1) NOT NULL,
        OrderId         INT NOT NULL,
        ProductId       INT NOT NULL,
        Quantity        INT NOT NULL CONSTRAINT DF_OrderItems_Quantity DEFAULT (1),
        UnitPrice       DECIMAL(18,2) NOT NULL,
        
        CONSTRAINT PK_OrderItems PRIMARY KEY CLUSTERED (OrderItemId),
        CONSTRAINT FK_OrderItems_Order FOREIGN KEY (OrderId) 
            REFERENCES dbo.Orders(OrderId) ON DELETE CASCADE,
        CONSTRAINT CK_OrderItems_Quantity CHECK (Quantity > 0)
    );
    
    PRINT 'Creating indexes...';
    
    CREATE NONCLUSTERED INDEX IX_Orders_CustomerId 
    ON dbo.Orders (CustomerId);
    
    CREATE NONCLUSTERED INDEX IX_Orders_OrderDate 
    ON dbo.Orders (OrderDate DESC);
    
    CREATE NONCLUSTERED INDEX IX_OrderItems_OrderId 
    ON dbo.OrderItems (OrderId);
    
    COMMIT TRANSACTION;
    PRINT 'Migration V003 completed successfully';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR('Migration V003 failed: %s', 16, 1, @ErrorMessage);
END CATCH
GO
```

### 3. Idempotent Migrations

**Check Before Create/Alter**:

```sql
-- Create table if not exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
               WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Orders')
BEGIN
    CREATE TABLE dbo.Orders (
        -- columns...
    );
END

-- Add column if not exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'ShippedDate')
BEGIN
    ALTER TABLE dbo.Orders ADD ShippedDate DATETIME2 NULL;
END

-- Add constraint if not exists
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints 
               WHERE name = 'CK_Orders_TotalAmount' AND parent_object_id = OBJECT_ID('dbo.Orders'))
BEGIN
    ALTER TABLE dbo.Orders ADD CONSTRAINT CK_Orders_TotalAmount CHECK (TotalAmount >= 0);
END

-- Add index if not exists
IF NOT EXISTS (SELECT 1 FROM sys.indexes 
               WHERE name = 'IX_Orders_CustomerId' AND object_id = OBJECT_ID('dbo.Orders'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Orders_CustomerId ON dbo.Orders (CustomerId);
END

-- Drop column if exists
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'OldColumn')
BEGIN
    ALTER TABLE dbo.Orders DROP COLUMN OldColumn;
END
```

### 4. Zero-Downtime Migrations

**Expand-Contract Pattern**:

```sql
/*
Scenario: Rename column CustomerName to FullName

EXPAND Phase (backward compatible):
1. Add new column
2. Sync data
3. Create trigger for sync

CONTRACT Phase (after all clients updated):
4. Drop trigger
5. Drop old column
*/

-- EXPAND PHASE (Deploy first)

-- Step 1: Add new column
ALTER TABLE dbo.Customers ADD FullName NVARCHAR(200) NULL;
GO

-- Step 2: Backfill existing data
UPDATE dbo.Customers SET FullName = CustomerName WHERE FullName IS NULL;
GO

-- Step 3: Create sync trigger
CREATE OR ALTER TRIGGER dbo.tr_Customers_SyncName
ON dbo.Customers
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Sync old -> new
    UPDATE c SET FullName = i.CustomerName
    FROM dbo.Customers c
    INNER JOIN inserted i ON c.CustomerId = i.CustomerId
    WHERE i.CustomerName IS NOT NULL AND c.FullName IS NULL;
    
    -- Sync new -> old
    UPDATE c SET CustomerName = i.FullName
    FROM dbo.Customers c
    INNER JOIN inserted i ON c.CustomerId = i.CustomerId
    WHERE i.FullName IS NOT NULL AND c.CustomerName IS NULL;
END
GO

-- Step 4: Make new column NOT NULL (after backfill verified)
ALTER TABLE dbo.Customers ALTER COLUMN FullName NVARCHAR(200) NOT NULL;
GO

-- CONTRACT PHASE (Deploy after all clients use new column)

-- Step 5: Drop sync trigger
DROP TRIGGER IF EXISTS dbo.tr_Customers_SyncName;
GO

-- Step 6: Drop old column
ALTER TABLE dbo.Customers DROP COLUMN CustomerName;
GO
```

**Online Index Operations**:

```sql
-- Create index online (no locks)
CREATE NONCLUSTERED INDEX IX_Orders_NewIndex
ON dbo.Orders (Column1, Column2)
WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
GO

-- Rebuild index online
ALTER INDEX IX_Orders_CustomerId ON dbo.Orders
REBUILD WITH (ONLINE = ON, RESUMABLE = ON, MAX_DURATION = 60 MINUTES);
GO

-- Alter column with online operation (SQL Server 2016+)
-- First create new column, migrate, then drop old
ALTER TABLE dbo.Orders
ADD NewColumn NVARCHAR(200) NULL;
GO

UPDATE dbo.Orders SET NewColumn = CAST(OldColumn AS NVARCHAR(200));
GO

-- After verification
ALTER TABLE dbo.Orders DROP COLUMN OldColumn;
GO
```

### 5. Data Migration Patterns

**Batch Processing for Large Tables**:

```sql
-- Migrate data in batches to avoid lock escalation
DECLARE @BatchSize INT = 10000;
DECLARE @RowsAffected INT = 1;
DECLARE @TotalProcessed INT = 0;

WHILE @RowsAffected > 0
BEGIN
    BEGIN TRANSACTION;
    
    -- Use TOP with explicit ordering for deterministic batches
    WITH BatchCTE AS (
        SELECT TOP (@BatchSize) *
        FROM dbo.SourceTable
        WHERE MigratedAt IS NULL
        ORDER BY Id
    )
    UPDATE BatchCTE
    SET MigratedAt = SYSDATETIME();
    
    SET @RowsAffected = @@ROWCOUNT;
    SET @TotalProcessed = @TotalProcessed + @RowsAffected;
    
    COMMIT TRANSACTION;
    
    -- Progress logging
    RAISERROR('Processed %d rows (total: %d)', 0, 1, @RowsAffected, @TotalProcessed) WITH NOWAIT;
    
    -- Optional: Throttle to reduce impact
    WAITFOR DELAY '00:00:00.100';  -- 100ms pause
END

PRINT 'Migration completed. Total rows processed: ' + CAST(@TotalProcessed AS VARCHAR(20));
```

**INSERT with SELECT (bulk)**:

```sql
-- Migrate with transformation
INSERT INTO dbo.NewOrders (
    OrderId,
    CustomerKey,  -- New surrogate key
    OrderNumber,
    OrderDateUtc,  -- Converted to UTC
    TotalAmount,
    StatusCode  -- New status code
)
SELECT 
    o.OrderId,
    c.CustomerKey,
    o.OrderNumber,
    SWITCHOFFSET(o.OrderDate, '+00:00') AS OrderDateUtc,
    o.TotalAmount,
    CASE o.Status
        WHEN 'Pending' THEN 1
        WHEN 'Processing' THEN 2
        WHEN 'Shipped' THEN 3
        WHEN 'Completed' THEN 4
        WHEN 'Cancelled' THEN 5
        ELSE 0
    END AS StatusCode
FROM dbo.Orders o
INNER JOIN dbo.CustomerMapping c ON o.CustomerId = c.LegacyCustomerId
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.NewOrders n WHERE n.OrderId = o.OrderId
);
```

### 6. Rollback Strategies

**Undo Script Template**:

```sql
/*
============================================================================
Rollback:       U003__Undo_Add_Order_Tables.sql
Undoes:         V003__Add_Order_Tables.sql
Author:         @sql-server-specialist
Created:        2026-01-17

WARNING: This will DROP tables and DELETE all data!
============================================================================
*/

BEGIN TRANSACTION;
BEGIN TRY

    -- Drop dependent objects first (reverse order of creation)
    
    PRINT 'Dropping indexes...';
    DROP INDEX IF EXISTS IX_OrderItems_OrderId ON dbo.OrderItems;
    DROP INDEX IF EXISTS IX_Orders_OrderDate ON dbo.Orders;
    DROP INDEX IF EXISTS IX_Orders_CustomerId ON dbo.Orders;
    
    PRINT 'Dropping OrderItems table...';
    DROP TABLE IF EXISTS dbo.OrderItems;
    
    PRINT 'Dropping Orders table...';
    DROP TABLE IF EXISTS dbo.Orders;
    
    COMMIT TRANSACTION;
    PRINT 'Rollback U003 completed successfully';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR('Rollback U003 failed: %s', 16, 1, @ErrorMessage);
END CATCH
GO
```

**Data Backup Before Migration**:

```sql
-- Create backup table before destructive migration
SELECT * INTO dbo.Customers_Backup_20260117
FROM dbo.Customers;

-- Add timestamp
ALTER TABLE dbo.Customers_Backup_20260117 
ADD BackupTimestamp DATETIME2 NOT NULL DEFAULT SYSDATETIME();

-- Restore if needed
INSERT INTO dbo.Customers (CustomerId, CustomerName, Email, ...)
SELECT CustomerId, CustomerName, Email, ...
FROM dbo.Customers_Backup_20260117;
```

### 7. Migration Tracking Table

**Version Control Table**:

```sql
-- Create migration tracking table
CREATE TABLE dbo.DatabaseMigrations (
    MigrationId         INT IDENTITY(1,1) PRIMARY KEY,
    Version             VARCHAR(50) NOT NULL,
    Description         NVARCHAR(500) NOT NULL,
    Script              NVARCHAR(255) NOT NULL,
    Checksum            VARCHAR(64) NOT NULL,  -- SHA256 of script content
    AppliedAt           DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    AppliedBy           NVARCHAR(128) NOT NULL DEFAULT SUSER_SNAME(),
    ExecutionTimeMs     INT NULL,
    Success             BIT NOT NULL DEFAULT 1,
    ErrorMessage        NVARCHAR(MAX) NULL,
    
    CONSTRAINT UQ_DatabaseMigrations_Version UNIQUE (Version)
);

-- Create index for quick lookups
CREATE NONCLUSTERED INDEX IX_DatabaseMigrations_AppliedAt
ON dbo.DatabaseMigrations (AppliedAt DESC);
```

**Migration Runner Logic**:

```sql
CREATE OR ALTER PROCEDURE dbo.usp_RunMigration
    @Version        VARCHAR(50),
    @Description    NVARCHAR(500),
    @Script         NVARCHAR(255),
    @Checksum       VARCHAR(64)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartTime DATETIME2 = SYSDATETIME();
    DECLARE @ExecutionTimeMs INT;
    
    -- Check if already applied
    IF EXISTS (SELECT 1 FROM dbo.DatabaseMigrations WHERE Version = @Version)
    BEGIN
        -- Verify checksum matches
        IF NOT EXISTS (SELECT 1 FROM dbo.DatabaseMigrations 
                       WHERE Version = @Version AND Checksum = @Checksum)
        BEGIN
            RAISERROR('Migration %s already exists with different checksum!', 16, 1, @Version);
            RETURN -1;
        END
        
        PRINT 'Migration ' + @Version + ' already applied - skipping';
        RETURN 0;
    END
    
    BEGIN TRY
        -- Log start
        INSERT INTO dbo.DatabaseMigrations (Version, Description, Script, Checksum, Success)
        VALUES (@Version, @Description, @Script, @Checksum, 0);
        
        -- Execute migration (in real implementation, execute the script content)
        -- EXEC sp_executesql @SqlContent;
        
        -- Calculate execution time
        SET @ExecutionTimeMs = DATEDIFF(MILLISECOND, @StartTime, SYSDATETIME());
        
        -- Mark as successful
        UPDATE dbo.DatabaseMigrations
        SET Success = 1,
            ExecutionTimeMs = @ExecutionTimeMs
        WHERE Version = @Version;
        
        PRINT 'Migration ' + @Version + ' completed in ' + CAST(@ExecutionTimeMs AS VARCHAR(10)) + 'ms';
        RETURN 0;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        
        -- Log failure
        UPDATE dbo.DatabaseMigrations
        SET Success = 0,
            ExecutionTimeMs = DATEDIFF(MILLISECOND, @StartTime, SYSDATETIME()),
            ErrorMessage = @ErrorMessage
        WHERE Version = @Version;
        
        RAISERROR('Migration %s failed: %s', 16, 1, @Version, @ErrorMessage);
        RETURN -1;
    END CATCH
END
GO
```

### 8. Azure SQL Migration

**On-Premises to Azure SQL**:

```sql
-- Step 1: Assess compatibility
-- Use Data Migration Assistant (DMA) or Azure Migrate

-- Step 2: Export schema
-- Use SSMS "Generate Scripts" with "Schema Only"

-- Step 3: Modify for Azure SQL compatibility
-- Remove unsupported features:
--   - FILESTREAM
--   - SQL CLR (limited support)
--   - Linked servers
--   - SQL Agent jobs (use Azure Automation/Logic Apps)
--   - Cross-database queries (use elastic queries)

-- Step 4: Create database in Azure
-- Use Azure Portal, Azure CLI, or Bicep

-- Step 5: Schema deployment
-- Execute generated/modified scripts

-- Step 6: Data migration options
-- a) Azure Database Migration Service (recommended for large DBs)
-- b) BACPAC import
-- c) Transactional replication
-- d) Custom ETL
```

**BACPAC Export/Import**:

```powershell
# Export BACPAC from SQL Server
SqlPackage.exe /Action:Export `
    /SourceServerName:localhost `
    /SourceDatabaseName:MyDatabase `
    /TargetFile:C:\Backups\MyDatabase.bacpac

# Import BACPAC to Azure SQL
SqlPackage.exe /Action:Import `
    /TargetServerName:myserver.database.windows.net `
    /TargetDatabaseName:MyDatabase `
    /TargetUser:myadmin `
    /TargetPassword:MyPassword123! `
    /SourceFile:C:\Backups\MyDatabase.bacpac
```

---

## Best Practices

### Migration Checklist

```markdown
## Pre-Migration
- [ ] Backup database
- [ ] Test migration in non-production environment
- [ ] Review execution plan for large data changes
- [ ] Estimate execution time
- [ ] Plan maintenance window if needed
- [ ] Notify stakeholders

## During Migration
- [ ] Monitor progress
- [ ] Check for blocking
- [ ] Verify transaction log space
- [ ] Have rollback script ready

## Post-Migration
- [ ] Verify data integrity
- [ ] Update statistics
- [ ] Test application functionality
- [ ] Document changes
- [ ] Update migration tracking table
```

### Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Long-running transactions | Use batch processing |
| Lock escalation | Smaller batches, ROWLOCK hint |
| Transaction log growth | Pre-size log, monitor |
| Missing rollback | Always create undo script |
| Non-idempotent scripts | Add existence checks |
| Breaking changes | Use expand-contract pattern |

---

## Quick Reference

| Operation | Online? | Blocking? |
|-----------|---------|-----------|
| CREATE TABLE | ✅ Yes | ❌ No |
| ADD COLUMN (nullable) | ✅ Yes | ❌ No |
| ADD COLUMN (NOT NULL + default) | ✅ Yes | ❌ No |
| ALTER COLUMN (expand size) | ✅ Yes | ⚠️ Brief |
| ALTER COLUMN (change type) | ❌ No | ✅ Yes |
| DROP COLUMN | ✅ Yes | ⚠️ Brief |
| CREATE INDEX (online) | ✅ Yes | ❌ No |
| DROP INDEX | ✅ Yes | ❌ No |
| ADD CONSTRAINT | ⚠️ Depends | ⚠️ Depends |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
