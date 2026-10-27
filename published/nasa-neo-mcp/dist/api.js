/**
 * Near-Earth Objects — keyless public API client.
 */
const BASE = "https://api.nasa.gov/neo/rest/v1";
const SOURCE = "Near-Earth Objects";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "nasa-neo-mcp", accept },
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
function key() {
    const fromEnv = process.env.NASA_API_KEY;
    return fromEnv && fromEnv.trim() ? fromEnv.trim() : "DEMO_KEY";
}
function checkDate(value, label) {
    const v = clean(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v))
        throw new SourceError(`${label} must be YYYY-MM-DD`);
    return v;
}
export async function closeApproaches(a) {
    const start = checkDate(a.startDate, "startDate");
    const end = checkDate(a.endDate, "endDate");
    const days = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;
    if (days < 0)
        throw new SourceError("endDate must not be before startDate");
    if (days > 7)
        throw new SourceError("NeoWs allows at most a 7 day window");
    const limit = a.limit ?? 15;
    if (!Number.isInteger(limit) || limit < 1 || limit > 40)
        throw new SourceError("limit must be between 1 and 40");
    const d = await getJson(`/feed?start_date=${start}&end_date=${end}&api_key=${encodeURIComponent(key())}`);
    const grouped = d?.near_earth_objects ?? {};
    const rows = Object.values(grouped).flat();
    if (!rows.length)
        return `NASA lists no close approach between ${start} and ${end}.`;
    const withApproach = rows.map((o) => {
        const approach = (o.close_approach_data ?? [])[0] ?? {};
        return { o, approach, km: Number(approach.miss_distance?.kilometers ?? Number.POSITIVE_INFINITY) };
    }).sort((x, y) => x.km - y.km);
    return [
        `NASA near-earth objects ${start} to ${end} - ${d?.element_count ?? rows.length} objects in total, showing the ${Math.min(limit, withApproach.length)} closest:`,
        "",
        ...withApproach.slice(0, limit).map(({ o, approach, km }) => {
            const diameter = o.estimated_diameter?.kilometers ?? {};
            const size = diameter.estimated_diameter_min !== undefined
                ? `${Number(diameter.estimated_diameter_min).toFixed(3)}-${Number(diameter.estimated_diameter_max).toFixed(3)} km`
                : "size unknown";
            return [
                `${clean(o.name)} (id ${o.id})`,
                `  ${size} · ${clean(approach.close_approach_date)} at ${Number(approach.relative_velocity?.kilometers_per_hour ?? 0).toLocaleString("en-US")} km/h`,
                `  miss distance: ${Number.isFinite(km) ? `${Math.round(km).toLocaleString("en-US")} km` : "unknown"}${o.is_potentially_hazardous_asteroid ? " · flagged potentially hazardous" : ""}`,
            ].join("\n");
        }),
        "",
        `Key in use: ${key() === "DEMO_KEY" ? "the shared DEMO_KEY (set NASA_API_KEY for a personal key)" : "NASA_API_KEY from the environment"}`,
    ].join("\n");
}
export async function objectDetail(a) {
    const id = clean(a.asteroidId);
    if (id.length < 3)
        throw new SourceError("asteroidId is required");
    const d = await getJson(`/neo/${encodeURIComponent(id)}?api_key=${encodeURIComponent(key())}`);
    if (!d || !d.name)
        throw new SourceError(`NASA has no object ${id}`);
    const diameter = d.estimated_diameter?.kilometers ?? {};
    const approaches = d.close_approach_data ?? [];
    const next = approaches[approaches.length - 1];
    return [
        `${clean(d.name)} (id ${d.id})`,
        `Orbit class: ${clean(d.orbital_data?.orbit_class?.orbit_class_type) || "unknown"}${clean(d.orbital_data?.orbit_class?.orbit_class_description) ? ` - ${clean(d.orbital_data.orbit_class.orbit_class_description)}` : ""}`,
        diameter.estimated_diameter_min !== undefined ? `Diameter: ${Number(diameter.estimated_diameter_min).toFixed(3)}-${Number(diameter.estimated_diameter_max).toFixed(3)} km` : "",
        d.is_potentially_hazardous_asteroid ? "Flagged: potentially hazardous asteroid" : "Not flagged as potentially hazardous",
        d.is_sentry_object ? "Sentry: tracked by the impact-monitoring system" : "",
        d.absolute_magnitude_h ? `Absolute magnitude: ${d.absolute_magnitude_h}` : "",
        next ? `Nearest listed approach: ${clean(next.close_approach_date)} at ${Math.round(Number(next.miss_distance?.kilometers ?? 0)).toLocaleString("en-US")} km` : "",
        approaches.length ? `Approaches on record: ${approaches.length}` : "",
        `JPL: https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(clean(d.name))}`,
    ].filter(Boolean).join("\n");
}
