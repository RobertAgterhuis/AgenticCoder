# SQL Schema Design Skill

## Overview
**Skill ID**: `sql-schema-design`  
**Version**: 1.0  
**Domain**: Relational database design, normalization, and schema optimization  
**Phase**: 15 (@database-specialist)  
**Maturity**: Production-Ready

SQL Schema Design skill covers normalization (1NF-BCNF), indexing strategies, constraint design, performance optimization, and implementing enterprise patterns (audit trails, soft deletes, partitioning) in relational databases.

---

## Core Concepts

### 1. Normalization Levels

**Definition**: Organizing data to reduce redundancy and improve data integrity.

```sql
-- ❌ BAD: Unnormalized (0NF)
CREATE TABLE Orders (
    OrderId INT PRIMARY KEY,
    CustomerName VARCHAR(100),
    Items VARCHAR(MAX) -- "Item1,Item2,Item3" - repeating values!
);

-- ✅ GOOD: First Normal Form (1NF) - Remove repeating groups
CREATE TABLE Orders (
    OrderId INT PRIMARY KEY,
    CustomerName VARCHAR(100)
);

CREATE TABLE OrderItems (
    OrderItemId INT PRIMARY KEY,
    OrderId INT FOREIGN KEY REFERENCES Orders(OrderId),
    ItemName VARCHAR(100),
    Quantity INT
);

-- ✅ GOOD: Second Normal Form (2NF) - Remove partial dependencies
-- Assumption: CustomerName depends on OrderId, but CustomerCity depends on CustomerName
CREATE TABLE Customers (
    CustomerId INT PRIMARY KEY,
    CustomerName VARCHAR(100),
    CustomerCity VARCHAR(100)
);

CREATE TABLE Orders (
    OrderId INT PRIMARY KEY,
    CustomerId INT FOREIGN KEY REFERENCES Customers(CustomerId),
    OrderDate DATE
);

-- ✅ GOOD: Third Normal Form (3NF) - Remove transitive dependencies
-- Remove: CustomerCity depends on CustomerName (not directly on key)
CREATE TABLE Cities (
    CityId INT PRIMARY KEY,
    CityName VARCHAR(100)
);

CREATE TABLE Customers (
    CustomerId INT PRIMARY KEY,
    CustomerName VARCHAR(100),
    CityId INT FOREIGN KEY REFERENCES Cities(CityId)
);

-- ✅ EXCELLENT: Boyce-Codd Normal Form (BCNF) - Every determinant is a candidate key
-- No anomalies; most restricted normalization
```

**Normalization Benefits**:
- ✅ Eliminates data redundancy
- ✅ Improves data integrity
- ✅ Simplifies updates (single source of truth)
- ✅ Reduces storage size

**Denormalization Tradeoff** (for performance):
- ✅ Faster queries (fewer joins)
- ❌ Increased storage
- ❌ Complex updates
- **Rule**: Normalize first, denormalize only if measurements prove necessary

### 2. Primary & Foreign Keys

**Definition**: Uniquely identify records and enforce referential integrity.

```sql
-- Single-column primary key
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Email VARCHAR(255) NOT NULL UNIQUE,
    Name VARCHAR(100) NOT NULL
);

-- Composite primary key (multiple columns)
CREATE TABLE StudentCourse (
    StudentId INT NOT NULL,
    CourseId INT NOT NULL,
    EnrollmentDate DATE,
    Grade DECIMAL(3,2),
    PRIMARY KEY (StudentId, CourseId),
    FOREIGN KEY (StudentId) REFERENCES Students(StudentId),
    FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
);

-- Foreign key with delete behavior
CREATE TABLE Orders (
    OrderId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    OrderDate DATE,
    
    -- CASCADE: Delete orders when user deleted
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE Products (
    ProductId INT PRIMARY KEY IDENTITY(1,1),
    CategoryId INT,
    Name VARCHAR(200) NOT NULL,
    Price DECIMAL(10,2),
    
    -- RESTRICT: Prevent category deletion if products exist
    FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT
);

CREATE TABLE Invoices (
    InvoiceId INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,
    Amount DECIMAL(12,2),
    
    -- SET NULL: Set OrderId to NULL when order deleted
    FOREIGN KEY (OrderId) REFERENCES Orders(OrderId)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
```

**Delete Behavior Options**:
| Behavior | Effect | Use Case |
|----------|--------|----------|
| CASCADE | Delete dependent rows | Orders → Order Items |
| RESTRICT | Prevent delete if dependents exist | Users → Orders |
| SET NULL | Set FK to NULL | Invoices → Orders (optional) |
| NO ACTION | Like RESTRICT, deferred check | Similar to RESTRICT |

### 3. Indexes for Performance

**Definition**: Data structures that speed up data retrieval.

```sql
-- Simple index on single column
CREATE INDEX IX_Users_Email ON Users(Email);

-- Composite index (order matters)
CREATE INDEX IX_Orders_UserDate ON Orders(UserId, OrderDate);

-- Query uses index because columns match
SELECT * FROM Orders WHERE UserId = 5 AND OrderDate > '2024-01-01';

-- Unique index (prevents duplicates)
CREATE UNIQUE INDEX IX_Users_Email_Unique ON Users(Email);

-- Filtered index (partial index)
CREATE INDEX IX_Orders_Active ON Orders(Status)
WHERE Status IN ('Pending', 'Processing');

-- Covering index (includes additional columns)
CREATE INDEX IX_Orders_Covering ON Orders(UserId, OrderDate)
INCLUDE (Total, Status);

-- Query can be answered entirely from index (no table access)
SELECT UserId, OrderDate, Total, Status FROM Orders WHERE UserId = 5;

-- Clustered index (physical table order) - only one per table
CREATE CLUSTERED INDEX PK_Orders ON Orders(OrderId);

-- Non-clustered index
CREATE NONCLUSTERED INDEX IX_Orders_UserId ON Orders(UserId);

-- Index statistics (help optimizer choose best index)
CREATE STATISTICS stat_Orders_UserIdDate ON Orders(UserId, OrderDate);
```

**Indexing Strategy**:
1. **Primary Key**: Always clustered
2. **Foreign Keys**: Index for joins and filtering
3. **WHERE Columns**: Index frequently filtered columns
4. **ORDER BY Columns**: Index sort columns
5. **High Cardinality**: Index columns with many distinct values
6. **AVOID**: Indexing low-cardinality columns (bool, small int)

### 4. Constraints & Data Integrity

**Definition**: Rules that enforce data quality and consistency.

```sql
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    
    -- NOT NULL: Column must have value
    Email VARCHAR(255) NOT NULL,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    
    -- UNIQUE: No duplicate values (NULL allowed)
    Username VARCHAR(50) UNIQUE,
    
    -- CHECK: Value must satisfy condition
    Age INT CHECK (Age >= 18 AND Age <= 150),
    Email VARCHAR(255) CHECK (Email LIKE '%@%.%'),
    Status VARCHAR(20) CHECK (Status IN ('Active', 'Inactive', 'Pending')),
    
    -- DEFAULT: Automatic value if not provided
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    IsActive BIT DEFAULT 1,
    IsDeleted BIT DEFAULT 0
);

-- Named constraint (better for modifications)
CREATE TABLE Orders (
    OrderId INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,
    OrderDate DATE NOT NULL DEFAULT GETDATE(),
    Status VARCHAR(20),
    Total DECIMAL(12,2),
    
    CONSTRAINT FK_Orders_Users 
        FOREIGN KEY (UserId) REFERENCES Users(UserId),
    
    CONSTRAINT CK_Orders_Status 
        CHECK (Status IN ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')),
    
    CONSTRAINT CK_Orders_Total 
        CHECK (Total >= 0),
    
    CONSTRAINT UC_Orders_Unique 
        UNIQUE (UserId, OrderDate)
);

-- Add constraint to existing table
ALTER TABLE Users
ADD CONSTRAINT CK_Users_Age CHECK (Age >= 0);

-- Drop constraint
ALTER TABLE Users
DROP CONSTRAINT CK_Users_Age;
```

### 5. Enterprise Patterns

**Definition**: Common database patterns for real-world requirements.

```sql
-- PATTERN 1: Audit Trail (track changes)
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(100),
    Email VARCHAR(255),
    CreatedAt DATETIME DEFAULT GETUTCDATE(),
    CreatedBy VARCHAR(100),
    UpdatedAt DATETIME DEFAULT GETUTCDATE(),
    UpdatedBy VARCHAR(100),
    DeletedAt DATETIME NULL,
    DeletedBy VARCHAR(100) NULL
);

-- Trigger to update audit columns
CREATE TRIGGER TR_Users_Update
ON Users
AFTER UPDATE
AS BEGIN
    UPDATE Users
    SET UpdatedAt = GETUTCDATE(),
        UpdatedBy = SYSTEM_USER
    WHERE UserId IN (SELECT UserId FROM inserted);
END;

-- PATTERN 2: Soft Delete (logical deletion)
CREATE TABLE Products (
    ProductId INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(200),
    IsDeleted BIT DEFAULT 0,
    DeletedAt DATETIME NULL
);

-- Query active products only
SELECT * FROM Products WHERE IsDeleted = 0;

-- View for convenience
CREATE VIEW ActiveProducts AS
SELECT * FROM Products WHERE IsDeleted = 0;

-- PATTERN 3: Versioning (track record history)
CREATE TABLE Users (
    UserId INT,
    Version INT,
    Name VARCHAR(100),
    Email VARCHAR(255),
    EffectiveFrom DATETIME,
    EffectiveTo DATETIME NULL,
    PRIMARY KEY (UserId, Version),
    UNIQUE (UserId, EffectiveFrom)
);

-- Current version
SELECT * FROM Users WHERE EffectiveTo IS NULL;

-- PATTERN 4: Partitioning (split large tables)
CREATE TABLE Orders (
    OrderId INT,
    OrderDate DATE,
    Total DECIMAL(12,2),
    Data VARCHAR(MAX)
) ON ps_OrderDate(OrderDate); -- Partition scheme

-- Partition function
CREATE PARTITION FUNCTION pf_OrderDate (DATE)
AS RANGE LEFT FOR VALUES
    ('2023-01-01', '2024-01-01', '2025-01-01');

-- Useful for: Large tables (100M+ rows), date-based data, archive scenarios

-- PATTERN 5: Row-Level Security (data privacy)
CREATE TABLE Employees (
    EmployeeId INT PRIMARY KEY,
    DepartmentId INT,
    Salary DECIMAL(10,2)
);

-- Create security policy
CREATE SECURITY POLICY EmployeePolicy
    ADD FILTER PREDICATE dbo.fn_EmployeeFilter(DepartmentId)
        ON Employees
    ADD BLOCK PREDICATE dbo.fn_EmployeeBlock(DepartmentId)
        ON Employees AFTER INSERT;

-- Filter function
CREATE FUNCTION fn_EmployeeFilter(@DepartmentId INT)
    RETURNS TABLE
    WITH SCHEMABINDING
AS
    RETURN (
        SELECT 1 AS result
        WHERE @DepartmentId = CAST(SESSION_CONTEXT(N'DepartmentId') AS INT)
    );

-- Now queries automatically filter by department
SELECT * FROM Employees; -- Only sees own department
```

### 6. Relationships & Integrity

**Definition**: Modeling different relationship types correctly.

```sql
-- ONE-TO-MANY: User has many Orders
CREATE TABLE Users (
    UserId INT PRIMARY KEY,
    Name VARCHAR(100)
);

CREATE TABLE Orders (
    OrderId INT PRIMARY KEY,
    UserId INT NOT NULL,
    OrderDate DATE,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- MANY-TO-MANY: Students enroll in many Courses, Courses have many Students
CREATE TABLE Students (
    StudentId INT PRIMARY KEY,
    Name VARCHAR(100)
);

CREATE TABLE Courses (
    CourseId INT PRIMARY KEY,
    Name VARCHAR(100)
);

CREATE TABLE StudentCourse (
    StudentId INT NOT NULL,
    CourseId INT NOT NULL,
    EnrollmentDate DATE,
    Grade DECIMAL(3,2),
    PRIMARY KEY (StudentId, CourseId),
    FOREIGN KEY (StudentId) REFERENCES Students(StudentId),
    FOREIGN KEY (CourseId) REFERENCES Courses(CourseId)
);

-- ONE-TO-ONE: User has one Profile
CREATE TABLE Users (
    UserId INT PRIMARY KEY,
    Email VARCHAR(255) UNIQUE
);

CREATE TABLE UserProfiles (
    ProfileId INT PRIMARY KEY,
    UserId INT NOT NULL UNIQUE, -- UNIQUE enforces 1:1
    Bio VARCHAR(500),
    Avatar VARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- HIERARCHICAL: Category tree (parent-child)
CREATE TABLE Categories (
    CategoryId INT PRIMARY KEY,
    Name VARCHAR(100),
    ParentCategoryId INT NULL,
    FOREIGN KEY (ParentCategoryId) REFERENCES Categories(CategoryId)
);

-- Query hierarchy
WITH CategoryHierarchy AS (
    -- Anchor: Root categories
    SELECT CategoryId, Name, ParentCategoryId, 0 AS Level
    FROM Categories
    WHERE ParentCategoryId IS NULL
    
    UNION ALL
    
    -- Recursive: Child categories
    SELECT c.CategoryId, c.Name, c.ParentCategoryId, h.Level + 1
    FROM Categories c
    INNER JOIN CategoryHierarchy h
        ON c.ParentCategoryId = h.CategoryId
)
SELECT * FROM CategoryHierarchy;
```

---

## Best Practices

### 1. Naming Conventions

```sql
-- ✅ GOOD: Consistent, descriptive naming
CREATE TABLE Users (
    UserId INT PRIMARY KEY,          -- Table_ColumnId format
    FirstName VARCHAR(50),           -- PascalCase
    LastName VARCHAR(50),
    EmailAddress VARCHAR(255),       -- Complete, unambiguous names
    DateOfBirth DATE,
    IsActive BIT,                    -- Boolean prefix with "Is"
    CreatedAt DATETIME               -- Timestamps with "At"
);

CREATE INDEX IX_Users_Email ON Users(EmailAddress);      -- IX_ prefix for indexes
CREATE UNIQUE INDEX UX_Users_Email ON Users(EmailAddress); -- UX_ for unique

ALTER TABLE Users 
    ADD CONSTRAINT PK_Users PRIMARY KEY (UserId);       -- PK_ prefix
    ADD CONSTRAINT FK_Users_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(DepartmentId); -- FK_ prefix
    ADD CONSTRAINT CK_Users_Age CHECK (Age >= 0);       -- CK_ prefix
    ADD CONSTRAINT UC_Users_Email UNIQUE (EmailAddress); -- UC_ prefix

-- ❌ BAD: Inconsistent, ambiguous names
CREATE TABLE u (   -- Too short
    uid INT,       -- Unclear
    fn VARCHAR(50), -- Abbreviated
    ln VARCHAR(50),
    e VARCHAR(255) -- What does 'e' mean?
);
```

### 2. Data Type Selection

```sql
-- ✅ GOOD: Appropriate types
CREATE TABLE Products (
    ProductId INT,                      -- Identity/sequential ID
    Name VARCHAR(200),                  -- Variable-length string
    Sku CHAR(20),                       -- Fixed-length (product codes)
    Description VARCHAR(MAX),           -- Large text
    Price DECIMAL(10,2),                -- Currency (not FLOAT!)
    Quantity INT,                       -- Whole numbers
    ReleaseDate DATE,                   -- Date only
    CreatedAt DATETIME2(3),             -- DateTime with millisecond precision
    IsActive BIT,                       -- Boolean
    Tags NVARCHAR(MAX)                  -- Unicode for international characters
);

-- ❌ BAD: Wrong types
CREATE TABLE BadProducts (
    Price FLOAT,                 -- FLOAT loses precision for money!
    ReleaseDate VARCHAR(10),     -- Store date as string (sorting breaks)
    IsActive INT,                -- Use INT for boolean (wastes space)
    Quantity BIGINT              -- BIGINT for small numbers (wastes space)
);
```

### 3. Index Strategy

```sql
-- ❌ BAD: Over-indexing
CREATE INDEX IX1 ON Orders(UserId);
CREATE INDEX IX2 ON Orders(OrderDate);
CREATE INDEX IX3 ON Orders(Status);
CREATE INDEX IX4 ON Orders(Total);
-- Every column indexed = slower writes, bigger storage

-- ✅ GOOD: Strategic indexing
-- 1. Foreign keys for joins
CREATE INDEX IX_Orders_UserId ON Orders(UserId);

-- 2. Frequently filtered columns
CREATE INDEX IX_Orders_Status ON Orders(Status);

-- 3. Order by columns
CREATE INDEX IX_Orders_OrderDate ON Orders(OrderDate);

-- 4. Composite for common queries
-- Query: WHERE UserId = ? AND OrderDate > ? ORDER BY OrderDate
CREATE INDEX IX_Orders_UserDate ON Orders(UserId, OrderDate DESC);

-- 5. Covering index for aggregation queries
CREATE INDEX IX_Orders_Covering ON Orders(UserId)
INCLUDE (Total, Status);
```

### 4. Avoiding Common Mistakes

```sql
-- ❌ BAD: String IDs (slower joins, larger storage)
CREATE TABLE Users (
    UserId VARCHAR(36) PRIMARY KEY -- UUID as string
);

-- ✅ GOOD: Integer IDs
CREATE TABLE Users (
    UserId INT PRIMARY KEY IDENTITY(1,1)
);

-- ❌ BAD: Nullable FK (may cause unexpected NULLs)
CREATE TABLE Orders (
    UserId INT NULL -- FK should NOT be NULL
);

-- ✅ GOOD: Non-nullable FK
CREATE TABLE Orders (
    UserId INT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- ❌ BAD: Denormalization without reason
CREATE TABLE Orders (
    OrderId INT,
    UserId INT,
    UserName VARCHAR(100),    -- Denormalized: Get from Users table
    UserEmail VARCHAR(255),   -- Denormalized: Get from Users table
    UserCity VARCHAR(100)     -- Denormalized: Get from Users table
);

-- ✅ GOOD: Normalized with join if needed
SELECT o.OrderId, u.Name, u.Email
FROM Orders o
JOIN Users u ON o.UserId = u.UserId;
```

### 5. Monitoring Query Performance

```sql
-- Find slow queries
SELECT TOP 20
    qs.execution_count,
    qs.total_elapsed_time / 1000000 AS TotalSeconds,
    qs.total_elapsed_time / qs.execution_count / 1000 AS AvgMS,
    st.text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
ORDER BY qs.total_elapsed_time DESC;

-- Check missing indexes
SELECT
    mid.equality_columns,
    mid.included_columns,
    migs.user_seeks,
    migs.user_scans
FROM sys.dm_db_missing_index_details mid
INNER JOIN sys.dm_db_missing_index_groups_stats migs
    ON mid.index_handle = migs.index_group_handle
ORDER BY migs.user_seeks + migs.user_scans DESC;

-- Analyze query execution plan
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

SELECT * FROM Orders WHERE UserId = 5;

SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
-- Look for: logical reads, scan count, elapsed time
```

---

## Anti-Patterns (What to Avoid)

### 1. Incorrect Normalization Level

```sql
-- ❌ BAD: Over-normalization (too many joins)
CREATE TABLE ProductDetails (
    NameId INT,
    DescriptionId INT,
    CurrencyId INT,
    ...
);
-- Simple query requires 20 joins!

-- ✅ GOOD: 3NF with strategic denormalization
CREATE TABLE Products (
    ProductId INT,
    Name VARCHAR(200),
    Description VARCHAR(MAX),
    Price DECIMAL(10,2),
    Currency VARCHAR(3)
);
```

### 2. No Indexes or Wrong Indexes

```sql
-- ❌ BAD: No indexes on filter columns
SELECT * FROM Orders WHERE UserId = 5; -- Full table scan!

-- ✅ GOOD: Index on filter column
CREATE INDEX IX_Orders_UserId ON Orders(UserId);
```

### 3. Using VARCHAR for Dates

```sql
-- ❌ BAD: String dates
CREATE TABLE Orders (
    OrderDate VARCHAR(10) -- "2024-01-15"
);
SELECT * FROM Orders WHERE OrderDate > '2024-01-01'; -- String comparison!

-- ✅ GOOD: Date type
CREATE TABLE Orders (
    OrderDate DATE
);
SELECT * FROM Orders WHERE OrderDate > '2024-01-01'; -- Date comparison, can use indexes
```

---

## Validation Criteria

When this skill is applied:
- ✅ Tables normalized to 3NF minimum
- ✅ Primary/foreign keys defined
- ✅ Appropriate constraints (NOT NULL, UNIQUE, CHECK, DEFAULT)
- ✅ Indexes on FK, filter, and sort columns
- ✅ Audit columns (CreatedAt, UpdatedAt)
- ✅ Soft delete support
- ✅ No N+1 query problems possible
- ✅ Data types appropriate (DECIMAL for currency, not FLOAT)
- ✅ Naming conventions consistent
- ✅ Delete behaviors configured

---

## Further Reading
- SQL Server Indexing: https://learn.microsoft.com/sql/relational-databases/indexes/
- Database Design: https://learn.microsoft.com/sql/relational-databases/tables/tables
- Query Performance: https://learn.microsoft.com/sql/relational-databases/performance/
