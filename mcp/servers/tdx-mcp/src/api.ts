export class TdxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TdxError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://tdx.transportdata.tw"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new TdxError(`Set the ${name} environment variable.`)
  return v
}

let cachedToken = ""
let tokenExpiresAt = 0
async function tdxToken(): Promise<string> {
  const now = Date.now()
  if (!cachedToken || now >= tokenExpiresAt) {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: envStrict("TDX_CLIENT_ID"),
      client_secret: envStrict("TDX_CLIENT_SECRET"),
    })
    const res = await fetch("https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token", {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    })
    if (!res.ok) throw new TdxError(`TDX login failed: HTTP ${res.status}`)
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) throw new TdxError("TDX login returned no access token")
    cachedToken = data.access_token
    tokenExpiresAt = now + (data.expires_in ?? 86400) * 1000 - 60000
  }
  return cachedToken
}
async function authHeaders(): Promise<Record<string, string>> {
  return { Authorization: "Bearer " + (await tdxToken()) }
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
    throw new TdxError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listTraStations(): Promise<string> {
  let url = BASE + `/api/basic/v2/Rail/TRA/Station`;
  const qs = new URLSearchParams();
  qs.append("$format", "JSON");
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getTraLiveboard(stationId: string): Promise<string> {
  let url = BASE + `/api/basic/v2/Rail/TRA/LiveBoard/Station/${encodeURIComponent(String(stationId))}`;
  const qs = new URLSearchParams();
  qs.append("$format", "JSON");
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function listThsrStations(): Promise<string> {
  let url = BASE + `/api/basic/v2/Rail/THSR/Station`;
  const qs = new URLSearchParams();
  qs.append("$format", "JSON");
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getTraTimetable(stationId: string, date: string): Promise<string> {
  let url = BASE + `/api/basic/v2/Rail/TRA/DailyTimetable/Station/${encodeURIComponent(String(stationId))}/${encodeURIComponent(String(date))}`;
  const qs = new URLSearchParams();
  qs.append("$format", "JSON");
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxB tools:

// Taiwan Railway's own Open Data System (ods.railway.gov.tw) publishes the
// station list and a rolling window of daily timetables with no key at all.
// These two URLs are the download links data.gov.tw points at for datasets
// 33425 (station basic data) and the daily timetable.
const ODS_BASE = "https://ods.railway.gov.tw/tra-ods-web/ods/download/dataResource"
const ODS_STATIONS = `${ODS_BASE}/0518b833e8964d53bfea3f7691aea0ee`
const ODS_TIMETABLE_INDEX = `${ODS_BASE}/railway_schedule/JSON/list`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

let stationCache: Map<string, string> | null = null
let timetableIndex: Array<{ date: string; url: string }> | null = null

async function odsFetch<T>(url: string, timeout = 30000): Promise<T> {
  const res = await fetch(url, {
    headers: { ...UA, Accept: "application/json, text/html" },
    signal: AbortSignal.timeout(timeout),
  });
  if (res.status === 404) throw new TdxError(`Taiwan Railway Open Data has nothing at ${url}`);
  if (!res.ok) throw new TdxError(`Taiwan Railway Open Data returned HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function getStations(): Promise<Map<string, string>> {
  if (stationCache) return stationCache;
  const rows = await odsFetch<Raw[]>(ODS_STATIONS);
  const map = new Map<string, string>();
  for (const s of Array.isArray(rows) ? rows : []) {
    if (s.stationCode) map.set(String(s.stationCode), `${String(s.stationName ?? "")} ${String(s.stationEName ?? "")}`.trim());
  }
  if (map.size === 0) throw new TdxError("The station dataset came back empty.");
  stationCache = map;
  return map;
}

async function getTimetableIndex(): Promise<Array<{ date: string; url: string }>> {
  if (timetableIndex) return timetableIndex;
  const res = await fetch(ODS_TIMETABLE_INDEX, { headers: { ...UA }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new TdxError(`The TRA timetable index returned HTTP ${res.status}`);
  const html = await res.text();
  const out: Array<{ date: string; url: string }> = [];
  for (const m of html.matchAll(/<a href="([^"]+)">(\d{8})\.json<\/a>/g)) {
    out.push({ date: m[2], url: `https://ods.railway.gov.tw${m[1]}` });
  }
  if (!out.length) throw new TdxError("The TRA timetable index listed no daily JSON files.");
  out.sort((a, b) => b.date.localeCompare(a.date));
  timetableIndex = out;
  return out;
}

function requireDate(date: string): string {
  const d = (date ?? "").trim();
  if (!/^\d{8}$/.test(d)) throw new TdxError(`Date must be YYYYMMDD, e.g. 20260928, got "${date ?? ""}".`);
  return d;
}

// The index carries a rolling window of daily timetables, so with no date given
// pick the one closest to today rather than blindly the last one published.
function nearestDate(index: Array<{ date: string }>): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  let best = index[0].date;
  let bestGap = Number.MAX_SAFE_INTEGER;
  for (const row of index) {
    const gap = Math.abs(Number(row.date) - Number(today));
    if (gap < bestGap) {
      bestGap = gap;
      best = row.date;
    }
  }
  return best;
}

function clock(value: unknown): string {
  return typeof value === "string" && value ? value.slice(0, 5) : "--:--";
}

export async function odsStationSearch(args: { query: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim().toLowerCase();
  if (!q) throw new TdxError("Search text is empty.");
  const limit = Math.min(Math.max(args.limit ?? 8, 1), 30);
  const rows = await odsFetch<Raw[]>(ODS_STATIONS);
  const list: Raw[] = Array.isArray(rows) ? rows : [];
  const matches = list
    .filter((s) => String(s.stationCode ?? "").toLowerCase().includes(q) || String(s.stationName ?? "").includes(q) || String(s.stationEName ?? "").toLowerCase().includes(q))
    .slice(0, limit);
  if (matches.length === 0) {
    const sample = list.slice(0, 3).map((s) => `${s.stationCode ?? "?"} ${s.stationName ?? ""}`).join(", ");
    return `No Taiwan Railway station matches "${args.query ?? ""}". For example: ${sample}`;
  }
  return [
    `Taiwan Railway stations matching "${args.query ?? ""}" - ${matches.length} of ${list.length}, showing ${matches.length}:`,
    ...matches.map((s, i) => {
      const gps = String(s.gps ?? "").split(/\s+/).filter(Boolean);
      return [
        `${i + 1}. ${s.stationName ?? "(unnamed)"} / ${s.stationEName ?? "?"} [code ${s.stationCode ?? "?"}]`,
        `   ${String(s.stationAddrTw ?? "address not reported")}`,
        `   tel ${s.stationTel ?? "not reported"}${gps.length === 2 ? ` · ${gps[0]}, ${gps[1]}` : ""}${s.haveBike === "Y" ? " · bike rental" : ""}`,
      ].join("\n");
    }),
  ].join("\n");
}

export async function odsTrainDepartures(args: { stationId: string; date?: string; limit?: number }): Promise<string> {
  const station = (args.stationId ?? "").trim();
  if (!/^\d{4}$/.test(station)) throw new TdxError(`Station code must be 4 digits, e.g. 1000 for Taipei, got "${args.stationId ?? ""}".`);
  const limit = Math.min(Math.max(args.limit ?? 12, 1), 60);
  const index = await getTimetableIndex();
  const wanted = (args.date ?? "").trim() ? requireDate(args.date as string) : nearestDate(index);
  const entry = index.find((d) => d.date === wanted);
  if (!entry) {
    const range = `${index[index.length - 1].date} to ${index[0].date}`;
    return `No Taiwan Railway timetable is published for ${wanted}. The index covers ${range}.`;
  }
  const names = await getStations();
  const data = await odsFetch<Raw>(entry.url, 60000);
  const trains: Raw[] = Array.isArray(data.TrainInfos) ? data.TrainInfos : [];
  const rows: string[] = [];
  for (const t of trains) {
    const stops: Raw[] = Array.isArray(t.TimeInfos) ? t.TimeInfos : [];
    const at = stops.find((s) => String(s.Station) === station);
    if (!at) continue;
    const order = Number(at.Order ?? 0);
    const origin = stops[0];
    const dest = stops[stops.length - 1];
    rows.push(
      `   ${clock(at.DEPTime)}  train ${t.Train ?? "?"}  line ${t.Line ?? "?"}/${t.LineDir ?? "?"}  ${names.get(String(origin.Station)) ?? origin.Station} -> ${names.get(String(dest.Station)) ?? dest.Station}  (stop ${order} of ${stops.length})`
    );
  }
  if (!rows.length) return `No train calls at station ${station} (${names.get(station) ?? "unknown"}) on ${wanted}.`;
  rows.sort((a, b) => a.localeCompare(b));
  return [
    `Departures at ${names.get(station) ?? `station ${station}`} [${station}] on ${wanted} - ${rows.length} of ${trains.length} published trains, showing ${Math.min(limit, rows.length)}:`,
    ...rows.slice(0, limit),
    rows.length > limit ? `...and ${rows.length - limit} more, raise limit to see them.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function odsTrainRoute(args: { trainNumber: string; date?: string }): Promise<string> {
  const train = (args.trainNumber ?? "").trim();
  if (!/^\d{1,5}$/.test(train)) throw new TdxError(`Train number must be digits, e.g. 1001, got "${args.trainNumber ?? ""}".`);
  const index = await getTimetableIndex();
  const wanted = (args.date ?? "").trim() ? requireDate(args.date as string) : nearestDate(index);
  const entry = index.find((d) => d.date === wanted);
  if (!entry) {
    const range = `${index[index.length - 1].date} to ${index[0].date}`;
    return `No Taiwan Railway timetable is published for ${wanted}. The index covers ${range}.`;
  }
  const names = await getStations();
  const data = await odsFetch<Raw>(entry.url, 60000);
  const trains: Raw[] = Array.isArray(data.TrainInfos) ? data.TrainInfos : [];
  const found = trains.find((t) => String(t.Train ?? "").trim() === train);
  if (!found) return `Train ${train} does not run on ${wanted}.`;
  const stops: Raw[] = Array.isArray(found.TimeInfos) ? found.TimeInfos : [];
  const last = stops.length - 1;
  return [
    `Taiwan Railway train ${train} on ${wanted} - line ${found.Line ?? "?"}, direction ${found.LineDir ?? "?"}, type ${found.Type ?? "?"}, carriage class ${found.CarClass ?? "not reported"}`,
    `Bicycle: ${found.Bike === "Y" ? "carries bikes" : found.Bike === "N" ? "no bikes" : "not reported"} · dining: ${found.Dinning === "Y" ? "yes" : "no"} · food service: ${found.FoodSrv === "Y" ? "yes" : "no"} · accessible: ${found.Cripple === "Y" ? "yes" : "no"}`,
    found.Note ? `Note: ${String(found.Note).slice(0, 200)}` : "",
    stops.length ? "Stops:" : "Stops: none published",
    ...stops.map((s, i) => {
      const arrive = i === 0 || i === last ? clock(s.ARRTime) : clock(s.ARRTime);
      const depart = i === last ? "(terminus)" : clock(s.DEPTime);
      return `   ${String(s.Order ?? i + 1).padStart(2)}. ${names.get(String(s.Station)) ?? `station ${s.Station}`} [${s.Station}] arr ${arrive} dep ${depart}`;
    }),
  ]
    .filter(Boolean)
    .join("\n");
}
