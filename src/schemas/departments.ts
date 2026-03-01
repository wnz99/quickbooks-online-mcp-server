import { z } from "zod";
import { paginationSchema } from "./shared";

export const createDepartmentSchema = z.object({
  department: z.record(z.string(), z.unknown()).describe("Department data object to create"),
});

export const getDepartmentSchema = z.object({
  id: z.string().describe("QuickBooks department ID"),
});

export const updateDepartmentSchema = z.object({
  department: z.record(z.string(), z.unknown()).describe("Department data with Id and SyncToken for update"),
});

export const searchDepartmentsSchema = paginationSchema.describe("Search departments with optional filters, pagination, and sorting");
