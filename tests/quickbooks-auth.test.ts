import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), exchange: vi.fn() }));
vi.mock('intuit-oauth', () => ({ default: class {
  static scopes = { Accounting: 'accounting' };
  authorizeUri({ state }: { state: string }) { return `https://intuit.test/authorize?state=${state}`; }
  refreshUsingToken = mocks.refresh;
  createToken = mocks.exchange;
} }));
import { QuickbooksClient } from '../src/clients/quickbooksClient';
import { reportSchema } from '../src/schemas/reports';

describe('QuickBooks connection safety', () => {
  let directory: string;
  let tokenFile: string;
  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qbo-auth-test-'));
    tokenFile = path.join(directory, 'tokens.json');
    vi.stubEnv('QUICKBOOKS_CLIENT_ID', 'test-client');
    vi.stubEnv('QUICKBOOKS_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('QUICKBOOKS_REFRESH_TOKEN', 'old-token');
    vi.stubEnv('QUICKBOOKS_REALM_ID', 'deasy-realm');
    vi.stubEnv('QUICKBOOKS_TOKEN_FILE', tokenFile);
    vi.stubEnv('QUICKBOOKS_ENVIRONMENT', 'production');
    mocks.refresh.mockReset();
    mocks.exchange.mockReset();
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); fs.rmSync(directory, { recursive: true, force: true }); });

  it('coalesces simultaneous refreshes and restores the rotated token after restart', async () => {
    mocks.refresh.mockResolvedValue({ token: { access_token: 'access', refresh_token: 'rotated', expires_in: 3600 } });
    const client = new QuickbooksClient();
    await Promise.all([client.refreshAccessToken(), client.refreshAccessToken()]);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fs.readFileSync(tokenFile, 'utf8'))).toEqual({ refreshToken: 'rotated', realmId: 'deasy-realm' });
    expect(fs.statSync(tokenFile).mode & 0o777).toBe(0o600);
    await new QuickbooksClient().refreshAccessToken();
    expect(mocks.refresh).toHaveBeenLastCalledWith('rotated');
  });

  it('rejects invalid state, replay, and switching the configured company', async () => {
    const client = new QuickbooksClient();
    await expect(client.handleOAuthCallback('https://app.test/callback?state=forged&realmId=deasy-realm')).rejects.toThrow('state');
    const state = new URL(client.getAuthorizationUrl()).searchParams.get('state');
    await expect(client.handleOAuthCallback(`https://app.test/callback?state=${state}&realmId=other-realm`)).rejects.toThrow('company');
    await expect(client.handleOAuthCallback(`https://app.test/callback?state=${state}&realmId=deasy-realm`)).rejects.toThrow('state');
    expect(mocks.exchange).not.toHaveBeenCalled();
  });

  it('persists a successful authorization without logging credentials', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      mocks.exchange.mockResolvedValue({ token: { access_token: 'new-access-secret', refresh_token: 'new-refresh-secret', expires_in: 3600 } });
      const client = new QuickbooksClient();
      const state = new URL(client.getAuthorizationUrl()).searchParams.get('state');
      await client.handleOAuthCallback(`https://app.test/callback?state=${state}&realmId=deasy-realm&code=test-code`);
      expect(JSON.parse(fs.readFileSync(tokenFile, 'utf8')).refreshToken).toBe('new-refresh-secret');
      expect(JSON.stringify(log.mock.calls)).not.toContain('new-refresh-secret');
      expect(JSON.stringify(log.mock.calls)).not.toContain('new-access-secret');
    } finally { log.mockRestore(); }
  });

  it('keeps the company pin when the local launcher forces reauthorization', async () => {
    const client = new QuickbooksClient();
    vi.spyOn(client as unknown as { startOAuthFlow(): Promise<void> }, 'startOAuthFlow').mockResolvedValue();
    await client.forceOAuthFlow();
    const state = new URL(client.getAuthorizationUrl()).searchParams.get('state');
    await expect(client.handleOAuthCallback(`https://app.test/callback?state=${state}&realmId=other-realm`)).rejects.toThrow('company');
    expect(mocks.exchange).not.toHaveBeenCalled();
  });

  it.each([
    ['GeneralLedger', 'GeneralLedger'], ['CustomerSales', 'SalesByCustomer'],
  ])('routes %s to the documented %s report and preserves modern response structure', async (inputName, endpoint) => {
    mocks.refresh.mockResolvedValue({ token: { access_token: 'test-access', refresh_token: 'rotated', expires_in: 3600 } });
    // Modern reports nest child accounts, use empty strings, and keep empty
    // enclosing rows typed as Section. Consumers must receive that JSON intact.
    const report = { Header: { ReportName: endpoint, StartPeriod: '2025-01-01', EndPeriod: '2025-12-23' },
      Columns: { Column: [{ ColTitle: 'Account' }, { ColTitle: 'Total' }] },
      Rows: { Row: [{ type: 'Section', Rows: { Row: [{ type: 'Data', ColData: [{ value: 'Child account' }, { value: '' }] }] } }, { type: 'Section' }] } };
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(report), { status: 200 }));
    vi.stubGlobal('fetch', request);
    const args = reportSchema.parse({ reportType: inputName, params: { start_date: '2025-01-01', end_date: '2025-12-23', accounting_method: 'Accrual' } });
    expect(await new QuickbooksClient().getReport(args.reportType, args.params)).toEqual(report);
    const url = new URL(String(request.mock.calls[0][0]));
    expect(url.origin).toBe('https://quickbooks.api.intuit.com');
    expect(url.pathname).toBe(`/v3/company/deasy-realm/reports/${endpoint}`);
    expect(url.searchParams.get('end_date')).toBe('2025-12-23');
    expect(url.searchParams.get('minorversion')).toBe('75');
    expect(request.mock.calls[0][1].headers.Authorization).toBe('Bearer test-access');
  });

  it('rejects retired report parameters and reports HTTP errors without provider secrets', async () => {
    expect(reportSchema.safeParse({ reportType: 'ProfitAndLoss', params: { group_by: 'Customer' } }).success).toBe(false);
    expect(reportSchema.safeParse({ reportType: 'TrialBalance', params: { qzurl: true } }).success).toBe(false);
    expect(reportSchema.safeParse({ reportType: 'TrialBalanceFR' }).success).toBe(false);
    expect(reportSchema.safeParse({ reportType: 'TransactionList', params: { group_by: 'Customer' } }).success).toBe(true);
    mocks.refresh.mockResolvedValue({ token: { access_token: 'test-access', expires_in: 3600 } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('provider-secret', { status: 429, headers: { intuit_tid: 'test-trace' } })));
    await expect(new QuickbooksClient().getReport('TrialBalance')).rejects.toThrow('HTTP 429, intuit_tid: test-trace');
  });
});
