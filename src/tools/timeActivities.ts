import type { FastMCP } from "fastmcp";
import {
  createTimeActivitySchema,
  getTimeActivitySchema,
  updateTimeActivitySchema,
  deleteTimeActivitySchema,
  searchTimeActivitiesSchema,
} from "../schemas/timeActivities";
import { qboRequest, type QBQueryResponse } from "../utils/qboRequest";
import { buildQuickbooksSearchCriteria } from "../utils/search";
import { executeQbo } from "../utils/executeQbo";

export function registerTimeActivityTools(server: FastMCP) {
  // ── create_time_activity ──
  server.addTool({
    name: "create_time_activity",
    description: "Create a time activity in QuickBooks Online.",
    parameters: createTimeActivitySchema,
    execute: executeQbo("create_time_activity", (qbo, args) =>
      qboRequest(cb => qbo.createTimeActivity(args.timeActivity, cb))
    ),
  });

  // ── get_time_activity ──
  server.addTool({
    name: "get_time_activity",
    description: "Get a time activity by ID from QuickBooks Online.",
    parameters: getTimeActivitySchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_time_activity", (qbo, args) =>
      qboRequest(cb => qbo.getTimeActivity(args.id, cb))
    ),
  });

  // ── update_time_activity ──
  server.addTool({
    name: "update_time_activity",
    description: "Update an existing time activity in QuickBooks Online.",
    parameters: updateTimeActivitySchema,
    execute: executeQbo("update_time_activity", (qbo, args) =>
      qboRequest(cb => qbo.updateTimeActivity(args.timeActivity, cb))
    ),
  });

  // ── delete_time_activity ──
  server.addTool({
    name: "delete_time_activity",
    description: "Delete a time activity from QuickBooks Online.",
    parameters: deleteTimeActivitySchema,
    execute: executeQbo("delete_time_activity", (qbo, args) =>
      qboRequest(cb => qbo.deleteTimeActivity(args.idOrEntity, cb))
    ),
  });

  // ── search_time_activities ──
  server.addTool({
    name: "search_time_activities",
    description: "Search time activitys in QuickBooks Online that match given criteria.",
    parameters: searchTimeActivitiesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("search_time_activities", async (qbo, args) => {
      const { criteria = [], ...options } = args;
      const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });
      const response = await qboRequest<QBQueryResponse>(cb => qbo.findTimeActivities(searchCriteria, cb));
      return response?.QueryResponse?.TimeActivity ?? response?.QueryResponse?.totalCount ?? [];
    }),
  });
}
