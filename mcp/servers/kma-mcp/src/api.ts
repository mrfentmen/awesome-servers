export class KmaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "KmaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new KmaError(`Set the ${name} environment variable.`)
  return v
}

async function authHeaders(): Promise<Record<string, string>> {
  return {}
}

function kstParts(): { date: string; time: string } {
  const kst = new Date(Date.now() + 9 * 3600 * 1000)
  const s = kst.toISOString()
  return { date: s.slice(0, 10).replace(/-/g, ""), time: s.slice(11, 13) + s.slice(14, 16) }
}
function latestForecastSlot(): { date: string; time: string } {
  const slots = ["0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300"]
  let { date, time } = kstParts()
  const hm = Number(time)
  let pick = slots[0]
  let dayShift = 0
  for (const s of slots) {
    if (hm * 100 + Number(time.slice(2)) >= Number(s) + 10) pick = s
  }
  if (hm < 2 || (hm === 2 && Number(time.slice(2)) < 10)) {
    const d = new Date(Date.now() + 9 * 3600 * 1000 - 24 * 3600 * 1000)
    date = d.toISOString().slice(0, 10).replace(/-/g, "")
    pick = "2300"
  }
  void dayShift
  return { date, time: pick }
}
function latestHourSlot(): { date: string; time: string } {
  let { date, time } = kstParts()
  let hh = Number(time.slice(0, 2))
  const mm = Number(time.slice(2))
  if (mm < 45) {
    hh -= 1
    if (hh < 0) {
      hh = 23
      const d = new Date(Date.now() + 9 * 3600 * 1000 - 24 * 3600 * 1000)
      date = d.toISOString().slice(0, 10).replace(/-/g, "")
    }
  }
  return { date, time: String(hh).padStart(2, "0") + "00" }
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
    throw new KmaError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getForecast(nx?: number, ny?: number, baseDate?: string, baseTime?: string): Promise<string> {
  let url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`;
  const slot = latestForecastSlot();
  const base_date = baseDate ?? slot.date;
  const base_time = baseTime ?? slot.time;
  const qs = new URLSearchParams();
  qs.append("serviceKey", envStrict("DATAGO_KR_API_KEY"));
  qs.append("numOfRows", "1000");
  qs.append("pageNo", "1");
  qs.append("dataType", "JSON");
  if (nx !== undefined) qs.append("nx", String(nx));
  if (ny !== undefined) qs.append("ny", String(ny));
  qs.append("base_date", base_date);
  qs.append("base_time", base_time);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getUltrashort(nx?: number, ny?: number): Promise<string> {
  let url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst`;
  const slot = latestHourSlot();
  const base_date = slot.date;
  const base_time = slot.time;
  const qs = new URLSearchParams();
  qs.append("serviceKey", envStrict("DATAGO_KR_API_KEY"));
  qs.append("numOfRows", "60");
  qs.append("pageNo", "1");
  qs.append("dataType", "JSON");
  if (nx !== undefined) qs.append("nx", String(nx));
  if (ny !== undefined) qs.append("ny", String(ny));
  qs.append("base_date", base_date);
  qs.append("base_time", base_time);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}

export async function getObservations(nx?: number, ny?: number): Promise<string> {
  let url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst`;
  const slot = latestHourSlot();
  const base_date = slot.date;
  const base_time = slot.time;
  const qs = new URLSearchParams();
  qs.append("serviceKey", envStrict("DATAGO_KR_API_KEY"));
  qs.append("numOfRows", "20");
  qs.append("pageNo", "1");
  qs.append("dataType", "JSON");
  if (nx !== undefined) qs.append("nx", String(nx));
  if (ny !== undefined) qs.append("ny", String(ny));
  qs.append("base_date", base_date);
  qs.append("base_time", base_time);
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url);
  return pretty(data);
}
