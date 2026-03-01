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
  return JSON.stringify(error);
}
