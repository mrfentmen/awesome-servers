const BASE = "https://api.alternative.me/fng";
const UA = "mrfentmen-fear-greed-mcp/1.0 (https://github.com/mrfentmen)";
export class FearGreedError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new FearGreedError("Fear and Greed API rate limit hit, wait and retry");
    if (!res.ok)
        throw new FearGreedError(`Fear and Greed error ${res.status}`);
    return (await res.json());
}
function fmt(d) {
    const label = d?.value_classification ?? "n/a";
    return `Value: ${d?.value ?? "n/a"} (${label})\nDate: ${d?.timestamp ? new Date(Number(d.timestamp) * 1000).toISOString().slice(0, 10) : "n/a"}`;
}
export async function current(args) {
    const d = await get(`${BASE}/?limit=1`);
    const item = d?.data?.[0];
    if (!item)
        return "No data";
    return `Current fear and greed index:\n${fmt(item)}`;
}
export async function history(args) {
    const days = Math.min(Math.max(args.days ?? 7, 1), 90);
    const d = await get(`${BASE}/?limit=${days}`);
    const items = d?.data ?? [];
    if (!items.length)
        return "No data";
    return items.map(fmt).join("\n\n");
}
function fngDate(item) {
    const ts = Number(item.timestamp);
    return Number.isFinite(ts) && ts > 0 ? new Date(ts * 1000).toISOString().slice(0, 10) : "unknown date";
}
function fngValue(item) {
    const n = Number(item.value);
    return Number.isFinite(n) ? n : null;
}
function fngMean(items) {
    const vals = items.map(fngValue).filter((v) => v !== null);
    if (!vals.length)
        return "not reported";
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}
// Band names come from the API's own value_classification field rather than
// thresholds invented here, so the buckets always match the source.
function fngBands(items) {
    const counts = new Map();
    for (const i of items) {
        const band = i.value_classification ?? "unclassified";
        counts.set(band, (counts.get(band) ?? 0) + 1);
    }
    const total = items.length || 1;
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([band, n]) => `      ${band.padEnd(15)} ${String(n).padStart(4)} days (${((n / total) * 100).toFixed(1)}%)`);
}
export async function bandDistribution(args) {
    const days = Math.max(1, Math.min(Math.trunc(args.days ?? 90) || 90, 365));
    const d = await get(`${BASE}/?limit=${days}`);
    const items = d?.data ?? [];
    if (!items.length)
        return `The fear and greed API returned no data for the last ${days} days.`;
    const oldest = items[items.length - 1];
    return [
        `Fear and greed band distribution over ${items.length} days, ${fngDate(oldest)} to ${fngDate(items[0])}:`,
        ...fngBands(items),
        `  Mean over the window: ${fngMean(items)}`,
    ].join("\n");
}
