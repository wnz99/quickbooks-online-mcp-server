import type { FastMCP } from "fastmcp";
import {
  getPreferencesSchema,
  updatePreferencesSchema,
} from "../schemas/preferences";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";

export function registerPreferencesTools(server: FastMCP) {
  // ── get_preferences ──
  server.addTool(
    withLogging({
      name: "get_preferences",
      description: "Get preferences from QuickBooks Online.",
      parameters: getPreferencesSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getPreferences((err: any, entity: any) => {
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

  // ── update_preferences ──
  server.addTool(
    withLogging({
      name: "update_preferences",
      description: "Update preferences in QuickBooks Online.",
      parameters: updatePreferencesSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updatePreferences(args.preferences, (err: any, entity: any) => {
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

}
