/**
 * InfraScanner Tests - GAP-08 Phase 1
 *
 * Tests infrastructure security scanning for Bicep/ARM templates
 */

import { InfraScanner } from '../scanning/InfraScanner';

describe('InfraScanner', () => {
  let scanner: InfraScanner;

  beforeEach(() => {
    scanner = new InfraScanner();
  });

  describe('scan', () => {
    it('should return clean result for secure Bicep template', () => {
      const secureBicep = `
        resource storageAccount 'Microsoft.Storage/storageAccounts@2021-02-01' = {
          name: 'mystorage'
          properties: {
            supportsHttpsTrafficOnly: true
            allowBlobPublicAccess: false
            encryption: {
              services: {
                blob: { enabled: true }
              }
            }
          }
        }
      `;

      const result = scanner.scan(secureBicep, 'secure.bicep');

      expect(result.file).toBe('secure.bicep');
      expect(result.vulnerabilities).toHaveLength(0);
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
    });

    it('should detect storage account with HTTPS disabled', () => {
      const insecureBicep = `
        resource storageAccount 'Microsoft.Storage/storageAccounts@2021-02-01' = {
          name: 'mystorage'
          properties: {
            supportsHttpsTrafficOnly: false
          }
        }
      `;

      const result = scanner.scan(insecureBicep, 'storage.bicep');

      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.vulnerabilities.some(v => v.id === 'INFRA001')).toBe(true);
      expect(result.vulnerabilities.find(v => v.id === 'INFRA001')?.severity).toBe('high');
    });

    it('should detect storage account with public blob access', () => {
      const insecureBicep = `
        resource storageAccount 'Microsoft.Storage/storageAccounts@2021-02-01' = {
          name: 'mystorage'
          properties: {
            allowBlobPublicAccess: true
          }
        }
      `;

      const result = scanner.scan(insecureBicep, 'storage.bicep');

      expect(result.vulnerabilities.some(v => v.id === 'INFRA002')).toBe(true);
      const vuln = result.vulnerabilities.find(v => v.id === 'INFRA002');
      expect(vuln?.severity).toBe('medium'); // INFRA002 is medium severity
      expect(vuln?.remediation).toContain('false');
    });

    it('should detect Key Vault with soft delete disabled', () => {
      const insecureBicep = `
        resource keyVault 'Microsoft.KeyVault/vaults@2021-04-01' = {
          name: 'mykeyvault'
          properties: {
            enableSoftDelete: false
          }
        }
      `;

      const result = scanner.scan(insecureBicep, 'keyvault.bicep');

      // INFRA004 is Key Vault Soft Delete Disabled
      expect(result.vulnerabilities.some(v => v.id === 'INFRA004')).toBe(true);
    });

    it('should detect Key Vault with public network access', () => {
      const insecureBicep = `
        resource keyVault 'Microsoft.KeyVault/vaults@2021-04-01' = {
          name: 'mykeyvault'
          properties: {
            publicNetworkAccess: 'Enabled'
          }
        }
      `;

      const result = scanner.scan(insecureBicep, 'keyvault.bicep');

      // INFRA006 is Key Vault Public Network Access
      expect(result.vulnerabilities.some(v => v.id === 'INFRA006')).toBe(true);
    });

    it('should detect hardcoded SQL password', () => {
      const insecureBicep = `
        resource sqlServer 'Microsoft.Sql/servers@2021-02-01' = {
          name: 'mysqlserver'
          properties: {
            administratorLoginPassword: 'MySecretPassword123!'
          }
        }
      `;

      const result = scanner.scan(insecureBicep, 'sql.bicep');

      // INFRA007 is SQL Server Admin Password Hardcoded
      expect(result.vulnerabilities.some(v => v.id === 'INFRA007')).toBe(true);
      const vuln = result.vulnerabilities.find(v => v.id === 'INFRA007');
      expect(vuln?.severity).toBe('critical');
    });

    it('should detect App Service with HTTPS disabled', () => {
      const insecureBicep = `
        resource appService 'Microsoft.Web/sites@2021-02-01' = {
          name: 'myapp'
          properties: {
            httpsOnly: false
          }
        }
      `;

      const result = scanner.scan(insecureBicep, 'app.bicep');

      expect(result.vulnerabilities.some(v => v.id === 'INFRA010')).toBe(true);
    });

    it('should detect App Service with FTP enabled', () => {
      const insecureBicep = `
        resource appService 'Microsoft.Web/sites@2021-02-01' = {
          name: 'myapp'
          properties: {
            siteConfig: {
              ftpsState: 'AllAllowed'
            }
          }
        }
      `;

      const result = scanner.scan(insecureBicep, 'app.bicep');

      expect(result.vulnerabilities.some(v => v.id === 'INFRA011')).toBe(true);
    });

    it('should detect NSG allowing all inbound traffic', () => {
      const insecureBicep = `
        resource nsg 'Microsoft.Network/networkSecurityGroups@2021-02-01' = {
          name: 'mynsg'
          properties: {
            securityRules: [
              {
                properties: {
                  sourceAddressPrefix: '*'
                  access: 'Allow'
                  direction: 'Inbound'
                }
              }
            ]
          }
        }
      `;

      const result = scanner.scan(insecureBicep, 'nsg.bicep');

      expect(result.vulnerabilities.some(v => v.id === 'INFRA013')).toBe(true);
      const vuln = result.vulnerabilities.find(v => v.id === 'INFRA013');
      expect(vuln?.severity).toBe('critical');
    });

    it('should detect Container Registry with admin enabled', () => {
      const insecureBicep = `
        resource acr 'Microsoft.ContainerRegistry/registries@2021-06-01' = {
          name: 'myacr'
          properties: {
            adminUserEnabled: true
          }
        }
      `;

      const result = scanner.scan(insecureBicep, 'acr.bicep');

      expect(result.vulnerabilities.some(v => v.id === 'INFRA016')).toBe(true);
    });

    it('should count resources in template', () => {
      const bicep = `
        resource storage 'Microsoft.Storage/storageAccounts@2021-02-01' = {
          name: 'storage1'
        }
        resource keyvault 'Microsoft.KeyVault/vaults@2021-04-01' = {
          name: 'keyvault1'
        }
        resource appService 'Microsoft.Web/sites@2021-02-01' = {
          name: 'app1'
        }
      `;

      const result = scanner.scan(bicep, 'multi.bicep');

      expect(result.resources).toBe(3);
    });

    it('should calculate score based on vulnerabilities', () => {
      // Critical vuln = 25 points penalty
      const criticalBicep = `
        resource sqlServer 'Microsoft.Sql/servers@2021-02-01' = {
          properties: {
            administratorLoginPassword: 'password123'
          }
        }
      `;

      const result = scanner.scan(criticalBicep, 'critical.bicep');

      expect(result.score).toBeLessThanOrEqual(75); // 100 - 25 = 75
    });

    it('should include line numbers in vulnerabilities', () => {
      const bicep = `resource storage 'Microsoft.Storage/storageAccounts@2021-02-01' = {
  name: 'mystorage'
  properties: {
    supportsHttpsTrafficOnly: false
  }
}`;

      const result = scanner.scan(bicep, 'test.bicep');

      const vuln = result.vulnerabilities.find(v => v.id === 'INFRA001');
      expect(vuln?.line).toBeGreaterThan(0);
    });
  });

  describe('addRule', () => {
    it('should allow adding custom rules', () => {
      scanner.addRule({
        id: 'CUSTOM001',
        severity: 'high',
        title: 'Custom Rule',
        pattern: /customPatternToDetect/,
        description: 'Custom rule description',
        remediation: 'Fix the custom issue',
      });

      const bicep = `
        resource test 'Microsoft.Test/test@2021-01-01' = {
          customPatternToDetect: true
        }
      `;

      const result = scanner.scan(bicep, 'custom.bicep');

      expect(result.vulnerabilities.some(v => v.id === 'CUSTOM001')).toBe(true);
    });
  });

  describe('scanFiles', () => {
    it('should scan multiple Bicep files', () => {
      const files = [
        { name: 'storage.bicep', content: 'resource s "..." = { properties: { supportsHttpsTrafficOnly: false } }' },
        { name: 'keyvault.bicep', content: 'resource kv "..." = { properties: { enableSoftDelete: false } }' },
      ];

      const results = scanner.scanFiles(files);

      expect(results).toHaveLength(2);
      expect(results[0].file).toBe('storage.bicep');
      expect(results[1].file).toBe('keyvault.bicep');
    });

    it('should filter to only .bicep and .json files', () => {
      const files = [
        { name: 'main.bicep', content: 'resource s "..." = {}' },
        { name: 'template.json', content: '{}' },
        { name: 'readme.md', content: '# Readme' },
        { name: 'script.ps1', content: 'Write-Host "Hello"' },
      ];

      const results = scanner.scanFiles(files);

      expect(results).toHaveLength(2);
      expect(results.map(r => r.file)).toContain('main.bicep');
      expect(results.map(r => r.file)).toContain('template.json');
    });

    it('should return empty array for no matching files', () => {
      const files = [
        { name: 'readme.md', content: '# Hello' },
        { name: 'script.sh', content: 'echo hello' },
      ];

      const results = scanner.scanFiles(files);

      expect(results).toHaveLength(0);
    });
  });

  describe('score calculation', () => {
    it('should pass with score >= 70', () => {
      // Single high vuln = 15 points penalty = 85 score (passes)
      const bicep = `
        resource storage 'Microsoft.Storage/storageAccounts@2021-02-01' = {
          properties: {
            supportsHttpsTrafficOnly: false
          }
        }
      `;

      const result = scanner.scan(bicep, 'test.bicep');

      expect(result.passed).toBe(true);
      expect(result.score).toBe(85);
    });

    it('should fail with score < 70', () => {
      // Multiple vulns to get below 70
      const bicep = `
        resource storage 'Microsoft.Storage/storageAccounts@2021-02-01' = {
          properties: {
            allowBlobPublicAccess: true
            administratorLoginPassword: 'secret'
          }
        }
      `;

      const result = scanner.scan(bicep, 'test.bicep');

      // Critical (25) + Critical (25) = 50 penalty, score = 50
      expect(result.passed).toBe(false);
    });
  });
});
