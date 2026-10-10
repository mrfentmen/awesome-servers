export class MgmError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MgmError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new MgmError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return { Origin: "https://www.mgm.gov.tr" }
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
    throw new MgmError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function listProvinces(): Promise<string> {
  let url = `https://servis.mgm.gov.tr/web/merkezler/iller`;
  const data = await req(url);
  return pretty(data);
}

export async function listDistricts(il: string): Promise<string> {
  let url = `https://servis.mgm.gov.tr/web/merkezler/ililcesi`;
  const qs = new URLSearchParams();
  qs.append("il", String(il));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getDaily(istno: string): Promise<string> {
  let url = `https://servis.mgm.gov.tr/web/tahminler/gunluk`;
  const qs = new URLSearchParams();
  qs.append("istno", String(istno));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getHourly(istno: string): Promise<string> {
  let url = `https://servis.mgm.gov.tr/web/tahminler/saatlik`;
  const qs = new URLSearchParams();
  qs.append("istno", String(istno));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

// ---- muxB tools:

const MGM_BASE = "https://servis.mgm.gov.tr/web";

async function mgmGet<T>(path: string): Promise<T> {
  const res = await fetch(`${MGM_BASE}${path}`, {
    headers: { ...UA, Origin: "https://www.mgm.gov.tr" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new MgmError(`MGM returned HTTP ${res.status} for ${path}`);
  return (await res.json()) as T;
}

// MGM sends -9999 for every field it has no reading for
const obs = (value: unknown, unit: string): string => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= -9999) return "not reported";
  return `${n}${unit ? ` ${unit}` : ""}`;
};

export interface CurrentConditionsArgs {
  istno: string;
}

export async function currentConditions(args: CurrentConditionsArgs): Promise<string> {
  const istno = String(args.istno ?? "").trim();
  if (!istno) throw new MgmError("Provide a station id (sondurumIstNo from list_districts)");
  const rows = await mgmGet<Array<Record<string, unknown>>>(`/sondurumlar?istno=${encodeURIComponent(istno)}`);
  if (!Array.isArray(rows) || !rows.length) return `No current observations for station ${istno}.`;
  const r = rows[0];
  const when = String(r.veriZamani ?? "not reported").replace("T", " ").replace(".000Z", " UTC");
  return [
    `Current conditions at MGM station ${r.istNo ?? istno}`,
    `Observed: ${when}`,
    `Temperature: ${obs(r.sicaklik, "C")} | feels like: ${obs(r.hissedilenSicaklik, "C")}`,
    `Humidity: ${obs(r.nem, "%")}`,
    `Pressure: ${obs(r.aktuelBasinc, "hPa")} | reduced to sea level: ${obs(r.denizeIndirgenmisBasinc, "hPa")}`,
    `Wind: ${obs(r.ruzgarHiz, "km/h")} from ${obs(r.ruzgarYon, "deg")}`,
    `Visibility: ${obs(r.gorus, "m")} | cloud cover: ${obs(r.kapalilik, "%")}`,
    `Precipitation: 10 min ${obs(r.yagis10Dk, "mm")} | 1 h ${obs(r.yagis1Saat, "mm")} | 6 h ${obs(r.yagis6Saat, "mm")} | 12 h ${obs(r.yagis12Saat, "mm")} | 24 h ${obs(r.yagis24Saat, "mm")}`,
    `Weather event code: ${r.hadiseKodu != null ? String(r.hadiseKodu) : "not reported"}`,
    `Snow height: ${obs(r.karYukseklik, "m")} | sea temperature: ${obs(r.denizSicaklik, "C")}`,
  ].join("\n");
}

export interface ProvinceBoardArgs {
  il: string;
  days?: number;
  limit?: number;
}

export async function provinceBoard(args: ProvinceBoardArgs): Promise<string> {
  const il = (args.il ?? "").trim();
  if (!il) throw new MgmError("Provide a province name, e.g. 'Ankara'");
  const days = Math.max(1, Math.min(Number(args.days ?? 3) || 3, 5));
  const limit = Math.max(1, Math.min(Number(args.limit ?? 15) || 15, 40));
  const districts = await mgmGet<Array<Record<string, unknown>>>(
    `/merkezler/ililcesi?il=${encodeURIComponent(il)}`,
  );
  const usable = (districts ?? []).filter((d) => d.gunlukTahminIstNo != null);
  if (!usable.length) return `MGM reported no forecast stations for province ${il}.`;
  const shown = usable.slice(0, limit);
  const forecasts = await Promise.all(
    shown.map((d) =>
      mgmGet<Array<Record<string, unknown>>>(
        `/tahminler/gunluk?istno=${encodeURIComponent(String(d.gunlukTahminIstNo))}`,
      )
        // the service rate limits bursts, so one quiet retry before giving up
        .catch(() =>
          mgmGet<Array<Record<string, unknown>>>(
            `/tahminler/gunluk?istno=${encodeURIComponent(String(d.gunlukTahminIstNo))}`,
          ),
        )
        .catch(() => [] as Array<Record<string, unknown>>),
    ),
  );
  const lines = shown.map((d, i) => {
    const f = forecasts[i][0];
    const name = d.ilce != null ? String(d.ilce) : "district name not reported";
    if (!f) return `   ${name}: forecast not returned`;
    const parts: string[] = [];
    for (let day = 0; day < days; day++) {
      const date = String(f[`tarihGun${day}`] ?? "").slice(0, 10) || "date not reported";
      const hi = obs(f[`enYuksekGun${day}`], "C");
      const lo = obs(f[`enDusukGun${day}`], "C");
      const code = f[`hadiseGun${day}`] != null ? String(f[`hadiseGun${day}`]) : "not reported";
      parts.push(`${date} ${lo}/${hi} ${code}`);
    }
    return `   ${name} (${String(d.gunlukTahminIstNo)}): ${parts.join(" | ")}`;
  });
  return [
    `MGM ${days}-day forecast board for ${il} (${shown.length} of ${usable.length} districts, low/high in C, then the event code MGM reported):`,
    ...lines,
  ].join("\n");
}
