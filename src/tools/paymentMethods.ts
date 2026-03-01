import type { FastMCP } from "fastmcp";
import {
  createPaymentMethodSchema,
  getPaymentMethodSchema,
  updatePaymentMethodSchema,
  searchPaymentMethodsSchema,
} from "../schemas/paymentMethods";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerPaymentMethodTools(server: FastMCP) {
  // ── create_payment_method ──
  server.addTool(
    withLogging({
      name: "create_payment_method",
      description: "Create a payment method in QuickBooks Online.",
      parameters: createPaymentMethodSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createPaymentMethod(args.paymentMethod, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_payment_method ──
  server.addTool(
    withLogging({
      name: "get_payment_method",
      description: "Get a payment method by ID from QuickBooks Online.",
      parameters: getPaymentMethodSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getPaymentMethod(args.id, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_payment_method ──
  server.addTool(
    withLogging({
      name: "update_payment_method",
      description: "Update an existing payment method in QuickBooks Online.",
      parameters: updatePaymentMethodSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updatePaymentMethod(args.paymentMethod, (err: any, entity: any) => {
              if (err) reject(err);
              else resolve(entity);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_payment_methods ──
  server.addTool(
    withLogging({
      name: "search_payment_methods",
      description: "Search payment methods in QuickBooks Online that match given criteria.",
      parameters: searchPaymentMethodsSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findPaymentMethods(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.PaymentMethod ??
                data?.QueryResponse?.totalCount ??
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
