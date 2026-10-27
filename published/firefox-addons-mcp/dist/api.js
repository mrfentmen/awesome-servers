const BASE = "https://addons.mozilla.org/api/v5";
const UA = "mrfentmen-firefox-addons-mcp/1.0 (https://github.com/mrfentmen)";
export class AmoError extends Error {
}
function str(v, fallback = "") {
    if (v == null)
        return fallback;
    if (typeof v === "string")
        return v;
    if (typeof v === "object") {
        const first = Object.values(v)[0];
        return typeof first === "string" ? first : fallback;
    }
    return String(v);
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new AmoError(`AMO returned HTTP ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new AmoError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`${BASE}/addons/search/?q=${encodeURIComponent(q)}&page_size=${limit}`);
    const list = (d?.results ?? []);
    if (!list.length)
        return `No add-ons found for \"${q}\"`;
    return `Firefox add-ons for \"${q}\" (${d?.count ?? list.length} total):\n` + list.map((a, i) => {
        const users = a?.average_daily_users != null ? a.average_daily_users.toLocaleString() : "?";
        const downloads = a?.weekly_downloads != null ? a.weekly_downloads.toLocaleString() : "?";
        const ver = a?.current_version?.version ?? "";
        return `${i + 1}. ${str(a?.name, "n/a")} v${ver}\n   ${str(a?.summary, "no summary").slice(0, 130)} | ${users} daily users | ${downloads} weekly downloads`;
    }).join("\n");
}
export async function addon(args) {
    const slug = (args.slug ?? "").trim();
    if (!slug)
        throw new AmoError("Provide an add-on slug like ublock-origin");
    const a = await get(`${BASE}/addons/addon/${encodeURIComponent(slug)}/`);
    if (!a?.id)
        throw new AmoError(`Add-on not found: ${slug}`);
    const lines = [
        `${str(a?.name, "n/a")} v${a?.current_version?.version ?? ""}`,
        `Summary: ${str(a?.summary, "n/a")}`,
        `Daily users: ${a?.average_daily_users?.toLocaleString() ?? "n/a"}`,
        `Weekly downloads: ${a?.weekly_downloads?.toLocaleString() ?? "n/a"}`,
        `Rating: ${a?.ratings?.average != null ? `${a.ratings.average.toFixed(1)}/5 (${a.ratings.count} reviews)` : "n/a"}`,
        `\n${str(a?.description, "no description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 500)}`,
    ];
    if (a?.url)
        lines.push(`\nPage: ${a.url}`);
    return lines.join("\n");
}
function bound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function epoch(value) {
    if (typeof value !== 'string')
        return NaN;
    return Date.parse(value);
}
function median(values) {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
/** The add-on catalogue's own taxonomy: every category AMO files add-ons under, and what each one is for. */
export async function categoryCatalog(args) {
    const limit = bound(args.limit, 1, 40, 20);
    const rows = (await get(`${BASE}/addons/categories/`)) ?? [];
    if (!rows.length)
        throw new AmoError('AMO returned no add-on categories.');
    const byType = new Map();
    for (const c of rows)
        byType.set(c.type ?? 'not reported', (byType.get(c.type ?? 'not reported') ?? 0) + 1);
    const misc = rows.filter((c) => c.misc);
    const weighted = [...rows].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
    return [
        `AMO add-on category taxonomy: ${rows.length} categor${rows.length === 1 ? 'y' : 'ies'}`,
        `By add-on type: ${[...byType.entries()].map(([k, n]) => `${k} ${n}`).join(', ')}`,
        `Miscellaneous categories: ${misc.length}${misc.length ? ` (${[...new Set(misc.map((c) => c.slug ?? 'slug not reported'))].slice(0, 8).join(', ')})` : ''}`,
        `Categories carrying a display weight: ${rows.filter((c) => (c.weight ?? 0) > 0).length}`,
        rows.length ? `Categories (up to ${limit}):` : '',
        ...rows.slice(0, limit).map((c) => `- ${c.slug ?? 'slug not reported'}: ${str(c.name, 'name not reported')} (${c.type ?? 'type not reported'}, weight ${c.weight ?? 0})`),
        `Heaviest weights: ${weighted.slice(0, 3).map((c) => `${c.slug ?? 'slug not reported'} ${c.weight ?? 0}`).join(', ')}`,
        `Category purpose, as AMO describes it:`,
        ...rows.slice(0, 4).map((c) => `- ${c.slug ?? 'slug not reported'}: ${str(c.description, 'no description published').slice(0, 220)}`),
    ].filter(Boolean).join('\n');
}
