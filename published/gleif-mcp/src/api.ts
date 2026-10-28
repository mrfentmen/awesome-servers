/**
 * GLEIF — keyless public API client.
 */
const BASE = "https://api.gleif.org/api/v1"
const SOURCE = "GLEIF"
const UA = "gleif-mcp"

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

function leiRows(d: any): any[] {
  const data = d?.data
  return Array.isArray(data) ? data : data ? [data] : []
}
function leiSummary(x: any): string {
  const a = x?.attributes ?? {}
  const name = clean(a.entity?.legalName?.name)
  const country = clean(a.entity?.legalAddress?.country)
  const status = clean(a.registration?.status)
  return `${name || "unknown entity"}${country ? " · " + country : ""}${status ? " · " + status : ""} · LEI ${clean(a.lei || x?.id)}`
}

export async function search_by_name(a: { name: string, limit?: number }): Promise<string> {
  const name = clean(a.name)
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const limit = clampLimit(a.limit, 5, 20)
  const d = await getJson(`/lei-records?filter%5Bentity.legalName%5D=${encodeURIComponent(name)}&page%5Bsize%5D=${limit}`)
  const list = leiRows(d)
  if (!list.length) return `GLEIF has no entity matching "${name}".`
  return section(`${d?.meta?.pagination?.total ?? list.length} entit(ies) match "${name}"`, list.map((x, i) => `${i + 1}. ${leiSummary(x)}`))
}

export async function lei_record(a: { lei: string }): Promise<string> {
  const lei = clean(a.lei).toUpperCase()
  if (!/^[A-Z0-9]{20}$/.test(lei)) throw new SourceError("lei must be 20 characters")
  const d = await getJson(`/lei-records/${lei}`)
  const x = leiRows(d)[0]
  if (!x) throw new SourceError(`No LEI record ${lei}`)
  const attrs = x.attributes ?? {}
  const addr = attrs.entity?.legalAddress ?? {}
  return section(clean(attrs.entity?.legalName?.name), [
    bullet("LEI", attrs.lei),
    bullet("Status", attrs.registration?.status),
    bullet("Jurisdiction", attrs.entity?.jurisdiction),
    bullet("Legal form", attrs.entity?.legalForm?.id),
    bullet("Address", [addr.addressLines, addr.city, addr.region, addr.country].flat().filter(Boolean).map(clean).join(", ")),
    bullet("Registered", attrs.registration?.initialRegistrationDate),
    bullet("Last update", attrs.registration?.lastUpdateDate),
  ])
}

export async function ultimate_parent(a: { lei: string }): Promise<string> {
  const lei = clean(a.lei).toUpperCase()
  if (!/^[A-Z0-9]{20}$/.test(lei)) throw new SourceError("lei must be 20 characters")
  const d = await getJson(`/lei-records/${lei}/ultimate-parent`)
  const list = leiRows(d)
  if (!list.length) return `No ultimate parent is recorded for ${lei}.`
  return section(`Ultimate parent of ${lei}`, list.map((x) => leiSummary(x)))
}

export async function direct_children(a: { lei: string, limit?: number }): Promise<string> {
  const lei = clean(a.lei).toUpperCase()
  if (!/^[A-Z0-9]{20}$/.test(lei)) throw new SourceError("lei must be 20 characters")
  const limit = clampLimit(a.limit, 15, 50)
  const d = await getJson(`/lei-records/${lei}/direct-children?page%5Bsize%5D=${limit}`)
  const list = leiRows(d)
  if (!list.length) return `No direct children are recorded for ${lei}.`
  return section(`${list.length} direct child(ren) of ${lei}`, list.map((x, i) => `${i + 1}. ${leiSummary(x)}`))
}

export async function fuzzy_search(a: { name: string }): Promise<string> {
  const name = clean(a.name)
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const d = await getJson(`/fuzzycompletions?field=entity.legalName&q=${encodeURIComponent(name)}`)
  const list = leiRows(d)
  if (!list.length) return `No fuzzy match for "${name}".`
  return section(`${list.length} suggestion(s) for "${name}"`, list.slice(0, 15).map((x, i) => `${i + 1}. ${clean(x.attributes?.value)} · LEI ${clean(x.relationships?.["lei-records"]?.data?.id)}`))
}
