export class CoinmetricsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CoinmetricsError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new CoinmetricsError(`Set the ${name} environment variable.`)
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
    throw new CoinmetricsError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getAssetMetrics(assets: string, metrics: string, startTime: string, endTime: string, frequency?: string): Promise<string> {
  let url = `https://community-api.coinmetrics.io/v4/timeseries/asset-metrics`;
  const qs = new URLSearchParams();
  qs.append("assets", String(assets));
  qs.append("metrics", String(metrics));
  if (frequency !== undefined) qs.append("frequency", String(frequency));
  qs.append("start_time", String(startTime));
  qs.append("end_time", String(endTime));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function listMetrics(assets: string): Promise<string> {
  let url = `https://community-api.coinmetrics.io/v4/catalog-all/asset-metrics`;
  const qs = new URLSearchParams();
  qs.append("assets", String(assets));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxC tools:

const CM_UA = "awesome-mcps/1.0"

class CoinmetricsLookupError extends Error {}

/**
 * CoinMetrics publishes a catalogue of every asset it carries, with each one's
 * metrics and the window of history available for them. Nothing else on the
 * server exposes that list, and it is the only way to know which id to ask for.
 */
export async function assetCatalog(args: { search?: string; limit?: number }): Promise<string> {
  const q = (args.search ?? "").trim().toLowerCase()
  const limit = Math.max(1, Math.min(args.limit ?? 15, 200))
  const res = await fetch("https://community-api.coinmetrics.io/v4/catalog/assets", {
    headers: { "User-Agent": CM_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new CoinmetricsLookupError(`CoinMetrics returned ${res.status} for the asset catalogue`)
  const d = (await res.json()) as {
    data?: Array<{ asset?: string; full_name?: string; metrics?: Array<{ metric?: string; frequencies?: Array<{ frequency?: string; min_time?: string; max_time?: string }> }> }>
  }
  const assets = d.data ?? []
  if (!assets.length) throw new CoinmetricsLookupError("CoinMetrics returned an empty asset catalogue")
  const hits = q ? assets.filter((a) => String(a.full_name ?? "").toLowerCase().includes(q) || String(a.asset ?? "").toLowerCase().includes(q)) : assets
  if (!hits.length) return `CoinMetrics has no asset matching "${q}". It carries ${assets.length}.`
  const shown = hits.slice(0, limit)
  return [
    `CoinMetrics community catalogue: ${assets.length} assets total, ${hits.length} matching, ${shown.length} shown.`,
    ...shown.map((a, i) => {
      const metrics = a.metrics ?? []
      const freqs = [...new Set(metrics.flatMap((m) => (m.frequencies ?? []).map((f) => f.frequency ?? "?")))].sort()
      const first = metrics[0]?.frequencies?.[0]
      const last = metrics[0]?.frequencies?.[0]
      return `${i + 1}. [${a.asset ?? "?"}] ${a.full_name ?? "unnamed"}\n   ${metrics.length} metrics | frequencies: ${freqs.join(", ") || "none listed"}\n   history for the first metric: ${first?.min_time?.slice(0, 10) ?? "?"} to ${last?.max_time?.slice(0, 10) ?? "?"}`
    }),
  ].join("\n")
}
