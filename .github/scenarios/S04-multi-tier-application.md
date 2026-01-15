# S04 - Multi-Tier Application

## Overview

- Complexity: Advanced
- Estimated time: ~90 minutes
- Monthly cost target: ~$600–900 (example ~$750)
- Focus: full architecture, load balancing, autoscaling, encryption

## Architecture

Internet → Application Gateway → Web Tier (2x App Service) → App Tier (2x App Service) → Data Tier (SQL primary + replica)

## Key validations

- Load balancer routes traffic correctly.
- Auto-scaling rules configured.
- Database replication configured.
- SSL/TLS certificates valid.
- End-to-end encryption configured.
