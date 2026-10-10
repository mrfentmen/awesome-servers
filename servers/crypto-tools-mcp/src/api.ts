import { createHash, createHmac } from "node:crypto"

const UA = "mrfentmen-crypto-tools-mcp/1.0"
export class CryptoError extends Error {}

const ALGOS = ["md5", "sha1", "sha256", "sha512"]

export async function hash(args: { text?: string; algorithm?: string }): Promise<string> {
  const text = (args.text ?? "")
  if (!text) throw new CryptoError("Provide input text")
  const algo = (args.algorithm ?? "sha256").toLowerCase()
  if (!ALGOS.includes(algo)) throw new CryptoError(`Algorithm must be one of ${ALGOS.join(", ")}`)
  const out = createHash(algo).update(text, "utf-8").digest("hex")
  return `${algo} of "${text}":\n${out}`
}

export async function hmac(args: { text?: string; key?: string }): Promise<string> {
  const text = (args.text ?? "")
  const key = (args.key ?? "")
  if (!text || !key) throw new CryptoError("Provide both text and a secret key")
  const out = createHmac("sha256", key).update(text, "utf-8").digest("hex")
  return `HMAC-SHA256 of "${text}":\n${out}`
}

// ---- muxA tools:

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;

function bound(value: number | undefined, fallback: number, max: number): number {
  return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}

export interface Base64Args {
  text?: string;
  mode?: string;
  variant?: string;
}

export interface RandomArgs {
  bytes?: number;
  encoding?: string;
}

export async function secureRandom(args: RandomArgs): Promise<string> {
  const size = bound(args.bytes, 32, 4096);
  const encoding = (args.encoding ?? "hex").toLowerCase();
  if (!["hex", "base64", "base64url"].includes(encoding)) {
    throw new CryptoError(`Encoding must be hex, base64 or base64url, not ${encoding}`);
  }
  const buf = randomBytes(size);
  const out = encoding === "hex" ? buf.toString("hex") : encoding === "base64" ? buf.toString("base64") : buf.toString("base64url");
  return [
    `${size} cryptographically secure random byte(s) as ${encoding}:`,
    out,
    `Entropy: ${size * 8} bits, from node's CSPRNG.`,
  ].join("\n");
}

export interface PasswordArgs {
  password?: string;
  salt?: string;
  verify?: string;
}

function summarise(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}
