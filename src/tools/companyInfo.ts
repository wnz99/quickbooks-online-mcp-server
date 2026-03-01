import type { FastMCP } from "fastmcp";
import {
  getCompanyInfoSchema,
  updateCompanyInfoSchema,
} from "../schemas/companyInfo";
import { qboRequest } from "../utils/qboRequest";
import { executeQbo } from "../utils/executeQbo";

export function registerCompanyInfoTools(server: FastMCP) {
  // ── get_company_info ──
  server.addTool({
    name: "get_company_info",
    description: "Get a company info by ID from QuickBooks Online.",
    parameters: getCompanyInfoSchema,
    annotations: { readOnlyHint: true },
    execute: executeQbo("get_company_info", (qbo, args) =>
      qboRequest(cb => qbo.getCompanyInfo(args.id, cb))
    ),
  });

  // ── update_company_info ──
  server.addTool({
    name: "update_company_info",
    description: "Update an existing company info in QuickBooks Online.",
    parameters: updateCompanyInfoSchema,
    execute: executeQbo("update_company_info", (qbo, args) =>
      qboRequest(cb => qbo.updateCompanyInfo(args.companyInfo, cb))
    ),
  });
}
