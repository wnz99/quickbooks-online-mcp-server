import type { FastMCP } from "fastmcp";
import {
  createBillSchema,
  getBillSchema,
  updateBillSchema,
  deleteBillSchema,
  searchBillsSchema,
} from "../schemas/bills";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerBillTools(server: FastMCP) {
  server.addTool({
    name: "create_bill",
    description: "Create a bill in QuickBooks Online.",
    parameters: createBillSchema,
    execute: executeQbo("create_bill", (qbo, args) =>
      qboRequest(cb => qbo.createBill(args.bill, cb))
    ),
  });

  server.addTool({
    name: "get_bill",
    description: "Get a bill by ID from QuickBooks Online.",
    parameters: getBillSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_bill", (qbo, args) =>
      qboRequest(cb => qbo.getBill(args.id, cb))
    ),
  });

  server.addTool({
    name: "update_bill",
    description: "Update an existing bill in QuickBooks Online.",
    parameters: updateBillSchema,
    execute: executeQbo("update_bill", (qbo, args) =>
      qboRequest(cb => qbo.updateBill(args.bill, cb))
    ),
  });

  server.addTool({
    name: "delete_bill",
    description: "Delete a bill from QuickBooks Online.",
    parameters: deleteBillSchema,
    execute: executeQbo("delete_bill", (qbo, args) =>
      qboRequest(cb => qbo.deleteBill(args.bill, cb))
    ),
  });

  server.addTool({
    name: "search_bills",
    description: "Search bills in QuickBooks Online that match given criteria.",
    parameters: searchBillsSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_bills", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findBills(searchCriteria, cb));
      return response?.QueryResponse?.Bill ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
