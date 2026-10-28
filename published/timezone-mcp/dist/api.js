/**
 * Time Zones — keyless public API client.
 */
export class SourceError extends Error {
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
const WEEKDAY_OPTS = { hour12: false, weekday: "long", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" };
function checkZone(value) {
    const zone = clean(value);
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: zone });
    }
    catch {
        throw new SourceError(`"${value}" is not a known IANA time zone (try list_timezones)`);
    }
    return zone;
}
function zoneOffsetMinutes(zone, date) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? "0");
    const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
    return Math.round((asUtc - date.getTime()) / 60000);
}
function offsetText(minutes) {
    const sign = minutes < 0 ? "-" : "+";
    const abs = Math.abs(minutes);
    return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}
function describeIn(zone, date) {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, ...WEEKDAY_OPTS }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? "";
    return {
        wall: `${get("year")}-${get("month")}-${get("day")} ${String(Number(get("hour")) % 24).padStart(2, "0")}:${get("minute")}:${get("second")}`,
        weekday: get("weekday"),
        abbreviation: get("timeZoneName"),
        offset: zoneOffsetMinutes(zone, date),
    };
}
const NAIVE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/;
const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/;
function instantFromWall(zone, text) {
    const m = NAIVE.exec(text.trim());
    if (!m)
        throw new SourceError(`time must be ISO 8601, e.g. 2026-01-01T09:00 or 2026-01-01T09:00Z (got "${text}")`);
    const [, y, mo, d, h, mi, s] = m;
    const wallUtc = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
    let instant = new Date(wallUtc);
    for (let i = 0; i < 3; i++) {
        const offset = zoneOffsetMinutes(zone, instant);
        instant = new Date(wallUtc - offset * 60000);
    }
    const back = describeIn(zone, instant).wall;
    const wanted = `${y}-${mo}-${d} ${h}:${mi}:${s ?? "00"}`;
    return { instant, exact: back === wanted };
}
export async function timeInZone(a) {
    const zone = checkZone(a.zone);
    let when = new Date();
    if (a.at) {
        when = a.at.trim() && HAS_OFFSET.test(a.at.trim()) ? new Date(a.at) : instantFromWall(checkZone("UTC"), a.at).instant;
        if (Number.isNaN(when.getTime()))
            throw new SourceError(`at must be an ISO 8601 instant, got "${a.at}"`);
    }
    const info = describeIn(zone, when);
    const utc = describeIn("UTC", when);
    return [
        `${info.wall} ${info.weekday} — ${zone}`,
        "",
        `local time:  ${info.wall} (${info.abbreviation}, ${offsetText(info.offset)})`,
        `UTC:         ${utc.wall}`,
        `unix:        ${Math.floor(when.getTime() / 1000)}`,
    ].join("\n");
}
export async function convertTime(a) {
    const from = checkZone(a.from);
    const to = checkZone(a.to);
    const text = clean(a.time);
    let result;
    if (HAS_OFFSET.test(text)) {
        const instant = new Date(text);
        if (Number.isNaN(instant.getTime()))
            throw new SourceError(`time must be ISO 8601, got "${a.time}"`);
        result = { instant, exact: true };
    }
    else {
        result = instantFromWall(from, text);
    }
    const inFrom = describeIn(from, result.instant);
    const inTo = describeIn(to, result.instant);
    return [
        `${result.instant.toISOString()} (UTC)`,
        "",
        `${from.padEnd(22)} ${inFrom.wall} ${inFrom.weekday} (${inFrom.abbreviation}, ${offsetText(inFrom.offset)})`,
        `${to.padEnd(22)} ${inTo.wall} ${inTo.weekday} (${inTo.abbreviation}, ${offsetText(inTo.offset)})`,
        !result.exact ? "\nNote: that wall-clock time does not exist in the source zone (a daylight-saving jump); the nearest valid instant is shown." : "",
    ]
        .filter(Boolean)
        .join("\n");
}
export async function listTimezones(a) {
    const search = clean(a.search).toLowerCase();
    const supported = Intl.supportedValuesOf;
    if (typeof supported !== "function")
        throw new SourceError("this Node build cannot list time zones; pass a zone your platform knows");
    const zones = supported.call(Intl, "timeZone");
    const hits = zones.filter((z) => !search || z.toLowerCase().includes(search));
    if (!hits.length)
        throw new SourceError(`no time zone matches "${clean(a.search)}"`);
    const shown = hits.slice(0, 60);
    return [
        `${hits.length} zone(s)${search ? ` matching "${clean(a.search)}"` : ""}${hits.length > shown.length ? `, showing ${shown.length}` : ""}:`,
        "",
        ...shown,
    ].join("\n");
}
