export class EnerginetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EnerginetError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new EnerginetError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return {};
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new EnerginetError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getPowerNow(limit?: number): Promise<string> {
  let url = `https://api.energidataservice.dk/dataset/PowerSystemRightNow`;
  const qs = new URLSearchParams();
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getDataset(dataset: string, limit?: number): Promise<string> {
  let url = `https://api.energidataservice.dk/dataset/${encodeURIComponent(String(dataset))}`;
  const qs = new URLSearchParams();
  if (limit !== undefined) qs.append("limit", String(limit));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxC tools:

/**
 * The day-ahead dataset has a different shape from every other Energinet feed:
 * one row per price zone per hour. The generic dataset tool dumps it as JSON,
 * which makes it hard to answer the only question anyone has, which is where
 * power is cheap right now.
 */
export async function dayAheadPrices(args: { hours?: number; zone?: string }): Promise<string> {
  const hours = Math.max(1, Math.min(args.hours ?? 12, 48))
  const data = (await req(`https://api.energidataservice.dk/dataset/DayAheadPrices?limit=200`)) as {
    records?: Array<{ TimeUTC?: string; TimeDK?: string; PriceArea?: string; DayAheadPriceEUR?: number; DayAheadPriceDKK?: number }>
  }
  const records = data?.records ?? []
  if (!records.length) throw new EnerginetError("Energinet returned no day-ahead price rows")
  const zone = (args.zone ?? "").trim().toUpperCase()
  const zones = [...new Set(records.map((r) => r.PriceArea ?? "?"))].sort()
  const wanted = zone ? records.filter((r) => (r.PriceArea ?? "").toUpperCase() === zone) : records
  if (zone && !wanted.length) {
    throw new EnerginetError(`Energinet has no price area "${zone}". Available: ${zones.join(", ")}`)
  }
  const cheapest = [...wanted].sort((a, b) => (a.DayAheadPriceEUR ?? Infinity) - (b.DayAheadPriceEUR ?? Infinity))[0]
  const dearest = [...wanted].sort((a, b) => (b.DayAheadPriceEUR ?? -Infinity) - (a.DayAheadPriceEUR ?? -Infinity))[0]
  const byHour = new Map<string, typeof wanted>()
  for (const r of wanted) {
    const key = String(r.TimeDK ?? r.TimeUTC ?? "?").slice(0, 13)
    const list = byHour.get(key) ?? []
    list.push(r)
    byHour.set(key, list)
  }
  const lines: string[] = []
  for (const [hour, list] of [...byHour.entries()].sort()) {
    const detail = list
      .sort((a, b) => (a.DayAheadPriceEUR ?? 0) - (b.DayAheadPriceEUR ?? 0))
      .map((r) => `${r.PriceArea ?? "?"} ${r.DayAheadPriceEUR != null ? `${r.DayAheadPriceEUR.toFixed(2)} EUR` : "not reported"}`)
      .join(" | ")
    lines.push(`  ${hour}:00 DK  ${detail}`)
    if (lines.length >= hours) break
  }
  return [
    `Energinet day-ahead electricity prices (${wanted.length} rows, ${zone || "all zones"}, first ${lines.length} hours)`,
    `Price areas: ${zones.join(", ")}`,
    `Cheapest row in this set: ${cheapest?.PriceArea ?? "?"} at ${cheapest?.DayAheadPriceEUR != null ? `${cheapest.DayAheadPriceEUR.toFixed(2)} EUR` : "not reported"} (${String(cheapest?.TimeDK ?? "").slice(0, 16)})`,
    `Most expensive row: ${dearest?.PriceArea ?? "?"} at ${dearest?.DayAheadPriceEUR != null ? `${dearest.DayAheadPriceEUR.toFixed(2)} EUR` : "not reported"} (${String(dearest?.TimeDK ?? "").slice(0, 16)})`,
    ...lines,
  ].join("\n")
}
