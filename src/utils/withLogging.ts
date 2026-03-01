import { logger } from "./logger";
import { formatError } from "./errors";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLogging(config: any): any {
  const originalExecute = config.execute;
  const toolName = config.name;

  return {
    ...config,
    execute: async (args: any, context: any) => {
      const sessionId = context?.sessionId || "(none)";
      logger.debug(`[tool:${toolName}] CALL`, { sessionId, args });

      try {
        const result = await originalExecute(args, context);
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
  };
}
