/**
 * Kiwi.com Tequila API client. Needs KIWI_API_KEY
 * (free at https://tequila.kiwi.com/portal).
 * Docs: https://tequila.kiwi.com/portal/docs/tequila_api
 */
const BASE = "https://api.tequila.kiwi.com"

export class KiwiError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.KIWI_API_KEY
  if (!key) throw new KiwiError("Set KIWI_API_KEY first (free at tequila.kiwi.com/portal).")
  return { "User-Agent": "kiwi-mcp/1.0", Accept: "application/json", apikey: key }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 401 || res.status === 403) throw new KiwiError("Kiwi refused (401/403). Check API key.")
  if (res.status === 422) throw new KiwiError("Kiwi: bad request (check airport codes and dates).")
  if (!res.ok) throw new KiwiError(`Kiwi error ${res.status}`)
  return (await res.json()) as T
}

export async function findLocations(query: string, limit = 5): Promise<string[]> {
  if (!query.trim()) throw new KiwiError("Query is empty.")
  const data = await getJson<Raw>(`/locations/query?term=${encodeURIComponent(query.trim())}&locale=en-US&location_types=airport&limit=${Math.min(Math.max(limit, 1), 50)}&active_only=true`)
  const rows: Raw[] = Array.isArray(data.locations) ? data.locations : []
  return rows.slice(0, limit).map((l) => `[${String(l.code ?? "?")}] ${String(l.name ?? "?")} (${String(l.city?.name ?? l.city?.country?.name ?? "?")})`)
}

export interface Flight {
  price?: number
  currency?: string
  from?: string
  to?: string
  departure?: string
  arrival?: string
  duration?: string
  airlines: string[]
  link?: string
}

export async function searchFlights(from: string, to: string, dateFrom: string, dateTo: string, limit = 5): Promise<Flight[]> {
  for (const [label, v] of [["from", from], ["to", to], ["date_from", dateFrom], ["date_to", dateTo]] as const) {
    if (!v.trim()) throw new KiwiError(`${label} is empty.`)
  }
  const qs = new URLSearchParams({
    fly_from: from.trim().toUpperCase(),
    fly_to: to.trim().toUpperCase(),
    date_from: dateFrom.trim(),
    date_to: dateTo.trim(),
    curr: "USD",
    limit: String(Math.min(Math.max(limit, 1), 50)),
    sort: "price",
  }).toString()
  const data = await getJson<Raw>(`/v2/search?${qs}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((f) => {
    const secs = Number(f.duration?.total ?? 0)
    return {
      price: f.price,
      currency: "USD",
      from: `${f.cityFrom ?? "?"} (${f.flyFrom ?? "?"})`,
      to: `${f.cityTo ?? "?"} (${f.flyTo ?? "?"})`,
      departure: f.local_departure ? String(f.local_departure).slice(0, 16).replace("T", " ") : undefined,
      arrival: f.local_arrival ? String(f.local_arrival).slice(0, 16).replace("T", " ") : undefined,
      duration: secs ? `${Math.floor(secs / 3600)}h${Math.round((secs % 3600) / 60)}m` : undefined,
      airlines: Array.isArray(f.airlines) ? f.airlines.map(String) : [],
      link: f.deep_link,
    }
  })
}

export function formatFlight(f: Flight, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}${f.from ?? "?"} → ${f.to ?? "?"}${f.price !== undefined ? ` — $${f.price}` : ""}`,
    [f.departure ? `dep ${f.departure}` : "", f.arrival ? `arr ${f.arrival}` : "", f.duration ?? ""].filter(Boolean).join(" · "),
    f.airlines.length ? `Airlines: ${f.airlines.join(", ")}` : "",
    f.link ? `${f.link}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxG tools:
const OURAIRPORTS = "https://davidmegginson.github.io/ourairports-data/airports.csv"
const OPENFLIGHTS_ROUTES = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat"
const OPENFLIGHTS_AIRLINES = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat"

// The CSVs are a few MB and every worker holds one at a time, so cache them briefly.
let airportTable: Map<string, string[]> | null = null;
let routeTable: string[][] | null = null;
let airlineTable: Map<string, string> | null = null;

const CSV_TTL_MS = 10 * 60 * 1000;
let airportAt = 0;
let routeAt = 0;
let airlineAt = 0;

async function kiwiText(url: string, max = 8_000_000): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "mrfentmen-kiwi-mcp/1.0", Accept: "text/csv, text/plain" }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error("Upstream returned an empty body.");
  return text.length > max ? text.slice(0, max) : text;
}

const splitCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else quoted = false;
      } else current += char;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === ",") { out.push(current); current = ""; continue; }
    current += char;
  }
  out.push(current);
  return out;
};

async function airports(): Promise<Map<string, string[]>> {
  if (airportTable && Date.now() - airportAt < CSV_TTL_MS) return airportTable;
  const text = await kiwiText(OURAIRPORTS);
  const lines = text.split("\n").filter((line) => line.trim());
  const header = splitCsvLine(lines[0]);
  const index = (name: string): number => header.indexOf(name);
  const table = new Map<string, string[]>();
  for (const line of lines.slice(1)) {
    const row = splitCsvLine(line);
    const iata = row[index("iata_code")] ?? "";
    const icao = row[index("icao_code")] ?? "";
    const ident = row[index("ident")] ?? "";
    if (iata.trim()) table.set(iata.trim().toUpperCase(), row);
    if (icao.trim()) table.set(icao.trim().toUpperCase(), row);
    if (ident.trim()) table.set(ident.trim().toUpperCase(), row);
  }
  airportTable = table;
  airportAt = Date.now();
  return table;
}

async function routes(): Promise<string[][]> {
  if (routeTable && Date.now() - routeAt < CSV_TTL_MS) return routeTable;
  const text = await kiwiText(OPENFLIGHTS_ROUTES);
  const rows = text.split("\n").filter((line) => line.trim()).map((line) => line.split(","));
  routeTable = rows;
  routeAt = Date.now();
  return rows;
}

async function airlines(): Promise<Map<string, string>> {
  if (airlineTable && Date.now() - airlineAt < CSV_TTL_MS) return airlineTable;
  const text = await kiwiText(OPENFLIGHTS_AIRLINES);
  // airlines.dat mixes the 2 letter code, the 3 letter code and \N across the
  // three code columns depending on the airline, so index whichever are real
  const table = new Map<string, string>();
  for (const line of text.split("\n").filter((row) => row.trim())) {
    const fields = splitCsvLine(line);
    const name = (fields[1] ?? "").trim();
    if (!name) continue;
    for (let i = 2; i <= 4; i += 1) {
      const code = (fields[i] ?? "").trim();
      if (code.length === 2 || code.length === 3) {
        if (code === "-1" || code === "-") continue;
        if (!table.has(code)) table.set(code, name);
      }
    }
  }
  airlineTable = table;
  airlineAt = Date.now();
  return table;
}

const airportLine = (row: string[], code: string): string => {
  const at = (name: string, fallback = "not reported"): string => {
    const value = row[airportColumns.indexOf(name)];
    return value && value.trim() ? value.trim() : fallback;
  };
  return [
    `${at("name")} (${at("iata_code", "?")} / ${at("icao_code", "?")})`,
    `${at("municipality")}, ${at("iso_country")} · ${at("type")} · ${at("scheduled_service") === "yes" ? "scheduled service" : "no scheduled service reported"}`,
    `${at("latitude_deg")}, ${at("longitude_deg")} · elevation ${at("elevation_ft")} ft${at("iso_region") ? ` · region ${at("iso_region")}` : ""}`,
  ].join("\n");
};

// set once airports() has run, so the field order is known without re-parsing headers
let airportColumns: string[] = [];
if (!airportColumns.length) {
  airportColumns = [
    "id", "ident", "type", "name", "latitude_deg", "longitude_deg", "elevation_ft",
    "continent", "iso_country", "iso_region", "municipality", "scheduled_service",
    "icao_code", "iata_code", "gps_code", "local_code", "home_link", "wikipedia_link", "keywords",
  ];
}

/** Airports and city names from the OurAirports data set, which needs no key and never rate limits. */
export async function airportLookup(args: { code?: string; city?: string; limit?: number }): Promise<string> {
  const code = String(args?.code ?? "").trim().toUpperCase();
  const city = String(args?.city ?? "").trim().toLowerCase();
  if (!code && !city) throw new Error("Provide a three letter airport code, a city name, or both.");
  const n = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 25);
  const table = await airports();
  await airports();

  const hits: Array<{ code: string; row: string[] }> = [];
  if (code) {
    const row = table.get(code);
    if (row) hits.push({ code, row });
    else {
      // ICAO and IATA are not the only keys; try the ident and the plain code
      for (const [key, value] of table) {
        if (key.startsWith(code) && hits.length < n) hits.push({ code: key, row: value });
      }
    }
  }
  if (!hits.length && city) {
    for (const [key, row] of table) {
      const index = airportColumns.indexOf("municipality");
      const name = (row[index] ?? "").toLowerCase();
      if (name.includes(city) && hits.length < n) hits.push({ code: key, row });
    }
  }
  if (!hits.length) {
    return `The OurAirports data set has no match for ${code ? `"${code}"` : ""}${code && city ? " " : ""}${city ? `city "${city}"` : ""}.`;
  }

  const lines = [`OurAirports matches (${hits.length}):`];
  for (const [i, hit] of hits.slice(0, n).entries()) {
    lines.push(`  ${i + 1}. ${airportLine(hit.row, hit.code)}`);
  }
  return lines.join("\n");
}

/** Does anybody fly this route, and who: the OpenFlights route network, which is a different question from a fare search. */
export async function routeNetwork(args: { from: string; to: string; limit?: number }): Promise<string> {
  const from = String(args?.from ?? "").trim().toUpperCase();
  const to = String(args?.to ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3,4}$/.test(from) || !/^[A-Z]{3,4}$/.test(to)) {
    throw new Error("Use three or four letter airport codes, for example LHR and JFK.");
  }
  const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
  const table = await routes();
  const matches = table.filter((row) => {
    const source = String(row[2] ?? "").toUpperCase();
    const target = String(row[4] ?? "").toUpperCase();
    return (source === from && target === to) || (source === to && target === from);
  });
  if (!matches.length) {
    return `The OpenFlights data set lists no scheduled route between ${from} and ${to}. That data set is a snapshot and only covers the routes OpenFlights observed.`;
  }
  const airline = await airlines();
  const lines = [
    `OpenFlights lists ${matches.length} route(s) between ${from} and ${to}`,
    "Columns are airline code, airline id, source, source id, destination, destination id, codeshare flag, stop sequence, equipment.",
    "",
  ];
  for (const [i, row] of matches.slice(0, n).entries()) {
    const code = String(row[0] ?? "").toUpperCase();
    const name = airline.get(code) ?? "airline name not reported";
    const direction = String(row[2] ?? "").toUpperCase() === from ? `${from} to ${to}` : `${to} to ${from}`;
    lines.push(`  ${i + 1}. ${name} (${code || "code not reported"}) ${direction} · codeshare ${row[6] === "Y" ? "yes" : "no"} · stops ${row[7] ?? "0"} · equipment ${row[8] ?? "not reported"}`);
  }
  if (matches.length > n) lines.push(`  ...and ${matches.length - n} more route record(s).`);
  return lines.join("\n");
}
