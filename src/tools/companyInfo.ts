import type { FastMCP } from "fastmcp";
import {
  getCompanyInfoSchema,
  updateCompanyInfoSchema,
} from "../schemas/companyInfo";
import { quickbooksClient } from "../clients/quickbooksClient";
import { formatError } from "../utils/errors";
import { withLogging } from "../utils/withLogging";

export function registerCompanyInfoTools(server: FastMCP) {
  // ── get_company_info ──
  server.addTool(
    withLogging({
      name: "get_company_info",
      description: "Get a company info by ID from QuickBooks Online.",
      parameters: getCompanyInfoSchema,
      annotations: { readOnlyHint: true },
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).getCompanyInfo(args.id, (err: any, entity: any) => {
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

  // ── update_company_info ──
  server.addTool(
    withLogging({
      name: "update_company_info",
      description: "Update an existing company info in QuickBooks Online.",
      parameters: updateCompanyInfoSchema,
      execute: async (args: any) => {
        try {
          await quickbooksClient.authenticate();
          const qbo = quickbooksClient.getQuickbooks();

          const result = await new Promise((resolve, reject) => {
            (qbo as any).updateCompanyInfo(args.companyInfo, (err: any, entity: any) => {
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
