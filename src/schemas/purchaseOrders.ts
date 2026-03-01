import { z } from "zod";
import { paginationSchema } from "./shared";

export const createPurchaseOrderSchema = z.object({
  purchaseOrder: z.record(z.string(), z.unknown()).describe("PurchaseOrder data object to create"),
});

export const getPurchaseOrderSchema = z.object({
  id: z.string().describe("QuickBooks purchase order ID"),
});

export const updatePurchaseOrderSchema = z.object({
  purchaseOrder: z.record(z.string(), z.unknown()).describe("PurchaseOrder data with Id and SyncToken for update"),
});

export const deletePurchaseOrderSchema = z.object({
  idOrEntity: z.any().describe("PurchaseOrder ID or full entity to delete"),
});

export const searchPurchaseOrdersSchema = paginationSchema.describe("Search purchase orders with optional filters, pagination, and sorting");
