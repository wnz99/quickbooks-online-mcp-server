import { z } from "zod";
import { paginationSchema } from "./shared";

export const getTaxRateSchema = z.object({
  id: z.string().describe("QuickBooks tax rate ID"),
});

export const updateTaxRateSchema = z.object({
  taxRate: z.record(z.string(), z.unknown()).describe("TaxRate data with Id and SyncToken for update"),
});

export const searchTaxRatesSchema = paginationSchema.describe("Search tax rates with optional filters, pagination, and sorting");
