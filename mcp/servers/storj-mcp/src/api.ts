/**
 * Storj via S3-compatible gateway (SigV4 signed inline, no extra deps).
 * Needs STORJ_ACCESS_KEY + STORJ_SECRET_KEY (Storj dashboard > Access).
 * Optional STORJ_ENDPOINT (default https://gateway.storjshare.io).
 */
import { createHmac, createHash } from "node:crypto"

const ENDPOINT = (process.env.STORJ_ENDPOINT ?? "https://gateway.storjshare.io").replace(/\/+$/, "")
const HOST = new URL(ENDPOINT).host

export class StorjError extends Error {}

function creds(): { access: string; secret: string } {
  const access = process.env.STORJ_ACCESS_KEY
  const secret = process.env.STORJ_SECRET_KEY
  if (!access || !secret) throw new StorjError("Set STORJ_ACCESS_KEY and STORJ_SECRET_KEY first.")
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
  const scope = `${date}/us-east-1/s3/aws4_request`
  const toSign = ["AWS4-HMAC-SHA256", amz, scope, createHash("sha256").update(canonical, "utf8").digest("hex")].join("\n")
  const kDate = hmac(`AWS4${secret}`, date)
  const kRegion = hmac(kDate, "us-east-1")
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
  if (res.status === 401 || res.status === 403) throw new StorjError("Storj refused (401/403). Check keys and endpoint.")
  if (!res.ok) throw new StorjError(`Storj error ${res.status}`)
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
  if (!bucket.trim()) throw new StorjError("Bucket is empty.")
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

// ---- muxB tools:

const STJ_STATUS = "https://status.storj.io/api/v2"

async function stjGet(path: string): Promise<unknown> {
  const res = await fetch(`${STJ_STATUS}/${path}`, {
    headers: { "User-Agent": "storj-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new StorjError(`Storj status page has no "${path}".`)
  if (!res.ok) throw new StorjError(`Storj status page returned ${res.status} for ${path}.`)
  return await res.json()
}

interface StjComponent {
  id?: string
  name?: string
  status?: string
  group?: boolean
  description?: string
  components?: string[]
}

export async function serviceStatus(): Promise<string> {
  const summary = (await stjGet("summary.json")) as {
    page?: { name?: string; url?: string; time_zone?: string; updated_at?: string }
    status?: { indicator?: string; description?: string }
    components?: StjComponent[]
    incidents?: Array<{ name?: string; status?: string; impact?: string; updated_at?: string }>
    scheduled_maintenances?: Array<{ name?: string; scheduled_for?: string; scheduled_until?: string }>
  }
  const rows = Array.isArray(summary.components) ? summary.components : []
  const byId = new Map(rows.map((c) => [String(c.id), c]))
  const out = [
    `${summary.page?.name ?? "Storj DCS"}: ${summary.status?.description ?? "status not reported"} (indicator ${summary.status?.indicator ?? "unknown"}).`,
    `Page timezone ${summary.page?.time_zone ?? "not reported"}; last updated ${(summary.page?.updated_at ?? "not reported").slice(0, 19).replace("T", " ")}.`,
    "",
  ]
  const degraded: string[] = []
  for (const c of rows.filter((r) => r.group !== true)) {
    if (c.status !== "operational") {
      degraded.push(`${c.name ?? "(unnamed)"}: ${c.status ?? "unknown"}${c.description ? ` - ${c.description}` : ""}`)
    }
  }
  const groups = rows.filter((r) => r.group === true)
  out.push(`${rows.length - groups.length} monitored services, ${degraded.length} not fully operational.`)
  if (degraded.length === 0) {
    out.push("Every monitored service reports operational.")
  } else {
    out.push(...degraded.slice(0, 10).map((d) => `  - ${d}`))
  }
  if (groups.length) {
    out.push("", "Regions:")
    for (const g of groups.slice(0, 10)) {
      const kids = (g.components ?? []).map((id) => byId.get(String(id))?.status).filter(Boolean) as string[]
      const bad = kids.filter((s) => s !== "operational").length
      out.push(`  - ${g.name ?? "(unnamed)"}: ${kids.length} services, ${bad} degraded`)
    }
  }
  const incidents = Array.isArray(summary.incidents) ? summary.incidents : []
  const upcoming = Array.isArray(summary.scheduled_maintenances) ? summary.scheduled_maintenances : []
  out.push("", `Open incidents: ${incidents.length}. Scheduled maintenance: ${upcoming.length}.`)
  for (const i of incidents.slice(0, 5)) {
    out.push(`  ! ${i.name ?? "(untitled)"} [${i.status ?? "?"}, ${i.impact ?? "impact not reported"}] updated ${(i.updated_at ?? "?").slice(0, 10)}`)
  }
  for (const m of upcoming.slice(0, 5)) {
    out.push(`  # ${m.name ?? "(untitled)"} from ${(m.scheduled_for ?? "?").slice(0, 16).replace("T", " ")} to ${(m.scheduled_until ?? "?").slice(0, 16).replace("T", " ")}`)
  }
  return out.join("\n")
}

const STJ_TEMP = /(^~\$)|(\.tmp$)|(\.temp$)|(\.bak$)|(\.old$)|(\.swp$)|(\.part$)|(\.crdownload$)|(\.lock$)|(\.DS_Store$)|(\.gitkeep$)/i
const STJ_DOUBLE_EXT = /\.(txt|doc|docx|pdf|jpg|png|xls|xlsx|ppt|pptx|csv|zip|gz|exe|js|html)\.(exe|scr|com|pif|bat|cmd|sh|js|txt|zip)$/i
const STJ_SAFE = /^[A-Za-z0-9!_.*'()/-]+$/

export interface StorjKeyAuditArgs {
  keys: string
  bucket?: string
}

interface StjRow {
  key: string
  size?: number
}

function stjParseKeys(text: string): StjRow[] {
  const out: StjRow[] = []
  for (const line of (text ?? "").split(/\r?\n/).slice(0, 2000)) {
    const row = line.trim()
    if (!row || row.startsWith("#")) continue
    const tab = row.indexOf("\t")
    if (tab > 0) {
      const size = Number(row.slice(tab + 1).trim())
      out.push({ key: row.slice(0, tab), size: Number.isFinite(size) ? size : undefined })
    } else {
      out.push({ key: row })
    }
  }
  return out
}

export async function storageKeyAudit(args: StorjKeyAuditArgs): Promise<string> {
  const rows = stjParseKeys(args.keys ?? "")
  if (rows.length === 0) {
    return "Paste the object keys to audit, one per line. Add a tab and a byte count after a key to include size totals."
  }
  const where = args.bucket ? ` for ${args.bucket}` : ""
  const keys = rows.map((r) => r.key)
  const unique = new Set(keys)
  const depths = new Map<number, number>()
  const prefixes = new Map<string, number>()
  const exts = new Map<string, number>()
  const problems: string[] = []
  let dated = 0
  let totalBytes = 0
  let sized = 0
  for (const r of rows) {
    const k = r.key
    const segments = k.split("/")
    const depth = segments.length - 1
    depths.set(depth, (depths.get(depth) ?? 0) + 1)
    const prefix = segments.length > 1 ? segments[0] : "(bucket root)"
    prefixes.set(prefix, (prefixes.get(prefix) ?? 0) + 1)
    const dot = k.lastIndexOf(".")
    const ext = dot > k.lastIndexOf("/") ? k.slice(dot + 1).toLowerCase() : "(none)"
    exts.set(ext, (exts.get(ext) ?? 0) + 1)
    if (segments.some((s) => /^\d{4}$/.test(s) || /^\d{4}-\d{2}$/.test(s) || /^\d{8}$/.test(s))) dated++
    if (r.size !== undefined) {
      sized++
      totalBytes += r.size
    }
    if (!STJ_SAFE.test(k)) problems.push(`${k}: uses characters that need URL-encoding or are not portable (spaces, quotes, unicode)`)
    if (k.length > 512) problems.push(`${k.slice(0, 40)}...: key is ${k.length} characters long`)
    if (k.includes("//")) problems.push(`${k}: contains an empty path segment (//)`)
    if (k.startsWith("/")) problems.push(`${k}: leading slash is meaningless in S3 and creates a hidden prefix`)
    if (k !== k.trim()) problems.push(`${k}: leading or trailing whitespace in the key`)
    if (k.endsWith("/")) problems.push(`${k}: folder marker object`)
    if (STJ_DOUBLE_EXT.test(k)) problems.push(`${k}: double extension, a classic way to disguise an executable`)
    if (STJ_TEMP.test(k)) problems.push(`${k}: temporary or editor artefact, probably not worth storing`)
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(k)) {
      problems.push(`${k}: bare UUID as the whole key, no namespace to search by`)
    }
  }
  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, c]) => `${k} (${c})`)
  const lens = keys.map((k) => k.length)
  const biggest = rows
    .filter((r) => r.size !== undefined)
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    .slice(0, 3)
  const out = [
    `${rows.length} key(s) audited${where}, ${unique.size} unique, ${rows.length - unique.size} duplicate.`,
    `Key length: shortest ${Math.min(...lens)}, longest ${Math.max(...lens)}, mean ${(lens.reduce((a, b) => a + b, 0) / lens.length).toFixed(0)}.`,
    sized > 0
      ? `Sizes supplied for ${sized} key(s): ${totalBytes.toLocaleString()} bytes total (${(totalBytes / 1048576).toFixed(1)} MiB).`
      : "No sizes supplied, so this is a layout audit only.",
    "",
    `Path depth: ${[...depths.entries()].sort((a, b) => a[0] - b[0]).map(([d, c]) => `${d} slash(es): ${c}`).join(", ")}`,
    `Top prefixes: ${top(prefixes, 8).join(", ") || "(none)"}`,
    `Extensions: ${top(exts, 8).join(", ") || "(none)"}`,
    `Keys with a YYYY / YYYY-MM / YYYYMMDD segment: ${dated} of ${rows.length}.`,
  ]
  if (biggest.length) {
    out.push(`Largest: ${biggest.map((b) => `${b.key} (${(b.size ?? 0).toLocaleString()} B)`).join(", ")}`)
  }
  const uniqueProblems = [...new Set(problems)]
  out.push("", `Layout problems: ${uniqueProblems.length}.`)
  if (uniqueProblems.length === 0) {
    out.push("No unportable characters, no double extensions, no temp artefacts, no empty segments.")
  } else {
    out.push(...uniqueProblems.slice(0, 25).map((p) => `  - ${p}`))
    if (uniqueProblems.length > 25) out.push(`  ...and ${uniqueProblems.length - 25} more.`)
  }
  return out.join("\n")
}
