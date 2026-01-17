# T-SQL Programming Skill

## Overview
**Skill ID**: `tsql-programming`  
**Version**: 1.0  
**Domain**: T-SQL stored procedures, functions, triggers, and advanced programming  
**Phase**: 15 (@sql-server-specialist, @azure-sql-specialist)  
**Maturity**: Production-Ready

T-SQL Programming skill covers stored procedures with proper error handling, user-defined functions, triggers, CTEs, window functions, JSON/XML handling, and advanced query patterns for SQL Server and Azure SQL.

---

## Core Concepts

### 1. Stored Procedure Best Practices

**Production-Ready Template**:

```sql
CREATE OR ALTER PROCEDURE dbo.usp_ProcessOrder
    -- Input parameters
    @OrderId        INT,
    @CustomerId     INT,
    @Items          NVARCHAR(MAX),  -- JSON array of items
    @ProcessedBy    NVARCHAR(128) = NULL,
    
    -- Output parameters
    @OrderNumber    NVARCHAR(50) OUTPUT,
    @TotalAmount    DECIMAL(18,2) OUTPUT,
    @ErrorMessage   NVARCHAR(4000) OUTPUT
AS
BEGIN
    /*
    ============================================================================
    Purpose:        Process a new order with items
    Author:         @sql-server-specialist
    Created:        2026-01-17
    Dependencies:   dbo.Orders, dbo.OrderItems, dbo.Products
    
    Change History:
    Date        Author          Description
    ----------  --------------  ------------------------------------------------
    2026-01-17  Initial         Created procedure
    ============================================================================
    */
    
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    -- Initialize output parameters
    SET @OrderNumber = NULL;
    SET @TotalAmount = 0;
    SET @ErrorMessage = NULL;
    
    -- Input validation
    IF @OrderId IS NULL
    BEGIN
        SET @ErrorMessage = 'OrderId is required';
        RETURN -1;
    END
    
    IF @CustomerId IS NULL
    BEGIN
        SET @ErrorMessage = 'CustomerId is required';
        RETURN -1;
    END
    
    IF ISJSON(@Items) = 0
    BEGIN
        SET @ErrorMessage = 'Items must be valid JSON';
        RETURN -1;
    END
    
    -- Set default for optional parameter
    SET @ProcessedBy = ISNULL(@ProcessedBy, SUSER_SNAME());
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Generate order number
        SET @OrderNumber = 'ORD-' + FORMAT(SYSDATETIME(), 'yyyyMMdd') + '-' + 
                          RIGHT('00000' + CAST(@OrderId AS NVARCHAR(5)), 5);
        
        -- Insert order
        INSERT INTO dbo.Orders (
            OrderId, CustomerId, OrderNumber, OrderDate, Status, ProcessedBy
        )
        VALUES (
            @OrderId, @CustomerId, @OrderNumber, SYSDATETIME(), 'Processing', @ProcessedBy
        );
        
        -- Insert order items from JSON
        INSERT INTO dbo.OrderItems (OrderId, ProductId, Quantity, UnitPrice)
        SELECT 
            @OrderId,
            JSON_VALUE(item.value, '$.productId'),
            JSON_VALUE(item.value, '$.quantity'),
            p.UnitPrice
        FROM OPENJSON(@Items) AS item
        INNER JOIN dbo.Products p ON p.ProductId = JSON_VALUE(item.value, '$.productId');
        
        -- Calculate total
        SELECT @TotalAmount = SUM(Quantity * UnitPrice)
        FROM dbo.OrderItems
        WHERE OrderId = @OrderId;
        
        -- Update order with total
        UPDATE dbo.Orders
        SET TotalAmount = @TotalAmount,
            Status = 'Completed',
            CompletedAt = SYSDATETIME()
        WHERE OrderId = @OrderId;
        
        COMMIT TRANSACTION;
        RETURN 0;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Capture error details
        SET @ErrorMessage = CONCAT(
            'Error ', ERROR_NUMBER(), ': ', ERROR_MESSAGE(),
            ' at line ', ERROR_LINE()
        );
        
        -- Log to error table (optional)
        INSERT INTO dbo.ErrorLog (
            ProcedureName, ErrorNumber, ErrorMessage, ErrorLine, ErrorTime
        )
        VALUES (
            'usp_ProcessOrder', ERROR_NUMBER(), ERROR_MESSAGE(), 
            ERROR_LINE(), SYSDATETIME()
        );
        
        -- Re-raise or return
        -- THROW; -- Use THROW to re-raise the original error
        RETURN -1;
    END CATCH
END
GO
```

### 2. User-Defined Functions

**Scalar Function**:

```sql
CREATE OR ALTER FUNCTION dbo.fn_CalculateOrderTotal
(
    @OrderId INT
)
RETURNS DECIMAL(18,2)
WITH SCHEMABINDING
AS
BEGIN
    DECLARE @Total DECIMAL(18,2);
    
    SELECT @Total = ISNULL(SUM(Quantity * UnitPrice * (1 - ISNULL(Discount, 0))), 0)
    FROM dbo.OrderItems
    WHERE OrderId = @OrderId;
    
    RETURN @Total;
END
GO
```

**Inline Table-Valued Function** (Best Performance):

```sql
-- ✅ BEST: Inline TVF - Optimized like a view
CREATE OR ALTER FUNCTION dbo.fn_GetCustomerOrders
(
    @CustomerId INT,
    @StartDate  DATETIME2 = NULL,
    @EndDate    DATETIME2 = NULL
)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        o.OrderId,
        o.OrderNumber,
        o.OrderDate,
        o.TotalAmount,
        o.Status,
        ItemCount = (SELECT COUNT(*) FROM dbo.OrderItems oi WHERE oi.OrderId = o.OrderId)
    FROM dbo.Orders o
    WHERE o.CustomerId = @CustomerId
      AND o.IsDeleted = 0
      AND (@StartDate IS NULL OR o.OrderDate >= @StartDate)
      AND (@EndDate IS NULL OR o.OrderDate <= @EndDate)
);
GO

-- Usage (performs like a join)
SELECT * FROM dbo.fn_GetCustomerOrders(123, '2026-01-01', '2026-12-31');
```

**Multi-Statement Table-Valued Function** (Use Sparingly):

```sql
-- ⚠️ Use only when logic cannot be expressed as inline TVF
CREATE OR ALTER FUNCTION dbo.fn_GetOrderHierarchy
(
    @OrderId INT
)
RETURNS @Results TABLE
(
    Level       INT,
    ItemId      INT,
    ParentId    INT,
    ProductName NVARCHAR(200),
    Quantity    INT,
    Path        NVARCHAR(MAX)
)
AS
BEGIN
    -- Recursive CTE for hierarchical data
    ;WITH OrderHierarchy AS (
        -- Anchor
        SELECT 
            0 AS Level,
            oi.OrderItemId AS ItemId,
            CAST(NULL AS INT) AS ParentId,
            p.ProductName,
            oi.Quantity,
            CAST(p.ProductName AS NVARCHAR(MAX)) AS Path
        FROM dbo.OrderItems oi
        INNER JOIN dbo.Products p ON oi.ProductId = p.ProductId
        WHERE oi.OrderId = @OrderId AND oi.ParentItemId IS NULL
        
        UNION ALL
        
        -- Recursive
        SELECT 
            h.Level + 1,
            oi.OrderItemId,
            oi.ParentItemId,
            p.ProductName,
            oi.Quantity,
            h.Path + ' > ' + p.ProductName
        FROM dbo.OrderItems oi
        INNER JOIN dbo.Products p ON oi.ProductId = p.ProductId
        INNER JOIN OrderHierarchy h ON oi.ParentItemId = h.ItemId
        WHERE h.Level < 10  -- Prevent infinite recursion
    )
    INSERT INTO @Results
    SELECT Level, ItemId, ParentId, ProductName, Quantity, Path
    FROM OrderHierarchy;
    
    RETURN;
END
GO
```

### 3. Triggers

**Audit Trigger Pattern**:

```sql
CREATE OR ALTER TRIGGER dbo.tr_Orders_Audit
ON dbo.Orders
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Determine operation type
    DECLARE @Action CHAR(1);
    SET @Action = CASE
        WHEN EXISTS(SELECT 1 FROM inserted) AND EXISTS(SELECT 1 FROM deleted) THEN 'U'
        WHEN EXISTS(SELECT 1 FROM inserted) THEN 'I'
        ELSE 'D'
    END;
    
    -- Insert audit records
    INSERT INTO dbo.Orders_Audit (
        AuditId,
        AuditAction,
        AuditTimestamp,
        AuditUser,
        -- Original columns
        OrderId,
        CustomerId,
        OrderNumber,
        TotalAmount,
        Status,
        -- Old values (for UPDATE/DELETE)
        Old_TotalAmount,
        Old_Status
    )
    SELECT
        NEWID(),
        @Action,
        SYSDATETIME(),
        SUSER_SNAME(),
        -- Current values
        COALESCE(i.OrderId, d.OrderId),
        COALESCE(i.CustomerId, d.CustomerId),
        COALESCE(i.OrderNumber, d.OrderNumber),
        i.TotalAmount,
        i.Status,
        -- Old values
        d.TotalAmount,
        d.Status
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.OrderId = d.OrderId;
END
GO
```

**Validation Trigger**:

```sql
CREATE OR ALTER TRIGGER dbo.tr_OrderItems_ValidateStock
ON dbo.OrderItems
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check stock availability
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        INNER JOIN dbo.Products p ON i.ProductId = p.ProductId
        WHERE i.Quantity > p.StockQuantity
    )
    BEGIN
        RAISERROR('Insufficient stock for one or more items', 16, 1);
        RETURN;
    END
    
    -- Proceed with insert
    INSERT INTO dbo.OrderItems (OrderId, ProductId, Quantity, UnitPrice)
    SELECT OrderId, ProductId, Quantity, UnitPrice
    FROM inserted;
    
    -- Update stock
    UPDATE p
    SET StockQuantity = p.StockQuantity - i.Quantity
    FROM dbo.Products p
    INNER JOIN inserted i ON p.ProductId = i.ProductId;
END
GO
```

### 4. Common Table Expressions (CTEs)

**Recursive CTE for Hierarchical Data**:

```sql
-- Employee hierarchy
;WITH EmployeeHierarchy AS (
    -- Anchor member: top-level managers
    SELECT 
        EmployeeId,
        ManagerId,
        EmployeeName,
        Title,
        0 AS Level,
        CAST(EmployeeName AS NVARCHAR(MAX)) AS Path,
        CAST(RIGHT('0000' + CAST(EmployeeId AS VARCHAR(4)), 4) AS VARCHAR(MAX)) AS SortPath
    FROM dbo.Employees
    WHERE ManagerId IS NULL
    
    UNION ALL
    
    -- Recursive member
    SELECT 
        e.EmployeeId,
        e.ManagerId,
        e.EmployeeName,
        e.Title,
        h.Level + 1,
        h.Path + ' > ' + e.EmployeeName,
        h.SortPath + '.' + RIGHT('0000' + CAST(e.EmployeeId AS VARCHAR(4)), 4)
    FROM dbo.Employees e
    INNER JOIN EmployeeHierarchy h ON e.ManagerId = h.EmployeeId
    WHERE h.Level < 10  -- Safety limit
)
SELECT 
    REPLICATE('    ', Level) + EmployeeName AS DisplayName,
    Title,
    Level,
    Path
FROM EmployeeHierarchy
ORDER BY SortPath
OPTION (MAXRECURSION 100);  -- Increase if needed
```

**Multiple CTEs**:

```sql
;WITH 
-- CTE 1: Monthly sales aggregation
MonthlySales AS (
    SELECT 
        YEAR(OrderDate) AS OrderYear,
        MONTH(OrderDate) AS OrderMonth,
        SUM(TotalAmount) AS TotalSales,
        COUNT(*) AS OrderCount
    FROM dbo.Orders
    WHERE Status = 'Completed'
    GROUP BY YEAR(OrderDate), MONTH(OrderDate)
),

-- CTE 2: Running total
RunningTotals AS (
    SELECT 
        OrderYear,
        OrderMonth,
        TotalSales,
        OrderCount,
        SUM(TotalSales) OVER (ORDER BY OrderYear, OrderMonth) AS RunningTotal
    FROM MonthlySales
),

-- CTE 3: Year-over-year comparison
YoYComparison AS (
    SELECT 
        r.*,
        LAG(TotalSales, 12) OVER (ORDER BY OrderYear, OrderMonth) AS PrevYearSales
    FROM RunningTotals r
)

SELECT 
    OrderYear,
    OrderMonth,
    TotalSales,
    RunningTotal,
    PrevYearSales,
    CASE 
        WHEN PrevYearSales > 0 
        THEN (TotalSales - PrevYearSales) / PrevYearSales * 100 
        ELSE NULL 
    END AS YoYGrowthPercent
FROM YoYComparison
ORDER BY OrderYear, OrderMonth;
```

### 5. Window Functions

**Ranking Functions**:

```sql
SELECT 
    OrderId,
    CustomerId,
    OrderDate,
    TotalAmount,
    
    -- ROW_NUMBER: Unique sequential number
    ROW_NUMBER() OVER (PARTITION BY CustomerId ORDER BY OrderDate DESC) AS RowNum,
    
    -- RANK: Same rank for ties, gaps in sequence
    RANK() OVER (ORDER BY TotalAmount DESC) AS AmountRank,
    
    -- DENSE_RANK: Same rank for ties, no gaps
    DENSE_RANK() OVER (ORDER BY TotalAmount DESC) AS DenseAmountRank,
    
    -- NTILE: Divide into N buckets
    NTILE(4) OVER (ORDER BY TotalAmount DESC) AS Quartile
    
FROM dbo.Orders
WHERE Status = 'Completed';
```

**Aggregate Window Functions**:

```sql
SELECT 
    OrderId,
    CustomerId,
    OrderDate,
    TotalAmount,
    
    -- Running totals
    SUM(TotalAmount) OVER (ORDER BY OrderDate) AS RunningTotal,
    
    -- Partition running totals
    SUM(TotalAmount) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate
    ) AS CustomerRunningTotal,
    
    -- Moving averages
    AVG(TotalAmount) OVER (
        ORDER BY OrderDate 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS MovingAvg7Day,
    
    -- Percentage of total
    TotalAmount * 100.0 / SUM(TotalAmount) OVER () AS PercentOfTotal,
    
    -- Percentage within partition
    TotalAmount * 100.0 / SUM(TotalAmount) OVER (PARTITION BY CustomerId) AS PercentOfCustomer
    
FROM dbo.Orders
ORDER BY OrderDate;
```

**LAG and LEAD**:

```sql
SELECT 
    OrderId,
    CustomerId,
    OrderDate,
    TotalAmount,
    
    -- Previous values
    LAG(TotalAmount, 1, 0) OVER (PARTITION BY CustomerId ORDER BY OrderDate) AS PrevAmount,
    LAG(OrderDate, 1) OVER (PARTITION BY CustomerId ORDER BY OrderDate) AS PrevOrderDate,
    
    -- Next values
    LEAD(TotalAmount, 1, 0) OVER (PARTITION BY CustomerId ORDER BY OrderDate) AS NextAmount,
    
    -- Calculate differences
    TotalAmount - LAG(TotalAmount, 1, 0) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate
    ) AS AmountChange,
    
    -- Days since last order
    DATEDIFF(DAY, 
        LAG(OrderDate, 1) OVER (PARTITION BY CustomerId ORDER BY OrderDate),
        OrderDate
    ) AS DaysSinceLastOrder
    
FROM dbo.Orders;
```

**FIRST_VALUE and LAST_VALUE**:

```sql
SELECT DISTINCT
    CustomerId,
    
    -- First order for customer
    FIRST_VALUE(OrderId) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS FirstOrderId,
    
    FIRST_VALUE(OrderDate) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS FirstOrderDate,
    
    -- Last/most recent order
    LAST_VALUE(OrderId) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS LastOrderId,
    
    LAST_VALUE(TotalAmount) OVER (
        PARTITION BY CustomerId 
        ORDER BY OrderDate
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS LastOrderAmount
    
FROM dbo.Orders;
```

### 6. JSON Handling

**Parsing JSON**:

```sql
-- Sample JSON
DECLARE @OrderJson NVARCHAR(MAX) = N'{
    "orderId": 1001,
    "customer": {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com"
    },
    "items": [
        { "productId": 1, "quantity": 2, "price": 29.99 },
        { "productId": 5, "quantity": 1, "price": 49.99 }
    ],
    "metadata": {
        "source": "web",
        "ipAddress": "192.168.1.1"
    }
}';

-- Extract scalar values with JSON_VALUE
SELECT 
    JSON_VALUE(@OrderJson, '$.orderId') AS OrderId,
    JSON_VALUE(@OrderJson, '$.customer.name') AS CustomerName,
    JSON_VALUE(@OrderJson, '$.customer.email') AS CustomerEmail,
    JSON_VALUE(@OrderJson, '$.metadata.source') AS OrderSource;

-- Extract object/array with JSON_QUERY
SELECT 
    JSON_QUERY(@OrderJson, '$.customer') AS CustomerObject,
    JSON_QUERY(@OrderJson, '$.items') AS ItemsArray;

-- Parse array with OPENJSON
SELECT 
    ProductId = JSON_VALUE(item.value, '$.productId'),
    Quantity = CAST(JSON_VALUE(item.value, '$.quantity') AS INT),
    Price = CAST(JSON_VALUE(item.value, '$.price') AS DECIMAL(10,2)),
    LineTotal = CAST(JSON_VALUE(item.value, '$.quantity') AS INT) * 
                CAST(JSON_VALUE(item.value, '$.price') AS DECIMAL(10,2))
FROM OPENJSON(@OrderJson, '$.items') AS item;

-- OPENJSON with explicit schema
SELECT *
FROM OPENJSON(@OrderJson, '$.items')
WITH (
    ProductId   INT             '$.productId',
    Quantity    INT             '$.quantity',
    Price       DECIMAL(10,2)   '$.price'
);
```

**Generating JSON**:

```sql
-- FOR JSON PATH
SELECT 
    OrderId,
    OrderNumber,
    Customer = (
        SELECT CustomerId, CustomerName, Email
        FROM dbo.Customers c
        WHERE c.CustomerId = o.CustomerId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ),
    Items = (
        SELECT ProductId, Quantity, UnitPrice
        FROM dbo.OrderItems oi
        WHERE oi.OrderId = o.OrderId
        FOR JSON PATH
    ),
    TotalAmount,
    OrderDate
FROM dbo.Orders o
WHERE OrderId = 1001
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;

-- FOR JSON AUTO (automatic nesting)
SELECT 
    o.OrderId,
    o.OrderNumber,
    c.CustomerName,
    oi.ProductId,
    oi.Quantity
FROM dbo.Orders o
INNER JOIN dbo.Customers c ON o.CustomerId = c.CustomerId
INNER JOIN dbo.OrderItems oi ON o.OrderId = oi.OrderId
WHERE o.OrderId = 1001
FOR JSON AUTO;
```

**Modify JSON**:

```sql
DECLARE @Json NVARCHAR(MAX) = N'{"name":"John","age":30}';

-- Update value
SET @Json = JSON_MODIFY(@Json, '$.age', 31);

-- Add new property
SET @Json = JSON_MODIFY(@Json, '$.email', 'john@example.com');

-- Add array
SET @Json = JSON_MODIFY(@Json, '$.tags', JSON_QUERY('["vip","premium"]'));

-- Remove property (set to NULL)
SET @Json = JSON_MODIFY(@Json, '$.age', NULL);

SELECT @Json;
-- Result: {"name":"John","email":"john@example.com","tags":["vip","premium"]}
```

### 7. Error Handling Patterns

**TRY-CATCH with Transaction**:

```sql
CREATE OR ALTER PROCEDURE dbo.usp_TransferFunds
    @FromAccountId  INT,
    @ToAccountId    INT,
    @Amount         DECIMAL(18,2)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;  -- Ensures transaction is rolled back on error
    
    DECLARE @ErrorNumber INT;
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @ErrorState INT;
    DECLARE @ErrorSeverity INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check source balance
        IF NOT EXISTS (
            SELECT 1 FROM dbo.Accounts 
            WHERE AccountId = @FromAccountId AND Balance >= @Amount
        )
        BEGIN
            RAISERROR('Insufficient funds in source account', 16, 1);
        END
        
        -- Debit source
        UPDATE dbo.Accounts
        SET Balance = Balance - @Amount,
            ModifiedAt = SYSDATETIME()
        WHERE AccountId = @FromAccountId;
        
        -- Credit destination
        UPDATE dbo.Accounts
        SET Balance = Balance + @Amount,
            ModifiedAt = SYSDATETIME()
        WHERE AccountId = @ToAccountId;
        
        -- Log transaction
        INSERT INTO dbo.TransactionLog (FromAccount, ToAccount, Amount, TransactionDate)
        VALUES (@FromAccountId, @ToAccountId, @Amount, SYSDATETIME());
        
        COMMIT TRANSACTION;
        RETURN 0;
        
    END TRY
    BEGIN CATCH
        -- Capture error info BEFORE rollback
        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorMessage = ERROR_MESSAGE();
        SET @ErrorState = ERROR_STATE();
        SET @ErrorSeverity = ERROR_SEVERITY();
        
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Log error
        INSERT INTO dbo.ErrorLog (
            ProcedureName, ErrorNumber, ErrorMessage, 
            ErrorState, ErrorSeverity, ErrorTime
        )
        VALUES (
            'usp_TransferFunds', @ErrorNumber, @ErrorMessage,
            @ErrorState, @ErrorSeverity, SYSDATETIME()
        );
        
        -- Re-raise error
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
        RETURN -1;
    END CATCH
END
GO
```

**THROW vs RAISERROR**:

```sql
-- THROW (SQL Server 2012+) - Simpler, preserves original error
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    THROW;  -- Re-raises original error with original error number
END CATCH

-- RAISERROR - More control over error properties
BEGIN CATCH
    DECLARE @Msg NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR(@Msg, 16, 1);  -- Custom severity and state
END CATCH
```

---

## Anti-Patterns

### ❌ Cursor for Set-Based Operations

```sql
-- ❌ BAD: Cursor
DECLARE @OrderId INT;
DECLARE order_cursor CURSOR FOR SELECT OrderId FROM dbo.Orders;
OPEN order_cursor;
FETCH NEXT FROM order_cursor INTO @OrderId;
WHILE @@FETCH_STATUS = 0
BEGIN
    UPDATE dbo.Orders SET ProcessedAt = GETDATE() WHERE OrderId = @OrderId;
    FETCH NEXT FROM order_cursor INTO @OrderId;
END
CLOSE order_cursor;
DEALLOCATE order_cursor;

-- ✅ GOOD: Set-based
UPDATE dbo.Orders SET ProcessedAt = GETDATE();
```

### ❌ SELECT * in Production

```sql
-- ❌ BAD
SELECT * FROM dbo.Orders WHERE CustomerId = 123;

-- ✅ GOOD: Explicit columns
SELECT OrderId, OrderNumber, TotalAmount, Status
FROM dbo.Orders 
WHERE CustomerId = 123;
```

### ❌ Implicit Conversions

```sql
-- ❌ BAD: Causes implicit conversion, prevents index use
SELECT * FROM dbo.Customers WHERE CustomerId = '123';  -- CustomerId is INT

-- ✅ GOOD: Matching types
SELECT * FROM dbo.Customers WHERE CustomerId = 123;
```

---

## Quick Reference

| Pattern | Use Case |
|---------|----------|
| CTE | Recursive queries, readability |
| Window Functions | Running totals, rankings |
| APPLY | Correlated subqueries, JSON parsing |
| MERGE | Upsert operations |
| JSON_VALUE/OPENJSON | Parse JSON data |
| FOR JSON | Generate JSON output |
| TRY-CATCH | Error handling |
| THROW | Re-raise original errors |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
