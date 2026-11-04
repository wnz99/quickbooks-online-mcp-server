import type { FastMCP, FastMCPSessionAuth, Tool, ToolParameters } from "fastmcp";
import { z } from "zod";

/** Register every tool through the same restriction and parameter boundary. */
export function registerTool<Params extends ToolParameters>(server: FastMCP, tool: Tool<FastMCPSessionAuth, Params>): void {
  const category = /^(create|update|delete)[_-]/.exec(tool.name)?.[1];
  const flag = category === "create" ? "WRITE" : category?.toUpperCase();
  if (flag && process.env[`QUICKBOOKS_DISABLE_${flag}`] === "true") return;

  const schema = tool.parameters;
  if (!(schema instanceof z.ZodObject)) {
    server.addTool(tool);
    return;
  }
  const known = new Set(Object.keys(schema.shape));
  server.addTool({
    ...tool,
    parameters: schema.passthrough() as unknown as Params,
    execute: async (args, context) => {
      const input = args as Record<string, unknown>;
      const extras = Object.keys(input).filter(key => !known.has(key));
      // Reparse against the original schema: diagnostics never change what reaches QBO.
      const result = await tool.execute(schema.parse(input), context);
      if (!extras.length) return result;
      const warning = `Unsupported parameters ignored by ${tool.name}: ${extras.join(", ")}. Supported: ${[...known].sort().join(", ")}.`;
      if (typeof result === "string") {
        const payload: unknown = JSON.parse(result);
        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          return JSON.stringify({ ...payload, warnings: [warning] });
        }
      }
      return result;
    },
  });
}
