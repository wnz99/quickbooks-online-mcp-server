import { z } from "zod";
import { paginationSchema } from "./shared";

export const createTermSchema = z.object({
  term: z.record(z.string(), z.unknown()).describe("Term data object to create"),
});

export const getTermSchema = z.object({
  id: z.string().describe("QuickBooks term ID"),
});

export const updateTermSchema = z.object({
  term: z.record(z.string(), z.unknown()).describe("Term data with Id and SyncToken for update"),
});

export const searchTermsSchema = paginationSchema.describe("Search terms with optional filters, pagination, and sorting");
