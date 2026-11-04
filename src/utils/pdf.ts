// Adapted from upstream 31a1dd5; see THIRD_PARTY_NOTICES.md.
import fs from "fs";
import path from "path";
interface DiskWriteResult {
  ok: true;
  bytes: number;
  absolutePath: string;
}
interface DiskWriteFailure {
  ok: false;
  error: string;
}

/**
 * Resolve the caller-supplied output_path against the QBO_PDF_OUTPUT_DIR
 * allowlist. Returns an absolute path that is provably inside the allowlist,
 * or a structured error.
 *
 * Defense layers:
 *  1. Reject when QBO_PDF_OUTPUT_DIR is unset — disk writes are off by default
 *     so a misaligned caller can't write anywhere just by guessing a path.
 *  2. Resolve the *parent* directory through fs.realpathSync — this defeats
 *     symlinks that point outside the allowlist (the file itself may not yet
 *     exist, so we can't realpath it directly).
 *  3. After resolution, the absolute path must be lexically prefixed by the
 *     allowlist's own realpath (with a trailing separator to prevent
 *     /tmp/allowed-evil bypassing /tmp/allowed).
 *  4. The path must not contain a `..` segment after normalization — belt and
 *     braces in case the realpath check has a corner I missed.
 */
function resolveOutputPath(rawPath: string): { absolutePath: string } | { error: string } {
  const allowlistRaw = process.env.QBO_PDF_OUTPUT_DIR;
  if (!allowlistRaw || allowlistRaw.trim() === "") {
    return {
      error:
        "Disk writes are disabled. Set QBO_PDF_OUTPUT_DIR to an allowlist " +
        "directory in the MCP server's environment, or omit output_path to " +
        "receive the PDF inline as base64.",
    };
  }

  let allowlistReal: string;
  try {
    allowlistReal = fs.realpathSync(path.resolve(allowlistRaw));
  } catch (err) {
    // `String(err)` for Error instances yields `Error: <message>`, which is
    // good enough here and lets us skip the `err instanceof Error` branch
    // (and the dead-branch coverage gap it creates, given Node always throws
    // Error instances from fs.realpathSync).
    return {
      error: `QBO_PDF_OUTPUT_DIR (${allowlistRaw}) does not resolve: ${String(err)}`,
    };
  }

  // Reject `..` segments lexically — cheap belt-and-braces alongside the
  // realpath prefix check below.
  const normalized = path.normalize(rawPath);
  if (normalized.split(path.sep).some((seg) => seg === "..")) {
    return { error: `output_path must not contain ".." segments.` };
  }

  const absoluteCandidate = path.resolve(allowlistReal, normalized);
  const parentDir = path.dirname(absoluteCandidate);

  let parentReal: string;
  try {
    parentReal = fs.realpathSync(parentDir);
  } catch (err) {
    return {
      error: `output_path parent directory does not exist or is not accessible: ${String(err)}`,
    };
  }

  // Use path.relative to check containment without playing with trailing
  // separators. `path.relative(allowlistReal, parentReal)` returns:
  //   ''         when parentReal === allowlistReal (file directly in root)
  //   'subdir'   when parentReal is inside allowlistReal
  //   '../...'   when parentReal is outside
  //   absolute   when on a different drive/root (Windows)
  const rel = path.relative(allowlistReal, parentReal);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return {
      error: `output_path resolves outside QBO_PDF_OUTPUT_DIR (${allowlistReal}).`,
    };
  }

  const finalPath = path.join(parentReal, path.basename(absoluteCandidate));
  return { absolutePath: finalPath };
}

export function writeToDisk(
  pdf: Buffer,
  rawPath: string,
  overwrite: boolean
): DiskWriteResult | DiskWriteFailure {
  const resolved = resolveOutputPath(rawPath);
  if ("error" in resolved) {
    return { ok: false, error: resolved.error };
  }

  // 'wx' fails fast if the file exists; 'w' truncates. Caller must opt in to
  // overwrite, never the default — silently clobbering a sibling file is the
  // kind of footgun that turns "agent helped me" into "agent destroyed my
  // work".
  const flag = overwrite ? "w" : "wx";
  try {
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW |
      (flag === "wx" ? fs.constants.O_EXCL : fs.constants.O_TRUNC);
    const fd = fs.openSync(resolved.absolutePath, flags, 0o600);
    try { fs.writeFileSync(fd, pdf); } finally { fs.closeSync(fd); }
  } catch (err) {
    return {
      ok: false,
      error: `Failed to write PDF to ${resolved.absolutePath}: ${String(err)}`,
    };
  }
  return { ok: true, bytes: pdf.length, absolutePath: resolved.absolutePath };
}

