const BASE = "https://api.citybik.es/v2"
const UA = "mrfentmen-citybikes-mcp/1.0 (https://github.com/mrfentmen)"
export class CitybikesError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new CitybikesError(`CityBikes returned HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function networks(_args?: unknown): Promise<string> {
  const d = await get<any>(`${BASE}/networks`)
  const nets = (d?.networks ?? []) as any[]
  if (!nets.length) return "No networks found"
  const lines = nets.map((n, i) => {
    const loc = n?.location ?? {}
    return `${i + 1}. ${n?.name ?? "n/a"} (${n?.id ?? "n/a"}) | ${loc?.city ?? ""}, ${loc?.country ?? ""}`
  })
  return `Bike share networks (${nets.length} total, showing first 50):\n` + lines.slice(0, 50).join("\n")
}

export async function network(args: { id?: string }): Promise<string> {
  const id = (args.id ?? "").trim()
  if (!id) throw new CitybikesError("Provide a network ID like bixi-montreal")
  const d = await get<any>(`${BASE}/networks/${encodeURIComponent(id)}`)
  const n = d?.network
  if (!n) throw new CitybikesError(`Network not found: ${id}`)
  const stations = (n?.stations ?? []) as any[]
  if (!stations.length) return `${n?.name ?? id}: network found but no stations reported`
  const total = stations.length
  const withBikes = stations.filter((s) => (s?.free_bikes ?? 0) > 0).length
  const lines = [
    `${n?.name ?? id} | ${n?.location?.city ?? ""}, ${n?.location?.country ?? ""}`,
    `${total} stations, ${withBikes} with bikes available`,
    "",
    ...stations.slice(0, 20).map((s, i) => {
      const bikes = s?.free_bikes ?? 0
      const slots = s?.empty_slots ?? 0
      return `${i + 1}. ${s?.name ?? "n/a"} | bikes ${bikes} | slots ${slots}`
    }),
  ]
  if (total > 20) lines.push(`... and ${total - 20} more stations`)
  return lines.join("\n")
}

// ---- muxA tools:

const BIKES = "https://api.citybik.es/v2";

async function cbGet(path: string): Promise<any> {
  const res = await fetch(`${BIKES}${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new CitybikesError(`CityBikes returned HTTP ${res.status}`);
  return (await res.json()) as any;
}

function place(n: Record<string, any>): string {
  const l = (n.location ?? {}) as Record<string, any>;
  return [l.city, l.state, l.country].filter(Boolean).join(", ") || "location not reported";
}

export interface NetworkSearchArgs {
  query?: string;
  country?: string;
  limit?: number;
  summary?: boolean;
}

export interface StationSearchArgs {
  network: string;
  query?: string;
  has_bikes?: boolean;
  has_slots?: boolean;
  limit?: number;
}

export interface CapacityArgs {
  network: string;
}

export async function networkCapacity(args: CapacityArgs): Promise<string> {
  const id = (args.network ?? "").trim();
  if (!id) throw new CitybikesError("Provide a network id, e.g. joco-new-york.");
  const d = await cbGet(`/networks/${encodeURIComponent(id)}`);
  const n = d?.network as Record<string, any> | undefined;
  if (!n) return `CityBikes has no network with id "${id}". Try network_search to list valid ids.`;
  const stations = (n.stations ?? []) as Array<Record<string, any>>;
  if (!stations.length) return `${n.name ?? id} reports no stations, so no capacity can be computed.`;
  const free = stations.reduce((a, s) => a + (Number(s.free_bikes) || 0), 0);
  const slots = stations.reduce((a, s) => a + (Number(s.empty_slots) || 0), 0);
  const withBikes = stations.filter((s) => Number(s.free_bikes ?? 0) > 0).length;
  const full = stations.filter((s) => Number(s.empty_slots ?? 0) === 0).length;
  const empty = stations.filter((s) => Number(s.free_bikes ?? 0) === 0).length;
  const ebikes = stations.reduce((a, s) => a + (Number(s.extra?.ebikes) || 0), 0);
  const ebikeStations = stations.filter((s) => Number(s.extra?.ebikes ?? 0) > 0).length;
  const total = free + slots;
  const mean = total / stations.length;
  const sd = Math.sqrt(stations.reduce((a, s) => a + (Number(s.free_bikes ?? 0) - mean) ** 2, 0) / stations.length);
  return [
    `${n.name ?? id} | ${place(n)}`,
    `${stations.length} stations | ${free.toLocaleString("en-US")} bikes free | ${slots.toLocaleString("en-US")} empty slots | ${total.toLocaleString("en-US")} total capacity`,
    `Stations with at least one bike: ${withBikes} of ${stations.length} (${((withBikes / stations.length) * 100).toFixed(1)}%)`,
    `Completely full stations: ${full} | completely empty stations: ${empty}`,
    ebikes || ebikeStations ? `E-bikes: ${ebikes} available across ${ebikeStations} station(s)` : "No e-bike data reported",
    `Bikes per station: mean ${mean.toFixed(2)}, standard deviation ${sd.toFixed(2)}` +
      (mean ? `, coefficient of variation ${((sd / mean) * 100).toFixed(1)}%` : ""),
    `Operator: ${n.company ?? "not reported"}${n.ebikes != null ? ` | network level e-bikes ${n.ebikes}` : ""}`,
  ].join("\n");
}
