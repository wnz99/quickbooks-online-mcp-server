import { z } from "zod";

export const getExchangeRateSchema = z.object({
  sourcecurrencycode: z.string().regex(/^[A-Z]{3}$/).describe("Source currency ISO 4217 code, e.g. EUR. Target is the company home currency."),
  asofdate: z.string().date().optional().describe("Optional historical date (YYYY-MM-DD). Omit for the current rate."),
});

export const updateExchangeRateSchema = z.object({
  exchangeRate: z.record(z.string(), z.unknown()).describe("ExchangeRate data with Id and SyncToken for update"),
});

