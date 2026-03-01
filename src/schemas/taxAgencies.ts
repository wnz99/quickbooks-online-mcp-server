import { z } from "zod";
import { paginationSchema } from "./shared";

export const createTaxAgencySchema = z.object({
  taxAgency: z.record(z.string(), z.unknown()).describe("TaxAgency data object to create"),
});

export const getTaxAgencySchema = z.object({
  id: z.string().describe("QuickBooks tax agency ID"),
});

export const updateTaxAgencySchema = z.object({
  taxAgency: z.record(z.string(), z.unknown()).describe("TaxAgency data with Id and SyncToken for update"),
});

export const searchTaxAgenciesSchema = paginationSchema.describe("Search tax agencys with optional filters, pagination, and sorting");
