const m0 = (() => {
    const UA = 'mrfentmen-timeapi-mcp/1.0';
    const BASE = 'https://timeapi.io/api/Time';
    async function current(args) {
        const zone = String(args.zone).trim();
        if (!zone)
            throw new Error('Provide an IANA zone like Europe/London.');
        const res = await fetch(`${BASE}/current/zone?timeZone=${encodeURIComponent(zone)}`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`TimeAPI returned ${res.status}`);
        const d = (await res.json());
        if (!d.dateTime)
            throw new Error(`No time for ${zone}.`);
        return `Current time in ${d.timeZone ?? zone}:\n${d.dateTime} (${d.date ?? ''} ${d.time ?? ''})\nDST active: ${d.dstActive ?? '?'} | Day of week: ${d.dayOfWeek ?? '?'}`;
    }
    async function convert(args) {
        const from = String(args.from).trim(), to = String(args.to).trim();
        if (!from || !to)
            throw new Error('Provide from and to IANA zones.');
        const dt = args.datetime || new Date().toISOString();
        const url = `${BASE}/convert/zone?fromTimeZone=${encodeURIComponent(from)}&toTimeZone=${encodeURIComponent(to)}&dateTime=${encodeURIComponent(dt)}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(25000),
        });
        if (!res.ok)
            throw new Error(`TimeAPI returned ${res.status}`);
        const d = (await res.json());
        if (!d.conversionResult)
            throw new Error('No conversion returned.');
        return `${dt} ${d.fromTimezone ?? from} -> ${d.conversionResult} ${d.toTimezone ?? to}`;
    }
    return { convert, current };
})();
const m1 = (() => {
    const BASE = "https://timeapi.io/api/Time/current/zone";
    const UA = "mrfentmen-timezone-mcp/1.0 (https://github.com/mrfentmen)";
    class TimeError extends Error {
    }
    const COMMON = [
        "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
        "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow", "Asia/Dubai",
        "Asia/Tokyo", "Asia/Shanghai", "Asia/Singapore", "Asia/Kolkata", "Australia/Sydney",
        "Pacific/Auckland", "America/Sao_Paulo", "Africa/Lagos",
    ];
    async function timeInZone(args) {
        const tz = (args.timezone ?? "UTC").trim();
        if (!tz)
            throw new TimeError("Provide an IANA timezone");
        const res = await fetch(`${BASE}?timeZone=${encodeURIComponent(tz)}`, {
            headers: { "User-Agent": UA },
            signal: AbortSignal.timeout(20000),
        });
        if (res.status === 404 || res.status === 400)
            throw new TimeError(`Unknown timezone ${tz}`);
        if (!res.ok)
            throw new TimeError(`Time API error ${res.status}`);
        const d = await res.json();
        return `${d.dateTime ?? ""} (${tz})\n${d.dayOfWeek ?? ""} | DST ${d.dstActive ? "active" : "inactive"} | UTC offset ${d.utcOffset ?? "?"}`;
    }
    async function listZones(_args) {
        return `Common IANA timezones\n${COMMON.join("\n")}`;
    }
    return { TimeError, listZones, timeInZone };
})();
export const TimeError = m1.TimeError;
export const convert = m0.convert;
export const current = m0.current;
export const listZones = m1.listZones;
export const timeInZone = m1.timeInZone;
export const m0_convert = m0.convert;
export const m0_current = m0.current;
export const m1_TimeError = m1.TimeError;
export const m1_listZones = m1.listZones;
export const m1_timeInZone = m1.timeInZone;
