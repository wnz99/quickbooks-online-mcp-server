import type { FastMCP } from "fastmcp";
import {
  createInvoiceSchema,
  getInvoiceSchema,
  updateInvoiceSchema,
  deleteInvoiceSchema,
  searchInvoicesSchema,
} from "../schemas/invoices";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

// Primitive field type map (based on Quickbooks Invoice entity reference docs)
const invoiceFieldTypeMap: Record<string, "string" | "number" | "boolean"> = {
  DocNumber: "string",
  TxnDate: "string",
  PrivateNote: "string",
  GlobalTaxCalculation: "string",
  ApplyTaxAfterDiscount: "boolean",
  TotalAmt: "number",
};

/**
 * Coerce primitive invoice fields to the expected QuickBooks Online types.
 */
function normalizeInvoiceFields(obj: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = { ...obj };
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
  // ── create_invoice ───────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_invoice",
      description: "Create an invoice in QuickBooks Online.",
      parameters: createInvoiceSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const invoicePayload: any = {
            CustomerRef: { value: args.customer_ref },
            Line: args.line_items.map((l: any, idx: number) => ({
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

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createInvoice(normalizedPayload, (err: any, invoice: any) => {
              if (err) reject(err);
              else resolve(invoice);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_invoice ──────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_invoice",
      description: "Get an invoice by ID from QuickBooks Online.",
      parameters: getInvoiceSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getInvoice(args.invoice_id, (err: any, invoice: any) => {
              if (err) reject(err);
              else resolve(invoice);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_invoice ───────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_invoice",
      description: "Update an existing invoice in QuickBooks Online.",
      parameters: updateInvoiceSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          // Fetch existing invoice for SyncToken
          const existing: any = await new Promise((res, rej) => {
            (qbo as any).getInvoice(args.invoice_id, (e: any, inv: any) => (e ? rej(e) : res(inv)));
          });

          const updatePayload = { ...existing, ...args.patch, Id: args.invoice_id, sparse: true };

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateInvoice(updatePayload, (err: any, invoice: any) => {
              if (err) reject(err);
              else resolve(invoice);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_invoice ─────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "delete_invoice",
      description: "Delete an invoice from QuickBooks Online.",
      parameters: deleteInvoiceSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).deleteInvoice(args.idOrEntity, (err: any, invoice: any) => {
              if (err) reject(err);
              else resolve(invoice);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_invoices ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_invoices",
      description: "Search invoices in QuickBooks Online that match given criteria.",
      parameters: searchInvoicesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const searchCriteria = buildQuickbooksSearchCriteria(args.criteria || {});

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findInvoices(searchCriteria, (err: any, invoices: any) => {
              if (err) reject(err);
              else resolve(
                invoices?.QueryResponse?.Invoice ??
                invoices?.QueryResponse?.totalCount ??
                []
              );
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );
}
