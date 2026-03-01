import { z } from "zod";
import { paginationSchema } from "./shared";

export const createEmployeeSchema = z.object({
  employee: z.record(z.string(), z.unknown()).describe("Employee data object to create"),
});

export const getEmployeeSchema = z.object({
  id: z.string().describe("QuickBooks employee ID"),
});

export const updateEmployeeSchema = z.object({
  employee: z.record(z.string(), z.unknown()).describe("Employee data with Id and SyncToken for update"),
});

export const searchEmployeesSchema = paginationSchema.describe("Search employees with optional filters, pagination, and sorting");
