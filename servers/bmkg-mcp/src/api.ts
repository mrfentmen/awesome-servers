export class BmkgError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BmkgError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

async function authHeaders(): Promise<Record<string, string>> {
  return {}
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
    throw new BmkgError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getForecast(adm4: string): Promise<string> {
  let url = `https://api.bmkg.go.id/publik/prakiraan-cuaca`;
  const qs = new URLSearchParams();
  qs.append("adm4", String(adm4));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getFeltEarthquakes(): Promise<string> {
  let url = `https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json`;
  const data = await req(url);
  return pretty(data);
}

export async function getLatestEarthquakes(): Promise<string> {
  let url = `https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json`;
  const data = await req(url);
  return pretty(data);
}

// ---- muxC tools:

interface BmkgFeltReport {
  Wilayah?: string
  Feel?: string
  Gempa?: string
  Kedalaman?: string
  coordinates?: string
  date?: string
}

interface BmkgLatest {
  Tanggal?: string
  Jam?: string
  DateTime?: string
  Lintang?: string
  Bujur?: string
  Kedalaman?: string
  Magnitude?: string
  Wilayah?: string
  Potensi?: string
  Dirasakan?: BmkgFeltReport[]
}

/**
 * autogempa.json is the single most recent earthquake with its full description
 * and felt reports. gempaterkini only covers M5 and above, and gempadirasakan
 * starts at magnitude 3, so neither reports the small events this does.
 */
export async function latestEarthquake(): Promise<string> {
  const data = (await req("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json")) as { Infogempa?: { gempa?: BmkgLatest } }
  const g = data?.Infogempa?.gempa
  if (!g) throw new BmkgError("BMKG returned no Infogempa.gempa record")
  const felt = Array.isArray(g.Dirasakan) ? g.Dirasakan : []
  const feltLine = (d: BmkgFeltReport): string =>
    d.Wilayah ? `${d.Wilayah}: ${d.Feel ?? "not reported"}${d.Gempa ? ` (M${d.Gempa})` : ""}` : "not reported"
  return [
    `Latest BMKG earthquake: magnitude ${g.Magnitude ?? "not reported"}`,
    // BMKG already puts WIB inside the Jam field, so do not repeat it.
    `When: ${g.Tanggal ?? "?"} ${g.Jam || "(time not reported)"} (${g.DateTime ?? "?"})`,
    `Where: ${g.Wilayah ?? "not reported"}`,
    `Coordinates: ${g.Lintang ?? "?"} / ${g.Bujur ?? "?"} | depth ${g.Kedalaman ?? "not reported"}`,
    g.Potensi ? `Tsunami potential: ${g.Potensi}` : null,
    felt.length
      ? `Felt in ${felt.length} places:\n${felt.slice(0, 10).map((f, i) => `  ${i + 1}. ${feltLine(f)}`).join("\n")}`
      : "No felt reports.",
  ]
    .filter(Boolean)
    .join("\n")
}

// ---- gap4a1 tools:

export async function forecastSummary(args: { adm4: string; limit?: number }): Promise<string> {
  const code = String(args.adm4 ?? "").trim()
  if (!/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(code)) throw new BmkgError("adm4 must look like W.X.Y.Z, for example 31.71.03.1001")
  const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 8), 24))
  const data = await req(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(code)}`) as { lokasi?: { desa?: string; kotkab?: string; provinsi?: string }; data?: Array<{ cuaca?: Array<Array<{ local_datetime?: string; weather_desc_en?: string; t?: number; tp?: number; ws?: number; hu?: number }>> }> }
  const rows = (data.data ?? []).flatMap(x => x.cuaca ?? []).flat().slice(0, limit)
  if (!rows.length) throw new BmkgError("BMKG returned no forecast rows")
  return [`Forecast for ${data.lokasi?.desa ?? "not reported"}, ${data.lokasi?.kotkab ?? "not reported"}, ${data.lokasi?.provinsi ?? "not reported"} (${rows.length} periods)`, ...rows.map((r, i) => `${i + 1}. ${r.local_datetime ?? "not reported"}: ${r.weather_desc_en ?? "not reported"}; ${r.t ?? "not reported"}°C; rain ${r.tp ?? "not reported"} mm; wind ${r.ws ?? "not reported"} km/h; humidity ${r.hu ?? "not reported"}%`)].join("\n")
}

export async function feltEarthquakeSummary(args: { limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 10), 30))
  const data = await req("https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json") as { Infogempa?: { gempa?: Array<{ DateTime?: string; Magnitude?: string; Kedalaman?: string; Wilayah?: string; Dirasakan?: string }> } }
  const rows = (data.Infogempa?.gempa ?? []).slice(0, limit)
  if (!rows.length) return "BMKG reported no felt earthquakes."
  return [`BMKG felt earthquakes (showing ${rows.length}):`, ...rows.map((r, i) => `${i + 1}. ${r.DateTime ?? "not reported"} | M${r.Magnitude ?? "not reported"} | depth ${r.Kedalaman ?? "not reported"} | ${r.Wilayah ?? "not reported"} | felt: ${r.Dirasakan ?? "not reported"}`)].join("\n")
}
