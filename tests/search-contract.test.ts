import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import QuickBooks from 'node-quickbooks';
import type { FastMCP } from 'fastmcp';
import type { ZodType } from 'zod';
import { buildQuickbooksSearchCriteria } from '../src/utils/search';
import { registerVendorTools } from '../src/tools/vendors';
import { registerCustomerTools } from '../src/tools/customers';
import { registerAccountTools } from '../src/tools/accounts';
import { quickbooksClient } from '../src/clients/quickbooksClient';

describe('search through the installed QuickBooks SDK', () => {
  let server: http.Server;
  let qbo: QuickBooks;
  const queries: string[] = [];
  type Tool = { name: string; parameters: ZodType; execute(args: unknown): Promise<string> };
  const tools = new Map<string, Tool>();
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const query = new URL(req.url!, 'http://localhost').searchParams.get('query') || '';
      queries.push(query);
      const offset = Number(query.match(/startposition (\d+)/)?.[1] || 1);
      const entity = query.includes('customer') ? 'Customer' : query.includes('account') ? 'Account' : 'Vendor';
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ QueryResponse: query.includes('count(*)')
        ? { totalCount: 3 }
        : { [entity]: [{ Id: String(offset) }], maxResults: offset === 1 ? 1 : 0 } }));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    qbo = new QuickBooks('test-client', 'test-secret', 'test-access', false, 'test-realm', true, false, 75, '2.0', 'test-refresh');
    Object.assign(qbo, { endpoint: `http://127.0.0.1:${(server.address() as AddressInfo).port}/v3/company/` });
    vi.spyOn(quickbooksClient, 'authenticate').mockResolvedValue(qbo);
    vi.spyOn(quickbooksClient, 'getQuickbooks').mockReturnValue(qbo);
    const registry = { addTool(tool: Tool) { tools.set(tool.name, tool); } } as unknown as FastMCP;
    registerVendorTools(registry);
    registerCustomerTools(registry);
    registerAccountTools(registry);
  });
  afterAll(async () => {
    vi.restoreAllMocks();
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  });

  async function run(name: string, input: unknown) {
    queries.length = 0;
    const tool = tools.get(name)!;
    return JSON.parse(await tool.execute(tool.parameters.parse(input)));
  }

  it('keeps vendor filters when paging, sorting, and fetching all pages', async () => {
    const result = await run('search_vendors', {
      criteria: [{ field: 'DisplayName', value: 'Target', operator: 'LIKE' }],
      limit: 1, offset: 1, asc: 'DisplayName', fetchAll: true,
    });
    expect(result.success).toBe(true);
    expect(queries).toHaveLength(2);
    expect(queries[0]).toBe("select * from vendor where DisplayName LIKE 'Target' orderby DisplayName asc startposition 1 maxresults 1");
    expect(queries[1]).toContain("where DisplayName LIKE 'Target'");
    expect(queries[1]).toContain('startposition 2');
  });

  it('counts only matching vendors without losing adjacent filters or options', async () => {
    const result = await run('search_vendors', {
      criteria: [{ field: 'DisplayName', value: 'Target' }, { field: 'Active', value: true }], count: true, limit: 10,
    });
    expect(result).toEqual({ success: true, result: 3 });
    expect(queries).toEqual(["select count(*) from vendor where DisplayName = 'Target' and Active = true startposition 1 maxresults 10"]);
  });

  it('keeps filters when callers provide no pagination options', async () => {
    const result = await run('search_vendors', { criteria: [{ field: 'DisplayName', value: 'Target' }] });
    expect(result.success).toBe(true);
    expect(queries[0]).toBe("select * from vendor where DisplayName = 'Target' startposition 1 maxresults 1000");
  });

  it('keeps legacy customer key/value filters together with pagination', async () => {
    const result = await run('search_customers', { criteria: [{ key: 'DisplayName', value: 'Target' }], limit: 10 });
    expect(result.success).toBe(true);
    expect(queries[0]).toBe("select * from customer where DisplayName = 'Target' startposition 1 maxresults 10");
  });

  it('supports direct simple/advanced criteria and rejects removed ID sorting', () => {
    expect(buildQuickbooksSearchCriteria({ DisplayName: 'Target', limit: 10 })).toEqual([
      { field: 'DisplayName', value: 'Target' }, { field: 'limit', value: 10 },
    ]);
    expect(buildQuickbooksSearchCriteria({ filters: [{ field: 'Active', value: false }] })).toEqual([{ field: 'Active', value: false }]);
    expect(() => buildQuickbooksSearchCriteria([{ field: 'desc', value: 'Id' }])).toThrow('sorting by Id');
    expect(() => buildQuickbooksSearchCriteria({ asc: 'Id' })).toThrow('sorting by Id');
  });

  it.each([
    [{ Id: ['1', '2'] }, "select * from account where Id IN ('1','2') startposition 1 maxresults 1000"],
    [{ field: 'Name', value: 'Target', operator: 'LIKE' }, "select * from account where Name LIKE 'Target' startposition 1 maxresults 1000"],
  ])('preserves SDK simple filter semantics for %j', async (criteria, expectedQuery) => {
    const result = await run('search_accounts', { criteria });
    expect(result.success).toBe(true);
    expect(queries).toEqual([expectedQuery]);
  });
});
