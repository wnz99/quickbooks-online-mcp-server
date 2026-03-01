import type { FastMCP } from "fastmcp";
import {
  createPaymentSchema,
  getPaymentSchema,
  updatePaymentSchema,
  deletePaymentSchema,
  searchPaymentsSchema,
} from "../schemas/payments";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerPaymentTools(server: FastMCP) {
  // ── create_payment ───────────────────────────────────────────────────
  server.addTool({
    name: "create_payment",
    description: "Create a payment in QuickBooks Online.",
    parameters: createPaymentSchema,
    execute: executeQbo("create_payment", (qbo, args) =>
      qboRequest(cb => qbo.createPayment(args.payment, cb))
    ),
  });

  // ── get_payment ──────────────────────────────────────────────────────
  server.addTool({
    name: "get_payment",
    description: "Get a payment by ID from QuickBooks Online.",
    parameters: getPaymentSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_payment", (qbo, args) =>
      qboRequest(cb => qbo.getPayment(args.id, cb))
    ),
  });

  // ── update_payment ───────────────────────────────────────────────────
  server.addTool({
    name: "update_payment",
    description: "Update an existing payment in QuickBooks Online.",
    parameters: updatePaymentSchema,
    execute: executeQbo("update_payment", (qbo, args) =>
      qboRequest(cb => qbo.updatePayment(args.payment, cb))
    ),
  });

  // ── delete_payment ───────────────────────────────────────────────────
  server.addTool({
    name: "delete_payment",
    description: "Delete a payment from QuickBooks Online.",
    parameters: deletePaymentSchema,
    execute: executeQbo("delete_payment", (qbo, args) =>
      qboRequest(cb => qbo.deletePayment(args.idOrEntity, cb))
    ),
  });

  // ── search_payments ──────────────────────────────────────────────────
  server.addTool({
    name: "search_payments",
    description: "Search payments in QuickBooks Online that match given criteria.",
    parameters: searchPaymentsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_payments", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findPayments(searchCriteria, cb));
      return response?.QueryResponse?.Payment ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
