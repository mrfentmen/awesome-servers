const BASE = "https://api.openbrewerydb.org/v1";
const UA = "mrfentmen-brewery-mcp/1.0";
export class BreweryError extends Error {
    constructor(message) {
        super(message);
        this.name = "BreweryError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const clamp = (value, fallback, max = 50) => Math.min(Math.max(Number(value ?? fallback) || fallback, 1), max);
const truncate = (value, max = 3800) => value.length <= max ? value : `${value.slice(0, max)}\n… (truncated)`;
async function request(path, params) {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE}${path}${query ? `?${query}` : ""}`;
    let res;
    try {
        res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new BreweryError(`Network error: ${errorMessage(e)}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        throw new BreweryError(`Open Brewery DB returned ${res.status}: ${body}`);
    }
    return res.text();
}
async function getJson(path, params = {}) {
    const text = await request(path, params);
    try {
        return JSON.parse(text);
    }
    catch {
        throw new BreweryError("Open Brewery DB returned a non-JSON response");
    }
}
const clean = (value) => typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
/** address_1 and street hold the same value for many records, so drop repeats. */
const dedupe = (values) => [...new Set(values.filter(Boolean))];
function format(b, index) {
    const street = dedupe([clean(b.address_1), clean(b.address_2), clean(b.street)]).join(", ");
    const place = dedupe([clean(b.city), clean(b.state_province ?? b.state), clean(b.postal_code), clean(b.country)]).join(", ");
    const contact = [clean(b.website_url), clean(b.phone)].filter(Boolean).join(" | ");
    const lines = [
        `${index + 1}. ${clean(b.name) || "Unnamed"} [${clean(b.brewery_type) || "unknown type"}]`,
    ];
    if (street)
        lines.push(`   ${street}`);
    if (place)
        lines.push(`   ${place}`);
    if (contact)
        lines.push(`   ${contact}`);
    lines.push(`   id ${clean(b.id)}`);
    return lines.join("\n");
}
const formatAll = (list, requested) => {
    if (!list.length)
        return "";
    const shown = list.slice(0, requested);
    return truncate(`${list.length} brewer${list.length === 1 ? "y" : "ies"} returned (showing ${shown.length}):\n` +
        shown.map((b, i) => format(b, i)).join("\n"));
};
const SEARCH_FIELDS = ["name", "city", "state", "type", "country", "postal"];
const SORT_COLUMNS = ["name", "city", "state", "type"];
export function searchBreweries(query, by, limit) {
    const field = (by ?? "name").trim().toLowerCase();
    const allowed = SEARCH_FIELDS;
    const key = allowed.includes(field) ? `by_${field}` : "by_name";
    return getJson("/breweries", {
        [key]: query,
        per_page: String(clamp(Number(limit), 10, 50)),
    }).then((list) => formatAll(list, clamp(Number(limit), 10, 50)) || "No breweries matched.");
}
export function getBrewery(id) {
    return getJson(`/breweries/${encodeURIComponent(id)}`).then((b) => b && b.id ? format(b, 0).replace(/^1\. /, "") : `No brewery with id ${id}.`);
}
export function randomBrewery() {
    return getJson("/breweries/random", { size: "1" }).then((list) => formatAll(list, 1) || "Open Brewery DB returned no random brewery.");
}
export function searchAllBreweries(query, limit) {
    const count = clamp(limit, 10, 50);
    return getJson("/breweries/search", {
        query,
        per_page: String(count),
    }).then((list) => formatAll(list, count) || `No brewery matched "${query}".`);
}
export function findBreweries(args) {
    const params = {};
    if (args.city)
        params.by_city = args.city;
    if (args.state)
        params.by_state = args.state;
    if (args.country)
        params.by_country = args.country;
    if (args.type)
        params.by_type = args.type;
    if (args.postal)
        params.by_postal = args.postal;
    if (args.sort) {
        const [rawColumn, rawDirection] = args.sort.split(":");
        const column = (rawColumn ?? "").trim().toLowerCase();
        const direction = (rawDirection ?? "asc").trim().toLowerCase();
        const columns = SORT_COLUMNS;
        if (!columns.includes(column) || !["asc", "desc"].includes(direction)) {
            throw new BreweryError("sort must be one of name, city, state or type, with :asc or :desc");
        }
        params.sort = `${column}:${direction}`;
    }
    const filters = Object.keys(params).filter((k) => k !== "sort");
    if (!filters.length) {
        throw new BreweryError("Give at least one filter (city, state, country, type or postal). Use search_all_breweries for free-text search.");
    }
    const count = clamp(args.limit, 10, 50);
    params.per_page = String(count);
    return getJson("/breweries", params).then((list) => formatAll(list, count) || "No breweries matched those filters.");
}
const top = (counts, n) => Object.entries(counts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, value]) => `${key} ${value.toLocaleString("en-US")}`)
    .join(", ");
export function breweryStats() {
    return getJson("/breweries/meta").then((meta) => {
        const total = meta.total ?? 0;
        const blocks = [
            `Open Brewery DB holds ${total.toLocaleString("en-US")} breweries.`,
            `Top countries: ${top(meta.by_country, 10)}`,
            `Every type: ${top(meta.by_type, 20)}`,
            `Top states/regions: ${top(meta.by_state, 10)}`,
            "Use find_breweries to list breweries inside any of these places or types.",
        ];
        return truncate(blocks.join("\n"));
    });
}
// ---- batch-3 tools: autocomplete, random batch, id lookup (2026-09-27) ----
export function autocompleteBreweries(query, limit) {
    const q = (query ?? "").trim();
    if (!q)
        throw new BreweryError("Provide a partial name to autocomplete, e.g. dog.");
    const count = clamp(limit, 10, 50);
    return getJson("/breweries/autocomplete", { query: q }).then((list) => formatAll(list, count) || `Nothing matched "${q}".`);
}
export function randomBreweries(count) {
    const n = clamp(count, 3, 10);
    return getJson("/breweries/random", { size: String(n) }).then((list) => formatAll(list, n) || "Open Brewery DB returned no random breweries.");
}
export function breweriesByIds(ids, limit) {
    const list = (ids ?? "")
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);
    if (!list.length)
        throw new BreweryError("Provide one or more brewery ids, comma separated (max 10).");
    const count = clamp(limit, list.length, 50);
    return getJson("/breweries", { by_ids: list.join(","), per_page: String(count) }).then((found) => formatAll(found, count) || "No breweries matched those ids.");
}
/** Brewery types per country, from a paged sample of the catalogue. */
export async function typesByRegion(args) {
    const pages = Math.max(1, Math.min(Math.floor(Number(args.sample ?? 2) || 2), 10));
    const want = clean(args.country);
    const byCountry = new Map();
    let scanned = 0;
    let skipped = 0;
    for (let page = 1; page <= pages; page += 1) {
        const rows = await getJson("/breweries", { per_page: "200", page: String(page) });
        for (const b of rows) {
            scanned += 1;
            const country = clean(b.country);
            if (want && country.toLowerCase() !== want.toLowerCase()) {
                skipped += 1;
                continue;
            }
            const key = country || "country not reported";
            const types = byCountry.get(key) ?? new Map();
            const type = clean(b.brewery_type) || "type not reported";
            types.set(type, (types.get(type) ?? 0) + 1);
            byCountry.set(key, types);
        }
        if (rows.length < 200)
            break;
    }
    const shown = [...byCountry.entries()].sort((a, b) => b[1].size - a[1].size);
    if (!shown.length) {
        throw new BreweryError(want
            ? `No record in the ${scanned}-record sample was listed in "${want}" (Open Brewery DB wants the full country name, not a code).`
            : "Open Brewery DB returned no records to group.");
    }
    const lines = [
        `Brewery types by country across ${scanned} record(s)${skipped ? ` (${skipped} skipped by the country filter)` : ""}`,
        "",
    ];
    for (const [country, types] of shown.slice(0, 15)) {
        const total = [...types.values()].reduce((a, b) => a + b, 0);
        const ranked = [...types.entries()].sort((a, b) => b[1] - a[1]);
        lines.push(`${country} — ${total.toLocaleString("en-US")} record(s), ${types.size} type(s):`);
        for (const [type, n] of ranked.slice(0, 8)) {
            lines.push(`   ${type}: ${n.toLocaleString("en-US")} (${((n / total) * 100).toFixed(1)}%)`);
        }
        if (ranked.length > 8)
            lines.push(`   ...and ${ranked.length - 8} more type(s).`);
    }
    if (shown.length > 15)
        lines.push(`...and ${shown.length - 15} more country/countries in the sample.`);
    return truncate(lines.join("\n"));
}
// ---- muxF tools:
const EARTH_KM = 6371;
function distanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}
function coords(b) {
    const lat = Number(b?.latitude);
    const lng = Number(b?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng))
        return null;
    if (lat === 0 && lng === 0)
        return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
        return null;
    return { lat, lng };
}
async function sampleCatalog(pages) {
    const rows = [];
    let scanned = 0;
    for (let page = 1; page <= pages; page += 1) {
        const batch = await getJson("/breweries", { per_page: "200", page: String(page) });
        for (const b of batch)
            rows.push(b);
        scanned += batch.length;
        if (batch.length < 200)
            break;
    }
    return { rows, scanned };
}
export async function nearestBreweries(args) {
    const lat = Number(args.latitude);
    const lng = Number(args.longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
        throw new BreweryError("latitude must be a number between -90 and 90");
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
        throw new BreweryError("longitude must be a number between -180 and 180");
    const pages = Math.max(1, Math.min(Math.floor(Number(args.sample ?? 3) || 3), 10));
    const { rows, scanned } = await sampleCatalog(pages);
    const located = [];
    for (const b of rows) {
        const c = coords(b);
        if (!c)
            continue;
        located.push({ b, km: distanceKm(lat, lng, c.lat, c.lng) });
    }
    if (!located.length)
        throw new BreweryError(`None of the ${scanned} record(s) scanned carried usable coordinates.`);
    located.sort((x, y) => x.km - y.km);
    const nearest = located.slice(0, 10);
    const lines = [
        `Breweries nearest to ${lat}, ${lng} — scanned ${scanned.toLocaleString("en-US")} record(s), ${located.length.toLocaleString("en-US")} with coordinates.`,
        "",
    ];
    nearest.forEach(({ b, km }, i) => {
        const place = dedupe([clean(b.city), clean(b.state_province ?? b.state), clean(b.country)]).join(", ");
        lines.push(`${i + 1}. ${km.toFixed(1)} km — ${clean(b.name) || "Unnamed"} [${clean(b.brewery_type) || "unknown type"}]${place ? ` — ${place}` : ""}`);
        lines.push(`   id ${clean(b.id)}`);
    });
    lines.push("", "Open Brewery DB has no radius filter, so this ranks the sample it fetched rather than the whole directory.");
    return truncate(lines.join("\n"));
}
export async function recordCoverage(args) {
    const pages = Math.max(1, Math.min(Math.floor(Number(args.sample ?? 2) || 2), 10));
    const { rows, scanned } = await sampleCatalog(pages);
    if (!scanned)
        throw new BreweryError("Open Brewery DB returned no records to audit.");
    const has = (b, key) => clean(b?.[key]).length > 0;
    const fields = [
        ["coordinates", (b) => coords(b) !== null],
        ["phone", (b) => has(b, "phone")],
        ["website", (b) => has(b, "website_url")],
        ["street address", (b) => dedupe([clean(b.address_1), clean(b.street)]).length > 0],
        ["city", (b) => has(b, "city")],
        ["postal code", (b) => has(b, "postal_code")],
        ["brewery type", (b) => has(b, "brewery_type")],
    ];
    const counts = fields.map(([label, test]) => ({ label, n: rows.filter(test).length }));
    const byCountry = new Map();
    for (const b of rows) {
        const country = clean(b.country) || "country not reported";
        const row = byCountry.get(country) ?? { country, n: 0, located: 0 };
        row.n += 1;
        if (coords(b))
            row.located += 1;
        byCountry.set(country, row);
    }
    const weakest = [...byCountry.values()]
        .filter((r) => r.n >= 5)
        .map((r) => ({ ...r, pct: (r.located / r.n) * 100 }))
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 10);
    const pct = (n) => `${((n / scanned) * 100).toFixed(1)}%`;
    const lines = [
        `Open Brewery DB record coverage across ${scanned.toLocaleString("en-US")} record(s) from ${pages} page(s) of 200.`,
        "",
        "Field completeness:",
        ...counts.map((c) => `  ${c.label.padEnd(15)} ${c.n.toLocaleString("en-US").padStart(6)} of ${scanned.toLocaleString("en-US")} (${pct(c.n)})`),
        "",
    ];
    if (weakest.length) {
        lines.push("Weakest coordinate coverage (countries with at least 5 records):");
        for (const r of weakest)
            lines.push(`  ${r.country.padEnd(28)} ${r.located.toLocaleString("en-US")} of ${r.n.toLocaleString("en-US")} (${r.pct.toFixed(1)}%)`);
    }
    else {
        lines.push("No country in the sample had five or more records, so no per-country ranking is possible.");
    }
    lines.push("", `This is a ${pages}-page sample of the directory, not the whole catalogue.`);
    return truncate(lines.join("\n"));
}
