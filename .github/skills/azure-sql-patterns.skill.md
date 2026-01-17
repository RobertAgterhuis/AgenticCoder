# Azure SQL Patterns Skill

## Overview
**Skill ID**: `azure-sql-patterns`  
**Version**: 1.0  
**Domain**: Azure SQL Database design, configuration, and optimization  
**Phase**: 15 (@azure-sql-specialist)  
**Maturity**: Production-Ready

Azure SQL Patterns skill covers cloud-native database design, service tier selection, security features (Always Encrypted, DDM, RLS), high availability (geo-replication, failover groups), and performance optimization specific to Azure SQL Database.

---

## Core Concepts

### 1. Service Tier Selection

**DTU vs vCore Decision Matrix**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    When to Use DTU vs vCore                               │
├──────────────────────────────────────────────────────────────────────────┤
│ DTU (Database Transaction Units)                                          │
│ ├── ✅ Predictable, steady workloads                                      │
│ ├── ✅ Simple pricing model                                               │
│ ├── ✅ No need to manage CPU/Memory separately                            │
│ └── ❌ Less flexibility for scaling                                       │
├──────────────────────────────────────────────────────────────────────────┤
│ vCore                                                                     │
│ ├── ✅ Need to specify exact CPU/Memory                                   │
│ ├── ✅ Azure Hybrid Benefit (save up to 55%)                              │
│ ├── ✅ Independent scaling of compute and storage                         │
│ ├── ✅ Serverless option available                                        │
│ └── ✅ Reserved capacity discounts                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Tier Selection Guide**:

```sql
-- Decision logic for tier selection
/*
Workload Requirements → Recommended Tier

CASE 
    WHEN RequiresSLA99_995 THEN 'Business Critical'
    WHEN DataSizeGB > 100 THEN 'Hyperscale'
    WHEN WorkloadVariable THEN 'Serverless (General Purpose)'
    WHEN HighPerformance THEN 'Premium / Business Critical'
    WHEN CostSensitive AND !Production THEN 'Basic / Standard S0-S3'
    ELSE 'General Purpose'
END
*/
```

**Bicep Template for Service Tier**:

```bicep
@allowed(['Basic', 'Standard', 'Premium', 'GeneralPurpose', 'BusinessCritical', 'Hyperscale'])
param serviceTier string = 'GeneralPurpose'

@allowed(['DTU', 'vCore'])
param computeModel string = 'vCore'

var skuMapping = {
  Basic: { name: 'Basic', tier: 'Basic', capacity: 5 }
  Standard: { name: 'S3', tier: 'Standard', capacity: 100 }
  Premium: { name: 'P1', tier: 'Premium', capacity: 125 }
  GeneralPurpose: { name: 'GP_Gen5_4', tier: 'GeneralPurpose', family: 'Gen5', capacity: 4 }
  BusinessCritical: { name: 'BC_Gen5_4', tier: 'BusinessCritical', family: 'Gen5', capacity: 4 }
  Hyperscale: { name: 'HS_Gen5_4', tier: 'Hyperscale', family: 'Gen5', capacity: 4 }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: skuMapping[serviceTier]
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: maxSizeBytes
    zoneRedundant: serviceTier == 'BusinessCritical' || serviceTier == 'Premium'
  }
}
```

### 2. Serverless Configuration

**When to Use Serverless**:
- Development and test environments
- Unpredictable or intermittent workloads
- New applications with unknown patterns
- Applications with idle periods

**Configuration Pattern**:

```bicep
// Serverless database configuration
resource serverlessDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: '${databaseName}-serverless'
  location: location
  sku: {
    name: 'GP_S_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 4  // Max vCores
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    autoPauseDelay: 60  // Minutes of inactivity before auto-pause (-1 to disable)
    minCapacity: json('0.5')  // Minimum vCores
    maxSizeBytes: 107374182400  // 100 GB
  }
}
```

**Cost Optimization Tips**:
```sql
-- Query to analyze if serverless is cost-effective
-- Run in Query Store enabled database
SELECT 
    DATEPART(hour, start_time) AS HourOfDay,
    AVG(avg_cpu_percent) AS AvgCPU,
    MAX(avg_cpu_percent) AS MaxCPU,
    COUNT(*) AS SampleCount
FROM sys.dm_db_resource_stats
WHERE start_time > DATEADD(day, -7, GETUTCDATE())
GROUP BY DATEPART(hour, start_time)
ORDER BY HourOfDay;

-- If CPU consistently low for many hours → consider serverless with auto-pause
-- If CPU consistently high → provisioned compute is more cost-effective
```

### 3. Always Encrypted

**Column Master Key in Azure Key Vault**:

```sql
-- Step 1: Create Column Master Key (CMK) in Azure Key Vault
CREATE COLUMN MASTER KEY [CMK_AzureKeyVault]
WITH (
    KEY_STORE_PROVIDER_NAME = 'AZURE_KEY_VAULT',
    KEY_PATH = 'https://myvault.vault.azure.net/keys/AlwaysEncryptedKey/abc123'
);

-- Step 2: Create Column Encryption Key (CEK)
CREATE COLUMN ENCRYPTION KEY [CEK_Auto1]
WITH VALUES (
    COLUMN_MASTER_KEY = [CMK_AzureKeyVault],
    ALGORITHM = 'RSA_OAEP',
    ENCRYPTED_VALUE = 0x01700000016...  -- Generated value
);

-- Step 3: Create table with encrypted columns
CREATE TABLE dbo.Customers (
    CustomerId uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
    
    -- Deterministic encryption: allows equality comparisons
    Email nvarchar(255) COLLATE Latin1_General_BIN2 
        ENCRYPTED WITH (
            COLUMN_ENCRYPTION_KEY = [CEK_Auto1],
            ENCRYPTION_TYPE = DETERMINISTIC,
            ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
        ) NOT NULL,
    
    -- Randomized encryption: most secure, no comparisons allowed
    SSN char(11) COLLATE Latin1_General_BIN2
        ENCRYPTED WITH (
            COLUMN_ENCRYPTION_KEY = [CEK_Auto1],
            ENCRYPTION_TYPE = RANDOMIZED,
            ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
        ) NOT NULL,
    
    -- Regular columns
    Name nvarchar(200) NOT NULL,
    CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
```

**Encryption Type Comparison**:

| Aspect | Deterministic | Randomized |
|--------|---------------|------------|
| Equality joins | ✅ Supported | ❌ Not supported |
| GROUP BY | ✅ Supported | ❌ Not supported |
| Indexing | ✅ Supported | ❌ Not supported |
| Security | ⚠️ Pattern visible | ✅ Maximum security |
| Use case | Search columns | Highly sensitive data |

### 4. Dynamic Data Masking

**Masking Functions**:

```sql
-- Default mask: Full mask (xxxx for strings, 0 for numbers)
ALTER TABLE dbo.Customers
ALTER COLUMN CreditScore ADD MASKED WITH (FUNCTION = 'default()');

-- Email mask: Shows first letter and domain (aXXX@XXXX.com)
ALTER TABLE dbo.Customers
ALTER COLUMN Email ADD MASKED WITH (FUNCTION = 'email()');

-- Partial mask: Custom pattern
ALTER TABLE dbo.Customers
ALTER COLUMN PhoneNumber ADD MASKED WITH (FUNCTION = 'partial(0,"XXX-XXX-",4)');
-- Result: XXX-XXX-1234

-- Random mask: Random value within range
ALTER TABLE dbo.Transactions
ALTER COLUMN Amount ADD MASKED WITH (FUNCTION = 'random(1, 100)');

-- Grant unmask permission to specific role
GRANT UNMASK TO DataAnalystRole;

-- Revoke unmask
REVOKE UNMASK FROM DataAnalystRole;
```

### 5. Row-Level Security (RLS)

**Multi-Tenant Pattern**:

```sql
-- Step 1: Create security schema
CREATE SCHEMA Security;
GO

-- Step 2: Create filter predicate function
CREATE FUNCTION Security.fn_TenantFilter(@TenantId uniqueidentifier)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS access_result
WHERE 
    -- Allow access if tenant matches session context
    @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS uniqueidentifier)
    -- Or if user is admin
    OR IS_MEMBER('db_owner') = 1
    OR IS_MEMBER('TenantAdmin') = 1;
GO

-- Step 3: Create security policy
CREATE SECURITY POLICY Security.TenantFilterPolicy
ADD FILTER PREDICATE Security.fn_TenantFilter(TenantId) ON dbo.Orders,
ADD FILTER PREDICATE Security.fn_TenantFilter(TenantId) ON dbo.Invoices,
ADD BLOCK PREDICATE Security.fn_TenantFilter(TenantId) ON dbo.Orders AFTER INSERT,
ADD BLOCK PREDICATE Security.fn_TenantFilter(TenantId) ON dbo.Orders AFTER UPDATE,
ADD BLOCK PREDICATE Security.fn_TenantFilter(TenantId) ON dbo.Invoices AFTER INSERT,
ADD BLOCK PREDICATE Security.fn_TenantFilter(TenantId) ON dbo.Invoices AFTER UPDATE
WITH (STATE = ON);
GO

-- Step 4: Application sets tenant context
-- In your .NET code:
// await connection.ExecuteAsync("EXEC sp_set_session_context @key=N'TenantId', @value=@tenantId", 
//     new { tenantId = currentTenantId });
```

### 6. Geo-Replication and Failover Groups

**Auto-Failover Group (Recommended)**:

```bicep
// Primary server (West Europe)
resource primaryServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: 'sql-${projectName}-primary'
  location: 'westeurope'
  properties: {
    administratorLogin: adminLogin
    administratorLoginPassword: adminPassword
    minimalTlsVersion: '1.2'
  }
}

// Secondary server (North Europe)
resource secondaryServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: 'sql-${projectName}-secondary'
  location: 'northeurope'
  properties: {
    administratorLogin: adminLogin
    administratorLoginPassword: adminPassword
    minimalTlsVersion: '1.2'
  }
}

// Database on primary
resource database 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: primaryServer
  name: databaseName
  location: 'westeurope'
  sku: {
    name: 'GP_Gen5_4'
    tier: 'GeneralPurpose'
  }
}

// Failover group
resource failoverGroup 'Microsoft.Sql/servers/failoverGroups@2022-05-01-preview' = {
  parent: primaryServer
  name: 'fog-${projectName}'
  properties: {
    readWriteEndpoint: {
      failoverPolicy: 'Automatic'
      failoverWithDataLossGracePeriodMinutes: 60
    }
    readOnlyEndpoint: {
      failoverPolicy: 'Enabled'
    }
    partnerServers: [
      {
        id: secondaryServer.id
      }
    ]
    databases: [
      database.id
    ]
  }
}

// Output connection strings using failover group endpoints
output readWriteEndpoint string = 'fog-${projectName}.database.windows.net'
output readOnlyEndpoint string = 'fog-${projectName}.secondary.database.windows.net'
```

**Connection String Pattern**:

```csharp
// Use failover group listener - automatic failover handling
var connectionString = new SqlConnectionStringBuilder
{
    DataSource = "fog-myapp.database.windows.net",  // Failover group listener
    InitialCatalog = "MyDatabase",
    Authentication = SqlAuthenticationMethod.ActiveDirectoryManagedIdentity,
    ConnectTimeout = 30,
    ConnectRetryCount = 3,
    ConnectRetryInterval = 10,
    ApplicationIntent = ApplicationIntent.ReadWrite  // or ReadOnly for read replicas
}.ConnectionString;
```

### 7. Query Store and Automatic Tuning

**Enable and Configure**:

```sql
-- Enable Query Store with recommended settings
ALTER DATABASE [YourDatabase]
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

-- Enable Automatic Tuning (Azure SQL specific)
ALTER DATABASE [YourDatabase]
SET AUTOMATIC_TUNING = AUTO;

-- Or configure individual options
ALTER DATABASE [YourDatabase]
SET AUTOMATIC_TUNING (
    CREATE_INDEX = ON,          -- Auto-create missing indexes
    DROP_INDEX = ON,            -- Auto-drop unused indexes
    FORCE_LAST_GOOD_PLAN = ON   -- Auto-fix plan regression
);
```

**Monitor Automatic Tuning**:

```sql
-- View automatic tuning recommendations
SELECT 
    name,
    reason,
    score,
    details.*
FROM sys.dm_db_tuning_recommendations
CROSS APPLY OPENJSON(details, '$.implementationDetails') 
    WITH (script nvarchar(max) '$.script') AS details
WHERE state_transition_reason_desc = 'AutomaticTuningOptionNotEnabled';

-- View applied recommendations
SELECT 
    name,
    reason,
    score,
    state_transition_reason_desc,
    execute_action_start_time,
    execute_action_duration
FROM sys.dm_db_tuning_recommendations
WHERE state_transition_reason_desc = 'Applied';
```

### 8. Elastic Pools (Multi-Tenant)

**When to Use**:
- Multiple databases with varying usage patterns
- Cost optimization for SaaS applications
- Shared resources across databases

**Configuration**:

```bicep
// Elastic Pool
resource elasticPool 'Microsoft.Sql/servers/elasticPools@2022-05-01-preview' = {
  parent: sqlServer
  name: 'pool-${projectName}'
  location: location
  sku: {
    name: 'GP_Gen5'
    tier: 'GeneralPurpose'
    family: 'Gen5'
    capacity: 8  // Total vCores for the pool
  }
  properties: {
    maxSizeBytes: 268435456000  // 250 GB
    perDatabaseSettings: {
      minCapacity: json('0.25')  // Min vCores per database
      maxCapacity: 4             // Max vCores per database
    }
    zoneRedundant: true
  }
}

// Database in elastic pool
resource tenantDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: 'tenant-${tenantId}'
  location: location
  sku: {
    name: 'ElasticPool'
    tier: 'GeneralPurpose'
    capacity: 0
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    elasticPoolId: elasticPool.id
  }
}
```

---

## Anti-Patterns

### ❌ Using SQL Authentication Instead of Azure AD

```sql
-- ❌ BAD: SQL Authentication
Server=myserver.database.windows.net;Database=mydb;User Id=myuser;Password=mypassword;

-- ✅ GOOD: Azure AD with Managed Identity
Server=myserver.database.windows.net;Database=mydb;Authentication=Active Directory Managed Identity;
```

### ❌ Not Using Connection Resilience

```csharp
// ❌ BAD: No retry logic
using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();

// ✅ GOOD: With retry policy (Polly)
var retryPolicy = Policy
    .Handle<SqlException>(ex => ex.IsTransient)
    .WaitAndRetryAsync(3, retryAttempt => 
        TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));

await retryPolicy.ExecuteAsync(async () =>
{
    using var connection = new SqlConnection(connectionString);
    await connection.OpenAsync();
    // ... execute commands
});
```

### ❌ Overprovisioning for Variable Workloads

```bicep
// ❌ BAD: Fixed high capacity for variable workload
sku: {
  name: 'GP_Gen5_16'
  capacity: 16  // Paying for 16 vCores 24/7
}

// ✅ GOOD: Serverless for variable workload
sku: {
  name: 'GP_S_Gen5'
}
properties: {
  minCapacity: json('0.5')
  autoPauseDelay: 60
}
```

---

## Quick Reference

| Pattern | Use When |
|---------|----------|
| Basic/Standard DTU | Dev/Test, predictable low load |
| General Purpose vCore | Most production workloads |
| Business Critical | High IOPS, read replicas needed |
| Hyperscale | >4TB data, rapid scale |
| Serverless | Variable/intermittent workloads |
| Elastic Pool | Multi-tenant SaaS |
| Geo-Replication | DR, global distribution |
| Failover Groups | Automatic HA |

---

## Related Skills

- [tsql-programming](tsql-programming.skill.md) - T-SQL development
- [sql-performance-tuning](sql-performance-tuning.skill.md) - Query optimization
- [database-migration](database-migration.skill.md) - Migration strategies

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
