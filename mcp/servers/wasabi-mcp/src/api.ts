/**
 * Wasabi via S3-compatible endpoint (SigV4 signed inline, no extra deps).
 * Needs WASABI_ACCESS_KEY + WASABI_SECRET_KEY (Wasabi Console > Access Keys).
 * Optional WASABI_ENDPOINT (default https://s3.wasabisys.com) and
 * WASABI_REGION (default us-east-1, must match the bucket's region).
 */
import { createHmac, createHash } from "node:crypto"

const ENDPOINT = (process.env.WASABI_ENDPOINT ?? "https://s3.wasabisys.com").replace(/\/+$/, "")
const REGION = (process.env.WASABI_REGION ?? "us-east-1").trim() || "us-east-1"
const HOST = new URL(ENDPOINT).host

export class WasabiError extends Error {}

function creds(): { access: string; secret: string } {
  const access = process.env.WASABI_ACCESS_KEY
  const secret = process.env.WASABI_SECRET_KEY
  if (!access || !secret) throw new WasabiError("Set WASABI_ACCESS_KEY and WASABI_SECRET_KEY first.")
  return { access, secret }
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest()
}

function sign(method: string, path: string, query: string, payloadHash: string): Record<string, string> {
  const { access, secret } = creds()
  const now = new Date()
  const amz = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z"
  const date = amz.slice(0, 8)
  const headers: Record<string, string> = { host: HOST, "x-amz-content-sha256": payloadHash, "x-amz-date": amz }
  const signedHeaders = Object.keys(headers).sort().join(";")
  const canonicalHeaders = Object.keys(headers).sort().map((k) => `${k}:${headers[k]}\n`).join("")
  const canonical = [method, path, query, canonicalHeaders, signedHeaders, payloadHash].join("\n")
  const scope = `${date}/${REGION}/s3/aws4_request`
  const toSign = ["AWS4-HMAC-SHA256", amz, scope, createHash("sha256").update(canonical, "utf8").digest("hex")].join("\n")
  const kDate = hmac(`AWS4${secret}`, date)
  const kRegion = hmac(kDate, REGION)
  const kService = hmac(kRegion, "s3")
  const kSign = hmac(kService, "aws4_request")
  const sig = hmac(kSign, toSign).toString("hex")
  return {
    ...headers,
    Authorization: `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
  }
}

async function s3get(path: string, query = ""): Promise<string> {
  const empty = createHash("sha256").update("", "utf8").digest("hex")
  const res = await fetch(`${ENDPOINT}${path}${query ? `?${query}` : ""}`, {
    headers: sign("GET", path, query, empty),
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new WasabiError("Wasabi refused (401/403). Check keys and WASABI_REGION.")
  if (!res.ok) throw new WasabiError(`Wasabi error ${res.status}`)
  return await res.text()
}

const tag = (xml: string, name: string): string[] => {
  const out: string[] = []
  const re = new RegExp(`<${name}>([^<]*)</${name}>`, "g")
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) out.push(m[1])
  return out
};

export async function listBuckets(): Promise<string[]> {
  const xml = await s3get("/")
  return tag(xml, "Name").filter((n) => n.length > 0)
}

export interface S3Object {
  key: string
  size?: number
  modified?: string
}

export async function listObjects(bucket: string, prefix = "", limit = 20): Promise<S3Object[]> {
  if (!bucket.trim()) throw new WasabiError("Bucket is empty.")
  const qs = new URLSearchParams({ "list-type": "2", "max-keys": String(Math.min(Math.max(limit, 1), 100)) })
  if (prefix.trim()) qs.set("prefix", prefix.trim())
  const xml = await s3get(`/${encodeURIComponent(bucket.trim())}`, qs.toString().replace(/%20/g, "+"))
  const keys = tag(xml, "Key")
  const sizes = tag(xml, "Size")
  const dates = tag(xml, "LastModified")
  return keys.slice(0, limit).map((k, i) => ({
    key: k,
    size: sizes[i] !== undefined ? Number(sizes[i]) : undefined,
    modified: dates[i] ? String(dates[i]).slice(0, 10) : undefined,
  }))
}

export function formatObject(o: S3Object, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const size = o.size !== undefined ? ` (${o.size > 1048576 ? `${(o.size / 1048576).toFixed(1)} MB` : `${(o.size / 1024).toFixed(1)} KB`})` : ""
  return `${prefix}${o.key}${size}${o.modified ? ` — ${o.modified}` : ""}`
}
