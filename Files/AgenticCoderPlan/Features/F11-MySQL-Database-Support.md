# Feature F11: MySQL Database Support

**Status**: Planned  
**Priority**: Medium  
**Complexity**: Low  
**Estimated Effort**: 2-3 weeks  
**Target Phase**: Phase 2 Integration

---

## Problem Statement

### Current Gap
In AGENT_ACTIVATION_GUIDE.md staat bij **@postgresql-specialist**:

```
❌ SKIPS when:
- Database type: MySQL, SQLite, MongoDB
```

**Betekenis**: Als gebruiker MySQL kiest als database:
- ❌ Geen agent voor MySQL database implementation
- ❌ Geen MySQL-specific patterns (storage engines, full-text search)
- ❌ Geen skill voor MySQL best practices
- ❌ Geen schemas voor MySQL database generation
- ❌ Geen integration met MySQL tools

### Business Impact
- **MySQL is #1 open-source database** (40%+ market share)
- Dominante keuze voor **web applications** (LAMP/LEMP stack)
- Used by Facebook, Twitter, YouTube, Netflix, Uber
- Excellent for read-heavy workloads
- Strong in e-commerce, content management systems
- Cost-effective alternative to commercial databases

---

## Proposed Solution

### New Components Needed

#### 1. Agent: @mysql-specialist
**Responsibility**: MySQL database implementation  
**Phase**: 15 (parallel met @postgresql-specialist)  
**Activation**: `IF database_type == "MySQL"`

**Output**:
- MySQL schema design
- Table definitions with indexes
- Stored procedures (optional)
- Views and triggers (if needed)
- Migration scripts
- Performance optimization (indexes, query optimization)
- Backup/restore strategies

#### 2. Skill: mysql-database-patterns
**Type**: Code skill  
**Used by**: @mysql-specialist

**Content**:
- MySQL data types (vs PostgreSQL differences)
- Storage engines (InnoDB, MyISAM)
- Index types (B-Tree, Full-Text, Spatial)
- Query optimization (EXPLAIN)
- Transactions and locking
- Character sets and collations (utf8mb4)
- Full-text search
- JSON support (MySQL 5.7+)
- Partitioning strategies

#### 3. Schemas (2 files)
```
.github/schemas/agents/
├── @mysql-specialist.input.schema.json
└── @mysql-specialist.output.schema.json

.github/schemas/skills/
├── mysql-database-patterns.input.schema.json
└── mysql-database-patterns.output.schema.json
```

---

## Implementation Phases

### Phase 1: Research & Design (Week 1)
**Duration**: 3 dagen  
**Deliverables**:
- [ ] MySQL vs PostgreSQL differences analysis
- [ ] Storage engine comparison (InnoDB as default)
- [ ] Character set best practices (utf8mb4)
- [ ] Migration tool comparison (Flyway, Liquibase, native mysqldump)
- [ ] Cloud options (Azure Database for MySQL, AWS RDS MySQL, GCP Cloud SQL)

**Review Points**:
- InnoDB als default storage engine? (Yes - ACID compliant)
- utf8mb4 als default character set? (Yes - full Unicode support)
- MySQL 8.0+ as target version? (Yes - modern features)

---

### Phase 2: Agent Specification (Week 1)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] @mysql-specialist.agent.md (300+ lines)
  - MySQL schema design principles
  - Table definitions with proper data types
  - Primary keys and foreign keys
  - Indexes (single-column, composite, unique, full-text)
  - Constraints (NOT NULL, CHECK, DEFAULT)
  - Views and stored procedures (optional)
  - Triggers (if needed)
  - JSON column support
  - Migration scripts (CREATE, ALTER, INSERT)
  - Performance optimization
  - Backup strategies
  - Hands off to @devops-specialist or orchestrator

**Review Points**:
- Is @mysql-specialist op zelfde niveau als @postgresql-specialist?
- Zijn MySQL-specific features gedekt?
- Is output compatible met backend agents?

---

### Phase 3: Skill Definition (Week 2)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] mysql-database-patterns.skill.md (220+ lines)
  - **Data Types**:
    - Numeric (INT, BIGINT, DECIMAL, FLOAT)
    - String (VARCHAR, TEXT, CHAR)
    - Date/Time (DATE, DATETIME, TIMESTAMP)
    - JSON (MySQL 5.7+)
    - Binary (BLOB, BINARY)
  
  - **Storage Engines**:
    - InnoDB (default, ACID, foreign keys)
    - MyISAM (legacy, full-text search before 5.6)
  
  - **Indexes**:
    - B-Tree indexes (default)
    - Unique indexes
    - Composite indexes
    - Full-text indexes (FULLTEXT)
    - Spatial indexes (GEOMETRY)
  
  - **Query Optimization**:
    - EXPLAIN and EXPLAIN ANALYZE
    - Index selection
    - Query rewriting
    - Join optimization
  
  - **Transactions**:
    - START TRANSACTION, COMMIT, ROLLBACK
    - Isolation levels
    - Locking (row-level, table-level)
  
  - **Character Sets & Collations**:
    - utf8mb4 (full Unicode, emoji support)
    - utf8mb4_unicode_ci (case-insensitive)
    - Character set conversions
  
  - **Advanced Features**:
    - JSON functions (JSON_EXTRACT, JSON_SET)
    - Full-text search (MATCH AGAINST)
    - Stored procedures and functions
    - Triggers and events
    - Views
    - Partitioning (RANGE, LIST, HASH)
  
  - **Performance**:
    - Query cache (deprecated in MySQL 8.0)
    - Buffer pool tuning
    - Connection pooling
    - Slow query log

**Review Points**:
- Zijn MySQL 8.0+ features gedekt?
- Is verschil met PostgreSQL duidelijk?

---

### Phase 4: Schema Creation (Week 2)
**Duration**: 4 dagen  
**Deliverables**:
- [ ] @mysql-specialist.input.schema.json
  ```json
  {
    "database_design": {
      "mysql_version": "8.0+",
      "storage_engine": "InnoDB",
      "character_set": "utf8mb4",
      "collation": "utf8mb4_unicode_ci"
    },
    "tables": [
      {
        "name": "todos",
        "columns": [
          {
            "name": "id",
            "type": "BIGINT UNSIGNED",
            "constraints": ["PRIMARY KEY", "AUTO_INCREMENT"]
          },
          {
            "name": "title",
            "type": "VARCHAR(255)",
            "constraints": ["NOT NULL"]
          },
          {
            "name": "completed",
            "type": "BOOLEAN",
            "default": "FALSE"
          },
          {
            "name": "created_at",
            "type": "TIMESTAMP",
            "default": "CURRENT_TIMESTAMP"
          }
        ],
        "indexes": [
          {
            "name": "idx_completed",
            "columns": ["completed"]
          },
          {
            "name": "idx_title_fulltext",
            "type": "FULLTEXT",
            "columns": ["title"]
          }
        ]
      }
    ],
    "relationships": [
      {
        "from_table": "todos",
        "to_table": "users",
        "type": "many_to_one",
        "foreign_key": "user_id"
      }
    ],
    "views": [],
    "stored_procedures": [],
    "triggers": []
  }
  ```

- [ ] @mysql-specialist.output.schema.json
  ```json
  {
    "artifacts": {
      "schema": [
        {
          "file": "database/schema.sql",
          "content": "CREATE DATABASE IF NOT EXISTS myapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n\nUSE myapp;\n\nCREATE TABLE todos (\n  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,\n  title VARCHAR(255) NOT NULL,\n  completed BOOLEAN DEFAULT FALSE,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  INDEX idx_completed (completed),\n  FULLTEXT INDEX idx_title_fulltext (title)\n) ENGINE=InnoDB;"
        }
      ],
      "migrations": [
        {
          "file": "database/migrations/V1__create_todos.sql",
          "content": "CREATE TABLE todos (...);"
        }
      ],
      "indexes": [
        {
          "file": "database/migrations/V2__add_indexes.sql",
          "content": "CREATE INDEX idx_completed ON todos(completed);"
        }
      ],
      "seed_data": [
        {
          "file": "database/seeds/todos.sql",
          "content": "INSERT INTO todos (title, completed) VALUES ('Sample', FALSE);"
        }
      ]
    },
    "database_info": {
      "tables_created": 5,
      "indexes_created": 8,
      "foreign_keys_created": 4
    },
    "next_phase": "@devops-specialist"
  }
  ```

- [ ] mysql-database-patterns skill schemas (input/output)

**Review Points**:
- Zijn schemas consistent met @postgresql-specialist?
- Is MySQL syntax correct?

---

### Phase 5: Integration with Existing System (Week 2-3)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] Update @code-architect.agent.md
  - Add MySQL to database type options
  - Add MySQL-specific considerations
  
- [ ] Update AGENT_ACTIVATION_GUIDE.md
  - Add @mysql-specialist activation criteria
  - Update Phase 15 alternatives (PostgreSQL OR MySQL)
  - Update decision tree
  
- [ ] Update PHASE_FLOW.md
  - Update Phase 15 alternatives
  - Add MySQL timing estimates (40-80m)
  
- [ ] Update SYSTEM_ARCHITECTURE.md
  - Add @mysql-specialist to Implementation Tier
  - Update agent inventory
  
- [ ] Update backend agent docs
  - @dotnet-specialist: Add MySQL connection string examples
  - @nodejs-specialist: Add MySQL client examples (mysql2)
  - @python-specialist: Add MySQL examples (PyMySQL, aiomysql)
  - @go-specialist: Add MySQL driver examples (go-sql-driver/mysql)
  - @java-specialist: Add MySQL connector examples (JDBC)

**Review Points**:
- Conflicteert MySQL path met PostgreSQL path?
- Is Phase 15 decision logic helder?
- Zijn backend agents compatible met MySQL?

---

### Phase 6: Scenario Integration (Week 3)
**Duration**: 3 dagen  
**Deliverables**:
- [ ] Update S01 with MySQL alternative
  - S01: Can use MySQL instead of PostgreSQL
  - Same table structure, different syntax
  - Character set: utf8mb4
  
- [ ] Create MySQL deployment examples
  - Azure Database for MySQL
  - AWS RDS for MySQL
  - GCP Cloud SQL for MySQL
  - Docker containerization

**Review Points**:
- Is MySQL alternative voor S01 realistisch?
- Zijn deployment options helder?

---

## System Impact Analysis

### Modified Components
| Component | Change | Lines Added | Review Needed |
|-----------|--------|-------------|---------------|
| @code-architect.agent.md | Add MySQL database option | ~60 | YES |
| AGENT_ACTIVATION_GUIDE.md | Add 1 agent | ~700 | YES |
| PHASE_FLOW.md | Update Phase 15 alternatives | ~150 | YES |
| SYSTEM_ARCHITECTURE.md | Add MySQL specialist | ~350 | YES |
| @dotnet-specialist.agent.md | Add MySQL examples | ~80 | YES |
| @nodejs-specialist.agent.md | Add MySQL examples | ~80 | YES |
| @python-specialist.agent.md | Add MySQL examples | ~80 | YES |
| @go-specialist.agent.md | Add MySQL examples | ~80 | YES |
| @java-specialist.agent.md | Add MySQL examples | ~80 | YES |
| README.md | Update agent count | ~20 | YES |

### New Components
| Component | Type | Lines | Review Needed |
|-----------|------|-------|---------------|
| @mysql-specialist.agent.md | Agent spec | ~300 | YES |
| mysql-database-patterns.skill.md | Skill spec | ~220 | YES |
| 4 schema files | JSON schemas | ~800 | YES |
| **Total New** | - | **~1,320 lines** | - |

---

## Testing Considerations (User Will Test)

### Test Scenarios
1. **S01 MySQL Alternative**: Todo app with MySQL database
2. **Full-text Search**: Using FULLTEXT indexes
3. **JSON Support**: Storing and querying JSON data
4. **Performance**: Large dataset with proper indexing

### Validation Points
- [ ] @mysql-specialist generates valid MySQL 8.0+ SQL
- [ ] InnoDB storage engine is used
- [ ] utf8mb4 character set is configured
- [ ] Indexes are properly created
- [ ] Foreign keys work correctly
- [ ] Backend agents can connect to MySQL

---

## Dependencies

### Prerequisites
- Phase 1 (existing system) must be 100% complete ✅
- @code-architect must support database selection ✅
- @postgresql-specialist exists as reference ✅
- Backend agents (F07-F10) should support MySQL ✅

### Parallel Work
- Can be developed parallel with F12 (MongoDB)
- Should be integrated with F07-F10 (backend languages)

### Blocking For
- None (standalone database option)

---

## Success Criteria

### Must Have
- ✅ @mysql-specialist agent fully documented (300+ lines)
- ✅ 1 MySQL skill documented (220+ lines)
- ✅ 4 schema files created with 100% coverage
- ✅ Phase 15 decision logic supports PostgreSQL OR MySQL
- ✅ S01 MySQL alternative documented
- ✅ All backend agents support MySQL
- ✅ All existing documentation updated

### Should Have
- InnoDB as default storage engine
- utf8mb4 as default character set
- Full-text search support
- JSON support (MySQL 5.7+)

### Nice to Have
- Stored procedures and triggers
- Partitioning strategies
- Replication setup (master-slave)

---

## Review Checklist

### Architecture Review
- [ ] Zijn @mysql-specialist responsibilities duidelijk?
- [ ] Is InnoDB de default storage engine?
- [ ] Is utf8mb4 de default character set?
- [ ] Is output compatible met backend agents?

### Integration Review
- [ ] Conflicteert MySQL met PostgreSQL in Phase 15?
- [ ] Is orchestrator logic updated?
- [ ] Kunnen alle backend agents MySQL gebruiken?

### Documentation Review
- [ ] Zijn alle documentatie files updated?
- [ ] Is agent count correct?
- [ ] Zijn decision trees helder?

### Quality Review
- [ ] Zijn schemas syntactisch correct?
- [ ] Is MySQL 8.0+ syntax gebruikt?
- [ ] Zijn performance patterns gedocumenteerd?

---

## Risks & Mitigations

### Risk 1: PostgreSQL vs MySQL Differences
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**: 
- Document key differences clearly
- Provide migration guide
- Test backend agent compatibility

### Risk 2: Character Set Issues
**Impact**: High  
**Probability**: Low  
**Mitigation**: 
- Default to utf8mb4 (full Unicode)
- Document emoji support
- Test with special characters

### Risk 3: Storage Engine Confusion
**Impact**: Medium  
**Probability**: Low  
**Mitigation**: 
- Always use InnoDB (ACID, foreign keys)
- Document why MyISAM is legacy

### Risk 4: Version Compatibility
**Impact**: Low  
**Probability**: Low  
**Mitigation**: 
- Target MySQL 8.0+ (latest stable)
- Document minimum version (5.7+ for JSON)

---

## MySQL-Specific Considerations

### Why MySQL is Important

**1. Market Dominance**
- #1 open-source database
- LAMP/LEMP stack standard
- Web application default choice

**2. Performance**
- Excellent for read-heavy workloads
- Fast for simple queries
- Good horizontal scaling (replication)

**3. Ecosystem**
- phpMyAdmin (web-based admin)
- MySQL Workbench (GUI tool)
- Extensive hosting support

**4. Cost-Effective**
- Open-source (GPL)
- Free community edition
- Low hosting costs

**5. Industry Adoption**
- Facebook (massive scale)
- Twitter (early days)
- YouTube (Google acquisition)
- WordPress ecosystem

### MySQL vs PostgreSQL

**MySQL Advantages**:
- ✅ Simpler to learn
- ✅ Faster for simple queries
- ✅ Better replication (historically)
- ✅ More hosting options

**PostgreSQL Advantages**:
- ✅ More advanced features (JSON, Arrays, JSONB)
- ✅ Better for complex queries
- ✅ Stricter ACID compliance
- ✅ Advanced indexing (GIN, GiST, BRIN)
- ✅ Window functions
- ✅ Better concurrency

**When to Choose MySQL**:
- Read-heavy web applications
- Simple data models
- Cost is primary concern
- Team familiar with MySQL
- Replication is critical

**When to Choose PostgreSQL**:
- Complex queries and analytics
- Advanced data types needed
- Strict data integrity
- Concurrent writes
- Enterprise features

---

## MySQL 8.0+ Modern Features

### 1. Window Functions (like PostgreSQL)
```sql
SELECT title, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
FROM todos;
```

### 2. Common Table Expressions (CTEs)
```sql
WITH completed_todos AS (
  SELECT * FROM todos WHERE completed = TRUE
)
SELECT * FROM completed_todos;
```

### 3. JSON Functions
```sql
SELECT JSON_EXTRACT(metadata, '$.tags') FROM todos;
```

### 4. Better Performance
- Improved optimizer
- Better indexing
- Faster replication

---

## Next Steps

1. **Review dit document** - Valideer MySQL approach
2. **Goedkeuring voor Phase 1** - Start MySQL research
3. **InnoDB + utf8mb4 defaults?** - Confirm best practices

---

**Status**: ⏳ Awaiting Review  
**Reviewer**: [User]  
**Next Document**: F12-MongoDB-NoSQL-Support.md

