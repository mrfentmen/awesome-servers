/**
 * Aircraft Database — keyless public API client.
 */
const BASE = "https://api.adsbdb.com/v0"
const SOURCE = "Aircraft Database"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "adsbdb-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

const airframe = (a: any): string => [
  `${a.registration ?? "?"} - ${a.manufacturer ?? ""} ${a.type ?? ""}`.trim(),
  `  ICAO type: ${a.icao_type ?? "?"} · mode S: ${a.mode_s ?? "?"}`,
  `  owner: ${a.registered_owner ?? "unknown"}${a.registered_owner_country_name ? ` (${a.registered_owner_country_name})` : ""}`,
  a.registered_owner_operator_flag_code ? `  operator code: ${a.registered_owner_operator_flag_code}` : "",
].filter(Boolean).join("\n")

export async function flightRoute(a: { callsign: string }): Promise<string> {
  const cs = a.callsign.trim().toUpperCase()
  if (!/^[A-Z0-9]{2,8}$/.test(cs)) throw new SourceError(`"${a.callsign}" is not a valid callsign`)
  const d = await getJson(`/callsign/${cs}`)
  const r = d?.response
  if (!r) throw new SourceError(`ADSBDB has no route for ${cs}`)
  const f = r.flightroute
  const a1 = r.aircraft
  if (!f && !a1) return `No route or airframe data for ${cs}.`
  const airport = (p: any): string => p ? `${p.iata_code ?? p.icao_code ?? "?"} ${p.name ?? ""}${p.municipality ? `, ${p.municipality}` : ""}` : "unknown"
  return [
    `Callsign: ${cs}${f?.callsign_iata ? ` (IATA ${f.callsign_iata})` : ""}`,
    f?.airline ? `Airline: ${f.airline.name ?? "?"} (${[f.airline.iata, f.airline.icao].filter(Boolean).join(" / ")})` : "",
    f ? `From: ${airport(f.origin)}` : "",
    f ? `To: ${airport(f.destination)}` : "",
    a1 ? `Airframe:\n${airframe(a1)}` : "",
  ].filter(Boolean).join("\n")
}

export async function aircraftByHex(a: { hex: string }): Promise<string> {
  const hex = a.hex.trim().toLowerCase()
  const d = await getJson(`/aircraft/${hex}`)
  const ac = d?.response?.aircraft
  if (!ac) throw new SourceError(`ADSBDB has no aircraft with hex ${hex}`)
  return airframe(ac)
}

