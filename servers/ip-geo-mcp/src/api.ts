const BASE = "http://ip-api.com/json"
const UA = "mrfentmen-ip-geo-mcp/1.0 (https://github.com/mrfentmen)"
export class IpError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new IpError(`ip-api error ${res.status}`)
  return (await res.json()) as T
}

function fmt(d: any): string {
  if (d.status === "fail") return `Lookup failed: ${d.message ?? "unknown"}`
  return [
    `IP: ${d.query ?? ""}`,
    `Location: ${d.city ?? ""}, ${d.regionName ?? ""} ${d.countryCode ?? ""}`,
    `Coords: ${d.lat ?? "?"}, ${d.lon ?? "?"}`,
    `Timezone: ${d.timezone ?? ""}`,
    `ISP: ${d.isp ?? ""}`,
    `Org: ${d.org ?? ""}`,
    `AS: ${d.as ?? ""}`,
  ].join("\n")
}

export async function lookup(args: { ip?: string }): Promise<string> {
  const ip = (args.ip ?? "").trim()
  if (!ip) throw new IpError("Provide an IP address")
  const d = await get<any>(`${BASE}/${encodeURIComponent(ip)}?fields=status,message,query,city,regionName,countryCode,lat,lon,timezone,isp,org,as`)
  return fmt(d)
}

export async function myIp(_args: Record<string, never>): Promise<string> {
  const d = await get<any>(`${BASE}?fields=status,message,query,city,regionName,countryCode,lat,lon,timezone,isp,org,as`)
  return fmt(d)
}
// ---- muxE tools:
// The two existing tools resolve exactly one address at a time and print a
// fixed block of eight lines, and the fields they ask for leave three of the
// fourteen the API returns unused. They also throw the response headers away,
// which is where ip-api publishes how many requests are left this minute. These
// three reach three things the pair cannot: many addresses in one call, a
// hostname instead of an address, and a comparison of two places.
// UA is already declared in this module and is byte identical, so it is reused
// rather than redeclared. The base URL is named JSON_BASE so that it cannot
// shadow the global JSON that stringify below needs.

const JSON_BASE = "http://ip-api.com/json";

// The same set the existing tools request, plus the three they leave out, so
// every tool in this server is reading the same shape.
const FIELDS = [
  "status", "message", "query", "country", "countryCode", "region", "regionName",
  "city", "zip", "lat", "lon", "timezone", "isp", "org", "as", "reverse",
].join(",");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

interface Call {
  row: Row;
  rl: string | null;
  ttl: string | null;
}

async function call(url: string, init?: RequestInit): Promise<Call> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, ...(init?.headers as Record<string, string> | undefined) },
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    throw new IpError(`ip-api could not be reached: ${e instanceof Error ? e.message : String(e)}`);
  }
  // The free tier is 45 requests a minute and the service signals the limit in
  // headers rather than in the body, so they are read here and reported.
  const rl = res.headers.get("x-rl");
  const ttl = res.headers.get("x-ttl");
  if (res.status === 429) {
    throw new IpError(`ip-api refused the request: the free tier allows 45 requests a minute and this one was over the limit. It resets in ${ttl ?? "an unknown number of"} seconds.`);
  }
  if (!res.ok) throw new IpError(`ip-api error ${res.status}`);
  return { row: (await res.json()) as Row, rl, ttl };
}

function failed(row: Row): string {
  if (row?.status !== "fail") return "";
  // ip-api distinguishes these three cases and the message is the useful part.
  return `Lookup failed for ${row.query ?? "that query"}: ${row.message ?? "unknown"}`;
}

// Great-circle distance in km. Only ever called on coordinates the API
// returned, and haversine is accurate enough over these distances that no
// library is worth pulling in for it.

function usage(rl: string | null, ttl: string | null): string[] {
  const lines: string[] = [];
  if (rl !== null) lines.push(`  ip-api requests left this minute: ${rl}${ttl !== null ? `, resetting in ${ttl}s` : ""}. The free tier allows 45 a minute.`);
  return lines;
}

export interface BatchArgs {
  ips: string[];
}

export interface ReverseArgs {
  hostname: string;
}

export async function reverse_lookup(args: ReverseArgs): Promise<string> {
  const host = (args?.hostname ?? "").trim();
  if (!host) return "Provide a hostname to resolve, for example dns.google.";
  if (/\s/.test(host)) return "A hostname cannot contain spaces.";
  const { row, rl, ttl } = await call(`${JSON_BASE}/${encodeURIComponent(host)}?fields=${encodeURIComponent(FIELDS)}`);
  if (row?.status === "fail") {
    return [
      `Could not resolve ${host}: ${row.message ?? "unknown"}.`,
      "ip-api answers private and reserved ranges as private range or reserved range, and a malformed name as invalid query.",
    ].join("\n");
  }
  const lines = [
    `Reverse lookup of ${host}:`,
    `  resolves to: ${row.query ?? "not returned"}`,
    `  registered as: ${row.reverse ?? "not returned"}`,
    `  location: ${[row.city, row.regionName, row.country].filter(Boolean).join(", ") || "no location returned"}${row.countryCode ? ` (${row.countryCode})` : ""}${row.zip ? `, zip ${row.zip}` : ""}`,
    `  coordinates: ${row.lat ?? "?"}, ${row.lon ?? "?"}`,
    `  timezone: ${row.timezone ?? "not returned"}`,
    `  network: ${[row.isp, row.org].filter(Boolean).join(", ") || "not returned"}${row.as ? `, ${row.as}` : ""}`,
    "",
    "  lookup geolocates the address the name resolves to, which for a CDN or anycast name is one of many answers and may not be the one you wanted.",
  ];
  lines.push(...usage(rl, ttl));
  return lines.join("\n");
}

export interface CompareArgs {
  ips: string[];
}

// ---- gap3b tools:

// ip-api answers fourteen more fields than FIELDS asks for. These six are the
// ones that say what kind of network an address sits on rather than where it is,
// and none of the five existing tools request them.

export interface ProfileArgs {
  ip: string;
}

