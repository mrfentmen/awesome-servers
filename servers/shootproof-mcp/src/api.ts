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

/**
 * The light on one day at one place, hour by hour: sunrise, sunset, solar noon,
 * day length, all three twilight boundaries, and the golden and blue hour
 * windows a photographer schedules around. All times are UTC, because that is
 * what the solar service publishes.
 */
export async function daylightProfile(args: { lat: number; lon: number; date: string }) : Promise<string> {
  const { lat, lon } = checkCoords(args)
  const date = checkDate(args.date)
  const results = await sunFor(lat, lon, date)
  const polar = polarNote(results)
  const dayLength = durationOf(results)

  // Golden hour runs from civil dawn to roughly half an hour after the sun is
  // up; the blue hour sits just inside civil twilight. Both are derived from the
  // published twilight boundaries rather than from a separate model.
  const morningGolden = [results.civil_twilight_begin, results.sunrise]
  const eveningGolden = [results.sunset, results.civil_twilight_end]
  const morningBlue = [results.civil_twilight_begin, results.nautical_twilight_begin]
  const eveningBlue = [results.nautical_twilight_end, results.civil_twilight_end]
  const windowMinutes = (a: string | undefined, b: string | undefined): number | null => {
    const start = Date.parse(String(a ?? ""))
    const end = Date.parse(String(b ?? ""))
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
    return Math.round((end - start) / 60000)
  }

  const rows: string[] = [
    `Daylight profile for ${lat}, ${lon} on ${date}`,
    "  All times below are UTC. The solar service publishes UTC only, so a location far from Greenwich will not match its local clock.",
    "",
    `  solar noon        ${clock(results.solar_noon)}`,
    `  sunrise           ${clock(results.sunrise)}`,
    `  sunset            ${clock(results.sunset)}`,
    `  day length        ${hoursMinutes(dayLength)}${dayLength ? ` (${dayLength.toLocaleString()} seconds)` : ""}`,
    "",
    "Twilight boundaries:",
    `  civil (golden hour edges)   dawn ${clock(results.civil_twilight_begin)}   dusk ${clock(results.civil_twilight_end)}`,
    `  nautical                   dawn ${clock(results.nautical_twilight_begin)}   dusk ${clock(results.nautical_twilight_end)}`,
    `  astronomical               dawn ${clock(results.astronomical_twilight_begin)}   dusk ${clock(results.astronomical_twilight_end)}`,
    "",
    "Shoot windows:",
    `  morning golden hour   ${clock(results.civil_twilight_begin)} to ${clock(results.sunrise)}${(() => { const m = windowMinutes(results.civil_twilight_begin, results.sunrise); return m === null ? "" : ` (${m} min)`; })()}`,
    `  evening golden hour   ${clock(results.sunset)} to ${clock(results.civil_twilight_end)}${(() => { const m = windowMinutes(results.sunset, results.civil_twilight_end); return m === null ? "" : ` (${m} min)`; })()}`,
    `  morning blue hour     ${clock(results.civil_twilight_begin)} to ${clock(results.nautical_twilight_begin)}${(() => { const m = windowMinutes(results.civil_twilight_begin, results.nautical_twilight_begin); return m === null ? "" : ` (${m} min)`; })()}`,
    `  evening blue hour     ${clock(results.nautical_twilight_end)} to ${clock(results.civil_twilight_end)}${(() => { const m = windowMinutes(results.nautical_twilight_end, results.civil_twilight_end); return m === null ? "" : ` (${m} min)`; })()}`,
    `  full daylight         ${clock(results.sunrise)} to ${clock(results.sunset)}`,
    "",
    `  The two golden hours together are ${(() => { const a = windowMinutes(results.civil_twilight_begin, results.sunrise) ?? 0; const b = windowMinutes(results.sunset, results.civil_twilight_end) ?? 0; return a + b ? `${a + b} minutes of low-angle light` : "not computable here"; })()}.`,
  ]

  if (polar) {
    rows.push(
      "",
      `Polar condition: ${polar}. The service reports a sentinel time of 1970-01-01 for the missing boundary, so nothing above it is a real clock time.`
    )
  }
  rows.push(
    "",
    "Golden hour here means the civil twilight window at each end of the day, which is the interval the light is at its lowest angle. The service does not publish a solar elevation angle, so no narrower window is claimed.",
    "Source: sunrise-sunset.org solar geometry, UTC."
  )
  return rows.join("\n")
}

/**
 * The same date at several places, ranked by how much daylight there is, so a
 * shoot can be moved to wherever the light is best without checking each place
 * by hand.
 */
export async function daylightComparison(args: { locations: Array<{ name?: string; lat: number; lon: number }>; date: string }): Promise<string> {
  const date = checkDate(args.date)
  const list = Array.isArray(args.locations) ? args.locations : []
  if (!list.length) throw new ShootProofError("Give at least one location, each with a lat and a lon.")
  const capped = list.slice(0, 10)

  const rows: Array<{ name: string; lat: number; lon: number; dayLength: number; sunrise: string; sunset: string; golden: number; polar: boolean }> = []
  const failures: string[] = []
  for (const [index, place] of capped.entries()) {
    const label = String(place.name ?? `location ${index + 1}`)
    let coords: { lat: number; lon: number }
    try {
      coords = checkCoords(place)
    } catch (e) {
      failures.push(`${label}: ${e instanceof Error ? e.message : String(e)}`)
      continue
    }
    let results: SunResults
    try {
      results = await sunFor(coords.lat, coords.lon, date)
    } catch (e) {
      failures.push(`${label}: ${e instanceof Error ? e.message : String(e)}`)
      continue
    }
    const morning = Date.parse(String(results.civil_twilight_begin ?? ""))
    const rise = Date.parse(String(results.sunrise ?? ""))
    const set = Date.parse(String(results.sunset ?? ""))
    const dusk = Date.parse(String(results.civil_twilight_end ?? ""))
    const golden =
      Number.isFinite(morning) && Number.isFinite(rise) && Number.isFinite(set) && Number.isFinite(dusk)
        ? Math.round(((rise - morning) + (dusk - set)) / 60000)
        : 0
    rows.push({
      name: label,
      lat: coords.lat,
      lon: coords.lon,
      dayLength: durationOf(results),
      sunrise: clock(results.sunrise),
      sunset: clock(results.sunset),
      golden,
      polar: polarNote(results) !== "",
    })
  }
  if (!rows.length) {
    throw new ShootProofError(`No location could be read. ${failures.slice(0, 3).join(" | ")}`);
  }

  const ranked = [...rows].sort((a, b) => b.dayLength - a.dayLength)
  const longest = ranked[0]
  const shortest = ranked[ranked.length - 1]

  return [
    `Daylight comparison for ${date}`,
    `  ${rows.length} of ${capped.length} location(s) read, ranked by day length`,
    "  All times are UTC, as published by the solar service.",
    "",
    "Location                     lat      lon     sunrise  sunset  day length  golden",
    ...ranked.map((row) =>
      `  ${row.name.slice(0, 26).padEnd(26)} ${String(row.lat).padStart(7)} ${String(row.lon).padStart(8)}  ${row.sunrise.padStart(8)} ${row.sunset.padStart(7)}  ${hoursMinutes(row.dayLength).padStart(11)}  ${row.golden ? `${row.golden} min` : "n/a"}`
    ),
    "",
    longest && shortest
      ? `${longest.name} has the most light at ${hoursMinutes(longest.dayLength)}, ${shortest.name} the least at ${hoursMinutes(shortest.dayLength)}, a spread of ${hoursMinutes(longest.dayLength - shortest.dayLength)}.`
      : "",
    ranked.some((r) => r.polar)
      ? `${ranked.filter((r) => r.polar).map((r) => r.name).join(", ")} ${ranked.filter((r) => r.polar).length === 1 ? "is" : "are"} at a polar latitude on this date, so its sunrise and sunset are not real clock times.`
      : "",
    failures.length ? `\n  not read: ${failures.slice(0, 4).join(" | ")}` : "",
    "",
    "Source: sunrise-sunset.org solar geometry, UTC.",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
