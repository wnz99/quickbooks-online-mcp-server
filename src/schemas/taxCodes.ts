import { z } from "zod";
import { paginationSchema } from "./shared";

export const getTaxCodeSchema = z.object({
  id: z.string().describe("QuickBooks tax code ID"),
});

export const updateTaxCodeSchema = z.object({
  taxCode: z.record(z.string(), z.unknown()).describe("TaxCode data with Id and SyncToken for update"),
});

export const searchTaxCodesSchema = paginationSchema.describe("Search tax codes with optional filters, pagination, and sorting");
