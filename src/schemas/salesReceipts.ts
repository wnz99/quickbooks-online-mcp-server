import { z } from "zod";
import { paginationSchema } from "./shared";

export const createSalesReceiptSchema = z.object({
  salesReceipt: z.record(z.string(), z.unknown()).describe("SalesReceipt data object to create"),
});

export const getSalesReceiptSchema = z.object({
  id: z.string().describe("QuickBooks sales receipt ID"),
});

export const updateSalesReceiptSchema = z.object({
  salesReceipt: z.record(z.string(), z.unknown()).describe("SalesReceipt data with Id and SyncToken for update"),
});

export const deleteSalesReceiptSchema = z.object({
  idOrEntity: z.any().describe("SalesReceipt ID or full entity to delete"),
});

export const searchSalesReceiptsSchema = paginationSchema.describe("Search sales receipts with optional filters, pagination, and sorting");
