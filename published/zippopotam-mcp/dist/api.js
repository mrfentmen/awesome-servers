/**
 * Zippopotam Postal Codes — keyless public API client.
 */
const BASE = "https://api.zippopotam.us";
const SOURCE = "Zippopotam Postal Codes";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "zippopotam-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
// Codes the Zippopotam.us API documents on its endpoint list.
const COUNTRIES = [
    ["us", "United States"], ["ca", "Canada"], ["mx", "Mexico"], ["br", "Brazil"], ["ar", "Argentina"],
    ["at", "Austria"], ["be", "Belgium"], ["ch", "Switzerland"], ["cz", "Czechia"], ["de", "Germany"],
    ["dk", "Denmark"], ["es", "Spain"], ["fi", "Finland"], ["fr", "France"], ["gb", "United Kingdom"],
    ["gr", "Greece"], ["hr", "Croatia"], ["hu", "Hungary"], ["ie", "Ireland"], ["is", "Iceland"],
    ["it", "Italy"], ["li", "Liechtenstein"], ["lu", "Luxembourg"], ["nl", "Netherlands"], ["no", "Norway"],
    ["pl", "Poland"], ["pt", "Portugal"], ["ro", "Romania"], ["ru", "Russia"], ["se", "Sweden"],
    ["si", "Slovenia"], ["sk", "Slovakia"], ["tr", "Turkey"], ["ua", "Ukraine"], ["in", "India"],
    ["id", "Indonesia"], ["jp", "Japan"], ["kr", "South Korea"], ["my", "Malaysia"], ["ph", "Philippines"],
    ["sg", "Singapore"], ["th", "Thailand"], ["tw", "Taiwan"], ["vn", "Vietnam"], ["au", "Australia"],
    ["nz", "New Zealand"], ["za", "South Africa"], ["eg", "Egypt"], ["ke", "Kenya"], ["ma", "Morocco"],
    ["ng", "Nigeria"], ["tz", "Tanzania"], ["ug", "Uganda"], ["il", "Israel"], ["sa", "Saudi Arabia"],
    ["ae", "United Arab Emirates"], ["kw", "Kuwait"], ["lb", "Lebanon"], ["pk", "Pakistan"], ["bd", "Bangladesh"],
    ["lk", "Sri Lanka"], ["np", "Nepal"], ["cl", "Chile"], ["co", "Colombia"], ["pe", "Peru"], ["uy", "Uruguay"],
];
const CODES = new Map(COUNTRIES);
function check(country) {
    const code = clean(country).toLowerCase();
    if (!CODES.has(code))
        throw new SourceError(`country must be one of ${[...CODES.keys()].join(", ")}`);
    return code;
}
function line(place) {
    const lat = Number(place?.latitude);
    const lon = Number(place?.longitude);
    return `- ${clean(place?.["place name"])} · ${clean(place?.state)} (${clean(place?.["state abbreviation"])})${Number.isFinite(lat) && Number.isFinite(lon) ? ` · ${lat.toFixed(4)}, ${lon.toFixed(4)}` : ""}`;
}
async function one(country, postcode) {
    const d = await getJson(`/${country}/${encodeURIComponent(postcode)}`);
    const places = Array.isArray(d?.places) ? d.places : [];
    if (!places.length)
        return [];
    return [
        `${clean(d["post code"])} in ${clean(d.country)} (${clean(d["country abbreviation"]).toUpperCase()}) - ${places.length} place(s):`,
        ...places.map(line),
    ];
}
export async function lookupPostcode(a) {
    const country = check(a.country);
    const postcode = clean(a.postcode);
    if (postcode.length < 2)
        throw new SourceError("postcode must be at least 2 characters");
    const lines = await one(country, postcode);
    if (!lines.length)
        return `Zippopotam has no place for postcode ${postcode} in ${country.toUpperCase()}. Check the country code or try a shorter postcode.`;
    return lines.join("\n");
}
export async function lookupPostcodes(a) {
    const country = check(a.country);
    const codes = (a.postcodes ?? []).map((c) => clean(c));
    if (codes.length < 2 || codes.length > 10)
        throw new SourceError("postcodes must list between 2 and 10 codes");
    const blocks = [];
    for (const code of codes) {
        if (code.length < 2)
            throw new SourceError(`postcode ${code} is too short`);
        const lines = await one(country, code);
        blocks.push(lines.length ? lines.join("\n") : `${code}: no place found in ${country.toUpperCase()}`);
    }
    return blocks.join("\n\n");
}
export async function supportedCountries() {
    return [
        `Zippopotam looks postal codes up in ${COUNTRIES.length} countries:`,
        "",
        ...COUNTRIES.map(([code, name]) => `- ${code}: ${name}`),
    ].join("\n");
}
