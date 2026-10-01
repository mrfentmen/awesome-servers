export class FingridError extends Error {
    constructor(message) {
        super(message);
        this.name = "FingridError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new FingridError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    return { "x-api-key": envStrict("FINGRID_API_KEY") };
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
        throw new FingridError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function listDatasets() {
    let url = `https://data.fingrid.fi/api/datasets`;
    const data = await req(url);
    return pretty(data);
}
export async function getRecords(datasetId, startTime, endTime) {
    let url = `https://data.fingrid.fi/api/datasets/${encodeURIComponent(String(datasetId))}/data`;
    const qs = new URLSearchParams();
    if (startTime !== undefined)
        qs.append("startTime", String(startTime));
    if (endTime !== undefined)
        qs.append("endTime", String(endTime));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
// ---- muxB tools:
const FG_AREAS = {
    fi: { zone: "Europe/Helsinki", label: "Finland" },
    ee: { zone: "Europe/Tallinn", label: "Estonia" },
    lv: { zone: "Europe/Riga", label: "Latvia" },
    lt: { zone: "Europe/Vilnius", label: "Lithuania" },
};
const FG_URL = "https://dashboard.elering.ee/api/nps/price";
async function fgSlots(area, startMs, hours) {
    const qs = new URLSearchParams({
        start: new Date(startMs).toISOString().slice(0, 23) + "Z",
        end: new Date(startMs + hours * 3600000).toISOString().slice(0, 23) + "Z",
    });
    const res = await fetch(`${FG_URL}?${qs.toString()}`, {
        headers: { "User-Agent": "fingrid-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new FingridError("Elering has no price data for that window.");
    if (!res.ok)
        throw new FingridError(`Elering's day-ahead price feed returned HTTP ${res.status}.`);
    const data = (await res.json());
    if (data.success !== true)
        throw new FingridError("Elering's price feed did not answer successfully.");
    const rows = (data.data?.[area] ?? [])
        .map((r) => ({ timestamp: Number(r.timestamp), price: Number(r.price) }))
        .filter((r) => Number.isFinite(r.timestamp) && Number.isFinite(r.price))
        .sort((a, b) => a.timestamp - b.timestamp);
    if (rows.length === 0)
        throw new FingridError(`Elering published no ${area.toUpperCase()} prices for that window.`);
    return rows;
}
/** Elering publishes 15-minute slots around the switchover and hourly ones outside it, so collapse to clock hours. */
function fgToHours(rows) {
    const buckets = new Map();
    for (const r of rows) {
        const hour = Math.floor(r.timestamp / 3600) * 3600;
        buckets.set(hour, [...(buckets.get(hour) ?? []), r]);
    }
    return [...buckets.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([start, group]) => ({
        start,
        price: group.reduce((a, b) => a + b.price, 0) / group.length,
        slots: group.length,
    }));
}
function fgLocal(ts, zone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(new Date(ts * 1000));
    const get = (t) => parts.find((x) => x.type === t)?.value ?? "?";
    return `${get("weekday")} ${get("day")}/${get("month")} ${get("hour")}:${get("minute")}`;
}
const fgKwh = (eurPerMwh) => eurPerMwh / 1000;
function fgStart(args) {
    if (!args.start)
        return Date.now();
    const parsed = Date.parse(String(args.start));
    if (Number.isNaN(parsed)) {
        throw new FingridError(`"${args.start}" is not a date Elering can use, e.g. 2026-09-28T00:00:00Z.`);
    }
    return parsed;
}
export async function dayAheadPrices(args) {
    const area = String(args.area ?? "fi").trim().toLowerCase();
    const meta = FG_AREAS[area];
    if (!meta)
        throw new FingridError(`Area must be one of ${Object.keys(FG_AREAS).join(", ")}, got "${args.area}".`);
    const hours = Math.min(Math.max(Math.round(Number(args.hours ?? 36)), 6), 168);
    const rows = fgToHours(await fgSlots(area, fgStart(args), hours));
    const cheapest = rows.reduce((a, b) => (b.price < a.price ? b : a));
    const dearest = rows.reduce((a, b) => (b.price > a.price ? b : a));
    const mean = rows.reduce((a, b) => a + b.price, 0) / rows.length;
    const negatives = rows.filter((r) => r.price < 0).length;
    const counts = new Map();
    for (const r of rows)
        counts.set(r.slots, (counts.get(r.slots) ?? 0) + 1);
    const slotsPerHour = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return [
        `Day-ahead electricity price, ${meta.label}, ${rows.length} hour(s) from ${fgLocal(rows[0].start, meta.zone)} to ${fgLocal(rows[rows.length - 1].start, meta.zone)} (${meta.zone}).`,
        `Source: Elering's public day-ahead price feed, the market the Finnish spot price comes from. Published in EUR per MWh, ${slotsPerHour > 1 ? `${slotsPerHour} quarter-hour slots per hour, averaged below` : "hourly slots"}.`,
        "",
        `cheapest ${fgKwh(cheapest.price).toFixed(4)} EUR/kWh in the hour starting ${fgLocal(cheapest.start, meta.zone)}`,
        `dearest  ${fgKwh(dearest.price).toFixed(4)} EUR/kWh in the hour starting ${fgLocal(dearest.start, meta.zone)}`,
        `mean     ${fgKwh(mean).toFixed(4)} EUR/kWh, spread ${fgKwh(dearest.price - cheapest.price).toFixed(4)} EUR/kWh across the window`,
        negatives > 0 ? `${negatives} hour(s) are below zero, so you are paid to consume.` : "No negative hours in this window.",
        "",
        ...rows.map((r) => `  ${fgLocal(r.start, meta.zone)}  ${fgKwh(r.price).toFixed(4)} EUR/kWh  (${r.price.toFixed(2)} EUR/MWh)`),
    ].join("\n");
}
