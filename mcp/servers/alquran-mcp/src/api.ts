/**
 * AlQuran Cloud — Quran text with translations and verse search from the AlQuran Cloud API. Keyless: no signup, no API key, no environment variables.
 *
 * Verified live against api.alquran.cloud.
 */
const API = "https://api.alquran.cloud/v1"

export class AlQuranError extends Error {}

type Row = Record<string, unknown>

const val = (v: unknown): string => {
  if (typeof v === "string") return v
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : ""
  if (Array.isArray(v)) return v.length > 0 ? val(v[0]) : ""
  if (v && typeof v === "object") {
    const o = v as Row
    if ("en" in o) return val(o.en)
    const first = Object.values(o)[0]
    return first === undefined ? "" : val(first)
  }
  return ""
}

const at = (o: unknown, path: string): unknown =>
  path === "" ? o : path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Row)[k] : undefined), o)

const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : [])

async function get<T>(url: string, init?: RequestInit, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "user-agent": "alquran-mcp", accept: "application/json", ...(init?.headers ?? {}) },
    })
    if (!res.ok) throw new AlQuranError(`AlQuran Cloud returned HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof AlQuranError) throw e
    if ((e as Error).name === "AbortError") throw new AlQuranError("AlQuran Cloud request timed out")
    throw new AlQuranError(`AlQuran Cloud request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}


export async function getSurah(number = 1): Promise<string> {
  if (!Number.isInteger(number) || number < 1 || number > 114) throw new AlQuranError("surah number must be 1 to 114")
  const arabic = await get<unknown>(`${API}/surah/${number}`)
  const english = await get<unknown>(`${API}/surah/${number}/en.asad`)
  const ayahs = rows(at(arabic, "data.ayahs"))
  if (ayahs.length === 0) throw new AlQuranError("surah returned no verses")
  const trans = rows(at(english, "data.ayahs"))
  const lines = ayahs.slice(0, 5).map((a, i) => `${val(at(a, "numberInSurah"))}. ${val(at(a, "text"))}\n   ${val(at(trans[i], "text"))}`)
  return [
    `Surah ${val(at(arabic, "data.number"))} — ${val(at(arabic, "data.englishName"))}`,
    "",
    ...lines,
    "",
    `${ayahs.length} verses total`,
  ].join("\n")
}

export async function searchVerses(query: string): Promise<string> {
  const q = query.trim()
  if (q.length < 2) throw new AlQuranError("query must be at least two characters")
  const body = await get<unknown>(`${API}/search/${encodeURIComponent(q)}/all/en.asad`)
  const items = rows(at(body, "data.matches"))
  if (items.length === 0) return `No verses match "${q}".`
  const total = val(at(body, "data.count"))
  const lines = items.slice(0, 5).map((r, i) => `${i + 1}. ${val(at(r, "surah.englishName"))} ${val(at(r, "numberInSurah"))} — ${val(at(r, "text")).slice(0, 120)}`)
  return [`Verses matching "${q}" — ${total} total`, "", ...lines].join("\n")
}
