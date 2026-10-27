export class ShootProofError extends Error {
    constructor(message) {
        super(message);
        this.name = "ShootProofError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.shootproof.com/studio";
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new ShootProofError(`Set the ${name} environment variable.`);
    return v;
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(path) {
    const res = await fetch(BASE + path, {
        signal: AbortSignal.timeout(30000),
        headers: {
            ...UA,
            Authorization: "Bearer " + envStrict("SHOOTPROOF_ACCESS_TOKEN"),
            Accept: "application/vnd.shootproof+json",
        },
    });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new ShootProofError(`HTTP ${res.status}: ${detail}`);
    }
    return pretty(data);
}
export function getServiceDescription() {
    return req("");
}
export function getMe() {
    return req("/me");
}
export function listBrands() {
    return req("/brand");
}
export function listBrandEvents(brandId) {
    return req(`/brand/${encodeURIComponent(brandId)}/event`);
}
export function listBrandOrders(brandId) {
    return req(`/brand/${encodeURIComponent(brandId)}/order`);
}
// ---- muxH tools:
// ShootProof books shoots, and the first question about any shoot is when the
// light is. Sunrise-sunset.org publishes solar geometry keylessly for any
// coordinate, so these two answer it without an account and without guessing.
const SUN = "https://api.sunrise-sunset.org";
const SP_UA = "shootproof-mcp/1.1 (https://github.com/mcfentmen/shootproof-mcp)";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// The service answers 1970-01-01T00:00:01 when the sun never rises or never
// sets on the requested date, which is a real answer and must not be printed as
// if it were a time of day.
const POLAR_SENTINEL = "1970-01-01T00:00:01";
function checkCoords(args) {
    const lat = Number(args.lat);
    const lon = Number(args.lon);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        throw new ShootProofError("lat must be a number between -90 and 90.");
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        throw new ShootProofError("lon must be a number between -180 and 180.");
    }
    return { lat, lon };
}
function checkDate(input) {
    const date = (input ?? "").trim();
    if (!ISO_DATE.test(date))
        throw new ShootProofError(`date must be YYYY-MM-DD, got "${date}".`);
    if (!Number.isFinite(Date.parse(`${date}T00:00:00Z`))) {
        throw new ShootProofError(`"${date}" is not a real calendar date.`);
    }
    return date;
}
async function sunFor(lat, lon, date) {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lon), date, formatted: "0" });
    let body = null;
    let lastError = "";
    // The service returns a 404 both for a bad coordinate and, intermittently,
    // for a healthy one, so a 404 is retried before it is believed.
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        let res;
        try {
            res = await fetch(`${SUN}/json?${params}`, {
                headers: { Accept: "application/json", "User-Agent": SP_UA },
                signal: AbortSignal.timeout(25000),
            });
        }
        catch (e) {
            lastError = e instanceof Error ? e.message : String(e);
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
        }
        if (res.ok) {
            body = (await res.json());
            break;
        }
        lastError = `HTTP ${res.status} ${res.statusText}`;
        if (res.status !== 404 && res.status < 500)
            break;
        await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    const answer = body;
    if (!answer)
        throw new ShootProofError(`The solar service did not answer for ${lat}, ${lon} on ${date}: ${lastError}`);
    if (answer.status && answer.status !== "OK")
        throw new ShootProofError(`Solar service answered "${answer.status}".`);
    if (!answer.results)
        throw new ShootProofError("The solar service returned no results.");
    return answer.results;
}
const clock = (value) => typeof value === "string" && !value.startsWith("1970-") ? value.slice(11, 19) : "n/a";
const polarNote = (results) => {
    const sunUp = typeof results.sunrise === "string" && !results.sunrise.startsWith("1970-");
    const sunDown = typeof results.sunset === "string" && !results.sunset.startsWith("1970-");
    if (sunUp && sunDown)
        return "";
    return sunUp
        ? "the sun sets but never rises on this date at this latitude, which is polar night; there is no daylight at all"
        : "the sun rises but never sets on this date at this latitude, which is midnight sun; there is no darkness at all";
};
const durationOf = (results) => {
    const raw = results.day_length;
    const seconds = typeof raw === "number" ? raw : Number(String(raw ?? "").split(":").reduce((acc, part) => acc * 60 + (Number(part) || 0), 0));
    return Number.isFinite(seconds) && seconds > 0 && seconds < 86400 ? seconds : 0;
};
const hoursMinutes = (seconds) => {
    if (!seconds)
        return "not reported";
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return `${h}h ${String(m).padStart(2, "0")}m`;
};
// The solar service publishes sunrise, sunset and the three twilight boundaries,
// but not the golden and blue hours, so those are computed here from the sun's
// actual elevation (NOAA solar position) instead of being guessed from offsets.
const DEG = Math.PI / 180;
const GOLDEN_LOW = -4;
const GOLDEN_HIGH = 6;
const BLUE_LOW = -6;
const BLUE_HIGH = -4;
function solarElevation(lat, lon, ms) {
    const julianDay = ms / 86400000 + 2440587.5;
    const T = (julianDay - 2451545) / 36525;
    const meanLongitude = ((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360 + 360) % 360;
    const meanAnomaly = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const eccentricity = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const center = Math.sin(meanAnomaly * DEG) * (1.914602 - T * (0.004817 + 0.000014 * T))
        + Math.sin(2 * meanAnomaly * DEG) * (0.019993 - 0.000101 * T)
        + Math.sin(3 * meanAnomaly * DEG) * 0.000289;
    const trueLongitude = meanLongitude + center;
    const omega = 125.04 - 1934.136 * T;
    const apparentLongitude = trueLongitude - 0.00569 - 0.00478 * Math.sin(omega * DEG);
    const meanObliquity = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const obliquity = meanObliquity + 0.00256 * Math.cos(omega * DEG);
    const declination = Math.asin(Math.sin(obliquity * DEG) * Math.sin(apparentLongitude * DEG));
    const y = Math.tan((obliquity * DEG) / 2) ** 2;
    const equationOfTime = (4 / DEG) * (y * Math.sin(2 * meanLongitude * DEG)
        - 2 * eccentricity * Math.sin(meanAnomaly * DEG)
        + 4 * eccentricity * y * Math.sin(meanAnomaly * DEG) * Math.cos(2 * meanLongitude * DEG)
        - 0.5 * y * y * Math.sin(4 * meanLongitude * DEG)
        - 1.25 * eccentricity * eccentricity * Math.sin(2 * meanAnomaly * DEG));
    const clock = new Date(ms);
    const minutesUtc = clock.getUTCHours() * 60 + clock.getUTCMinutes() + clock.getUTCSeconds() / 60;
    const trueSolarMinutes = ((minutesUtc + equationOfTime + 4 * lon) % 1440 + 1440) % 1440;
    const hourAngle = trueSolarMinutes / 4 - 180;
    const cosZenith = Math.sin(lat * DEG) * Math.sin(declination)
        + Math.cos(lat * DEG) * Math.cos(declination) * Math.cos(hourAngle * DEG);
    return 90 - Math.acos(Math.min(1, Math.max(-1, cosZenith))) / DEG;
}
function elevationSamples(lat, lon, dayStartMs) {
    const samples = [];
    for (let minute = 0; minute <= 1440; minute += 1) {
        const t = dayStartMs + minute * 60000;
        samples.push({ t, elevation: solarElevation(lat, lon, t) });
    }
    return samples;
}
/** First minute the sun crosses a threshold, or null when it never does that day. */
function crossingAt(samples, threshold, rising) {
    for (let i = 1; i < samples.length; i += 1) {
        const before = samples[i - 1];
        const after = samples[i];
        const crossed = rising
            ? before.elevation < threshold && after.elevation >= threshold
            : before.elevation >= threshold && after.elevation < threshold;
        if (!crossed)
            continue;
        const span = after.elevation - before.elevation;
        const fraction = span === 0 ? 0 : (threshold - before.elevation) / span;
        return before.t + fraction * 60000;
    }
    return null;
}
function windowPair(start, end) {
    if (start === null || end === null || end <= start)
        return null;
    const label = (ms) => new Date(ms).toISOString().slice(11, 16);
    return { start, end, text: `${label(start)}–${label(end)} UTC (${Math.round((end - start) / 60000)} min)` };
}
function lightWindows(lat, lon, date) {
    const dayStart = Date.parse(`${date}T00:00:00Z`);
    if (!Number.isFinite(dayStart))
        throw new ShootProofError(`"${date}" is not a usable date.`);
    const samples = elevationSamples(lat, lon, dayStart);
    const goldenMorning = windowPair(crossingAt(samples, GOLDEN_LOW, true), crossingAt(samples, GOLDEN_HIGH, true));
    const goldenEvening = windowPair(crossingAt(samples, GOLDEN_HIGH, false), crossingAt(samples, GOLDEN_LOW, false));
    const blueMorning = windowPair(crossingAt(samples, BLUE_LOW, true), crossingAt(samples, BLUE_HIGH, true));
    const blueEvening = windowPair(crossingAt(samples, BLUE_HIGH, false), crossingAt(samples, BLUE_LOW, false));
    const goldenMinutes = (goldenMorning ? (goldenMorning.end - goldenMorning.start) / 60000 : 0)
        + (goldenEvening ? (goldenEvening.end - goldenEvening.start) / 60000 : 0);
    return { goldenMorning, goldenEvening, blueMorning, blueEvening, goldenMinutes: Math.round(goldenMinutes) };
}
function coordinateLabel(args) {
    const { lat, lon } = checkCoords(args);
    return { lat, lon, text: `${lat.toFixed(4)}, ${lon.toFixed(4)}` };
}
export async function daylightProfile(args) {
    const where = coordinateLabel(args);
    const date = checkDate(args.date);
    const results = await sunFor(where.lat, where.lon, date);
    const windows = lightWindows(where.lat, where.lon, date);
    const dayLength = hoursMinutes(durationOf(results));
    const polar = polarNote(results);
    const atSunrise = typeof results.sunrise === "string" && !results.sunrise.startsWith("1970-")
        ? solarElevation(where.lat, where.lon, Date.parse(results.sunrise))
        : null;
    const checkNote = atSunrise === null
        ? ""
        : Math.abs(atSunrise + 0.833) <= 3
            ? `The elevation model puts the sun at ${atSunrise.toFixed(1)}° at the published sunrise, which matches it.`
            : `Caution: the elevation model puts the sun at ${atSunrise.toFixed(1)}° at the published sunrise rather than about -0.8°, so the computed light windows may be off.`;
    const line = (label, value) => `  ${label.padEnd(24)} ${value}`;
    return [
        `Daylight on ${date} at ${where.text} (times as the solar service publishes them, UTC)`,
        line("Sunrise", clock(results.sunrise)),
        line("Solar noon", clock(results.solar_noon)),
        line("Sunset", clock(results.sunset)),
        line("Day length", dayLength),
        "",
        line("Civil twilight", `${clock(results.civil_twilight_begin)} - ${clock(results.civil_twilight_end)}`),
        line("Nautical twilight", `${clock(results.nautical_twilight_begin)} - ${clock(results.nautical_twilight_end)}`),
        line("Astronomical twilight", `${clock(results.astronomical_twilight_begin)} - ${clock(results.astronomical_twilight_end)}`),
        "",
        line("Golden hour (morning)", windows.goldenMorning?.text ?? "no golden hour: the sun never reaches that band"),
        line("Golden hour (evening)", windows.goldenEvening?.text ?? "no golden hour: the sun never reaches that band"),
        line("Blue hour (morning)", windows.blueMorning?.text ?? "no blue hour: the sun never reaches that band"),
        line("Blue hour (evening)", windows.blueEvening?.text ?? "no blue hour: the sun never reaches that band"),
        line("Golden minutes total", String(windows.goldenMinutes)),
        "",
        ...(polar ? [`Note: ${polar}.`, ""] : []),
        "Sunrise, sunset and the twilight boundaries come from the solar service. The golden and blue hours are computed here from the sun's elevation (golden -4° to +6°, blue -6° to -4°), because the service does not publish them.",
        ...(checkNote ? [checkNote] : []),
    ].join("\n");
}
export async function daylightComparison(args) {
    const place = Array.isArray(args.locations) ? args.locations : [];
    if (!place.length)
        throw new ShootProofError("Give at least one location, each with lat and lon.");
    if (place.length > 10)
        throw new ShootProofError("Compare at most 10 locations at a time.");
    const date = checkDate(args.date);
    const rows = [];
    for (const item of place) {
        const where = coordinateLabel(item);
        const results = await sunFor(where.lat, where.lon, date);
        const windows = lightWindows(where.lat, where.lon, date);
        rows.push({
            name: String(item.name ?? where.text).trim() || where.text,
            coords: where.text,
            sunrise: clock(results.sunrise),
            sunset: clock(results.sunset),
            seconds: durationOf(results),
            dayLength: hoursMinutes(durationOf(results)),
            goldenMinutes: windows.goldenMinutes,
            polar: polarNote(results),
        });
        await new Promise((resolve) => setTimeout(resolve, 400));
    }
    rows.sort((a, b) => b.seconds - a.seconds);
    const lines = [
        `Daylight on ${date} at ${rows.length} place(s), ranked by how much daylight there is`,
        "",
    ];
    rows.forEach((row, index) => {
        lines.push(`${index + 1}. ${row.name} (${row.coords})`);
        lines.push(`   sunrise ${row.sunrise} | sunset ${row.sunset} | day length ${row.dayLength} | golden minutes ${row.goldenMinutes}`);
        if (row.polar)
            lines.push(`   note: ${row.polar}`);
    });
    lines.push("", "All times are UTC as published by the solar service; golden minutes are computed from solar elevation for this date and place.");
    return lines.join("\n");
}
