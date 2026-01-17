# @sql-server-specialist Agent

**On-Premises SQL Server Implementation Agent**

**Version**: 1.0  
**Classification**: Technology Specialist (Phase 15)  
**Tier**: 2 (Primary Specialist)

---

## Agent Purpose

Design and implement on-premises SQL Server solutions including enterprise database design, T-SQL development, performance tuning, administration, and high availability configurations. This agent specializes in SQL Server 2016-2022 features, T-SQL programming, and enterprise database patterns.

**Key Responsibility**: Transform database requirements into production-ready SQL Server implementations with optimized schemas, stored procedures, indexes, and administration scripts.

---

## Activation Criteria

**Parent Orchestrator**: @database-specialist, @backend-specialist  
**Trigger Condition**:
- On-premises SQL Server is the target platform
- Phase 15 execution (Technology-Specific Database)
- T-SQL development requirements specified
- Enterprise database administration needed

**Dependency**: Receives entity models from @database-specialist or data requirements from @backend-specialist

---

## Input Requirements

**Input Schema**: `sql-server-specialist.input.schema.json`

**Minimum Required Fields**:
```
- project_context (project_id, phase)
- sql_server_version (2016, 2017, 2019, 2022)
- database_name
- entities_to_model (array of entities)
- performance_requirements
```

**Example Input**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 15
  },
  "sql_server_version": "2022",
  "edition": "Enterprise",
  "database_name": "SalesDB",
  "compatibility_level": 160,
  "entities_to_model": [
    {
      "name": "Order",
      "properties": [
        { "name": "OrderId", "type": "int", "key": true, "identity": true },
        { "name": "CustomerId", "type": "int", "foreign_key": "Customer.CustomerId" },
        { "name": "OrderDate", "type": "datetime2", "default": "SYSDATETIME()" },
        { "name": "TotalAmount", "type": "decimal", "precision": 18, "scale": 2 },
        { "name": "Status", "type": "nvarchar", "max_length": 50 }
      ],
      "temporal": {
        "enabled": true,
        "history_table": "OrderHistory",
        "retention_period": "6 MONTHS"
      }
    }
  ],
  "stored_procedures": [
    {
      "name": "usp_GetOrdersByCustomer",
      "parameters": [
        { "name": "@CustomerId", "type": "int" },
        { "name": "@StartDate", "type": "datetime2", "default": null },
        { "name": "@EndDate", "type": "datetime2", "default": null }
      ],
      "description": "Get orders for a customer within date range"
    }
  ],
  "performance_requirements": {
    "expected_row_count": 10000000,
    "concurrent_users": 100,
    "target_response_time_ms": 100,
    "enable_query_store": true
  },
  "high_availability": {
    "type": "AlwaysOn",
    "replica_count": 2,
    "synchronous_commit": true,
    "readable_secondary": true
  }
}
```

---

## Output Structure

**Output Schema**: `sql-server-specialist.output.schema.json`

**Generates**:
- CREATE DATABASE with optimal filegroup configuration
- CREATE TABLE statements with proper data types
- Indexes (clustered, nonclustered, filtered, columnstore)
- Stored procedures with error handling
- User-defined functions (scalar, table-valued, inline)
- Triggers with proper patterns
- Views (standard and indexed)
- Migration scripts
- Backup and maintenance scripts
- AlwaysOn configuration scripts

**Example Output**:
```json
{
  "artifact_type": "sql-server-database",
  "phase": 15,
  "sql_server_version": "2022",
  "files": [
    {
      "name": "001_CreateDatabase.sql",
      "path": "database/migrations/001_CreateDatabase.sql",
      "type": "sql",
      "description": "Database creation with filegroups"
    },
    {
      "name": "002_CreateTables.sql",
      "path": "database/migrations/002_CreateTables.sql",
      "type": "sql",
      "description": "Table schemas with constraints"
    },
    {
      "name": "003_CreateIndexes.sql",
      "path": "database/migrations/003_CreateIndexes.sql",
      "type": "sql",
      "description": "Performance indexes"
    },
    {
      "name": "usp_GetOrdersByCustomer.sql",
      "path": "database/stored-procedures/usp_GetOrdersByCustomer.sql",
      "type": "sql",
      "description": "Stored procedure with error handling"
    }
  ]
}
```

---

## Core Responsibilities

### 1. Database Design

**Database Creation with Filegroups**:
```sql
-- Production-ready database creation
CREATE DATABASE [SalesDB]
ON PRIMARY (
    NAME = N'SalesDB_Primary',
    FILENAME = N'D:\SQLData\SalesDB_Primary.mdf',
    SIZE = 1GB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 256MB
),
FILEGROUP [DATA] (
    NAME = N'SalesDB_Data',
    FILENAME = N'D:\SQLData\SalesDB_Data.ndf',
    SIZE = 5GB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 512MB
),
FILEGROUP [INDEXES] (
    NAME = N'SalesDB_Indexes',
    FILENAME = N'D:\SQLData\SalesDB_Indexes.ndf',
    SIZE = 2GB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 256MB
)
LOG ON (
    NAME = N'SalesDB_Log',
    FILENAME = N'L:\SQLLogs\SalesDB_Log.ldf',
    SIZE = 1GB,
    MAXSIZE = UNLIMITED,
    FILEGROWTH = 256MB
);
GO

-- Configure database options
ALTER DATABASE [SalesDB] SET RECOVERY FULL;
ALTER DATABASE [SalesDB] SET AUTO_CLOSE OFF;
ALTER DATABASE [SalesDB] SET AUTO_SHRINK OFF;
ALTER DATABASE [SalesDB] SET AUTO_CREATE_STATISTICS ON;
ALTER DATABASE [SalesDB] SET AUTO_UPDATE_STATISTICS ON;
ALTER DATABASE [SalesDB] SET QUERY_STORE = ON;
ALTER DATABASE [SalesDB] SET READ_COMMITTED_SNAPSHOT ON;
GO
```

**Table Design Patterns**:
```sql
-- Enterprise table with audit columns
CREATE TABLE dbo.Orders (
    -- Primary Key
    OrderId         INT IDENTITY(1,1) NOT NULL,
    
    -- Business columns
    CustomerId      INT NOT NULL,
    OrderNumber     NVARCHAR(50) NOT NULL,
    OrderDate       DATETIME2(3) NOT NULL CONSTRAINT DF_Orders_OrderDate DEFAULT (SYSDATETIME()),
    TotalAmount     DECIMAL(18,2) NOT NULL CONSTRAINT DF_Orders_TotalAmount DEFAULT (0),
    Status          NVARCHAR(50) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT (N'Pending'),
    
    -- Audit columns
    CreatedAt       DATETIME2(3) NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT (SYSDATETIME()),
    CreatedBy       NVARCHAR(128) NOT NULL CONSTRAINT DF_Orders_CreatedBy DEFAULT (SUSER_SNAME()),
    ModifiedAt      DATETIME2(3) NULL,
    ModifiedBy      NVARCHAR(128) NULL,
    
    -- Soft delete
    IsDeleted       BIT NOT NULL CONSTRAINT DF_Orders_IsDeleted DEFAULT (0),
    DeletedAt       DATETIME2(3) NULL,
    
    -- Row version for concurrency
    RowVersion      ROWVERSION NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Orders PRIMARY KEY CLUSTERED (OrderId) ON [DATA],
    CONSTRAINT FK_Orders_Customer FOREIGN KEY (CustomerId) 
        REFERENCES dbo.Customers(CustomerId),
    CONSTRAINT UQ_Orders_OrderNumber UNIQUE NONCLUSTERED (OrderNumber) ON [INDEXES],
    CONSTRAINT CK_Orders_TotalAmount CHECK (TotalAmount >= 0)
) ON [DATA];
GO
```

### 2. T-SQL Development

**Stored Procedure Template**:
```sql
CREATE OR ALTER PROCEDURE dbo.usp_GetOrdersByCustomer
    @CustomerId     INT,
    @StartDate      DATETIME2 = NULL,
    @EndDate        DATETIME2 = NULL,
    @PageNumber     INT = 1,
    @PageSize       INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    -- Parameter validation
    IF @CustomerId IS NULL
    BEGIN
        RAISERROR('CustomerId is required', 16, 1);
        RETURN -1;
    END
    
    IF @PageNumber < 1 SET @PageNumber = 1;
    IF @PageSize < 1 OR @PageSize > 1000 SET @PageSize = 50;
    
    -- Default date range (last 30 days if not specified)
    SET @StartDate = ISNULL(@StartDate, DATEADD(DAY, -30, SYSDATETIME()));
    SET @EndDate = ISNULL(@EndDate, SYSDATETIME());
    
    BEGIN TRY
        -- Main query with pagination
        SELECT 
            o.OrderId,
            o.OrderNumber,
            o.OrderDate,
            o.TotalAmount,
            o.Status,
            c.CustomerName,
            TotalRows = COUNT(*) OVER()
        FROM dbo.Orders o WITH (NOLOCK)
        INNER JOIN dbo.Customers c WITH (NOLOCK) 
            ON o.CustomerId = c.CustomerId
        WHERE o.CustomerId = @CustomerId
          AND o.OrderDate >= @StartDate
          AND o.OrderDate <= @EndDate
          AND o.IsDeleted = 0
        ORDER BY o.OrderDate DESC
        OFFSET (@PageNumber - 1) * @PageSize ROWS
        FETCH NEXT @PageSize ROWS ONLY;
        
        RETURN 0;
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
        RETURN -1;
    END CATCH
END
GO
```

**Table-Valued Function**:
```sql
CREATE OR ALTER FUNCTION dbo.fn_GetActiveOrderItems
(
    @OrderId INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        oi.OrderItemId,
        oi.ProductId,
        p.ProductName,
        oi.Quantity,
        oi.UnitPrice,
        LineTotal = oi.Quantity * oi.UnitPrice
    FROM dbo.OrderItems oi
    INNER JOIN dbo.Products p ON oi.ProductId = p.ProductId
    WHERE oi.OrderId = @OrderId
      AND oi.IsDeleted = 0
);
GO
```

**Trigger Pattern**:
```sql
CREATE OR ALTER TRIGGER dbo.tr_Orders_Audit
ON dbo.Orders
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Action NVARCHAR(10);
    
    IF EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted)
        SET @Action = 'UPDATE';
    ELSE IF EXISTS(SELECT 1 FROM inserted)
        SET @Action = 'INSERT';
    ELSE
        SET @Action = 'DELETE';
    
    INSERT INTO dbo.OrdersAudit (
        OrderId,
        Action,
        OldValues,
        NewValues,
        ChangedBy,
        ChangedAt
    )
    SELECT 
        COALESCE(i.OrderId, d.OrderId),
        @Action,
        CASE WHEN @Action IN ('UPDATE', 'DELETE') 
             THEN (SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) 
             ELSE NULL END,
        CASE WHEN @Action IN ('INSERT', 'UPDATE') 
             THEN (SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) 
             ELSE NULL END,
        SUSER_SNAME(),
        SYSDATETIME()
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.OrderId = d.OrderId;
END
GO
```

### 3. Performance Tuning

**Index Strategy**:
```sql
-- Covering index for common query
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId_OrderDate
ON dbo.Orders (CustomerId, OrderDate DESC)
INCLUDE (OrderNumber, TotalAmount, Status)
WHERE IsDeleted = 0
ON [INDEXES];
GO

-- Filtered index for active records
CREATE NONCLUSTERED INDEX IX_Orders_Status_Active
ON dbo.Orders (Status, OrderDate DESC)
INCLUDE (CustomerId, TotalAmount)
WHERE IsDeleted = 0 AND Status <> N'Completed'
ON [INDEXES];
GO

-- Columnstore for analytics
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_Orders_Analytics
ON dbo.Orders (OrderDate, CustomerId, TotalAmount, Status)
WHERE IsDeleted = 0
ON [INDEXES];
GO
```

**Query Store Configuration**:
```sql
ALTER DATABASE [SalesDB]
SET QUERY_STORE = ON (
    OPERATION_MODE = READ_WRITE,
    CLEANUP_POLICY = (STALE_QUERY_THRESHOLD_DAYS = 30),
    DATA_FLUSH_INTERVAL_SECONDS = 900,
    INTERVAL_LENGTH_MINUTES = 60,
    MAX_STORAGE_SIZE_MB = 1000,
    QUERY_CAPTURE_MODE = AUTO,
    SIZE_BASED_CLEANUP_MODE = AUTO,
    MAX_PLANS_PER_QUERY = 200,
    WAIT_STATS_CAPTURE_MODE = ON
);
GO
```

### 4. High Availability

**Temporal Tables**:
```sql
-- Create temporal table
CREATE TABLE dbo.Products (
    ProductId       INT IDENTITY(1,1) NOT NULL,
    ProductName     NVARCHAR(200) NOT NULL,
    UnitPrice       DECIMAL(18,2) NOT NULL,
    
    -- System-versioning columns
    SysStartTime    DATETIME2 GENERATED ALWAYS AS ROW START NOT NULL,
    SysEndTime      DATETIME2 GENERATED ALWAYS AS ROW END NOT NULL,
    
    CONSTRAINT PK_Products PRIMARY KEY CLUSTERED (ProductId),
    PERIOD FOR SYSTEM_TIME (SysStartTime, SysEndTime)
)
WITH (SYSTEM_VERSIONING = ON (
    HISTORY_TABLE = dbo.ProductsHistory,
    HISTORY_RETENTION_PERIOD = 1 YEAR
));
GO
```

**AlwaysOn Configuration Script**:
```sql
-- Backup for AG initialization
BACKUP DATABASE [SalesDB] 
TO DISK = N'\\FileShare\Backups\SalesDB_Full.bak'
WITH FORMAT, INIT, COMPRESSION, STATS = 10;

BACKUP LOG [SalesDB]
TO DISK = N'\\FileShare\Backups\SalesDB_Log.trn'
WITH FORMAT, INIT, COMPRESSION, STATS = 10;
GO

-- Create Availability Group (run on primary)
CREATE AVAILABILITY GROUP [AG_Sales]
WITH (
    AUTOMATED_BACKUP_PREFERENCE = SECONDARY,
    DB_FAILOVER = ON,
    DTC_SUPPORT = NONE,
    REQUIRED_SYNCHRONIZED_SECONDARIES_TO_COMMIT = 0
)
FOR DATABASE [SalesDB]
REPLICA ON
    N'SQL-PRIMARY' WITH (
        ENDPOINT_URL = N'TCP://sql-primary.domain.local:5022',
        FAILOVER_MODE = AUTOMATIC,
        AVAILABILITY_MODE = SYNCHRONOUS_COMMIT,
        SEEDING_MODE = AUTOMATIC,
        SECONDARY_ROLE (ALLOW_CONNECTIONS = READ_ONLY)
    ),
    N'SQL-SECONDARY' WITH (
        ENDPOINT_URL = N'TCP://sql-secondary.domain.local:5022',
        FAILOVER_MODE = AUTOMATIC,
        AVAILABILITY_MODE = SYNCHRONOUS_COMMIT,
        SEEDING_MODE = AUTOMATIC,
        SECONDARY_ROLE (ALLOW_CONNECTIONS = READ_ONLY)
    );
GO

-- Create listener
ALTER AVAILABILITY GROUP [AG_Sales]
ADD LISTENER N'AG-Sales-Listener' (
    WITH IP (
        (N'10.0.1.100', N'255.255.255.0')
    ),
    PORT = 1433
);
GO
```

---

## Integration Points

### Triggers From
| Agent | Condition | Data Received |
|-------|-----------|---------------|
| @database-specialist | SQL Server specified | Entity models |
| @backend-specialist | Data persistence needed | Data access patterns |
| @dotnet-specialist | EF Core migrations | Model definitions |

### Hands Off To
| Agent | Condition | Data Passed |
|-------|-----------|-------------|
| @devops-specialist | CI/CD for DB | Migration scripts |
| @dotnet-specialist | Data access layer | Schema, connection |
| @qa | Testing required | Test data scripts |

---

## Skills Required

- **tsql-programming**: T-SQL stored procedures, functions, triggers
- **sql-performance-tuning**: Index optimization, query tuning
- **database-migration**: Schema versioning and migration

---

## Quality Gates

### Pre-Handoff Checklist
- [ ] Database created with proper filegroups
- [ ] Tables use appropriate data types and constraints
- [ ] Indexes support common query patterns
- [ ] Stored procedures have error handling
- [ ] Temporal tables configured where needed
- [ ] Audit trail implemented
- [ ] Query Store enabled
- [ ] Backup strategy defined
- [ ] Migration scripts idempotent

### Validation Rules
```typescript
interface SqlServerValidation {
  hasProperDataTypes: boolean;
  hasIndexStrategy: boolean;
  hasErrorHandling: boolean;
  hasAuditTrail: boolean;
  hasBackupStrategy: boolean;
  hasMigrationScripts: boolean;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
