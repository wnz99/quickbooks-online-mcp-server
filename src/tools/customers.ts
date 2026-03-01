import type { FastMCP } from "fastmcp";
import {
  createCustomerSchema,
  getCustomerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
  searchCustomersSchema,
} from "../schemas/customers";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria, type QuickbooksSearchCriteriaInput } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerCustomerTools(server: FastMCP) {
  server.addTool({
    name: "create_customer",
    description: "Create a customer in QuickBooks Online.",
    parameters: createCustomerSchema,
    execute: executeQbo("create_customer", (qbo, args) =>
      qboRequest(cb => qbo.createCustomer(args.customer, cb))
    ),
  });

  server.addTool({
    name: "get_customer",
    description: "Get a customer by ID from QuickBooks Online.",
    parameters: getCustomerSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_customer", (qbo, args) =>
      qboRequest(cb => qbo.getCustomer(args.id, cb))
    ),
  });

  server.addTool({
    name: "update_customer",
    description: "Update an existing customer in QuickBooks Online.",
    parameters: updateCustomerSchema,
    execute: executeQbo("update_customer", (qbo, args) =>
      qboRequest(cb => qbo.updateCustomer(args.customer, cb))
    ),
  });

  server.addTool({
    name: "delete_customer",
    description: "Delete (or deactivate) a customer in QuickBooks Online.",
    parameters: deleteCustomerSchema,
    execute: executeQbo("delete_customer", (qbo, args) => {
      const idOrEntity = args.idOrEntity;
      const hasDelete = typeof qbo.deleteCustomer === "function";

      return new Promise((resolve, reject) => {
        if (hasDelete) {
          qbo.deleteCustomer(idOrEntity, (err, response, res) => {
            if (err) {
              if (res?.headers?.["intuit_tid"] && typeof err === "object" && err !== null) {
                (err as Record<string, unknown>).intuit_tid = res.headers["intuit_tid"];
              }
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
          rej: (reason?: unknown) => void,
          originalError?: unknown
        ) {
          const getEntity = (cb: (cust: Record<string, unknown> | null) => void) => {
            if (typeof idOrEntity === "object" && idOrEntity?.Id) {
              cb(idOrEntity as Record<string, unknown>);
            } else {
              qbo.getCustomer(idOrEntity, (_e, cust) => cb(cust as Record<string, unknown> | null));
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

            qbo.updateCustomer(inactiveEntity, (err, resp) => {
              if (err) rej(err);
              else res(resp);
            });
          });
        }
      });
    }),
  });

  server.addTool({
    name: "search_customers",
    description: "Search customers in QuickBooks Online that match given criteria.",
    parameters: searchCustomersSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_customers", async (qbo, args) => {
      const { criteria = [], ...options } = args;

      let criteriaToSend: QuickbooksSearchCriteriaInput;
      if (Array.isArray(criteria) && criteria.length > 0) {
        const first = criteria[0] as Record<string, unknown>;
        if (typeof first === "object" && "field" in first) {
          criteriaToSend = [
            ...(criteria as Array<Record<string, unknown>>),
            ...Object.entries(options).map(([key, value]) => ({ field: key, value })),
          ];
        } else {
          criteriaToSend = (criteria as Array<{ key: string; value: unknown }>).reduce<
            Record<string, unknown>
          >((acc, { key, value }) => {
            if (value !== undefined && value !== null) acc[key] = value;
            return acc;
          }, { ...options });
        }
      } else {
        criteriaToSend = { ...options };
      }

      const searchCriteria = buildQuickbooksSearchCriteria(criteriaToSend);
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findCustomers(searchCriteria, cb));
      return response?.QueryResponse?.Customer ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
