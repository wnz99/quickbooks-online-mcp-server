import { z } from "zod";
import { addressSchema, paginationSchema } from "./shared";

export const createVendorSchema = z.object({
  vendor: z.object({
    DisplayName: z.string().describe("Display name (required)"),
    GivenName: z.string().optional().describe("First name"),
    FamilyName: z.string().optional().describe("Last name"),
    CompanyName: z.string().optional().describe("Company name"),
    PrimaryEmailAddr: z.object({
      Address: z.string().optional().describe("Email address"),
    }).optional().describe("Primary email"),
    PrimaryPhone: z.object({
      FreeFormNumber: z.string().optional().describe("Phone number"),
    }).optional().describe("Primary phone"),
    BillAddr: addressSchema.optional().describe("Billing address"),
  }).describe("Vendor data"),
});

export const getVendorSchema = z.object({
  id: z.string().describe("QuickBooks vendor ID"),
});

export const updateVendorSchema = z.object({
  vendor: z.object({
    Id: z.string().describe("Vendor ID"),
    SyncToken: z.string().describe("Concurrency token"),
    DisplayName: z.string().describe("Display name"),
    GivenName: z.string().optional().describe("First name"),
    FamilyName: z.string().optional().describe("Last name"),
    CompanyName: z.string().optional().describe("Company name"),
    PrimaryEmailAddr: z.object({
      Address: z.string().optional().describe("Email address"),
    }).optional().describe("Primary email"),
    PrimaryPhone: z.object({
      FreeFormNumber: z.string().optional().describe("Phone number"),
    }).optional().describe("Primary phone"),
    BillAddr: addressSchema.optional().describe("Billing address"),
  }).describe("Vendor data with Id and SyncToken for update"),
});

export const deleteVendorSchema = z.object({
  vendor: z.object({
    Id: z.string().describe("Vendor ID"),
    SyncToken: z.string().describe("Concurrency token"),
  }).describe("Vendor identification for deletion"),
});

export const searchVendorsSchema = paginationSchema.describe("Search vendors with optional filters, pagination, and sorting");
