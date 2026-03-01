import { z } from "zod";

export const searchCriteriaSchema = z.union([
  z.record(z.string(), z.unknown()).describe("Simple key-value filter"),
  z.object({
    filters: z.array(z.object({
      field: z.string().describe("Field name to filter on"),
      value: z.union([z.string(), z.number(), z.boolean()]).describe("Filter value"),
      operator: z.enum(["=", "LIKE", ">", "<", ">=", "<=", "!=", "IN"]).optional().describe("Comparison operator (default: =)")
    })).optional().describe("Array of field-level filters"),
    fetchAll: z.boolean().optional().describe("Fetch all results with automatic pagination"),
    offset: z.number().optional().describe("Pagination offset (starting position)"),
    limit: z.number().optional().describe("Maximum results to return"),
    count: z.boolean().optional().describe("Return count only"),
    desc: z.string().optional().describe("Field to sort descending"),
    asc: z.string().optional().describe("Field to sort ascending")
  }).describe("Advanced search with filters, pagination, and sorting")
]).describe("Search criteria — simple object or advanced options");

export const entityRefSchema = z.object({
  value: z.string().describe("Entity ID"),
  name: z.string().optional().describe("Entity display name"),
}).describe("Reference to another QuickBooks entity");

export const addressSchema = z.object({
  Line1: z.string().optional().describe("Street address line 1"),
  City: z.string().optional().describe("City"),
  Country: z.string().optional().describe("Country"),
  CountrySubDivisionCode: z.string().optional().describe("State/province code"),
  PostalCode: z.string().optional().describe("Postal/ZIP code"),
}).describe("Mailing or billing address");

export const paginationSchema = z.object({
  criteria: z.array(z.any()).optional().describe("Filters to apply"),
  limit: z.number().optional().describe("Maximum results to return"),
  offset: z.number().optional().describe("Pagination offset"),
  asc: z.string().optional().describe("Field to sort ascending"),
  desc: z.string().optional().describe("Field to sort descending"),
  fetchAll: z.boolean().optional().describe("Fetch all results with automatic pagination"),
  count: z.boolean().optional().describe("Return count only"),
}).describe("Search with optional pagination and sorting");
