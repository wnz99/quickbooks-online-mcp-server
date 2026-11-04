import { z } from "zod";
import { currencyRefSchema } from "./shared";

const invoiceLineItemSchema = z.object({
  tax_code_ref: z.string().min(1).optional().describe("QBO tax code ID, or TAX/NON for US companies"),
  service_date: z.string().optional().describe("Service date (YYYY-MM-DD)"),
  item_ref: z.string().min(1).describe("Item ID reference"),
  qty: z.number().positive().describe("Quantity"),
  unit_price: z.number().nonnegative().describe("Unit price"),
  description: z.string().optional().describe("Line item description"),
}).describe("Invoice line item");

export const createInvoiceSchema = z.object({
  linked_txn: z.array(z.object({ txn_id: z.string().min(1), txn_type: z.string().min(1) })).optional(),
  global_tax_calculation: z.enum(["TaxExcluded", "TaxInclusive", "NotApplicable"]).optional(),
  customer_memo: z.string().optional(),
  sales_term_ref: z.string().optional(),
  bill_email: z.string().optional(),
  exchange_rate: z.number().positive().optional(),
  customer_ref: z.string().min(1).describe("Customer ID to invoice"),
  line_items: z.array(invoiceLineItemSchema).min(1).describe("Line items for the invoice"),
  doc_number: z.string().optional().describe("Custom document number"),
  txn_date: z.string().optional().describe("Transaction date (YYYY-MM-DD)"),
  currency_ref: currencyRefSchema.optional().describe("Currency for this invoice (defaults to company home currency)"),
}).describe("Create a new invoice");

export const getInvoiceSchema = z.object({
  invoice_id: z.string().min(1).describe("QuickBooks invoice ID"),
});

export const updateInvoiceSchema = z.object({
  invoice_id: z.string().min(1).describe("QuickBooks invoice ID"),
  patch: z.record(z.string(), z.unknown()).describe("Fields to update on the invoice"),
});

export const deleteInvoiceSchema = z.object({
  idOrEntity: z.any().describe("Invoice ID or full entity to delete"),
});

export const searchInvoicesSchema = z.object({
  criteria: z.any().optional().describe("Search criteria for invoices"),
}).describe("Search invoices");
