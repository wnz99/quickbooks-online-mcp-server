import type { FastMCP } from "fastmcp";
import {
  createPaymentMethodSchema,
  getPaymentMethodSchema,
  updatePaymentMethodSchema,
  searchPaymentMethodsSchema,
} from "../schemas/paymentMethods";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerPaymentMethodTools(server: FastMCP) {
  // ── create_payment_method ──
  server.addTool({
    name: "create_payment_method",
    description: "Create a payment method in QuickBooks Online.",
    parameters: createPaymentMethodSchema,
    execute: executeQbo("create_payment_method", (qbo, args) =>
      qboRequest(cb => qbo.createPaymentMethod(args.paymentMethod, cb))
    ),
  });

  // ── get_payment_method ──
  server.addTool({
    name: "get_payment_method",
    description: "Get a payment method by ID from QuickBooks Online.",
    parameters: getPaymentMethodSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_payment_method", (qbo, args) =>
      qboRequest(cb => qbo.getPaymentMethod(args.id, cb))
    ),
  });

  // ── update_payment_method ──
  server.addTool({
    name: "update_payment_method",
    description: "Update an existing payment method in QuickBooks Online.",
    parameters: updatePaymentMethodSchema,
    execute: executeQbo("update_payment_method", (qbo, args) =>
      qboRequest(cb => qbo.updatePaymentMethod(args.paymentMethod, cb))
    ),
  });

  // ── search_payment_methods ──
  server.addTool({
    name: "search_payment_methods",
    description: "Search payment methods in QuickBooks Online that match given criteria.",
    parameters: searchPaymentMethodsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_payment_methods", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findPaymentMethods(searchCriteria, cb));
      return response?.QueryResponse?.PaymentMethod ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
