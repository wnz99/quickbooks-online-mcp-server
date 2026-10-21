import { afterEach, expect, it, vi } from 'vitest';
import type { FastMCP } from 'fastmcp';
import type QuickBooks from 'node-quickbooks';
import type { ZodType } from 'zod';
import { registerExchangeRateTools } from '../src/tools/exchangeRates';
import { quickbooksClient } from '../src/clients/quickbooksClient';

afterEach(() => vi.restoreAllMocks());

it('passes currency/date options to the SDK instead of an exchange-rate ID', async () => {
  const getExchangeRate = vi.fn((_options, callback) => callback(null, { ExchangeRate: { Rate: 0.85 } }));
  const qbo = { getExchangeRate } as unknown as QuickBooks;
  vi.spyOn(quickbooksClient, 'authenticate').mockResolvedValue(qbo);
  vi.spyOn(quickbooksClient, 'getQuickbooks').mockReturnValue(qbo);
  type Tool = { name: string; parameters: ZodType; execute(args: unknown): Promise<string> };
  const tools = new Map<string, Tool>();
  registerExchangeRateTools({ addTool(tool: Tool) { tools.set(tool.name, tool); } } as unknown as FastMCP);
  const tool = tools.get('get_exchange_rate')!;
  const args = tool.parameters.parse({ sourcecurrencycode: 'EUR', asofdate: '2025-12-23' });
  const response = JSON.parse(await tool.execute(args));
  expect(response.success).toBe(true);
  expect(getExchangeRate.mock.calls[0][0]).toEqual({ sourcecurrencycode: 'EUR', asofdate: '2025-12-23' });
  expect(tool.parameters.safeParse({ id: 'EUR' }).success).toBe(false);
  expect(tool.parameters.safeParse({ sourcecurrencycode: 'EUR', asofdate: '2025-02-30' }).success).toBe(false);
});
