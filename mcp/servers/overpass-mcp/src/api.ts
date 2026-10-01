const BASE = "https://overpass-api.de/api/interpreter"
const UA = "mrfentmen-overpass-mcp/1.0 (https://github.com/mrfentmen)"
export class OverpassError extends Error {}

export async function nodesInBox(args: { min_lat?: number; min_lon?: number; max_lat?: number; max_lon?: number; amenity?: string; limit?: number }): Promise<string> {
  const minLat = args.min_lat
  const minLon = args.min_lon
  const maxLat = args.max_lat
  const maxLon = args.max_lon
  if ([minLat, minLon, maxLat, maxLon].some((v) => v === undefined)) {
    throw new OverpassError("Provide a bounding box with min and max latitude and longitude")
  }
  if (minLat! > maxLat! || minLon! > maxLon!) throw new OverpassError("Min values must be less than max values")
  const amenity = (args.amenity ?? "cafe").trim().toLowerCase()
  if (!/^[a-z_]+$/.test(amenity)) throw new OverpassError("Amenity must be a simple type like cafe or school")
  const limit = Math.min(args.limit ?? 20, 50)
  const query = `[out:json][timeout:15];node(${minLat},${minLon},${maxLat},${maxLon})[amenity=${amenity}];out body ${limit};`
  let d: any = null
  let lastErr: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${BASE}?data=${encodeURIComponent(query)}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
    if (res.status === 429 || res.status === 504) {
      lastErr = new OverpassError("Overpass is busy, wait and retry")
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)))
      continue
    }
    if (!res.ok) throw new OverpassError(`Overpass error ${res.status}`)
    d = (await res.json()) as any
    break
  }
  if (!d) throw lastErr ?? new OverpassError("Overpass request failed")
  const elements = d?.elements ?? []
  if (!elements.length) return `No ${amenity} found in that area`
  const names = elements.map((e: any, i: number) => {
    const name = e?.tags?.name ?? `unnamed ${amenity}`
    return `${i + 1}. ${name} (${e?.lat?.toFixed(4) ?? "?"}, ${e?.lon?.toFixed(4) ?? "?"})`
  })
  return `Found ${elements.length} ${amenity}(s):\n${names.join("\n")}`
}

// ---- muxE tools:
// The one existing tool is narrow in two ways that matter. It only ever queries
// node, so a park, a building or a road is invisible to it however well tagged
// it is, and it only ever filters on amenity, so the rest of the OpenStreetMap
// tag vocabulary, highway, railway, leisure, natural, shop, historic, is out of
// reach. These three open both, using the same public Overpass endpoint that was
// already verified, and every bounding box and limit is bounded before a
// request goes out.
const OVERPASS = 'https://overpass-api.de/api/interpreter';

interface OverpassElement {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
}

interface Box {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

function readBox(args: { min_lat?: number; min_lon?: number; max_lat?: number; max_lon?: number } | undefined): Box {
  const minLat = args?.min_lat;
  const minLon = args?.min_lon;
  const maxLat = args?.max_lat;
  const maxLon = args?.max_lon;
  if ([minLat, minLon, maxLat, maxLon].some((v) => v === undefined)) {
    throw new OverpassError('Provide a bounding box with min and max latitude and longitude');
  }
  for (const v of [minLat, minLon, maxLat, maxLon]) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < -90 || v > 90 || v < -180 || v > 180) {
      throw new OverpassError('Latitude must be between -90 and 90 and longitude between -180 and 180');
    }
  }
  if (minLat! > maxLat! || minLon! > maxLon!) throw new OverpassError('Min values must be less than max values');
  return { minLat: minLat!, minLon: minLon!, maxLat: maxLat!, maxLon: maxLon! };
}

// Overpass treats a bare value as a regex, so anything that is not a plain
// token is refused here rather than silently matching more than intended.
const SAFE_VALUE = /^[A-Za-z0-9_][A-Za-z0-9_.\- ]*$/;

function readTag(key: string | undefined, value: string | undefined): { key: string; value: string } {
  const k = (key ?? '').trim();
  const v = (value ?? '').trim();
  if (!k) throw new OverpassError('Provide a tag key, for example highway or railway');
  if (!v) throw new OverpassError('Provide a tag value, for example primary or station');
  if (!/^[A-Za-z0-9_:]+$/.test(k)) {
    throw new OverpassError(`Tag key "${k}" is not a simple OSM key. Use letters, digits, underscore and colon, such as highway or name:en.`);
  }
  if (!SAFE_VALUE.test(v)) {
    throw new OverpassError(`Tag value "${v}" is not a simple value. Overpass reads a bare value as a regular expression, so only letters, digits, dot, dash, underscore and spaces are accepted here.`);
  }
  return { key: k, value: v };
}

async function run(query: string, timeoutSeconds: number): Promise<OverpassElement[]> {
  let data: unknown = null;
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${OVERPASS}?data=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: AbortSignal.timeout((timeoutSeconds + 10) * 1000),
    });
    if (res.status === 429 || res.status === 504) {
      lastErr = new OverpassError('Overpass is busy, wait and retry');
      await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new OverpassError(`Overpass error ${res.status}`);
    data = (await res.json()) as { elements?: OverpassElement[] };
    break;
  }
  if (!data) throw lastErr ?? new OverpassError('Overpass request failed');
  const elements = (data as { elements?: OverpassElement[] }).elements;
  return Array.isArray(elements) ? elements : [];
}

const tag = (e: OverpassElement, k: string): string | null => {
  const v = e.tags?.[k];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
};

function pointOf(e: OverpassElement): { lat: number; lon: number } | null {
  if (typeof e.lat === 'number' && typeof e.lon === 'number') return { lat: e.lat, lon: e.lon };
  if (typeof e.center?.lat === 'number' && typeof e.center?.lon === 'number') return { lat: e.center.lat, lon: e.center.lon };
  return null;
}

const label = (v: unknown, max = 60): string => {
  if (typeof v !== 'string' || !v.trim()) return 'not reported';
  const t = v.trim();
  return t.length > max ? `${t.slice(0, max)}...` : t;
};

const coord = (p: { lat: number; lon: number }): string => `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`;

export interface MapFeaturesArgs {
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
  tagKey: string;
  tagValue: string;
  elementType?: string;
  limit?: number;
}

export interface NamedPlacesArgs {
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
  limit?: number;
}

export interface TagCensusArgs {
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
  limit?: number;
}

export async function tag_census(args: TagCensusArgs): Promise<string> {
  const box = readBox(args);
  const limit = Math.max(10, Math.min(100, Math.floor(Number(args?.limit ?? 50) || 50)));
  const query = [
    '[out:json][timeout:60];(',
    `node(${box.minLat},${box.minLon},${box.maxLat},${box.maxLon});`,
    `way(${box.minLat},${box.minLon},${box.maxLat},${box.maxLon});`,
    ');out tags;',
  ].join('');
  const elements = await run(query, 60);
  if (!elements.length) return `That box returned no nodes or ways at all, so there is nothing to take a census of.`;
  const keyCount = new Map<string, number>();
  const valueCount = new Map<string, Map<string, number>>();
  let untagged = 0;
  for (const e of elements) {
    const tags = e.tags ?? {};
    const keys = Object.keys(tags);
    if (!keys.length) { untagged += 1; continue; }
    for (const k of keys) {
      keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
      const v = tags[k];
      valueCount.set(k, new Map([...(valueCount.get(k) ?? []), [v, ((valueCount.get(k) ?? new Map()).get(v) ?? 0) + 1]]));
    }
  }
  const ranked = [...keyCount.entries()].sort((a, b) => b[1] - a[1]);
  const withTags = elements.length - untagged;
  const lines = [
    `What is in that box, as a census of the OpenStreetMap tags on ${elements.length} node and way elements:`,
    `  ${withTags} carry at least one tag and ${untagged} carry none (${((untagged / elements.length) * 100).toFixed(0)}% untagged).`,
    `  ${keyCount.size} distinct tag keys in use.`,
    ``,
    `  ${"key".padEnd(24)}${"count".padEnd(8)}most common values`,
  ];
  for (const [k, n] of ranked.slice(0, limit)) {
    const values = [...(valueCount.get(k) ?? new Map()).entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    lines.push(`  ${k.slice(0, 23).padEnd(24)}${String(n).padEnd(8)}${values.map(([v, c]) => `${v} (${c})`).join(', ').slice(0, 60)}`);
  }
  if (ranked.length > limit) lines.push(`  and ${ranked.length - limit} further tag key(s) not listed.`);
  const named = elements.filter((e) => tag(e, 'name')).length;
  const nameKeys = keyCount.get('name') ?? 0;
  lines.push('');
  lines.push(`  name coverage: ${named} elements (${((named / elements.length) * 100).toFixed(1)}%) carry a name, under ${nameKeys} key entries, so a name on a multi-tag element is counted once.`);
  if (nameKeys > named) {
    lines.push(`  there are ${nameKeys - named} more name entries than elements with a name, which happens where an element carries name:en, name:de and a bare name together; the bare name is what was counted.`);
  }
  const top = ranked[0];
  if (top) lines.push(`  the single most common key is ${top[0]} on ${top[1]} of ${elements.length} elements, which is a useful hint about what dominates this stretch of map.`);
  if (untagged > elements.length / 2) lines.push(`  most of this box is untagged, so a census understates it: a feature nobody has mapped carries no tags to count.`);
  lines.push('');
  lines.push("  The existing tool answers a single amenity question and nothing about the area as a whole.");
  return lines.join('\n');
}

// ---- gap3b tools:

// Great-circle distance in km, for ordering a radius search by how near each
// feature is. Only ever called on coordinates the API returned, so haversine is
// accurate enough at these distances that no dependency is worth pulling in.
function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface ElementArgs {
  element_type?: string;
  osm_id: number;
}

export interface NearbyArgs {
  lat: number;
  lon: number;
  radius_m: number;
  tagKey: string;
  tagValue: string;
  elementType?: string;
  limit?: number;
}

