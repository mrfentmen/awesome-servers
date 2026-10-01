export class ShootProofError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ShootProofError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.shootproof.com/studio"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new ShootProofError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, {
    signal: AbortSignal.timeout(30000),
    headers: {
      ...UA,
      Authorization: "Bearer " + envStrict("SHOOTPROOF_ACCESS_TOKEN"),
      Accept: "application/vnd.shootproof+json",
    },
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new ShootProofError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function getServiceDescription(): Promise<string> {
  return req("")
}

export function getMe(): Promise<string> {
  return req("/me")
}

export function listBrands(): Promise<string> {
  return req("/brand")
}

export function listBrandEvents(brandId: string): Promise<string> {
  return req(`/brand/${encodeURIComponent(brandId)}/event`)
}

export function listBrandOrders(brandId: string): Promise<string> {
  return req(`/brand/${encodeURIComponent(brandId)}/order`)
}

// ---- muxH tools:
// ShootProof books shoots, and the first question about any shoot is when the
// light is. Sunrise-sunset.org publishes solar geometry keylessly for any
// coordinate, so these two answer it without an account and without guessing.

const SUN = "https://api.sunrise-sunset.org"
const SP_UA = "shootproof-mcp/1.1 (https://github.com/mcfentmen/shootproof-mcp)"

interface SunResults {
  sunrise?: string
  sunset?: string
  solar_noon?: string
  day_length?: string | number
  civil_twilight_begin?: string
  civil_twilight_end?: string
  nautical_twilight_begin?: string
  nautical_twilight_end?: string
  astronomical_twilight_begin?: string
  astronomical_twilight_end?: string
}

interface SunResponse {
  results?: SunResults
  status?: string
  tzid?: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// The service answers 1970-01-01T00:00:01 when the sun never rises or never
// sets on the requested date, which is a real answer and must not be printed as
// if it were a time of day.
const POLAR_SENTINEL = "1970-01-01T00:00:01"

function checkCoords(args: { lat: number; lon: number }): { lat: number; lon: number } {
  const lat = Number(args.lat)
  const lon = Number(args.lon)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new ShootProofError("lat must be a number between -90 and 90.")
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new ShootProofError("lon must be a number between -180 and 180.")
  }
  return { lat, lon }
}

function checkDate(input: string): string {
  const date = (input ?? "").trim()
  if (!ISO_DATE.test(date)) throw new ShootProofError(`date must be YYYY-MM-DD, got "${date}".`)
  if (!Number.isFinite(Date.parse(`${date}T00:00:00Z`))) {
    throw new ShootProofError(`"${date}" is not a real calendar date.`)
  }
  return date
}

async function sunFor(lat: number, lon: number, date: string): Promise<SunResults> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lon), date, formatted: "0" })
  let body: SunResponse | null = null
  let lastError = ""
  // The service returns a 404 both for a bad coordinate and, intermittently,
  // for a healthy one, so a 404 is retried before it is believed.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let res: Response
    try {
      res = await fetch(`${SUN}/json?${params}`, {
        headers: { Accept: "application/json", "User-Agent": SP_UA },
        signal: AbortSignal.timeout(25000),
      })
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      await new Promise((resolve) => setTimeout(resolve, 1200))
      continue
    }
    if (res.ok) {
      body = (await res.json()) as SunResponse
      break
    }
    lastError = `HTTP ${res.status} ${res.statusText}`
    if (res.status !== 404 && res.status < 500) break
    await new Promise((resolve) => setTimeout(resolve, 1200))
  }
  const answer = body
  if (!answer) throw new ShootProofError(`The solar service did not answer for ${lat}, ${lon} on ${date}: ${lastError}`)
  if (answer.status && answer.status !== "OK") throw new ShootProofError(`Solar service answered "${answer.status}".`)
  if (!answer.results) throw new ShootProofError("The solar service returned no results.")
  return answer.results
}

const clock = (value: string | undefined): string =>
  typeof value === "string" && !value.startsWith("1970-") ? value.slice(11, 19) : "n/a"

const polarNote = (results: SunResults): string => {
  const sunUp = typeof results.sunrise === "string" && !results.sunrise.startsWith("1970-")
  const sunDown = typeof results.sunset === "string" && !results.sunset.startsWith("1970-")
  if (sunUp && sunDown) return ""
  return sunUp
    ? "the sun sets but never rises on this date at this latitude, which is polar night; there is no daylight at all"
    : "the sun rises but never sets on this date at this latitude, which is midnight sun; there is no darkness at all"
}

const durationOf = (results: SunResults): number => {
  const raw = results.day_length
  const seconds = typeof raw === "number" ? raw : Number(String(raw ?? "").split(":").reduce((acc, part) => acc * 60 + (Number(part) || 0), 0))
  return Number.isFinite(seconds) && seconds > 0 && seconds < 86400 ? seconds : 0
}

const hoursMinutes = (seconds: number): string => {
  if (!seconds) return "not reported"
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return `${h}h ${String(m).padStart(2, "0")}m`
}

