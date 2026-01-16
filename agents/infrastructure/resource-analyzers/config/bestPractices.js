/**
 * Best Practices - Security defaults and recommended configurations
 * 
 * Each resource type has configurations for:
 * - dev: Development/test environment (cost-effective)
 * - prod: Production environment (secure, redundant, performant)
 */

export const BEST_PRACTICES = {
  // ============================================================================
  // COMPUTE
  // ============================================================================
  'Microsoft.Compute/virtualMachines': {
    dev: {
      properties: {
        hardwareProfile: { vmSize: 'Standard_B2s' },
        storageProfile: {
          imageReference: {
            publisher: 'Canonical',
            offer: '0001-com-ubuntu-server-jammy',
            sku: '22_04-lts-gen2',
            version: 'latest'
          },
          osDisk: {
            createOption: 'FromImage',
            managedDisk: { storageAccountType: 'Standard_LRS' }
          }
        },
        osProfile: {
          adminUsername: 'azureuser',
          linuxConfiguration: {
            disablePasswordAuthentication: true,
            ssh: { publicKeys: [] }
          }
        },
        securityProfile: {
          securityType: 'TrustedLaunch',
          uefiSettings: { secureBootEnabled: true, vTpmEnabled: true }
        }
      }
    },
    prod: {
      properties: {
        hardwareProfile: { vmSize: 'Standard_D4s_v5' },
        storageProfile: {
          imageReference: {
            publisher: 'Canonical',
            offer: '0001-com-ubuntu-server-jammy',
            sku: '22_04-lts-gen2',
            version: 'latest'
          },
          osDisk: {
            createOption: 'FromImage',
            managedDisk: { storageAccountType: 'Premium_LRS' }
          }
        },
        osProfile: {
          adminUsername: 'azureuser',
          linuxConfiguration: {
            disablePasswordAuthentication: true,
            ssh: { publicKeys: [] }
          }
        },
        securityProfile: {
          securityType: 'TrustedLaunch',
          uefiSettings: { secureBootEnabled: true, vTpmEnabled: true }
        },
        diagnosticsProfile: { bootDiagnostics: { enabled: true } }
      },
      zones: ['1']
    }
  },

  'Microsoft.Compute/virtualMachineScaleSets': {
    dev: {
      sku: { name: 'Standard_B2s', tier: 'Standard', capacity: 2 },
      properties: {
        upgradePolicy: { mode: 'Rolling' },
        virtualMachineProfile: {
          storageProfile: {
            imageReference: {
              publisher: 'Canonical',
              offer: '0001-com-ubuntu-server-jammy',
              sku: '22_04-lts-gen2',
              version: 'latest'
            }
          },
          osProfile: {
            adminUsername: 'azureuser',
            linuxConfiguration: { disablePasswordAuthentication: true }
          }
        }
      }
    },
    prod: {
      sku: { name: 'Standard_D4s_v5', tier: 'Standard', capacity: 3 },
      properties: {
        upgradePolicy: { mode: 'Rolling' },
        virtualMachineProfile: {
          storageProfile: {
            imageReference: {
              publisher: 'Canonical',
              offer: '0001-com-ubuntu-server-jammy',
              sku: '22_04-lts-gen2',
              version: 'latest'
            }
          },
          osProfile: {
            adminUsername: 'azureuser',
            linuxConfiguration: { disablePasswordAuthentication: true }
          }
        },
        zoneBalance: true
      },
      zones: ['1', '2', '3']
    }
  },

  // ============================================================================
  // WEB
  // ============================================================================
  'Microsoft.Web/sites': {
    dev: {
      kind: 'app,linux',
      properties: {
        httpsOnly: true,
        siteConfig: {
          linuxFxVersion: 'NODE|20-lts',
          minTlsVersion: '1.2',
          ftpsState: 'Disabled',
          http20Enabled: true
        }
      }
    },
    prod: {
      kind: 'app,linux',
      properties: {
        httpsOnly: true,
        siteConfig: {
          linuxFxVersion: 'NODE|20-lts',
          minTlsVersion: '1.2',
          ftpsState: 'Disabled',
          http20Enabled: true,
          alwaysOn: true,
          healthCheckPath: '/health'
        },
        clientAffinityEnabled: false
      }
    }
  },

  'Microsoft.Web/serverfarms': {
    dev: {
      sku: { name: 'B1', tier: 'Basic', capacity: 1 },
      kind: 'linux',
      properties: { reserved: true }
    },
    prod: {
      sku: { name: 'P1v3', tier: 'PremiumV3', capacity: 2 },
      kind: 'linux',
      properties: { reserved: true, zoneRedundant: true }
    }
  },

  'Microsoft.Web/staticSites': {
    dev: {
      sku: { name: 'Free', tier: 'Free' },
      properties: {}
    },
    prod: {
      sku: { name: 'Standard', tier: 'Standard' },
      properties: {}
    }
  },

  // ============================================================================
  // STORAGE
  // ============================================================================
  'Microsoft.Storage/storageAccounts': {
    dev: {
      sku: { name: 'Standard_LRS' },
      kind: 'StorageV2',
      properties: {
        minimumTlsVersion: 'TLS1_2',
        allowBlobPublicAccess: false,
        supportsHttpsTrafficOnly: true,
        encryption: {
          services: {
            blob: { enabled: true },
            file: { enabled: true }
          },
          keySource: 'Microsoft.Storage'
        }
      }
    },
    prod: {
      sku: { name: 'Standard_ZRS' },
      kind: 'StorageV2',
      properties: {
        minimumTlsVersion: 'TLS1_2',
        allowBlobPublicAccess: false,
        supportsHttpsTrafficOnly: true,
        allowSharedKeyAccess: false,
        encryption: {
          services: {
            blob: { enabled: true },
            file: { enabled: true }
          },
          keySource: 'Microsoft.Storage'
        },
        networkAcls: {
          defaultAction: 'Deny',
          bypass: 'AzureServices'
        }
      }
    }
  },

  // ============================================================================
  // DATABASE - SQL
  // ============================================================================
  'Microsoft.Sql/servers': {
    dev: {
      properties: {
        administratorLogin: 'sqladmin',
        minimalTlsVersion: '1.2',
        publicNetworkAccess: 'Enabled'
      }
    },
    prod: {
      properties: {
        administratorLogin: 'sqladmin',
        minimalTlsVersion: '1.2',
        publicNetworkAccess: 'Disabled',
        administrators: {
          administratorType: 'ActiveDirectory',
          azureADOnlyAuthentication: true
        }
      }
    }
  },

  'Microsoft.Sql/servers/databases': {
    dev: {
      sku: { name: 'Basic', tier: 'Basic' },
      properties: {
        collation: 'SQL_Latin1_General_CP1_CI_AS',
        maxSizeBytes: 2147483648
      }
    },
    prod: {
      sku: { name: 'S3', tier: 'Standard' },
      properties: {
        collation: 'SQL_Latin1_General_CP1_CI_AS',
        zoneRedundant: true,
        readScale: 'Enabled'
      }
    }
  },

  // ============================================================================
  // DATABASE - Cosmos DB
  // ============================================================================
  'Microsoft.DocumentDB/databaseAccounts': {
    dev: {
      kind: 'GlobalDocumentDB',
      properties: {
        databaseAccountOfferType: 'Standard',
        enableFreeTier: true,
        consistencyPolicy: { defaultConsistencyLevel: 'Session' },
        locations: [{ locationName: 'westeurope', failoverPriority: 0 }]
      }
    },
    prod: {
      kind: 'GlobalDocumentDB',
      properties: {
        databaseAccountOfferType: 'Standard',
        enableFreeTier: false,
        enableAutomaticFailover: true,
        consistencyPolicy: { defaultConsistencyLevel: 'Session' },
        locations: [
          { locationName: 'westeurope', failoverPriority: 0 },
          { locationName: 'northeurope', failoverPriority: 1 }
        ],
        publicNetworkAccess: 'Disabled'
      }
    }
  },

  // ============================================================================
  // DATABASE - MySQL
  // ============================================================================
  'Microsoft.DBforMySQL/flexibleServers': {
    dev: {
      sku: { name: 'Standard_B1ms', tier: 'Burstable' },
      properties: {
        version: '8.0.21',
        storage: { storageSizeGB: 20 }
      }
    },
    prod: {
      sku: { name: 'Standard_D4ds_v4', tier: 'GeneralPurpose' },
      properties: {
        version: '8.0.21',
        storage: { storageSizeGB: 128 },
        backup: { backupRetentionDays: 35, geoRedundantBackup: 'Enabled' },
        highAvailability: { mode: 'ZoneRedundant' }
      }
    }
  },

  // ============================================================================
  // DATABASE - PostgreSQL
  // ============================================================================
  'Microsoft.DBforPostgreSQL/flexibleServers': {
    dev: {
      sku: { name: 'Standard_B1ms', tier: 'Burstable' },
      properties: {
        version: '15',
        storage: { storageSizeGB: 32 }
      }
    },
    prod: {
      sku: { name: 'Standard_D4ds_v4', tier: 'GeneralPurpose' },
      properties: {
        version: '15',
        storage: { storageSizeGB: 128 },
        backup: { backupRetentionDays: 35, geoRedundantBackup: 'Enabled' },
        highAvailability: { mode: 'ZoneRedundant' }
      }
    }
  }
};

export default BEST_PRACTICES;
