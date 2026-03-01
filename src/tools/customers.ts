import type { FastMCP } from "fastmcp";
import {
  createCustomerSchema,
  getCustomerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
  searchCustomersSchema,
} from "../schemas/customers";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerCustomerTools(server: FastMCP) {
  // ── create_customer ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "create_customer",
      description: "Create a customer in QuickBooks Online.",
      parameters: createCustomerSchema,
      execute: async (args: any, { log }: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createCustomer(args.customer, (err: any, customer: any) => {
              if (err) reject(err);
              else resolve(customer);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── get_customer ─────────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "get_customer",
      description: "Get a customer by ID from QuickBooks Online.",
      parameters: getCustomerSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any, { log }: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getCustomer(args.id, (err: any, customer: any) => {
              if (err) reject(err);
              else resolve(customer);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── update_customer ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "update_customer",
      description: "Update an existing customer in QuickBooks Online.",
      parameters: updateCustomerSchema,
      execute: async (args: any, { log }: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateCustomer(args.customer, (err: any, customer: any) => {
              if (err) reject(err);
              else resolve(customer);
            });
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── delete_customer ──────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "delete_customer",
      description: "Delete (or deactivate) a customer in QuickBooks Online.",
      parameters: deleteCustomerSchema,
      execute: async (args: any, { log }: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();
          const idOrEntity = args.idOrEntity;

          const hasDelete = typeof (qbo as any).deleteCustomer === "function";

          const result = await new Promise((resolve, reject) => {
            if (hasDelete) {
              (qbo as any).deleteCustomer(idOrEntity, (err: any, response: any) => {
                if (err) {
                  // If QuickBooks API rejects the delete, fall back to marking inactive
                  fallbackInactive(resolve, reject, err);
                } else {
                  resolve(response);
                }
              });
            } else {
              fallbackInactive(resolve, reject);
            }

            function fallbackInactive(
              res: (value: unknown) => void,
              rej: (reason?: any) => void,
              originalError?: any
            ) {
              const getEntity = (cb: (cust: any) => void) => {
                if (typeof idOrEntity === "object" && idOrEntity?.Id) {
                  cb(idOrEntity);
                } else {
                  (qbo as any).getCustomer(idOrEntity, (_e: any, cust: any) => cb(cust));
                }
              };

              getEntity((customerEntity) => {
                if (!customerEntity || !customerEntity.Id) {
                  rej(originalError || new Error("Unable to retrieve customer for inactive update"));
                  return;
                }

                const inactiveEntity = {
                  Id: customerEntity.Id,
                  SyncToken: customerEntity.SyncToken,
                  Active: false,
                };

                (qbo as any).updateCustomer(inactiveEntity, (err: any, resp: any) => {
                  if (err) rej(err);
                  else res(resp);
                });
              });
            }
          });

          return JSON.stringify({ success: true, result });
        } catch (error) {
          return JSON.stringify({ success: false, error: formatError(error) });
        }
      },
    })
  );

  // ── search_customers ─────────────────────────────────────────────────
  server.addTool(
    withLogging({
      name: "search_customers",
      description: "Search customers in QuickBooks Online that match given criteria.",
      parameters: searchCustomersSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any, { log }: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;

          // Build criteria to send to SDK. If the user provided the advanced array
          // with field/operator/value we pass it through. Otherwise transform
          // legacy {key,value} pairs to an object.
          let criteriaToSend: any;
          if (Array.isArray(criteria) && criteria.length > 0) {
            const first = criteria[0] as any;
            if (typeof first === "object" && "field" in first) {
              criteriaToSend = [
                ...criteria,
                ...Object.entries(options).map(([key, value]) => ({ field: key, value })),
              ];
            } else {
              // Simple key/value list -> map
              criteriaToSend = (criteria as Array<{ key: string; value: any }>).reduce<
                Record<string, any>
              >((acc, { key, value }) => {
                if (value !== undefined && value !== null) acc[key] = value;
                return acc;
              }, { ...options });
            }
          } else {
            criteriaToSend = { ...options };
          }

          const searchCriteria = buildQuickbooksSearchCriteria(criteriaToSend);

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findCustomers(searchCriteria, (err: any, customers: any) => {
              if (err) reject(err);
              else resolve(
                customers?.QueryResponse?.Customer ??
                customers?.QueryResponse?.totalCount ??
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
