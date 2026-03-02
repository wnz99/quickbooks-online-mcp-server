import type { FastMCP } from "fastmcp";
import {
  createBillPaymentSchema,
  getBillPaymentSchema,
  updateBillPaymentSchema,
  deleteBillPaymentSchema,
  searchBillPaymentsSchema,
} from "../schemas/billPayments";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerBillPaymentTools(server: FastMCP) {
  // ── create_bill_payment ──────────────────────────────────────────────
  server.addTool({
    name: "create_bill_payment",
    description: "Create a bill payment in QuickBooks Online.",
    parameters: createBillPaymentSchema,
    execute: executeQbo("create_bill_payment", (qbo, args) =>
      qboRequest(cb => qbo.createBillPayment(args.billPayment, cb))
    ),
  });

  // ── get_bill_payment ─────────────────────────────────────────────────
  server.addTool({
    name: "get_bill_payment",
    description: "Get a bill payment by ID from QuickBooks Online.",
    parameters: getBillPaymentSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_bill_payment", (qbo, args) =>
      qboRequest(cb => qbo.getBillPayment(args.id, cb))
    ),
  });

  // ── update_bill_payment ──────────────────────────────────────────────
  server.addTool({
    name: "update_bill_payment",
    description: "Update an existing bill payment in QuickBooks Online.",
    parameters: updateBillPaymentSchema,
    execute: executeQbo("update_bill_payment", (qbo, args) =>
      qboRequest(cb => qbo.updateBillPayment(args.billPayment, cb))
    ),
  });

  // ── delete_bill_payment ──────────────────────────────────────────────
  // Bill payments cannot be deleted via the QBO API. They can be voided
  // by updating them. This tool fetches the payment and sets it to void.
  server.addTool({
    name: "delete_bill_payment",
    description: "Void a bill payment in QuickBooks Online (bill payments cannot be hard-deleted).",
    parameters: deleteBillPaymentSchema,
    execute: executeQbo("delete_bill_payment", async (qbo, args) => {
      const id = typeof args.idOrEntity === "object" && args.idOrEntity?.Id
        ? args.idOrEntity.Id
        : String(args.idOrEntity);
      const existing = await qboRequest<Record<string, unknown>>(cb => qbo.getBillPayment(id, cb));
      return qboRequest(cb => qbo.updateBillPayment({
        ...existing,
        sparse: true,
        PrivateNote: "Voided",
        TotalAmt: 0,
        Line: [],
      }, cb));
    }),
  });

  // ── search_bill_payments ─────────────────────────────────────────────
  server.addTool({
    name: "search_bill_payments",
    description: "Search bill payments in QuickBooks Online that match given criteria.",
    parameters: searchBillPaymentsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_bill_payments", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findBillPayments(searchCriteria, cb));
      return response?.QueryResponse?.BillPayment ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
