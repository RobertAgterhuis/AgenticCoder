# Azure Networking Patterns Skill

## Overview

This skill provides patterns and best practices for Azure networking including VNets, NSGs, Private Endpoints, and hub-spoke topologies.

---

## Hub-Spoke Topology

### Overview

```
         ┌─────────────┐
         │   On-Prem   │
         └──────┬──────┘
                │ VPN/ExpressRoute
         ┌──────┴──────┐
         │     Hub     │
         │  (Firewall) │
         └──────┬──────┘
       ┌────────┼────────┐
       │        │        │
  ┌────┴───┐ ┌──┴───┐ ┌──┴────┐
  │ Spoke1 │ │Spoke2│ │Spoke3 │
  │ (Prod) │ │ (Dev)│ │(Shared│
  └────────┘ └──────┘ └───────┘
```

### Bicep Hub-Spoke

```bicep
// Hub VNet
resource hubVnet 'Microsoft.Network/virtualNetworks@2023-06-01' = {
  name: 'hub-vnet'
  location: location
  properties: {
    addressSpace: { addressPrefixes: ['10.0.0.0/16'] }
    subnets: [
      {
        name: 'AzureFirewallSubnet'
        properties: { addressPrefix: '10.0.1.0/26' }
      }
      {
        name: 'GatewaySubnet'
        properties: { addressPrefix: '10.0.2.0/27' }
      }
    ]
  }
}

// Spoke VNet
resource spokeVnet 'Microsoft.Network/virtualNetworks@2023-06-01' = {
  name: 'spoke-prod-vnet'
  location: location
  properties: {
    addressSpace: { addressPrefixes: ['10.1.0.0/16'] }
    subnets: [
      {
        name: 'app-subnet'
        properties: {
          addressPrefix: '10.1.1.0/24'
          networkSecurityGroup: { id: appNsg.id }
          routeTable: { id: routeTable.id }
        }
      }
    ]
  }
}

// VNet Peering (Hub → Spoke)
resource hubToSpokePeering 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2023-06-01' = {
  parent: hubVnet
  name: 'hub-to-spoke-prod'
  properties: {
    remoteVirtualNetwork: { id: spokeVnet.id }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    allowGatewayTransit: true
  }
}
```

---

## NSG Rule Patterns

### Common Rules Reference

| Priority | Name | Direction | Source | Dest | Port | Action |
|----------|------|-----------|--------|------|------|--------|
| 100 | AllowHTTPS | Inbound | Internet | * | 443 | Allow |
| 200 | AllowHealthProbe | Inbound | AzureLoadBalancer | * | * | Allow |
| 300 | DenyAllInbound | Inbound | * | * | * | Deny |

### Application-Specific NSG

```bicep
resource webNsg 'Microsoft.Network/networkSecurityGroups@2023-06-01' = {
  name: 'web-nsg'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowAppGateway'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'GatewayManager'
          destinationPortRange: '65200-65535'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowHTTPS'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'Internet'
          destinationPortRange: '443'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          destinationPortRange: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}
```

---

## Private Endpoint Patterns

### Architecture

```
┌─────────────────────────────────────────┐
│                  VNet                    │
│  ┌──────────────┐   ┌─────────────────┐ │
│  │ App Subnet   │   │ PE Subnet       │ │
│  │              │   │ ┌─────────────┐ │ │
│  │  ┌───────┐   │   │ │ Private     │ │ │    ┌────────────┐
│  │  │ App   │───┼───┼─│ Endpoint    │─┼─┼───▶│ Storage    │
│  │  └───────┘   │   │ │ 10.1.2.5    │ │ │    │ (No public)│
│  └──────────────┘   │ └─────────────┘ │ │    └────────────┘
│                     └─────────────────┘ │
└─────────────────────────────────────────┘
```

### Storage Private Endpoint

```bicep
resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-06-01' = {
  name: 'pe-storage'
  location: location
  properties: {
    subnet: { id: subnet.id }
    privateLinkServiceConnections: [
      {
        name: 'storage-connection'
        properties: {
          privateLinkServiceId: storageAccount.id
          groupIds: ['blob']
        }
      }
    ]
  }
}

resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.blob.core.windows.net'
  location: 'global'
}

resource dnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: 'vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: { id: vnet.id }
  }
}

resource dnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-06-01' = {
  parent: privateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config'
        properties: { privateDnsZoneId: privateDnsZone.id }
      }
    ]
  }
}
```

---

## Private DNS Zones

| Service | DNS Zone |
|---------|----------|
| Blob Storage | `privatelink.blob.core.windows.net` |
| Key Vault | `privatelink.vaultcore.azure.net` |
| Cosmos DB | `privatelink.documents.azure.com` |
| SQL | `privatelink.database.windows.net` |
| App Config | `privatelink.azconfig.io` |
| Event Hub | `privatelink.servicebus.windows.net` |

---

## Service Endpoint vs Private Endpoint

| Feature | Service Endpoint | Private Endpoint |
|---------|-----------------|------------------|
| Network path | Microsoft backbone | Private VNet |
| IP address | Public service IP | Private IP in VNet |
| Cross-region | No | Yes |
| On-premises access | No | Yes (via VPN/ER) |
| Cost | Free | Per endpoint + data |
| DNS | No change | Private DNS zone |

**Recommendation:** Use Private Endpoints for production and sensitive workloads.

---

## Route Tables

### Force Tunneling to Firewall

```bicep
resource routeTable 'Microsoft.Network/routeTables@2023-06-01' = {
  name: 'spoke-rt'
  location: location
  properties: {
    disableBgpRoutePropagation: false
    routes: [
      {
        name: 'default-to-firewall'
        properties: {
          addressPrefix: '0.0.0.0/0'
          nextHopType: 'VirtualAppliance'
          nextHopIpAddress: firewallPrivateIp
        }
      }
      {
        name: 'to-onprem'
        properties: {
          addressPrefix: '192.168.0.0/16'
          nextHopType: 'VirtualAppliance'
          nextHopIpAddress: firewallPrivateIp
        }
      }
    ]
  }
}
```

---

## Azure Firewall Rules

```bicep
resource firewallPolicy 'Microsoft.Network/firewallPolicies@2023-06-01' = {
  name: 'hub-fw-policy'
  location: location
  properties: {
    sku: { tier: 'Standard' }
  }
}

resource appRuleCollection 'Microsoft.Network/firewallPolicies/ruleCollectionGroups@2023-06-01' = {
  parent: firewallPolicy
  name: 'app-rules'
  properties: {
    priority: 100
    ruleCollections: [
      {
        ruleCollectionType: 'FirewallPolicyFilterRuleCollection'
        name: 'allow-azure'
        priority: 100
        action: { type: 'Allow' }
        rules: [
          {
            ruleType: 'ApplicationRule'
            name: 'allow-microsoft'
            protocols: [{ protocolType: 'Https', port: 443 }]
            targetFqdns: ['*.microsoft.com', '*.azure.com']
            sourceAddresses: ['10.0.0.0/8']
          }
        ]
      }
    ]
  }
}
```

---

## IP Address Planning

| Environment | CIDR | Purpose |
|-------------|------|---------|
| Hub | 10.0.0.0/16 | Shared services |
| Prod | 10.1.0.0/16 | Production workloads |
| Dev | 10.2.0.0/16 | Development |
| Staging | 10.3.0.0/16 | Pre-production |
| Reserved | 10.4.0.0/16 - 10.255.0.0/16 | Future expansion |

---

## Subnet Sizing

| Subnet Type | Recommended Size | Notes |
|-------------|------------------|-------|
| AzureFirewallSubnet | /26 | Minimum required |
| GatewaySubnet | /27 | VPN/ER gateway |
| Application | /24 - /23 | Based on scale |
| Private Endpoints | /27 | 27 usable IPs |
| AKS | /21 - /16 | Plan for node scaling |

---

## Security Checklist

- [ ] All subnets have NSGs attached
- [ ] Default deny rule in NSGs
- [ ] Private Endpoints for PaaS services
- [ ] Route tables for spoke-to-hub traffic
- [ ] DDoS Protection Standard enabled
- [ ] Azure Firewall or NVA in hub
- [ ] Flow logs enabled for NSGs
- [ ] Network Watcher configured

---

## Related Agents

- @networking-specialist - Full implementation guidance
- @bicep-specialist - Infrastructure deployment
- @keyvault-specialist - Certificate management

---

## Tags

`networking` `vnet` `nsg` `private-endpoint` `hub-spoke` `azure-firewall` `security`
