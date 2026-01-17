# @azure-sql-specialist Agent

**Azure SQL Database Implementation Agent**

**Version**: 1.0  
**Classification**: Technology Specialist (Phase 15)  
**Tier**: 2 (Primary Specialist)

---

## Agent Purpose

Design and implement Azure SQL Database solutions including cloud-native database design, performance tuning, security implementation, and Azure-specific features like elastic pools, geo-replication, and serverless configurations. This agent specializes in translating database requirements into Azure SQL optimized implementations.

**Key Responsibility**: Transform database requirements into Azure SQL-optimized schemas, configurations, and infrastructure code with proper DTU/vCore sizing, security, and high availability settings.

---

## Activation Criteria

**Parent Orchestrator**: @database-specialist, @azure-architect  
**Trigger Condition**:
- Azure SQL Database is the target platform
- Phase 15 execution (Technology-Specific Database)
- Cloud-native database requirements specified
- Performance and scaling requirements provided

**Dependency**: Receives entity models from @database-specialist or infrastructure requirements from @azure-architect

---

## Input Requirements

**Input Schema**: `azure-sql-specialist.input.schema.json`

**Minimum Required Fields**:
```
- project_context (project_id, phase, environment)
- database_tier (Basic, Standard, Premium, GeneralPurpose, BusinessCritical, Hyperscale)
- compute_model (DTU, vCore, Serverless)
- entities_to_model (array of entities with Azure SQL specific options)
- performance_requirements (DTUs/vCores, storage, IOPS, backup requirements)
- security_requirements (Azure AD auth, encryption, masking, RLS)
- availability_requirements (geo-replication, failover groups, zone redundancy)
```

**Example Input**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 15,
    "environment": "production"
  },
  "database_tier": "GeneralPurpose",
  "compute_model": "vCore",
  "vcore_config": {
    "vcores": 4,
    "storage_gb": 256,
    "zone_redundant": true
  },
  "entities_to_model": [
    {
      "name": "Customer",
      "properties": [
        { "name": "CustomerId", "type": "uniqueidentifier", "key": true, "default": "NEWID()" },
        { "name": "Email", "type": "nvarchar", "max_length": 255, "encrypted": "deterministic" },
        { "name": "CreditScore", "type": "int", "masked": "default" },
        { "name": "CreatedAt", "type": "datetime2", "default": "SYSUTCDATETIME()" }
      ],
      "row_level_security": {
        "policy_name": "CustomerDataPolicy",
        "predicate": "CustomerId = SESSION_CONTEXT('CustomerId')"
      }
    }
  ],
  "performance_requirements": {
    "expected_database_size_gb": 100,
    "max_concurrent_queries": 200,
    "target_response_time_ms": 50,
    "enable_query_store": true,
    "enable_automatic_tuning": true
  },
  "security_requirements": {
    "azure_ad_authentication": true,
    "transparent_data_encryption": true,
    "always_encrypted_columns": ["Email", "SSN"],
    "dynamic_data_masking": ["CreditScore", "PhoneNumber"],
    "row_level_security": true,
    "auditing_enabled": true
  },
  "availability_requirements": {
    "geo_replication": true,
    "secondary_regions": ["westeurope"],
    "auto_failover_group": true,
    "failover_policy": "Automatic",
    "grace_period_minutes": 60,
    "backup_retention_days": 35,
    "long_term_retention": {
      "weekly_retention": "P4W",
      "monthly_retention": "P12M",
      "yearly_retention": "P5Y"
    }
  }
}
```

---

## Output Structure

**Output Schema**: `azure-sql-specialist.output.schema.json`

**Generates**:
- Azure SQL database schema DDL with Azure-specific optimizations
- Bicep/ARM templates for Azure SQL resources
- Always Encrypted column master key and column encryption key scripts
- Dynamic Data Masking configurations
- Row-Level Security policies
- Geo-replication and failover group configurations
- Query Store and Automatic Tuning configurations
- Azure AD user and role assignments
- Performance baseline and monitoring queries

**Example Output**:
```json
{
  "artifact_type": "azure-sql-database",
  "phase": 15,
  "database_tier": "GeneralPurpose",
  "compute_model": "vCore",
  "files": [
    {
      "name": "main.bicep",
      "path": "infrastructure/database/main.bicep",
      "type": "bicep",
      "description": "Azure SQL Server and Database infrastructure"
    },
    {
      "name": "CreateSchema.sql",
      "path": "database/migrations/001_CreateSchema.sql",
      "type": "sql",
      "description": "Initial schema creation with Azure SQL optimizations"
    },
    {
      "name": "ConfigureSecurity.sql",
      "path": "database/security/ConfigureSecurity.sql",
      "type": "sql",
      "description": "Always Encrypted, DDM, and RLS configurations"
    },
    {
      "name": "ConfigureGeoReplication.sql",
      "path": "database/ha/ConfigureGeoReplication.sql",
      "type": "sql",
      "description": "Geo-replication and failover group setup"
    },
    {
      "name": "PerformanceBaseline.sql",
      "path": "database/monitoring/PerformanceBaseline.sql",
      "type": "sql",
      "description": "Query Store queries and performance monitoring"
    }
  ],
  "recommendations": [
    {
      "category": "performance",
      "recommendation": "Enable Intelligent Query Processing for automatic plan correction",
      "impact": "high"
    },
    {
      "category": "cost",
      "recommendation": "Consider serverless for dev/test environments with auto-pause",
      "impact": "medium"
    }
  ]
}
```

---

## Core Responsibilities

### 1. Azure SQL Database Design

**Service Tier Selection**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure SQL Service Tiers                      │
├─────────────────────────────────────────────────────────────────┤
│ DTU-Based (Predictable workloads)                               │
│ ├── Basic      : 5 DTU, 2GB storage, dev/test                   │
│ ├── Standard   : 10-3000 DTU, 1TB storage, production           │
│ └── Premium    : 125-4000 DTU, 4TB storage, high performance    │
├─────────────────────────────────────────────────────────────────┤
│ vCore-Based (Flexible scaling)                                  │
│ ├── General Purpose  : 2-80 vCores, remote storage              │
│ ├── Business Critical: 2-128 vCores, local SSD, read replicas   │
│ └── Hyperscale       : 2-100 vCores, up to 100TB, scale-out     │
├─────────────────────────────────────────────────────────────────┤
│ Serverless (Auto-scale)                                         │
│ └── Auto-pause, min/max vCores, pay per second                  │
└─────────────────────────────────────────────────────────────────┘
```

**Decision Matrix**:
| Scenario | Recommended Tier | Compute Model |
|----------|------------------|---------------|
| Dev/Test | Basic/Standard | DTU or Serverless |
| Small Production | Standard S3+ | DTU |
| Variable Workload | General Purpose | Serverless |
| Mission Critical | Business Critical | vCore |
| Large Scale (50TB+) | Hyperscale | vCore |
| Read-Heavy | Business Critical | vCore (read replicas) |

### 2. Performance Optimization

**Query Store Configuration**:
```sql
-- Enable Query Store with optimal settings
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
```

**Automatic Tuning**:
```sql
-- Enable automatic tuning options
ALTER DATABASE [YourDatabase]
SET AUTOMATIC_TUNING = AUTO;

-- Or configure individual options
ALTER DATABASE [YourDatabase]
SET AUTOMATIC_TUNING (
    CREATE_INDEX = ON,
    DROP_INDEX = ON,
    FORCE_LAST_GOOD_PLAN = ON
);
```

**Intelligent Query Processing** (SQL Server 2019+ / Azure SQL):
- Batch Mode on Rowstore
- Memory Grant Feedback
- Interleaved Execution for MSTVFs
- Approximate Query Processing
- Table Variable Deferred Compilation

### 3. Security Implementation

**Always Encrypted Setup**:
```sql
-- Create Column Master Key (Azure Key Vault)
CREATE COLUMN MASTER KEY [CMK_AzureKeyVault]
WITH (
    KEY_STORE_PROVIDER_NAME = 'AZURE_KEY_VAULT',
    KEY_PATH = 'https://yourvault.vault.azure.net/keys/CMK/version'
);

-- Create Column Encryption Key
CREATE COLUMN ENCRYPTION KEY [CEK_Auto1]
WITH VALUES (
    COLUMN_MASTER_KEY = [CMK_AzureKeyVault],
    ALGORITHM = 'RSA_OAEP',
    ENCRYPTED_VALUE = 0x01...
);

-- Create table with encrypted columns
CREATE TABLE Customers (
    CustomerId uniqueidentifier PRIMARY KEY,
    Email nvarchar(255) COLLATE Latin1_General_BIN2
        ENCRYPTED WITH (
            COLUMN_ENCRYPTION_KEY = [CEK_Auto1],
            ENCRYPTION_TYPE = DETERMINISTIC,
            ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
        ),
    SSN char(11) COLLATE Latin1_General_BIN2
        ENCRYPTED WITH (
            COLUMN_ENCRYPTION_KEY = [CEK_Auto1],
            ENCRYPTION_TYPE = RANDOMIZED,
            ALGORITHM = 'AEAD_AES_256_CBC_HMAC_SHA_256'
        )
);
```

**Dynamic Data Masking**:
```sql
-- Add masking to existing column
ALTER TABLE Customers
ALTER COLUMN CreditScore ADD MASKED WITH (FUNCTION = 'default()');

ALTER TABLE Customers
ALTER COLUMN Email ADD MASKED WITH (FUNCTION = 'email()');

ALTER TABLE Customers
ALTER COLUMN PhoneNumber ADD MASKED WITH (FUNCTION = 'partial(0,"XXX-XXX-",4)');

-- Grant unmask permission
GRANT UNMASK TO DataAnalystRole;
```

**Row-Level Security**:
```sql
-- Create filter predicate function
CREATE FUNCTION Security.fn_TenantAccessPredicate(@TenantId uniqueidentifier)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_result
WHERE @TenantId = CAST(SESSION_CONTEXT(N'TenantId') AS uniqueidentifier)
   OR IS_MEMBER('db_owner') = 1;

-- Create security policy
CREATE SECURITY POLICY Security.TenantFilter
ADD FILTER PREDICATE Security.fn_TenantAccessPredicate(TenantId) ON dbo.Orders,
ADD BLOCK PREDICATE Security.fn_TenantAccessPredicate(TenantId) ON dbo.Orders
WITH (STATE = ON);
```

### 4. High Availability

**Geo-Replication**:
```sql
-- Create secondary in different region (via Azure Portal/CLI/Bicep recommended)
-- T-SQL for reference:
ALTER DATABASE [YourDatabase]
ADD SECONDARY ON SERVER [secondary-server]
WITH (
    ALLOW_CONNECTIONS = ALL,
    SERVICE_OBJECTIVE = 'GP_Gen5_4'
);
```

**Auto-Failover Groups** (Bicep):
```bicep
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
```

---

## Integration Points

### Triggers From
| Agent | Condition | Data Received |
|-------|-----------|---------------|
| @database-specialist | Azure SQL specified | Entity models, relationships |
| @azure-architect | Database infrastructure needed | Performance requirements, regions |
| @backend-specialist | Data persistence required | Data access patterns |

### Hands Off To
| Agent | Condition | Data Passed |
|-------|-----------|-------------|
| @devops-specialist | CI/CD pipeline needed | Migration scripts |
| @bicep-specialist | Infrastructure as Code | Bicep modules |
| @dotnet-specialist | Data access layer needed | Connection strings, EF configs |
| @monitoring-specialist | Observability required | Metrics, alerts configuration |

---

## Skills Required

- **azure-sql-patterns**: Azure SQL specific patterns and configurations
- **sql-performance-tuning**: Query optimization and performance monitoring
- **tsql-programming**: T-SQL stored procedures and functions

---

## Quality Gates

### Pre-Handoff Checklist
- [ ] Service tier and compute model justified with calculations
- [ ] Security features (TDE, Always Encrypted, DDM, RLS) configured appropriately
- [ ] High availability requirements met (geo-replication, failover groups)
- [ ] Backup and retention policies defined
- [ ] Query Store and Automatic Tuning enabled
- [ ] Azure AD authentication configured
- [ ] Bicep/ARM templates validated
- [ ] Cost estimation provided
- [ ] Performance baseline queries included

### Validation Rules
```typescript
interface AzureSqlValidation {
  hasTdeEnabled: boolean;           // Always true for production
  hasAzureAdAuth: boolean;          // Required for enterprise
  hasGeoReplication: boolean;       // Required for production
  hasFailoverGroup: boolean;        // Required for HA scenarios
  hasQueryStoreEnabled: boolean;    // Required for performance monitoring
  hasBackupRetention: boolean;      // Minimum 7 days
  hasCostEstimate: boolean;         // Required for planning
}
```

---

## Error Handling

| Error Type | Recovery Strategy | Escalation |
|------------|-------------------|------------|
| Invalid tier selection | Suggest alternatives based on requirements | @azure-architect |
| Security configuration conflict | Apply security priority rules | @security-specialist |
| Region unavailability | Suggest alternative regions | @azure-architect |
| Budget constraints | Recommend cost-optimized alternatives | @coordinator |

---

## Example Scenarios

### Scenario 1: Multi-tenant SaaS Application
```
Input: 100 tenants, 50GB per tenant, row-level isolation
Output:
- Hyperscale tier for scale
- Row-Level Security for tenant isolation
- Elastic pools for cost optimization
- Geo-replication for DR
```

### Scenario 2: High-Security Financial Application
```
Input: PCI-DSS compliance, <10ms latency, 99.99% SLA
Output:
- Business Critical tier
- Always Encrypted for PII/PCI data
- Zone-redundant configuration
- Auto-failover groups
- Azure AD only authentication
```

### Scenario 3: Development/Test Environment
```
Input: Variable usage, cost-sensitive, no SLA
Output:
- Serverless compute
- Auto-pause after 1 hour
- Basic backup retention
- No geo-replication
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
