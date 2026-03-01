import { z } from "zod";

export const getExchangeRateSchema = z.object({
  id: z.string().describe("QuickBooks exchange rate ID"),
});

export const updateExchangeRateSchema = z.object({
  exchangeRate: z.record(z.string(), z.unknown()).describe("ExchangeRate data with Id and SyncToken for update"),
});

