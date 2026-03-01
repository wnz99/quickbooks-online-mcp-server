import { z } from "zod";
import { paginationSchema } from "./shared";

export const createPaymentMethodSchema = z.object({
  paymentMethod: z.record(z.string(), z.unknown()).describe("PaymentMethod data object to create"),
});

export const getPaymentMethodSchema = z.object({
  id: z.string().describe("QuickBooks payment method ID"),
});

export const updatePaymentMethodSchema = z.object({
  paymentMethod: z.record(z.string(), z.unknown()).describe("PaymentMethod data with Id and SyncToken for update"),
});

export const searchPaymentMethodsSchema = paginationSchema.describe("Search payment methods with optional filters, pagination, and sorting");
