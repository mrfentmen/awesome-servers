export class EnturError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EnturError"
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
    throw new EnturError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function autocompleteStop(query: string, lang?: string): Promise<string> {
  let url = `https://api.entur.io/geocoder/v1/autocomplete`;
  const qs = new URLSearchParams();
  qs.append("text", String(query));
  if (lang !== undefined) qs.append("lang", String(lang));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "ET-Client-Name": "awesome-mcps" } });
  return pretty(data);
}

export async function reverseGeocode(latitude: number, longitude: number, lang?: string): Promise<string> {
  let url = `https://api.entur.io/geocoder/v1/reverse`;
  const qs = new URLSearchParams();
  qs.append("point.lat", String(latitude));
  qs.append("point.lon", String(longitude));
  if (lang !== undefined) qs.append("lang", String(lang));
  const qstr = qs.toString();
  if (qstr) url += (url.includes('?') ? '&' : '?') + qstr;
  const data = await req(url, { headers: { "ET-Client-Name": "awesome-mcps" } });
  return pretty(data);
}

export async function getDepartures(stopPlaceId: string, departures?: number): Promise<string> {
  let url = `https://api.entur.io/journey-planner/v3/graphql`;
  const query = `query { stopPlace(id: "${stopPlaceId}") { id name estimatedCalls(timeRange: 86400, numberOfDepartures: ${departures ?? 5}) { realtime aimedDepartureTime expectedDepartureTime destinationDisplay { frontText } serviceJourney { journeyPattern { line { id name transportMode } } } } } }`;
  const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json", "ET-Client-Name": "awesome-mcps" }, body: JSON.stringify({ query }) });
  return pretty(data);
}

export async function planTrip(from: string, to: string, dateTime?: string): Promise<string> {
  let url = `https://api.entur.io/journey-planner/v3/graphql`;
  const when = dateTime ? `, dateTime: "${dateTime}"` : "";
  const query = `query { trip(from: { place: "${from}" }, to: { place: "${to}" }${when}) { tripPatterns { duration legs { mode distance duration expectedStartTime expectedEndTime fromPlace { name } toPlace { name } line { publicCode name transportMode } } } } }`;
  const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json", "ET-Client-Name": "awesome-mcps" }, body: JSON.stringify({ query }) });
  return pretty(data);
}

// ---- muxC tools:

