import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

export class HashError extends Error {}

function algo(name: string): string {
  const a = (name ?? "sha256").toLowerCase()
  if (!["sha256", "sha1", "md5", "sha512"].includes(a)) throw new HashError("Use sha256, sha512, sha1, or md5")
  return a
}

export async function hashText(args: { text?: string; algorithm?: string }): Promise<string> {
  const text = args.text ?? ""
  if (!text) throw new HashError("Provide text to hash")
  const a = algo(args.algorithm ?? "sha256")
  return `${a}: ${createHash(a).update(text, "utf8").digest("hex")}`
}

export async function hashFile(args: { path?: string; algorithm?: string }): Promise<string> {
  const path = args.path ?? ""
  if (!path) throw new HashError("Provide a file path")
  const a = algo(args.algorithm ?? "sha256")
  const data = readFileSync(path)
  return `${a}: ${createHash(a).update(data).digest("hex")} (${data.length} bytes)`
}

// ---- muxA tools:

import { createHmac } from "node:crypto"
import { readdirSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

function digest(algorithm: string, data: Buffer | string): string {
  return createHash(algorithm).update(data).digest("hex")
}

function parseExpected(expected: string): { algorithm?: string; hex: string } {
  const raw = (expected ?? "").trim().toLowerCase().replace(/[\s-]/g, "");
  const withPrefix = /^([a-z0-9]{3,10}):([a-f0-9]{8,128})$/.exec(raw);
  if (withPrefix) return { algorithm: withPrefix[1], hex: withPrefix[2] };
  const bare = /^([a-f0-9]{8,128})$/.exec(raw);
  if (bare) return { hex: bare[1] };
  throw new HashError("Expected digest should look like sha256:abc123... or a bare hex digest of 8 to 128 characters.");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface VerifyArgs {
  path?: string;
  text?: string;
  expected: string;
  algorithm?: string;
}

export async function verifyChecksum(args: VerifyArgs): Promise<string> {
  const expectedRaw = (args.expected ?? "").trim();
  if (!expectedRaw) throw new HashError("Provide the expected digest to check against.");
  const parsed = parseExpected(expectedRaw);
  const algorithm = parsed.algorithm ?? algo(args.algorithm ?? "sha256");
  const hasPath = Boolean((args.path ?? "").trim());
  const hasText = typeof args.text === "string" && args.text.length > 0;
  if (hasPath === hasText) {
    throw new HashError("Provide exactly one of path (verify a file) or text (verify a string).");
  }
  const target = hasPath ? String(args.path).trim() : "";
  const actual = hasPath ? digest(algorithm, readFileSync(target)) : digest(algorithm, args.text as string);
  const ok = timingSafeEqual(actual, parsed.hex);
  const what = hasPath ? `${target} (${readFileSync(target).length} bytes)` : `${(args.text as string).length} character string`;
  return [
    `${ok ? "MATCH" : "MISMATCH"}: ${algorithm} digest of ${what}`,
    `  expected ${parsed.hex}`,
    `  actual   ${actual}`,
    ok ? "  The file or string is intact." : "  Content differs from the expected digest.",
  ].join("\n");
}

export interface ManifestArgs {
  path: string;
  algorithm?: string;
  limit?: number;
  exclude?: string;
}

export async function directoryManifest(args: ManifestArgs): Promise<string> {
  const root = (args.path ?? "").trim();
  if (!root) throw new HashError("Provide a directory path.");
  let stat;
  try {
    stat = statSync(root);
  } catch {
    throw new HashError(`Cannot read path ${root}.`);
  }
  if (!stat.isDirectory()) throw new HashError(`${root} is a file, not a directory. Use hash_file to hash a single file.`);
  const algorithm = algo(args.algorithm ?? "sha256");
  const limit = Math.max(1, Math.min(Math.round(Number(args.limit ?? 100) || 100), 500));
  const exclude = (args.exclude ?? "").trim();
  const skip = (p: string) => {
    if (!exclude) return false;
    const e = exclude.toLowerCase();
    const lower = p.toLowerCase();
    return lower.includes(e) || lower.split(sep).some((seg) => seg === e || seg.startsWith(`${e}.`) || seg.endsWith(e));
  };
  const entries = readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((d) => (d.isFile() || d.isSymbolicLink()) && !skip(join(d.parentPath ?? d.path ?? root, d.name)))
    .map((d) => {
      const full = join(d.parentPath ?? d.path ?? root, d.name);
      return { full, rel: relative(root, full), data: readFileSync(full) };
    })
    .filter((e) => e.data.length > 0)
    .sort((a, b) => a.rel.localeCompare(b.rel));
  if (!entries.length) {
    return `${root} contains no readable non-empty files${exclude ? ` after excluding "${exclude}"` : ""}.`;
  }
  const rows = entries.map((e) => ({ rel: e.rel.split(sep).join("/"), size: e.data.length, hex: digest(algorithm, e.data) }));
  const totalBytes = rows.reduce((a, r) => a + r.size, 0);
  const manifestText = rows.map((r) => `${r.hex}  ${r.rel}`).join("\n");
  const manifestHash = digest(algorithm, manifestText);
  return [
    `Directory manifest for ${root}: ${rows.length} file(s), ${countBytes(totalBytes)}, ${algorithm}.`,
    ...rows.slice(0, limit).map((r) => `${r.hex}  ${r.size.toLocaleString("en-US")} B  ${r.rel}`),
    rows.length > limit ? `... plus ${rows.length - limit} more files not listed` : "",
    `manifest digest (${algorithm} of the sorted "digest  path" listing): ${manifestHash}`,
    exclude ? `Excluded paths matching "${exclude}".` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function countBytes(n: number): string {
  return n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${(n / 1024).toFixed(1)} kB`;
}

export interface HmacArgs {
  message: string;
  key: string;
  encoding?: string;
  algorithm?: string;
}

export async function hmacDigest(args: HmacArgs): Promise<string> {
  const message = args.message ?? "";
  if (!message) throw new HashError("Provide the message to authenticate.");
  const key = args.key ?? "";
  if (!key) throw new HashError("Provide the shared secret key.");
  const algorithm = algo(args.algorithm ?? "sha256");
  const requested = (args.encoding ?? "hex").trim().toLowerCase();
  if (requested !== "hex" && requested !== "base64") return "Unknown encoding, use hex or base64.";
  const enc: "hex" | "base64" = requested;
  const mac = createHmac(algorithm, key).update(message, "utf8").digest(enc);
  return `${algorithm} HMAC (${enc}): ${mac}`;
}
