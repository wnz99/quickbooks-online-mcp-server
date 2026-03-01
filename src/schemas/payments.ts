import { z } from "zod";
import { paginationSchema } from "./shared";

export const createPaymentSchema = z.object({
  payment: z.record(z.string(), z.unknown()).describe("Payment data object to create"),
});

export const getPaymentSchema = z.object({
  id: z.string().describe("QuickBooks payment ID"),
});

export const updatePaymentSchema = z.object({
  payment: z.record(z.string(), z.unknown()).describe("Payment data with Id and SyncToken for update"),
});

export const deletePaymentSchema = z.object({
  idOrEntity: z.any().describe("Payment ID or full entity to delete"),
});

export const searchPaymentsSchema = paginationSchema.describe("Search payments with optional filters, pagination, and sorting");
