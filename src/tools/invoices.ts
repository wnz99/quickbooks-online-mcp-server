import type { FastMCP } from "fastmcp";
import {
  createInvoiceSchema,
  getInvoiceSchema,
  updateInvoiceSchema,
  deleteInvoiceSchema,
  searchInvoicesSchema,
} from "../schemas/invoices";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

const invoiceFieldTypeMap: Record<string, "string" | "number" | "boolean"> = {
  DocNumber: "string",
  TxnDate: "string",
  PrivateNote: "string",
  GlobalTaxCalculation: "string",
  ApplyTaxAfterDiscount: "boolean",
  TotalAmt: "number",
};

function normalizeInvoiceFields(obj: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...obj };
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const expected = invoiceFieldTypeMap[key];
    if (!expected) continue;

    switch (expected) {
      case "string":
        normalized[key] = String(value);
        break;
      case "number":
        normalized[key] = typeof value === "number" ? value : Number(value);
        break;
      case "boolean":
        normalized[key] = typeof value === "boolean" ? value : value === "true";
        break;
    }
  }
  return normalized;
}

export function registerInvoiceTools(server: FastMCP) {
  server.addTool({
    name: "create_invoice",
    description: "Create an invoice in QuickBooks Online.",
    parameters: createInvoiceSchema,
    execute: executeQbo("create_invoice", (qbo, args) => {
      const invoicePayload: Record<string, unknown> = {
        CustomerRef: { value: args.customer_ref },
        Line: args.line_items.map((l, idx) => ({
          Id: `${idx + 1}`,
          LineNum: idx + 1,
          Description: l.description || undefined,
          Amount: l.qty * l.unit_price,
          DetailType: "SalesItemLineDetail",
          SalesItemLineDetail: {
            ItemRef: { value: l.item_ref },
            Qty: l.qty,
            UnitPrice: l.unit_price,
          },
        })),
        DocNumber: args.doc_number,
        TxnDate: args.txn_date,
      };
      const normalizedPayload = normalizeInvoiceFields(invoicePayload);
      return qboRequest(cb => qbo.createInvoice(normalizedPayload, cb));
    }),
  });

  server.addTool({
    name: "get_invoice",
    description: "Get an invoice by ID from QuickBooks Online.",
    parameters: getInvoiceSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_invoice", (qbo, args) =>
      qboRequest(cb => qbo.getInvoice(args.invoice_id, cb))
    ),
  });

  server.addTool({
    name: "update_invoice",
    description: "Update an existing invoice in QuickBooks Online.",
    parameters: updateInvoiceSchema,
    execute: executeQbo("update_invoice", async (qbo, args) => {
      const existing = await qboRequest<Record<string, unknown>>(cb => qbo.getInvoice(args.invoice_id, cb));
      const updatePayload = { ...existing, ...args.patch, Id: args.invoice_id, sparse: true };
      return qboRequest(cb => qbo.updateInvoice(updatePayload, cb));
    }),
  });

  server.addTool({
    name: "delete_invoice",
    description: "Delete an invoice from QuickBooks Online.",
    parameters: deleteInvoiceSchema,
    execute: executeQbo("delete_invoice", (qbo, args) =>
      qboRequest(cb => qbo.deleteInvoice(args.idOrEntity, cb))
    ),
  });

  server.addTool({
    name: "search_invoices",
    description: "Search invoices in QuickBooks Online that match given criteria.",
    parameters: searchInvoicesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_invoices", async (qbo, args) => {
      const searchCriteria = buildQuickbooksSearchCriteria(args.criteria || {});
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findInvoices(searchCriteria, cb));
      return response?.QueryResponse?.Invoice ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
