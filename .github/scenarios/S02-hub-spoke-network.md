# S02 - Hub-Spoke Network

## Overview

- Complexity: Intermediate
- Estimated time: ~60 minutes
- Monthly cost target: ~$200–300 (example ~$280)
- Focus: networking, security controls, topology documentation

## Requirements summary

- Hub VNet: `10.0.0.0/16` (shared services)
- Spoke 1 VNet: `10.1.0.0/16` (web tier)
- Spoke 2 VNet: `10.2.0.0/16` (app tier)
- VNet peering between hub and spokes
- NSGs per subnet
- Azure Firewall in hub
- No direct internet access from spokes
- Bastion host for jump access
- VPN Gateway for on-prem connectivity
- Network Watcher + flow logs to storage

## Success criteria

- All 3 VNets created with correct CIDR.
- VNet peering configured and documented.
- NSGs created with sample rules.
- Azure Firewall provisioned.
- Security posture validated and documented.
