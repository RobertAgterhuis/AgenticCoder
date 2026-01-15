# Security Scanner

**Component**: VF-04  
**Purpose**: Scan for security vulnerabilities and best practices  
**Status**: Design Complete  

---

## 🎯 Overview

The Security Scanner prevents vulnerable code from propagating:

1. **Scans** for known vulnerabilities (CVE database)
2. **Checks** for security anti-patterns
3. **Validates** credential handling
4. **Enforces** security best practices

---

## 🏗️ Process Flow

```
Generated Code
    │
    ├─→ Vulnerability Scan
    │   ├─ Check npm audit
    │   ├─ Check SAST rules
    │   └─ Check CVE database
    │
    ├─→ Best Practice Checks
    │   ├─ Credential handling
    │   ├─ Input validation
    │   ├─ Error handling
    │   └─ API security
    │
    ├─→ Code Quality
    │   ├─ Complexity analysis
    │   ├─ Dead code detection
    │   └─ Performance issues
    │
    └─→ Result
        ├─ PASS → No issues
        └─ FAIL → Report severity level
```

---

## 🔍 Vulnerability Types

### Type 1: Known CVE Vulnerabilities
```
npm audit check against npm database
- Critical: Requires immediate action
- High: Should be addressed soon
- Moderate: Consider addressing
- Low: Low priority
```

Example:
```json
{
  "package": "lodash",
  "version": "4.17.15",
  "vulnerability": "Prototype pollution",
  "cve": "CVE-2021-23337",
  "severity": "high",
  "solution": "Upgrade to 4.17.21 or later"
}
```

### Type 2: Secret Exposure
```
Detect hardcoded credentials:
- API keys
- Database passwords
- AWS/Azure keys
- OAuth tokens
```

Example:
```javascript
// ❌ FAIL: Hardcoded API key
const apiKey = "sk_live_aB1234567890";
const dbPassword = "postgres://user:SecurePassword123@localhost/db";
```

### Type 3: Insecure Cryptography
```
Detect weak crypto:
- MD5/SHA1 for hashing
- No salt in password hashing
- Hardcoded encryption keys
- Insufficient key size
```

Example:
```javascript
// ❌ FAIL: MD5 hashing (cryptographically weak)
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(password).digest();

// ✓ PASS: bcrypt (secure)
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 10);
```

### Type 4: SQL/NoSQL Injection
```
Detect unsanitized database queries:
- String concatenation in queries
- No parameterized queries
- No input validation
```

Example:
```javascript
// ❌ FAIL: SQL injection vulnerable
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);

// ✓ PASS: Parameterized query
const query = "SELECT * FROM users WHERE id = $1";
db.query(query, [userId]);
```

### Type 5: XSS Vulnerabilities
```
Detect unsanitized output:
- Direct innerHTML assignment
- No HTML escaping
- Raw user input in responses
```

Example:
```javascript
// ❌ FAIL: XSS vulnerable
document.getElementById('content').innerHTML = userInput;

// ✓ PASS: Escaped output
const div = document.createElement('div');
div.textContent = userInput;
document.body.appendChild(div);
```

---

## 💻 Algorithm

### Vulnerability Scan
```typescript
import { execSync } from 'child_process';

interface VulnerabilityIssue {
  package: string;
  version: string;
  cve?: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  description: string;
  solution: string;
}

async function scanVulnerabilities(
  projectRoot: string
): Promise<VulnerabilityIssue[]> {
  try {
    // Run npm audit
    const auditOutput = execSync('npm audit --json', {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    
    const auditResult = JSON.parse(auditOutput);
    const vulnerabilities: VulnerabilityIssue[] = [];
    
    // Extract vulnerabilities
    for (const [pkgName, vulnInfo] of Object.entries(auditResult.vulnerabilities || {})) {
      vulnerabilities.push({
        package: pkgName,
        version: vulnInfo.version,
        cve: vulnInfo.cves?.[0]?.cve,
        severity: vulnInfo.severity,
        description: vulnInfo.description,
        solution: `Upgrade to ${vulnInfo.fixAvailable.version}`
      });
    }
    
    return vulnerabilities;
  } catch (error) {
    return [];
  }
}
```

### Secret Detection
```typescript
import * as fs from 'fs';

const SECRET_PATTERNS = {
  API_KEY: /api[_-]?key\s*[:=]\s*['"]([\w\-\.]+)['"]/gi,
  AWS_KEY: /AKIA[0-9A-Z]{16}/,
  PRIVATE_KEY: /-----BEGIN PRIVATE KEY-----/,
  PASSWORD: /password\s*[:=]\s*['"]([\w\-\@\.]+)['"]/gi,
  DB_CONN: /(postgresql|mysql|mongodb):\/\/\w+:\w+@/gi,
  OAUTH_TOKEN: /oauth[_-]?token\s*[:=]\s*['"]([\w\-\.]+)['"]/gi,
  JWT: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/
};

interface SecretFound {
  type: string;
  location: string;
  line: number;
  severity: 'critical' | 'high';
}

function detectSecrets(code: string, filePath: string): SecretFound[] {
  const secrets: SecretFound[] = [];
  const lines = code.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const [type, pattern] of Object.entries(SECRET_PATTERNS)) {
      if (pattern.test(line)) {
        secrets.push({
          type,
          location: filePath,
          line: i + 1,
          severity: type === 'PRIVATE_KEY' ? 'critical' : 'high'
        });
      }
    }
  }
  
  return secrets;
}
```

### Best Practice Checks
```typescript
interface SecurityIssue {
  type: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  location: string;
  line: number;
  message: string;
  suggestion: string;
}

function checkSecurityPractices(code: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = code.split('\n');
  
  // Check 1: No input validation
  if (code.includes('req.body') && !code.includes('validate')) {
    issues.push({
      type: 'NO_INPUT_VALIDATION',
      severity: 'high',
      location: 'request handler',
      line: 0,
      message: 'Request body used without validation',
      suggestion: 'Use joi, yup, or express-validator'
    });
  }
  
  // Check 2: No error handling
  if (code.includes('await') && !code.includes('catch')) {
    issues.push({
      type: 'MISSING_ERROR_HANDLING',
      severity: 'high',
      location: 'async code',
      line: 0,
      message: 'Async operations without error handling',
      suggestion: 'Use try/catch or .catch()'
    });
  }
  
  // Check 3: Insecure HTTP (not HTTPS)
  if (code.includes('http://')) {
    issues.push({
      type: 'INSECURE_HTTP',
      severity: 'moderate',
      location: code,
      line: 0,
      message: 'Using HTTP instead of HTTPS',
      suggestion: 'Use HTTPS for all external calls'
    });
  }
  
  // Check 4: No rate limiting
  if (code.includes('app.post') && !code.includes('rateLimit')) {
    issues.push({
      type: 'NO_RATE_LIMITING',
      severity: 'moderate',
      location: 'API endpoint',
      line: 0,
      message: 'API endpoint without rate limiting',
      suggestion: 'Use express-rate-limit or similar'
    });
  }
  
  // Check 5: SQL injection risk
  if (code.includes('query(') && code.includes('+')) {
    issues.push({
      type: 'SQL_INJECTION_RISK',
      severity: 'critical',
      location: 'database query',
      line: 0,
      message: 'SQL query built with string concatenation',
      suggestion: 'Use parameterized queries'
    });
  }
  
  return issues;
}
```

---

## ✅ Vulnerability Examples

### Example 1: Known CVE
```json
{
  "status": "FAIL",
  "severity": "high",
  "issues": [
    {
      "type": "cve",
      "package": "express",
      "version": "4.18.1",
      "cve": "CVE-2023-40175",
      "title": "Sendfile Request Header DoS",
      "solution": "Upgrade to 4.18.2 or later"
    }
  ]
}
```

### Example 2: Hardcoded Secret
```json
{
  "status": "FAIL",
  "severity": "critical",
  "issues": [
    {
      "type": "secret",
      "secret_type": "API_KEY",
      "file": "server.js",
      "line": 42,
      "message": "Hardcoded API key found",
      "suggestion": "Use environment variables or AWS Secrets Manager"
    }
  ]
}
```

### Example 3: SQL Injection Risk
```json
{
  "status": "FAIL",
  "severity": "critical",
  "issues": [
    {
      "type": "security_practice",
      "category": "SQL_INJECTION_RISK",
      "file": "db.js",
      "line": 25,
      "message": "SQL query built with string concatenation",
      "suggestion": "Use prepared statements or parameterized queries"
    }
  ]
}
```

---

## 📊 Security Scoring

```typescript
interface SecurityScore {
  total_issues: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  score: number; // 0-100
  rating: 'A' | 'B' | 'C' | 'D' | 'F';
}

function calculateSecurityScore(issues: SecurityIssue[]): SecurityScore {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const moderate = issues.filter(i => i.severity === 'moderate').length;
  const low = issues.filter(i => i.severity === 'low').length;
  
  // Scoring: critical=-30, high=-20, moderate=-10, low=-5
  let score = 100;
  score -= critical * 30;
  score -= high * 20;
  score -= moderate * 10;
  score -= low * 5;
  score = Math.max(0, score);
  
  let rating: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) rating = 'A';
  else if (score >= 80) rating = 'B';
  else if (score >= 70) rating = 'C';
  else if (score >= 60) rating = 'D';
  else rating = 'F';
  
  return {
    total_issues: issues.length,
    critical,
    high,
    moderate,
    low,
    score,
    rating
  };
}
```

---

## ⚙️ Configuration

### security-scanner.config.json
```json
{
  "enable_npm_audit": true,
  "enable_secret_detection": true,
  "enable_sast": true,
  "enable_best_practices": true,
  "fail_on_severity": "critical",
  "warn_on_severity": "high",
  "secret_patterns": [
    "API_KEY",
    "AWS_KEY",
    "PRIVATE_KEY",
    "PASSWORD",
    "DB_CONN",
    "OAUTH_TOKEN",
    "JWT"
  ],
  "timeout_ms": 30000,
  "ignore_packages": [
    "dev-dependency-with-known-issue"
  ]
}
```

---

## 🔌 Integration

### Called By
- Gate Manager (security check before handoff)
- Pre-execution (ensure code is safe)

### Calls
- npm audit (dependency vulnerability check)
- SAST engine (code analysis)
- Secret scanner (credential detection)

---

## 💡 Key Points

1. **CVE Database**: Checks against known vulnerabilities
2. **Secret Detection**: Finds hardcoded credentials
3. **Best Practices**: Validates secure patterns
4. **Security Scoring**: Rates overall security (A-F)
5. **Actionable**: Reports with remediation steps
6. **Fast Fail**: Blocks critical issues immediately

---

**Status**: ✅ **SPECIFICATION COMPLETE** → Ready for implementation.
