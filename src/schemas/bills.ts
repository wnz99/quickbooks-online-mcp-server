import { z } from "zod";
import { currencyRefSchema, entityRefSchema, paginationSchema } from "./shared";

const billLineSchema = z.object({
  Amount: z.number().describe("Line amount"),
  DetailType: z.string().describe("Detail type (e.g., AccountBasedExpenseLineDetail)"),
  Description: z.string().describe("Line description"),
  AccountRef: entityRefSchema.describe("Account reference"),
}).describe("Bill line item");

export const createBillSchema = z.object({
  bill: z.object({
    Line: z.array(billLineSchema).describe("Bill line items"),
    VendorRef: entityRefSchema.describe("Vendor reference"),
    DueDate: z.string().describe("Due date (YYYY-MM-DD)"),
    Balance: z.number().describe("Balance amount"),
    TotalAmt: z.number().describe("Total amount"),
    CurrencyRef: currencyRefSchema.optional().describe("Currency for this bill (defaults to company home currency)"),
  }).describe("Bill data"),
});

export const getBillSchema = z.object({
  id: z.string().describe("QuickBooks bill ID"),
});

export const updateBillSchema = z.object({
  bill: z.object({
    Id: z.string().describe("Bill ID"),
    Line: z.array(billLineSchema).describe("Bill line items"),
    VendorRef: entityRefSchema.describe("Vendor reference"),
    DueDate: z.string().describe("Due date"),
    Balance: z.number().describe("Balance amount"),
    TotalAmt: z.number().describe("Total amount"),
    CurrencyRef: currencyRefSchema.optional().describe("Currency for this bill"),
  }).describe("Bill data with Id for update"),
});

export const deleteBillSchema = z.object({
  bill: z.object({
    Id: z.string().describe("Bill ID"),
    SyncToken: z.string().describe("Concurrency token"),
  }).describe("Bill identification for deletion"),
});

export const searchBillsSchema = paginationSchema.describe("Search bills with optional filters, pagination, and sorting");
