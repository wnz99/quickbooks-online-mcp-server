import { z } from "zod";
import { paginationSchema } from "./shared";

export const createRefundReceiptSchema = z.object({
  refundReceipt: z.record(z.string(), z.unknown()).describe("RefundReceipt data object to create"),
});

export const getRefundReceiptSchema = z.object({
  id: z.string().describe("QuickBooks refund receipt ID"),
});

export const updateRefundReceiptSchema = z.object({
  refundReceipt: z.record(z.string(), z.unknown()).describe("RefundReceipt data with Id and SyncToken for update"),
});

export const deleteRefundReceiptSchema = z.object({
  idOrEntity: z.any().describe("RefundReceipt ID or full entity to delete"),
});

export const searchRefundReceiptsSchema = paginationSchema.describe("Search refund receipts with optional filters, pagination, and sorting");
