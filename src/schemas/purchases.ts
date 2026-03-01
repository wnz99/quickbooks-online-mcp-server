import { z } from "zod";
import { paginationSchema } from "./shared";

export const createPurchaseSchema = z.object({
  purchase: z.record(z.string(), z.unknown()).describe("Purchase data object to create"),
});

export const getPurchaseSchema = z.object({
  id: z.string().describe("QuickBooks purchase ID"),
});

export const updatePurchaseSchema = z.object({
  purchase: z.record(z.string(), z.unknown()).describe("Purchase data with Id and SyncToken for update"),
});

export const deletePurchaseSchema = z.object({
  idOrEntity: z.any().describe("Purchase ID or full entity to delete"),
});

export const searchPurchasesSchema = paginationSchema.describe("Search purchases with optional filters, pagination, and sorting");
