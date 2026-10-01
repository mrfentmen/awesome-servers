import { createHash, randomUUID } from "node:crypto"

const BASE = "https://api.pwnedpasswords.com/range"
const UA = "mrfentmen-password-breach-check-mcp/1.0 (https://github.com/mrfentmen)"
export class BreachError extends Error {}

async function queryRange(prefix: string): Promise<Map<string, number>> {
  const res = await fetch(`${BASE}/${prefix}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new BreachError(`Pwned API error ${res.status}`)
  const body = await res.text()
  const map = new Map<string, number>()
  for (const line of body.split("\r\n")) {
    const [suffix, count] = line.split(":")
    if (suffix) map.set(suffix.toLowerCase(), Number(count ?? 0))
  }
  return map
}

export async function checkPassword(args: { password?: string }): Promise<string> {
  const pw = args.password ?? ""
  if (!pw) throw new BreachError("Provide a password")
  if (pw.length > 512) throw new BreachError("Password too long to check")
  const hash = createHash("sha1").update(pw, "utf8").digest("hex").toUpperCase()
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)
  const map = await queryRange(prefix)
  const count = map.get(suffix.toLowerCase()) ?? 0
  const note = count > 0
    ? `This password has appeared ${count.toLocaleString()} times in known breaches. Do not use it.`
    : "No matches in known breach data. That is good, but use a unique password anyway."
  return `${note}\n(Sha1 prefix sent: ${prefix} only, full password stayed local)`
}

export async function checkHash(args: { sha1_hash?: string }): Promise<string> {
  const h = (args.sha1_hash ?? "").trim().toUpperCase()
  if (!/^[0-9A-F]{40}$/.test(h)) throw new BreachError("Provide a full 40 character SHA1 hash")
  const prefix = h.slice(0, 5)
  const suffix = h.slice(5)
  const map = await queryRange(prefix)
  const count = map.get(suffix.toLowerCase()) ?? 0
  return count > 0
    ? `This hash appeared ${count.toLocaleString()} times in known breaches.`
    : "No matches in known breach data."
}

// ---- muxB tools:

export interface ExposureLookupArgs {
  query?: string;
  limit?: number;
}

