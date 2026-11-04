import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { inferContentType, isBlockedIp, resolveLocalFile, fetchUrlToTempFile } from "../src/utils/attachableFileSource";
import { writeToDisk } from "../src/utils/pdf";

const directories: string[] = [];
function temp() { const directory = fs.mkdtempSync(path.join(os.tmpdir(), "qbo-files-")); directories.push(directory); return directory; }
afterEach(() => { vi.unstubAllEnvs(); for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });

describe("attachment file boundary", () => {
  it.each(["127.0.0.1", "10.1.2.3", "169.254.169.254", "::1", "fd00::1", "::ffff:127.0.0.1", "64:ff9b::7f00:1"])("blocks private address %s", ip => expect(isBlockedIp(ip)).toBe(true));
  it.each(["8.8.8.8", "2606:4700::1111"])("allows public address %s", ip => expect(isBlockedIp(ip)).toBe(false));
  it("rejects non-HTTPS and private URL sources before networking", async () => {
    await expect(fetchUrlToTempFile("http://example.test/file.pdf", 100)).rejects.toThrow("https");
    await expect(fetchUrlToTempFile("https://127.0.0.1/file.pdf", 100)).rejects.toThrow("blocked");
  });
  it.skipIf(process.platform === "win32")("enforces allowed roots, symlinks, credential denial and size", async () => {
    const root = temp(), outside = temp();
    vi.stubEnv("QUICKBOOKS_ATTACHABLE_BASE_DIR", root);
    fs.writeFileSync(path.join(root, "ok.pdf"), "pdf");
    expect((await resolveLocalFile(path.join(root, "ok.pdf"), 100)).size).toBe(3);
    await expect(resolveLocalFile(path.join(root, "ok.pdf"), 1)).rejects.toThrow("large");
    fs.writeFileSync(path.join(outside, "outside.pdf"), "pdf");
    fs.symlinkSync(path.join(outside, "outside.pdf"), path.join(root, "link.pdf"));
    await expect(resolveLocalFile(path.join(root, "link.pdf"), 100)).rejects.toThrow("outside");
    fs.writeFileSync(path.join(root, ".env"), "fixture");
    await expect(resolveLocalFile(path.join(root, ".env"), 100)).rejects.toThrow("denied");
  });
  it("requires an explicit upload base directory in HTTP mode", async () => {
    vi.stubEnv("MCP_TRANSPORT", "http"); vi.stubEnv("QUICKBOOKS_ATTACHABLE_BASE_DIR", "");
    const file = path.join(temp(), "file.pdf"); fs.writeFileSync(file, "pdf");
    await expect(resolveLocalFile(file, 100)).rejects.toThrow("outside");
  });
  it("infers QBO MIME types", () => {
    expect(inferContentType("receipt.PDF")).toBe("application/pdf");
    expect(inferContentType("archive.zip")).toBeNull();
  });
});

describe("PDF disk boundary", () => {
  it("defaults to disabled writes", () => {
    vi.stubEnv("QBO_PDF_OUTPUT_DIR", "");
    expect(writeToDisk(Buffer.from("pdf"), "invoice.pdf", false)).toMatchObject({ ok: false });
  });
  it.skipIf(process.platform === "win32")("requires explicit overwrite and rejects directory/symlink escape", () => {
    const root = temp(), outside = temp(); vi.stubEnv("QBO_PDF_OUTPUT_DIR", root);
    expect(writeToDisk(Buffer.from("pdf"), "invoice.pdf", false).ok).toBe(true);
    expect(writeToDisk(Buffer.from("new"), "invoice.pdf", false).ok).toBe(false);
    expect(writeToDisk(Buffer.from("new"), "invoice.pdf", true).ok).toBe(true);
    expect(writeToDisk(Buffer.from("pdf"), path.join(outside, "invoice.pdf"), false).ok).toBe(false);
    const target = path.join(outside, "existing.pdf"); fs.writeFileSync(target, "preserve");
    fs.symlinkSync(target, path.join(root, "link.pdf"));
    expect(writeToDisk(Buffer.from("overwrite"), "link.pdf", true).ok).toBe(false);
    expect(fs.readFileSync(target, "utf8")).toBe("preserve");
  });
});
