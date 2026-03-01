import { z } from "zod";
import { paginationSchema } from "./shared";

export const createCustomerSchema = z.object({
  customer: z.record(z.string(), z.unknown()).describe("Customer data object to create in QuickBooks"),
});

export const getCustomerSchema = z.object({
  id: z.string().describe("QuickBooks customer ID"),
});

export const updateCustomerSchema = z.object({
  customer: z.record(z.string(), z.unknown()).describe("Customer data with Id and SyncToken for update"),
});

export const deleteCustomerSchema = z.object({
  idOrEntity: z.any().describe("Customer ID or full customer entity object to delete/deactivate"),
});

export const searchCustomersSchema = paginationSchema.describe("Search customers with optional filters, pagination, and sorting");
