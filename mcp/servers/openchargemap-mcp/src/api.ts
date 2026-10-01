export class OcmError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OcmError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.OPENCHARGEMAP_API_KEY;
  if (!k) throw new OcmError("Set OPENCHARGEMAP_API_KEY (free Open Charge Map key).");
  return k;
}

async function get(path: string): Promise<string> {
  const sep = path.includes("?") ? "&" : "?";
  let res: Response;
  try {
    res = await fetch(`https://api.openchargemap.io/v3${path}${sep}key=${encodeURIComponent(key())}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new OcmError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OcmError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function nearby(lat: string, lon: string, distance?: string, maxResults?: string): Promise<string> {
  const n = Math.min(Number(maxResults ?? 10) || 10, 100);
  return get(`/poi/?output=json&latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&distance=${encodeURIComponent(distance ?? "25")}&distanceunit=Miles&maxresults=${n}`);
}

export function getPoi(poiId: string): Promise<string> {
  return get(`/poi/?output=json&chargepointid=${encodeURIComponent(poiId)}`);
}

// ---- muxG tools:
const OCM_OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
]
const OCM_LIST_CAP = 20

interface OcmOsmElement {
  type?: string
  id?: number
  lat?: number
  lon?: number
  tags?: Record<string, string>
}

function ocmBound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

function ocmCoord(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isFinite(n) || Math.abs(n) > 90) throw new OcmError(`"${value}" is not a latitude, which must be between -90 and 90.`)
  return n
}

function ocmLong(value: unknown): number | null {
  const n = Number(value)
  if (!Number.isFinite(n) || Math.abs(n) > 180) throw new OcmError(`"${value}" is not a longitude, which must be between -180 and 180.`)
  return n
}

async function ocmOverpass(query: string): Promise<OcmOsmElement[]> {
  let lastStatus = 0
  for (const endpoint of OCM_OVERPASS_ENDPOINTS) {
    let res: Response
    try {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "User-Agent": "awesome-mcps/1.0 (EV charging lookup)", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ data: query }).toString(),
        signal: AbortSignal.timeout(45000),
      })
    } catch {
      continue
    }
    lastStatus = res.status
    if (!res.ok) continue
    const d = (await res.json()) as { elements?: OcmOsmElement[] }
    if (Array.isArray(d.elements)) return d.elements
  }
  throw new OcmError(`Both OpenStreetMap Overpass mirrors failed (last status ${lastStatus || "no response"}). Overpass is volunteer-run and often busy, so retry in a minute.`)
}

function ocmSockets(tags: Record<string, string>): string[] {
  const out: string[] = []
  for (let i = 1; i <= 4; i += 1) {
    for (const kind of ["type2", "type1", "type3"]) {
      const v = tags[`socket:${kind}:${i}`] ?? (i === 1 ? tags[`socket:${kind}`] : undefined)
      if (v) out.push(v)
    }
  }
  if (tags["socket:chademo"]) out.push("chademo")
  if (tags["socket:tesla_r"]) out.push("tesla_r")
  if (tags["socket:tesla_s"] || tags["socket:tesla_s superpower"]) out.push("tesla_s")
  if (tags["socket:wireless"]) out.push("wireless")
  return [...new Set(out)].map((s) => s.replace(/_plug$/, ""))
}

function ocmPowerClass(tags: Record<string, string>): string {
  const kw = Number(String(tags["maxpower"] ?? "").replace(/[^0-9.]/g, ""))
  if (Number.isFinite(kw) && kw > 0) return kw >= 150 ? "150 kW or more" : kw >= 50 ? "50-150 kW" : kw >= 22 ? "22-50 kW" : "under 22 kW"
  const v = Number(tags.voltage ?? "")
  return Number.isFinite(v) && v >= 100 ? "high voltage, power not reported" : "power not reported"
}

/** Charging stations around a point, read from OpenStreetMap rather than the OCM registry. */
export async function osmChargersNearby(args: { lat?: number; lon?: number; radius_km?: number; limit?: number }): Promise<string> {
  const lat = ocmCoord(args.lat)
  const lon = ocmLong(args.lon)
  if (lat === null || lon === null) throw new OcmError("lat and lon are required, for example 51.5 and -0.12.")
  const radius = ocmBound(args.radius_km, 0.1, 50, 5)
  const limit = ocmBound(args.limit, 1, OCM_LIST_CAP, 12)

  const elements = await ocmOverpass(
    `[out:json][timeout:25];(node["amenity"="charging_station"](around:${radius * 1000},${lat},${lon});way["amenity"="charging_station"](around:${radius * 1000},${lat},${lon}););out center ${limit * 3};`
  )
  if (!elements.length) {
    return [
      `OpenStreetMap charging stations within ${radius} km of ${lat}, ${lon}`,
      "None is mapped here.",
      "OpenStreetMap coverage is patchy, so an empty result usually means the area is unmapped rather than that there is nowhere to charge. OCM's own registry may still have stations here.",
    ].join("\n")
  }

  const dist = (e: OcmOsmElement): number => {
    const la = e.lat ?? (e as unknown as { center?: { lat?: number } }).center?.lat
    const lo = e.lon ?? (e as unknown as { center?: { lon?: number } }).center?.lon
    if (la === undefined || lo === undefined) return Number.POSITIVE_INFINITY
    const dLat = ((la - lat) * 111.32) ** 2
    const dLon = ((lo - lon) * 111.32 * Math.cos((lat * Math.PI) / 180)) ** 2
    return Math.sqrt(dLat + dLon)
  }
  const rows = elements
    .map((e) => ({ e, tags: e.tags ?? {}, km: dist(e) }))
    .filter((r) => Number.isFinite(r.km))
    .sort((a, b) => a.km - b.km)
    .slice(0, limit)

  const withSockets = rows.filter((r) => ocmSockets(r.tags).length).length
  const operators = new Set(rows.map((r) => r.tags.operator ?? r.tags.brand).filter(Boolean))

  return [
    `OpenStreetMap charging stations within ${radius} km of ${lat}, ${lon}`,
    `Found ${elements.length} mapped station(s); showing the ${rows.length} closest. ${withSockets} of those ${rows.length} have connector types recorded, ${operators.size} distinct operator(s).`,
    "",
    ...rows.map((r, i) => {
      const t = r.tags
      const sockets = ocmSockets(t)
      const capacity = Number(t.capacity ?? "")
      return [
        `${i + 1}. ${t.name ?? t.brand ?? t.operator ?? "unnamed"}, ${r.km.toFixed(1)} km away`,
        `   sockets: ${sockets.length ? sockets.join(", ") : "not recorded in OSM"}`,
        `   power: ${ocmPowerClass(t)}${t.voltage ? `, ${t.voltage} V` : ""}`,
        `   ${Number.isFinite(capacity) && capacity > 0 ? `${capacity} bay(s) claimed` : "bay count not recorded"}`,
        `   operator: ${t.operator ?? "not recorded"}${t.fee ? `, fee: ${t.fee}` : ""}${t.access ? `, access: ${t.access}` : ""}`,
        `   ${t["authentication:app"] ? `app required, ` : ""}${t["authentication:membership_card"] ? "membership card, " : ""}${t["authentication:nfc"] ? "NFC card" : ""}`.replace(/,\s*$/, "").trim(),
        `   openstreetmap.org/${r.e.type === "way" ? "way" : "node"}/${r.e.id}`,
      ].join("\n")
    }),
    "",
    "This is OpenStreetMap, not the Open Charge Map registry, so a station can be present here and missing there or the reverse. OSM volunteers enter this data by hand, so treat an absent field as unknown rather than absent.",
  ].join("\n")
}

/** What charging coverage actually looks like in an area, aggregated over the mapped stations. */
export async function chargerCoverageGap(args: { lat?: number; lon?: number; radius_km?: number }): Promise<string> {
  const lat = ocmCoord(args.lat)
  const lon = ocmLong(args.lon)
  if (lat === null || lon === null) throw new OcmError("lat and lon are required, for example 51.5 and -0.12.")
  const radius = ocmBound(args.radius_km, 1, 50, 10)

  const elements = await ocmOverpass(
    `[out:json][timeout:40];(node["amenity"="charging_station"](around:${radius * 1000},${lat},${lon});way["amenity"="charging_station"](around:${radius * 1000},${lat},${lon}););out center 400;`
  )
  if (!elements.length) {
    return [
      `Charging coverage within ${radius} km of ${lat}, ${lon}`,
      "No charging station is mapped here in OpenStreetMap, so there is no coverage to summarise.",
      "Check the Open Charge Map registry for this area before concluding there is nowhere to charge.",
    ].join("\n")
  }

  const sockets = new Map<string, number>()
  const powerClasses = new Map<string, number>()
  const operators = new Map<string, number>()
  const extras = { bays: 0, baysRecorded: 0, authRequired: 0, feeStations: 0, surveyDated: 0 }
  let capacityKnown = 0

  for (const e of elements) {
    const t = e.tags ?? {}
    for (const s of ocmSockets(t)) sockets.set(s, (sockets.get(s) ?? 0) + 1)
    const pc = ocmPowerClass(t)
    powerClasses.set(pc, (powerClasses.get(pc) ?? 0) + 1)
    const op = t.operator ?? t.brand ?? "not recorded"
    operators.set(op, (operators.get(op) ?? 0) + 1)
    const cap = Number(t.capacity ?? "")
    if (Number.isFinite(cap) && cap > 0) {
      capacityKnown += 1
      extras.bays += Math.round(cap)
    }
    if (t["authentication:app"] || t["authentication:membership_card"] || t["authentication:nfc"]) extras.authRequired += 1
    if (t.fee && t.fee !== "no") extras.feeStations += 1
    if (t["survey:date"]) extras.surveyDated += 1
  }

  const fastCount = powerClasses.get("150 kW or more") ?? 0
  const ccs = sockets.get("ccs2") ?? 0
  const ranked = [...operators.entries()].sort((a, b) => b[1] - a[1])
  const topShare = ranked.length ? ranked[0][1] / elements.length : 0
  const countSockets = (names: string[]): number => names.reduce((s, n) => s + (sockets.get(n) ?? 0), 0)

  const gaps: string[] = []
  if (fastCount === 0) gaps.push("no station maps 150 kW or more, so a long-distance stop in this area cannot be a quick one")
  if (ccs === 0) gaps.push("no CCS connector is recorded at any mapped station, which rules out most European and North American cars")
  if (extras.baysRecorded === 0) gaps.push("not one station records a bay count, so queue length cannot be estimated from this data")
  if (extras.authRequired === elements.length && elements.length > 1) gaps.push("every station requires an app, card or NFC authentication, so a visitor without one cannot charge")
  if (topShare > 0.6 && ranked.length > 1) gaps.push(`one operator (${ranked[0][0]}) runs ${(topShare * 100).toFixed(0)}% of the mapped stations, so a single outage removes most of the area's capacity`)

  return [
    `Charging coverage within ${radius} km of ${lat}, ${lon}, aggregated from OpenStreetMap`,
    `Mapped stations: ${elements.length}${capacityKnown ? `, ${capacityKnown} of them claim ${extras.bays} bays in total` : ", none claim a bay count"}`,
    `Requiring an app, card or NFC: ${extras.authRequired}; recording a fee: ${extras.feeStations}; carrying a survey date: ${extras.surveyDated}`,
    "",
    "Connectors recorded (station count, a station can have several):",
    ...[...sockets.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${String(v).padStart(4)}  ${k}`),
    "",
    "Power class recorded:",
    ...[...powerClasses.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${String(v).padStart(4)}  ${k}`),
    "",
    `Operators: ${ranked.length}${ranked.length ? `, largest holds ${(topShare * 100).toFixed(0)}%` : ""}`,
    ...ranked.slice(0, 8).map(([k, v]) => `  ${String(v).padStart(4)}  ${k.slice(0, 60)}`),
    "",
    `AC connectors across all types: ${countSockets(["type2", "type2_cached", "type3"])}; DC fast connectors: ${countSockets(["ccs2", "chademo", "tesla_s", "tesla_r"])}`,
    "",
    gaps.length ? "What this area is missing:" : "No obvious gap found in what OpenStreetMap records here.",
    ...gaps.map((g) => `  - ${g}`),
    "",
    "A gap here is a gap in the map as much as in the world: un-surveyed stations show up as missing capacity, so cross-check the Open Charge Map registry before planning around a blank.",
  ].join("\n")
}

/** Charge time arithmetic for a real battery, with the taper modelled rather than hidden. */
export async function chargeTimeEstimate(args: { battery_kwh?: number; power_kw?: number; from_pct?: number; to_pct?: number; efficiency_pct?: number; dc?: boolean }): Promise<string> {
  const capacity = Number(args?.battery_kwh)
  if (!Number.isFinite(capacity) || capacity <= 0) throw new OcmError("battery_kwh must be a positive number, for example 75.")
  const power = Number(args?.power_kw)
  if (!Number.isFinite(power) || power <= 0) throw new OcmError("power_kw must be a positive number, for example 150.")
  const from = Math.max(0, Math.min(100, Number(args?.from_pct ?? 10)))
  const to = Math.max(0, Math.min(100, Number(args?.to_pct ?? 80)))
  if (to <= from) throw new OcmError("to_pct must be greater than from_pct.")
  const efficiency = Math.max(50, Math.min(100, Number(args?.efficiency_pct ?? 90)))
  const isDc = args?.dc ?? true

  const energyIn = (capacity * (to - from)) / 100
  const ceilingMin = (energyIn * 60) / power
  const nominalRate = (capacity * (to - from)) / 100 / power

  // A DC curve tapers as the cell approaches full: full power to ~40%, then a
  // linear fall to a 20% rate at 100%. An AC charge holds power far better.
  const segments: { from: number; to: number; factor: number; note: string }[] = []
  if (isDc) {
    segments.push({ from: from, to: Math.min(to, 40), factor: 1, note: "full power while the pack is under about 40%" })
    segments.push({ from: Math.max(from, 40), to: Math.min(to, 80), factor: 0.75, note: "roughly three quarters power through the middle of the pack" })
    segments.push({ from: Math.max(from, 80), to: to, factor: 0.35, note: "heavy taper near full, which is what dominates the last 20%" })
  } else {
    segments.push({ from, to, factor: isDc ? 0.8 : 0.95, note: "on-board charger, near-constant power with a mild taper at the top" })
  }

  const active = segments.filter((s) => s.to > s.from)
  let minutes = 0
  const lines: string[] = []
  for (const s of active) {
    const span = ((capacity * (s.to - s.from)) / 100 / power) * 60 / s.factor
    minutes += span
    lines.push(`  ${s.from.toFixed(0)}% to ${s.to.toFixed(0)}%: ${(span / 60).toFixed(2)} h (${s.note})`)
  }
  const hours = minutes / 60
  const efficiencyPenalty = 1 / (efficiency / 100)
  const realistic = hours * (isDc ? 1 : efficiencyPenalty)

  return [
    `Charge time estimate, computed locally`,
    `Battery ${capacity} kWh usable, ${from.toFixed(0)}% to ${to.toFixed(0)}%, charger rated ${power} kW, ${isDc ? "DC" : "AC"} connection, ${efficiency}% efficiency`,
    `Energy to move into the pack: ${energyIn.toFixed(1)} kWh`,
    `If power stayed flat the whole time: ${(ceilingMin / 60).toFixed(2)} h, which is a number no driver ever sees`,
    "",
    "With a modelled taper:",
    ...lines,
    `  total: ${hours.toFixed(2)} h`,
    "",
    isDc
      ? `Read that as roughly ${Math.round(hours * 10) / 10} h, plus ${Math.round((realistic - hours) * 10) / 10} h if charging losses are billed to the wall clock.`
      : `On AC the on-board charger is the limit, not the post: ${Math.round(realistic * 10) / 10} h including ${efficiency}% losses.`,
    "",
    "The taper factors are an explicit assumption, not a measurement: cells, chargers, temperature and the car's own curve all differ. Treat the total as the right order of magnitude, and the segment split as where the time actually goes.",
  ].join("\n")
}
