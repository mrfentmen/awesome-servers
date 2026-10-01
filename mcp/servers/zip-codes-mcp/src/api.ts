const BASE = "https://api.zippopotam.us/us"
const UA = "mrfentmen-zip-codes-mcp/1.0 (https://github.com/mrfentmen)"
export class ZipError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new ZipError("Zippopotam rate limit hit, wait and retry")
  if (!res.ok) throw new ZipError(`Zippopotam error ${res.status}`)
  return (await res.json()) as T
}

export async function zipLookup(args: { zip?: string }): Promise<string> {
  const zip = (args.zip ?? "").trim()
  if (!/^\d{5}$/.test(zip)) throw new ZipError("Provide a five digit US zip code")
  const d = await get<any>(`${BASE}/${zip}`)
  const places = d?.places ?? []
  if (!places.length) return `No data for ${zip}`
  const postCode = d?.["post code"] ?? zip
  return places.map((p: any) => `${postCode} | ${p?.["place name"] ?? "n/a"}, ${p?.["state abbreviation"] ?? ""} ${p?.longitude ?? ""}, ${p?.latitude ?? ""}`).join("\n")
}

export async function cityLookup(args: { city?: string; state?: string }): Promise<string> {
  const city = (args.city ?? "").trim().toLowerCase()
  const state = (args.state ?? "").trim().toLowerCase()
  if (!city || !state) throw new ZipError("Provide a city and two letter state")
  const d = await get<any>(`${BASE}/${encodeURIComponent(city)}/${state}`)
  const places = d?.places ?? []
  if (!places.length) return `No data for ${city}, ${state}`
  const zips = [...new Set(places.map((p: any) => p?.["post code"]).filter(Boolean))]
  return `${city[0].toUpperCase()}${city.slice(1)}, ${state.toUpperCase()}\nZip codes: ${zips.join(", ")}`
}

// ---- muxB tools:

const NOMINATIM = "https://nominatim.openstreetmap.org/reverse";

export interface ReverseGeocodeArgs {
  latitude: number;
  longitude: number;
}

export async function reverseGeocode(args: ReverseGeocodeArgs): Promise<string> {
  const lat = Number(args.latitude);
  const lon = Number(args.longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new ZipError("Provide a latitude between -90 and 90");
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new ZipError("Provide a longitude between -180 and 180");
  const params = new URLSearchParams({ format: "jsonv2", lat: String(lat), lon: String(lon), zoom: "14" });
  const res = await fetch(`${NOMINATIM}?${params.toString()}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 429) throw new ZipError("Reverse geocoder rate limit hit, wait and retry")
  if (!res.ok) throw new ZipError(`Reverse geocoder error ${res.status}`);
  const d = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
    type?: string;
    lat?: string;
    lon?: string;
  };
  const a = d.address ?? {};
  const field = (keys: string[]) => {
    for (const k of keys) {
      const v = a[k];
      if (v) return v;
    }
    return "not reported";
  };
  return [
    `Reverse geocode of ${lat}, ${lon} (OpenStreetMap Nominatim)`,
    `Post code: ${field(["postcode"])}`,
    `City or town: ${field(["city", "town", "village", "municipality", "hamlet", "suburb"])}`,
    `State or region: ${field(["state", "region", "province"])}`,
    `Country: ${field(["country"])} (${field(["country_code"])})`,
    `Matched feature: ${d.type ?? "not reported"}`,
    `Full address: ${d.display_name ?? "not reported"}`,
  ].join("\n");
}
