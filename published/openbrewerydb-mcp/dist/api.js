/**
 * Open Brewery DB v1 — keyless, documented.
 * Docs: https://www.openbrewerydb.org/documentation
 */
const BASE = "https://api.openbrewerydb.org/v1/breweries";
export class BreweryError extends Error {
}
async function getJson(url, timeoutMs = 20000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: { "user-agent": "openbrewerydb-mcp", accept: "application/json" },
        });
        if (res.status === 404)
            throw new BreweryError("No brewery with that id");
        if (res.status === 422) {
            throw new BreweryError("Open Brewery DB rejected a filter. State and country names must be spelled out in full (California, not CA).");
        }
        if (res.status === 429)
            throw new BreweryError("Open Brewery DB is rate limiting — retry shortly");
        if (!res.ok)
            throw new BreweryError(`Open Brewery DB responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof BreweryError)
            throw e;
        if (e.name === "AbortError")
            throw new BreweryError("Open Brewery DB request timed out");
        if (e instanceof SyntaxError)
            throw new BreweryError("Open Brewery DB returned malformed JSON");
        throw new BreweryError(`Open Brewery DB request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export const TYPES = [
    "micro",
    "nano",
    "regional",
    "brewpub",
    "large",
    "planning",
    "bar",
    "contract",
    "proprietor",
    "closed",
];
function where(b) {
    const parts = [b.address_1, b.city, b.state_province, b.postal_code, b.country].filter((x) => x && String(x).trim());
    return parts.join(", ") || "address not listed";
}
function line(b, i) {
    const prefix = typeof i === "number" ? `${i + 1}. ` : "• ";
    const geo = b.latitude && b.longitude ? ` · ${Number(b.latitude).toFixed(4)},${Number(b.longitude).toFixed(4)}` : "";
    return [
        `${prefix}${b.name} [${b.brewery_type ?? "type unknown"}]${geo}`,
        `   ${where(b)}`,
        b.website_url ? `   ${b.website_url}` : `   id: ${b.id}`,
    ].join("\n");
}
function rows(d) {
    if (Array.isArray(d))
        return d;
    if (Array.isArray(d?.breweries))
        return d.breweries;
    if (d && typeof d === "object" && d.id)
        return [d];
    return [];
}
function list(title, d, limit) {
    const all = rows(d);
    if (all.length === 0)
        return `${title} — nothing found.`;
    const shown = all.slice(0, limit);
    const noun = shown.length === 1 ? "brewery" : "breweries";
    return [
        `${title} — showing ${shown.length} of ${all.length}${all.length >= 20 ? "+" : ""} ${noun}:`,
        "",
        ...shown.map(line),
    ].join("\n");
}
export async function searchBreweries(query, limit) {
    const d = await getJson(`${BASE}/search?query=${encodeURIComponent(query.trim())}&per_page=${limit}`);
    return list(`Breweries matching "${query}"`, d, limit);
}
export async function byState(state, limit) {
    const d = await getJson(`${BASE}?by_state=${encodeURIComponent(state.trim())}&per_page=${limit}`);
    return list(`Breweries in ${state}`, d, limit);
}
export async function byCity(city, limit) {
    const d = await getJson(`${BASE}?by_city=${encodeURIComponent(city.trim())}&per_page=${limit}`);
    return list(`Breweries in ${city}`, d, limit);
}
export async function byType(type, limit) {
    const d = await getJson(`${BASE}?by_type=${encodeURIComponent(type.trim())}&per_page=${limit}`);
    return list(`${type} breweries`, d, limit);
}
export async function byCountry(country, limit) {
    const d = await getJson(`${BASE}?by_country=${encodeURIComponent(country.trim())}&per_page=${limit}`);
    return list(`Breweries in ${country}`, d, limit);
}
export async function breweryDetail(id) {
    const clean = id.trim();
    if (!/^[a-z0-9-]{8,}$/i.test(clean))
        throw new BreweryError(`"${id}" is not a brewery id`);
    const b = await getJson(`${BASE}/${encodeURIComponent(clean)}`);
    return [
        b.name,
        `Type: ${b.brewery_type ?? "unknown"}`,
        `Address: ${where(b)}`,
        b.phone ? `Phone: ${b.phone}` : "",
        b.website_url ? `Website: ${b.website_url}` : "",
        b.latitude && b.longitude ? `Coordinates: ${b.latitude}, ${b.longitude}` : "",
        `Map: https://www.openstreetmap.org/?mlat=${b.latitude ?? ""}&mlon=${b.longitude ?? ""}#map=16/${b.latitude ?? ""}/${b.longitude ?? ""}`,
    ]
        .filter(Boolean)
        .join("\n");
}
export async function randomBreweries(size) {
    const d = await getJson(`${BASE}/random?size=${size}`);
    return list("Random breweries", d, size);
}
