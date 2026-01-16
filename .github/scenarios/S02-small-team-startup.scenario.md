# Test Scenario S02: Small Team Startup

**Scenario ID**: `S02`  
**Name**: Small Team Startup - E-commerce Platform  
**Complexity**: Medium  
**Purpose**: Validate agent chain for small team with growth expectations

---

## Project Context

**Project Type**: E-commerce platform for artisan products  
**Team**: Small startup (5 people: 3 developers, 1 designer, 1 product owner)  
**Timeline**: 12-16 weeks (3-4 months)  
**Budget**: $500/month (growing to $1000/month)  
**Users**: 1K-10K users (launch → 6 months)  
**Revenue Model**: Transaction fees (2.5% per sale)

---

## Initial Request (Phase 0 Input)

```markdown
We're building an e-commerce marketplace for artisan products (handmade goods, crafts).

Key features:
- Vendor registration and storefronts
- Product listings with images, descriptions, pricing
- Shopping cart and checkout (Stripe integration)
- Order management for vendors and customers
- Search and filtering by category, price, location
- Review and rating system
- Admin dashboard for platform management

Team: 3 developers (2 full-stack, 1 frontend specialist), 1 designer, 1 product owner
Tech preferences: React, Node.js, PostgreSQL
Timeline: Launch in 3-4 months
Budget: Starting at $500/month, can scale to $1000/month
Expected growth: 1K users at launch, 10K within 6 months

Concerns:
- Payment security (PCI compliance)
- Image storage and optimization
- Search performance
- Mobile responsiveness
- Scalability for growth
```

---

## Expected Agent Flow

### Phase 0: @plan (Discovery)

**Context Phase**:
- Current development environment? → 3 developers, modern tooling
- Existing codebase? → No, greenfield project
- Team experience? → Full-stack (React/Node.js), 2-5 years each
- Timeline? → 12-16 weeks for launch

**Goals Phase**:
- Primary objective? → Launch marketplace with 50+ vendors
- Success metrics? → 1K users, 100 transactions/week, <500ms response
- Must-have features? → Vendor onboarding, product listings, checkout, search
- Nice-to-have? → Reviews, wishlists, email notifications, analytics

**Constraints Phase**:
- Budget? → $500/month initially, $1000/month post-launch
- Technology? → React, Node.js, PostgreSQL, Azure
- Payment processing? → Stripe (PCI compliant)
- Compliance? → PCI-DSS for payment data

**Validation Phase**:
- Confirm scope: 8 epics, 40-50 user stories
- Confirm timeline: 14 weeks realistic for team of 3 devs
- Confirm architecture: Modular monolith with separate frontend/backend

**Expected Output**:
```
ProjectPlan/
├── 01-Context/
│   ├── project-overview.md (E-commerce marketplace, 3-dev team, 14 weeks)
│   ├── stakeholders.md (team of 5, vendor partners)
│   ├── business-requirements.md (vendor management, product catalog, checkout, search)
│   └── tech-landscape.md (React/Node.js/PostgreSQL/Stripe/Azure)
├── 02-Architecture/
│   ├── system-architecture.md (modular monolith, API-first design)
│   ├── integration-points.md (Stripe, Azure Blob Storage, SendGrid)
│   └── scaling-strategy.md (horizontal scaling plan for 10K users)
└── 38+ files total
```

**Validation Criteria**:
- ✅ Scope includes payment integration (complex feature)
- ✅ Timeline accounts for team coordination (3 devs)
- ✅ Architecture supports growth (modular design)
- ✅ Security requirements identified (PCI-DSS)

---

### Phase 1: @doc (Documentation)

**Expected Output**:
```
ProjectPlan/03-Documentation/
├── architecture-narrative.md (4-tier: Frontend SPA → API → Services → Database)
├── api-specification.md (30+ REST endpoints)
│   # Vendor APIs
│   POST   /api/vendors/register
│   GET    /api/vendors/:id
│   PUT    /api/vendors/:id
│   
│   # Product APIs
│   GET    /api/products (with pagination, filtering)
│   POST   /api/products
│   PUT    /api/products/:id
│   DELETE /api/products/:id
│   
│   # Order APIs
│   POST   /api/orders
│   GET    /api/orders/:id
│   PUT    /api/orders/:id/status
│   
│   # Payment APIs
│   POST   /api/payments/create-intent (Stripe)
│   POST   /api/payments/webhook (Stripe webhook)
│   
│   # Search APIs
│   GET    /api/search?q=...&category=...&priceMin=...&priceMax=...
│
├── data-model.md (10 tables: users, vendors, products, orders, order_items, reviews, categories, images, payments, notifications)
├── integration-guide.md (Stripe integration, Azure Blob Storage, SendGrid)
├── security-guide.md (Authentication, authorization, PCI compliance, data encryption)
└── deployment-guide.md (Multi-environment: dev, staging, production)
```

**Validation Criteria**:
- ✅ API spec has 30-40 endpoints (medium complexity)
- ✅ Data model normalized (10-15 tables)
- ✅ Integration guides for external services (Stripe, Azure Blob)
- ✅ Security documentation comprehensive (PCI requirements)
- ✅ Scaling level: Small Team (more detail than Minimal)

---

### Phase 2: @backlog (Backlog Planning)

**Expected Output**:
```json
{
  "epics": [
    {
      "id": "E1",
      "title": "User & Vendor Management",
      "stories": 8,
      "total_points": 55,
      "priority": "Critical"
    },
    {
      "id": "E2",
      "title": "Product Catalog",
      "stories": 10,
      "total_points": 68,
      "priority": "Critical"
    },
    {
      "id": "E3",
      "title": "Shopping Cart & Checkout",
      "stories": 8,
      "total_points": 89,
      "priority": "Critical"
    },
    {
      "id": "E4",
      "title": "Payment Integration (Stripe)",
      "stories": 6,
      "total_points": 55,
      "priority": "Critical"
    },
    {
      "id": "E5",
      "title": "Order Management",
      "stories": 7,
      "total_points": 47,
      "priority": "High"
    },
    {
      "id": "E6",
      "title": "Search & Filtering",
      "stories": 5,
      "total_points": 42,
      "priority": "High"
    },
    {
      "id": "E7",
      "title": "Review & Rating System",
      "stories": 4,
      "total_points": 34,
      "priority": "Medium"
    },
    {
      "id": "E8",
      "title": "Admin Dashboard",
      "stories": 6,
      "total_points": 42,
      "priority": "Medium"
    }
  ],
  "total_stories": 54,
  "total_story_points": 432
}
```

**Sample Critical User Stories**:
```
US-012: Stripe Payment Integration (21 points)
As a customer, I want to pay securely with my credit card
so that I can complete my purchase

Acceptance Criteria:
- Stripe Payment Intent created on checkout
- 3D Secure authentication supported
- Payment captured on order confirmation
- Webhook handles payment.succeeded event
- PCI-compliant (no card data stored)
- Error handling for declined cards
- Receipt email sent on successful payment

Technical Notes:
- Use Stripe Elements for card input
- Store Stripe Customer ID in database
- Implement idempotency for payment requests
- Log all payment events for audit

US-021: Product Image Upload (13 points)
As a vendor, I want to upload product images
so that customers can see what I'm selling

Acceptance Criteria:
- Multi-file upload (up to 10 images per product)
- Image validation (JPG/PNG, max 5MB each)
- Automatic thumbnail generation (200x200, 400x400)
- Images stored in Azure Blob Storage
- CDN delivery for fast loading
- Image optimization (compression)

US-034: Product Search (13 points)
As a customer, I want to search for products by keyword, category, and price range
so that I can find what I'm looking for

Acceptance Criteria:
- Full-text search on product title and description
- Filter by category (dropdown)
- Filter by price range (slider)
- Filter by vendor location (map)
- Sort by: relevance, price (low/high), newest
- Pagination (24 products per page)
- Search results <500ms p95
```

**Validation Criteria**:
- ✅ 8 epics (comprehensive feature set)
- ✅ 50-60 user stories
- ✅ 400-500 story points (3-4 months for 3 developers)
- ✅ Critical path identified (user management → products → checkout → payment)
- ✅ Complex stories properly sized (Stripe integration = 21 points)

---

### Phase 3: @coordinator (Implementation Plan)

**Expected Output**:
```json
{
  "phases": [
    {
      "phase_number": 1,
      "name": "Foundation & Infrastructure",
      "duration_weeks": 2,
      "stories": ["US-001 to US-010"],
      "story_points": 89,
      "agents": ["@architect", "@code-architect", "@azure-architect", "@bicep-specialist"],
      "deliverables": ["Architecture decisions", "Code structure", "Azure resources", "CI/CD pipeline"]
    },
    {
      "phase_number": 2,
      "name": "User & Vendor Management",
      "duration_weeks": 3,
      "stories": ["US-011 to US-018"],
      "story_points": 55,
      "agents": ["@frontend-specialist", "@backend-specialist"],
      "deliverables": ["User registration/login", "Vendor onboarding", "Profile management"]
    },
    {
      "phase_number": 3,
      "name": "Product Catalog",
      "duration_weeks": 3,
      "stories": ["US-019 to US-028"],
      "story_points": 68,
      "agents": ["@frontend-specialist", "@backend-specialist"],
      "deliverables": ["Product CRUD", "Image upload", "Category management"]
    },
    {
      "phase_number": 4,
      "name": "Checkout & Payment",
      "duration_weeks": 3,
      "stories": ["US-029 to US-036"],
      "story_points": 89,
      "agents": ["@frontend-specialist", "@backend-specialist"],
      "deliverables": ["Shopping cart", "Checkout flow", "Stripe integration"]
    },
    {
      "phase_number": 5,
      "name": "Order Management & Search",
      "duration_weeks": 2,
      "stories": ["US-037 to US-043"],
      "story_points": 89,
      "agents": ["@frontend-specialist", "@backend-specialist"],
      "deliverables": ["Order tracking", "Vendor order management", "Product search"]
    },
    {
      "phase_number": 6,
      "name": "Reviews & Admin Dashboard",
      "duration_weeks": 2,
      "stories": ["US-044 to US-050"],
      "story_points": 76,
      "agents": ["@frontend-specialist", "@backend-specialist"],
      "deliverables": ["Review system", "Admin dashboard", "Analytics"]
    },
    {
      "phase_number": 7,
      "name": "Testing, Optimization & Launch",
      "duration_weeks": 1,
      "stories": ["US-051 to US-054"],
      "story_points": 34,
      "agents": ["@qa", "@devops-specialist", "@reporter"],
      "deliverables": ["Performance optimization", "Security audit", "Production deployment"]
    }
  ],
  "total_duration_weeks": 16,
  "estimated_delivery": "2026-05-05",
  "team_velocity": 90,
  "buffer_weeks": 2,
  "confidence": "Medium (3-dev team, complex integrations)"
}
```

**Team Velocity Calculation**:
```
3 developers × 30 points per developer per 2-week sprint = 90 points/sprint
16 weeks = 8 sprints
8 sprints × 90 points = 720 points capacity
Planned: 432 points (60% utilization - healthy buffer)
```

**Validation Criteria**:
- ✅ 7 phases (structured, milestone-based)
- ✅ 16 weeks total (matches 3-4 month requirement)
- ✅ Velocity realistic (90 points per 2 weeks for 3 devs)
- ✅ Critical path: Foundation → Users → Products → Checkout → Payment
- ✅ Parallel work identified (frontend + backend in phases 2-6)

---

### Phase 4: @qa (Quality & Validation Framework)

**Expected Output**:
```json
{
  "testing_strategies": [
    {
      "type": "Unit Testing",
      "coverage_target": 80,
      "tools": ["Jest", "React Testing Library", "Mocha"],
      "focus": "Business logic, payment processing, order calculations"
    },
    {
      "type": "Integration Testing",
      "coverage_target": 70,
      "tools": ["Supertest", "nock (for mocking Stripe)"],
      "focus": "API endpoints, Stripe webhooks, database transactions"
    },
    {
      "type": "E2E Testing",
      "coverage_target": 50,
      "tools": ["Playwright", "Stripe Test Mode"],
      "focus": "User registration, product creation, checkout flow, payment"
    },
    {
      "type": "Security Testing",
      "coverage_target": 100,
      "tools": ["OWASP ZAP", "npm audit", "Snyk"],
      "focus": "SQL injection, XSS, CSRF, payment security, PCI compliance"
    },
    {
      "type": "Performance Testing",
      "coverage_target": 100,
      "tools": ["k6", "Application Insights"],
      "focus": "API response times, search performance, image loading, concurrent users"
    }
  ],
  "quality_metrics": [
    {"name": "Code Coverage", "target": 80, "critical": true},
    {"name": "API Response Time", "target": "<500ms p95", "critical": true},
    {"name": "Search Performance", "target": "<300ms", "critical": true},
    {"name": "Payment Success Rate", "target": ">99%", "critical": true},
    {"name": "Availability", "target": "99.9%", "critical": true},
    {"name": "Security Vulnerabilities", "target": "0 critical", "critical": true},
    {"name": "Lighthouse Score", "target": ">90", "critical": false},
    {"name": "Bundle Size", "target": "<500KB", "critical": false}
  ],
  "validation_gates": [
    {
      "phase": "Development",
      "gate": "All unit tests pass + >80% coverage",
      "blocker": true
    },
    {
      "phase": "Staging",
      "gate": "E2E tests pass + Security scan clean + Performance <500ms",
      "blocker": true
    },
    {
      "phase": "Pre-production",
      "gate": "PCI compliance verified + Stripe test transactions successful",
      "blocker": true
    },
    {
      "phase": "Production",
      "gate": "Zero critical bugs + Payment success rate >99%",
      "blocker": true
    }
  ],
  "pci_compliance_checklist": [
    "✓ No card data stored in database (use Stripe Customer IDs)",
    "✓ All payment pages use HTTPS (SSL certificate)",
    "✓ Stripe Elements for card input (PCI-compliant iframe)",
    "✓ Webhook signature validation (stripe.webhooks.constructEvent)",
    "✓ Payment logs exclude sensitive data",
    "✓ Access control: only authorized users can process refunds"
  ]
}
```

**Validation Criteria**:
- ✅ 5 testing strategies (including security for payment handling)
- ✅ PCI compliance checklist present
- ✅ Performance targets defined (<500ms API, <300ms search)
- ✅ Security testing mandatory (100% coverage)
- ✅ Validation gates block deployment if critical issues exist

---

### Phase 6: @architect (Architecture Design)

**Expected Output**:
```json
{
  "architecture_style": "Modular Monolith",
  "architecture_decisions": [
    {
      "id": "ADR-001",
      "title": "Use Modular Monolith Architecture",
      "context": "3-dev team, 10K users, need to scale gradually",
      "decision": "Single codebase with clear module boundaries (user, vendor, product, order, payment)",
      "rationale": "Easier to develop/deploy than microservices, but better organized than pure monolith. Can extract modules to services later if needed.",
      "consequences": {
        "positive": ["Faster development", "Easier testing", "Single deployment"],
        "negative": ["Module boundaries require discipline", "Eventually may need to split"]
      }
    },
    {
      "id": "ADR-002",
      "title": "Use PostgreSQL with Full-Text Search",
      "decision": "PostgreSQL 15 with tsvector for product search",
      "alternatives": ["Elasticsearch (rejected: adds complexity + cost)", "Azure Cognitive Search (rejected: cost)"],
      "rationale": "PostgreSQL full-text search handles 10K users, free, no additional infrastructure"
    },
    {
      "id": "ADR-003",
      "title": "Use Azure Blob Storage for Images",
      "decision": "Azure Blob Storage + Azure CDN for image delivery",
      "rationale": "Cost-effective ($0.02/GB storage, $0.08/GB bandwidth), integrated CDN, 99.9% SLA",
      "cost_comparison": "Azure Blob ($50/month for 10K products) vs S3 ($80/month)"
    },
    {
      "id": "ADR-004",
      "title": "Use Stripe for Payment Processing",
      "decision": "Stripe Checkout + Payment Intents API",
      "rationale": "PCI-compliant, 2.9% + $0.30 per transaction (industry standard), excellent docs, test mode",
      "security": "No card data touches our servers (Stripe Elements + tokenization)"
    },
    {
      "id": "ADR-005",
      "title": "Use Redis for Session Storage and Caching",
      "decision": "Azure Cache for Redis (Basic tier, 250MB)",
      "rationale": "Session storage (JWT blacklist), product catalog caching, search result caching",
      "performance_impact": "Cache hit ratio 80% → reduces DB load by 60%"
    },
    {
      "id": "ADR-006",
      "title": "Deploy to Azure App Service (Standard Tier)",
      "decision": "Standard S1 tier (100 ACU, 1.75GB RAM, auto-scaling)",
      "rationale": "Supports custom domain, SSL, auto-scaling to 10 instances, ~$70/month",
      "scaling": "Start with 1 instance, auto-scale at 70% CPU to handle traffic spikes"
    }
  ],
  "technology_choices": {
    "frontend": "React 18 + TypeScript + Vite + Tailwind CSS + Zustand",
    "backend": "Node.js 20 + Express + TypeScript + Prisma ORM",
    "database": "PostgreSQL 15 (Azure Database for PostgreSQL Flexible Server)",
    "cache": "Redis 7 (Azure Cache for Redis)",
    "storage": "Azure Blob Storage + CDN",
    "payment": "Stripe API (Payment Intents + Webhooks)",
    "email": "SendGrid (free tier: 100 emails/day)",
    "monitoring": "Application Insights + Azure Monitor"
  },
  "deployment_target": "Azure",
  "estimated_monthly_cost": "$480 ($70 App Service + $120 PostgreSQL + $50 Blob Storage + $40 Redis + $100 CDN + $100 misc)"
}
```

**System Diagram**:
```
Internet
   │
   ↓
Azure Front Door + CDN
   │
   ├─→ Static Assets (images from Blob Storage)
   │
   ↓
App Service (Standard S1)
   │
   ├─→ Redis Cache (session + product catalog)
   ├─→ PostgreSQL (primary data)
   ├─→ Blob Storage (product images)
   ├─→ Stripe API (payment processing)
   └─→ SendGrid API (transactional emails)
   │
   ↓
Application Insights (monitoring)
```

**Validation Criteria**:
- ✅ Architecture = Modular Monolith (appropriate for 3-dev team scaling to 10K users)
- ✅ 6+ ADRs with cost comparisons
- ✅ Technology choices support scale (Redis caching, CDN, auto-scaling)
- ✅ Cost estimate within budget ($480 < $500 initial, can scale to $1000)
- ✅ Security prioritized (Stripe for PCI compliance, no card data stored)

---

### Phase 7: @code-architect (Code Structure)

**Expected Output**:
```
ecommerce-marketplace/
├── frontend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           (login, register)
│   │   │   ├── vendor/         (vendor dashboard, store settings)
│   │   │   ├── products/       (product list, detail, create/edit)
│   │   │   ├── cart/           (shopping cart, checkout)
│   │   │   ├── orders/         (order history, tracking)
│   │   │   └── admin/          (admin dashboard)
│   │   ├── shared/
│   │   │   ├── components/     (Button, Card, Modal, Dropdown)
│   │   │   ├── hooks/          (useAuth, useCart, useProducts)
│   │   │   ├── services/       (api.ts, stripe.ts)
│   │   │   └── stores/         (auth.store.ts, cart.store.ts - Zustand)
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.repository.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── vendors/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── payments/
│   │   │       ├── stripe.service.ts
│   │   │       ├── webhook.controller.ts
│   │   │       └── payment.repository.ts
│   │   ├── shared/
│   │   │   ├── middleware/     (auth, error, validation, rate-limit)
│   │   │   ├── utils/          (logger, encryption, email)
│   │   │   └── config/         (database, redis, stripe, azure)
│   │   ├── prisma/
│   │   │   └── schema.prisma   (10 models: User, Vendor, Product, Order, etc.)
│   │   └── server.ts
│   └── package.json
└── infrastructure/
    ├── bicep/
    │   ├── main.bicep
    │   └── modules/
    └── .github/workflows/
```

**Design Patterns**:
1. **Module Pattern**: Each domain (auth, vendors, products) is self-contained
2. **Repository Pattern**: Data access abstraction (Prisma repositories)
3. **Service Layer**: Business logic isolation
4. **Dependency Injection**: Services injected via constructor
5. **Factory Pattern**: Stripe payment intent creation
6. **Observer Pattern**: Webhook event handlers (payment.succeeded → send email)

**Validation Criteria**:
- ✅ Modular structure (auth, vendors, products, orders, payments modules)
- ✅ 5+ design patterns applied
- ✅ 30+ API endpoints defined
- ✅ Clear separation: controllers → services → repositories
- ✅ Shared utilities extracted (middleware, config, utils)

---

### Phase 8-9: @azure-architect + @bicep-specialist

**Azure Resources** (6 resources):
1. App Service Plan (Standard S1)
2. App Service (Node.js 20)
3. PostgreSQL Flexible Server (Burstable B2s, 2 vCores, 4GB RAM)
4. Azure Cache for Redis (Basic C0, 250MB)
5. Storage Account (Blob Storage for images)
6. Application Insights (monitoring)

**Cost Breakdown**:
- App Service: $70/month
- PostgreSQL: $120/month
- Redis: $40/month
- Blob Storage: $50/month (10K products × 5 images each)
- CDN: $100/month (bandwidth)
- Application Insights: Free tier (5GB/month)
- **Total**: $380/month (within $500 budget, $120 buffer for growth)

**Validation Criteria**:
- ✅ 6 Azure resources (appropriate complexity)
- ✅ Standard tier (supports auto-scaling)
- ✅ Cost within budget ($380 < $500)
- ✅ Monitoring included (Application Insights)
- ✅ Multi-environment parameters (dev, staging, prod)

---

### Phase 10-11: @frontend-specialist + @backend-specialist

**Frontend Output**:
- 40+ components (20 shared, 20 feature-specific)
- 12 pages (Home, Products, Product Detail, Cart, Checkout, Orders, Vendor Dashboard, Admin)
- Routing with React Router (public + protected routes)
- State management with Zustand (auth, cart, products)
- Stripe Elements integration (card input)
- Image upload with preview and compression

**Generated Backend Code Sample** (Payment Processing Service):
```typescript
// backend/src/services/payments.service.ts
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();

export class PaymentService {
  // Create payment intent for checkout
  async createPaymentIntent(orderId: string, amount: number, vendorId: string) {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId,
        vendorId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return { clientSecret: intent.client_secret };
  }

  // Handle Stripe webhook
  async handlePaymentWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { orderId, vendorId } = paymentIntent.metadata as any;
        
        // Update order status
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PAID',
            stripePaymentIntentId: paymentIntent.id,
            paidAt: new Date(),
          },
        });
        
        // Notify vendor of payment
        await this.notifyVendor(vendorId, orderId, 'Payment received');
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { orderId } = paymentIntent.metadata as any;
        
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'PAYMENT_FAILED' },
        });
        break;
      }
    }
  }

  private async notifyVendor(vendorId: string, orderId: string, message: string) {
    // SendGrid email integration
    console.log(`Notifying vendor ${vendorId} about order ${orderId}: ${message}`);
  }
}
```

**Generated API Endpoint** (Checkout Flow):
```typescript
// backend/src/routes/payments.routes.ts
import express from 'express';
import { PaymentService } from '../services/payments.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const paymentService = new PaymentService();

// POST /api/payments/create-intent - Create Stripe payment intent
router.post('/create-intent', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Get order and calculate total
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const total = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Create payment intent
    const { clientSecret } = await paymentService.createPaymentIntent(
      orderId,
      total,
      order.vendorId
    );
    
    res.json({ clientSecret });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// POST /api/payments/webhook - Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    await paymentService.handlePaymentWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export default router;
```

**Generated Frontend Code Sample** (Stripe Checkout):
```typescript
// frontend/src/pages/CheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [orderId, setOrderId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const { data: { clientSecret } } = await api.post('/payments/create-intent', {
        orderId,
      });

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name: 'Customer' },
        },
      });

      if (result.paymentIntent?.status === 'succeeded') {
        // Payment successful - redirect to order confirmation
        window.location.href = `/orders/${orderId}/confirmation`;
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div className="text-red-500">{error}</div>}
      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full bg-blue-500 text-white py-2 rounded disabled:bg-gray-400"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
```

**Generated Database Schema**:
```sql
-- E-commerce marketplace schema
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  store_name VARCHAR(255) NOT NULL,
  description TEXT,
  stripe_account_id VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  image_url VARCHAR(500),
  search_vector tsvector,  -- For PostgreSQL full-text search
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  status VARCHAR(50) DEFAULT 'PENDING',
  total DECIMAL(10, 2) NOT NULL,
  stripePaymentIntentId VARCHAR(255),
  paidAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_search ON products USING GIN(search_vector);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
```

**Validation Criteria**:
- ✅ 40+ frontend components
- ✅ 12+ pages
- ✅ Stripe integration complete (Payment Intents API)
- ✅ 8+ services, 8+ repositories (Prisma ORM)
- ✅ 35+ API endpoints (CRUD + webhooks)
- ✅ Payment webhook handling secure (signature verification)
- ✅ Image upload working (Azure Blob Storage)
- ✅ Full-text search implemented (PostgreSQL tsvector)

---

### Phase 12: @devops-specialist

**CI/CD Pipeline**:
```yaml
# .github/workflows/deploy-production.yml
name: Deploy E-commerce Marketplace

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run backend unit tests
        run: cd backend && npm ci && npm run test:unit
      
      - name: Run backend integration tests
        run: cd backend && npm run test:integration
      
      - name: Run frontend tests
        run: cd frontend && npm ci && npm run test
      
      - name: Security scan - npm audit
        run: npm audit --audit-level=moderate
      
      - name: Security scan - Snyk
        run: npx snyk test --severity-threshold=high

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build frontend
        run: cd frontend && npm ci && npm run build
      
      - name: Build backend
        run: cd backend && npm ci && npm run build
      
      - name: Check TypeScript types
        run: cd backend && npm run type-check

  deploy-infrastructure:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Bicep infrastructure
        run: |
          az deployment group create \
            --resource-group rg-marketplace \
            --template-file infrastructure/main.bicep \
            --parameters environment=production

  deploy-application:
    needs: deploy-infrastructure
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy backend to App Service
        uses: azure/webapps-deploy@v2
        with:
          app-name: marketplace-api-prod
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
      
      - name: Deploy frontend to Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: upload
          app_location: frontend/dist
      
      - name: Run Prisma migrations
        run: |
          cd backend
          npx prisma migrate deploy

  smoke-tests:
    needs: deploy-application
    runs-on: ubuntu-latest
    steps:
      - name: Health check API
        run: curl https://marketplace-api-prod.azurewebsites.net/api/health
      
      - name: Test Stripe connectivity
        run: npm run test:stripe-connection
      
      - name: Test database connectivity
        run: npm run test:db-health
      
      - name: Test Redis connectivity
        run: npm run test:redis-health
```

**Generated Bicep Infrastructure** (Multi-resource deployment):
```bicep
// infrastructure/main.bicep
param location string = 'eastus'
param environment string = 'prod'
param appName string = 'marketplace'

// App Service Plan (Standard S1 - 100 ACU, $70/month)
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: '${appName}-plan-${environment}'
  location: location
  kind: 'linux'
  properties: {
    reserved: true
  }
  sku: {
    name: 'S1'
    tier: 'Standard'
    capacity: 2  // Start with 2 instances for HA
  }
}

// App Service for backend
resource appService 'Microsoft.Web/sites@2021-02-01' = {
  name: '${appName}-api-${environment}'
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appSettings: [
        { name: 'DATABASE_URL', value: databaseUrl }
        { name: 'STRIPE_SECRET_KEY', value: stripeSecretKey }
        { name: 'STRIPE_WEBHOOK_SECRET', value: stripeWebhookSecret }
        { name: 'REDIS_CONNECTION_STRING', value: redisConnectionString }
        { name: 'AZURE_STORAGE_CONNECTION_STRING', value: storageConnectionString }
      ]
      alwaysOn: true
      minTlsVersion: '1.2'
    }
  }
}

// PostgreSQL Flexible Server (Standard B1ms - $120/month)
resource postgresqlServer 'Microsoft.DBforPostgreSQL/flexibleServers@2021-06-01' = {
  name: '${appName}-db-${environment}'
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: 'psqladmin'
    administratorLoginPassword: pgPassword
    storage: { storageSizeGB: 128 }
    backup: {
      backupRetentionDays: 30
      geoRedundantBackup: 'Enabled'
    }
  }
}

// Redis Cache (Basic 250MB - $40/month)
resource redis 'Microsoft.Cache/redis@2021-06-01' = {
  name: '${appName}-redis-${environment}'
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

// Blob Storage for product images
resource storageAccount 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: '${appName}storage${environment}'
  location: location
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
}

// CDN for image delivery
resource cdnProfile 'Microsoft.Cdn/profiles@2021-06-01' = {
  name: '${appName}-cdn-${environment}'
  location: location
  sku: { name: 'Standard_Microsoft' }
}

// Output connection strings
output apiUrl string = 'https://${appService.properties.defaultHostName}'
output databaseHost string = postgresqlServer.properties.fullyQualifiedDomainName
output redisHost string = redis.properties.hostName
output storageEndpoint string = storageAccount.properties.primaryEndpoints.blob
```

**Monitoring Setup**:
```typescript
// Application Insights configuration
import appInsights from 'applicationinsights';

appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATION_KEY!)
  .setAutoCollectConsoleAppenders(true)
  .setAutoCollectDependencies(true)
  .start();

const client = appInsights.defaultClient;

// Custom metrics for marketplace
app.post('/api/orders', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const order = await createOrder(req.body);
    
    client.trackEvent({
      name: 'OrderCreated',
      properties: {
        vendorId: order.vendorId,
        amount: order.total,
        itemCount: order.items.length,
      },
      measurements: {
        duration: Date.now() - startTime,
      },
    });
    
    res.status(201).json(order);
  } catch (error) {
    client.trackException({ exception: error as Error });
    res.status(500).json({ error: 'Order creation failed' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      database: 'connected',
      redis: 'connected',
      stripe: 'connected',
    },
  });
});
```

**Alerts Configuration**:
```json
{
  "alerts": [
    {
      "name": "High API Error Rate",
      "condition": "Error rate > 5%",
      "severity": "Critical",
      "action": "Page on-call engineer"
    },
    {
      "name": "Slow Payment Processing",
      "condition": "Payment API p95 > 2 seconds",
      "severity": "High",
      "action": "Notify DevOps team"
    },
    {
      "name": "Database Connection Pool Exhausted",
      "condition": "Available connections < 10%",
      "severity": "Critical",
      "action": "Auto-scale App Service"
    },
    {
      "name": "Stripe Webhook Failures",
      "condition": "Webhook error rate > 1%",
      "severity": "High",
      "action": "Alert payments team"
    }
  ]
}
```

**Monitoring**:
- Application Insights: Request tracking, exception logging, custom metrics
- Custom metrics: Payment success rate, order conversion rate, checkout abandonment
- Alerts: High error rate (>5%), slow API (>1s), database connection exhaustion, Redis evictions
- Log Analytics: Centralized logging, query history, performance analysis
- Auto-scaling: App Service scales 1-10 instances based on CPU (70%) and request count (10K/min)

**Validation Criteria**:
- ✅ 3+ CI/CD pipelines (test, build, deploy-staging, deploy-production)
- ✅ Automated testing in pipeline (unit, integration, security)
- ✅ Infrastructure deployment fully automated (Bicep)
- ✅ Database migrations automated (Prisma)
- ✅ Monitoring configured (Application Insights + custom metrics)
- ✅ Alerts configured (error rate, performance, payment processing)
- ✅ Auto-scaling configured (1-10 instances)
- ✅ Deployment time: <15 minutes (zero-downtime)
- ✅ Rollback capability available

---

## Success Criteria

**Overall Validation**:
- ✅ All 13 agents executed
- ✅ Total timeline: 16 weeks (within 3-4 month requirement)
- ✅ Total cost: $380/month (within $500 budget)
- ✅ Scope: 54 user stories, 432 story points
- ✅ Team velocity: 90 points per 2-week sprint (realistic for 3 devs)
- ✅ Architecture: Modular monolith (scalable to 10K users)
- ✅ Payment integration: Stripe (PCI-compliant)
- ✅ Performance: <500ms API response, <300ms search

**Deliverables**:
1. ProjectPlan (38+ files)
2. Backlog (54 stories, 8 epics)
3. Implementation plan (7 phases, 16 weeks)
4. Architecture decisions (6 ADRs)
5. Code structure (modular backend + frontend)
6. Infrastructure code (6 Azure resources)
7. Payment integration (Stripe)
8. CI/CD pipeline (multi-environment)
9. Monitoring (Application Insights)
10. Deployed marketplace application

**Quality Gates**:
- 80% unit test coverage
- <500ms p95 API response
- <300ms search performance
- >99% payment success rate
- 99.9% availability
- PCI compliance verified
- 0 critical security vulnerabilities

---

## Filename: `S02-small-team-startup.scenario.md`
