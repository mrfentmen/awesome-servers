export class OrsError extends Error {
    constructor(message) {
        super(message);
        this.name = "OrsError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.OPENROUTESERVICE_API_KEY;
    if (!k)
        throw new OrsError("Set OPENROUTESERVICE_API_KEY (free openrouteservice key).");
    return k;
}
async function get(path) {
    const sep = path.includes("?") ? "&" : "?";
    let res;
    try {
        res = await fetch(`https://api.openrouteservice.org${path}${sep}api_key=${encodeURIComponent(key())}`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new OrsError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new OrsError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function geocode(query, limit) {
    const n = Math.min(Number(limit ?? 5) || 5, 20);
    return get(`/geocode/search?text=${encodeURIComponent(query)}&size=${n}`);
}
export function reverse(lat, lon) {
    return get(`/geocode/reverse?point.lat=${encodeURIComponent(lat)}&point.lon=${encodeURIComponent(lon)}&size=1`);
}
export async function directions(fromLon, fromLat, toLon, toLat) {
    let res;
    try {
        res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
            method: "POST",
            headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: key() },
            body: JSON.stringify({ coordinates: [[Number(fromLon), Number(fromLat)], [Number(toLon), Number(toLat)]] }),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new OrsError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new OrsError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 8000);
}
// ---- muxG tools:
const ORS_NOMINATIM = "https://nominatim.openstreetmap.org";
const ORS_OSRM = "https://router.project-osrm.org";
const ORS_VALHALLA = "https://valhalla1.openstreetmap.de";
const ORS_UA = "awesome-mcps/1.0 (mcp routing)";
const ORS_LIST_CAP = 8;
async function orsFetch(url, init = {}) {
    const res = await fetch(url, {
        ...init,
        headers: { "User-Agent": ORS_UA, Accept: "application/json", ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 429)
        throw new OrsError("OpenStreetMap Nominatim is rate limiting this IP. Its public instance allows at most one request a second, so wait a moment and try again.");
    if (res.status === 404)
        throw new OrsError("The routing backend has no answer for that point.");
    if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        throw new OrsError(`Returned ${res.status}: ${body}`);
    }
    return (await res.json());
}
function orsBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function orsMetres(n) {
    return n >= 1000 ? `${(n / 1000).toFixed(2)} km` : `${Math.round(n)} m`;
}
function orsDuration(seconds) {
    const m = Math.round(seconds / 60);
    if (m < 60)
        return `${m} min`;
    return `${Math.floor(m / 60)} h ${m % 60} min`;
}
function orsCoord(value, limit) {
    const n = Number(value);
    if (!Number.isFinite(n) || Math.abs(n) > limit)
        throw new OrsError(`Coordinate ${value} is out of range (|value| must be at most ${limit}).`);
    return n;
}
function orsManoeuvre(step) {
    const m = step?.maneuver ?? {};
    const kind = [m.type, m.modifier].filter(Boolean).join(" ") || "continue";
    return { kind, instruction: String(step?.name ? `on ${step.name}` : "unspecified road"), road: String(step?.name ?? "") };
}
/** Turn-by-turn steps from OSRM: a different router and data pipeline from this server's own directions. */
export async function osrmRouteSteps(args) {
    const fromLat = orsCoord(args?.from_lat, 90);
    const fromLon = orsCoord(args?.from_lon, 180);
    const toLat = orsCoord(args?.to_lat, 90);
    const toLon = orsCoord(args?.to_lon, 180);
    const alternatives = args?.alternatives === true ? "true" : "false";
    const coords = `${fromLon},${fromLat};${toLon},${toLat}`;
    const url = `${ORS_OSRM}/route/v1/driving/${coords}?steps=true&alternatives=${alternatives}&overview=false&annotations=false`;
    const data = await orsFetch(url);
    if (String(data?.code ?? "") !== "Ok" || !Array.isArray(data?.routes) || !data.routes.length)
        throw new OrsError(`OSRM found no drivable route: ${String(data?.message ?? data?.code ?? "no answer")}.`);
    const rows = [];
    const routes = data.routes.slice(0, alternatives === "true" ? 3 : 1);
    rows.push(`OSRM driving route over OpenStreetMap data — ${routes.length} route(s) for ${coords}`);
    routes.forEach((route, index) => {
        const steps = (route.legs ?? []).flatMap((leg) => leg.steps ?? []);
        const roads = [...new Set(steps.map((s) => String(s.name ?? "").trim()).filter(Boolean))];
        rows.push("");
        rows.push(`Route ${index + 1}: ${orsMetres(Number(route.distance ?? 0))} | ${orsDuration(Number(route.duration ?? 0))} | ${steps.length} manoeuvre(s)`);
        rows.push(`  distinct named roads: ${roads.length}${roads.length ? ` — ${roads.slice(0, 8).join(", ")}${roads.length > 8 ? ", …" : ""}` : " — none named"}`);
        steps.forEach((step, i) => {
            const m = step.maneuver ?? {};
            const kind = [m.type, m.modifier].filter(Boolean).join(" ") || "continue";
            rows.push(`  ${String(i + 1).padStart(2)}. ${kind.padEnd(22)} ${String(step.name ?? "(unnamed)").slice(0, 40).padEnd(40)} ${orsMetres(Number(step.distance ?? 0))}`);
        });
    });
    rows.push("", "OSRM is a different engine on the same OpenStreetMap data as this server's directions tool, so distances and turn instructions will differ.");
    return rows.join("\n");
}
/** The same journey costed by several Valhalla modes, side by side. */
export async function valhallaModeCompare(args) {
    const fromLat = orsCoord(args?.from_lat, 90);
    const fromLon = orsCoord(args?.from_lon, 180);
    const toLat = orsCoord(args?.to_lat, 90);
    const toLon = orsCoord(args?.to_lon, 180);
    const offered = ["auto", "bicycle", "pedestrian", "multimodal", "truck", "taxi"];
    const requested = String(args?.modes ?? "")
        .split(",")
        .map((m) => m.trim().toLowerCase())
        .filter(Boolean);
    const modes = requested.length ? offered.filter((m) => requested.includes(m)) : ["auto", "bicycle", "pedestrian"];
    if (!modes.length)
        throw new OrsError(`None of ${requested.join(", ")} is a Valhalla costing here; use any of ${offered.join(", ")}.`);
    const rows = [`Valhalla journey comparison for ${fromLat},${fromLon} to ${toLat},${toLon}`];
    for (const mode of modes) {
        let summary;
        try {
            const data = await orsFetch(`${ORS_VALHALLA}/route`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    locations: [{ lat: fromLat, lon: fromLon }, { lat: toLat, lon: toLon }],
                    costing: mode,
                    directions_options: { units: "kilometers" },
                }),
            });
            const trip = data?.trip ?? {};
            const legs = Array.isArray(trip.legs) ? trip.legs : [];
            const maneuvers = legs.flatMap((leg) => Array.isArray(leg.maneuvers) ? leg.maneuvers : []);
            summary = {
                ok: true,
                distance: Number(trip.summary?.length ?? maneuvers.reduce((s, m) => s + Number(m.length ?? 0), 0)) * 1000,
                seconds: Number(trip.summary?.time ?? 0),
                cost: trip.summary?.cost,
                toll: Boolean(trip.summary?.has_toll),
                ferry: Boolean(trip.summary?.has_ferry),
                motorway: Boolean(trip.summary?.has_highway),
                energy: data?.trip?.summary?.energy_consumption ?? null,
                opening: maneuvers.slice(0, 3).map((m) => String(m.instruction ?? m.type ?? "manoeuvre").trim()),
            };
        }
        catch (e) {
            summary = { ok: false, reason: e instanceof Error ? e.message : String(e) };
        }
        rows.push("");
        if (!summary.ok) {
            rows.push(`${mode.padEnd(11)} unavailable — ${summary.reason.slice(0, 140)}`);
            continue;
        }
        rows.push(`${mode.padEnd(11)} ${orsMetres(summary.distance)} | ${orsDuration(summary.seconds)} | toll ${summary.toll ? "yes" : "no"} | ferry ${summary.ferry ? "yes" : "no"} | motorway ${summary.motorway ? "yes" : "no"}`);
        rows.push(`            cost ${summary.cost === undefined || summary.cost === null ? "not returned" : `${Number(summary.cost).toFixed(2)} (Valhalla cost units, not a currency)`}${summary.energy !== null && summary.energy !== undefined ? ` | energy estimate ${summary.energy}` : ""}`);
        if (summary.opening.length)
            rows.push(`            opens with: ${summary.opening.join(" → ")}`);
    }
    rows.push("", "Each mode is a separate Valhalla request against the public OSM instance; a mode that fails is reported rather than guessed, and cost/tolls only appear where the engine returns them.");
    return rows.join("\n");
}
/** Geocode against OpenStreetMap itself, so you can see how the answer moves between geocoders. */
export async function nominatimLookup(args) {
    const limit = orsBound(args?.limit, 1, ORS_LIST_CAP, 5);
    const hasCoords = args?.lat !== undefined && args.lon !== undefined;
    const hasQuery = String(args?.query ?? "").trim().length > 0;
    if (!hasCoords && !hasQuery)
        throw new OrsError("Give a query to look up, or a lat and lon to reverse geocode.");
    let url;
    let direction;
    if (hasCoords) {
        const lat = Number(args.lat);
        const lon = Number(args.lon);
        if (!Number.isFinite(lat) || Math.abs(lat) > 90)
            throw new OrsError(`"${args.lat}" is not a latitude between -90 and 90.`);
        if (!Number.isFinite(lon) || Math.abs(lon) > 180)
            throw new OrsError(`"${args.lon}" is not a longitude between -180 and 180.`);
        const zoom = orsBound(args.limit, 1, 18, 18);
        url = `${ORS_NOMINATIM}/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=${zoom}&addressdetails=1&namedetails=1`;
        direction = `Reverse geocode of ${lat}, ${lon} at zoom ${zoom}`;
    }
    else {
        url = `${ORS_NOMINATIM}/search?format=jsonv2&addressdetails=1&namedetails=1&limit=${limit}&q=${encodeURIComponent(String(args.query).trim())}`;
        direction = `Forward geocode of "${String(args.query).trim()}" in OpenStreetMap`;
    }
    const raw = await orsFetch(url);
    const rows = Array.isArray(raw) ? raw : [raw];
    if (!rows.length || !rows[0]?.display_name) {
        return [
            `${direction}`,
            "OpenStreetMap returned nothing.",
            "No match usually means the name is missing from OSM, is spelled differently, or is a building rather than an address. Try a coarser place name, or the postcode.",
        ].join("\n");
    }
    return [
        direction,
        `${rows.length} result(s) from Nominatim, OpenStreetMap's own geocoder`,
        "",
        ...rows.map((r, i) => {
            const addr = r.address ?? {};
            const named = Object.entries(addr).filter(([k]) => !["country_code", "country", "state", "county", "municipality", "city_district", "ISO3166-2-lvl4"].includes(k)).slice(0, 6);
            return [
                `${i + 1}. ${r.name ?? "(no name)"} — ${r.display_name}`,
                `   ${r.lat}, ${r.lon} | OSM ${r.osm_type ?? "?"}/${r.osm_id ?? "?"} | place id ${r.place_id ?? "not reported"}`,
                `   classified as ${r.category ?? "not reported"}/${r.type ?? "not reported"} (address type ${r.addresstype ?? "not reported"})`,
                r.importance !== undefined ? `   importance ${Number(r.importance).toFixed(4)}` : "",
                named.length ? `   address parts: ${named.map(([k, v]) => `${k}=${v}`).join(", ")}` : "   address parts: not reported",
                r.boundingbox ? `   bounding box: ${r.boundingbox.join(", ")}` : "",
            ].filter(Boolean).join("\n");
        }),
        "",
        "This is a different geocoder from the one this server's other tools use, and they will disagree: Nominatim ranks by OpenStreetMap importance, while a commercial geocoder ranks by its own address database. A pin that moves between them is usually a boundary or a duplicated feature, not a bug in either.",
    ].filter(Boolean).join("\n");
}
