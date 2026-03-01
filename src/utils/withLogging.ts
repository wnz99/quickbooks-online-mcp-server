import { logger } from "./logger";
import { formatError } from "./errors";

// withLogging is a transparent wrapper over arbitrary FastMCP tool configs.
// The generic preserves the exact type so addTool() sees the right shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyExecuteFn = (...args: any[]) => Promise<any>;

interface ToolConfig {
  name: string;
  execute: AnyExecuteFn;
  [key: string]: unknown;
}

export function withLogging<T extends ToolConfig>(config: T): T {
  const originalExecute = config.execute;
  const toolName = config.name;

  return {
    ...config,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute: async (...args: any[]) => {
      const context = args[1] as { sessionId?: string } | undefined;
      const sessionId = context?.sessionId || "(none)";
      logger.debug(`[tool:${toolName}] CALL`, { sessionId, args: args[0] });

      try {
        const result = await originalExecute(...args);
        logger.debug(`[tool:${toolName}] OK`, { sessionId });
        return result;
      } catch (error) {
        logger.error(`[tool:${toolName}] ERROR`, {
          error: formatError(error),
          sessionId,
        });
        throw error;
      }
    },
  } as T;
}
