/**
 * Fruityvice — keyless public API client.
 */
const BASE = "https://www.fruityvice.com/api"
const SOURCE = "Fruityvice"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "fruityvice-mcp", accept },
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

function fruitLine(f: any): string {
  const n = f?.nutritions ?? {}
  return `- ${clean(f?.name)} · ${n.calories ?? "?"} kcal · sugar ${n.sugar ?? "?"} g · fat ${n.fat ?? "?"} g · carbs ${n.carbohydrates ?? "?"} g · protein ${n.protein ?? "?"} g${clean(f?.family) ? ` · ${clean(f.family)}` : ""}`
}

export async function allFruits(a: { limit?: number }): Promise<string> {
  const limit = a.limit ?? 20
  if (!Number.isInteger(limit) || limit < 1 || limit > 60) throw new SourceError("limit must be between 1 and 60")
  const d = await getJson(`/fruit/all`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) throw new SourceError("Fruityvice returned no fruits")
  return [
    `${rows.length} fruits on file (nutrition per 100 g), showing ${Math.min(limit, rows.length)}:`,
    "",
    ...rows.slice(0, limit).map(fruitLine),
  ].join("\n")
}

export async function fruitByName(a: { name: string }): Promise<string> {
  const name = clean(a.name).toLowerCase()
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const f = await getJson(`/fruit/${encodeURIComponent(name)}`)
  if (!f || !f.name) return `Fruityvice has no fruit called "${name}".`
  const n = f.nutritions ?? {}
  return [
    `${clean(f.name)}`,
    `${clean(f.family) || "?"} · order ${clean(f.order) || "?"} · genus ${clean(f.genus) || "?"}`,
    "",
    `Per 100 g: ${n.calories ?? "?"} kcal · sugar ${n.sugar ?? "?"} g · fat ${n.fat ?? "?"} g · carbohydrates ${n.carbohydrates ?? "?"} g · protein ${n.protein ?? "?"} g`,
  ].join("\n")
}

export async function fruitsByNutrient(a: { nutrient: string; min: number; max: number; limit?: number }): Promise<string> {
  const allowed = ["calories", "fat", "sugar", "carbohydrates", "protein"]
  const nutrient = clean(a.nutrient).toLowerCase()
  if (!allowed.includes(nutrient)) throw new SourceError(`nutrient must be one of ${allowed.join(", ")}`)
  const min = Number(a.min)
  const max = Number(a.max)
  if (!Number.isFinite(min) || min < 0) throw new SourceError("min must be zero or more")
  if (!Number.isFinite(max) || max < min) throw new SourceError("max must be at least min")
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 30) throw new SourceError("limit must be between 1 and 30")
  const d = await getJson(`/fruit/${nutrient}?min=${min}&max=${max}`)
  const rows: any[] = Array.isArray(d) ? d : []
  if (!rows.length) return `No fruit has ${nutrient} between ${min} and ${max} per 100 g.`
  return [
    `${rows.length} fruit(s) with ${nutrient} between ${min} and ${max} per 100 g (showing ${Math.min(limit, rows.length)}):`,
    "",
    ...rows.slice(0, limit).map(fruitLine),
  ].join("\n")
}
