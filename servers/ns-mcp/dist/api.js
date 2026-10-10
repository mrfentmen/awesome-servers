export class NsError extends Error {
    constructor(message) {
        super(message);
        this.name = "NsError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://gateway.apiportal.ns.nl/reisinformatie-api";
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new NsError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    const __NS_API_KEY = envStrict("NS_API_KEY");
    return { "Ocp-Apim-Subscription-Key": __NS_API_KEY };
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new NsError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getDepartures(station, maxJourneys) {
    let url = BASE + `/api/v2/departures`;
    const qs = new URLSearchParams();
    qs.append("station", String(station));
    if (maxJourneys !== undefined)
        qs.append("maxJourneys", String(maxJourneys));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function searchStations(query) {
    let url = BASE + `/api/v2/stations`;
    const data = await req(url);
    const needle = query.toLowerCase();
    const hits = (data.payload ?? []).filter((st) => `${st.code ?? ""} ${st.namen?.middel ?? ""}`.toLowerCase().includes(needle)).slice(0, 15);
    if (hits.length === 0)
        return `No NS stations match "${query}".`;
    return pretty(hits);
}
export async function planJourney(fromStation, toStation, dateTime) {
    let url = BASE + `/api/v2/journey`;
    const qs = new URLSearchParams();
    qs.append("fromStation", String(fromStation));
    qs.append("toStation", String(toStation));
    if (dateTime !== undefined)
        qs.append("dateTime", String(dateTime));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getDisruptions(isActive) {
    let url = BASE + `/api/v2/disruptions`;
    const qs = new URLSearchParams();
    if (isActive !== undefined)
        qs.append("isActive", String(isActive));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getFares(fromStation, toStation) {
    let url = BASE + `/api/v2/fares`;
    const qs = new URLSearchParams();
    qs.append("fromStation", String(fromStation));
    qs.append("toStation", String(toStation));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
// ---- muxF tools:
/**
 * The NS API needs a key from apiportal.ns.nl. OpenStreetMap's Overpass API
 * and Wikidata's REST API are both keyless, and between them they describe the
 * same Dutch stations the server plans journeys between.
 */
const NS_OVERPASS = "https://overpass-api.de/api/interpreter";
const NS_WIKIDATA = "https://www.wikidata.org/w/api.php";
const NS_UA = { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" };
async function nsJson(url, init, what) {
    let res;
    try {
        res = await fetch(url, { ...init, headers: { ...NS_UA, ...(init.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
    }
    catch (e) {
        throw new NsError(`Network error: ${e.message}`);
    }
    if (res.status === 429)
        throw new NsError("The upstream rate limit answered 429. Try again in a moment.");
    if (res.status === 504)
        throw new NsError("The query timed out upstream. Narrow the area and try again.");
    if (!res.ok)
        throw new NsError(`The source returned HTTP ${res.status} for ${what}.`);
    const body = (await res.text()).trim();
    if (!body)
        throw new NsError(`The source returned an empty body for ${what}.`);
    return JSON.parse(body);
}
const nsNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("en-US") : "not reported";
};
/** Count the railway stations OpenStreetMap knows in a bounding box, and name the busiest. */
export async function stationNetworkCensus(args) {
    const s = Number(args?.south);
    const w = Number(args?.west);
    const nn = Number(args?.north);
    const e = Number(args?.east);
    for (const [label, value] of [["south", s], ["west", w], ["north", nn], ["east", e]]) {
        if (!Number.isFinite(value))
            throw new NsError(`Give a number for ${label}.`);
    }
    if (s >= nn || w >= e)
        throw new NsError("The box is empty: north must be above south and east must be right of west.");
    const n = Math.min(Math.max(Number(args?.limit ?? 15) || 15, 1), 40);
    const box = `${s},${w},${nn},${e}`;
    const boxLabel = `${s.toFixed(4)},${w.toFixed(4)} to ${nn.toFixed(4)},${e.toFixed(4)}`;
    const query = `[out:json][timeout:50];nwr["railway"="station"](${box});out center ${Math.max(n * 4, 40)};`;
    const data = await nsJson(NS_OVERPASS, { method: "POST", body: new URLSearchParams({ data: query }), headers: { "Content-Type": "application/x-www-form-urlencoded" } }, "an Overpass station query");
    const elements = data.elements ?? [];
    if (!elements.length)
        throw new NsError(`OpenStreetMap has no railway station in the box ${boxLabel}.`);
    const named = elements.filter((el) => (el.tags?.name ?? "").trim());
    const byOperator = new Map();
    const byNetwork = new Map();
    for (const el of elements) {
        const operator = (el.tags?.operator ?? "not reported").trim();
        const network = (el.tags?.network ?? "not reported").trim();
        byOperator.set(operator, (byOperator.get(operator) ?? 0) + 1);
        byNetwork.set(network, (byNetwork.get(network) ?? 0) + 1);
    }
    const withCoords = elements.filter((el) => (el.lat ?? el.center?.lat) !== undefined);
    const lines = [
        `Railway stations in the box ${boxLabel}, from OpenStreetMap via Overpass`,
        `  ${elements.length} element(s) tagged railway=station, ${named.length} of them named, ${withCoords.length} with a usable coordinate`,
        `  named: ${named.map((el) => el.tags?.name).filter(Boolean).slice(0, 6).join(", ")}${named.length > 6 ? ", ..." : ""}`,
        "",
        "  operator / network                     count",
    ];
    const operators = [...byOperator.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
    for (const [name, count] of operators)
        lines.push(`  ${String(name).slice(0, 40).padEnd(41)}${count}`);
    if (byOperator.size > n)
        lines.push(`  ...and ${byOperator.size - n} more operator value(s).`);
    lines.push("");
    lines.push(`  network tag: ${[...byNetwork.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => `${name || "(empty)"} (${count})`).join(", ")}`);
    lines.push("");
    lines.push("  Stations in OSM include tram and metro stops, so this is a map count, not the NS timetable.");
    return lines.join("\n");
}
/** Look a Dutch station up on Wikidata for the facts the rail API does not carry. */
export async function stationWikidataProfile(args) {
    const query = String(args?.name ?? "").trim();
    if (query.length < 2)
        throw new NsError("Give a station name, e.g. 'Amsterdam Centraal'.");
    const n = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 10);
    const search = await nsJson(`${NS_WIKIDATA}?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&uselang=en&type=item&limit=${n}&format=json`, {}, `a Wikidata search for "${query}"`);
    const hits = search.search ?? [];
    if (!hits.length)
        throw new NsError(`Wikidata has no item matching "${query}".`);
    const lines = [`Wikidata search for "${query}": ${hits.length} candidate item(s)`, ""];
    for (const hit of hits.slice(0, n)) {
        const id = String(hit.id ?? "");
        if (!id)
            continue;
        const entity = await nsJson(`${NS_WIKIDATA}?action=wbgetentities&ids=${encodeURIComponent(id)}&props=labels|descriptions|claims&languages=en&format=json`, {}, `Wikidata item ${id}`);
        const data = entity.entities?.[id];
        if (!data) {
            lines.push(`  ${id}  no entity body returned`);
            continue;
        }
        const label = data.labels?.en?.value ?? hit.label ?? id;
        const description = data.descriptions?.en?.value ?? hit.description ?? "no description";
        const coord = data.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
        const inception = data.claims?.P571?.[0]?.mainsnak?.datavalue?.value;
        const platformCount = data.claims?.P1107?.[0]?.mainsnak?.datavalue?.value;
        lines.push(`  ${id}  ${label}`);
        lines.push(`     ${description}`);
        lines.push(`     coordinates: ${coord?.latitude !== undefined && coord?.longitude !== undefined ? `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}` : "not reported"}`);
        lines.push(`     opened: ${inception?.time ? inception.time.replace(/^\+/, "").slice(0, 10) : "not reported"}`);
        lines.push(`     platform count: ${nsNumber(platformCount)}, ${Object.keys(data.claims ?? {}).length} distinct claim(s) on file`);
    }
    lines.push("");
    lines.push("  Wikidata is crowd-sourced and often thin on Dutch stations; an empty field means nobody has added it.");
    return lines.join("\n");
}
