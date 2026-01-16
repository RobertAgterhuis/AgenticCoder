# Test Scenario S05: Regulated Industry - Healthcare Platform

**Scenario ID**: `S05`  
**Name**: Regulated Industry - Healthcare Telemedicine & EHR Platform  
**Complexity**: Very High (Regulatory Focus)  
**Purpose**: Validate agent chain for regulated industry with strict compliance

---

## Project Context

**Project Type**: HIPAA-compliant telemedicine and electronic health records (EHR) platform  
**Team**: Specialized team (12 people: 8 developers, 1 compliance officer, 1 security officer, 2 QA)  
**Timeline**: 36-48 weeks (9-12 months)  
**Budget**: $5,000-10,000/month (compliance-heavy)  
**Users**: 100-500 medical practices, 50K-100K patients  
**Revenue Model**: Per-practice subscription ($500-2000/month)

---

## Initial Request (Phase 0 Input)

```markdown
We're building a HIPAA-compliant telemedicine and EHR platform for small-to-medium medical practices.

Critical Requirements:
- HIPAA compliance (Privacy Rule, Security Rule, Breach Notification Rule)
- FDA approval for clinical decision support features
- 99.95% uptime SLA (medical criticality)
- Audit trail for all PHI (Protected Health Information) access
- Encryption: data at rest (AES-256) and in transit (TLS 1.3)
- Role-based access control (RBAC) for physicians, nurses, staff
- Patient consent management (explicit opt-in)
- Data residency (all PHI stored in US, no cross-border transfer)
- Disaster recovery (RTO <1 hour, RPO <15 minutes)
- State licensing compliance (varies by state)

Regulatory & Compliance:
- HIPAA (federal healthcare privacy law)
- HITECH Act (breach notification, penalties)
- 21 CFR Part 11 (FDA electronic records)
- ONC Certification (if acting as EHR)
- State medical board regulations
- Insurance/billing compliance (CMS Medicare rules)

Technical Challenges:
- Secure video calling (HIPAA-compliant, encrypted)
- PHI encryption and key management
- Audit logging (who accessed what, when, why)
- Secure user authentication (MFA mandatory)
- HIPAA-compliant third-party integrations
- Business Associate Agreements (BAA) with all vendors
- Incident response plan (HIPAA breach notification)

Team: 8 developers (4 full-stack, 2 security-focused), 1 compliance officer, 1 security officer
Tech preferences: React, Node.js, PostgreSQL, Azure
Timeline: 9-12 months for soft launch, 12-15 months for full FDA approval (if needed)
Budget: $5K-10K/month (high compliance costs)
Growth target: 500 medical practices within 24 months

Concerns:
- HIPAA breach penalties ($100-$50,000 per patient per incident)
- FDA approval timeline (6+ months)
- Competitive pressure (Epic, Cerner dominance)
- Technical debt from rushed MVP (compliance-first approach required)
- Patient data security (high-value target for attackers)
```

---

## Expected Agent Flow Summary

### Phase 0: @plan (Discovery)

**Regulatory Requirements Analysis**:
- HIPAA Privacy, Security, Breach Notification rules
- HITECH Act (enhanced penalties, mandatory notification)
- 21 CFR Part 11 (electronic records authentication)
- ONC Certification requirements (if applying)
- State-specific medical board rules
- Telemedicine licensing (varies by state)
- Business Associate Agreement (BAA) requirements
- Incident response and breach notification procedures

**Compliance Roadmap**:
- Pre-launch compliance checklist (4-6 months)
- HIPAA risk analysis
- Security risk assessment
- Business Associate Agreements with vendors
- Compliance testing and validation
- Breach notification procedures
- Annual compliance audits

**Expected Output**:
```
ProjectPlan/ (38+ files)
├── 01-Context/
│   ├── project-overview.md (HIPAA-compliant EHR, 12-person team, 12 months)
│   ├── regulatory-landscape.md (HIPAA, HITECH, FDA, state regulations)
│   ├── compliance-roadmap.md (pre-launch, launch, post-launch)
│   ├── market-analysis.md (Epic, Cerner, ZocDoc, Teladoc competitive landscape)
│   ├── business-model.md (per-practice subscription, integration fees)
│   └── tech-landscape.md (React, Node.js, PostgreSQL, Azure, Twilio)
├── 02-Architecture/
│   ├── hipaa-compliance-strategy.md (encryption, access control, audit)
│   ├── security-architecture.md (PKI, HSM, secrets management)
│   ├── telemedicine-infrastructure.md (secure video, messaging)
│   ├── ehr-data-model.md (HL7 FHIR standard)
│   ├── disaster-recovery.md (RTO <1hr, RPO <15min)
│   └── incident-response.md (breach notification procedures)
```

**Validation Criteria**:
- ✅ HIPAA requirements comprehensive
- ✅ Regulatory roadmap clear (timelines for approvals)
- ✅ Compliance checklist present
- ✅ Incident response procedures documented
- ✅ Business Associate Agreement (BAA) requirements identified
- ✅ Data residency strategy (US only)

---

### Phase 1: @doc (Documentation)

**Comprehensive HIPAA Documentation**:
```
Privacy Documentation:
- Privacy Notice (patient-facing)
- Notice of Privacy Practices
- Patient Consent Forms
- Marketing Authorization Guidelines

Security Documentation:
- HIPAA Security Rule implementation guide
- Risk analysis report (identify, analyze, implement, document)
- Risk management plan
- Disaster recovery plan
- Incident response plan

Technical Documentation:
- API specification (HL7 FHIR compliant)
- Data encryption specification (AES-256, TLS 1.3)
- Access control policy (role-based)
- Audit logging specification
- Third-party integration guidelines (BAA requirements)

Operational Documentation:
- User training materials (HIPAA compliance)
- Incident response playbook
- Breach notification procedures
- Audit trail review procedures
```

**API Specification** (HIPAA-compliant, HL7 FHIR):
```
# Patient Management
POST   /api/fhir/Patient
GET    /api/fhir/Patient/:id
PUT    /api/fhir/Patient/:id
DELETE /api/fhir/Patient/:id (soft delete + anonymization option)

# Clinical Documents
POST   /api/fhir/DocumentReference
GET    /api/fhir/DocumentReference/:id
GET    /api/fhir/DocumentReference?patient=:patientId

# Medications
POST   /api/fhir/MedicationRequest
GET    /api/fhir/MedicationRequest/:id
PUT    /api/fhir/MedicationRequest/:id/status

# Appointments
POST   /api/fhir/Appointment
GET    /api/fhir/Appointment/:id
PUT    /api/fhir/Appointment/:id
DELETE /api/fhir/Appointment/:id

# Telemedicine
POST   /api/telehealth/session
GET    /api/telehealth/session/:id
POST   /api/telehealth/session/:id/start
POST   /api/telehealth/session/:id/end

# Audit & Compliance
GET    /api/audit-log (provider only, with query filtering)
GET    /api/compliance/hipaa-status
POST   /api/incident/report (breach notification)
```

**Data Model** (HL7 FHIR compliant):
```
Tables:
- patients (demographic data, encrypted)
- practitioners (providers, credentials)
- encounters (visits, appointments)
- clinical_notes (encrypted, PHI)
- medications (prescriptions)
- lab_results (encrypted, sensitive)
- documents (scans, images, encrypted)
- audit_log (immutable, all PHI access)
- consent_records (patient opt-ins, encrypted)
- breaches (incident tracking, HIPAA-required)
- business_associates (vendor management, BAA tracking)
```

**Security Specifications**:
- Encryption at rest: AES-256-GCM
- Encryption in transit: TLS 1.3, HSTS
- Key management: Azure Key Vault HSM
- Access control: MFA mandatory, RBAC
- Session timeout: 15 minutes of inactivity
- Password requirements: 12+ characters, complexity
- Audit logging: All PHI access, no data in logs

---

### Phase 2: @backlog (Backlog Planning)

**Epic Structure** (12 epics, 100+ stories):
```json
{
  "epics": [
    {"id": "E1", "title": "HIPAA Compliance Foundation", "points": 210},
    {"id": "E2", "title": "Patient Management & Consent", "points": 154},
    {"id": "E3", "title": "Secure Telemedicine", "points": 198},
    {"id": "E4", "title": "EHR & Clinical Notes", "points": 176},
    {"id": "E5", "title": "Prescription Management", "points": 132},
    {"id": "E6", "title": "Labs & Imaging Integration", "points": 143},
    {"id": "E7", "title": "Secure Messaging", "points": 121},
    {"id": "E8", "title": "Reporting & Analytics (de-identified)", "points": 110},
    {"id": "E9", "title": "Practice Management", "points": 143},
    {"id": "E10", "title": "Billing & Reimbursement", "points": 154},
    {"id": "E11", "title": "HIPAA Audit & Compliance", "points": 187},
    {"id": "E12", "title": "Disaster Recovery & Security", "points": 165}
  ],
  "total_stories": 120,
  "total_story_points": 1793
}
```

**Sample Compliance-Focused Stories**:
```
US-001: HIPAA Risk Analysis (55 points)
As a compliance officer, I need to conduct and document a HIPAA risk analysis
so that we identify and mitigate security risks

Acceptance Criteria:
- Risk analysis report completed (NIST framework)
- All systems documented (data flows, access points)
- Risks identified and rated (likelihood × impact)
- Mitigation strategies for each risk
- Residual risk assessment
- Remediation timeline documented
- Board approval obtained

Deliverables:
- Risk Analysis Document (50+ pages)
- Risk Register (tracking spreadsheet)
- Mitigation Plan
- Approval signatures

US-012: End-to-End Encryption for PHI (34 points)
As a security system, I must encrypt all PHI at rest and in transit
so that patient data is protected from unauthorized access

Acceptance Criteria:
- AES-256-GCM encryption for data at rest
- TLS 1.3 for data in transit
- Key rotation every 90 days
- Master key stored in HSM
- Encryption key management audited
- Zero plaintext PHI in logs/backups
- Encryption transparent to application layer

Technical Implementation:
- Database column encryption (AWS KMS or Azure Key Vault)
- TLS certificate pinning (prevent MITM)
- Perfect forward secrecy (session-specific keys)
- Secure key derivation (PBKDF2 + salt)

Testing:
- Penetration testing (attempt to access plaintext)
- Key rotation testing (no service interruption)
- Encryption audit (verify all PHI encrypted)

US-045: Audit Log (Immutable PHI Access Tracking) (44 points)
As a compliance officer, I need an audit trail of all PHI access
so that I can prove HIPAA compliance and detect breaches

Acceptance Criteria:
- Every PHI access logged (who, what, when, why)
- Audit log immutable (cannot be deleted/modified)
- Logs encrypted (AES-256)
- 6-year retention (HIPAA requirement)
- Query interface for providers (limited, filtered by their data)
- Automated alerts (suspicious access patterns)
- Export capability (for compliance audits)
- No PHI data in logs (only encrypted references)

Access Logging Events:
- Patient record viewed (timestamp, provider, reason)
- Document downloaded (timestamp, user, file)
- Medication prescribed (timestamp, provider, med)
- Chart modified (timestamp, user, change)
- Lab result viewed (timestamp, provider, lab)

Automated Alerts:
- Access from unusual location
- Bulk access (downloading 1000+ records)
- After-hours access (flag for review)
- Access to celebrity/VIP patients
- Multiple failed login attempts

US-089: Breach Response Procedure (21 points)
As a practice, I want a clear breach response procedure
so that I can notify patients within 60 days (HIPAA requirement)

Acceptance Criteria:
- Incident detection (automated + manual)
- Impact assessment (how many patients, what data)
- Notification process (patients, media, HHS)
- Documentation (incident log, timeline)
- Remediation (fix root cause)
- Compliance with HIPAA timeline (60 days max)

Breach Response Steps:
1. Detect breach (log spike, intrusion detection)
2. Contain (isolate affected systems)
3. Assess (what data, who affected, severity)
4. Notify patients (email + phone)
5. Notify HHS (if >500 patients)
6. Notify media (if required)
7. Document (incident report)
8. Remediate (fix root cause)
9. Review (process improvement)
```

**Validation Criteria**:
- ✅ 12 epics with compliance focus
- ✅ 100+ user stories
- ✅ 1800 story points (12 months for 8 developers)
- ✅ Stories address HIPAA, encryption, audit logging
- ✅ Breach response procedures documented

---

### Phase 3: @coordinator (Implementation Plan)

**Phase Breakdown** (9 phases, 12 months):
```
Phase 1: Compliance Foundation (2 weeks)
  - Risk analysis
  - Security architecture
  - HIPAA checklist
  - BAA templates
  - 210 points

Phase 2: Infrastructure & Security (3 weeks)
  - Azure setup (US-only)
  - Encryption (data + keys)
  - HSM configuration
  - Network security
  - 176 points

Phase 3: Patient Management & Consent (3 weeks)
  - Patient records
  - Consent management
  - Privacy notice
  - GDPR-style opt-in
  - 154 points

Phase 4: Telemedicine (4 weeks)
  - Secure video (HIPAA-compliant)
  - Call recording (encrypted)
  - Session management
  - Messaging
  - 198 points

Phase 5: EHR & Clinical (3 weeks)
  - Clinical notes
  - Document management
  - HL7 FHIR integration
  - Search (de-identified)
  - 176 points

Phase 6: Prescriptions & Labs (3 weeks)
  - Prescription management
  - e-Prescription integration
  - Lab results import
  - Imaging integration
  - 275 points

Phase 7: Practice Management & Billing (2 weeks)
  - Appointment scheduling
  - Staff management
  - Billing integration
  - Reimbursement tracking
  - 297 points

Phase 8: Audit & Reporting (2 weeks)
  - Audit logging
  - Compliance reporting
  - Analytics (de-identified)
  - Breach notification
  - 297 points

Phase 9: Testing, Compliance & Launch (2 weeks)
  - Penetration testing
  - HIPAA audit
  - Load testing
  - Disaster recovery drill
  - 187 points
```

**Team Structure**:
```
Backend Squad (4 developers):
- Authentication & Access Control
- API development (FHIR)
- Database & encryption
- Integration APIs

Frontend Squad (2 developers):
- Patient portal
- Provider dashboard
- Telemedicine UI
- Admin panel

Security/DevOps (2 developers):
- Infrastructure (Azure)
- Encryption/HSM
- CI/CD pipeline
- Disaster recovery

Compliance (1 officer) + Security (1 officer):
- Risk analysis
- HIPAA compliance
- Incident response
- Vendor management (BAAs)

QA (2 people):
- Security testing
- HIPAA validation
- Compliance audits
- Penetration testing
```

**Team Velocity Calculation**:
```
8 developers × 38 points per developer per week = 304 points/week
48 weeks = 48 weeks
Planned: 1793 points (avg 37 points/week)
= Realistic for healthcare development with compliance overhead
```

**Validation Criteria**:
- ✅ 9 phases (milestone-based)
- ✅ 48 weeks total (12 months)
- ✅ Compliance integrated throughout
- ✅ Specialist roles (compliance officer, security officer)
- ✅ Regulatory timeline respected (FDA approval can extend)

---

### Phase 4: @qa (Quality & Validation Framework)

**Healthcare-Specific Testing**:
```json
{
  "testing_strategies": [
    {
      "type": "Unit Testing",
      "coverage_target": 90,
      "focus": "Business logic, encryption, access control"
    },
    {
      "type": "Integration Testing",
      "coverage_target": 85,
      "focus": "HL7 FHIR compliance, third-party APIs"
    },
    {
      "type": "HIPAA Compliance Testing",
      "coverage_target": 100,
      "focus": "Encryption validation, audit logging, access control"
    },
    {
      "type": "Security Testing",
      "coverage_target": 100,
      "focus": "Penetration testing (annual), OWASP Top 10"
    },
    {
      "type": "E2E Testing",
      "coverage_target": 70,
      "focus": "Patient workflows, telemedicine, prescription"
    },
    {
      "type": "Load Testing",
      "coverage_target": 100,
      "focus": "100+ concurrent users, video streaming"
    },
    {
      "type": "Disaster Recovery Testing",
      "coverage_target": 100,
      "focus": "RTO <1 hour, RPO <15 minutes"
    }
  ],
  "compliance_validation": [
    "HIPAA: Encryption, access control, audit trail, breach notification",
    "HITECH: Breach notification timeline (60 days)",
    "HL7 FHIR: API compliance, data standards",
    "FDA 21 CFR Part 11: Electronic records, audit trail",
    "State regulations: Telemedicine licensing, prescribing rules"
  ],
  "quality_metrics": [
    {"name": "Code Coverage", "target": 90, "critical": true},
    {"name": "HIPAA Compliance", "target": "100%", "critical": true},
    {"name": "Encryption Validation", "target": "100%", "critical": true},
    {"name": "API Response Time", "target": "<500ms p95", "critical": true},
    {"name": "Uptime", "target": "99.95%", "critical": true},
    {"name": "Audit Trail Completeness", "target": "100%", "critical": true},
    {"name": "Security Vulnerabilities", "target": "0 critical/high", "critical": true},
    {"name": "Regulatory Violations", "target": "0", "critical": true}
  ],
  "annual_requirements": [
    "External penetration testing",
    "HIPAA risk analysis update",
    "Disaster recovery drill",
    "Incident response drill",
    "Staff HIPAA training (100% completion)"
  ]
}
```

**Validation Criteria**:
- ✅ 7 testing strategies (including HIPAA-specific)
- ✅ 100% compliance validation
- ✅ Annual security audits
- ✅ Breach notification procedures tested
- ✅ Disaster recovery validated (RTO/RPO)

---

### Phase 6: @architect (Architecture Design)

**Architecture Style**: Secure, Regulated, HIPAA-Compliant Monolith (or modular)

**Key Architectural Decisions**:
```json
{
  "ADR-001": {
    "title": "Monolithic Architecture with Security Boundaries",
    "context": "12-person team, 100K users, HIPAA compliance required",
    "decision": "Single deployment (monolith) with internal security zones",
    "rationale": "Simpler to secure (fewer API attack surfaces), easier HIPAA compliance"
  },
  "ADR-002": {
    "title": "AES-256-GCM Encryption for All PHI",
    "context": "HIPAA requires encryption at rest and in transit",
    "decision": "Column-level encryption in database, TLS 1.3 for transport",
    "rationale": "Transparent to application, strong security, standard practice"
  },
  "ADR-003": {
    "title": "US-Only Data Residency",
    "context": "HIPAA requires data in US, patient consent needed for any transfer",
    "decision": "Azure resources in US-East, US-West, no cross-border replication",
    "rationale": "Regulatory requirement, data sovereignty"
  },
  "ADR-004": {
    "title": "Immutable Audit Log",
    "context": "HIPAA requires 6-year retention of access logs",
    "decision": "Append-only table, encrypted, auto-archived to cold storage",
    "rationale": "Tamper-proof, compliant with regulations"
  },
  "ADR-005": {
    "title": "HIPAA Business Associate Agreements (BAAs)",
    "context": "HIPAA requires BAAs with all vendors handling PHI",
    "decision": "BAA templates, vendor management system, renewal tracking",
    "rationale": "Legal requirement, shared responsibility"
  }
}
```

**Technology Stack**:
```
Frontend: React 18 + TypeScript + Vite + Tailwind CSS
Backend: Node.js + Express + TypeScript
Database: PostgreSQL 15 (Azure Database)
Encryption: Azure Key Vault HSM
Telemedicine: Twilio (HIPAA BAA available)
Authentication: Okta (HIPAA BAA available)
Email: Twilio SendGrid (HIPAA BAA available)
Logging: ELK Stack (Elasticsearch, Logstash, Kibana) - encrypted
Monitoring: Azure Monitor + Application Insights
Backup: Azure Backup (geo-redundant, encryption)
```

**Estimated Monthly Cost**: $5,000-10,000
```
Azure Resources: $2,000
- App Service (Premium tier, HA)
- PostgreSQL Flexible Server (HA, backups)
- Key Vault Premium (HSM)
- Backup & Disaster Recovery

Third-party Services: $2,000
- Twilio (telemedicine/SMS) with BAA
- Okta (authentication) with BAA
- SendGrid (email) with BAA

Monitoring & Security: $1,500
- ELK Stack (Elasticsearch, security)
- Azure Sentinel (SIEM)
- Penetration testing (quarterly)

Compliance & Legal: $1,000
- HIPAA risk analysis updates
- Incident response services
- Legal review (BAAs, terms of service)

Contingency: $500
----
Total: $7,000/month
(Scales with user growth, telemedicine usage)
```

**Validation Criteria**:
- ✅ Architecture = Secure monolith with HIPAA focus
- ✅ 5 ADRs with compliance emphasis
- ✅ US-only data residency
- ✅ AES-256 encryption mandatory
- ✅ Immutable audit logging
- ✅ BAA framework for all vendors
- ✅ Cost realistic ($5-10K for healthcare)

---

### Phase 7: @code-architect (Code Structure)

**HIPAA-Compliant Code Structure**:
```
ehr-platform/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts (MFA, session management)
│   │   ├── rbac.middleware.ts (role-based access control)
│   │   └── audit.logger.ts (log auth events)
│   │
│   ├── patients/
│   │   ├── patient.controller.ts
│   │   ├── patient.service.ts
│   │   ├── patient.repository.ts
│   │   ├── consent.service.ts (consent management)
│   │   └── encryption.util.ts (PHI encryption)
│   │
│   ├── clinical/
│   │   ├── notes.controller.ts
│   │   ├── notes.service.ts
│   │   ├── documents.service.ts (file encryption)
│   │   ├── fhir.transformer.ts (HL7 FHIR standard)
│   │   └── search.service.ts (de-identified search only)
│   │
│   ├── telemedicine/
│   │   ├── session.controller.ts
│   │   ├── session.service.ts
│   │   ├── call.service.ts (Twilio integration)
│   │   └── encryption.service.ts (call recording encryption)
│   │
│   ├── prescriptions/
│   │   ├── prescription.controller.ts
│   │   ├── prescription.service.ts
│   │   └── eprescribe.service.ts (third-party integration)
│   │
│   ├── audit/
│   │   ├── audit.logger.ts (immutable logging)
│   │   ├── audit.controller.ts (compliance queries)
│   │   └── breach.service.ts (incident tracking)
│   │
│   ├── compliance/
│   │   ├── hipaa.validator.ts
│   │   ├── risk-management.service.ts
│   │   └── business-associate.service.ts (BAA tracking)
│   │
│   └── shared/
│       ├── encryption/
│       │   ├── key-management.ts (Azure Key Vault)
│       │   ├── encrypt-decrypt.ts
│       │   └── key-rotation.ts
│       ├── middleware/
│       │   ├── authentication.ts
│       │   ├── authorization.ts (RBAC)
│       │   ├── error-handling.ts (HIPAA-safe errors)
│       │   └── audit-logging.ts
│       └── config/
│           ├── database.ts
│           ├── encryption.ts
│           └── hipaa.ts
│
├── database/
│   ├── schema.prisma (with encryption annotations)
│   ├── migrations/ (versioned, audited)
│   └── seed.sql (test data, de-identified)
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── hipaa-compliance/
│   ├── security/ (penetration tests)
│   ├── encryption/ (encryption validation)
│   └── audit/ (audit trail verification)
│
├── docs/
│   ├── architecture/
│   ├── api/ (OpenAPI, FHIR-compliant)
│   ├── compliance/ (HIPAA documentation)
│   ├── security/ (encryption, access control)
│   ├── disaster-recovery/
│   └── incident-response/
│
└── infrastructure/
    ├── bicep/
    │   ├── main.bicep
    │   ├── app-service.bicep
    │   ├── database.bicep (encrypted)
    │   ├── key-vault.bicep (HSM)
    │   └── backup.bicep (geo-redundant)
    └── docker/
        ├── Dockerfile
        └── docker-compose.yml (local dev)
```

**Design Patterns**:
1. **Encryption Everywhere**: Column-level DB encryption, TLS transport
2. **Audit Logging**: Immutable, encrypted logs of all PHI access
3. **Access Control**: RBAC at API level, enforced on every request
4. **Separation of Concerns**: Auth, clinical, audit are separate modules
5. **Factory Pattern**: Secure object creation (encrypted entities)
6. **Repository Pattern**: Data access abstraction (encryption transparent)

**HIPAA-Safe Error Handling**:
```typescript
// ❌ Bad - leaks information
throw new Error("Patient ABC-123 not found");

// ✓ Good - generic error
throw new Error("Record not found");

// ✓ Good with logging
logger.audit({
  action: "PATIENT_ACCESS_FAILED",
  patient_id_hash: hashPatientId(patientId),
  user_id: userId,
  reason: "UNAUTHORIZED",
  timestamp: now()
});
throw new Error("Access denied");
```

**Validation Criteria**:
- ✅ Modular HIPAA-compliant structure
- ✅ Encryption integrated at all layers
- ✅ Audit logging on every PHI access
- ✅ FHIR/HL7 compliance built-in
- ✅ 6+ design patterns
- ✅ HIPAA-safe error handling
- ✅ Comprehensive testing structure

---

### Phase 8-9: @azure-architect + @bicep-specialist

**Azure Resources** (12+ resources):
```
Compute:
- App Service (Premium P1V2, HA with 2 instances)
- Web App (for API)

Database:
- Azure Database for PostgreSQL Flexible Server
- Geo-redundant backups
- Point-in-time restore (35 days)

Security:
- Azure Key Vault Premium (HSM-backed)
- Managed Identity (service-to-service auth)
- Application Gateway (WAF, rate limiting)
- Network Security Groups

Networking:
- Virtual Network (isolated)
- Private Endpoints (database, key vault)
- DDoS Protection Standard

Monitoring:
- Application Insights
- Log Analytics Workspace
- Azure Monitor (alerts)
- Azure Sentinel (SIEM, optional)

Backup & Disaster Recovery:
- Azure Backup (app data)
- Database backups (automated)
- Geo-redundant storage
- Recovery vault

Compliance:
- Azure Policy (enforce encryption, backups)
- Azure Blueprints (HIPAA template)
```

**Data Residency**:
- All resources in US-East or US-West
- No cross-border replication
- Backups geo-redundant within US

**Disaster Recovery**:
```
RTO Target: <1 hour
RPO Target: <15 minutes

Recovery Procedure:
1. Database fails → Auto-failover (managed replica)
2. App Service fails → Swap slots or redeploy
3. Region fails → Manual failover to secondary (in different state)
4. Full disaster → Restore from backups

Backup Schedule:
- Database: Daily full, hourly transaction logs
- Application: Daily to blob storage
- Configuration: Version controlled (IaC)
```

**Cost Breakdown**:
```
App Service: $1,000 (Premium P1V2, 2 instances)
PostgreSQL: $1,500 (Burstable B2s, HA, 1TB storage)
Key Vault: $500 (Premium tier)
Backups: $500 (geo-redundant)
Network/Firewall: $300
Monitoring: $300
Storage: $200
----
Total: $4,300/month base
+ Third-party services: $2,700 (Twilio, Okta, SendGrid with BAAs)
= $7,000/month
```

**Validation Criteria**:
- ✅ 12+ Azure resources
- ✅ HSM-backed Key Vault (PCI/HIPAA compliant)
- ✅ US-only data residency
- ✅ Geo-redundant backups
- ✅ RTO <1 hour, RPO <15 minutes
- ✅ Automated failover capability
- ✅ Cost $7K (within budget)

---

### Phase 10-11: @frontend-specialist + @backend-specialist

**Frontend Deliverables**:
- Patient portal (appointment scheduling, medical records, messaging)
- Provider dashboard (patient list, telemedicine, prescriptions, notes)
- Admin panel (user management, compliance reporting)
- 50+ pages/components
- Real-time updates (telemedicine, messages)
- Mobile responsive

**Generated Patient Portal** (Secure Messaging):
```typescript
// frontend/src/components/PatientPortal/SecureMessaging.tsx
import React, { useState, useEffect } from 'react';
import { encryptMessage, decryptMessage } from '../utils/encryption';
import { api } from '../services/api';

export function SecureMessaging() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');

  // Fetch messages with client-side decryption
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Messages stored encrypted in database
        const response = await api.get('/api/messages');
        
        // Decrypt each message locally (keys never sent to server)
        const decryptedMessages = await Promise.all(
          response.data.map(async (msg: EncryptedMessage) => ({
            ...msg,
            content: await decryptMessage(msg.encryptedContent, msg.encryptionAlgorithm),
          }))
        );
        
        setMessages(decryptedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Encrypt message on client side (AES-256-GCM)
      const encrypted = await encryptMessage(newMessage, 'AES-256-GCM');
      
      // Send encrypted payload to server
      await api.post('/api/messages', {
        recipientId: selectedProvider,
        encryptedContent: encrypted.content,
        encryptionAlgorithm: 'AES-256-GCM',
        encryptionMetadata: encrypted.metadata,  // IV, salt, etc.
      });

      setNewMessage('');
      
      // Audit log (server-side) - what provider accessed, when
      console.log('Message sent (audit logged server-side)');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Secure Messaging</h2>
      
      {/* Message list */}
      <div className="space-y-4 mb-6">
        {messages.map((msg) => (
          <div key={msg.id} className="border p-4 rounded">
            <p className="font-semibold">{msg.senderName}</p>
            <p className="text-gray-700">{msg.content}</p>
            <p className="text-xs text-gray-500">
              {new Date(msg.timestamp).toLocaleString()} 
              {msg.wasEncrypted && ' 🔒'}
            </p>
          </div>
        ))}
      </div>

      {/* Send message form */}
      <form onSubmit={handleSendMessage} className="border-t pt-6">
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value)}
          className="w-full border rounded p-2 mb-4"
          required
        >
          <option value="">Select provider...</option>
          {/* Provider list */}
        </select>
        
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Encrypted message..."
          className="w-full border rounded p-3 mb-4 h-24"
          required
        />
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          Send Encrypted Message
        </button>
      </form>
    </div>
  );
}
```

**Backend Deliverables**:
- HIPAA-compliant API (50+ endpoints)
- Patient management (demographics, consent, privacy)
- Telemedicine service (video/audio calls)
- EHR service (clinical notes, documents)
- Prescription service (e-prescribe integration)
- Audit service (immutable logging)
- Encryption/decryption middleware
- Disaster recovery capability

**Generated Audit Service** (Immutable HIPAA Logging):
```typescript
// backend/src/services/AuditService.ts
import crypto from 'crypto';
import { db } from '../database';

export class AuditService {
  // Immutable audit log (Merkle tree of events)
  private auditChain: AuditEntry[] = [];

  async logAccess(
    userId: string,
    patientId: string,
    action: string,
    resourceId: string,
    accessedData: string[]
  ) {
    // Create immutable audit entry
    const previousHash = this.auditChain.length > 0 
      ? this.auditChain[this.auditChain.length - 1].hash
      : '0';

    const entry: AuditEntry = {
      timestamp: new Date(),
      userId,
      patientId,
      action,
      resourceId,
      accessedData,
      ipAddress: this.getCurrentIP(),
      userAgent: this.getUserAgent(),
      previousHash,
      hash: this.calculateHash(userId, patientId, action, previousHash),
    };

    // Store in immutable log (blockchain-style)
    await db.query(
      `INSERT INTO audit_log (
        timestamp, user_id, patient_id, action, resource_id, 
        accessed_data, ip_address, user_agent, previous_hash, hash, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        entry.timestamp,
        entry.userId,
        entry.patientId,
        entry.action,
        entry.resourceId,
        JSON.stringify(entry.accessedData),
        entry.ipAddress,
        entry.userAgent,
        entry.previousHash,
        entry.hash,
      ]
    );

    this.auditChain.push(entry);

    // Alert if suspicious access pattern detected
    await this.detectAnomalies(entry);
  }

  // HIPAA Breach Notification: detect unauthorized access
  private async detectAnomalies(entry: AuditEntry) {
    // Rules: detect access to sensitive data outside business hours, unusual patterns
    const anomalyDetected = await this.runAnomalyDetection(entry);
    
    if (anomalyDetected) {
      // HIPAA requires notification within 60 days
      await this.alertSecurityOfficer({
        type: 'POTENTIAL_UNAUTHORIZED_ACCESS',
        entry,
        severity: 'HIGH',
        requiresInvestigation: true,
      });
    }
  }

  // Verify audit log integrity (anti-tampering)
  async verifyIntegrity(): Promise<boolean> {
    const entries = await db.query('SELECT * FROM audit_log ORDER BY id');
    
    let previousHash = '0';
    for (const entry of entries.rows) {
      const calculatedHash = this.calculateHash(
        entry.user_id,
        entry.patient_id,
        entry.action,
        previousHash
      );

      if (calculatedHash !== entry.hash) {
        // Audit log tampering detected!
        await this.alertSecurityOfficer({
          type: 'AUDIT_LOG_TAMPERING_DETECTED',
          entry,
          severity: 'CRITICAL',
        });
        return false;
      }

      previousHash = entry.hash;
    }

    return true;
  }

  private calculateHash(userId: string, patientId: string, action: string, previousHash: string): string {
    return crypto
      .createHash('sha256')
      .update(`${userId}${patientId}${action}${previousHash}`)
      .digest('hex');
  }

  private getCurrentIP(): string {
    // Extract from request context
    return process.env.CURRENT_IP || 'unknown';
  }

  private getUserAgent(): string {
    return process.env.USER_AGENT || 'unknown';
  }

  private async runAnomalyDetection(entry: AuditEntry): Promise<boolean> {
    // ML-based anomaly detection or rule-based
    const isAnomalous = entry.action === 'VIEW_PHI' && 
      entry.timestamp.getHours() < 6; // Access outside business hours
    return isAnomalous;
  }

  private async alertSecurityOfficer(alert: any) {
    console.error('HIPAA ALERT:', alert);
    // Send to compliance officer
  }
}
```

**HIPAA-Compliant Encryption Middleware**:
```typescript
// backend/src/middleware/encryptionMiddleware.ts
import crypto from 'crypto';

export function encryptionMiddleware(req: Request, res: Response, next: NextFunction) {
  // All PHI data is encrypted at rest with AES-256
  const dataEncryptionKey = process.env.MASTER_KEY; // Stored in Azure Key Vault
  
  // Intercept response to encrypt PHI before sending
  const originalSend = res.send;
  
  res.send = function(data: any) {
    try {
      if (data && typeof data === 'object' && data.patientId) {
        // PHI detected - encrypt before sending
        const encrypted = crypto.createCipheriv(
          'aes-256-gcm',
          Buffer.from(dataEncryptionKey!),
          crypto.randomBytes(16)
        );
        
        const ciphertext = encrypted.update(JSON.stringify(data), 'utf8', 'hex');
        ciphertext += encrypted.final('hex');
        
        res.setHeader('X-Encrypted', 'true');
        res.setHeader('X-Encryption-Algorithm', 'AES-256-GCM');
        
        return originalSend.call(this, ciphertext);
      }
      
      return originalSend.call(this, data);
    } catch (error) {
      console.error('Encryption error:', error);
      return res.status(500).json({ error: 'Encryption failed' });
    }
  };
  
  next();
}
```

**Validation Criteria**:
- ✅ 50+ frontend components
- ✅ 50+ API endpoints (FHIR-compliant)
- ✅ HIPAA encryption working (AES-256-GCM)
- ✅ Audit logging complete (immutable, tamper-proof)
- ✅ Telemedicine functional (secure video)
- ✅ Disaster recovery tested (RTO <1 hour)
- ✅ Access controls enforced (RBAC, MFA)
- ✅ Breach detection implemented

---

### Phase 12: @devops-specialist

**CI/CD Pipeline** (HIPAA-Compliant):
```yaml
name: Deploy HIPAA-Compliant Healthcare Platform

on:
  push:
    branches: [main, protected-branches]
    paths-ignore:
      - 'docs/**'
      - 'README.md'

jobs:
  # Stage 1: Security & Compliance Checks
  security-and-compliance:
    runs-on: ubuntu-latest-xl
    steps:
      - uses: actions/checkout@v3
      
      - name: Secrets scanning (gitleaks)
        run: |
          docker run -v "$(pwd):/path" gitleaks/gitleaks-action \
            detect --verbose --report-path /path/gitleaks-report.json
      
      - name: HIPAA PII scanning
        run: npm run scan:pii -- --fail-on-pii
      
      - name: Dependency audit
        run: npm audit --audit-level=moderate && npm run audit:licenses
      
      - name: SAST scanning (SonarQube)
        run: |
          sonar-scanner \
            -Dsonar.projectKey=healthcare-platform \
            -Dsonar.coverage.exclusions=tests/** \
            -Dsonar.login=${{ secrets.SONAR_TOKEN }}
      
      - name: OWASP ZAP security scan
        run: npm run security:scan:owasp
      
      - name: HIPAA BAA compliance check
        run: npm run compliance:baa-check
      
      - name: Encryption validation
        run: npm run test:encryption:validate -- --algorithm=AES-256-GCM
      
      - name: Upload compliance report
        uses: actions/upload-artifact@v3
        with:
          name: compliance-report
          path: reports/compliance/

  # Stage 2: Build & Test (90% coverage required)
  build-and-test:
    needs: security-and-compliance
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Unit tests (90% coverage required)
        run: |
          npm run test:unit -- \
            --coverage \
            --collectCoverageFrom='src/**/*.ts' \
            --coverageThreshold='{"global":{"lines":90,"functions":90,"branches":90}}'
      
      - name: Integration tests
        run: npm run test:integration
      
      - name: HIPAA audit logging tests
        run: npm run test:hipaa:audit-logging
      
      - name: Encryption tests
        run: npm run test:encryption
      
      - name: Disaster recovery tests
        run: npm run test:disaster-recovery
      
      - name: Build application
        run: npm run build

  # Stage 3: Deploy to Staging (encrypted)
  deploy-staging:
    needs: build-and-test
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure Azure credentials
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Deploy infrastructure (encrypted storage, HIPAA-compliant)
        run: |
          az deployment group create \
            --resource-group rg-healthcare-staging \
            --template-file infrastructure/healthcare.bicep \
            --parameters \
              environment=staging \
              encryptionEnabled=true \
              hipaaCompliance=true \
              backupEnabled=true
      
      - name: Deploy application to staging
        run: |
          az webapp up \
            --resource-group rg-healthcare-staging \
            --name healthcare-platform-staging \
            --runtime 'NODE|20-lts' \
            --src-dir . \
            --deployment-type zip
      
      - name: Run staging compliance tests
        run: npm run test:staging:compliance
      
      - name: Verify encryption on staging
        run: npm run verify:encryption:staging
      
      - name: Backup verification
        run: npm run verify:backup:staging

  # Stage 4: Deploy to Production (zero-downtime, HIPAA-audit)
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://healthcare.medical.org
    steps:
      - uses: actions/checkout@v3
      
      - name: Compliance approval required
        run: |
          echo "Compliance officer approval required before deployment"
          echo "Check: https://github.com/${{ github.repository }}/environment/production"
      
      - name: Configure Azure credentials
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS_PROD }}
      
      - name: Deploy using blue-green (zero-downtime)
        run: |
          # Deploy new version as green
          az webapp up \
            --resource-group rg-healthcare-prod \
            --name healthcare-platform-green \
            --runtime 'NODE|20-lts'
          
          # Run smoke tests
          npm run test:smoke:prod
          
          # Switch traffic (atomic operation)
          az webapp traffic-routing set \
            --resource-group rg-healthcare-prod \
            --name healthcare-platform \
            --distribution green=100
      
      - name: Verify production encryption
        run: npm run verify:encryption:production
      
      - name: Verify audit logs
        run: npm run verify:audit-logs:production
      
      - name: Post-deployment compliance check
        run: npm run compliance:post-deployment
      
      - name: HIPAA breach check
        run: npm run check:hipaa-breaches
      
      - name: Notify compliance officer
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"Production deployment complete. HIPAA compliance verified."}'
```

**Generated Infrastructure Code** (HIPAA-Compliant Azure):
```bicep
// infrastructure/healthcare.bicep
param location string = 'eastus'
param environment string = 'prod'
param encryptionEnabled bool = true
param hipaaCompliance bool = true

// App Service with HIPAA settings
resource appService 'Microsoft.Web/sites@2021-02-01' = {
  name: 'healthcare-platform-${environment}'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      http20Enabled: true
      minTlsVersion: '1.2'  // Enforce TLS 1.2+
      appSettings: [
        { name: 'ENCRYPTION_ENABLED', value: encryptionEnabled ? 'true' : 'false' }
        { name: 'HIPAA_MODE', value: 'enabled' }
        { name: 'AUDIT_LOG_ENABLED', value: 'true' }
        { name: 'BACKUP_ENABLED', value: 'true' }
        { name: 'DATABASE_ENCRYPTION', value: 'AES-256' }
      ]
    }
    httpsOnly: true  // Force HTTPS
  }
}

// Azure SQL Database with Transparent Data Encryption (TDE)
resource sqlDatabase 'Microsoft.Sql/servers/databases@2021-05-01-preview' = {
  name: 'healthcare-db'
  parent: sqlServer
  location: location
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

// Transparent Data Encryption (TDE) - encryption at rest
resource tde 'Microsoft.Sql/servers/databases/transparentDataEncryption@2021-05-01-preview' = {
  name: 'default'
  parent: sqlDatabase
  properties: {
    state: 'Enabled'
  }
}

// Key Vault for encryption keys (HIPAA-compliant secret management)
resource keyVault 'Microsoft.KeyVault/vaults@2021-06-01-preview' = {
  name: 'healthcare-kv-${environment}'
  location: location
  properties: {
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: appService.identity.principalId
        permissions: {
          secrets: ['get', 'list']
          keys: ['get', 'list']
        }
      }
    ]
  }
}

// Backup vault for disaster recovery
resource backupVault 'Microsoft.RecoveryServices/vaults@2021-07-01' = {
  name: 'healthcare-backup-${environment}'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicNetworkAccess: 'Disabled'  // Private endpoint only
  }
}

// Backup policy (daily + retention = 30 days for HIPAA)
resource backupPolicy 'Microsoft.RecoveryServices/vaults/backupPolicies@2021-07-01' = {
  name: 'healthcare-backup-policy'
  parent: backupVault
  properties: {
    backupManagementType: 'AzureSql'
    workLoadType: 'SQLDatabase'
    retentionPolicy: {
      dailySchedule: {
        retentionTimes: [string(utcNow('u'))]
        retentionDuration: {
          count: 30
          durationType: 'Days'
        }
      }
    }
  }
}
```

**Audit & Compliance Verification**:
```typescript
// scripts/verify-hipaa-compliance.ts
export async function verifyHIPAACompliance() {
  const checks = {
    encryptionAtRest: await verifyEncryptionAtRest(),
    encryptionInTransit: await verifyEncryptionInTransit(),
    auditLogging: await verifyAuditLogging(),
    accessControls: await verifyAccessControls(),
    dataIntegrity: await verifyDataIntegrity(),
    backupIntegrity: await verifyBackupIntegrity(),
  };

  const allPassed = Object.values(checks).every(check => check === true);

  if (!allPassed) {
    throw new Error('HIPAA compliance verification failed');
  }

  console.log('✅ HIPAA Compliance Verified');
  return true;
}

async function verifyEncryptionAtRest(): Promise<boolean> {
  // Verify AES-256 encryption enabled
  const dbEncryption = await db.query('SELECT * FROM sys.dm_database_encryption_keys');
  return dbEncryption.rows.length > 0 && dbEncryption.rows[0].encryption_state === 3;
}

async function verifyAuditLogging(): Promise<boolean> {
  // Verify audit logs cannot be tampered with
  const integrity = await auditService.verifyIntegrity();
  return integrity;
}
```

**Disaster Recovery Testing** (Monthly Drills):
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: hipaa-dr-drill
spec:
  schedule: "0 2 1 * *"  # First day of month at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: dr-drill
            image: healthcare-dr-tools:latest
            env:
            - name: BACKUP_LOCATION
              value: /backups
            - name: TEST_RESTORE_ENV
              value: staging
            command:
            - /bin/sh
            - -c
            - |
              echo "Starting monthly HIPAA DR drill..."
              # Restore backup to staging
              az backup restore --vault healthcare-backup \
                --backup healthcare-db \
                --restore-to-staging
              # Run data verification
              npm run verify:restore:complete
              # Notify compliance officer
              curl -X POST $SLACK_WEBHOOK \
                -d '{"text":"Monthly DR drill completed successfully"}'
```

**Validation Criteria**:
- ✅ Multi-stage CI/CD (security → build → staging → production)
- ✅ HIPAA compliance checks in pipeline (PII scanning, encryption validation)
- ✅ 90% unit test coverage (required)
- ✅ HIPAA audit logging (immutable, tamper-proof)
- ✅ Encryption at rest (AES-256-TDE) and in transit (TLS 1.2+)
- ✅ Zero-downtime blue-green deployment
- ✅ Automated backup (daily, 30-day retention)
- ✅ Disaster recovery (RTO <1 hour, RPO <15 minutes)
- ✅ Monthly DR drills automated
- ✅ Compliance officer approval gate before production
- ✅ Post-deployment breach detection
- ✅ Business Associate Agreements (BAAs) enforced
- ✅ 99.95% uptime SLA maintained

---

## Success Criteria

**Overall Validation**:
- ✅ All 13 agents executed
- ✅ Total timeline: 48 weeks (12 months, within 9-12 month target)
- ✅ Total cost: $7,000/month (within $5-10K budget)
- ✅ Scope: 120 user stories, 1793 story points
- ✅ Team velocity: 304 points per week (8 developers)
- ✅ Architecture: HIPAA-compliant secure monolith
- ✅ Uptime: 99.95% (healthcare criticality)
- ✅ Compliance: HIPAA, HITECH, HL7 FHIR, 21 CFR Part 11

**Deliverables**:
1. ProjectPlan (38+ files, compliance-focused)
2. Backlog (120 stories, 12 epics)
3. Implementation plan (9 phases, 48 weeks)
4. Architecture decisions (5 ADRs)
5. Code structure (HIPAA-compliant)
6. Infrastructure code (12+ Azure resources)
7. HIPAA compliance documentation
8. Risk analysis and remediation plan
9. Business Associate Agreements (BAAs) templates
10. Disaster recovery plan
11. Incident response procedures
12. Deployed healthcare platform (production-ready)

**Quality Gates**:
- 90% unit test coverage
- 100% encryption validation (AES-256)
- 100% audit logging (immutable)
- <500ms p95 API response
- 99.95% uptime
- 0 PHI breaches
- 0 unauthorized PHI access
- 0 critical security vulnerabilities
- HIPAA compliance audit passed
- No regulatory violations

**Regulatory Milestones**:
- Week 8: Risk analysis complete, board approval
- Week 16: Encryption deployed and validated
- Week 24: First audit log rotation completed
- Week 32: Penetration testing passed
- Week 40: Disaster recovery drill successful
- Week 48: HIPAA compliance audit passed, ready for launch

---

## Filename: `S05-regulated-healthcare.scenario.md`
