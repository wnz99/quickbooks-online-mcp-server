import { z } from "zod";

export const getPreferencesSchema = z.object({}).describe("Get preferences (no parameters needed)");

export const updatePreferencesSchema = z.object({
  preferences: z.record(z.string(), z.unknown()).describe("Preferences data with Id and SyncToken for update"),
});

