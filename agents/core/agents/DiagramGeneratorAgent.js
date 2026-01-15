import { BaseAgent } from '../base/BaseAgent.js';
import { EventEmitter } from 'events';

/**
 * DiagramGeneratorAgent - Architecture Diagram Generation
 * 
 * Generates various architecture diagrams including C4 models, sequence diagrams,
 * network topology, deployment diagrams in PlantUML and Mermaid formats.
 */
export class DiagramGeneratorAgent extends BaseAgent {
  constructor(spec = {}) {
    const defaultSpec = {
      id: 'diagram-generator',
      name: 'Diagram Generator Agent',
      description: 'Generates architecture diagrams in PlantUML and Mermaid formats',
      inputSchema: {
        type: 'object',
        properties: {
          architecture: { type: 'object' },
          components: { type: 'array' },
          diagramTypes: { type: 'array', items: { type: 'string' } }
        },
        required: ['architecture', 'components']
      },
      outputSchema: {
        type: 'object',
        properties: {
          diagrams: { type: 'array' },
          formats: { type: 'object' }
        }
      }
    };

    super({ ...defaultSpec, ...spec });
    this.diagramCache = new Map();
    this.templates = this.initializeTemplates();
  }

  async _onInitialize() {
    this.diagramCache.clear();
    this.templates = this.initializeTemplates();
  }

  async _onExecute(input, context, executionId) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
    }

    const { architecture, components, diagramTypes = ['c4-context', 'c4-container', 'sequence', 'deployment'] } = input;

    const diagrams = [];

    // Generate requested diagrams
    for (const type of diagramTypes) {
      switch (type) {
        case 'c4-context':
          diagrams.push(await this.generateC4Context(architecture, components));
          break;
        case 'c4-container':
          diagrams.push(await this.generateC4Container(architecture, components));
          break;
        case 'c4-component':
          diagrams.push(await this.generateC4Component(architecture, components));
          break;
        case 'sequence':
          diagrams.push(await this.generateSequenceDiagram(architecture, components));
          break;
        case 'deployment':
          diagrams.push(await this.generateDeploymentDiagram(architecture, components));
          break;
        case 'network':
          diagrams.push(await this.generateNetworkDiagram(architecture));
          break;
        case 'entity-relationship':
          diagrams.push(await this.generateERDiagram(architecture));
          break;
        case 'flowchart':
          diagrams.push(await this.generateFlowchart(architecture, components));
          break;
      }
    }

    const result = {
      executionId,
      diagrams,
      formats: {
        plantuml: diagrams.filter(d => d.format === 'plantuml').length,
        mermaid: diagrams.filter(d => d.format === 'mermaid').length
      },
      metadata: {
        totalDiagrams: diagrams.length,
        timestamp: new Date().toISOString()
      }
    };

    this.diagramCache.set(executionId, result);

    this.emit('diagrams-generated', {
      executionId,
      diagramCount: diagrams.length,
      types: diagrams.map(d => d.type)
    });

    return {
      success: true,
      executionId,
      diagrams,
      formats: result.formats,
      summary: {
        totalDiagrams: diagrams.length,
        types: diagrams.map(d => d.type)
      }
    };
  }

  async generateC4Context(architecture, components) {
    const plantuml = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

title System Context Diagram

Person(user, "User", "End user of the system")
${components.map((c, i) => `System(system${i}, "${c.name}", "${c.description || ''}")`).join('\n')}

${this.generateC4Relationships(components)}

@enduml`;

    const mermaid = `graph TB
    User[User]
    ${components.map((c, i) => `System${i}["${c.name}"]`).join('\n    ')}
    
    User --> System0
    ${components.map((c, i) => i > 0 ? `System0 --> System${i}` : '').filter(Boolean).join('\n    ')}`;

    return {
      type: 'c4-context',
      name: 'System Context Diagram',
      format: 'plantuml',
      content: plantuml,
      mermaidAlternative: mermaid,
      description: 'High-level system context showing users and external systems'
    };
  }

  async generateC4Container(architecture, components) {
    const containers = components.flatMap(c => c.containers || []);

    const plantuml = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

title Container Diagram

Person(user, "User", "System user")

System_Boundary(system, "Application") {
    ${containers.map((c, i) => 
      `Container(container${i}, "${c.name}", "${c.technology || 'Technology'}", "${c.description || ''}")`
    ).join('\n    ')}
}

Container_Ext(database, "Database", "Database", "Stores data")

Rel(user, container0, "Uses", "HTTPS")
${containers.map((c, i) => i > 0 ? `Rel(container0, container${i}, "Calls")` : '').filter(Boolean).join('\n')}
Rel(container${containers.length - 1}, database, "Reads/Writes", "SQL")

@enduml`;

    const mermaid = `graph TB
    User[User]
    ${containers.map((c, i) => `Container${i}["${c.name}<br/>${c.technology || ''}"]`).join('\n    ')}
    DB[(Database)]
    
    User -->|HTTPS| Container0
    ${containers.map((c, i) => i > 0 ? `Container0 --> Container${i}` : '').filter(Boolean).join('\n    ')}
    Container${containers.length - 1} -->|SQL| DB`;

    return {
      type: 'c4-container',
      name: 'Container Diagram',
      format: 'plantuml',
      content: plantuml,
      mermaidAlternative: mermaid,
      description: 'Shows containers (applications, services) within the system'
    };
  }

  async generateC4Component(architecture, components) {
    const plantuml = `@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

title Component Diagram

Container_Boundary(api, "API Application") {
    Component(controller, "API Controller", "REST", "Handles HTTP requests")
    Component(service, "Business Service", "Service", "Business logic")
    Component(repository, "Repository", "Data Access", "Data persistence")
}

ComponentDb(database, "Database", "Relational", "Data storage")

Rel(controller, service, "Uses")
Rel(service, repository, "Uses")
Rel(repository, database, "Reads/Writes")

@enduml`;

    const mermaid = `graph TB
    Controller[API Controller<br/>REST]
    Service[Business Service<br/>Logic]
    Repository[Repository<br/>Data Access]
    DB[(Database)]
    
    Controller --> Service
    Service --> Repository
    Repository --> DB`;

    return {
      type: 'c4-component',
      name: 'Component Diagram',
      format: 'plantuml',
      content: plantuml,
      mermaidAlternative: mermaid,
      description: 'Shows components within a container'
    };
  }

  async generateSequenceDiagram(architecture, components) {
    const plantuml = `@startuml
title User Authentication Flow

actor User
participant "Web App" as Web
participant "API Gateway" as API
participant "Auth Service" as Auth
database "User DB" as DB

User -> Web: Login Request
Web -> API: POST /auth/login
API -> Auth: Authenticate
Auth -> DB: Verify Credentials
DB --> Auth: User Data
Auth --> API: JWT Token
API --> Web: Token + User Info
Web --> User: Redirect to Dashboard

@enduml`;

    const mermaid = `sequenceDiagram
    actor User
    participant Web as Web App
    participant API as API Gateway
    participant Auth as Auth Service
    participant DB as User DB
    
    User->>Web: Login Request
    Web->>API: POST /auth/login
    API->>Auth: Authenticate
    Auth->>DB: Verify Credentials
    DB-->>Auth: User Data
    Auth-->>API: JWT Token
    API-->>Web: Token + User Info
    Web-->>User: Redirect to Dashboard`;

    return {
      type: 'sequence',
      name: 'Authentication Sequence Diagram',
      format: 'plantuml',
      content: plantuml,
      mermaidAlternative: mermaid,
      description: 'Shows interaction flow for user authentication'
    };
  }

  async generateDeploymentDiagram(architecture, components) {
    const cloudProvider = architecture.cloudProvider || 'AWS';

    const plantuml = `@startuml
!include <awslib/AWSCommon>
!include <awslib/Compute/EC2>
!include <awslib/Database/RDS>
!include <awslib/Storage/S3>
!include <awslib/NetworkingContentDelivery/CloudFront>

title Deployment Architecture - ${cloudProvider}

package "Production Environment" {
    CloudFront(cdn, "CloudFront", "CDN")
    
    package "Application Tier" {
        EC2(web1, "Web Server 1", "")
        EC2(web2, "Web Server 2", "")
    }
    
    package "Data Tier" {
        RDS(database, "RDS Database", "PostgreSQL")
        S3(storage, "S3 Storage", "Files")
    }
}

cdn --> web1
cdn --> web2
web1 --> database
web2 --> database
web1 --> storage
web2 --> storage

@enduml`;

    const mermaid = `graph TB
    subgraph Production
        CDN[CloudFront CDN]
        
        subgraph App[Application Tier]
            Web1[Web Server 1]
            Web2[Web Server 2]
        end
        
        subgraph Data[Data Tier]
            DB[(RDS Database)]
            S3[S3 Storage]
        end
    end
    
    CDN --> Web1
    CDN --> Web2
    Web1 --> DB
    Web2 --> DB
    Web1 --> S3
    Web2 --> S3`;

    return {
      type: 'deployment',
      name: 'Deployment Architecture Diagram',
      format: 'plantuml',
      content: plantuml,
      mermaidAlternative: mermaid,
      description: 'Shows physical deployment and infrastructure'
    };
  }

  async generateNetworkDiagram(architecture) {
    const plantuml = `@startuml
title Network Architecture

package "VPC 10.0.0.0/16" {
    package "Public Subnet 10.0.1.0/24" {
        node "Load Balancer" as LB
        node "NAT Gateway" as NAT
    }
    
    package "Private Subnet 10.0.2.0/24" {
        node "App Server 1" as App1
        node "App Server 2" as App2
    }
    
    package "Data Subnet 10.0.3.0/24" {
        database "RDS Primary" as DB1
        database "RDS Standby" as DB2
    }
}

cloud "Internet" as Internet

Internet --> LB
LB --> App1
LB --> App2
App1 --> DB1
App2 --> DB1
DB1 --> DB2 : Replication
App1 --> NAT
App2 --> NAT
NAT --> Internet

@enduml`;

    const mermaid = `graph TB
    Internet((Internet))
    
    subgraph VPC[VPC 10.0.0.0/16]
        subgraph Public[Public Subnet]
            LB[Load Balancer]
            NAT[NAT Gateway]
        end
        
        subgraph Private[Private Subnet]
            App1[App Server 1]
            App2[App Server 2]
        end
        
        subgraph Data[Data Subnet]
            DB1[(RDS Primary)]
            DB2[(RDS Standby)]
        end
    end
    
    Internet --> LB
    LB --> App1
    LB --> App2
    App1 --> DB1
    App2 --> DB1
    DB1 -.Replication.-> DB2
    App1 --> NAT
    App2 --> NAT
    NAT --> Internet`;

    return {
      type: 'network',
      name: 'Network Topology Diagram',
      format: 'plantuml',
      content: plantuml,
      mermaidAlternative: mermaid,
      description: 'Shows network architecture with VPC, subnets, and routing'
    };
  }

  async generateERDiagram(architecture) {
    const plantuml = `@startuml
title Entity Relationship Diagram

entity "User" as user {
    * id : UUID <<PK>>
    --
    * email : String
    * password_hash : String
    created_at : Timestamp
}

entity "Profile" as profile {
    * id : UUID <<PK>>
    * user_id : UUID <<FK>>
    --
    first_name : String
    last_name : String
    avatar_url : String
}

entity "Order" as order {
    * id : UUID <<PK>>
    * user_id : UUID <<FK>>
    --
    * total_amount : Decimal
    * status : String
    created_at : Timestamp
}

entity "OrderItem" as item {
    * id : UUID <<PK>>
    * order_id : UUID <<FK>>
    * product_id : UUID <<FK>>
    --
    quantity : Integer
    unit_price : Decimal
}

user ||--|| profile
user ||--o{ order
order ||--|{ item

@enduml`;

    const mermaid = `erDiagram
    User ||--|| Profile : has
    User ||--o{ Order : places
    Order ||--|{ OrderItem : contains
    
    User {
        UUID id PK
        String email
        String password_hash
        Timestamp created_at
    }
    
    Profile {
        UUID id PK
        UUID user_id FK
        String first_name
        String last_name
        String avatar_url
    }
    
    Order {
        UUID id PK
        UUID user_id FK
        Decimal total_amount
        String status
        Timestamp created_at
    }
    
    OrderItem {
        UUID id PK
        UUID order_id FK
        UUID product_id FK
        Integer quantity
        Decimal unit_price
    }`;

    return {
      type: 'entity-relationship',
      name: 'Entity Relationship Diagram',
      format: 'plantuml',
      content: plantuml,
      mermaidAlternative: mermaid,
      description: 'Shows database entity relationships'
    };
  }

  async generateFlowchart(architecture, components) {
    const plantuml = `@startuml
title User Registration Flow

start
:User visits registration page;
:Fill registration form;
:Submit form;

if (Valid input?) then (yes)
    :Create user account;
    :Send verification email;
    :Show success message;
    if (Email verified?) then (yes)
        :Activate account;
        :Redirect to dashboard;
    else (no)
        :Show pending verification;
    endif
else (no)
    :Show validation errors;
    :Return to form;
endif

stop
@enduml`;

    const mermaid = `flowchart TD
    Start([Start]) --> Visit[User visits registration page]
    Visit --> Fill[Fill registration form]
    Fill --> Submit[Submit form]
    Submit --> Valid{Valid input?}
    Valid -->|Yes| Create[Create user account]
    Valid -->|No| Error[Show validation errors]
    Create --> Email[Send verification email]
    Email --> Success[Show success message]
    Success --> Verified{Email verified?}
    Verified -->|Yes| Activate[Activate account]
    Verified -->|No| Pending[Show pending verification]
    Activate --> Dashboard[Redirect to dashboard]
    Error --> Fill
    Dashboard --> End([End])
    Pending --> End`;

    return {
      type: 'flowchart',
      name: 'User Registration Flowchart',
      format: 'plantuml',
      content: plantuml,
      mermaidAlternative: mermaid,
      description: 'Shows process flow for user registration'
    };
  }

  generateC4Relationships(components) {
    if (components.length < 2) return '';
    
    const relationships = [];
    for (let i = 0; i < components.length - 1; i++) {
      relationships.push(`Rel(system${i}, system${i + 1}, "Uses", "HTTPS")`);
    }
    return relationships.join('\n');
  }

  initializeTemplates() {
    return {
      c4Context: 'C4 Context template',
      c4Container: 'C4 Container template',
      sequence: 'Sequence diagram template',
      deployment: 'Deployment diagram template'
    };
  }

  getDiagrams(executionId) {
    return this.diagramCache.get(executionId);
  }

  listDiagrams() {
    return Array.from(this.diagramCache.values()).map(d => ({
      id: d.executionId,
      count: d.diagrams.length,
      types: d.diagrams.map(diag => diag.type)
    }));
  }

  async _onCleanup() {
    // Cleanup if needed
  }
}

export default DiagramGeneratorAgent;
