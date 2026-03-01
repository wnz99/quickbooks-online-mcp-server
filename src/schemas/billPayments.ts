import { z } from "zod";
import { paginationSchema } from "./shared";

export const createBillPaymentSchema = z.object({
  billPayment: z.record(z.string(), z.unknown()).describe("Bill payment data object to create"),
});

export const getBillPaymentSchema = z.object({
  id: z.string().describe("QuickBooks bill payment ID"),
});

export const updateBillPaymentSchema = z.object({
  billPayment: z.record(z.string(), z.unknown()).describe("Bill payment data with Id and SyncToken for update"),
});

export const deleteBillPaymentSchema = z.object({
  idOrEntity: z.any().describe("Bill payment ID or full entity to delete"),
});

export const searchBillPaymentsSchema = paginationSchema.describe("Search bill payments with optional filters, pagination, and sorting");
