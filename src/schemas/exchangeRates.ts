import { z } from "zod";

export const getExchangeRateSchema = z.object({
  sourcecurrencycode: z.string().regex(/^[A-Z]{3}$/).optional().describe("Source currency ISO 4217 code, e.g. EUR. Target is the company home currency."),
  id: z.string().regex(/^[A-Z]{3}$/).optional().describe("Legacy alias for sourcecurrencycode; use an ISO currency code"),
  asofdate: z.string().date().optional().describe("Optional historical date (YYYY-MM-DD). Omit for the current rate."),
}).refine(args => Boolean(args.sourcecurrencycode || args.id), { message: "sourcecurrencycode is required" })
  .refine(args => !args.sourcecurrencycode || !args.id || args.sourcecurrencycode === args.id, { message: "Currency aliases must match" });

export const updateExchangeRateSchema = z.object({
  exchangeRate: z.record(z.string(), z.unknown()).describe("ExchangeRate data with Id and SyncToken for update"),
});

