/**
 * RIPE Stat — keyless public API client.
 */
const BASE = "https://stat.ripe.net"
const SOURCE = "RIPE Stat"
const UA = "ripestat-mcp"

export class SourceError extends Error {}

async function request(path: string, init?: RequestInit, timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string, init?: RequestInit): Promise<any> {
  const res = await request(path, init)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

export async function network_info(a: { resource: string }): Promise<string> {
  const resource = clean(a.resource)
  if (!resource) throw new SourceError("resource is required")
  const d = await getJson(`/data/network-info/data.json?resource=${encodeURIComponent(resource)}`)
  const asns: string[] = Array.isArray(d?.data?.asns) ? d.data.asns.map((x: unknown) => clean(x)) : []
  const prefix = clean(d?.data?.prefix) || "unknown"
  if (!asns.length) return `${resource} is not announced in the global routing table (covering prefix ${prefix}).`
  return `${resource} → ${prefix}\n  announced by ${asns.map((x) => "AS" + x).join(", ")}`
}

export async function prefix_overview(a: { resource: string, limit?: number }): Promise<string> {
  const resource = clean(a.resource)
  const limit = clampLimit(a.limit, 10, 50)
  const d = await getJson(`/data/prefix-overview/data.json?resource=${encodeURIComponent(resource)}`)
  const data = d?.data ?? {}
  const asns: any[] = Array.isArray(data.asns) ? data.asns : []
  if (!asns.length) return `${resource} is not announced.`
  const rows = asns.slice(0, limit).map((x, i) => `${i + 1}. AS${clean(x.asn)} ${clean(x.holder)}${x.description ? " — " + clean(x.description) : ""}`)
  return section(`${clean(data.resource) || resource} is announced by ${asns.length} ASN(s)`, rows)
}

export async function as_overview(a: { asn: string }): Promise<string> {
  const raw = clean(a.asn)
  if (!/^(AS)?\d+$/i.test(raw)) throw new SourceError("asn must be a number such as 15169 or AS15169")
  const id = /^AS/i.test(raw) ? raw.toUpperCase() : `AS${raw}`
  const d = await getJson(`/data/as-overview/data.json?resource=${encodeURIComponent(id)}`)
  const x = d?.data ?? {}
  if (!x.resource) throw new SourceError(`RIPE Stat has no data for ${id}`)
  return section(`${id}`, [bullet("Holder", x.holder), bullet("Announced", x.announced === true ? "yes" : x.announced === false ? "no" : x.announced), bullet("Type", x.type)])
}

export async function announced_prefixes(a: { asn: string, limit?: number }): Promise<string> {
  const raw = clean(a.asn)
  if (!/^(AS)?\d+$/i.test(raw)) throw new SourceError("asn must be a number such as 15169 or AS15169")
  const id = /^AS/i.test(raw) ? raw.toUpperCase() : `AS${raw}`
  const limit = clampLimit(a.limit, 20, 100)
  const d = await getJson(`/data/announced-prefixes/data.json?resource=${encodeURIComponent(id)}`)
  const list: any[] = Array.isArray(d?.data?.prefixes) ? d.data.prefixes : []
  if (!list.length) return `${id} announces no prefixes.`
  const rows = list.slice(0, limit).map((p, i) => `${i + 1}. ${clean(p.prefix)}`)
  return section(`${id} announces ${list.length} prefix(es)`, rows)
}

export async function asn_neighbours(a: { asn: string, limit?: number }): Promise<string> {
  const raw = clean(a.asn)
  if (!/^(AS)?\d+$/i.test(raw)) throw new SourceError("asn must be a number such as 15169 or AS15169")
  const id = /^AS/i.test(raw) ? raw.toUpperCase() : `AS${raw}`
  const limit = clampLimit(a.limit, 25, 100)
  const d = await getJson(`/data/asn-neighbours/data.json?resource=${encodeURIComponent(id)}`)
  const list: any[] = Array.isArray(d?.data?.neighbours) ? d.data.neighbours : []
  if (!list.length) return `${id} has no neighbours in RIPE Stat.`
  const rows = list.slice(0, limit).map((n) => `AS${clean(n.asn)} (${clean(n.type) || "neighbour"}${n.power !== undefined ? ", " + clean(n.power) + " shared prefixes" : ""})`)
  return section(`${id} has ${list.length} neighbour(s)`, rows)
}
