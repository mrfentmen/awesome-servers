/**
 * DailyMed — keyless public API client.
 */
const BASE = "https://dailymed.nlm.nih.gov/dailymed/services/v2"
const SOURCE = "DailyMed"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "dailymed-mcp", accept },
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

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
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

export async function searchLabels(a: { drugName: string; limit?: number }): Promise<string> {
  const name = clean(a.drugName)
  if (name.length < 2) throw new SourceError("drugName must be at least 2 characters")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 25) throw new SourceError("limit must be between 1 and 25")
  const d = await getJson(`/spls.json?drug_name=${encodeURIComponent(name)}&pagesize=${limit}`)
  const rows: any[] = d?.data ?? []
  if (!rows.length) return `DailyMed has no label for "${name}".`
  return [
    `DailyMed labels for "${name}" (${d?.metadata?.total_elements ?? rows.length} total, showing ${rows.length}):`,
    "",
    ...rows.map((r) => [
      clean(r.title) || "untitled label",
      `  set id ${clean(r.setid)}${r.spl_version ? ` · version ${r.spl_version}` : ""}${r.published_date ? ` · published ${clean(r.published_date)}` : ""}`,
      Array.isArray(r.ingredients) && r.ingredients.length ? `  ingredients: ${r.ingredients.slice(0, 4).map((i: any) => clean(i.name)).filter(Boolean).join(", ")}` : "",
    ].filter(Boolean).join("\n")),
  ].join("\n")
}

export async function labelPackages(a: { setId: string; limit?: number }): Promise<string> {
  const id = clean(a.setId)
  if (!/^[0-9a-f-]{8,}$/i.test(id)) throw new SourceError("setId must be an SPL set id from search_labels")
  const limit = a.limit ?? 20
  if (!Number.isInteger(limit) || limit < 1 || limit > 40) throw new SourceError("limit must be between 1 and 40")
  const packaged = await getJson(`/spls/${encodeURIComponent(id)}/packaging.json`)
  const data = packaged?.data
  if (!data) throw new SourceError(`DailyMed has no label with set id ${id}`)
  const products: any[] = data.products ?? []
  const allPackaging = products.flatMap((p: any) => (Array.isArray(p.packaging) ? p.packaging : []))
  const ndcs = allPackaging.map((p: any) => clean(p.ndc)).filter(Boolean)
  const descriptions = allPackaging
    .flatMap((p: any) => (Array.isArray(p.package_descriptions) ? p.package_descriptions : []))
    .map((x: any) => clean(x))
    .filter(Boolean)
  return [
    clean(data.title) || `Label ${id}`,
    data.published_date ? `Published: ${clean(data.published_date)}${data.spl_version ? ` · version ${data.spl_version}` : ""}` : "",
    ndcs.length ? `NDC codes (${ndcs.length}, showing ${Math.min(limit, ndcs.length)}): ${ndcs.slice(0, limit).join(", ")}` : "No NDC codes listed for this label.",
    products.length ? `Products: ${products.length}` : "",
    descriptions.length ? `Packages: ${[...new Set(descriptions)].slice(0, 6).join(" | ")}` : "",
    `Label: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${id}`,
  ].filter(Boolean).join("\n")
}
