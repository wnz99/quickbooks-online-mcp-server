export class MCPError extends Error {
  readonly code: string;
  readonly isRetryable: boolean;

  constructor(message: string, code: string, isRetryable = false) {
    super(message);
    this.name = "MCPError";
    this.code = code;
    this.isRetryable = isRetryable;
  }
}

export class QuickBooksApiError extends MCPError {
  readonly statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message, "QUICKBOOKS_API_ERROR", true);
    this.name = "QuickBooksApiError";
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends MCPError {
  constructor(message: string) {
    super(message, "AUTH_ERROR", true);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, public readonly field?: string) {
    super(message, "VALIDATION_ERROR", false);
    this.name = "ValidationError";
  }
}

export class EntityNotFoundError extends MCPError {
  constructor(entityType: string, id: string) {
    super(`${entityType} not found: ${id}`, "NOT_FOUND", false);
    this.name = "EntityNotFoundError";
  }
}

export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    const tid = obj.intuit_tid ? ` [intuit_tid: ${obj.intuit_tid}]` : "";

    // QBO Fault response format
    if (obj.Fault) {
      const fault = obj.Fault as { Error?: Array<{ Message?: string; Detail?: string }> };
      const messages =
        fault.Error?.map((e) => e.Message || e.Detail).join("; ") ||
        "Unknown QuickBooks error";
      return messages + tid;
    }

    return JSON.stringify(error) + tid;
  }

  return JSON.stringify(error);
}
