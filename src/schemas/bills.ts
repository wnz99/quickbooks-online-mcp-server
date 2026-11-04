import { z } from "zod";
import { currencyRefSchema, entityRefSchema, paginationSchema } from "./shared";

const billLineSchema = z.object({
  Id: z.string().optional(),
  Amount: z.number().describe("Line amount"),
  DetailType: z.string().optional().default("AccountBasedExpenseLineDetail").describe("Detail type"),
  Description: z.string().optional().describe("Line description"),
  AccountBasedExpenseLineDetail: z.object({
    AccountRef: entityRefSchema.describe("Expense account reference"),
    ClassRef: entityRefSchema.optional(),
    TaxCodeRef: entityRefSchema.optional(),
    CustomerRef: entityRefSchema.optional(),
    BillableStatus: z.string().optional(),
  }).passthrough().optional().describe("Account-based expense detail"),
  ItemBasedExpenseLineDetail: z.object({
    ItemRef: entityRefSchema,
    Qty: z.number().optional(),
    UnitPrice: z.number().optional(),
    ClassRef: entityRefSchema.optional(),
    TaxCodeRef: entityRefSchema.optional(),
    CustomerRef: entityRefSchema.optional(),
    BillableStatus: z.string().optional(),
  }).passthrough().optional(),
}).passthrough().describe("Bill line item; DetailType must match the supplied expense detail");

export const createBillSchema = z.object({
  bill: z.object({
    Line: z.array(billLineSchema).describe("Bill line items"),
    VendorRef: entityRefSchema.describe("Vendor reference"),
    DueDate: z.string().optional().describe("Due date (YYYY-MM-DD)"),
    TxnDate: z.string().optional().describe("Transaction date (YYYY-MM-DD)"),
    CurrencyRef: currencyRefSchema.optional().describe("Currency for this bill (defaults to company home currency)"),
    ExchangeRate: z.number().optional().describe("Exchange rate for foreign currency bills"),
    APAccountRef: entityRefSchema.optional().describe("Accounts Payable account reference (required for multi-currency bills)"),
    DocNumber: z.string().optional(),
    PrivateNote: z.string().optional(),
  }).passthrough().describe("Bill data"),
});

export const getBillSchema = z.object({
  id: z.string().describe("QuickBooks bill ID"),
});

export const updateBillSchema = z.object({
  bill: z.object({
    Id: z.string().describe("Bill ID"),
    SyncToken: z.string().describe("Concurrency token"),
    Line: z.array(billLineSchema).optional().describe("Bill line items"),
    VendorRef: entityRefSchema.optional().describe("Vendor reference"),
    DueDate: z.string().optional().describe("Due date (YYYY-MM-DD)"),
    TxnDate: z.string().optional().describe("Transaction date (YYYY-MM-DD)"),
    CurrencyRef: currencyRefSchema.optional().describe("Currency for this bill"),
    ExchangeRate: z.number().optional().describe("Exchange rate for foreign currency bills"),
    APAccountRef: entityRefSchema.optional().describe("Accounts Payable account reference"),
    DocNumber: z.string().optional(),
    PrivateNote: z.string().optional(),
  }).passthrough().describe("Bill data with Id and SyncToken for update"),
});

export const deleteBillSchema = z.object({
  bill: z.object({
    Id: z.string().describe("Bill ID"),
    SyncToken: z.string().describe("Concurrency token"),
  }).describe("Bill identification for deletion"),
});

export const searchBillsSchema = paginationSchema.describe("Search bills with optional filters, pagination, and sorting");
