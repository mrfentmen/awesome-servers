/**
 * Space launches, satellites, radio frequencies, news and space weather - keyless.
 *
 * Upstreams:
 *   - rocketlaunch.live        upcoming launches worldwide
 *   - db.satnogs.org           satellite catalogue, TLE element sets, transmitters
 *   - spaceflightnewsapi.net   space news and blog posts
 *   - services.swpc.noaa.gov   NOAA space weather (Kp index, solar wind, scales)
 *
 * The Space Devs' Launch Library used to back this server, but it rate-limits
 * anonymous callers after a handful of requests, which cannot carry a paid
 * Actor. Celestrak was trialled for the orbit tools and dropped as well: it
 * refuses repeat group downloads for two hours at a time. Every source used
 * here answers without a key and without a per-caller quota.
 */

export class SpacedevsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SpacedevsError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = "mrfentmen-spacedevs-mcp/1.0"
const LAUNCHES = "https://fdo.rocketlaunch.live/json/launches/next"
const SATNOGS = "https://db.satnogs.org/api"
const SFNEWS = "https://api.spaceflightnewsapi.net/v4"
const SWPC = "https://services.swpc.noaa.gov/products"

const EARTH_RADIUS_KM = 6378.137
const EARTH_MU = 398600.4418
const CATALOGUE_TTL_MS = 60 * 60 * 1000

async function fetchJson<T>(url: string, timeoutMs = 25000): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (e) {
    throw new SpacedevsError(`Could not reach the data source: ${errorMessage(e)}`)
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200)
    throw new SpacedevsError(`Data source returned HTTP ${res.status}: ${body}`)
  }
  return (await res.json()) as T
}

function utc(iso: string | undefined | null): string {
  if (!iso) return "?"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`
}

// ---------------------------------------------------------------- launches

interface LaunchRef {
  name?: string
  slug?: string
}

interface LaunchRecord {
  id?: number
  name?: string
  slug?: string
  t0?: string | null
  win_open?: string | null
  date_str?: string
  launch_description?: string | null
  mission_description?: string | null
  provider?: LaunchRef | null
  vehicle?: LaunchRef | null
  pad?: { name?: string; location?: { name?: string; state?: string; country?: string } } | null
  tags?: { text?: string }[] | null
  weather_summary?: string | null
  weather_temp?: string | null
  weather_wind_mph?: string | null
  est_date?: { month?: number | null; day?: number | null; year?: number | null } | null
}

interface LaunchFeed {
  result?: LaunchRecord[]
  errors?: string[]
}

/**
 * rocketlaunch.live answers in two shapes: a bare feed for requests it serves
 * as asked, and the same payload wrapped in `response` once it caps the limit
 * (5 launches without a key). Both have to be read.
 */
interface LaunchEnvelope {
  result?: LaunchRecord[]
  errors?: string[]
  response?: LaunchFeed
}

const LAUNCH_LIMIT_KEYLESS = 5

function launchLink(l: LaunchRecord): string {
  return l.slug ? `https://rocketlaunch.live/launch/${l.slug}` : "https://rocketlaunch.live"
}

/** How firm the T-0 is: a clock time, an opening window, or only a date. */
function scheduleConfidence(l: LaunchRecord): string {
  if (l.win_open && l.t0) return `window opens ${utc(l.win_open)}`
  if (l.est_date?.year) return "date is estimated, no clock time yet"
  return "scheduled time"
}

function padLine(l: LaunchRecord): string {
  const pad = l.pad ?? {}
  const loc = pad.location ?? {}
  return [pad.name, loc.name, loc.state, loc.country].filter(Boolean).join(", ") || "pad not announced"
}

/** The summary already repeats temp and wind, so only its first line is kept. */
function weatherLine(l: LaunchRecord): string | null {
  const raw = (l.weather_summary ?? "").trim()
  if (!raw) return null
  const first = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0] ?? ""
  const condition = /^temp/i.test(first) ? "" : first
  const temp = Number.isFinite(Number(l.weather_temp)) ? `${Math.round(Number(l.weather_temp))}F` : ""
  const wind = Number.isFinite(Number(l.weather_wind_mph))
    ? `wind ${Math.round(Number(l.weather_wind_mph))} mph`
    : ""
  return [condition, temp, wind].filter(Boolean).join(" · ") || null
}

function formatLaunch(l: LaunchRecord, index: number): string[] {
  const vehicle = l.vehicle?.name ?? "unknown vehicle"
  const provider = l.provider?.name ?? "unknown provider"
  const lines = [
    `${index}. ${l.name ?? "unnamed mission"} — ${vehicle} · ${provider}`,
    `   T-0 ${l.t0 ? utc(l.t0) : l.date_str ?? "date not announced"} (${scheduleConfidence(l)})`,
    `   pad ${padLine(l)}`,
  ]
  const weather = weatherLine(l)
  if (weather) lines.push(`   weather ${weather}`)
  const tags = (l.tags ?? []).map((t) => t.text).filter(Boolean)
  if (tags.length) lines.push(`   tags ${tags.join(", ")}`)
  lines.push(`   ${launchLink(l)}`)
  return lines
}

async function launchFeed(limit: number): Promise<LaunchRecord[]> {
  // Above five the keyless feed caps itself, so ask for no more than that.
  const n = Math.max(1, Math.min(limit, LAUNCH_LIMIT_KEYLESS))
  const body = await fetchJson<LaunchEnvelope>(`${LAUNCHES}/${n}`)
  const feed: LaunchFeed = body.response ?? body
  if (feed.errors?.length) throw new SpacedevsError(feed.errors.join("; "))
  return feed.result ?? []
}

export async function nextLaunches(limit = 5, provider?: string): Promise<string> {
  const want = Math.max(1, Math.min(limit, 25))
  // The keyless feed tops out at five launches, so the provider filter can only
  // look at those five; say so rather than implying the whole schedule was read.
  const feed = await launchFeed(LAUNCH_LIMIT_KEYLESS)
  const matches = provider
    ? feed.filter((l) => (l.provider?.name ?? "").toLowerCase().includes(provider.toLowerCase()))
    : feed
  if (!matches.length) {
    return provider
      ? `None of the next ${feed.length} launch(es) are from a provider matching "${provider}". Call again without a provider to see the schedule.`
      : "No upcoming launches are listed right now."
  }
  const rows = matches.slice(0, want)
  const header = provider
    ? `Upcoming launches from providers matching "${provider}" — showing ${rows.length} of ${matches.length} in the next ${feed.length}:`
    : `Next ${rows.length} launch(es) worldwide (the keyless feed lists five at a time):`
  return [header, "", ...rows.flatMap((l, i) => [...formatLaunch(l, i + 1), ""])].join("\n").trimEnd()
}

export async function launchCountdown(): Promise<string> {
  const feed = await launchFeed(LAUNCH_LIMIT_KEYLESS)
  const now = Date.now()
  const upcoming = feed
    .filter((l) => l.t0 && !Number.isNaN(new Date(l.t0).getTime()))
    .sort((a, b) => new Date(a.t0 as string).getTime() - new Date(b.t0 as string).getTime())
  const next = upcoming.find((l) => new Date(l.t0 as string).getTime() > now)
  if (!next) {
    return feed.length
      ? "Every listed launch has a T-0 in the past - the feed is being refreshed, try again shortly."
      : "No upcoming launches are listed right now."
  }

  const t0 = new Date(next.t0 as string).getTime()
  const minutes = Math.round((t0 - now) / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const away = [days ? `${days}d` : "", hours ? `${hours}h` : "", `${minutes % 60}m`].filter(Boolean).join(" ")
  const mission = (next.mission_description ?? next.launch_description ?? "").replace(/\s+/g, " ").trim()

  const lines = [
    `Next launch in ${away}`,
    `  ${next.name ?? "unnamed mission"} — ${next.vehicle?.name ?? "unknown vehicle"} · ${next.provider?.name ?? "unknown provider"}`,
    `  T-0 ${utc(next.t0)}`,
    `  pad ${padLine(next)}`,
    `  ${scheduleConfidence(next)}`,
  ]
  const weather = weatherLine(next)
  if (weather) lines.push(`  weather ${weather}`)
  if (mission) lines.push(`  mission ${mission.slice(0, 400)}${mission.length > 400 ? " …" : ""}`)
  lines.push(`  ${launchLink(next)}`)

  const following = upcoming.filter((l) => new Date(l.t0 as string).getTime() > t0).slice(0, 3)
  if (following.length) {
    lines.push("", "After that:")
    for (const l of following) {
      lines.push(`  ${utc(l.t0)} — ${l.name ?? "unnamed"} (${l.vehicle?.name ?? "?"} · ${l.provider?.name ?? "?"})`)
    }
  }
  return lines.join("\n")
}

// -------------------------------------------------------------- satellites

interface SatelliteMeta {
  sat_id?: string
  norad_cat_id?: number
  name?: string
  names?: string | null
  status?: string
  decayed?: string | null
  launched?: string | null
  website?: string | null
  operator?: string | null
  countries?: string | null
}

interface TleRecord {
  tle0?: string
  tle1?: string
  tle2?: string
  tle_source?: string
  sat_id?: string
  norad_cat_id?: number
  updated?: string
}

interface Transmitter {
  description?: string
  alive?: boolean
  type?: string
  uplink_low?: number | null
  uplink_high?: number | null
  downlink_low?: number | null
  downlink_high?: number | null
  mode?: string | null
  baud?: number | null
}

let catalogueCache: { at: number; rows: SatelliteMeta[] } | null = null

/** The whole SatNOGS catalogue is one 1.5 MB call; hold it for the hour. */
async function satelliteCatalogue(): Promise<SatelliteMeta[]> {
  if (catalogueCache && Date.now() - catalogueCache.at < CATALOGUE_TTL_MS) return catalogueCache.rows
  const rows = await fetchJson<SatelliteMeta[]>(`${SATNOGS}/satellites/?format=json`)
  catalogueCache = { at: Date.now(), rows }
  return rows
}

async function satelliteMeta(noradId: number): Promise<SatelliteMeta | null> {
  const rows = await fetchJson<SatelliteMeta[]>(`${SATNOGS}/satellites/?format=json&norad_cat_id=${noradId}`)
  return rows[0] ?? null
}

function orbitFacts(meanMotion: number, ecc: number, inclination: number) {
  const periodMin = 1440 / meanMotion
  const n = (meanMotion * 2 * Math.PI) / 86400
  const a = Math.cbrt(EARTH_MU / (n * n))
  const apogeeKm = a * (1 + ecc) - EARTH_RADIUS_KM
  const perigeeKm = a * (1 - ecc) - EARTH_RADIUS_KM
  const velocityKmS = Math.sqrt(EARTH_MU / a)

  let orbitClass: string
  if (ecc > 0.25 && perigeeKm < 2000) orbitClass = "highly elliptical (HEO)"
  else if (perigeeKm < 2000) orbitClass = "low Earth orbit (LEO)"
  else if (perigeeKm < 35000) orbitClass = "medium Earth orbit (MEO)"
  else if (Math.abs(periodMin - 1436) <= 30 && ecc < 0.05) {
    orbitClass = inclination < 5 ? "geostationary (GEO)" : "inclined geosynchronous (GSO)"
  } else orbitClass = "high orbit (HEO/GEO band)"

  return { periodMin, apogeeKm, perigeeKm, velocityKmS, orbitClass }
}

/** TLE line 2 is fixed-width: columns are defined by the format, not by spaces. */
function parseTle(line2: string) {
  const meanMotion = Number(line2.slice(52, 63))
  const ecc = Number(`0.${line2.slice(26, 33).trim()}`)
  const inclination = Number(line2.slice(8, 16))
  if (!Number.isFinite(meanMotion) || meanMotion <= 0 || !Number.isFinite(ecc) || !Number.isFinite(inclination)) {
    throw new SpacedevsError("Could not read the orbital element set for this satellite.")
  }
  return {
    inclination,
    raan: Number(line2.slice(17, 25)),
    ecc,
    argPerigee: Number(line2.slice(34, 42)),
    meanAnomaly: Number(line2.slice(43, 51)),
    meanMotion,
    revNumber: Number(line2.slice(63, 68)),
  }
}

/** SatNOGS writes Python's None into empty fields, so it is treated as blank. */
function str(value: string | null | undefined): string {
  if (!value) return ""
  const trimmed = value.trim()
  return !trimmed || trimmed === "None" || trimmed === "null" ? "" : trimmed
}

function metaLine(meta: SatelliteMeta | null): string {
  if (!meta) return "catalogue entry not found"
  const bits = [
    str(meta.status) ? `status ${str(meta.status)}` : "",
    str(meta.operator) ? `operator ${str(meta.operator)}` : "",
    str(meta.countries) ? `country ${str(meta.countries)}` : "",
    str(meta.launched) ? `launched ${str(meta.launched).slice(0, 10)}` : "",
  ].filter(Boolean)
  return bits.join(" · ") || "no catalogue details"
}

export async function satelliteSearch(query: string, limit = 10): Promise<string> {
  const want = Math.max(1, Math.min(limit, 25))
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return "Search needs at least two characters, e.g. 'ISS' or 'NOAA'."
  const rows = await satelliteCatalogue()
  const matches = rows.filter(
    (s) => str(s.name).toLowerCase().includes(needle) || str(s.names).toLowerCase().includes(needle),
  )
  if (!matches.length) return `No satellite in the catalogue matches "${query}". Try a shorter prefix.`

  const lines = [
    matches.length > want
      ? `${matches.length} satellite(s) match "${query}" — showing the first ${want}:`
      : `${matches.length} satellite(s) match "${query}":`,
    "",
  ]
  for (const s of matches.slice(0, want)) {
    lines.push(`${str(s.name) || "unnamed"} — NORAD ${s.norad_cat_id ?? "?"}`, `   ${metaLine(s)}`)
  }
  return lines.join("\n")
}

export async function satelliteOrbit(noradId: number): Promise<string> {
  const [tleRows, meta] = await Promise.all([
    fetchJson<TleRecord[]>(`${SATNOGS}/tle/?format=json&norad_cat_id=${noradId}`),
    satelliteMeta(noradId),
  ])
  const tle = tleRows[0]
  if (!tle?.tle2) {
    return `No orbital element set for NORAD catalog number ${noradId}. Search the satellite by name first to check the number.`
  }
  const parsed = parseTle(tle.tle2)
  const facts = orbitFacts(parsed.meanMotion, parsed.ecc, parsed.inclination)
  return [
    `${str(meta?.name) || str(tle.tle0) || "satellite"} — NORAD ${noradId}`,
    `  ${metaLine(meta)}`,
    `  orbit class               ${facts.orbitClass}`,
    `  element set updated       ${utc(tle.updated)}${tle.tle_source ? ` (source ${tle.tle_source})` : ""}`,
    `  inclination               ${parsed.inclination.toFixed(2)}°`,
    `  eccentricity              ${parsed.ecc.toFixed(5)}`,
    `  period                    ${facts.periodMin.toFixed(1)} min (${parsed.meanMotion.toFixed(3)} rev/day)`,
    `  apogee / perigee          ${facts.apogeeKm.toFixed(1)} km / ${facts.perigeeKm.toFixed(1)} km`,
    `  mean orbital velocity     ${facts.velocityKmS.toFixed(2)} km/s`,
    `  right ascension / arg.    ${parsed.raan.toFixed(2)}° / ${parsed.argPerigee.toFixed(2)}°`,
    `  mean anomaly              ${parsed.meanAnomaly.toFixed(2)}°`,
    `  revolutions at epoch      ${Number.isFinite(parsed.revNumber) ? parsed.revNumber : "?"}`,
  ].join("\n")
}

function mhz(hz: number | null | undefined): string {
  return typeof hz === "number" ? `${(hz / 1e6).toFixed(4)} MHz` : ""
}

export async function satelliteFrequencies(noradId: number, limit = 10): Promise<string> {
  const want = Math.max(1, Math.min(limit, 25))
  const tleRows = await fetchJson<TleRecord[]>(`${SATNOGS}/tle/?format=json&norad_cat_id=${noradId}`)
  const satId = tleRows[0]?.sat_id
  if (!satId) return `Nothing is known about NORAD catalog number ${noradId} in the SatNOGS database.`

  const rows = await fetchJson<Transmitter[]>(
    `${SATNOGS}/transmitters/?format=json&sat_id=${encodeURIComponent(satId)}`,
  )
  if (!rows.length) return `No transmitter records for NORAD ${noradId} (${satId}).`

  const alive = rows.filter((t) => t.alive)
  const shown = (alive.length ? alive : rows).slice(0, want)
  const lines = [
    `Transmitters for NORAD ${noradId} — ${rows.length} record(s), ${alive.length} active` +
      (shown.length < (alive.length || rows.length) ? ` (showing ${shown.length}):` : ":"),
    "",
  ]
  for (const t of shown) {
    const up = t.uplink_low ? `uplink ${mhz(t.uplink_low)}${t.uplink_high ? ` - ${mhz(t.uplink_high)}` : ""}` : ""
    const down = t.downlink_low
      ? `downlink ${mhz(t.downlink_low)}${t.downlink_high ? ` - ${mhz(t.downlink_high)}` : ""}`
      : ""
    const mode = t.mode ? `mode ${t.mode}${t.baud ? ` at ${t.baud} baud` : ""}` : ""
    lines.push(
      `  ${t.description ?? t.type ?? "transmitter"} ${t.alive ? "[active]" : "[inactive]"}`,
      `     ${[up, down, mode].filter(Boolean).join(" · ") || "frequencies not recorded"}`,
    )
  }
  return lines.join("\n")
}

// ------------------------------------------------------------------- news

interface NewsItem {
  title?: string
  url?: string
  news_site?: string
  summary?: string
  published_at?: string
  authors?: { name?: string }[]
}

interface NewsFeed {
  count?: number
  results?: NewsItem[]
}

async function newsFeed(kind: "articles" | "blogs", query: string | undefined, limit: number): Promise<string> {
  const want = Math.max(1, Math.min(limit, 15))
  const url = new URL(`${SFNEWS}/${kind}`)
  url.searchParams.set("limit", String(want))
  if (query) url.searchParams.set("search", query)
  const feed = await fetchJson<NewsFeed>(url.toString())
  const items = feed.results ?? []
  if (!items.length) return query ? `Nothing in space ${kind} matches "${query}".` : `No space ${kind} are listed right now.`

  const label = kind === "articles" ? "Space news" : "Space blog posts"
  const lines = [
    query
      ? `${label} matching "${query}" — ${items.length} of ${feed.count ?? items.length}:`
      : `Latest ${label} — ${items.length} of ${feed.count ?? items.length}:`,
    "",
  ]
  for (const item of items) {
    const byline = item.authors?.map((a) => a.name).filter(Boolean).join(", ")
    lines.push(
      `${item.title ?? "untitled"}`,
      `   ${item.news_site ?? "unknown site"} · ${utc(item.published_at)}${byline ? ` · ${byline}` : ""}`,
    )
    const summary = (item.summary ?? "").replace(/\s+/g, " ").trim()
    if (summary) lines.push(`   ${summary.slice(0, 300)}${summary.length > 300 ? " …" : ""}`)
    lines.push(`   ${item.url ?? ""}`)
  }
  return lines.join("\n")
}

export function spaceNews(query: string | undefined, limit = 5): Promise<string> {
  return newsFeed("articles", query, limit)
}

export function spaceBlogs(query: string | undefined, limit = 5): Promise<string> {
  return newsFeed("blogs", query, limit)
}

// ---------------------------------------------------------- space weather

interface KpForecastRow {
  time_tag?: string
  kp?: number
  observed?: string
}

interface SolarWindRow {
  proton_speed?: number
  time_tag?: string
}

interface MagFieldRow {
  bt?: number
  bz_gsm?: number
  time_tag?: string
}

interface ScaleEntry {
  Scale?: string
  Text?: string
}

interface Scales {
  DateStamp?: string
  TimeStamp?: string
  R?: ScaleEntry
  S?: ScaleEntry
  G?: ScaleEntry
}

function kpMeaning(kp: number): string {
  if (kp < 4) return "quiet"
  if (kp < 5) return "active"
  if (kp < 6) return "minor storm (G1)"
  if (kp < 7) return "moderate storm (G2)"
  if (kp < 8) return "strong storm (G3)"
  if (kp < 9) return "severe storm (G4)"
  return "extreme storm (G5)"
}

export async function spaceWeather(): Promise<string> {
  const [forecast, wind, mag, scales] = await Promise.all([
    fetchJson<KpForecastRow[]>(`${SWPC}/noaa-planetary-k-index-forecast.json`),
    fetchJson<SolarWindRow[]>(`${SWPC}/summary/solar-wind-speed.json`),
    fetchJson<MagFieldRow[]>(`${SWPC}/summary/solar-wind-mag-field.json`),
    fetchJson<Record<string, Scales>>(`${SWPC}/noaa-scales.json`),
  ])

  const observed = forecast.filter((r) => (r.observed ?? "").startsWith("observed") && typeof r.kp === "number")
  const predicted = forecast.filter((r) => (r.observed ?? "").startsWith("predicted") && typeof r.kp === "number")
  const latest = observed[observed.length - 1]
  const peakObserved = observed.reduce<number>((max, r) => Math.max(max, r.kp as number), -Infinity)
  const peakPredicted = predicted.reduce<{ kp: number; at: string } | null>(
    (best, r) => (!best || (r.kp as number) > best.kp ? { kp: r.kp as number, at: utc(r.time_tag) } : best),
    null,
  )

  const current = scales["-1"] ?? {}
  const stamp = `${str(current.DateStamp)} ${str(current.TimeStamp)}`.trim()
  const lines = [
    `Space weather now — latest Kp reading ${utc(latest?.time_tag)}`,
    "",
    `  Kp index          ${Number(latest?.kp ?? 0).toFixed(2)} (${kpMeaning(Number(latest?.kp ?? 0))})`,
    `  solar wind        ${wind[0]?.proton_speed ?? "?"} km/s, |B| ${mag[0]?.bt ?? "?"} nT, Bz ${mag[0]?.bz_gsm ?? "?"} nT`,
    `  NOAA scales       radio R${current.R?.Scale ?? "0"} (${current.R?.Text ?? "none"}), solar S${current.S?.Scale ?? "0"} (${current.S?.Text ?? "none"}), geomagnetic G${current.G?.Scale ?? "0"} (${current.G?.Text ?? "none"})${stamp ? ` as of ${stamp} UTC` : ""}`,
  ]
  if (Number.isFinite(peakObserved)) {
    lines.push(`  peak Kp observed  ${peakObserved.toFixed(2)} (${kpMeaning(peakObserved)})`)
  }
  if (peakPredicted) {
    lines.push(`  forecast peak Kp  ${peakPredicted.kp.toFixed(2)} (${kpMeaning(peakPredicted.kp)}) around ${peakPredicted.at}`)
  }
  lines.push("", "Kp 5 or above means aurora is likely at high latitudes; Kp 7 or above can affect satellites and power grids.")
  return lines.join("\n")
}

// ---- batch-2 tools: extra live-data tools (2026-09-26) ----
// ------------------------------------------------- Launch Library 2 (reference data)
//
// The launch tools above use rocketlaunch.live because Launch Library 2 hands out a
// small anonymous quota. The reference data below (agencies, astronauts, vehicles,
// events) only exists there, so it reads the production host first and drops to the
// development mirror, which serves the same schema without a quota, when production
// answers 429 or a server error.

const LL2_PRODUCTION = "https://ll.thespacedevs.com/2.2.0"
const LL2_DEV = "https://lldev.thespacedevs.com/2.2.0"

interface Ll2Page<T> {
  count?: number
  results?: T[]
}

interface Ll2Agency {
  id?: number
  name?: string
  abbrev?: string
  type?: string
  country_code?: string
  featured?: boolean
  description?: string
}

interface Ll2Astronaut {
  id?: number
  name?: string
  agency?: string
  nationality?: string
  status?: { name?: string }
  type?: { name?: string }
  in_space?: boolean
  time_in_space?: string
  eva_time?: string
}

interface Ll2Vehicle {
  id?: number
  name?: string
  family?: string
  full_name?: string
  variant?: string
  description?: string
  manufacturer?: { name?: string } | string
  length?: number | null
  diameter?: number | null
  launch_mass?: number | null
  leo_capacity?: number | null
  gto_capacity?: number | null
  launch_cost?: string | null
  reusable?: boolean
  maiden_flight?: string | null
  min_stage?: number | null
  max_stage?: number | null
  successful_launches?: number
  failed_launches?: number
  pending_launches?: number
  total_launch_count?: number
}

interface Ll2Event {
  id?: number
  name?: string
  slug?: string
  type?: { name?: string }
  date?: string
  date_precision?: string
  description?: string
  location?: string
  webcast_live?: boolean
  program?: Array<{ name?: string }>
}

const retryable = (e: unknown) => /HTTP (429|5\d\d)/.test(errorMessage(e))

async function ll2<T>(path: string, params: Record<string, string | number> = {}): Promise<Ll2Page<T>> {
  const pairs = Object.entries({ ...params, mode: "list" }).map(([key, value]) => [key, String(value)] as [string, string])
  const query = new URLSearchParams(pairs).toString()
  try {
    return await fetchJson<Ll2Page<T>>(`${LL2_PRODUCTION}${path}?${query}`, 30000)
  } catch (e) {
    if (!retryable(e)) throw e
    return await fetchJson<Ll2Page<T>>(`${LL2_DEV}${path}?${query}`, 30000)
  }
}

async function ll2Detail<T>(path: string): Promise<T> {
  try {
    return await fetchJson<T>(`${LL2_PRODUCTION}${path}?mode=list`, 30000)
  } catch (e) {
    if (!retryable(e)) throw e
    return await fetchJson<T>(`${LL2_DEV}${path}?mode=list`, 30000)
  }
}

/** ISO-8601 durations from Launch Library 2, as a plain day/hour figure. */
function isoDuration(value: string | undefined): string {
  if (!value) return "?"
  const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value)
  if (!match) return value
  const days = Number(match[1] ?? 0) * 365 + Number(match[2] ?? 0) * 30 + Number(match[3] ?? 0)
  const hours = Number(match[4] ?? 0)
  if (!days && !hours) {
    const minutes = Number(match[5] ?? 0)
    return minutes ? `${minutes} min` : "0"
  }
  return `${days} day(s) ${hours} h`.replace(" 0 h", "")
}

const clip = (value: string | undefined, max = 220) => {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

/** Launch Library 2 quotes launch cost as a raw figure string. */
const usd = (value: string | null | undefined): string | null => {
  if (!value) return null
  const figure = Number(String(value).replace(/[^0-9.]/g, ""))
  if (!Number.isFinite(figure) || figure <= 0) return String(value)
  return `$${figure.toLocaleString("en-US")}`
}

export async function spaceAgencies(query?: string, type?: string, limit = 10): Promise<string> {
  const search = String(query ?? "").trim()
  const wanted = String(type ?? "").trim().toLowerCase()
  const page = await ll2<Ll2Agency>("/agencies/", {
    limit: wanted ? 50 : Math.min(Math.max(limit, 1), 25),
    ...(search ? { search } : {}),
  })
  const rows = (page.results ?? []).filter(
    (row) => !wanted || String(row.type ?? "").toLowerCase().includes(wanted)
  )
  if (!rows.length) {
    return `No Launch Library 2 agencies match${search ? ` "${search}"` : ""}${wanted ? ` of type ${type}` : ""}.`
  }
  const total = page.count ?? rows.length
  const scope = [search ? `"${search}"` : "", wanted ? `type ${type}` : ""].filter(Boolean).join(", ")
  return `Space agencies${scope ? ` (${scope})` : ""} — ${rows.length} shown of ${total} in Launch Library 2:\n` +
    rows.slice(0, limit).map((row, i) =>
      `${i + 1}. ${row.name ?? "?"}${row.abbrev ? ` (${row.abbrev})` : ""} | ${row.type ?? "type n/a"} | ${row.country_code ?? "country n/a"}` +
      `${row.featured ? " | featured" : ""} | agency id ${row.id ?? "?"}` +
      `${row.description ? `\n   ${clip(row.description)}` : ""}`
    ).join("\n")
}

export async function astronauts(query?: string, inSpace?: boolean, limit = 10): Promise<string> {
  const search = String(query ?? "").trim()
  const page = await ll2<Ll2Astronaut>("/astronaut/", {
    limit: inSpace ? 100 : Math.min(Math.max(limit, 1), 25),
    ...(search ? { search } : {}),
  })
  const rows = (page.results ?? []).filter((row) => inSpace !== true || row.in_space === true)
  if (!rows.length) {
    return `No Launch Library 2 astronauts match${search ? ` "${search}"` : ""}${inSpace ? " that are currently in space" : ""}.`
  }
  const total = page.count ?? rows.length
  const scope = [search ? `"${search}"` : "", inSpace ? "currently in space" : ""].filter(Boolean).join(", ")
  return `Astronauts${scope ? ` (${scope})` : ""} — ${rows.length} shown of ${total} in Launch Library 2:\n` +
    rows.slice(0, limit).map((row, i) =>
      `${i + 1}. ${row.name ?? "?"} | ${row.agency ?? "agency n/a"} | ${row.nationality ?? "nationality n/a"}` +
      ` | ${row.status?.name ?? "status n/a"}${row.in_space ? " | IN SPACE now" : ""}` +
      `\n   time in space ${isoDuration(row.time_in_space)}, spacewalks ${isoDuration(row.eva_time)} | astronaut id ${row.id ?? "?"}`
    ).join("\n")
}

export async function launchVehicles(query: string, limit = 5): Promise<string> {
  const needle = String(query ?? "").trim()
  if (!needle) throw new SpacedevsError("query is required, e.g. 'Falcon 9' or 'Ariane'.")
  const page = await ll2<Ll2Vehicle>("/config/launcher/", { search: needle, limit: 10 })
  const rows = page.results ?? []
  if (!rows.length) return `No Launch Library 2 launch vehicles match "${query}".`
  const best = rows[0]
  // The spec sheet needs a second call; if it fails the match list still answers.
  let detail: Ll2Vehicle | null = null
  if (best.id) {
    try {
      detail = await ll2Detail<Ll2Vehicle>(`/config/launcher/${best.id}/`)
    } catch {
      detail = null
    }
  }
  const vehicle = detail ?? best
  const maker = typeof vehicle.manufacturer === "string" ? vehicle.manufacturer : vehicle.manufacturer?.name
  const stages = vehicle.min_stage && vehicle.max_stage ? `${vehicle.min_stage}-${vehicle.max_stage}` : undefined
  const spec = [
    `Rocket: ${vehicle.full_name ?? vehicle.name ?? "?"}${vehicle.family ? ` (${vehicle.family} family${vehicle.variant ? `, ${vehicle.variant}` : ""})` : ""}`,
    `Manufacturer: ${maker ?? "not listed"}${vehicle.reusable == null ? "" : ` | reusable: ${vehicle.reusable ? "yes" : "no"}`}${stages ? ` | stages: ${stages}` : ""}`,
    `Size: length ${vehicle.length ?? "?"} m, diameter ${vehicle.diameter ?? "?"} m, launch mass ${vehicle.launch_mass ?? "?"} t`,
    `Payload: LEO ${vehicle.leo_capacity ?? "?"} kg | GTO ${vehicle.gto_capacity ?? "?"} kg${usd(vehicle.launch_cost) ? ` | launch cost ${usd(vehicle.launch_cost)}` : ""}`,
    `Flights: ${vehicle.successful_launches ?? "?"} successful, ${vehicle.failed_launches ?? "?"} failed, ${vehicle.pending_launches ?? "?"} upcoming` +
      `${vehicle.maiden_flight ? ` | maiden flight ${String(vehicle.maiden_flight).slice(0, 10)}` : ""}`,
    vehicle.description ? clip(vehicle.description, 400) : "",
  ].filter(Boolean)
  const others = rows.slice(1, limit + 1)
  return `Launch vehicle matches for "${query}" (${rows.length} of ${page.count ?? rows.length} in Launch Library 2):\n\n` +
    spec.join("\n") +
    (others.length
      ? `\n\nOther matches:\n` +
        others.map((row, i) => `${i + 1}. ${row.full_name ?? row.name ?? "?"} | id ${row.id ?? "?"}`).join("\n")
      : "")
}

export async function upcomingEvents(eventType?: string, limit = 10): Promise<string> {
  const wanted = String(eventType ?? "").trim().toLowerCase()
  const page = await ll2<Ll2Event>("/event/upcoming/", { limit: wanted ? 25 : Math.min(Math.max(limit, 1), 25) })
  const rows = (page.results ?? []).filter(
    (row) => !wanted || String(row.type?.name ?? "").toLowerCase().includes(wanted)
  )
  if (!rows.length) {
    return `No upcoming Launch Library 2 events${wanted ? ` of type "${eventType}"` : ""} right now.`
  }
  const total = page.count ?? rows.length
  return `Upcoming space events${wanted ? ` (type ${eventType})` : ""} — ${rows.length} shown of ${total} in Launch Library 2:\n` +
    rows.slice(0, limit).map((row, i) =>
      `${i + 1}. ${utc(row.date)} | ${row.name ?? "?"} | ${row.type?.name ?? "type n/a"}${row.webcast_live ? " | LIVE webcast" : ""}` +
      `\n   ${row.location ?? "location n/a"}${row.program?.length ? ` | ${row.program.map((entry) => entry.name).filter(Boolean).join(', ')}` : ""}` +
      `${row.description ? `\n   ${clip(row.description)}` : ""}`
    ).join("\n")
}
