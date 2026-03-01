import { z } from "zod";
import { paginationSchema } from "./shared";

export const createAttachableSchema = z.object({
  attachable: z.record(z.string(), z.unknown()).describe("Attachable data object to create"),
});

export const getAttachableSchema = z.object({
  id: z.string().describe("QuickBooks attachable ID"),
});

export const updateAttachableSchema = z.object({
  attachable: z.record(z.string(), z.unknown()).describe("Attachable data with Id and SyncToken for update"),
});

export const deleteAttachableSchema = z.object({
  idOrEntity: z.any().describe("Attachable ID or full entity to delete"),
});

export const searchAttachablesSchema = paginationSchema.describe("Search attachables with optional filters, pagination, and sorting");
