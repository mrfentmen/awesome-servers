const TAP = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"
const TABLE = "pscomppars"

export class ExoplanetError extends Error {}

function safe(term: string, label: string): string {
  const t = term.trim()
  if (!/^[A-Za-z0-9 .+\-_()/]+$/.test(t)) {
    throw new ExoplanetError(`${label} may only contain letters, digits, spaces and . + - _ ( ) /`)
  }
  return t.replace(/'/g, "''")
}

async function tap(query: string, timeoutMs = 45000): Promise<any[]> {
  const url = `${TAP}?query=${encodeURIComponent(query)}&format=json`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "exoplanet-mcp" } })
    const body = await res.text()
    if (!res.ok) {
      const msg = /<INFO name="QUERY_STATUS" value="ERROR">\s*([^<]+)/.exec(body)
      throw new ExoplanetError(msg ? msg[1].trim() : `Exoplanet Archive responded ${res.status}`)
    }
    const parsed = JSON.parse(body)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    if (e instanceof ExoplanetError) throw e
    if ((e as Error).name === "AbortError") throw new ExoplanetError("Exoplanet Archive query timed out")
    if (e instanceof SyntaxError) throw new ExoplanetError("Exoplanet Archive returned a non-JSON response")
    throw new ExoplanetError(`Exoplanet Archive query failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function f(v: unknown, unit = "", digits = 2): string {
  const n = typeof v === "number" ? v : Number(v)
  if (!Number.isFinite(n)) return "unknown"
  return `${n.toFixed(digits).replace(/\.0+$/, "")}${unit}`
}

function planetLine(p: any, i?: number): string {
  const prefix = typeof i === "number" ? `${i + 1}. ` : ""
  return `${prefix}${p.pl_name} — ${p.hostname ?? "unknown host"}, discovered ${p.disc_year ?? "?"}${p.discoverymethod ? ` via ${p.discoverymethod}` : ""}`
}

const COLS =
  "pl_name,hostname,disc_year,discoverymethod,pl_orbper,pl_rade,pl_bmasse,pl_eqt,st_teff,st_rad,sy_dist,pl_orbsmax"

export async function searchPlanets(fragment: string, limit: number): Promise<string> {
  const term = safe(fragment, "Search term").toUpperCase()
  const rows = await tap(
    `select top ${limit} ${COLS} from ${TABLE} where upper(pl_name) like '%${term}%' or upper(hostname) like '%${term}%' order by disc_year desc`
  )
  if (rows.length === 0) return `No planets matched "${fragment}".`
  return `Planets matching "${fragment}" (${rows.length} shown):\n\n${rows.map((p, i) => `${planetLine(p, i)}\n   radius ${f(p.pl_rade, " R⊕")}, mass ${f(p.pl_bmasse, " M⊕")}, period ${f(p.pl_orbper, " d")}, eq. temp ${f(p.pl_eqt, " K", 0)}`).join("\n")}`
}

export async function planetDetail(plName: string): Promise<string> {
  const name = safe(plName, "Planet name")
  const rows = await tap(`select ${COLS} from ${TABLE} where pl_name = '${name}'`)
  if (rows.length === 0) {
    throw new ExoplanetError(`No planet named "${plName}" — use search_planets to find the exact name`)
  }
  const p = rows[0]
  return [
    `Planet: ${p.pl_name}`,
    `Host star: ${p.hostname ?? "unknown"}   Distance: ${f(p.sy_dist, " pc")}`,
    `Discovered: ${p.disc_year ?? "?"} via ${p.discoverymethod ?? "unknown method"}`,
    `Orbital period: ${f(p.pl_orbper, " days")}   Semi-major axis: ${f(p.pl_orbsmax, " AU")}`,
    `Radius: ${f(p.pl_rade, " Earth radii")}   Mass: ${f(p.pl_bmasse, " Earth masses")}`,
    `Equilibrium temperature: ${f(p.pl_eqt, " K", 0)}`,
    `Star: ${f(p.st_teff, " K", 0)} effective temp, ${f(p.st_rad, " R☉")} radius`,
  ].join("\n")
}

export async function systemPlanets(hostname: string): Promise<string> {
  const star = safe(hostname, "Host star name")
  const rows = await tap(`select ${COLS} from ${TABLE} where hostname = '${star}' order by pl_orbsmax`)
  if (rows.length === 0) {
    throw new ExoplanetError(`No system named "${hostname}" — try search_planets first`)
  }
  const lines = rows.map(
    (p, i) =>
      `${i + 1}. ${p.pl_name} — period ${f(p.pl_orbper, " d")}, radius ${f(p.pl_rade, " R⊕")}, mass ${f(p.pl_bmasse, " M⊕")}, eq. temp ${f(p.pl_eqt, " K", 0)}`
  )
  const p0 = rows[0]
  return [
    `System: ${star}`,
    `Distance: ${f(p0.sy_dist, " pc")}   Star temp: ${f(p0.st_teff, " K", 0)}   Star radius: ${f(p0.st_rad, " R☉")}`,
    `Confirmed planets: ${rows.length}`,
    "",
    ...lines,
  ].join("\n")
}

export async function recentDiscoveries(fromYear: number, limit: number): Promise<string> {
  const rows = await tap(
    `select top ${limit} ${COLS} from ${TABLE} where disc_year >= ${Math.trunc(fromYear)} order by disc_year desc, pl_name`
  )
  if (rows.length === 0) return `No planets confirmed since ${fromYear}.`
  return `Planets confirmed since ${fromYear} (${rows.length} shown):\n\n${rows
    .map((p, i) => `${planetLine(p, i)}\n   radius ${f(p.pl_rade, " R⊕")}, period ${f(p.pl_orbper, " d")}`)
    .join("\n")}`
}

export async function habitableCandidates(limit: number): Promise<string> {
  const rows = await tap(
    `select top ${limit} ${COLS} from ${TABLE} where pl_eqt between 180 and 310 and pl_rade <= 1.8 order by pl_eqt desc`
  )
  if (rows.length === 0) return "No planets matched the temperate, small-radius filter."
  return `Temperate small-radius candidates (eq. temp 180-310 K, radius <= 1.8 R⊕):\n\n${rows
    .map((p, i) => `${planetLine(p, i)}\n   eq. temp ${f(p.pl_eqt, " K", 0)}, radius ${f(p.pl_rade, " R⊕")}, period ${f(p.pl_orbper, " d")}`)
    .join("\n")}`
}

export async function discoveryStats(fromYear: number): Promise<string> {
  const rows = await tap(
    `select disc_year, count(*) as n from ${TABLE} where disc_year >= ${Math.trunc(fromYear)} group by disc_year order by disc_year`
  )
  const total = await tap(`select count(*) as n from ${TABLE}`)
  if (rows.length === 0) return `No discoveries recorded since ${fromYear}.`
  const lines = rows.map((r) => `   ${r.disc_year}: ${r.n}`)
  const sum = rows.reduce((a, r) => a + Number(r.n ?? 0), 0)
  return [
    `Confirmed planets per discovery year (from ${fromYear}):`,
    ...lines,
    "",
    `Since ${fromYear}: ${sum}   Total in archive: ${total[0]?.n ?? "?"}`,
  ].join("\n")
}
