import type { FastMCP } from "fastmcp";
import { z } from "zod";
import { registerTool } from "../utils/registerTool";
import { executeQbo } from "../utils/executeQbo";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { getQuickbooksInvoicePdf } from "../operations/invoicePdf";
import { unwrap } from "../operations/result";
import { writeToDisk } from "../utils/pdf";

export function registerAdditionalTools(server: FastMCP): void {
  registerTool(server, {
    name: "get_transfer", description: "Get a transfer by ID.",
    parameters: z.object({ id: z.string().min(1) }),
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_transfer", (qbo, args) => qboRequest(cb => qbo.getTransfer(args.id, cb))),
  });
  for (const entity of ["Item", "Employee"] as const) {
    const name = `delete_${entity.toLowerCase()}`;
    registerTool(server, {
      name, description: `Deactivate a QuickBooks ${entity.toLowerCase()}.`,
      parameters: z.object({ id: z.string().min(1) }),
      execute: executeQbo(name, async (qbo, args) => {
        const current = await qboRequest<Record<string, unknown>>(cb => qbo[`get${entity}`](args.id, cb));
        return qboRequest(cb => qbo[`update${entity}`]({ ...current, Active: false, sparse: true }, cb));
      }),
    });
  }
  registerTool(server, {
    name: "search_budgets", description: "Search read-only QBO budgets, including nested BudgetDetail.",
    parameters: z.object({ name: z.string().optional(), active: z.boolean().optional(), limit: z.number().int().positive().optional() }),
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_budgets", async (qbo, args) => {
      const filters = [];
      if (args.name !== undefined) filters.push({ field: "Name", value: args.name });
      if (args.active !== undefined) filters.push({ field: "Active", value: args.active });
      const criteria = buildQuickbooksSearchCriteria({ filters, limit: args.limit });
      const result = await qboRequest<QBQueryResponse>(cb => qbo.findBudgets(criteria, cb));
      return result?.QueryResponse?.Budget ?? [];
    }),
  });
  registerTool(server, {
    name: "get_invoice_pdf", description: "Download an invoice PDF as base64, or write inside QBO_PDF_OUTPUT_DIR. Existing files require overwrite=true.",
    parameters: z.object({ invoice_id: z.string().min(1), output_path: z.string().min(1).optional(), overwrite: z.boolean().default(false) }),
    execute: executeQbo("get_invoice_pdf", async (_qbo, args) => {
      const pdf = unwrap(await getQuickbooksInvoicePdf(args.invoice_id));
      if (!Buffer.isBuffer(pdf) || !pdf.length) throw new Error("QuickBooks returned no PDF bytes");
      if (!args.output_path) return { invoice_id: args.invoice_id, base64: pdf.toString("base64"), bytes: pdf.length };
      const written = writeToDisk(pdf, args.output_path, args.overwrite);
      if (!written.ok) throw new Error(written.error);
      return written;
    }),
  });
}
