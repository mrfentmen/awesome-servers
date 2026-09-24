/**
 * Pinata API client. Needs PINATA_JWT (free at https://app.pinata.cloud/keys).
 * Docs: https://docs.pinata.cloud/
 */
const BASE = "https://api.pinata.cloud"

export class PinataError extends Error {}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const jwt = process.env.PINATA_JWT
  if (!jwt) throw new PinataError("Set PINATA_JWT first (free at app.pinata.cloud/keys).")
  return { "User-Agent": "pinata-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${jwt}`, ...extra }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new PinataError("Pinata rejected the key (401/403). Check PINATA_JWT.")
  if (res.status === 404) throw new PinataError("Not found.")
  if (!res.ok) throw new PinataError(`Pinata error ${res.status}`)
  return (await res.json()) as T
}

export interface Pin {
  cid: string
  name?: string
  size?: number
  date?: string
}

export async function listPins(limit = 10): Promise<{ count: number; pins: Pin[] }> {
  const data = await getJson<Raw>(`/data/pinList?status=pinned&pageLimit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.rows) ? data.rows : []
  return {
    count: typeof data.count === "number" ? data.count : rows.length,
    pins: rows.slice(0, limit).map((r) => ({
      cid: String(r.ipfs_pin_hash),
      name: r.metadata?.name,
      size: r.size,
      date: r.date_pinned ? String(r.date_pinned).slice(0, 10) : undefined,
    })),
  }
}

export async function pinJson(name: string, content: string): Promise<string> {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new PinataError("Content must be valid JSON.")
  }
  const res = await fetch(`${BASE}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ pinataContent: parsed, pinataMetadata: { name: name.trim() || "mcp-pin" } }),
    signal: AbortSignal.timeout(30000),
  })
  if (res.status === 401 || res.status === 403) throw new PinataError("Pinata rejected the key (401/403).")
  if (!res.ok) throw new PinataError(`Pinata error ${res.status}`)
  const data = (await res.json()) as Raw
  if (!data.IpfsHash) throw new PinataError("Pinata returned no hash.")
  return `Pinned as ${data.IpfsHash} (https://gateway.pinata.cloud/ipfs/${data.IpfsHash})`
}

export async function unpin(cid: string): Promise<string> {
  const clean = cid.trim()
  if (!/^Qm[A-Za-z0-9]{44}$/.test(clean) && !/^bafy/.test(clean)) {
    throw new PinataError(`Not a CID: "${cid}".`)
  }
  const res = await fetch(`${BASE}/pinning/unpin/${clean}`, {
    method: "DELETE",
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new PinataError("Pinata rejected the key (401/403).")
  if (!res.ok) throw new PinataError(`Pinata error ${res.status}`)
  return `Unpinned ${clean}.`
}

export function formatPin(p: Pin, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const size = p.size !== undefined ? ` (${(p.size / 1024).toFixed(1)} KB)` : ""
  return `${prefix}${p.name ?? p.cid}${p.name ? ` [${p.cid}]` : ""}${size}${p.date ? ` — ${p.date}` : ""}`
}
