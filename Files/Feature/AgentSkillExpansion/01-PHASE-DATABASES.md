# Phase 1: Database Expansion

**Duration:** 2 weken  
**Status:** ✅ COMPLETE  
**Priority:** 🔴 Critical  
**Completed:** 2026-01-17

---

## 🎯 Phase Objective

Uitbreiden van database capabilities met Azure SQL, SQL Server, en T-SQL specifieke expertise. Dit maakt enterprise-grade database oplossingen mogelijk.

---

## ✅ Completed Deliverables

### Agents Created
| Agent | File | Status |
|-------|------|--------|
| @azure-sql-specialist | `.github/agents/@azure-sql-specialist.agent.md` | ✅ Complete |
| @sql-server-specialist | `.github/agents/@sql-server-specialist.agent.md` | ✅ Complete |

### Schemas Created
| Schema | File |
|--------|------|
| azure-sql-specialist.input | `.github/schemas/azure-sql-specialist.input.schema.json` |
| azure-sql-specialist.output | `.github/schemas/azure-sql-specialist.output.schema.json` |
| sql-server-specialist.input | `.github/schemas/sql-server-specialist.input.schema.json` |
| sql-server-specialist.output | `.github/schemas/sql-server-specialist.output.schema.json` |

### Skills Created
| Skill | File | Lines |
|-------|------|-------|
| azure-sql-patterns | `.github/skills/azure-sql-patterns.skill.md` | ~600 |
| tsql-programming | `.github/skills/tsql-programming.skill.md` | ~800 |
| sql-performance-tuning | `.github/skills/sql-performance-tuning.skill.md` | ~700 |
| database-migration | `.github/skills/database-migration.skill.md` | ~600 |

---

## 📋 Original Tasks (Completed)

### Task 1.1: @azure-sql-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Azure SQL Database specialist voor cloud-native database design, performance tuning, en Azure-specifieke features.

**Agent Definition:**

```markdown
# @azure-sql-specialist Agent

**Agent ID**: `@azure-sql-specialist`  
**Phase**: 15  
**Purpose**: Design and implement Azure SQL Database solutions  
**Triggers From**: @database-specialist, @azure-architect  
**Hands Off To**: @devops-specialist, @bicep-specialist

---

## Core Responsibilities

### 1. Azure SQL Database Design
- DTU vs vCore selection
- Elastic pools configuration
- Geo-replication setup
- Serverless vs Provisioned
- Hyperscale architecture

### 2. Performance Optimization
- Query Store analysis
- Automatic tuning
- Intelligent Query Processing
- In-Memory OLTP
- Columnstore indexes

### 3. Security Implementation
- Azure AD authentication
- Always Encrypted
- Dynamic Data Masking
- Row-Level Security
- Transparent Data Encryption (TDE)

### 4. High Availability
- Active geo-replication
- Auto-failover groups
- Zone redundancy
- Point-in-time restore
- Long-term backup retention
```

**Skills Required:**
- azure-sql-patterns
- sql-performance-tuning
- tsql-programming

**Acceptance Criteria:**
- [ ] Agent file created with full specification
- [ ] Input/Output schemas defined
- [ ] Phase integration documented
- [ ] Handoff protocols defined
- [ ] Unit tests for agent activation

**Files to Create:**
- `.github/agents/@azure-sql-specialist.agent.md`
- `.github/schemas/azure-sql-specialist.input.schema.json`
- `.github/schemas/azure-sql-specialist.output.schema.json`

---

### Task 1.2: @sql-server-specialist Agent

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
On-premises SQL Server specialist voor enterprise database solutions, T-SQL development, en administration.

**Agent Definition:**

```markdown
# @sql-server-specialist Agent

**Agent ID**: `@sql-server-specialist`  
**Phase**: 15  
**Purpose**: Design and implement SQL Server solutions  
**Triggers From**: @database-specialist, @backend-specialist  
**Hands Off To**: @devops-specialist

---

## Core Responsibilities

### 1. Database Design
- Schema design (3NF, Star Schema)
- Table partitioning
- Filegroup management
- Compression strategies
- Temporal tables

### 2. T-SQL Development
- Stored procedures
- Functions (scalar, table-valued, inline)
- Triggers (DML, DDL, Logon)
- Views (indexed, partitioned)
- Common Table Expressions (CTEs)

### 3. Performance Tuning
- Execution plan analysis
- Index optimization
- Statistics management
- Query hints
- Plan guides

### 4. Administration
- Backup strategies (Full, Differential, Log)
- DBCC commands
- AlwaysOn Availability Groups
- Replication (Transactional, Merge, Snapshot)
- Service Broker
```

**Skills Required:**
- tsql-programming
- sql-performance-tuning
- database-migration

**Acceptance Criteria:**
- [ ] Agent file created with full specification
- [ ] T-SQL code generation patterns defined
- [ ] Administration procedures documented
- [ ] Integration with @database-specialist
- [ ] Unit tests

**Files to Create:**
- `.github/agents/@sql-server-specialist.agent.md`
- `.github/schemas/sql-server-specialist.input.schema.json`
- `.github/schemas/sql-server-specialist.output.schema.json`

---

### Task 1.3: azure-sql-patterns Skill

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
Best practices en patterns voor Azure SQL Database development.

**Skill Content:**

```markdown
# Azure SQL Patterns Skill

## Overview
**Skill ID**: `azure-sql-patterns`  
**Version**: 1.0  
**Domain**: Azure SQL Database design and optimization  
**Phase**: 15 (@azure-sql-specialist)

---

## Core Patterns

### 1. Service Tier Selection

| Scenario | Tier | Configuration |
|----------|------|---------------|
| Dev/Test | Basic | 5 DTU |
| Small App | Standard S0-S3 | 10-100 DTU |
| Production | Premium P1-P15 | 125-4000 DTU |
| Unpredictable | Serverless | Auto-scale |
| Large Scale | Hyperscale | Up to 100TB |
| Multi-tenant | Elastic Pool | Shared DTUs |

### 2. Elastic Pool Pattern

​```sql
-- Create elastic pool
CREATE ELASTIC POOL [MyPool]
WITH (
    EDITION = 'Standard',
    DTU = 100,
    MIN_DTU_PER_DATABASE = 0,
    MAX_DTU_PER_DATABASE = 50
);

-- Add database to pool
ALTER DATABASE [MyDatabase]
MODIFY (SERVICE_OBJECTIVE = ELASTIC_POOL(NAME = [MyPool]));
​```

### 3. Geo-Replication Pattern

​```sql
-- Create secondary in different region
ALTER DATABASE [MyDatabase]
ADD SECONDARY ON SERVER [secondary-server]
WITH (ALLOW_CONNECTIONS = ALL);

-- Failover (planned)
ALTER DATABASE [MyDatabase] FAILOVER;
​```

### 4. Row-Level Security Pattern

​```sql
-- Security predicate function
CREATE FUNCTION dbo.fn_TenantFilter(@TenantId INT)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS Result
WHERE DATABASE_PRINCIPAL_ID() = DATABASE_PRINCIPAL_ID('dbo')
   OR @TenantId = CONVERT(INT, SESSION_CONTEXT(N'TenantId'));

-- Apply to table
CREATE SECURITY POLICY TenantPolicy
ADD FILTER PREDICATE dbo.fn_TenantFilter(TenantId) ON dbo.Orders;
​```
```

**Acceptance Criteria:**
- [ ] 10+ Azure SQL patterns documented
- [ ] Code examples for each pattern
- [ ] Anti-patterns identified
- [ ] Performance considerations
- [ ] Security best practices

**Files to Create:**
- `.github/skills/azure-sql-patterns.skill.md`

---

### Task 1.4: tsql-programming Skill

**Priority:** 🔴 Critical  
**Estimated:** 2 dagen

**Description:**  
T-SQL programming patterns, best practices, en code generation guidelines.

**Skill Content:**

```markdown
# T-SQL Programming Skill

## Overview
**Skill ID**: `tsql-programming`  
**Version**: 1.0  
**Domain**: T-SQL development and best practices  
**Phase**: 15 (@sql-server-specialist, @azure-sql-specialist)

---

## Core Patterns

### 1. Stored Procedure Template

​```sql
CREATE OR ALTER PROCEDURE dbo.usp_GetOrdersByCustomer
    @CustomerId INT,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    BEGIN TRY
        -- Parameter validation
        IF @CustomerId IS NULL
            THROW 50001, 'CustomerId is required', 1;
        
        IF @PageNumber < 1 SET @PageNumber = 1;
        IF @PageSize < 1 OR @PageSize > 100 SET @PageSize = 20;
        
        -- Default date range
        SET @StartDate = ISNULL(@StartDate, DATEADD(YEAR, -1, GETDATE()));
        SET @EndDate = ISNULL(@EndDate, GETDATE());
        
        -- Main query with pagination
        SELECT 
            o.OrderId,
            o.OrderDate,
            o.TotalAmount,
            o.Status
        FROM dbo.Orders o
        WHERE o.CustomerId = @CustomerId
          AND o.OrderDate BETWEEN @StartDate AND @EndDate
        ORDER BY o.OrderDate DESC
        OFFSET (@PageNumber - 1) * @PageSize ROWS
        FETCH NEXT @PageSize ROWS ONLY;
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END;
GO
​```

### 2. Table-Valued Function Pattern

​```sql
CREATE OR ALTER FUNCTION dbo.fn_GetCustomerOrders
(
    @CustomerId INT,
    @Status VARCHAR(20) = NULL
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        o.OrderId,
        o.OrderDate,
        o.TotalAmount,
        o.Status,
        COUNT(oi.OrderItemId) AS ItemCount
    FROM dbo.Orders o
    LEFT JOIN dbo.OrderItems oi ON o.OrderId = oi.OrderId
    WHERE o.CustomerId = @CustomerId
      AND (@Status IS NULL OR o.Status = @Status)
    GROUP BY o.OrderId, o.OrderDate, o.TotalAmount, o.Status
);
GO
​```

### 3. Error Handling Pattern

​```sql
BEGIN TRY
    BEGIN TRANSACTION;
    
    -- Business logic here
    
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    
    -- Log error
    INSERT INTO dbo.ErrorLog (ErrorMessage, ErrorSeverity, ErrorState, ErrorDate)
    VALUES (@ErrorMessage, @ErrorSeverity, @ErrorState, GETDATE());
    
    -- Re-throw
    THROW;
END CATCH
​```

### 4. Temporal Table Pattern

​```sql
CREATE TABLE dbo.Products
(
    ProductId INT PRIMARY KEY,
    ProductName NVARCHAR(100),
    Price DECIMAL(18,2),
    ValidFrom DATETIME2 GENERATED ALWAYS AS ROW START,
    ValidTo DATETIME2 GENERATED ALWAYS AS ROW END,
    PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo)
)
WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.ProductsHistory));
​```
```

**Acceptance Criteria:**
- [ ] Stored procedure templates
- [ ] Function patterns (scalar, table-valued, inline)
- [ ] Error handling patterns
- [ ] Transaction management
- [ ] Performance best practices
- [ ] Security considerations

**Files to Create:**
- `.github/skills/tsql-programming.skill.md`

---

### Task 1.5: sql-performance-tuning Skill

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
SQL performance optimization techniques voor zowel SQL Server als Azure SQL.

**Skill Topics:**
- Index design strategies
- Query optimization
- Execution plan analysis
- Statistics management
- Wait stats analysis
- Memory optimization
- I/O optimization
- Columnstore indexes
- In-Memory OLTP

**Files to Create:**
- `.github/skills/sql-performance-tuning.skill.md`

---

### Task 1.6: database-migration Skill

**Priority:** 🟡 High  
**Estimated:** 1.5 dagen

**Description:**  
Database migration patterns van on-premises naar Azure SQL, en schema migration strategies.

**Skill Topics:**
- Schema comparison
- Data Migration Assistant (DMA)
- Azure Database Migration Service
- Offline vs Online migration
- Schema drift handling
- Rollback strategies
- Testing migration
- Post-migration validation

**Files to Create:**
- `.github/skills/database-migration.skill.md`

---

## 📁 Files Created This Phase

```
.github/agents/
├── @azure-sql-specialist.agent.md
└── @sql-server-specialist.agent.md

.github/skills/
├── azure-sql-patterns.skill.md
├── tsql-programming.skill.md
├── sql-performance-tuning.skill.md
└── database-migration.skill.md

.github/schemas/
├── azure-sql-specialist.input.schema.json
├── azure-sql-specialist.output.schema.json
├── sql-server-specialist.input.schema.json
└── sql-server-specialist.output.schema.json
```

---

## ✅ Phase Completion Checklist

- [ ] @azure-sql-specialist agent complete
- [ ] @sql-server-specialist agent complete
- [ ] azure-sql-patterns skill complete
- [ ] tsql-programming skill complete
- [ ] sql-performance-tuning skill complete
- [ ] database-migration skill complete
- [ ] All schemas defined
- [ ] Integration tests passing
- [ ] Documentation updated

---

## 🔗 Navigation

← [00-OVERVIEW.md](00-OVERVIEW.md) | → [02-PHASE-FRONTEND.md](02-PHASE-FRONTEND.md)
