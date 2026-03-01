import { logger } from "./logger";

/** Shape returned by node-quickbooks find* (search) methods. */
export interface QBQueryResponse {
  QueryResponse?: {
    totalCount?: number;
    [key: string]: unknown;
  };
}

/**
 * Wraps a node-quickbooks callback-style call into a Promise,
 * capturing the `intuit_tid` response header for error diagnostics.
 */
export function qboRequest<T = unknown>(
  fn: (
    callback: (
      err: unknown,
      result: T,
      res?: { headers?: Record<string, string> }
    ) => void
  ) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn((err, result, res) => {
      const intuitTid =
        res?.headers?.["intuit_tid"] || res?.headers?.["intuit-tid"];

      if (err) {
        if (intuitTid && typeof err === "object" && err !== null) {
          (err as Record<string, unknown>).intuit_tid = intuitTid;
        }
        if (intuitTid) {
          logger.error(`QBO API error [intuit_tid: ${intuitTid}]`);
        }
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
