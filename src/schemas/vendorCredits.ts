import { z } from "zod";
import { paginationSchema } from "./shared";

export const createVendorCreditSchema = z.object({
  vendorCredit: z.record(z.string(), z.unknown()).describe("VendorCredit data object to create"),
});

export const getVendorCreditSchema = z.object({
  id: z.string().describe("QuickBooks vendor credit ID"),
});

export const updateVendorCreditSchema = z.object({
  vendorCredit: z.record(z.string(), z.unknown()).describe("VendorCredit data with Id and SyncToken for update"),
});

export const deleteVendorCreditSchema = z.object({
  idOrEntity: z.any().describe("VendorCredit ID or full entity to delete"),
});

export const searchVendorCreditsSchema = paginationSchema.describe("Search vendor credits with optional filters, pagination, and sorting");
