# Feature F14: On-Premises Infrastructure Support

**Status**: Planned  
**Priority**: Medium  
**Complexity**: Medium  
**Estimated Effort**: 3-4 weeks  
**Target Phase**: Phase 2 Integration

---

## Problem Statement

### Current Gap
In AGENT_ACTIVATION_GUIDE.md staat bij **@azure-architect**:

```
❌ SKIPS when:
- Platform chosen: AWS, GCP, on-premises
```

**Betekenis**: Als gebruiker on-premises kiest als deployment platform:
- ❌ Geen agent voor on-premises architecture
- ❌ Geen on-premises infrastructure patterns
- ❌ Geen skill voor server setup, networking
- ❌ Geen schemas voor on-premises deployment
- ❌ Geen integration met on-prem tools (VMware, bare-metal)

### Business Impact
- **Many enterprises require on-premises** (regulated industries)
- Banking, government, healthcare sectors (data sovereignty)
- Hybrid cloud deployments (on-prem + cloud)
- Edge computing scenarios
- Air-gapped environments (military, research)
- Cost control for large-scale deployments

---

## Proposed Solution

### New Components Needed

#### 1. Agent: @onprem-architect
**Responsibility**: On-premises infrastructure design  
**Phase**: 9 (alternative to @azure-architect, @aws-architect, @gcp-architect)  
**Activation**: `IF platform == "on-premises"`

**Output**:
- Server specifications
- Network topology
- Load balancer configuration (HAProxy, NGINX)
- Database server setup
- Application server setup
- Security configuration (firewall, VPN)
- Monitoring and logging setup
- Backup and disaster recovery
- Documentation for manual deployment

#### 2. Skill: onprem-infrastructure-patterns
**Type**: Process skill  
**Used by**: @onprem-architect

**Content**:
- Server sizing and capacity planning
- Network design (subnets, VLANs, DMZ)
- Load balancing strategies
- High availability (clustering, failover)
- Database replication (master-slave, multi-master)
- Storage architecture (SAN, NAS, local storage)
- Security zones and firewalls
- Monitoring infrastructure
- Backup strategies

#### 3. Skill: server-configuration
**Type**: Code skill  
**Used by**: @onprem-architect

**Content**:
- Linux server setup (Ubuntu, RHEL, CentOS)
- Windows Server setup
- Web server configuration (NGINX, Apache, IIS)
- Application server setup (Docker, systemd services)
- Database server configuration (PostgreSQL, MySQL)
- Reverse proxy setup
- SSL/TLS certificate management
- Firewall configuration (iptables, firewalld, Windows Firewall)

#### 4. Schemas (6 files)
```
.github/schemas/agents/
├── @onprem-architect.input.schema.json
└── @onprem-architect.output.schema.json

.github/schemas/skills/
├── onprem-infrastructure-patterns.input.schema.json
├── onprem-infrastructure-patterns.output.schema.json
├── server-configuration.input.schema.json
└── server-configuration.output.schema.json
```

---

## Implementation Phases

### Phase 1: Research & Design (Week 1)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] On-premises vs cloud comparison
- [ ] Common deployment patterns (single server, multi-tier, clustered)
- [ ] Operating system options (Linux vs Windows)
- [ ] Containerization strategy (Docker, Podman)
- [ ] Orchestration options (Docker Compose, Kubernetes on-prem)

**Review Points**:
- Linux (Ubuntu/RHEL) as default OS? (Yes)
- Docker Compose for orchestration? (Yes for simple, K8s for complex)
- Manual deployment or automation tools? (Provide both)

---

### Phase 2: Agent Specification (Week 1-2)
**Duration**: 7 dagen  
**Deliverables**:
- [ ] @onprem-architect.agent.md (380+ lines)
  - **Infrastructure Design**:
    - Server specifications (CPU, RAM, storage)
    - Network topology (DMZ, application tier, data tier)
    - Load balancer design (HAProxy, NGINX)
    - Firewall rules and security zones
  
  - **Deployment Patterns**:
    - Single server (development, small apps)
    - Multi-tier (web, app, database servers)
    - High availability (clustered, load balanced)
    - Edge deployment (distributed locations)
  
  - **Server Configuration**:
    - Web server (NGINX reverse proxy)
    - Application server (Docker containers or systemd)
    - Database server (PostgreSQL/MySQL)
    - Monitoring (Prometheus, Grafana)
  
  - **Networking**:
    - Subnet design
    - VLAN configuration (if applicable)
    - VPN access (WireGuard, OpenVPN)
    - DNS configuration
  
  - **Security**:
    - Firewall configuration (iptables/firewalld)
    - SSL/TLS certificates (Let's Encrypt or internal CA)
    - SSH hardening
    - Intrusion detection (fail2ban)
  
  - **High Availability**:
    - Database replication (streaming replication, Patroni)
    - Application clustering
    - Load balancer redundancy (keepalived)
  
  - **Monitoring & Logging**:
    - Prometheus + Grafana
    - ELK stack (Elasticsearch, Logstash, Kibana)
    - Application logs
  
  - **Backup & Recovery**:
    - Database backups (pg_dump, mysqldump)
    - File system backups (rsync, Restic)
    - Disaster recovery plan
  
  - Hands off to deployment documentation (no automated deployment agent)

**Review Points**:
- Is @onprem-architect op zelfde niveau als cloud architects?
- Zijn on-prem specific challenges gedekt (geen auto-scaling)?
- Is output actionable voor manual deployment?

---

### Phase 3: Skill Definitions (Week 2)
**Duration**: 6 dagen  
**Deliverables**:
- [ ] onprem-infrastructure-patterns.skill.md (220+ lines)
  - **Capacity Planning**:
    - CPU sizing (cores, clock speed)
    - Memory sizing (RAM requirements)
    - Storage sizing (SSD vs HDD, RAID)
    - Network bandwidth planning
  
  - **Network Architecture**:
    - Three-tier architecture (presentation, logic, data)
    - DMZ design (public-facing services)
    - Internal network segmentation
    - Firewall zones
  
  - **Load Balancing**:
    - HAProxy configuration (Layer 4/7)
    - NGINX as reverse proxy
    - Health checks
    - Session persistence
  
  - **High Availability**:
    - Active-passive clustering
    - Active-active clustering
    - Failover mechanisms
    - Split-brain prevention
  
  - **Database Architecture**:
    - Master-slave replication
    - Master-master replication (Galera, PostgreSQL BDR)
    - Backup servers
    - Connection pooling (PgBouncer, ProxySQL)
  
  - **Storage**:
    - Local storage (RAID configurations)
    - Network storage (NFS, iSCSI)
    - SAN/NAS considerations
  
  - **Security Architecture**:
    - Perimeter security (firewall)
    - Internal segmentation
    - VPN access (site-to-site, remote access)
    - Certificate management

- [ ] server-configuration.skill.md (200+ lines)
  - **Linux Server Setup**:
    - Ubuntu Server 22.04 LTS
    - RHEL/CentOS Stream
    - Initial hardening (disable root, SSH keys)
    - Package management (apt, yum/dnf)
  
  - **Web Server Configuration**:
    - NGINX as reverse proxy
    - Apache HTTP Server (alternative)
    - SSL/TLS configuration
    - Gzip compression
    - Caching
  
  - **Application Server**:
    - Docker installation and configuration
    - Docker Compose setup
    - systemd service units (for non-Docker)
    - Environment variables
  
  - **Database Server**:
    - PostgreSQL installation and tuning
    - MySQL installation and tuning
    - Replication setup
    - Backup configuration
  
  - **Firewall Configuration**:
    - iptables rules (INPUT, FORWARD, OUTPUT)
    - firewalld zones and services
    - Port management
  
  - **Monitoring**:
    - Prometheus node_exporter
    - Grafana dashboards
    - Log aggregation (rsyslog, journald)
  
  - **Automation**:
    - Shell scripts (bash)
    - Ansible playbooks (optional)
    - Configuration management

**Review Points**:
- Zijn patterns praktisch en actionable?
- Is Linux focus correct? (Windows alternative?)

---

### Phase 4: Schema Creation (Week 3)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] @onprem-architect.input.schema.json
  ```json
  {
    "infrastructure_design": {
      "deployment_type": "single-server | multi-tier | high-availability",
      "operating_system": "Ubuntu 22.04 LTS | RHEL 9 | Windows Server 2022",
      "containerization": "Docker | bare-metal",
      "orchestration": "Docker Compose | Kubernetes | none"
    },
    "servers": [
      {
        "role": "web-server | app-server | database-server | load-balancer",
        "hostname": "web01.internal.local",
        "specs": {
          "cpu_cores": 4,
          "ram_gb": 16,
          "storage_gb": 500,
          "storage_type": "SSD"
        },
        "network": {
          "ip_address": "192.168.1.10",
          "subnet_mask": "255.255.255.0",
          "gateway": "192.168.1.1"
        }
      }
    ],
    "network_topology": {
      "subnets": [
        {
          "name": "DMZ",
          "cidr": "192.168.1.0/24",
          "purpose": "Public-facing services"
        },
        {
          "name": "Application",
          "cidr": "192.168.2.0/24",
          "purpose": "Application servers"
        },
        {
          "name": "Database",
          "cidr": "192.168.3.0/24",
          "purpose": "Database servers"
        }
      ]
    },
    "high_availability": {
      "load_balancer": "HAProxy | NGINX",
      "database_replication": "streaming | logical",
      "failover": "automatic | manual"
    },
    "security": {
      "firewall": "iptables | firewalld",
      "ssl_certificates": "letsencrypt | internal-ca | purchased",
      "vpn": "WireGuard | OpenVPN | none"
    },
    "monitoring": {
      "metrics": "Prometheus + Grafana",
      "logging": "ELK | Loki | rsyslog"
    }
  }
  ```

- [ ] @onprem-architect.output.schema.json
  ```json
  {
    "artifacts": {
      "architecture_diagram": [
        {
          "file": "docs/architecture-diagram.md",
          "content": "# On-Premises Architecture\n\n## Network Topology\n..."
        }
      ],
      "server_specs": [
        {
          "file": "docs/server-specifications.md",
          "content": "# Server Specifications\n\n## Web Server (web01)\n- CPU: 4 cores..."
        }
      ],
      "network_config": [
        {
          "file": "config/network-topology.md",
          "content": "# Network Configuration\n\n## Subnets..."
        }
      ],
      "nginx_config": [
        {
          "file": "config/nginx.conf",
          "content": "upstream backend { server 192.168.2.10:5000; }..."
        }
      ],
      "docker_compose": [
        {
          "file": "docker-compose.yml",
          "content": "version: '3.8'\nservices:\n  app: ..."
        }
      ],
      "database_setup": [
        {
          "file": "scripts/postgresql-setup.sh",
          "content": "#!/bin/bash\n# PostgreSQL installation and configuration..."
        }
      ],
      "firewall_rules": [
        {
          "file": "scripts/firewall-setup.sh",
          "content": "#!/bin/bash\n# iptables configuration..."
        }
      ],
      "monitoring_setup": [
        {
          "file": "config/prometheus.yml",
          "content": "global:\n  scrape_interval: 15s..."
        }
      ],
      "deployment_guide": [
        {
          "file": "docs/deployment-guide.md",
          "content": "# Deployment Guide\n\n## Prerequisites\n..."
        }
      ]
    },
    "infrastructure_info": {
      "servers_designed": 5,
      "total_cpu_cores": 24,
      "total_ram_gb": 96,
      "estimated_cost": "$15,000 (hardware + setup)"
    },
    "next_phase": "Manual deployment (no automation agent)"
  }
  ```

- [ ] onprem-infrastructure-patterns skill schemas (input/output)
- [ ] server-configuration skill schemas (input/output)

**Review Points**:
- Zijn schemas consistent met cloud architect agents?
- Is output actionable voor deployment teams?

---

### Phase 5: Integration with Existing System (Week 3)
**Duration**: 5 dagen  
**Deliverables**:
- [ ] Update @code-architect.agent.md
  - Add on-premises to platform options
  - Add on-prem architecture considerations
  - Add manual deployment workflows
  
- [ ] Update AGENT_ACTIVATION_GUIDE.md
  - Add @onprem-architect activation criteria
  - Update Phase 9 alternatives (Azure OR AWS OR GCP OR on-premises)
  - Update decision tree
  
- [ ] Update PHASE_FLOW.md
  - Update Phase 9 alternatives
  - Add on-premises timing estimates (120-200m - more manual work)
  
- [ ] Update SYSTEM_ARCHITECTURE.md
  - Add @onprem-architect to Infrastructure Tier
  - Update agent inventory

**Review Points**:
- Conflicteert on-prem path met cloud paths?
- Is Phase 9 decision logic helder (cloud vs on-prem)?

---

### Phase 6: Scenario Integration (Week 4)
**Duration**: 4 dagen  
**Deliverables**:
- [ ] Create on-premises scenario
  - S09: On-premises deployment (multi-tier)
  - Web server (NGINX)
  - App server (Docker)
  - Database server (PostgreSQL with replication)
  - Load balancer (HAProxy)
  
- [ ] Create deployment documentation
  - Hardware requirements
  - Network setup guide
  - Server installation steps
  - Application deployment
  - Monitoring setup

**Review Points**:
- Is on-premises scenario realistisch?
- Zijn deployment instructions helder genoeg?

---

## System Impact Analysis

### Modified Components
| Component | Change | Lines Added | Review Needed |
|-----------|--------|-------------|---------------|
| @code-architect.agent.md | Add on-prem platform option | ~100 | YES |
| AGENT_ACTIVATION_GUIDE.md | Add 1 agent | ~900 | YES |
| PHASE_FLOW.md | Update Phase 9 alternatives | ~250 | YES |
| SYSTEM_ARCHITECTURE.md | Add on-prem architect | ~450 | YES |
| README.md | Update agent count | ~20 | YES |

### New Components
| Component | Type | Lines | Review Needed |
|-----------|------|-------|---------------|
| @onprem-architect.agent.md | Agent spec | ~380 | YES |
| onprem-infrastructure-patterns.skill.md | Skill spec | ~220 | YES |
| server-configuration.skill.md | Skill spec | ~200 | YES |
| 6 schema files | JSON schemas | ~1,200 | YES |
| **Total New** | - | **~2,000 lines** | - |

---

## Testing Considerations (User Will Test)

### Test Scenarios
1. **S09 On-Premises**: Multi-tier deployment with HA
2. **Single Server**: Development/small app deployment
3. **Hybrid**: On-prem database + cloud frontend

### Validation Points
- [ ] @onprem-architect generates complete deployment docs
- [ ] Server specifications are realistic
- [ ] Network topology is secure
- [ ] NGINX configuration is valid
- [ ] Docker Compose files work
- [ ] Firewall rules are correct
- [ ] Monitoring setup is functional

---

## Dependencies

### Prerequisites
- Phase 1 (existing system) must be 100% complete ✅
- @code-architect must support platform selection ✅
- Cloud architects exist as reference ✅

### Parallel Work
- Can be developed parallel with F13 (Terraform - can deploy on-prem K8s)
- Independent from cloud-specific features

### Blocking For
- Hybrid cloud scenarios
- Regulated industry deployments

---

## Success Criteria

### Must Have
- ✅ @onprem-architect agent fully documented (380+ lines)
- ✅ 2 on-prem skills documented (420+ lines total)
- ✅ 6 schema files created with 100% coverage
- ✅ Phase 9 decision logic supports cloud OR on-premises
- ✅ S09 on-premises scenario created
- ✅ All existing documentation updated

### Should Have
- Linux server configuration (Ubuntu, RHEL)
- Docker Compose orchestration
- Load balancer setup (HAProxy, NGINX)
- Database replication patterns

### Nice to Have
- Windows Server support
- VMware integration
- Kubernetes on-prem (K3s, kubeadm)
- Ansible playbooks for automation

---

## Review Checklist

### Architecture Review
- [ ] Zijn @onprem-architect responsibilities duidelijk?
- [ ] Is on-prem architecture realistic?
- [ ] Zijn HA patterns correct?
- [ ] Is output actionable voor deployment teams?

### Integration Review
- [ ] Conflicteert on-prem met cloud in Phase 9?
- [ ] Is orchestrator logic updated?
- [ ] Wanneer on-prem kiezen vs cloud?

### Documentation Review
- [ ] Zijn alle documentatie files updated?
- [ ] Is agent count correct?
- [ ] Zijn decision trees helder?

### Quality Review
- [ ] Zijn schemas syntactisch correct?
- [ ] Zijn server configs realistic?
- [ ] Zijn security patterns gedocumenteerd?

---

## Risks & Mitigations

### Risk 1: Manual Deployment Complexity
**Impact**: High  
**Probability**: High  
**Mitigation**: 
- Provide detailed step-by-step guides
- Include troubleshooting sections
- Shell scripts for automation
- Consider Ansible playbooks

### Risk 2: Hardware Diversity
**Impact**: Medium  
**Probability**: High  
**Mitigation**: 
- Provide ranges (min, recommended, optimal)
- Document scaling patterns
- Multiple deployment patterns

### Risk 3: Limited Auto-Scaling
**Impact**: Medium  
**Probability**: High (inherent to on-prem)  
**Mitigation**: 
- Document capacity planning
- Over-provision initially
- Manual scaling procedures

### Risk 4: Monitoring Gaps
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**: 
- Include Prometheus + Grafana by default
- Document alert configuration
- Log aggregation setup

---

## On-Premises Specific Considerations

### Why On-Premises is Still Relevant

**1. Data Sovereignty**
- Government regulations (GDPR, data residency)
- Banking and finance (regulatory compliance)
- Healthcare (HIPAA, patient data)

**2. Cost Control**
- Predictable costs (no cloud bills)
- Better economics at scale (1000+ servers)
- Depreciation vs operational expense

**3. Security Requirements**
- Air-gapped environments (military)
- Full control over infrastructure
- No third-party access

**4. Performance**
- Low latency (local network)
- Dedicated hardware
- No noisy neighbors

**5. Existing Investment**
- Datacenter already exists
- Hardware already purchased
- Staff expertise

### On-Premises vs Cloud

**On-Premises Advantages**:
- ✅ Full control
- ✅ Data sovereignty
- ✅ Predictable costs (at scale)
- ✅ Low latency (local)

**Cloud Advantages**:
- ✅ Auto-scaling
- ✅ Managed services
- ✅ Global distribution
- ✅ No hardware maintenance
- ✅ Pay-as-you-go

**When to Choose On-Premises**:
- Regulated industries (banking, healthcare, government)
- Data sovereignty requirements
- Existing datacenter investment
- Large-scale, stable workloads
- Air-gapped environments

**When to Choose Cloud**:
- Variable workloads (need auto-scaling)
- Global distribution needed
- No existing infrastructure
- Fast time-to-market
- Want managed services

---

## Hybrid Cloud Patterns

### Pattern 1: Database On-Prem, Apps in Cloud
**Use Case**: Data residency, low latency to data  
**Architecture**: Cloud apps → VPN → On-prem database

### Pattern 2: Frontend Cloud, Backend On-Prem
**Use Case**: Public-facing cloud, sensitive data on-prem  
**Architecture**: Cloud frontend → API Gateway → VPN → On-prem backend

### Pattern 3: Disaster Recovery in Cloud
**Use Case**: Backup site without second datacenter  
**Architecture**: Primary on-prem → Replicate → Cloud (standby)

---

## Next Steps

1. **Review dit document** - Valideer on-premises approach
2. **Goedkeuring voor Phase 1** - Start on-prem research
3. **Linux vs Windows focus?** - Confirm OS priorities

---

**Status**: ⏳ Awaiting Review  
**Reviewer**: [User]  
**Next Document**: F15-GitLab-CICD-Support.md

