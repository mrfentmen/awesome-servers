const BASE = "https://api.worldbank.org/v2"

export class WorldBankError extends Error {}

async function getJson(url: string, timeoutMs = 40000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "worldbank-mcp", accept: "application/json" },
    })
    if (!res.ok) throw new WorldBankError(`World Bank API responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof WorldBankError) throw e
    if ((e as Error).name === "AbortError") throw new WorldBankError("World Bank request timed out")
    if (e instanceof SyntaxError) throw new WorldBankError("World Bank API returned a non-JSON response")
    throw new WorldBankError(`World Bank request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const codes = (v: string, label: string): string => {
  const c = v.trim().toUpperCase()
  if (!/^[A-Z0-9;]{2,120}$/.test(c)) throw new WorldBankError(`${label} must look like USA, or a ; separated list`)
  return c
}

const indicatorCode = (v: string): string => {
  const c = v.trim().toUpperCase()
  if (!/^[A-Z0-9._-]{2,60}$/.test(c)) throw new WorldBankError(`"${v}" is not a valid indicator code`)
  return c
}

function fmt(v: unknown): string {
  const n = typeof v === "number" ? v : Number(v)
  if (v === null || v === undefined || !Number.isFinite(n)) return "no data"
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (Math.abs(n) >= 1e3) return n.toLocaleString("en-US", { maximumFractionDigits: 2 })
  return String(Number(n.toFixed(4)))
}

let catalogCache: { id: string; name: string }[] | null = null

async function catalog(): Promise<{ id: string; name: string }[]> {
  if (catalogCache) return catalogCache
  const first = await getJson(`${BASE}/indicator?format=json&per_page=20000&page=1`)
  const meta = Array.isArray(first) ? first[0] : null
  const page1: any[] = Array.isArray(first?.[1]) ? first[1] : []
  let items = page1.map((i) => ({ id: String(i.id), name: String(i.name ?? i.id) }))
  const pages = Number(meta?.pages ?? 1)
  if (pages > 1) {
    const second = await getJson(`${BASE}/indicator?format=json&per_page=20000&page=2`)
    const page2: any[] = Array.isArray(second?.[1]) ? second[1] : []
    items = items.concat(page2.map((i) => ({ id: String(i.id), name: String(i.name ?? i.id) })))
  }
  catalogCache = items
  return items
}

export async function searchIndicators(query: string, limit: number): Promise<string> {
  const raw = query.trim().toLowerCase()
  if (raw.length < 2) throw new WorldBankError("Search term must be at least 2 characters")
  // Names carry punctuation ("Population, total"), so match every word rather than the whole phrase.
  const words = raw.split(/[^a-z0-9.]+/).filter((w) => w.length > 0)
  const all = await catalog()
  const hits = all.filter((i) => {
    const hay = `${i.name.toLowerCase()} ${i.id.toLowerCase()}`
    return words.every((w) => hay.includes(w))
  })
  if (hits.length === 0) return `No World Bank indicator matched "${query}" (${all.length} checked).`
  // Rank the tightest name match first: exact, then prefix, then shortest name.
  const scored = hits
    .map((i) => {
      const name = i.name.toLowerCase()
      const score = name === raw ? 0 : name.startsWith(raw) ? 1 : name.includes(raw) ? 2 : 3
      return { i, score }
    })
    .sort((a, b) => a.score - b.score || a.i.name.length - b.i.name.length)
  const lines = scored.slice(0, limit).map(({ i }, n) => `${n + 1}. ${i.name} — ${i.id}`)
  return `World Bank indicators matching "${query}" (${hits.length} of ${all.length}):\n\n${lines.join("\n")}`
}

export async function indicatorInfo(code: string): Promise<string> {
  const d = await getJson(`${BASE}/indicator/${indicatorCode(code)}?format=json`)
  const i = Array.isArray(d?.[1]) ? d[1][0] : null
  if (!i) throw new WorldBankError(`Unknown indicator code "${code}"`)
  return [
    `Indicator: ${i.name ?? i.id}`,
    `Code: ${i.id}`,
    `Unit: ${i.unit || "not stated"}`,
    `Source: ${i.source?.value ?? "unknown"} (${i.sourceOrganization ?? "World Bank"})`,
    "",
    (i.sourceNote ?? "No description published.").replace(/\s+/g, " ").slice(0, 700),
  ].join("\n")
}

export async function countryInfo(code: string): Promise<string> {
  const d = await getJson(`${BASE}/country/${codes(code, "Country code")}?format=json`)
  const c = Array.isArray(d?.[1]) ? d[1][0] : null
  if (!c) throw new WorldBankError(`Unknown country code "${code}"`)
  return [
    `Country: ${c.name} (${c.id})`,
    `ISO2: ${c.iso2Code ?? "n/a"}   Region: ${c.region?.value || "n/a"}`,
    `Income level: ${c.incomeLevel?.value || "n/a"}`,
    `Lending type: ${c.lendingType?.value || "n/a"}`,
    `Capital: ${c.capitalCity || "n/a"}   Longitude/Latitude: ${c.longitude ?? "?"}/${c.latitude ?? "?"}`,
  ].join("\n")
}

export async function indicatorSeries(
  country: string,
  indicator: string,
  fromYear: number,
  toYear: number
): Promise<string> {
  const c = codes(country, "Country code")
  const ind = indicatorCode(indicator)
  const d = await getJson(
    `${BASE}/country/${c}/indicator/${ind}?format=json&date=${Math.trunc(fromYear)}:${Math.trunc(toYear)}&per_page=100`
  )
  const rows: any[] = Array.isArray(d?.[1]) ? d[1] : []
  if (rows.length === 0) throw new WorldBankError(`No data for ${ind} in ${c} between ${fromYear} and ${toYear}`)
  const name = rows[0]?.indicator?.value ?? ind
  const label = rows[0]?.country?.value ?? c
  const lines = rows.map((r) => `   ${r.date}: ${fmt(r.value)}`)
  return [`${name} — ${label}`, `${fromYear}-${toYear} (${rows.length} years reported):`, "", ...lines].join("\n")
}

export async function compareCountries(
  countryCodes: string,
  indicator: string,
  year: number
): Promise<string> {
  const c = codes(countryCodes, "Country codes")
  const ind = indicatorCode(indicator)
  const d = await getJson(`${BASE}/country/${c}/indicator/${ind}?format=json&date=${Math.trunc(year)}&per_page=200`)
  const rows: any[] = Array.isArray(d?.[1]) ? d[1] : []
  if (rows.length === 0) throw new WorldBankError(`No data for ${ind} in ${year}`)
  const name = rows[0]?.indicator?.value ?? ind
  const sorted = [...rows].sort((a, b) => Number(b.value ?? -Infinity) - Number(a.value ?? -Infinity))
  const lines = sorted.map((r, i) => `${i + 1}. ${r.country?.value ?? r.countryiso3code} — ${fmt(r.value)}`)
  return [`${name} in ${year}`, "", ...lines].join("\n")
}

export async function latestValue(country: string, indicator: string): Promise<string> {
  const c = codes(country, "Country code")
  const ind = indicatorCode(indicator)
  const d = await getJson(`${BASE}/country/${c}/indicator/${ind}?format=json&per_page=10&mrnev=1`)
  const rows: any[] = Array.isArray(d?.[1]) ? d[1] : []
  const row = rows.find((r) => r.value !== null)
  if (!row) throw new WorldBankError(`No reported value for ${ind} in ${c}`)
  return [
    `Indicator: ${row.indicator?.value ?? ind}`,
    `Country: ${row.country?.value ?? c}`,
    `Most recent value: ${fmt(row.value)} (${row.date})`,
  ].join("\n")
}
