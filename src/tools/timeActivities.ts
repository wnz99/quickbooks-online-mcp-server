import type { FastMCP } from "fastmcp";
import {
  createTimeActivitySchema,
  getTimeActivitySchema,
  updateTimeActivitySchema,
  deleteTimeActivitySchema,
  searchTimeActivitiesSchema,
} from "../schemas/timeActivities";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";
import { buildQuickbooksSearchCriteria } from "../utils/search";

export function registerTimeActivityTools(server: FastMCP) {
  // ── create_time_activity ──
  server.addTool(
    withLogging({
      name: "create_time_activity",
      description: "Create a time activity in QuickBooks Online.",
      parameters: createTimeActivitySchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).createTimeActivity(args.timeActivity, (err: any, entity: any) => {
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

  // ── get_time_activity ──
  server.addTool(
    withLogging({
      name: "get_time_activity",
      description: "Get a time activity by ID from QuickBooks Online.",
      parameters: getTimeActivitySchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getTimeActivity(args.id, (err: any, entity: any) => {
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

  // ── update_time_activity ──
  server.addTool(
    withLogging({
      name: "update_time_activity",
      description: "Update an existing time activity in QuickBooks Online.",
      parameters: updateTimeActivitySchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateTimeActivity(args.timeActivity, (err: any, entity: any) => {
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

  // ── delete_time_activity ──
  server.addTool(
    withLogging({
      name: "delete_time_activity",
      description: "Delete a time activity from QuickBooks Online.",
      parameters: deleteTimeActivitySchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).deleteTimeActivity(args.idOrEntity, (err: any, entity: any) => {
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

  // ── search_time_activities ──
  server.addTool(
    withLogging({
      name: "search_time_activities",
      description: "Search time activitys in QuickBooks Online that match given criteria.",
      parameters: searchTimeActivitiesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const { criteria = [], ...options } = args;
          const searchCriteria = buildQuickbooksSearchCriteria({ criteria, ...options });

          const result = await new Promise((resolve, reject) => {
            (qbo as any).findTimeActivities(searchCriteria, (err: any, data: any) => {
              if (err) reject(err);
              else resolve(
                data?.QueryResponse?.TimeActivity ??
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
