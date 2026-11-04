export interface ToolResponse<T> {
  result: T | null;
  isError: boolean;
  error: string | null;
}

export function unwrap<T>(response: ToolResponse<T>): T {
  if (response.isError) throw new Error(response.error || "QuickBooks operation failed");
  return response.result as T;
}
