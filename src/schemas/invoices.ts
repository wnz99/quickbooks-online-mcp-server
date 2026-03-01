import { z } from "zod";

const invoiceLineItemSchema = z.object({
  item_ref: z.string().min(1).describe("Item ID reference"),
  qty: z.number().positive().describe("Quantity"),
  unit_price: z.number().nonnegative().describe("Unit price"),
  description: z.string().optional().describe("Line item description"),
}).describe("Invoice line item");

export const createInvoiceSchema = z.object({
  customer_ref: z.string().min(1).describe("Customer ID to invoice"),
  line_items: z.array(invoiceLineItemSchema).min(1).describe("Line items for the invoice"),
  doc_number: z.string().optional().describe("Custom document number"),
  txn_date: z.string().optional().describe("Transaction date (YYYY-MM-DD)"),
}).describe("Create a new invoice");

export const getInvoiceSchema = z.object({
  invoice_id: z.string().min(1).describe("QuickBooks invoice ID"),
});

export const updateInvoiceSchema = z.object({
  invoice_id: z.string().min(1).describe("QuickBooks invoice ID"),
  patch: z.record(z.any()).describe("Fields to update on the invoice"),
});

export const deleteInvoiceSchema = z.object({
  idOrEntity: z.any().describe("Invoice ID or full entity to delete"),
});

export const searchInvoicesSchema = z.object({
  criteria: z.any().describe("Search criteria for invoices"),
}).describe("Search invoices");
