import { z } from "zod";
import { paginationSchema } from "./shared";

export const createClassSchema = z.object({
  classEntity: z.record(z.string(), z.unknown()).describe("Class data object to create"),
});

export const getClassSchema = z.object({
  id: z.string().describe("QuickBooks class ID"),
});

export const updateClassSchema = z.object({
  classEntity: z.record(z.string(), z.unknown()).describe("Class data with Id and SyncToken for update"),
});

export const searchClassesSchema = paginationSchema.describe("Search classs with optional filters, pagination, and sorting");
