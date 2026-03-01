import { z } from "zod";
import { paginationSchema } from "./shared";

export const createTimeActivitySchema = z.object({
  timeActivity: z.record(z.string(), z.unknown()).describe("TimeActivity data object to create"),
});

export const getTimeActivitySchema = z.object({
  id: z.string().describe("QuickBooks time activity ID"),
});

export const updateTimeActivitySchema = z.object({
  timeActivity: z.record(z.string(), z.unknown()).describe("TimeActivity data with Id and SyncToken for update"),
});

export const deleteTimeActivitySchema = z.object({
  idOrEntity: z.any().describe("TimeActivity ID or full entity to delete"),
});

export const searchTimeActivitiesSchema = paginationSchema.describe("Search time activitys with optional filters, pagination, and sorting");
