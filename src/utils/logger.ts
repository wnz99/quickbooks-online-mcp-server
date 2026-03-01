type LogLevel = "debug" | "error" | "info" | "warn";

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let currentLogLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}

function logToStderr(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [MCP] [${level.toUpperCase()}]`;
  if (data !== undefined) {
    const dataStr =
      data instanceof Error
        ? `${data.message}${data.stack ? "\n" + data.stack : ""}`
        : typeof data === "object"
          ? JSON.stringify(data, null, 2)
          : String(data);
    console.error(`${prefix} ${message}\n${dataStr}`);
  } else {
    console.error(`${prefix} ${message}`);
  }
}

export const logger = {
  debug: (message: string, data?: unknown) => logToStderr("debug", message, data),
  info: (message: string, data?: unknown) => logToStderr("info", message, data),
  warn: (message: string, data?: unknown) => logToStderr("warn", message, data),
  error: (message: string, data?: unknown) => logToStderr("error", message, data),
};
