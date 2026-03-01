import type { FastMCP } from "fastmcp";
import { getPreferencesSchema } from "../schemas/preferences";
import { qboRequest } from "../utils/qboRequest";
import { executeQbo } from "../utils/executeQbo";

export function registerPreferencesTools(server: FastMCP) {
  // ── get_preferences ──
  server.addTool({
    name: "get_preferences",
    description: "Get preferences from QuickBooks Online.",
    parameters: getPreferencesSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_preferences", (qbo) =>
      qboRequest(cb => qbo.getPreferences(cb))
    ),
  });
}
