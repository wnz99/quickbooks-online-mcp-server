import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll } from "vitest";

// Every suite gets an isolated token store. Tests never load real company credentials.
const directory = mkdtempSync(path.join(tmpdir(), "qbo-tests-"));
process.env.QUICKBOOKS_TOKEN_STORE_PATH = path.join(directory, "tokens.env");
delete process.env.QUICKBOOKS_CLIENT_ID;
delete process.env.QUICKBOOKS_CLIENT_SECRET;
delete process.env.QUICKBOOKS_TOKEN_FILE;
afterAll(() => rmSync(directory, { recursive: true, force: true }));
