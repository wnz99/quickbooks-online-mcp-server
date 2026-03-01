import { z } from "zod";
import { paginationSchema } from "./shared";

export const createEstimateSchema = z.object({
  estimate: z.record(z.string(), z.unknown()).describe("Estimate data object to create"),
});

export const getEstimateSchema = z.object({
  id: z.string().describe("QuickBooks estimate ID"),
});

export const updateEstimateSchema = z.object({
  estimate: z.record(z.string(), z.unknown()).describe("Estimate data with Id and SyncToken for update"),
});

export const deleteEstimateSchema = z.object({
  idOrEntity: z.any().describe("Estimate ID or full entity to delete"),
});

export const searchEstimatesSchema = paginationSchema.describe("Search estimates with optional filters, pagination, and sorting");
