import dotenv from "dotenv";
import QuickBooks from "node-quickbooks";
import OAuthClient from "intuit-oauth";
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { randomBytes } from 'crypto';
import { logger } from "../utils/logger";
import type { ReportName } from '../schemas/reports';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class QuickbooksClient {
  private clientId?: string;
  private clientSecret?: string;
  private refreshToken?: string;
  private realmId?: string;
  private environment: string = 'sandbox';
  private accessToken?: string;
  private accessTokenExpiry?: Date;
  private quickbooksInstance?: QuickBooks;
  private oauthClient?: OAuthClient;
  private isAuthenticating: boolean = false;
  private redirectUri: string = process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:8000/callback';
  private initialized: boolean = false;
  private refreshPromise?: Promise<{ access_token: string; expires_in: number }>;
  private oauthStates = new Map<string, number>();
  private tokenFile = process.env.QUICKBOOKS_TOKEN_FILE;

  private ensureInitialized(): void {
    if (this.initialized) return;

    this.clientId = process.env.QUICKBOOKS_CLIENT_ID;
    this.clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    this.refreshToken = process.env.QUICKBOOKS_REFRESH_TOKEN;
    this.realmId = process.env.QUICKBOOKS_REALM_ID;
    this.environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox';

    if (this.tokenFile && fs.existsSync(this.tokenFile)) {
      const saved = JSON.parse(fs.readFileSync(this.tokenFile, 'utf8'));
      if (!saved.refreshToken || !saved.realmId || (this.realmId && saved.realmId !== this.realmId)) {
        throw new Error('Saved QuickBooks connection does not match the configured company');
      }
      this.refreshToken = saved.refreshToken;
      this.realmId = saved.realmId;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error("QUICKBOOKS_CLIENT_ID and QUICKBOOKS_CLIENT_SECRET must be set in environment variables");
    }

    this.oauthClient = new OAuthClient({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      environment: this.environment,
      redirectUri: this.redirectUri,
    });

    this.initialized = true;
  }

  private async startOAuthFlow(): Promise<void> {
    if (this.isAuthenticating) {
      return;
    }

    this.ensureInitialized();
    this.isAuthenticating = true;
    const port = 8000;

    return new Promise((resolve, reject) => {
      // Create temporary server for OAuth callback
      const server = http.createServer(async (req, res) => {
        if (req.url?.startsWith('/callback')) {
          try {
            await this.handleOAuthCallback(`http://localhost:${port}${req.url}`);
            
            // Send success response
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  font-family: Arial, sans-serif;
                  background-color: #f5f5f5;
                ">
                  <h2 style="color: #2E8B57;">✓ Successfully connected to QuickBooks!</h2>
                  <p>You can close this window now.</p>
                </body>
              </html>
            `);
            
            // Close server after a short delay
            setTimeout(() => {
              server.close();
              this.isAuthenticating = false;
              resolve();
            }, 1000);
          } catch (error) {
            logger.error('QuickBooks authorization failed');
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
                  font-family: Arial, sans-serif;
                  background-color: #fff0f0;
                ">
                  <h2 style="color: #d32f2f;">Error connecting to QuickBooks</h2>
                  <p>Please check the console for more details.</p>
                </body>
              </html>
            `);
            this.isAuthenticating = false;
            reject(error);
          }
        }
      });

      // Start server
      server.listen(port, async () => {
        
        // Generate authorization URL with proper type assertion
        const authUri = this.getAuthorizationUrl();
        
        // Open browser automatically
        await open(authUri);
      });

      // Handle server errors
      server.on('error', (error) => {
        logger.error('Server error', error);
        this.isAuthenticating = false;
        reject(error);
      });
    });
  }

  private saveTokensToEnv(): void {
    if (this.tokenFile) {
      const directory = path.dirname(this.tokenFile);
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      const temporary = `${this.tokenFile}.tmp`;
      fs.writeFileSync(temporary, JSON.stringify({ refreshToken: this.refreshToken, realmId: this.realmId }), { mode: 0o600 });
      fs.chmodSync(temporary, 0o600);
      fs.renameSync(temporary, this.tokenFile);
      return;
    }
    const tokenPath = path.join(__dirname, '..', '..', '.env');
    const envContent = fs.existsSync(tokenPath) ? fs.readFileSync(tokenPath, 'utf-8') : '';
    const envLines = envContent.split('\n');
    
    const updateEnvVar = (name: string, value: string) => {
      const index = envLines.findIndex(line => line.startsWith(`${name}=`));
      if (index !== -1) {
        envLines[index] = `${name}=${value}`;
      } else {
        envLines.push(`${name}=${value}`);
      }
    };

    if (this.refreshToken) updateEnvVar('QUICKBOOKS_REFRESH_TOKEN', this.refreshToken);
    if (this.realmId) updateEnvVar('QUICKBOOKS_REALM_ID', this.realmId);

    fs.writeFileSync(tokenPath, envLines.join('\n'), { mode: 0o600 });
  }

  async refreshAccessToken() {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.performTokenRefresh();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  private async performTokenRefresh() {
    this.ensureInitialized();

    if (!this.refreshToken) {
      await this.startOAuthFlow();

      // Verify we have a refresh token after OAuth flow
      if (!this.refreshToken) {
        throw new Error('Failed to obtain refresh token from OAuth flow');
      }
    }

    try {
      // At this point we know refreshToken is not undefined
      const authResponse = await this.oauthClient!.refreshUsingToken(this.refreshToken);
      if (!authResponse.token.access_token) throw new Error('Missing access token');
      
      this.accessToken = authResponse.token.access_token;
      this.refreshToken = authResponse.token.refresh_token || this.refreshToken;
      this.saveTokensToEnv();
      
      // Calculate expiry time
      const expiresIn = authResponse.token.expires_in || 3600; // Default to 1 hour
      this.accessTokenExpiry = new Date(Date.now() + expiresIn * 1000);
      
      return {
        access_token: this.accessToken,
        expires_in: expiresIn,
      };
    } catch {
      throw new Error('Failed to refresh or persist QuickBooks credentials. Reconnect through the authorized OAuth flow.');
    }
  }

  getAuthorizationUrl(): string {
    this.ensureInitialized();
    const now = Date.now();
    for (const [state, expires] of this.oauthStates) {
      if (expires < now) this.oauthStates.delete(state);
    }
    const state = randomBytes(32).toString('hex');
    this.oauthStates.set(state, now + 10 * 60 * 1000);
    return this.oauthClient!.authorizeUri({
      scope: [OAuthClient.scopes.Accounting as string],
      state,
    }).toString();
  }

  async handleOAuthCallback(callbackUrl: string): Promise<{ refreshToken: string; realmId: string }> {
    this.ensureInitialized();
    const callback = new URL(callbackUrl);
    const state = callback.searchParams.get('state') || '';
    const expires = this.oauthStates.get(state);
    this.oauthStates.delete(state);
    if (!expires || expires < Date.now()) throw new Error('Invalid or expired OAuth state');
    const realmId = callback.searchParams.get('realmId');
    if (!realmId || (this.realmId && realmId !== this.realmId)) {
      throw new Error('QuickBooks company does not match the configured connection');
    }
    const response = await this.oauthClient!.createToken(callbackUrl);
    const tokens = response.token;
    if (!tokens.refresh_token || !tokens.access_token) throw new Error('Incomplete QuickBooks token response');
    this.refreshToken = tokens.refresh_token;
    this.realmId = realmId;
    this.saveTokensToEnv();
    this.accessToken = tokens.access_token;
    this.accessTokenExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
    this.quickbooksInstance = undefined;
    logger.info('QuickBooks authorization saved');

    return { refreshToken: this.refreshToken!, realmId: this.realmId! };
  }

  async forceOAuthFlow() {
    this.ensureInitialized();
    this.refreshToken = undefined;
    await this.startOAuthFlow();
  }

  async authenticate() {
    this.ensureInitialized();

    if (!this.refreshToken || !this.realmId) {
      // In HTTP mode, don't spin up a local server — user must visit /auth
      if (process.env.MCP_TRANSPORT === 'http') {
        throw new Error('Not authenticated. Visit /auth to connect QuickBooks.');
      }
      await this.startOAuthFlow();

      // Verify we have both tokens after OAuth flow
      if (!this.refreshToken || !this.realmId) {
        throw new Error('Failed to obtain required tokens from OAuth flow');
      }
    }

    // Check if token exists and is still valid
    const now = new Date();
    if (!this.accessToken || !this.accessTokenExpiry || this.accessTokenExpiry <= now) {
      const tokenResponse = await this.refreshAccessToken();
      this.accessToken = tokenResponse.access_token;
    }
    
    // At this point we know all tokens are available
    this.quickbooksInstance = new QuickBooks(
      this.clientId!,
      this.clientSecret!,
      this.accessToken,
      false, // no token secret for OAuth 2.0
      this.realmId!, // Safe to use ! here as we checked above
      this.environment === 'sandbox', // use the sandbox?
      false, // debug?
      null, // minor version
      '2.0', // oauth version
      this.refreshToken
    );
    
    return this.quickbooksInstance;
  }
  
  getQuickbooks() {
    if (!this.quickbooksInstance) {
      throw new Error('Quickbooks not authenticated. Call authenticate() first');
    }
    return this.quickbooksInstance;
  }

  /** Use documented report endpoints; community SDK aliases include retired routes. */
  async getReport(reportName: ReportName, params: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.accessToken || !this.accessTokenExpiry || this.accessTokenExpiry <= new Date()) {
      await this.authenticate();
    }
    const host = this.environment === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';
    const url = new URL(`/v3/company/${encodeURIComponent(this.realmId!)}/reports/${reportName}`, host);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    url.searchParams.set('minorversion', '75');
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) {
      // Do not include request headers or provider payloads in errors/logs.
      throw new Error(`QuickBooks report request failed (HTTP ${response.status}, intuit_tid: ${response.headers.get('intuit_tid') || 'unavailable'})`);
    }
    return response.json();
  }
}

export const quickbooksClient = new QuickbooksClient();
