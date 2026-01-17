# @networking-specialist Agent

**Agent ID**: `@networking-specialist`  
**Version**: 1.0.0  
**Phase**: 15  
**Classification**: Azure Networking Specialist

---

## 🎯 Purpose

Design and implement secure, scalable network architectures using Azure Virtual Networks, Network Security Groups, Private Endpoints, and hub-spoke topologies with focus on zero-trust principles and hybrid connectivity.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | Cloud Networking & Security |
| **Primary Technology** | Azure Networking Services |
| **Input Schema** | `networking-specialist.input.schema.json` |
| **Output Schema** | `networking-specialist.output.schema.json` |
| **Triggers From** | @azure-architect, @security-specialist |
| **Hands Off To** | @bicep-specialist, @monitoring-specialist |

---

## 🔧 Core Responsibilities

### 1. Network Architecture Patterns

#### Hub-Spoke Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                    Hub-Spoke Network Topology                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        ┌───────────────┐                        │
│                        │   On-Premises │                        │
│                        └───────┬───────┘                        │
│                                │                                │
│                     VPN Gateway / ExpressRoute                  │
│                                │                                │
│                        ┌───────▼───────┐                        │
│                        │     HUB       │                        │
│                        │    VNet       │                        │
│                        │  10.0.0.0/16  │                        │
│                        │               │                        │
│                        │ ┌───────────┐ │                        │
│                        │ │  Firewall │ │                        │
│                        │ │   NVA     │ │                        │
│                        │ └───────────┘ │                        │
│                        │               │                        │
│                        │ ┌───────────┐ │                        │
│                        │ │  Bastion  │ │                        │
│                        │ └───────────┘ │                        │
│                        └───────┬───────┘                        │
│                                │                                │
│               VNet Peering ────┼──── VNet Peering              │
│                    │           │           │                    │
│            ┌───────▼───────┐   │   ┌───────▼───────┐           │
│            │  SPOKE 1      │   │   │  SPOKE 2      │           │
│            │  Production   │   │   │  Development  │           │
│            │ 10.1.0.0/16   │   │   │ 10.2.0.0/16   │           │
│            │               │   │   │               │           │
│            │ ┌───────────┐ │   │   │ ┌───────────┐ │           │
│            │ │ App GW    │ │   │   │ │ App GW    │ │           │
│            │ └───────────┘ │   │   │ └───────────┘ │           │
│            │               │   │   │               │           │
│            │ ┌───────────┐ │   │   │ ┌───────────┐ │           │
│            │ │ App Subnet│ │   │   │ │ App Subnet│ │           │
│            │ │ 10.1.1/24 │ │   │   │ │ 10.2.1/24 │ │           │
│            │ └───────────┘ │   │   │ └───────────┘ │           │
│            │               │   │   │               │           │
│            │ ┌───────────┐ │   │   │ ┌───────────┐ │           │
│            │ │ Data Sbnt │ │   │   │ │ Data Sbnt │ │           │
│            │ │ 10.1.2/24 │ │   │   │ │ 10.2.2/24 │ │           │
│            │ └───────────┘ │   │   │ └───────────┘ │           │
│            └───────────────┘   │   └───────────────┘           │
│                                │                                │
│                        ┌───────▼───────┐                        │
│                        │  SPOKE 3      │                        │
│                        │  Shared Svcs  │                        │
│                        │ 10.3.0.0/16   │                        │
│                        │               │                        │
│                        │ ┌───────────┐ │                        │
│                        │ │ DNS/AD    │ │                        │
│                        │ └───────────┘ │                        │
│                        └───────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Network Security Groups (NSGs)

```
┌─────────────────────────────────────────────────────────────────┐
│                     NSG Rule Priorities                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  100-200:   Allow rules for specific applications               │
│  200-1000:  Allow rules for general services                    │
│  1000-2000: Deny rules for specific blocked traffic             │
│  2000-4096: Reserved for default rules                          │
│                                                                  │
│  Rule Types:                                                    │
│  ✅ Inbound - Controls traffic entering subnet                  │
│  ✅ Outbound - Controls traffic leaving subnet                  │
│                                                                  │
│  Best Practices:                                                │
│  ✅ Use service tags instead of IPs (AzureCloud, Internet)     │
│  ✅ Use Application Security Groups for role-based rules       │
│  ✅ Log denied flows with Flow Logs                            │
│  ✅ Start restrictive, open as needed                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Private Endpoints Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Private Endpoint Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     Private IP      ┌──────────────────────┐ │
│  │              │    10.1.2.5         │                      │ │
│  │  App Service │◄───────────────────►│  Storage Account     │ │
│  │  (In VNet)   │                     │  (Private Endpoint)  │ │
│  │              │                     │                      │ │
│  └──────────────┘                     └──────────────────────┘ │
│                                                                  │
│  Benefits:                                                      │
│  ✅ No public internet exposure                                 │
│  ✅ Traffic stays on Microsoft backbone                        │
│  ✅ DNS resolution to private IP                               │
│  ✅ Network policy (NSG) support                               │
│                                                                  │
│  Private DNS Zones:                                             │
│  • privatelink.blob.core.windows.net                           │
│  • privatelink.database.windows.net                            │
│  • privatelink.vaultcore.azure.net                             │
│  • privatelink.documents.azure.com                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Bicep Templates

#### Hub VNet with Firewall

```bicep
@description('Hub VNet address prefix')
param hubAddressPrefix string = '10.0.0.0/16'

@description('Location')
param location string = resourceGroup().location

@description('Environment')
param environment string = 'production'

// Hub Virtual Network
resource hubVnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: 'vnet-hub-${environment}'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [hubAddressPrefix]
    }
    subnets: [
      {
        name: 'AzureFirewallSubnet' // Required name
        properties: {
          addressPrefix: cidrSubnet(hubAddressPrefix, 24, 0) // 10.0.0.0/24
        }
      }
      {
        name: 'AzureBastionSubnet' // Required name
        properties: {
          addressPrefix: cidrSubnet(hubAddressPrefix, 24, 1) // 10.0.1.0/24
        }
      }
      {
        name: 'GatewaySubnet' // Required name
        properties: {
          addressPrefix: cidrSubnet(hubAddressPrefix, 24, 2) // 10.0.2.0/24
        }
      }
      {
        name: 'snet-management'
        properties: {
          addressPrefix: cidrSubnet(hubAddressPrefix, 24, 3) // 10.0.3.0/24
          networkSecurityGroup: {
            id: nsgManagement.id
          }
        }
      }
    ]
  }
}

// Azure Firewall
resource firewallPublicIP 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: 'pip-fw-${environment}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

resource firewall 'Microsoft.Network/azureFirewalls@2023-05-01' = {
  name: 'fw-hub-${environment}'
  location: location
  properties: {
    sku: {
      name: 'AZFW_VNet'
      tier: 'Standard'
    }
    threatIntelMode: 'Deny'
    ipConfigurations: [
      {
        name: 'fw-ipconfig'
        properties: {
          subnet: {
            id: hubVnet.properties.subnets[0].id
          }
          publicIPAddress: {
            id: firewallPublicIP.id
          }
        }
      }
    ]
    firewallPolicy: {
      id: firewallPolicy.id
    }
  }
}

// Firewall Policy
resource firewallPolicy 'Microsoft.Network/firewallPolicies@2023-05-01' = {
  name: 'fwpol-${environment}'
  location: location
  properties: {
    sku: {
      tier: 'Standard'
    }
    threatIntelMode: 'Deny'
    dnsSettings: {
      enableProxy: true
    }
  }
}

// Application Rules
resource applicationRuleCollection 'Microsoft.Network/firewallPolicies/ruleCollectionGroups@2023-05-01' = {
  parent: firewallPolicy
  name: 'DefaultApplicationRuleCollectionGroup'
  properties: {
    priority: 300
    ruleCollections: [
      {
        ruleCollectionType: 'FirewallPolicyFilterRuleCollection'
        name: 'allow-azure-services'
        priority: 100
        action: {
          type: 'Allow'
        }
        rules: [
          {
            ruleType: 'ApplicationRule'
            name: 'allow-azure-management'
            protocols: [
              { protocolType: 'Https', port: 443 }
            ]
            targetFqdns: [
              '*.management.azure.com'
              '*.graph.microsoft.com'
              'login.microsoftonline.com'
            ]
            sourceAddresses: ['10.0.0.0/8']
          }
        ]
      }
    ]
  }
}

// Network Rules
resource networkRuleCollection 'Microsoft.Network/firewallPolicies/ruleCollectionGroups@2023-05-01' = {
  parent: firewallPolicy
  name: 'DefaultNetworkRuleCollectionGroup'
  properties: {
    priority: 200
    ruleCollections: [
      {
        ruleCollectionType: 'FirewallPolicyFilterRuleCollection'
        name: 'allow-time-sync'
        priority: 100
        action: {
          type: 'Allow'
        }
        rules: [
          {
            ruleType: 'NetworkRule'
            name: 'allow-ntp'
            ipProtocols: ['UDP']
            destinationPorts: ['123']
            destinationAddresses: ['*']
            sourceAddresses: ['10.0.0.0/8']
          }
        ]
      }
    ]
  }
}

// NSG for Management Subnet
resource nsgManagement 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-management-${environment}'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowBastionInbound'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: cidrSubnet(hubAddressPrefix, 24, 1) // Bastion subnet
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRanges: ['22', '3389']
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4000
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

// Azure Bastion
resource bastionPublicIP 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: 'pip-bastion-${environment}'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

resource bastion 'Microsoft.Network/bastionHosts@2023-05-01' = {
  name: 'bas-hub-${environment}'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    enableTunneling: true
    enableFileCopy: true
    ipConfigurations: [
      {
        name: 'bastion-ipconfig'
        properties: {
          subnet: {
            id: hubVnet.properties.subnets[1].id
          }
          publicIPAddress: {
            id: bastionPublicIP.id
          }
        }
      }
    ]
  }
}

output hubVnetId string = hubVnet.id
output firewallPrivateIP string = firewall.properties.ipConfigurations[0].properties.privateIPAddress
```

#### Spoke VNet with Private Endpoints

```bicep
@description('Spoke VNet address prefix')
param spokeAddressPrefix string = '10.1.0.0/16'

@description('Hub VNet ID for peering')
param hubVnetId string

@description('Hub Firewall private IP')
param firewallPrivateIP string

@description('Location')
param location string = resourceGroup().location

@description('Environment')
param environment string = 'production'

// Spoke Virtual Network
resource spokeVnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: 'vnet-spoke-${environment}'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [spokeAddressPrefix]
    }
    subnets: [
      {
        name: 'snet-app'
        properties: {
          addressPrefix: cidrSubnet(spokeAddressPrefix, 24, 0) // 10.1.0.0/24
          networkSecurityGroup: {
            id: nsgApp.id
          }
          routeTable: {
            id: routeTable.id
          }
          privateEndpointNetworkPolicies: 'Disabled'
          delegations: [
            {
              name: 'delegation'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
      {
        name: 'snet-data'
        properties: {
          addressPrefix: cidrSubnet(spokeAddressPrefix, 24, 1) // 10.1.1.0/24
          networkSecurityGroup: {
            id: nsgData.id
          }
          routeTable: {
            id: routeTable.id
          }
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'snet-privateendpoints'
        properties: {
          addressPrefix: cidrSubnet(spokeAddressPrefix, 24, 2) // 10.1.2.0/24
          privateEndpointNetworkPolicies: 'Enabled'
        }
      }
    ]
  }
}

// Route Table (force traffic through firewall)
resource routeTable 'Microsoft.Network/routeTables@2023-05-01' = {
  name: 'rt-spoke-${environment}'
  location: location
  properties: {
    disableBgpRoutePropagation: true
    routes: [
      {
        name: 'to-internet-via-firewall'
        properties: {
          addressPrefix: '0.0.0.0/0'
          nextHopType: 'VirtualAppliance'
          nextHopIpAddress: firewallPrivateIP
        }
      }
      {
        name: 'to-hub-via-firewall'
        properties: {
          addressPrefix: '10.0.0.0/16'
          nextHopType: 'VirtualAppliance'
          nextHopIpAddress: firewallPrivateIP
        }
      }
    ]
  }
}

// NSG for App Subnet
resource nsgApp 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-app-${environment}'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowHttpsInbound'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'AzureLoadBalancer'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '443'
        }
      }
      {
        name: 'AllowAppGatewayInbound'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: 'GatewayManager'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRanges: ['65200-65535']
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4000
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

// NSG for Data Subnet
resource nsgData 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-data-${environment}'
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowAppSubnetInbound'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourceAddressPrefix: cidrSubnet(spokeAddressPrefix, 24, 0) // App subnet
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRanges: ['1433', '5432', '6379', '443']
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4000
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
        }
      }
    ]
  }
}

// VNet Peering: Spoke to Hub
resource peeringToHub 'Microsoft.Network/virtualNetworks/virtualNetworkPeerings@2023-05-01' = {
  parent: spokeVnet
  name: 'peer-to-hub'
  properties: {
    remoteVirtualNetwork: {
      id: hubVnetId
    }
    allowVirtualNetworkAccess: true
    allowForwardedTraffic: true
    allowGatewayTransit: false
    useRemoteGateways: true
  }
}

// Private DNS Zones
resource privateDnsZoneBlob 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.blob.core.windows.net'
  location: 'global'
}

resource privateDnsZoneSql 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.database.windows.net'
  location: 'global'
}

resource privateDnsZoneKeyVault 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: 'privatelink.vaultcore.azure.net'
  location: 'global'
}

// Link DNS Zones to VNet
resource vnetLinkBlob 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZoneBlob
  name: 'link-${spokeVnet.name}'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: spokeVnet.id
    }
  }
}

output spokeVnetId string = spokeVnet.id
output appSubnetId string = spokeVnet.properties.subnets[0].id
output dataSubnetId string = spokeVnet.properties.subnets[1].id
output privateEndpointSubnetId string = spokeVnet.properties.subnets[2].id
```

### 5. Service Endpoints vs Private Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│           Service Endpoints vs Private Endpoints                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Service Endpoints:                                             │
│  ┌─────────┐         Public IP        ┌─────────────┐          │
│  │   VM    │─────────────────────────►│  Storage    │          │
│  └─────────┘    via Azure backbone    └─────────────┘          │
│                                                                  │
│  ✅ Simple to configure                                         │
│  ✅ No extra cost                                               │
│  ❌ Traffic uses public IP                                      │
│  ❌ Limited to same region                                      │
│  ❌ No on-premises access                                       │
│                                                                  │
│  Private Endpoints:                                             │
│  ┌─────────┐        Private IP        ┌─────────────┐          │
│  │   VM    │──────10.1.2.5──────────►│  Storage    │          │
│  └─────────┘        (NIC)             └─────────────┘          │
│                                                                  │
│  ✅ True private connectivity                                   │
│  ✅ Works cross-region                                         │
│  ✅ Works from on-premises                                     │
│  ✅ DNS integration                                            │
│  ❌ Additional cost per endpoint                               │
│  ❌ More complex setup                                         │
│                                                                  │
│  Recommendation:                                                │
│  → Use Private Endpoints for production workloads              │
│  → Use Service Endpoints for simple scenarios                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @azure-architect | Network design needed |
| @security-specialist | Network security requirements |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @bicep-specialist | Deploy network infrastructure |
| @monitoring-specialist | Network flow logging |

---

## 📚 Related Skills

- [azure-networking-patterns.skill.md](../skills/azure-networking-patterns.skill.md)

---

## 🏷️ Tags

`vnet` `nsg` `private-endpoint` `hub-spoke` `firewall` `bastion` `azure`
