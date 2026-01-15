# S03 - App Service + SQL Database

## Overview

- Complexity: Intermediate
- Estimated time: ~60 minutes
- Monthly cost target: ~$300–500 (example ~$420)
- Focus: data layer, private connectivity, backup/DR documentation

## Requirements summary

- App Service Plan: Standard S1 (2 instances)
- Azure SQL Database: Standard S1, ~20 GB
- Geo-replication enabled
- VNet integration
- Private endpoints for SQL
- Daily backups, 30-day retention
- Geo-redundant storage

## Key validations

- Connection string generated.
- SQL firewall/private endpoint configured.
- Backup retention policy set.
- RTO/RPO documented.
- Performance monitoring configured.
