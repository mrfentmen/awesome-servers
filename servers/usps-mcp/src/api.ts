// ---- muxH tools:
// This server's own tools all call the USPS API, which needs a key, and they were
// registered with the deprecated server.tool() so the paywall script cannot see
// them. The two below are registered with registerTool like every other server in
// this repository, and they read public postal and address data that needs no key:
// a postcode resolved to the places it covers, and a free-form address resolved to
// coordinates by the US Census.

const UP_UA = "mcfentmen-usps-mcp/1.2 (https://github.com/mcfentmen/usps-mcp)";
const UP_ZIPPO = "https://api.zippopotam.us";
const UP_CENSUS = "https://geocoding.geo.census.gov/geocoder";

interface UpZippoPlace {
  "place name"?: string;
  state?: string;
  "state abbreviation"?: string;
  latitude?: string;
  longitude?: string;
}
interface UpZippoResponse {
  country?: string;
  "country abbreviation"?: string;
  "post code"?: string;
  places?: UpZippoPlace[];
}
interface UpCensusMatch {
  matchedAddress?: string;
  coordinates?: { x?: number; y?: number };
  tigerLine?: { side?: string; source?: string; line?: string };
  addressComponents?: Record<string, string>;
}

async function upGet<T>(url: string, label: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { "User-Agent": UP_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
  } catch (e) {
    throw new Error(`Could not reach ${label}: ${(e as Error).message}`);
  }
  if (res.status === 404) return null;
  if (res.status === 429) throw new Error(`${label} is rate-limiting this client; wait a moment before retrying.`);
  if (!res.ok) throw new Error(`${label} returned HTTP ${res.status}.`);
  const body = (await res.json()) as T;
  // This service answers an unknown postcode with an empty object and a 200.
  if (!body || (Array.isArray(body) && !body.length) || (typeof body === "object" && !Object.keys(body).length)) return null;
  return body;
}

/**
 * What a postcode actually covers. One code can name a whole city or a single
 * building, and for shipping that difference decides the zone, the rate and
 * whether a delivery is even deliverable, so the places under a code are listed
 * with their coordinates rather than collapsed into one line.
 */
export async function postalLookup(args: { postcode: string; country?: string }): Promise<string> {
  const raw = String(args?.postcode ?? "").trim();
  if (!raw) throw new Error("Give a postcode, for example 90210 or SW1A 1AA.");
  const code = raw.replace(/\s+/g, " ");
  const country = String(args?.country ?? "").trim().toLowerCase();
  if (country && !/^[a-z]{2}$/.test(country)) {
    throw new Error(`Give the country as a two-letter code such as "us" or "gb", not "${args?.country}".`);
  }

  const found: { cc: string; data: UpZippoResponse }[] = [];
  // Without a country the two-letter guess is tried against the likely codes.
  const candidates = country ? [country] : ["us", "gb", "ca", "au", "de", "fr", "nl", "es", "it", "pl", "jp", "br", "in", "mx", "se", "ch", "ie", "nz", "za"];
  for (const cc of candidates) {
    const data = await upGet<UpZippoResponse>(`${UP_ZIPPO}/${cc}/${encodeURIComponent(code)}`, `the postal database for ${cc.toUpperCase()}`);
    if (data) {
      found.push({ cc, data });
      if (country) break;
    }
    if (found.length >= 2) break;
  }

  if (!found.length) {
    return (
      `No postal record for "${code}"${country ? ` in ${country.toUpperCase()}` : ""}. ` +
      `That means the code is unknown to this database, not that it does not exist: coverage is by country and the set of countries is smaller than the set of countries in the world. ` +
      (country ? "" : "Pass the country as a two-letter code to check a specific one.")
    );
  }

  const lines: string[] = [];
  for (const hit of found) {
    const d = hit.data;
    const places = d.places ?? [];
    const lats = places.map((p) => Number(p.latitude)).filter(Number.isFinite);
    const lons = places.map((p) => Number(p.longitude)).filter(Number.isFinite);
    lines.push(
      `${d["post code"] ?? code} — ${d.country ?? "country not reported"} (${d["country abbreviation"] ?? hit.cc.toUpperCase()})`,
      `  ${places.length} place(s) under this code, ${new Set(places.map((p) => p["place name"])).size} distinct name(s)`,
      places.length === 1
        ? "  a single place under this code, so it is specific rather than a city-wide code"
        : "  several places share this code, so it does not identify one delivery point on its own",
    );
    if (lats.length) {
      const meanLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const meanLon = lons.reduce((a, b) => a + b, 0) / lons.length;
      lines.push(`  centre of the places: ${Math.abs(meanLat).toFixed(4)}°${meanLat >= 0 ? "N" : "S"} ${Math.abs(meanLon).toFixed(4)}°${meanLon >= 0 ? "E" : "W"}`);
    }
    lines.push("  places:");
    for (const place of places.slice(0, 20)) {
      lines.push(`    ${String(place["place name"] ?? "?").padEnd(28)}${String(place.state ?? "").padEnd(22)}${place["state abbreviation"] ?? ""}  ${place.latitude ?? "?"}, ${place.longitude ?? "?"}`);
    }
    if (places.length > 20) lines.push(`    (+${places.length - 20} further place(s) under this code)`);
  }
  if (found.length > 1) lines.push("", `The same code resolves in ${found.length} countries, which is normal for short numeric codes: ${found.map((h) => h.cc.toUpperCase()).join(", ")}.`);
  lines.push(
    "",
    "Read as: the coordinates are the place name's position, not a delivery point, and a code that covers a whole city tells you nothing about where inside it a parcel goes. This is a public postal database with uneven country coverage and no notion of a carrier's own zone, so it narrows a postcode rather than pricing it.",
  );
  return lines.join("\n");
}

/**
 * A typed address turned into coordinates by the US Census geocoder, with the
 * standardised form it matched. A shipping rate needs a deliverable address, and
 * this is the step that finds out whether what was typed is one.
 */
export async function addressGeocode(args: { address: string; reverse?: string }): Promise<string> {
  const reverse = String(args?.reverse ?? "").trim();
  if (reverse) {
    const coords = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(reverse);
    if (!coords) {
      throw new Error("Give the point as \"latitude, longitude\", for example 38.8987, -77.0352.");
    }
    const lat = Number(coords[1]);
    const lon = Number(coords[2]);
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error("That point is outside the world: latitude must be -90 to 90 and longitude -180 to 180.");
    }
    const body = await upGet<{ result?: { addressMatches?: UpCensusMatch[] } }>(
      `${UP_CENSUS}/locations/coordinates?x=${lon}&y=${lat}&benchmark=Public_AR_Current&format=json`,
      "the Census geocoder",
    );
    const matches = body?.result?.addressMatches ?? [];
    if (!matches.length) {
      return `The Census geocoder found no address at ${lat}, ${lon}. It resolves to the nearest known address rather than a street centre, so a rural or oceanic point will legitimately return nothing.`;
    }
    const lines = [`Reverse geocode of ${lat}, ${lon}`, ""];
    for (const [i, m] of matches.slice(0, 5).entries()) {
      lines.push(`  ${i + 1}. ${m.matchedAddress ?? "address not reported"}`);
      lines.push(`     ${m.coordinates?.x ?? "?"}, ${m.coordinates?.y ?? "?"}  | ZIP ${m.addressComponents?.zip || "not reported"}`);
    }
    lines.push("", "This is a nearest-address lookup, not a survey: it will happily return a road segment's nearest house, and it covers the United States only.");
    return lines.join("\n");
  }

  const address = String(args?.address ?? "").trim();
  if (!address) throw new Error("Give an address to resolve, for example \"1600 Pennsylvania Ave NW, Washington, DC 20500\".");
  const body = await upGet<{ result?: { addressMatches?: UpCensusMatch[] } }>(
    `${UP_CENSUS}/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`,
    "the Census geocoder",
  );
  const matches = body?.result?.addressMatches ?? [];
  if (!matches.length) {
    return `The Census geocoder could not resolve "${address}". It matches against US addresses as the Census spells them, so a missing city or state, a postal box, a rural route or a non-US address will all return nothing rather than a guess.`;
  }
  const best = matches[0];
  const components = best.addressComponents ?? {};
  const lat = best.coordinates?.y;
  const lon = best.coordinates?.x;
  const lines = [
    `Census geocode of "${address}"`,
    `  ${matches.length} match(es); the first is the closest`,
    `  matched: ${best.matchedAddress ?? "not reported"}`,
    lat !== undefined && lon !== undefined
      ? `  point: ${lat.toFixed(6)}, ${lon.toFixed(6)} (${Math.abs(lat).toFixed(5)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(5)}°${lon >= 0 ? "E" : "W"})`
      : "  point: not reported",
    "",
    "Parsed components of the match:",
    ...Object.entries(components)
      .filter(([, v]) => v)
      .map(([k, v]) => `  ${k.padEnd(18)}${v}`),
  ];
  if (best.tigerLine?.line) lines.push(`  tiger line         ${best.tigerLine.line} (${best.tigerLine.source ?? "source not reported"}), side ${best.tigerLine.side ?? "not reported"}`);
  if (matches.length > 1) {
    lines.push("", "Other candidates:");
    lines.push(...matches.slice(1, 4).map((m) => `  - ${m.matchedAddress ?? "?"} at ${m.coordinates?.y ?? "?"}, ${m.coordinates?.x ?? "?"}`));
  }
  lines.push(
    "",
    "A match means the Census recognised the address, not that a courier can deliver to it: it resolves rooftop and street-segment points for the United States only, takes no access or unit number into account, and returns several candidates for an ambiguous street. Verify the ZIP it resolved before pricing against it.",
  );
  return lines.join("\n");
}
