/**
 * USITC HTS — keyless public API client.
 */
const BASE = "https://hts.usitc.gov"
const SOURCE = "USITC HTS"
const UA = "hts-tariff-mcp"

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

export async function getText(path: string, init?: RequestInit): Promise<string> {
  const res = await request(path, init)
  return await res.text()
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

export async function search_tariff(a: { keyword: string, limit?: number }): Promise<string> {
  const kw = clean(a.keyword)
  if (kw.length < 2) throw new SourceError("keyword must be at least 2 characters")
  const limit = clampLimit(a.limit, 15, 50)
  const d = await getJson(`/reststop/search?keyword=${encodeURIComponent(kw)}`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No tariff line matches "${kw}".`
  return section(`${rows.length} tariff line(s) match "${kw}"`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.htsno)} · ${clean(r.description).slice(0, 140)} · general ${clean(r.general)}`))
}

export async function tariff_line(a: { htsno: string }): Promise<string> {
  const no = clean(a.htsno)
  if (!/^[0-9.]{4,14}$/.test(no)) throw new SourceError("htsno must look like 8471.30.01")
  const d = await getJson(`/reststop/search?keyword=${encodeURIComponent(no)}`)
  const all: any[] = Array.isArray(d) ? d : []
  const rows = all.filter((x) => clean(x.htsno).startsWith(no))
  const r = rows[0] ?? all[0]
  if (!r) throw new SourceError(`No tariff line ${no}`)
  return section(`${clean(r.htsno)}`, [
    clean(r.description),
    bullet("General rate", r.general),
    bullet("Special rate", r.special),
    bullet("Column 2 rate", r.other),
    bullet("Unit of quantity", [clean(r.units), clean(r.unit2)].filter(Boolean).join(" / ")),
    bullet("Footnotes", r.footnotes),
  ])
}

export async function tariff_range(a: { from: string, to: string, limit?: number }): Promise<string> {
  const from = clean(a.from)
  const to = clean(a.to)
  if (!/^[0-9.]{4,14}$/.test(from) || !/^[0-9.]{4,14}$/.test(to)) throw new SourceError("from and to must be tariff numbers")
  const limit = clampLimit(a.limit, 40, 100)
  const d = await getJson(`/reststop/exportList?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&format=JSON&styles=false`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No tariff lines between ${from} and ${to}.`
  return section(`${rows.length} tariff line(s) from ${from} to ${to}`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.htsno)} · ${clean(r.description).slice(0, 120)} · general ${clean(r.general)}`))
}

export async function tariff_chapter(a: { chapter: string, limit?: number }): Promise<string> {
  const ch = clean(a.chapter)
  if (!/^\d{2}$/.test(ch)) throw new SourceError("chapter must be two digits")
  const limit = clampLimit(a.limit, 30, 100)
  const d = await getJson(`/reststop/exportList?from=${ch}&to=${ch}&format=JSON&styles=false`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No tariff lines in chapter ${ch}.`
  const heads = rows.filter((r) => clean(r.indent) === "0").length
  return section(`Chapter ${ch}: ${rows.length} line(s), ${heads} at indent 0`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${"  ".repeat(Math.min(Number(r.indent) || 0, 4))}${clean(r.htsno)} · ${clean(r.description).slice(0, 110)}${clean(r.general) ? ` · ${clean(r.general)}` : ""}`))
}

export async function tariff_subtree(a: { prefix: string, limit?: number }): Promise<string> {
  const p = clean(a.prefix)
  if (!/^\d{4}(\.\d{2})?$/.test(p)) throw new SourceError("prefix must look like 8471 or 8471.30")
  const limit = clampLimit(a.limit, 40, 100)
  const d = await getJson(`/reststop/exportList?from=${encodeURIComponent(p)}&to=${encodeURIComponent(p + "9999")}&format=JSON&styles=false`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `Nothing under heading ${p}.`
  return section(`${rows.length} line(s) under ${p}`, rows.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.htsno)} · ${clean(r.description).slice(0, 120)} · general ${clean(r.general)}`))
}
