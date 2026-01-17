/**
 * EntraIDGenerator - Microsoft Entra ID (Azure AD) Generator
 * 
 * Generates identity configuration, authentication setup,
 * app registrations, and authorization policies.
 */

const BaseGenerator = require('./BaseGenerator');

class EntraIDGenerator extends BaseGenerator {
  constructor(options = {}) {
    super({
      name: 'EntraIDGenerator',
      framework: 'entra-id',
      version: 'v2.0',
      language: 'typescript',
      ...options
    });
    
    this.templatePath = 'azure/identity';
    this.supportedTypes = ['appRegistration', 'authConfig', 'authMiddleware', 'rbac'];
  }

  /**
   * Generate app registration manifest
   */
  async generateAppRegistration(context) {
    const { 
      name,
      signInAudience = 'AzureADMyOrg',
      api = {},
      web = {},
      spa = {},
      publicClient = {},
      requiredResourceAccess = [],
      appRoles = []
    } = context;
    
    const manifest = {
      displayName: name,
      signInAudience,
      api: this.buildApiConfig(api),
      web: this.buildWebConfig(web),
      spa: this.buildSpaConfig(spa),
      publicClient: this.buildPublicClientConfig(publicClient),
      requiredResourceAccess: this.buildResourceAccess(requiredResourceAccess),
      appRoles: this.buildAppRoles(appRoles),
      optionalClaims: this.buildOptionalClaims(context.optionalClaims)
    };
    
    return JSON.stringify(manifest, null, 2);
  }

  /**
   * Generate authentication configuration for different frameworks
   */
  async generateAuthConfig(context) {
    const { 
      framework = 'node',
      tenantId,
      clientId,
      clientSecret,
      scopes = [],
      redirectUri,
      audience
    } = context;
    
    const templateData = {
      tenantId,
      clientId,
      clientSecret,
      scopes,
      redirectUri,
      audience,
      authority: `https://login.microsoftonline.com/${tenantId}`
    };
    
    switch (framework) {
      case 'node':
      case 'express':
        return this.generateNodeAuthConfig(templateData);
      case 'react':
        return this.generateReactAuthConfig(templateData);
      case 'dotnet':
        return this.generateDotNetAuthConfig(templateData);
      case 'python':
        return this.generatePythonAuthConfig(templateData);
      default:
        return this.generateNodeAuthConfig(templateData);
    }
  }

  /**
   * Generate authentication middleware
   */
  async generateAuthMiddleware(context) {
    const { 
      framework = 'express',
      validateToken = true,
      checkRoles = true,
      checkScopes = true
    } = context;
    
    const templateData = {
      validateToken,
      checkRoles,
      checkScopes
    };
    
    switch (framework) {
      case 'express':
        return this.generateExpressMiddleware(templateData);
      case 'fastify':
        return this.generateFastifyMiddleware(templateData);
      case 'nestjs':
        return this.generateNestJSGuard(templateData);
      default:
        return this.generateExpressMiddleware(templateData);
    }
  }

  /**
   * Generate RBAC configuration
   */
  async generateRbac(context) {
    const { 
      roles = [],
      permissions = [],
      resources = []
    } = context;
    
    const templateData = {
      roles: this.buildRoles(roles),
      permissions: this.buildPermissions(permissions),
      resources: this.buildResources(resources)
    };
    
    return this.generateRbacConfig(templateData);
  }

  // Config generation methods
  generateNodeAuthConfig(data) {
    const config = {
      auth: {
        clientId: data.clientId || '${AZURE_CLIENT_ID}',
        authority: data.authority,
        clientSecret: data.clientSecret || '${AZURE_CLIENT_SECRET}'
      },
      system: {
        loggerOptions: {
          loggerCallback: 'console.log',
          piiLoggingEnabled: false,
          logLevel: 'Info'
        }
      }
    };
    
    const lines = [];
    lines.push(`import { Configuration, LogLevel } from '@azure/msal-node';`);
    lines.push('');
    lines.push('export const msalConfig: Configuration = {');
    lines.push('  auth: {');
    lines.push(`    clientId: process.env.AZURE_CLIENT_ID || '${data.clientId}',`);
    lines.push(`    authority: '${data.authority}',`);
    lines.push(`    clientSecret: process.env.AZURE_CLIENT_SECRET`);
    lines.push('  },');
    lines.push('  system: {');
    lines.push('    loggerOptions: {');
    lines.push('      loggerCallback: (level, message, containsPii) => {');
    lines.push('        if (containsPii) return;');
    lines.push('        console.log(message);');
    lines.push('      },');
    lines.push('      piiLoggingEnabled: false,');
    lines.push('      logLevel: LogLevel.Warning');
    lines.push('    }');
    lines.push('  }');
    lines.push('};');
    lines.push('');
    lines.push('export const tokenRequest = {');
    lines.push(`  scopes: [${data.scopes.map(s => `'${s}'`).join(', ')}]`);
    lines.push('};');
    
    return lines.join('\n');
  }

  generateReactAuthConfig(data) {
    const lines = [];
    
    lines.push(`import { Configuration, PopupRequest } from '@azure/msal-browser';`);
    lines.push('');
    lines.push('export const msalConfig: Configuration = {');
    lines.push('  auth: {');
    lines.push(`    clientId: '${data.clientId}',`);
    lines.push(`    authority: '${data.authority}',`);
    lines.push(`    redirectUri: '${data.redirectUri || 'http://localhost:3000'}',`);
    lines.push("    postLogoutRedirectUri: '/'");
    lines.push('  },');
    lines.push('  cache: {');
    lines.push("    cacheLocation: 'sessionStorage',");
    lines.push('    storeAuthStateInCookie: false');
    lines.push('  }');
    lines.push('};');
    lines.push('');
    lines.push('export const loginRequest: PopupRequest = {');
    lines.push(`  scopes: ['User.Read'${data.scopes.length ? ', ' + data.scopes.map(s => `'${s}'`).join(', ') : ''}]`);
    lines.push('};');
    lines.push('');
    lines.push('export const graphConfig = {');
    lines.push("  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me'");
    lines.push('};');
    
    return lines.join('\n');
  }

  generateDotNetAuthConfig(data) {
    return `{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "${data.tenantId}",
    "ClientId": "${data.clientId}",
    "ClientSecret": "${data.clientSecret || ''}",
    "CallbackPath": "/signin-oidc",
    "SignedOutCallbackPath": "/signout-callback-oidc",
    "Scopes": "${data.scopes.join(' ')}"
  },
  "Graph": {
    "BaseUrl": "https://graph.microsoft.com/v1.0",
    "Scopes": "User.Read"
  }
}`;
  }

  generatePythonAuthConfig(data) {
    const lines = [];
    
    lines.push('import os');
    lines.push('from msal import ConfidentialClientApplication');
    lines.push('');
    lines.push('# Azure AD Configuration');
    lines.push(`TENANT_ID = os.environ.get('AZURE_TENANT_ID', '${data.tenantId}')`);
    lines.push(`CLIENT_ID = os.environ.get('AZURE_CLIENT_ID', '${data.clientId}')`);
    lines.push("CLIENT_SECRET = os.environ.get('AZURE_CLIENT_SECRET')");
    lines.push(`AUTHORITY = f'https://login.microsoftonline.com/{TENANT_ID}'`);
    lines.push('');
    lines.push(`SCOPES = [${data.scopes.map(s => `'${s}'`).join(', ')}]`);
    lines.push('');
    lines.push('def get_msal_app():');
    lines.push('    """Create MSAL Confidential Client Application"""');
    lines.push('    return ConfidentialClientApplication(');
    lines.push('        CLIENT_ID,');
    lines.push('        authority=AUTHORITY,');
    lines.push('        client_credential=CLIENT_SECRET');
    lines.push('    )');
    lines.push('');
    lines.push('def get_token():');
    lines.push('    """Acquire token for application"""');
    lines.push('    app = get_msal_app()');
    lines.push('    result = app.acquire_token_silent(SCOPES, account=None)');
    lines.push('    if not result:');
    lines.push('        result = app.acquire_token_for_client(scopes=SCOPES)');
    lines.push('    return result');
    
    return lines.join('\n');
  }

  generateExpressMiddleware(data) {
    const lines = [];
    
    lines.push(`import { Request, Response, NextFunction } from 'express';`);
    lines.push(`import jwt from 'jsonwebtoken';`);
    lines.push(`import jwksClient from 'jwks-rsa';`);
    lines.push('');
    lines.push('const client = jwksClient({');
    lines.push("  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`");
    lines.push('});');
    lines.push('');
    lines.push('function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {');
    lines.push('  client.getSigningKey(header.kid, (err, key) => {');
    lines.push("    const signingKey = key?.getPublicKey();");
    lines.push('    callback(err, signingKey);');
    lines.push('  });');
    lines.push('}');
    lines.push('');
    
    if (data.validateToken) {
      lines.push('export function validateToken(req: Request, res: Response, next: NextFunction) {');
      lines.push("  const authHeader = req.headers.authorization;");
      lines.push('');
      lines.push("  if (!authHeader || !authHeader.startsWith('Bearer ')) {");
      lines.push("    return res.status(401).json({ error: 'Missing or invalid authorization header' });");
      lines.push('  }');
      lines.push('');
      lines.push("  const token = authHeader.split(' ')[1];");
      lines.push('');
      lines.push('  jwt.verify(token, getKey, {');
      lines.push('    audience: process.env.AZURE_CLIENT_ID,');
      lines.push("    issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`");
      lines.push('  }, (err, decoded) => {');
      lines.push('    if (err) {');
      lines.push("      return res.status(401).json({ error: 'Invalid token' });");
      lines.push('    }');
      lines.push('    (req as any).user = decoded;');
      lines.push('    next();');
      lines.push('  });');
      lines.push('}');
      lines.push('');
    }
    
    if (data.checkRoles) {
      lines.push('export function requireRole(...allowedRoles: string[]) {');
      lines.push('  return (req: Request, res: Response, next: NextFunction) => {');
      lines.push('    const user = (req as any).user;');
      lines.push('');
      lines.push('    if (!user || !user.roles) {');
      lines.push("      return res.status(403).json({ error: 'No roles assigned' });");
      lines.push('    }');
      lines.push('');
      lines.push('    const hasRole = allowedRoles.some(role => user.roles.includes(role));');
      lines.push('');
      lines.push('    if (!hasRole) {');
      lines.push("      return res.status(403).json({ error: 'Insufficient permissions' });");
      lines.push('    }');
      lines.push('');
      lines.push('    next();');
      lines.push('  };');
      lines.push('}');
      lines.push('');
    }
    
    if (data.checkScopes) {
      lines.push('export function requireScope(...requiredScopes: string[]) {');
      lines.push('  return (req: Request, res: Response, next: NextFunction) => {');
      lines.push('    const user = (req as any).user;');
      lines.push("    const tokenScopes = user?.scp?.split(' ') || [];");
      lines.push('');
      lines.push('    const hasScope = requiredScopes.every(scope => tokenScopes.includes(scope));');
      lines.push('');
      lines.push('    if (!hasScope) {');
      lines.push("      return res.status(403).json({ error: 'Missing required scopes' });");
      lines.push('    }');
      lines.push('');
      lines.push('    next();');
      lines.push('  };');
      lines.push('}');
    }
    
    return lines.join('\n');
  }

  generateFastifyMiddleware(data) {
    const lines = [];
    
    lines.push(`import { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify';`);
    lines.push(`import fp from 'fastify-plugin';`);
    lines.push(`import jwt from 'jsonwebtoken';`);
    lines.push('');
    lines.push('const authPlugin: FastifyPluginAsync = async (fastify) => {');
    lines.push('  fastify.decorateRequest("user", null);');
    lines.push('');
    lines.push('  fastify.addHook("preHandler", async (request, reply) => {');
    lines.push('    const authHeader = request.headers.authorization;');
    lines.push('');
    lines.push("    if (!authHeader?.startsWith('Bearer ')) {");
    lines.push("      reply.code(401).send({ error: 'Unauthorized' });");
    lines.push('      return;');
    lines.push('    }');
    lines.push('');
    lines.push("    const token = authHeader.split(' ')[1];");
    lines.push('    // Verify token and set user');
    lines.push('    (request as any).user = jwt.decode(token);');
    lines.push('  });');
    lines.push('};');
    lines.push('');
    lines.push('export default fp(authPlugin);');
    
    return lines.join('\n');
  }

  generateNestJSGuard(data) {
    const lines = [];
    
    lines.push(`import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';`);
    lines.push(`import { Reflector } from '@nestjs/core';`);
    lines.push(`import { JwtService } from '@nestjs/jwt';`);
    lines.push('');
    lines.push('@Injectable()');
    lines.push('export class EntraIdGuard implements CanActivate {');
    lines.push('  constructor(');
    lines.push('    private readonly jwtService: JwtService,');
    lines.push('    private readonly reflector: Reflector');
    lines.push('  ) {}');
    lines.push('');
    lines.push('  async canActivate(context: ExecutionContext): Promise<boolean> {');
    lines.push('    const request = context.switchToHttp().getRequest();');
    lines.push('    const authHeader = request.headers.authorization;');
    lines.push('');
    lines.push("    if (!authHeader || !authHeader.startsWith('Bearer ')) {");
    lines.push("      throw new UnauthorizedException('Missing authorization header');");
    lines.push('    }');
    lines.push('');
    lines.push("    const token = authHeader.split(' ')[1];");
    lines.push('');
    lines.push('    try {');
    lines.push('      const payload = await this.jwtService.verifyAsync(token);');
    lines.push('      request.user = payload;');
    
    if (data.checkRoles) {
      lines.push('');
      lines.push("      const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());");
      lines.push('      if (requiredRoles) {');
      lines.push('        const userRoles = payload.roles || [];');
      lines.push('        const hasRole = requiredRoles.some(role => userRoles.includes(role));');
      lines.push('        if (!hasRole) {');
      lines.push("          throw new UnauthorizedException('Insufficient permissions');");
      lines.push('        }');
      lines.push('      }');
    }
    
    lines.push('');
    lines.push('      return true;');
    lines.push('    } catch (error) {');
    lines.push("      throw new UnauthorizedException('Invalid token');");
    lines.push('    }');
    lines.push('  }');
    lines.push('}');
    
    if (data.checkRoles) {
      lines.push('');
      lines.push("import { SetMetadata } from '@nestjs/common';");
      lines.push("export const Roles = (...roles: string[]) => SetMetadata('roles', roles);");
    }
    
    return lines.join('\n');
  }

  generateRbacConfig(data) {
    const lines = [];
    
    lines.push(`// RBAC Configuration`);
    lines.push(`// Generated by AgenticCoder`);
    lines.push('');
    lines.push('export interface Role {');
    lines.push('  id: string;');
    lines.push('  name: string;');
    lines.push('  permissions: string[];');
    lines.push('}');
    lines.push('');
    lines.push('export interface Permission {');
    lines.push('  id: string;');
    lines.push('  name: string;');
    lines.push('  resource: string;');
    lines.push('  actions: string[];');
    lines.push('}');
    lines.push('');
    
    lines.push('export const roles: Role[] = [');
    for (const role of data.roles) {
      lines.push('  {');
      lines.push(`    id: '${role.id}',`);
      lines.push(`    name: '${role.name}',`);
      lines.push(`    permissions: [${role.permissions.map(p => `'${p}'`).join(', ')}]`);
      lines.push('  },');
    }
    lines.push('];');
    lines.push('');
    
    lines.push('export const permissions: Permission[] = [');
    for (const perm of data.permissions) {
      lines.push('  {');
      lines.push(`    id: '${perm.id}',`);
      lines.push(`    name: '${perm.name}',`);
      lines.push(`    resource: '${perm.resource}',`);
      lines.push(`    actions: [${perm.actions.map(a => `'${a}'`).join(', ')}]`);
      lines.push('  },');
    }
    lines.push('];');
    lines.push('');
    
    lines.push('export function hasPermission(userRoles: string[], permission: string): boolean {');
    lines.push('  const userPerms = roles');
    lines.push('    .filter(r => userRoles.includes(r.name))');
    lines.push('    .flatMap(r => r.permissions);');
    lines.push('  return userPerms.includes(permission);');
    lines.push('}');
    
    return lines.join('\n');
  }

  // Helper methods
  buildApiConfig(api) {
    return {
      oauth2PermissionScopes: api.scopes || [],
      preAuthorizedApplications: api.preAuthorizedApps || []
    };
  }

  buildWebConfig(web) {
    return {
      redirectUris: web.redirectUris || [],
      logoutUrl: web.logoutUrl,
      implicitGrantSettings: {
        enableAccessTokenIssuance: web.enableAccessToken || false,
        enableIdTokenIssuance: web.enableIdToken || false
      }
    };
  }

  buildSpaConfig(spa) {
    return {
      redirectUris: spa.redirectUris || []
    };
  }

  buildPublicClientConfig(publicClient) {
    return {
      redirectUris: publicClient.redirectUris || []
    };
  }

  buildResourceAccess(resourceAccess) {
    return resourceAccess.map(ra => ({
      resourceAppId: ra.resourceAppId,
      resourceAccess: ra.permissions.map(p => ({
        id: p.id,
        type: p.type || 'Scope'
      }))
    }));
  }

  buildAppRoles(appRoles) {
    return appRoles.map(role => ({
      id: role.id || this.generateUuid(),
      allowedMemberTypes: role.allowedMemberTypes || ['User'],
      description: role.description,
      displayName: role.displayName || role.name,
      isEnabled: true,
      value: role.value || this.toKebabCase(role.name)
    }));
  }

  buildOptionalClaims(claims) {
    if (!claims) return null;
    return {
      idToken: claims.idToken || [],
      accessToken: claims.accessToken || [],
      saml2Token: claims.saml2Token || []
    };
  }

  buildRoles(roles) {
    return roles.map(r => ({
      id: r.id || this.generateUuid(),
      name: r.name,
      permissions: r.permissions || []
    }));
  }

  buildPermissions(permissions) {
    return permissions.map(p => ({
      id: p.id || this.generateUuid(),
      name: p.name,
      resource: p.resource,
      actions: p.actions || ['read']
    }));
  }

  buildResources(resources) {
    return resources;
  }

  generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

module.exports = EntraIDGenerator;
