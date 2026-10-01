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
// The station list URL is the download link data.gov.tw points at for dataset
// 33425; the timetable premium tools moved to the licence gateway.
const ODS_BASE = "https://ods.railway.gov.tw/tra-ods-web/ods/download/dataResource"
const ODS_STATIONS = `${ODS_BASE}/0518b833e8964d53bfea3f7691aea0ee`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function odsFetch<T>(url: string, timeout = 30000): Promise<T> {
  const res = await fetch(url, {
    headers: { ...UA, Accept: "application/json, text/html" },
    signal: AbortSignal.timeout(timeout),
  });
  if (res.status === 404) throw new TdxError(`Taiwan Railway Open Data has nothing at ${url}`);
  if (!res.ok) throw new TdxError(`Taiwan Railway Open Data returned HTTP ${res.status}`);
  return (await res.json()) as T;
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

