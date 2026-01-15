# S05 - High-Availability Setup

## Overview

- Complexity: Expert
- Estimated time: 120+ minutes
- Monthly cost target: ~$1200–1800 (example ~$1500)
- Focus: multi-region resilience, failover, DR automation

## Architecture

- Primary region (East US 2): App Service (3 instances), SQL primary, supporting services
- Secondary region (West US): App Service (2 instances), SQL replica, supporting services
- Cross-region: Traffic Manager with endpoint monitoring and automated failover
- Targets: RTO 5 minutes, RPO 1 minute

## Notes

This scenario is marked optional/nice-to-have for v1.0 in Plan-G.
