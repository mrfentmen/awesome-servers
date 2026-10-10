/**
 * Space launches, satellites, radio frequencies, news and space weather - keyless.
 *
 * Upstreams:
 *   - rocketlaunch.live        upcoming launches worldwide
 *   - db.satnogs.org           satellite catalogue, TLE element sets, transmitters
 *   - spaceflightnewsapi.net   space news and blog posts
 *   - services.swpc.noaa.gov   NOAA space weather (Kp index, solar wind, scales)
 *
 * The Space Devs' Launch Library used to back this server, but it rate-limits
 * anonymous callers after a handful of requests, which cannot carry a paid
 * Actor. Celestrak was trialled for the orbit tools and dropped as well: it
 * refuses repeat group downloads for two hours at a time. Every source used
 * here answers without a key and without a per-caller quota.
 */
export class SpacedevsError extends Error {
    constructor(message) {
        super(message);
        this.name = "SpacedevsError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-spacedevs-mcp/1.0";
const LAUNCHES = "https://fdo.rocketlaunch.live/json/launches/next";
const SATNOGS = "https://db.satnogs.org/api";
const SFNEWS = "https://api.spaceflightnewsapi.net/v4";
const SWPC = "https://services.swpc.noaa.gov/products";
const EARTH_RADIUS_KM = 6378.137;
const EARTH_MU = 398600.4418;
const CATALOGUE_TTL_MS = 60 * 60 * 1000;
async function fetchJson(url, timeoutMs = 25000) {
    let res;
    try {
        res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(timeoutMs),
        });
    }
    catch (e) {
        throw new SpacedevsError(`Could not reach the data source: ${errorMessage(e)}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        throw new SpacedevsError(`Data source returned HTTP ${res.status}: ${body}`);
    }
    return (await res.json());
}
function utc(iso) {
    if (!iso)
        return "?";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
const LAUNCH_LIMIT_KEYLESS = 5;
function launchLink(l) {
    return l.slug ? `https://rocketlaunch.live/launch/${l.slug}` : "https://rocketlaunch.live";
}
/** How firm the T-0 is: a clock time, an opening window, or only a date. */
function scheduleConfidence(l) {
    if (l.win_open && l.t0)
        return `window opens ${utc(l.win_open)}`;
    if (l.est_date?.year)
        return "date is estimated, no clock time yet";
    return "scheduled time";
}
function padLine(l) {
    const pad = l.pad ?? {};
    const loc = pad.location ?? {};
    return [pad.name, loc.name, loc.state, loc.country].filter(Boolean).join(", ") || "pad not announced";
}
/** The summary already repeats temp and wind, so only its first line is kept. */
function weatherLine(l) {
    const raw = (l.weather_summary ?? "").trim();
    if (!raw)
        return null;
    const first = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0] ?? "";
    const condition = /^temp/i.test(first) ? "" : first;
    const temp = Number.isFinite(Number(l.weather_temp)) ? `${Math.round(Number(l.weather_temp))}F` : "";
    const wind = Number.isFinite(Number(l.weather_wind_mph))
        ? `wind ${Math.round(Number(l.weather_wind_mph))} mph`
        : "";
    return [condition, temp, wind].filter(Boolean).join(" · ") || null;
}
function formatLaunch(l, index) {
    const vehicle = l.vehicle?.name ?? "unknown vehicle";
    const provider = l.provider?.name ?? "unknown provider";
    const lines = [
        `${index}. ${l.name ?? "unnamed mission"} — ${vehicle} · ${provider}`,
        `   T-0 ${l.t0 ? utc(l.t0) : l.date_str ?? "date not announced"} (${scheduleConfidence(l)})`,
        `   pad ${padLine(l)}`,
    ];
    const weather = weatherLine(l);
    if (weather)
        lines.push(`   weather ${weather}`);
    const tags = (l.tags ?? []).map((t) => t.text).filter(Boolean);
    if (tags.length)
        lines.push(`   tags ${tags.join(", ")}`);
    lines.push(`   ${launchLink(l)}`);
    return lines;
}
async function launchFeed(limit) {
    // Above five the keyless feed caps itself, so ask for no more than that.
    const n = Math.max(1, Math.min(limit, LAUNCH_LIMIT_KEYLESS));
    const body = await fetchJson(`${LAUNCHES}/${n}`);
    const feed = body.response ?? body;
    if (feed.errors?.length)
        throw new SpacedevsError(feed.errors.join("; "));
    return feed.result ?? [];
}
export async function nextLaunches(limit = 5, provider) {
    const want = Math.max(1, Math.min(limit, 25));
    // The keyless feed tops out at five launches, so the provider filter can only
    // look at those five; say so rather than implying the whole schedule was read.
    const feed = await launchFeed(LAUNCH_LIMIT_KEYLESS);
    const matches = provider
        ? feed.filter((l) => (l.provider?.name ?? "").toLowerCase().includes(provider.toLowerCase()))
        : feed;
    if (!matches.length) {
        return provider
            ? `None of the next ${feed.length} launch(es) are from a provider matching "${provider}". Call again without a provider to see the schedule.`
            : "No upcoming launches are listed right now.";
    }
    const rows = matches.slice(0, want);
    const header = provider
        ? `Upcoming launches from providers matching "${provider}" — showing ${rows.length} of ${matches.length} in the next ${feed.length}:`
        : `Next ${rows.length} launch(es) worldwide (the keyless feed lists five at a time):`;
    return [header, "", ...rows.flatMap((l, i) => [...formatLaunch(l, i + 1), ""])].join("\n").trimEnd();
}
export async function launchCountdown() {
    const feed = await launchFeed(LAUNCH_LIMIT_KEYLESS);
    const now = Date.now();
    const upcoming = feed
        .filter((l) => l.t0 && !Number.isNaN(new Date(l.t0).getTime()))
        .sort((a, b) => new Date(a.t0).getTime() - new Date(b.t0).getTime());
    const next = upcoming.find((l) => new Date(l.t0).getTime() > now);
    if (!next) {
        return feed.length
            ? "Every listed launch has a T-0 in the past - the feed is being refreshed, try again shortly."
            : "No upcoming launches are listed right now.";
    }
    const t0 = new Date(next.t0).getTime();
    const minutes = Math.round((t0 - now) / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const away = [days ? `${days}d` : "", hours ? `${hours}h` : "", `${minutes % 60}m`].filter(Boolean).join(" ");
    const mission = (next.mission_description ?? next.launch_description ?? "").replace(/\s+/g, " ").trim();
    const lines = [
        `Next launch in ${away}`,
        `  ${next.name ?? "unnamed mission"} — ${next.vehicle?.name ?? "unknown vehicle"} · ${next.provider?.name ?? "unknown provider"}`,
        `  T-0 ${utc(next.t0)}`,
        `  pad ${padLine(next)}`,
        `  ${scheduleConfidence(next)}`,
    ];
    const weather = weatherLine(next);
    if (weather)
        lines.push(`  weather ${weather}`);
    if (mission)
        lines.push(`  mission ${mission.slice(0, 400)}${mission.length > 400 ? " …" : ""}`);
    lines.push(`  ${launchLink(next)}`);
    const following = upcoming.filter((l) => new Date(l.t0).getTime() > t0).slice(0, 3);
    if (following.length) {
        lines.push("", "After that:");
        for (const l of following) {
            lines.push(`  ${utc(l.t0)} — ${l.name ?? "unnamed"} (${l.vehicle?.name ?? "?"} · ${l.provider?.name ?? "?"})`);
        }
    }
    return lines.join("\n");
}
let catalogueCache = null;
/** The whole SatNOGS catalogue is one 1.5 MB call; hold it for the hour. */
async function satelliteCatalogue() {
    if (catalogueCache && Date.now() - catalogueCache.at < CATALOGUE_TTL_MS)
        return catalogueCache.rows;
    const rows = await fetchJson(`${SATNOGS}/satellites/?format=json`);
    catalogueCache = { at: Date.now(), rows };
    return rows;
}
async function satelliteMeta(noradId) {
    const rows = await fetchJson(`${SATNOGS}/satellites/?format=json&norad_cat_id=${noradId}`);
    return rows[0] ?? null;
}
function orbitFacts(meanMotion, ecc, inclination) {
    const periodMin = 1440 / meanMotion;
    const n = (meanMotion * 2 * Math.PI) / 86400;
    const a = Math.cbrt(EARTH_MU / (n * n));
    const apogeeKm = a * (1 + ecc) - EARTH_RADIUS_KM;
    const perigeeKm = a * (1 - ecc) - EARTH_RADIUS_KM;
    const velocityKmS = Math.sqrt(EARTH_MU / a);
    let orbitClass;
    if (ecc > 0.25 && perigeeKm < 2000)
        orbitClass = "highly elliptical (HEO)";
    else if (perigeeKm < 2000)
        orbitClass = "low Earth orbit (LEO)";
    else if (perigeeKm < 35000)
        orbitClass = "medium Earth orbit (MEO)";
    else if (Math.abs(periodMin - 1436) <= 30 && ecc < 0.05) {
        orbitClass = inclination < 5 ? "geostationary (GEO)" : "inclined geosynchronous (GSO)";
    }
    else
        orbitClass = "high orbit (HEO/GEO band)";
    return { periodMin, apogeeKm, perigeeKm, velocityKmS, orbitClass };
}
/** TLE line 2 is fixed-width: columns are defined by the format, not by spaces. */
function parseTle(line2) {
    const meanMotion = Number(line2.slice(52, 63));
    const ecc = Number(`0.${line2.slice(26, 33).trim()}`);
    const inclination = Number(line2.slice(8, 16));
    if (!Number.isFinite(meanMotion) || meanMotion <= 0 || !Number.isFinite(ecc) || !Number.isFinite(inclination)) {
        throw new SpacedevsError("Could not read the orbital element set for this satellite.");
    }
    return {
        inclination,
        raan: Number(line2.slice(17, 25)),
        ecc,
        argPerigee: Number(line2.slice(34, 42)),
        meanAnomaly: Number(line2.slice(43, 51)),
        meanMotion,
        revNumber: Number(line2.slice(63, 68)),
    };
}
/** SatNOGS writes Python's None into empty fields, so it is treated as blank. */
function str(value) {
    if (!value)
        return "";
    const trimmed = value.trim();
    return !trimmed || trimmed === "None" || trimmed === "null" ? "" : trimmed;
}
function metaLine(meta) {
    if (!meta)
        return "catalogue entry not found";
    const bits = [
        str(meta.status) ? `status ${str(meta.status)}` : "",
        str(meta.operator) ? `operator ${str(meta.operator)}` : "",
        str(meta.countries) ? `country ${str(meta.countries)}` : "",
        str(meta.launched) ? `launched ${str(meta.launched).slice(0, 10)}` : "",
    ].filter(Boolean);
    return bits.join(" · ") || "no catalogue details";
}
export async function satelliteSearch(query, limit = 10) {
    const want = Math.max(1, Math.min(limit, 25));
    const needle = query.trim().toLowerCase();
    if (needle.length < 2)
        return "Search needs at least two characters, e.g. 'ISS' or 'NOAA'.";
    const rows = await satelliteCatalogue();
    const matches = rows.filter((s) => str(s.name).toLowerCase().includes(needle) || str(s.names).toLowerCase().includes(needle));
    if (!matches.length)
        return `No satellite in the catalogue matches "${query}". Try a shorter prefix.`;
    const lines = [
        matches.length > want
            ? `${matches.length} satellite(s) match "${query}" — showing the first ${want}:`
            : `${matches.length} satellite(s) match "${query}":`,
        "",
    ];
    for (const s of matches.slice(0, want)) {
        lines.push(`${str(s.name) || "unnamed"} — NORAD ${s.norad_cat_id ?? "?"}`, `   ${metaLine(s)}`);
    }
    return lines.join("\n");
}
export async function satelliteOrbit(noradId) {
    const [tleRows, meta] = await Promise.all([
        fetchJson(`${SATNOGS}/tle/?format=json&norad_cat_id=${noradId}`),
        satelliteMeta(noradId),
    ]);
    const tle = tleRows[0];
    if (!tle?.tle2) {
        return `No orbital element set for NORAD catalog number ${noradId}. Search the satellite by name first to check the number.`;
    }
    const parsed = parseTle(tle.tle2);
    const facts = orbitFacts(parsed.meanMotion, parsed.ecc, parsed.inclination);
    return [
        `${str(meta?.name) || str(tle.tle0) || "satellite"} — NORAD ${noradId}`,
        `  ${metaLine(meta)}`,
        `  orbit class               ${facts.orbitClass}`,
        `  element set updated       ${utc(tle.updated)}${tle.tle_source ? ` (source ${tle.tle_source})` : ""}`,
        `  inclination               ${parsed.inclination.toFixed(2)}°`,
        `  eccentricity              ${parsed.ecc.toFixed(5)}`,
        `  period                    ${facts.periodMin.toFixed(1)} min (${parsed.meanMotion.toFixed(3)} rev/day)`,
        `  apogee / perigee          ${facts.apogeeKm.toFixed(1)} km / ${facts.perigeeKm.toFixed(1)} km`,
        `  mean orbital velocity     ${facts.velocityKmS.toFixed(2)} km/s`,
        `  right ascension / arg.    ${parsed.raan.toFixed(2)}° / ${parsed.argPerigee.toFixed(2)}°`,
        `  mean anomaly              ${parsed.meanAnomaly.toFixed(2)}°`,
        `  revolutions at epoch      ${Number.isFinite(parsed.revNumber) ? parsed.revNumber : "?"}`,
    ].join("\n");
}
function mhz(hz) {
    return typeof hz === "number" ? `${(hz / 1e6).toFixed(4)} MHz` : "";
}
export async function satelliteFrequencies(noradId, limit = 10) {
    const want = Math.max(1, Math.min(limit, 25));
    const tleRows = await fetchJson(`${SATNOGS}/tle/?format=json&norad_cat_id=${noradId}`);
    const satId = tleRows[0]?.sat_id;
    if (!satId)
        return `Nothing is known about NORAD catalog number ${noradId} in the SatNOGS database.`;
    const rows = await fetchJson(`${SATNOGS}/transmitters/?format=json&sat_id=${encodeURIComponent(satId)}`);
    if (!rows.length)
        return `No transmitter records for NORAD ${noradId} (${satId}).`;
    const alive = rows.filter((t) => t.alive);
    const shown = (alive.length ? alive : rows).slice(0, want);
    const lines = [
        `Transmitters for NORAD ${noradId} — ${rows.length} record(s), ${alive.length} active` +
            (shown.length < (alive.length || rows.length) ? ` (showing ${shown.length}):` : ":"),
        "",
    ];
    for (const t of shown) {
        const up = t.uplink_low ? `uplink ${mhz(t.uplink_low)}${t.uplink_high ? ` - ${mhz(t.uplink_high)}` : ""}` : "";
        const down = t.downlink_low
            ? `downlink ${mhz(t.downlink_low)}${t.downlink_high ? ` - ${mhz(t.downlink_high)}` : ""}`
            : "";
        const mode = t.mode ? `mode ${t.mode}${t.baud ? ` at ${t.baud} baud` : ""}` : "";
        lines.push(`  ${t.description ?? t.type ?? "transmitter"} ${t.alive ? "[active]" : "[inactive]"}`, `     ${[up, down, mode].filter(Boolean).join(" · ") || "frequencies not recorded"}`);
    }
    return lines.join("\n");
}
async function newsFeed(kind, query, limit) {
    const want = Math.max(1, Math.min(limit, 15));
    const url = new URL(`${SFNEWS}/${kind}`);
    url.searchParams.set("limit", String(want));
    if (query)
        url.searchParams.set("search", query);
    const feed = await fetchJson(url.toString());
    const items = feed.results ?? [];
    if (!items.length)
        return query ? `Nothing in space ${kind} matches "${query}".` : `No space ${kind} are listed right now.`;
    const label = kind === "articles" ? "Space news" : "Space blog posts";
    const lines = [
        query
            ? `${label} matching "${query}" — ${items.length} of ${feed.count ?? items.length}:`
            : `Latest ${label} — ${items.length} of ${feed.count ?? items.length}:`,
        "",
    ];
    for (const item of items) {
        const byline = item.authors?.map((a) => a.name).filter(Boolean).join(", ");
        lines.push(`${item.title ?? "untitled"}`, `   ${item.news_site ?? "unknown site"} · ${utc(item.published_at)}${byline ? ` · ${byline}` : ""}`);
        const summary = (item.summary ?? "").replace(/\s+/g, " ").trim();
        if (summary)
            lines.push(`   ${summary.slice(0, 300)}${summary.length > 300 ? " …" : ""}`);
        lines.push(`   ${item.url ?? ""}`);
    }
    return lines.join("\n");
}
export function spaceNews(query, limit = 5) {
    return newsFeed("articles", query, limit);
}
export function spaceBlogs(query, limit = 5) {
    return newsFeed("blogs", query, limit);
}
function kpMeaning(kp) {
    if (kp < 4)
        return "quiet";
    if (kp < 5)
        return "active";
    if (kp < 6)
        return "minor storm (G1)";
    if (kp < 7)
        return "moderate storm (G2)";
    if (kp < 8)
        return "strong storm (G3)";
    if (kp < 9)
        return "severe storm (G4)";
    return "extreme storm (G5)";
}
export async function spaceWeather() {
    const [forecast, wind, mag, scales] = await Promise.all([
        fetchJson(`${SWPC}/noaa-planetary-k-index-forecast.json`),
        fetchJson(`${SWPC}/summary/solar-wind-speed.json`),
        fetchJson(`${SWPC}/summary/solar-wind-mag-field.json`),
        fetchJson(`${SWPC}/noaa-scales.json`),
    ]);
    const observed = forecast.filter((r) => (r.observed ?? "").startsWith("observed") && typeof r.kp === "number");
    const predicted = forecast.filter((r) => (r.observed ?? "").startsWith("predicted") && typeof r.kp === "number");
    const latest = observed[observed.length - 1];
    const peakObserved = observed.reduce((max, r) => Math.max(max, r.kp), -Infinity);
    const peakPredicted = predicted.reduce((best, r) => (!best || r.kp > best.kp ? { kp: r.kp, at: utc(r.time_tag) } : best), null);
    const current = scales["-1"] ?? {};
    const stamp = `${str(current.DateStamp)} ${str(current.TimeStamp)}`.trim();
    const lines = [
        `Space weather now — latest Kp reading ${utc(latest?.time_tag)}`,
        "",
        `  Kp index          ${Number(latest?.kp ?? 0).toFixed(2)} (${kpMeaning(Number(latest?.kp ?? 0))})`,
        `  solar wind        ${wind[0]?.proton_speed ?? "?"} km/s, |B| ${mag[0]?.bt ?? "?"} nT, Bz ${mag[0]?.bz_gsm ?? "?"} nT`,
        `  NOAA scales       radio R${current.R?.Scale ?? "0"} (${current.R?.Text ?? "none"}), solar S${current.S?.Scale ?? "0"} (${current.S?.Text ?? "none"}), geomagnetic G${current.G?.Scale ?? "0"} (${current.G?.Text ?? "none"})${stamp ? ` as of ${stamp} UTC` : ""}`,
    ];
    if (Number.isFinite(peakObserved)) {
        lines.push(`  peak Kp observed  ${peakObserved.toFixed(2)} (${kpMeaning(peakObserved)})`);
    }
    if (peakPredicted) {
        lines.push(`  forecast peak Kp  ${peakPredicted.kp.toFixed(2)} (${kpMeaning(peakPredicted.kp)}) around ${peakPredicted.at}`);
    }
    lines.push("", "Kp 5 or above means aurora is likely at high latitudes; Kp 7 or above can affect satellites and power grids.");
    return lines.join("\n");
}
// ---- batch-2 tools: extra live-data tools (2026-09-26) ----
// ------------------------------------------------- Launch Library 2 (reference data)
//
// The launch tools above use rocketlaunch.live because Launch Library 2 hands out a
// small anonymous quota. The reference data below (agencies, astronauts, vehicles,
// events) only exists there, so it reads the production host first and drops to the
// development mirror, which serves the same schema without a quota, when production
// answers 429 or a server error.
const LL2_PRODUCTION = "https://ll.thespacedevs.com/2.2.0";
const LL2_DEV = "https://lldev.thespacedevs.com/2.2.0";
const retryable = (e) => /HTTP (429|5\d\d)/.test(errorMessage(e));
async function ll2(path, params = {}) {
    const pairs = Object.entries({ ...params, mode: "list" }).map(([key, value]) => [key, String(value)]);
    const query = new URLSearchParams(pairs).toString();
    try {
        return await fetchJson(`${LL2_PRODUCTION}${path}?${query}`, 30000);
    }
    catch (e) {
        if (!retryable(e))
            throw e;
        return await fetchJson(`${LL2_DEV}${path}?${query}`, 30000);
    }
}
async function ll2Detail(path) {
    try {
        return await fetchJson(`${LL2_PRODUCTION}${path}?mode=list`, 30000);
    }
    catch (e) {
        if (!retryable(e))
            throw e;
        return await fetchJson(`${LL2_DEV}${path}?mode=list`, 30000);
    }
}
/** ISO-8601 durations from Launch Library 2, as a plain day/hour figure. */
function isoDuration(value) {
    if (!value)
        return "?";
    const match = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
    if (!match)
        return value;
    const days = Number(match[1] ?? 0) * 365 + Number(match[2] ?? 0) * 30 + Number(match[3] ?? 0);
    const hours = Number(match[4] ?? 0);
    if (!days && !hours) {
        const minutes = Number(match[5] ?? 0);
        return minutes ? `${minutes} min` : "0";
    }
    return `${days} day(s) ${hours} h`.replace(" 0 h", "");
}
const clip = (value, max = 220) => {
    const clean = String(value ?? "").replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};
/** Launch Library 2 quotes launch cost as a raw figure string. */
const usd = (value) => {
    if (!value)
        return null;
    const figure = Number(String(value).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(figure) || figure <= 0)
        return String(value);
    return `$${figure.toLocaleString("en-US")}`;
};
export async function spaceAgencies(query, type, limit = 10) {
    const search = String(query ?? "").trim();
    const wanted = String(type ?? "").trim().toLowerCase();
    const page = await ll2("/agencies/", {
        limit: wanted ? 50 : Math.min(Math.max(limit, 1), 25),
        ...(search ? { search } : {}),
    });
    const rows = (page.results ?? []).filter((row) => !wanted || String(row.type ?? "").toLowerCase().includes(wanted));
    if (!rows.length) {
        return `No Launch Library 2 agencies match${search ? ` "${search}"` : ""}${wanted ? ` of type ${type}` : ""}.`;
    }
    const total = page.count ?? rows.length;
    const scope = [search ? `"${search}"` : "", wanted ? `type ${type}` : ""].filter(Boolean).join(", ");
    return `Space agencies${scope ? ` (${scope})` : ""} — ${rows.length} shown of ${total} in Launch Library 2:\n` +
        rows.slice(0, limit).map((row, i) => `${i + 1}. ${row.name ?? "?"}${row.abbrev ? ` (${row.abbrev})` : ""} | ${row.type ?? "type n/a"} | ${row.country_code ?? "country n/a"}` +
            `${row.featured ? " | featured" : ""} | agency id ${row.id ?? "?"}` +
            `${row.description ? `\n   ${clip(row.description)}` : ""}`).join("\n");
}
export async function astronauts(query, inSpace, limit = 10) {
    const search = String(query ?? "").trim();
    const page = await ll2("/astronaut/", {
        limit: inSpace ? 100 : Math.min(Math.max(limit, 1), 25),
        ...(search ? { search } : {}),
    });
    const rows = (page.results ?? []).filter((row) => inSpace !== true || row.in_space === true);
    if (!rows.length) {
        return `No Launch Library 2 astronauts match${search ? ` "${search}"` : ""}${inSpace ? " that are currently in space" : ""}.`;
    }
    const total = page.count ?? rows.length;
    const scope = [search ? `"${search}"` : "", inSpace ? "currently in space" : ""].filter(Boolean).join(", ");
    return `Astronauts${scope ? ` (${scope})` : ""} — ${rows.length} shown of ${total} in Launch Library 2:\n` +
        rows.slice(0, limit).map((row, i) => `${i + 1}. ${row.name ?? "?"} | ${row.agency ?? "agency n/a"} | ${row.nationality ?? "nationality n/a"}` +
            ` | ${row.status?.name ?? "status n/a"}${row.in_space ? " | IN SPACE now" : ""}` +
            `\n   time in space ${isoDuration(row.time_in_space)}, spacewalks ${isoDuration(row.eva_time)} | astronaut id ${row.id ?? "?"}`).join("\n");
}
export async function launchVehicles(query, limit = 5) {
    const needle = String(query ?? "").trim();
    if (!needle)
        throw new SpacedevsError("query is required, e.g. 'Falcon 9' or 'Ariane'.");
    const page = await ll2("/config/launcher/", { search: needle, limit: 10 });
    const rows = page.results ?? [];
    if (!rows.length)
        return `No Launch Library 2 launch vehicles match "${query}".`;
    const best = rows[0];
    // The spec sheet needs a second call; if it fails the match list still answers.
    let detail = null;
    if (best.id) {
        try {
            detail = await ll2Detail(`/config/launcher/${best.id}/`);
        }
        catch {
            detail = null;
        }
    }
    const vehicle = detail ?? best;
    const maker = typeof vehicle.manufacturer === "string" ? vehicle.manufacturer : vehicle.manufacturer?.name;
    const stages = vehicle.min_stage && vehicle.max_stage ? `${vehicle.min_stage}-${vehicle.max_stage}` : undefined;
    const spec = [
        `Rocket: ${vehicle.full_name ?? vehicle.name ?? "?"}${vehicle.family ? ` (${vehicle.family} family${vehicle.variant ? `, ${vehicle.variant}` : ""})` : ""}`,
        `Manufacturer: ${maker ?? "not listed"}${vehicle.reusable == null ? "" : ` | reusable: ${vehicle.reusable ? "yes" : "no"}`}${stages ? ` | stages: ${stages}` : ""}`,
        `Size: length ${vehicle.length ?? "?"} m, diameter ${vehicle.diameter ?? "?"} m, launch mass ${vehicle.launch_mass ?? "?"} t`,
        `Payload: LEO ${vehicle.leo_capacity ?? "?"} kg | GTO ${vehicle.gto_capacity ?? "?"} kg${usd(vehicle.launch_cost) ? ` | launch cost ${usd(vehicle.launch_cost)}` : ""}`,
        `Flights: ${vehicle.successful_launches ?? "?"} successful, ${vehicle.failed_launches ?? "?"} failed, ${vehicle.pending_launches ?? "?"} upcoming` +
            `${vehicle.maiden_flight ? ` | maiden flight ${String(vehicle.maiden_flight).slice(0, 10)}` : ""}`,
        vehicle.description ? clip(vehicle.description, 400) : "",
    ].filter(Boolean);
    const others = rows.slice(1, limit + 1);
    return `Launch vehicle matches for "${query}" (${rows.length} of ${page.count ?? rows.length} in Launch Library 2):\n\n` +
        spec.join("\n") +
        (others.length
            ? `\n\nOther matches:\n` +
                others.map((row, i) => `${i + 1}. ${row.full_name ?? row.name ?? "?"} | id ${row.id ?? "?"}`).join("\n")
            : "");
}
export async function upcomingEvents(eventType, limit = 10) {
    const wanted = String(eventType ?? "").trim().toLowerCase();
    const page = await ll2("/event/upcoming/", { limit: wanted ? 25 : Math.min(Math.max(limit, 1), 25) });
    const rows = (page.results ?? []).filter((row) => !wanted || String(row.type?.name ?? "").toLowerCase().includes(wanted));
    if (!rows.length) {
        return `No upcoming Launch Library 2 events${wanted ? ` of type "${eventType}"` : ""} right now.`;
    }
    const total = page.count ?? rows.length;
    return `Upcoming space events${wanted ? ` (type ${eventType})` : ""} — ${rows.length} shown of ${total} in Launch Library 2:\n` +
        rows.slice(0, limit).map((row, i) => `${i + 1}. ${utc(row.date)} | ${row.name ?? "?"} | ${row.type?.name ?? "type n/a"}${row.webcast_live ? " | LIVE webcast" : ""}` +
            `\n   ${row.location ?? "location n/a"}${row.program?.length ? ` | ${row.program.map((entry) => entry.name).filter(Boolean).join(', ')}` : ""}` +
            `${row.description ? `\n   ${clip(row.description)}` : ""}`).join("\n");
}
// ---- muxH tools:
// space_weather reports the Kp index, the solar wind and the NOAA scales, which
// is the state of the geomagnetic field right now. These two read the two
// products that describe the sun and the aurora instead: the 10.7 cm solar radio
// flux that drives HF propagation, and the global aurora oval forecast grid.
const SD_UA = "mcfentmen-spacedevs-mcp/1.1 (https://github.com/mcfentmen/spacedevs-mcp)";
const SWPC_JSON = "https://services.swpc.noaa.gov/json";
async function swpcJson(path) {
    let res;
    try {
        res = await fetch(`${SWPC_JSON}/${path}`, {
            headers: { "User-Agent": SD_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new SpacedevsError(`Could not reach NOAA's space weather service: ${e.message}`);
    }
    if (!res.ok)
        throw new SpacedevsError(`NOAA space weather service returned HTTP ${res.status}.`);
    return (await res.json());
}
/** The conventional quiet/unsettled/active/strong bands for the 10.7 cm flux. */
const fluxBand = (flux) => {
    if (flux < 70)
        return "quiet (below 70 sfu)";
    if (flux < 100)
        return "unsettled (70-99 sfu)";
    if (flux < 120)
        return "active, M-class (100-119 sfu)";
    if (flux < 150)
        return "active, strong M-class (120-149 sfu)";
    return "high, near X-class conditions (150 sfu and above)";
};
/**
 * How far south the aurora will be visible, read from NOAA's own global aurora
 * grid. The published product is 65,160 latitude/longitude points each carrying an
 * intensity, which no one reads directly; this reduces it to the equatorward edge
 * and the latitude bands that carry the oval.
 */
export async function auroraReach(args) {
    const raw = Math.min(Math.max(Number(args.threshold ?? 3) || 3, 1), 15);
    const grid = await swpcJson("ovation_aurora_latest.json");
    const points = grid.coordinates ?? [];
    if (!points.length) {
        throw new SpacedevsError("NOAA returned an aurora forecast with no coordinate points.");
    }
    const lats = points.map((p) => p[1]);
    const lons = points.map((p) => p[0]);
    const values = points.map((p) => p[2]);
    const peak = Math.max(...values);
    const atLeast = (t) => values.filter((v) => v >= t).length;
    // The grid is northern-hemisphere heavy but includes a southern oval, so both are reported.
    // The published grid carries a latitude-0 row that duplicates the oval and sits at
    // intensity 4 while its neighbours at -5 and +5 are all zero. It is a seam artefact
    // of the mesh, not a latitude band, so it is excluded from every figure below.
    const seam = points.filter((p) => p[1] === 0).length;
    const north = points.filter((p) => p[1] > 0);
    const south = points.filter((p) => p[1] < 0);
    const edge = (subset, t) => {
        const hit = subset.filter((p) => p[2] >= t);
        return hit.length ? Math.min(...hit.map((p) => Math.abs(p[1]))) : null;
    };
    const bands = [];
    for (let lat = 90; lat >= 40; lat -= 5) {
        const inBand = points.filter((p) => p[1] > 0 && p[1] >= lat - 5 && p[1] < lat);
        if (!inBand.length)
            continue;
        const strong = inBand.filter((p) => p[2] >= raw);
        const strongLons = strong.map((p) => ((p[0] + 180) % 360) - 180).sort((a, b) => a - b);
        const gaps = strongLons.length
            ? strongLons.slice(1).reduce((widest, lon, i) => Math.max(widest, lon - strongLons[i]), 0)
            : 360;
        bands.push({ from: lat, to: lat - 5, active: strong.length, peak: Math.max(...inBand.map((p) => p[2])), lons: strong.length ? gaps : 0 });
    }
    const northEdge = edge(north, raw);
    const southEdge = edge(south, raw);
    const southLow = Math.min(...south.map((p) => p[1]));
    return [
        `Aurora oval reach, NOAA ovation forecast`,
        `  observed ${grid["Observation Time"] ?? "not reported"} | valid ${grid["Forecast Time"] ?? "not reported"}`,
        `  ${points.length} grid point(s) from ${Math.min(...lats)}\u00b0 to ${Math.max(...lats)}\u00b0, ${Math.min(...lons)}\u00b0 to ${Math.max(...lons)}\u00b0, peak intensity ${peak}`,
        "",
        `Equatorward edge at intensity >= ${raw}:`,
        `  northern oval reaches ${northEdge === null ? "no northern point at this intensity" : `${northEdge.toFixed(0)}\u00b0N`}`,
        `  southern oval reaches ${southEdge === null ? `no southern point at this intensity (the grid's southern limit is ${southLow.toFixed(0)}\u00b0)` : `${Math.abs(southEdge).toFixed(0)}\u00b0S`}`,
        "",
        `Points at or above the threshold, by intensity:`,
        ...[1, 2, 3, 5, 8, 12].filter((t) => t <= Math.max(peak, 1)).map((t) => `  >= ${String(t).padStart(2)}   ${String(atLeast(t)).padStart(6)} point(s)  ${((atLeast(t) / points.length) * 100).toFixed(2)}% of the grid`),
        "",
        "Latitude bands, strongest first, 5 degrees each:",
        ...bands
            .filter((b) => b.active > 0)
            .sort((a, b) => b.active - a.active)
            .map((b) => `  ${String(b.from).padStart(2)}\u00b0 to ${String(b.to).padStart(2)}\u00b0N  ${String(b.active).padStart(4)} point(s) at >= ${raw}  band peak ${String(b.peak).padStart(2)}  ${"#".repeat(Math.min(40, Math.round((b.active / 40) * 40)))}` +
            (b.lons ? `  widest gap ${b.lons.toFixed(0)}\u00b0` : "")),
        "",
        `Grid density: a 5-degree band holds ${points.filter((p) => p[1] >= 50 && p[1] < 55).length} grid point(s), so small counts are real absence rather than missing data. The ${seam} point(s) on the latitude-0 row are excluded: that row reports intensity ${Math.max(...points.filter((p) => p[1] === 0).map((p) => p[2]), 0)} while the rows at -5 and +5 report zero, which is a mesh seam rather than an auroral band.`,
        "",
        `Read the edge as the equatorward limit of the modelled oval at intensity ${raw}, not as an observation: this is a forecast grid published on a one-degree mesh, and visibility depends on cloud, local horizon and dark sky as much as on the oval.`,
    ].join("\n");
}
