import { z } from "zod";

export const getCompanyInfoSchema = z.object({
  id: z.string().describe("QuickBooks company info ID"),
});

export const updateCompanyInfoSchema = z.object({
  companyInfo: z.record(z.string(), z.unknown()).describe("CompanyInfo data with Id and SyncToken for update"),
});

