export class AlbiononlineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AlbiononlineError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new AlbiononlineError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getPrices(item: string, locations?: string, qualities?: string): Promise<string> {
  let url = `https://albion-online-data.com/api/v2/stats/prices/${encodeURIComponent(String(item))}`;
  const qs = new URLSearchParams();
  if (locations !== undefined) qs.append("locations", String(locations));
  if (qualities !== undefined) qs.append("qualities", String(qualities));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getPriceHistory(item: string, date?: string, end_date?: string, timeScale?: string): Promise<string> {
  let url = `https://albion-online-data.com/api/v2/stats/history/${encodeURIComponent(String(item))}`;
  const qs = new URLSearchParams();
  if (date !== undefined) qs.append("date", String(date));
  if (end_date !== undefined) qs.append("end_date", String(end_date));
  if (timeScale !== undefined) qs.append("time-scale", String(timeScale));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getPriceCharts(item: string, date?: string, end_date?: string, timeScale?: string): Promise<string> {
  let url = `https://albion-online-data.com/api/v2/stats/charts/${encodeURIComponent(String(item))}`;
  const qs = new URLSearchParams();
  if (date !== undefined) qs.append("date", String(date));
  if (end_date !== undefined) qs.append("end_date", String(end_date));
  if (timeScale !== undefined) qs.append("time-scale", String(timeScale));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getGoldPrices(date?: string, count?: number): Promise<string> {
  let url = `https://albion-online-data.com/api/v2/stats/gold`;
  const qs = new URLSearchParams();
  if (date !== undefined) qs.append("date", String(date));
  if (count !== undefined) qs.append("count", String(count));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getRecentKills(limit?: number, offset?: number): Promise<string> {
  let url = `https://gameinfo.albiononline.com/api/gameinfo/events`;
  const qs = new URLSearchParams();
  if (limit !== undefined) qs.append("limit", String(limit));
  if (offset !== undefined) qs.append("offset", String(offset));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getKillDetails(eventId: number): Promise<string> {
  let url = `https://gameinfo.albiononline.com/api/gameinfo/events/${encodeURIComponent(String(eventId))}`;
  const data = await req(url);
  return pretty(data);
}

// ---- muxB tools:

// Cross-city comparison and trend statistics over the albion-online-data.com
// payloads the existing tools dump as raw JSON.

const AOD_BASE = "https://albion-online-data.com/api/v2/stats";

async function aod<T>(path: string): Promise<T> {
  const res = await fetch(`${AOD_BASE}${path}`, {
    headers: { ...UA, Accept: "application/json", "Accept-Encoding": "gzip, deflate" },
    signal: AbortSignal.timeout(25000),
  });
  const ct = res.headers.get("content-type") ?? "";
  const data = ct.includes("json") ? await res.json() : await res.text();
  if (!res.ok) {
    const detail = typeof data === "string" ? data.replace(/\s+/g, " ").slice(0, 200) : JSON.stringify(data).slice(0, 200);
    throw new AlbiononlineError(`HTTP ${res.status}: ${detail}`);
  }
  return data as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

// albion-online-data.com emits placeholder rows with a 0 price and the
// 0001-01-01T00:00:00 sentinel date for city/quality pairs with no orders.
const live = (row: Row, field: string, dateField: string): { city: string; quality: number; price: number; when: string } | null => {
  const price = num(row?.[field]);
  if (price == null || price <= 0) return null;
  const when = typeof row?.[dateField] === "string" ? row[dateField] : "";
  if (!when || when.startsWith("0001-")) return null;
  return { city: String(row?.city ?? "?"), quality: Number(row?.quality), price, when };
};

export interface MarketSummaryArgs {
  item: string;
  quality?: number;
}

export interface PriceTrendArgs {
  item: string;
  quality?: number;
  location?: string;
  timeScale?: string;
  days?: number;
}

export async function priceTrend(args: PriceTrendArgs): Promise<string> {
  const item = String(args.item ?? "").trim();
  if (!item) return "Provide an item id, e.g. T4_BAG.";
  const timeScale = String(args.timeScale ?? "1d").trim();
  if (!["1h", "1d", "1w"].includes(timeScale)) return 'timeScale must be "1h", "1d" or "1w".';
  const quality = args.quality == null ? null : Number(args.quality);
  if (quality != null && (!Number.isInteger(quality) || quality < 1 || quality > 5)) {
    return "Quality must be a whole number from 1 to 5.";
  }
  const days = Math.max(1, Math.min(Number(args.days ?? 30) || 30, 365));
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const series = (await aod<Row[]>(
    `/history/${encodeURIComponent(item)}?date=${iso(start)}&end_date=${iso(end)}&time-scale=${timeScale}`,
  )) ?? [];
  let picked = series;
  const location = (args.location ?? "").trim();
  if (location) picked = series.filter((r) => String(r?.location ?? "").toLowerCase() === location.toLowerCase());
  if (quality != null) picked = picked.filter((r) => Number(r?.quality) === quality);
  const blocks = picked
    .map((r) => ({ location: String(r?.location ?? "?"), quality: Number(r?.quality), points: (r?.data ?? []) as Row[] }))
    .filter((b) => b.points.length > 0);
  if (!blocks.length) {
    return `No history rows for ${item}${location ? ` in ${location}` : ""}${quality != null ? ` at quality ${quality}` : ""} over the last ${days} day(s).`;
  }
  const lines = [`Price trend for ${item}, ${timeScale} buckets, ${iso(start)} to ${iso(end)}:`, ""];
  for (const b of blocks.slice(0, 12)) {
    const points = [...b.points]
      .map((p) => ({ price: num(p?.avg_price), when: String(p?.timestamp ?? ""), count: num(p?.item_count) ?? 0 }))
      .filter((p): p is { price: number; when: string; count: number } => p.price != null)
      .sort((a, z) => a.when.localeCompare(z.when));
    if (!points.length) continue;
    const prices = points.map((p) => p.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);
    const lowAt = points.find((p) => p.price === low)!;
    const highAt = points.find((p) => p.price === high)!;
    const weighted = points.reduce((acc, p) => acc + p.price * p.count, 0);
    const volume = points.reduce((acc, p) => acc + p.count, 0);
    const change = points[0].price - points[points.length - 1].price;
    lines.push(
      `* ${b.location}, quality ${b.quality}: ${points.length} bucket(s) from ${points[0].when.slice(0, 16).replace("T", " ")} to ${points[points.length - 1].when.slice(0, 16).replace("T", " ")}`
    );
    lines.push(`    low ${low.toLocaleString("en-US")} at ${lowAt.when.slice(0, 10)}, high ${high.toLocaleString("en-US")} at ${highAt.when.slice(0, 10)}, range ${((high / low) * 100 - 100).toFixed(1)}%`);
    lines.push(
      `    volume-weighted mean ${volume ? Math.round(weighted / volume).toLocaleString("en-US") : "not reported"} over ${volume.toLocaleString("en-US")} item(s) traded; ` +
        `end-to-end ${change === 0 ? "unchanged" : `${change > 0 ? "up" : "down"} ${Math.abs(change).toLocaleString("en-US")} (${((change / points[0].price) * 100).toFixed(1)}%)`}`
    );
  }
  if (blocks.length > 12) lines.push(`... and ${blocks.length - 12} more location/quality series.`);
  return lines.join("\n");
}
