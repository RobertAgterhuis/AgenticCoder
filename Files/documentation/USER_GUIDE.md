# User Guide

**Version**: 2.0  
**Updated**: January 13, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Before You Start](#before-you-start)
3. [Running Your First Project](#running-your-first-project)
4. [Understanding the Output](#understanding-the-output)
5. [Customizing Your Project](#customizing-your-project)
6. [Deployment Guide](#deployment-guide)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

This guide walks you through using AgenticCoder to generate a complete project from start to finish.

### What You'll Get

AgenticCoder generates:
- ✅ Complete source code (frontend, backend, database)
- ✅ CI/CD pipelines (GitHub Actions or Azure DevOps)
- ✅ Infrastructure as Code (Terraform, Bicep, or CloudFormation)
- ✅ Docker configurations
- ✅ Database schemas and migrations
- ✅ API documentation
- ✅ Setup and deployment guides
- ✅ Development environment configuration

### What You Provide

- ✅ Project requirements (what you're building)
- ✅ Technology stack (frontend, backend, database)
- ✅ Deployment platform (Azure, AWS, on-premises)
- ✅ Team information (size, expertise)

---

## Before You Start

### Step 1: Define Your Project

Answer these questions:

**Project Definition**:
- [ ] What is your project called?
- [ ] What problem does it solve?
- [ ] Who are the users?
- [ ] What are the main features?

**Technology Stack**:
- [ ] Frontend framework: React / Vue / Angular / Svelte / None
- [ ] Backend framework: Node.js / Python / Go / Java / .NET / None
- [ ] Database: MySQL / PostgreSQL / None
- [ ] Additional services: Redis, Elasticsearch, etc.?

**Deployment**:
- [ ] Where to deploy: Azure / AWS / On-premises / Local
- [ ] CI/CD platform: GitHub Actions / Azure DevOps / Other
- [ ] Containerization: Docker / Kubernetes / None
- [ ] Environment strategy: Dev, Staging, Production

**Team & Timeline**:
- [ ] Team size and expertise levels
- [ ] Project timeline
- [ ] Budget constraints
- [ ] Compliance requirements (HIPAA, GDPR, etc.)

### Step 2: Choose Your Scenario

Compare your project against the available scenarios:

| Scenario | Description | Tech Stack | Best For |
|----------|-------------|-----------|----------|
| **S01** | Solo MVP | React + .NET + PostgreSQL + Azure | Small projects, Microsoft stack |
| **S02** | Startup | React + Node.js + MongoDB | Quick startups, JavaScript focus |
| **S03** | Medium SaaS | React + Node.js + PostgreSQL + AKS | Growing companies, Kubernetes |
| **S04** | Enterprise | Angular + Java + Oracle + Azure | Large organizations |
| **S05** | Healthcare | React + Node.js + PostgreSQL + HIPAA | Regulated industries |
| **S06** | Vue SPA | Vue + Python + MySQL | Python backends, Vue frontend |
| **S07** | Microservices | Angular + Go + PostgreSQL | Distributed systems |
| **S08** | Fullstack | Svelte + Java + MySQL | Modern frontend, Java backend |

**Custom Stacks**: Not seeing your exact stack? You can request a custom combination.

---

## Running Your First Project

### Step 1: Invoke @plan Agent

Start the project creation process by invoking the @plan agent:

```
Agent: @plan
Input: "I want to build [Project Name] with [Frontend] + [Backend] + [Database] on [Platform]"

Example:
"I want to build a Todo List application with React, Node.js, PostgreSQL, 
deployed on AWS with GitHub Actions. Team is 2 developers, timeline is 3 weeks."
```

### Step 2: Provide Detailed Requirements

@plan will ask clarifying questions:

```
@plan Questions:
1. What are the main features of your project?
2. Who are the primary users?
3. What are the critical success criteria?
4. Any compliance requirements (HIPAA, GDPR)?
5. How many database tables/entities?
6. Authentication method? (JWT, OAuth, Session-based)
7. Scaling requirements? (Single region, multi-region)
8. Budget constraints?
9. Timeline?
10. Team expertise level?
```

Provide detailed answers for best results.

### Step 3: Confirm Architecture Decisions

@plan will propose architecture:

```
Proposed Architecture:
Frontend: React 18.2 with Redux for state management
Backend: Node.js with Express framework
Database: PostgreSQL with Sequelize ORM
Platform: AWS EC2 with RDS
CI/CD: GitHub Actions
Containerization: Docker + Docker Compose

Confirmation: Proceed? (Yes/No/Modify)
```

Approve or request modifications.

### Step 4: Let the System Run

Once approved, AgenticCoder automatically:

1. **Phases 1-8** (Orchestration): Planning, documentation, architecture
2. **Phases 9-12** (Conditional): Cloud setup, database design
3. **Phases 13-15** (Implementation): Generate all code
4. **Phase 16** (Final): CI/CD pipeline and deployment setup

**Typical duration**: 9-11 hours

### Step 5: Review Outputs

AgenticCoder generates:

```
project-root/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   └── package.json
│
├── backend/                     # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── middleware/
│   └── package.json
│
├── database/                    # Database setup
│   ├── migrations/
│   ├── seeds/
│   └── schema.sql
│
├── infrastructure/              # IaC (if applicable)
│   ├── terraform/
│   │   └── *.tf
│   └── docker/
│       └── Dockerfile
│
├── .github/
│   └── workflows/               # CI/CD pipelines
│       ├── build.yml
│       ├── deploy-dev.yml
│       └── deploy-prod.yml
│
├── docs/                        # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
│
└── README.md                    # Project overview
```

---

## Understanding the Output

### Source Code Quality

Generated code includes:
- ✅ **Best practices** for your tech stack
- ✅ **Error handling** and logging
- ✅ **Security measures** (input validation, authentication)
- ✅ **Performance optimizations** (caching, indexing)
- ✅ **Code organization** (clear structure and patterns)
- ✅ **Comments** explaining complex logic
- ✅ **Unit tests** (examples and test structure)

### Documentation

Each project includes:
- **Setup Guide**: How to set up locally
- **API Documentation**: Endpoint descriptions, parameters, examples
- **Architecture Overview**: System design and decisions
- **Deployment Guide**: How to deploy to your platform
- **Development Guide**: How to add features
- **Database Schema**: Tables, relationships, constraints

### CI/CD Pipeline

Automated workflows for:
- **Build**: Compile and test on pull requests
- **Deploy to Dev**: Automatic deployment on merge to develop
- **Deploy to Prod**: Manual trigger deployment to production
- **Testing**: Unit tests, integration tests
- **Code Quality**: Linting, type checking
- **Security Scanning**: Dependency checks, code analysis

---

## Customizing Your Project

### Step 1: Understand the Generated Structure

Review the generated README and architecture documentation.

### Step 2: Set Up Locally

Follow the Setup Guide:

```bash
# Clone the repository
git clone <your-repo>
cd <your-project>

# Install dependencies
npm install (frontend and backend)
pip install -r requirements.txt (if Python backend)

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run migrate:dev
npm run seed:dev

# Run locally
npm run dev
```

### Step 3: Add Your Features

The generated code provides:
- **Component templates** (frontend)
- **Endpoint templates** (backend)
- **Database migration examples** (database)
- **Service layer** (business logic)
- **API client** (frontend → backend communication)

**Common customizations**:

```javascript
// Add new API endpoint
// 1. Create model in backend/src/models/
// 2. Create controller in backend/src/controllers/
// 3. Add route in backend/src/routes/
// 4. Add API client method in frontend/src/services/api.js
// 5. Create component in frontend/src/components/
// 6. Add tests for both
```

### Step 4: Test Locally

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Check code quality
npm run lint
npm run type-check
```

### Step 5: Deploy

Follow the Deployment Guide for your platform:
- **Azure**: See deployment guide
- **AWS**: See deployment guide
- **On-premises**: See deployment guide

---

## Deployment Guide

### Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables set correctly
- [ ] Database migrations tested
- [ ] API endpoints documented
- [ ] Security audit completed
- [ ] Performance tested under load
- [ ] Backup strategy documented
- [ ] Rollback plan documented

### Deployment Steps

#### Development Deployment

```bash
# Automatic on merge to 'develop' branch
git push origin develop
# → GitHub Actions automatically deploys to dev environment
```

#### Production Deployment

```bash
# Manual deployment to production
# 1. Create release branch
git checkout -b release/v1.0.0

# 2. Update version number
# 3. Update CHANGELOG
# 4. Create pull request to main

# 5. After review and merge:
git tag v1.0.0
git push origin main --tags
# → GitHub Actions automatically deploys to production
```

### Monitoring Post-Deployment

Check your deployment:

```bash
# View logs
npm run logs:prod

# Monitor health
curl https://your-app.com/health

# Check database
npm run db:validate:prod

# Monitor performance
# Visit your platform's monitoring dashboard
```

---

## Troubleshooting

### Common Issues

#### Issue: Build Fails

**Symptoms**: GitHub Actions workflow shows red X

**Solution**:
```bash
# 1. Check logs
# → Click workflow → Click failed job → View logs

# 2. Common causes:
# → Missing environment variable
# → Node version mismatch
# → Database connection issue
# → Port already in use

# 3. Fix locally first
npm install
npm test
npm run lint

# 4. Push fixed version
git push origin feature-branch
```

#### Issue: Database Connection Error

**Symptoms**: Backend can't connect to database

**Solution**:
```bash
# 1. Check connection string in .env
DATABASE_URL=postgresql://user:password@host:5432/dbname

# 2. Verify database is running
# → For local: docker ps
# → For cloud: check cloud provider dashboard

# 3. Check database credentials
# → Username
# → Password
# → Host
# → Port
# → Database name

# 4. Test connection
npm run db:validate
```

#### Issue: API Error from Frontend

**Symptoms**: Frontend shows "Failed to fetch"

**Solution**:
```bash
# 1. Check API is running
curl http://localhost:3001/api/health

# 2. Check CORS configuration
# → Backend should allow frontend origin
// In backend: cors({ origin: process.env.FRONTEND_URL })

# 3. Check network tab in browser DevTools
// → See actual error message
// → Check request/response headers

# 4. Check API documentation
// → Verify endpoint URL
// → Verify request format
// → Verify authentication headers
```

#### Issue: Deployment Fails

**Symptoms**: Pipeline fails during deployment

**Solution**:
```bash
# 1. Check deployment logs
// → Cloud provider dashboard
// → GitHub Actions logs

# 2. Common causes:
// → Insufficient permissions
// → Environment variables not set
// → Service not accessible
// → Port already in use

# 3. Verify credentials
# → Azure: az account show
# → AWS: aws sts get-caller-identity

# 4. Check platform resources
// → Cloud provider dashboard
// → Verify services running
// → Check scaling policies
```

### Debug Mode

Enable verbose logging:

```bash
# Frontend
export DEBUG=*
npm run dev

# Backend
export DEBUG=app:*
npm run dev:debug

# Database
export DEBUG=sequelize:*
npm test
```

### Getting Help

1. **Check [FAQ](FAQ.md)**
2. **Review [Troubleshooting Guide](#troubleshooting)**
3. **Check logs** in detail
4. **Search GitHub Issues**
5. **Open a new GitHub Issue** with:
   - Error message
   - Steps to reproduce
   - System info (Node version, OS, etc.)
   - Screenshots/logs

---

## Best Practices

### Code Organization

```
Organize code by feature:
✅ GOOD:
  src/features/
    ├── auth/
    │   ├── authApi.js
    │   ├── authSlice.js
    │   └── AuthLogin.jsx
    ├── todo/
    │   ├── todoApi.js
    │   ├── todoSlice.js
    │   └── TodoList.jsx

❌ BAD:
  src/
    ├── api/
    ├── components/
    ├── pages/
    (scattered and hard to maintain)
```

### Testing

```javascript
// Write tests as you add features
describe('TodoApi', () => {
  it('should fetch todos', async () => {
    const todos = await fetchTodos();
    expect(todos.length).toBeGreaterThan(0);
  });
});

// Run tests before committing
npm test
npm run test:coverage
```

### Environment Configuration

```bash
# Use environment variables for all configuration
# Good for secrets, URLs, keys, etc.

✅ GOOD:
DATABASE_URL=postgresql://...
API_KEY=secret123
NODE_ENV=production

❌ BAD:
// Hardcoding values in code
const dbUrl = "postgresql://...";
const apiKey = "secret123";
```

### Version Control

```bash
# Use conventional commits
✅ GOOD:
git commit -m "feat: add todo creation feature"
git commit -m "fix: correct database migration"
git commit -m "docs: update API documentation"

❌ BAD:
git commit -m "fixed stuff"
git commit -m "updates"
```

### Security

- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Use environment variables for secrets
- ✅ Implement proper authentication
- ✅ Validate all user inputs
- ✅ Use HTTPS in production
- ✅ Regular security audits
- ✅ Follow OWASP guidelines

### Performance

- ✅ Monitor bundle size (frontend)
- ✅ Optimize database queries
- ✅ Implement caching
- ✅ Use CDN for static assets
- ✅ Monitor API response times
- ✅ Load test before production

### Documentation

- ✅ Keep README updated
- ✅ Document API changes
- ✅ Explain complex logic
- ✅ Maintain changelog
- ✅ Update deployment guide
- ✅ Document environment variables

---

## Summary

You now know how to:
- ✅ Plan your project
- ✅ Run AgenticCoder
- ✅ Understand the generated code
- ✅ Customize for your needs
- ✅ Deploy to production
- ✅ Troubleshoot issues
- ✅ Follow best practices

**Next steps**:
1. Try a scenario from [Examples](examples/)
2. Read [Contributing Guide](CONTRIBUTING.md) if you want to help improve AgenticCoder
3. Check [FAQ](FAQ.md) for more questions

---

**Version**: 2.0  
**Last Updated**: January 13, 2026  
**Status**: Complete
