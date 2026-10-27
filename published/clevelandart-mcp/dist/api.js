const BASE = 'https://openaccess-api.clevelandart.org/api/artworks';
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}/?q=${encodeURIComponent(query)}&limit=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-clevelandart-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Cleveland Museum returned ${res.status}`);
    const d = (await res.json());
    const rows = d.data ?? [];
    if (!rows.length)
        return `No artworks found for "${query}".`;
    return `Cleveland artworks for "${query}" (${rows.length} shown):\n` +
        rows.map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('title')}${s('creators') ? ` | ${s('creators')}` : ''} (${s('id')})`;
        }).join('\n');
}
export async function artwork(args) {
    const id = Math.floor(args.id ?? 0);
    if (!id)
        return 'Provide an artwork id.';
    const res = await fetch(`${BASE}/${id}`, {
        headers: { 'User-Agent': 'mrfentmen-clevelandart-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Cleveland Museum returned ${res.status}`);
    const d = (await res.json());
    const r = d.data;
    if (!r)
        return `No artwork with id ${id}.`;
    const s = (k) => (r[k] != null ? String(r[k]) : '');
    return [
        s('title'),
        s('creators') ? `Artist: ${s('creators')}` : '',
        s('creation_date') ? `Date: ${s('creation_date')}` : '',
        s('technique') ? `Technique: ${s('technique')}` : '',
        s('description') ? `\n${s('description')}` : '',
    ].filter(Boolean).join('\n');
}
// ---- muxA tools:
const CMA = "https://openaccess-api.clevelandart.org/api";
function clamp(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
function text(value, max = 160) {
    if (value == null)
        return "not recorded";
    if (Array.isArray(value)) {
        const parts = value.map((v) => (v && typeof v === "object" ? String(v.name ?? JSON.stringify(v)) : String(v)));
        return parts.filter(Boolean).join(", ") || "not recorded";
    }
    const s = String(value).replace(/\s+/g, " ").trim();
    if (!s)
        return "not recorded";
    return s.length > max ? `${s.slice(0, max)}...` : s;
}
async function cmaGet(path, params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${CMA}${path}?${query.toString()}`, {
        headers: { "User-Agent": "mrfentmen-clevelandart-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`Cleveland Museum of Art returned ${res.status}`);
    return (await res.json());
}
export async function exhibitions(args) {
    const params = { limit: String(clamp(args.limit, 10, 50)) };
    if (args.query?.trim())
        params.q = args.query.trim();
    const d = await cmaGet("/exhibitions/", params);
    const rows = (d.data ?? []);
    const total = Number(d.info?.total ?? rows.length);
    if (!rows.length)
        return `No Cleveland Museum of Art exhibition matches "${args.query}".`;
    const shown = rows.slice(0, clamp(args.limit, 10, 50));
    return [
        `Cleveland Museum of Art exhibitions: ${total.toLocaleString("en-US")} record(s), showing ${shown.length}.`,
        ...shown.map((e, i) => {
            const start = String(e.opening_date ?? "").slice(0, 10);
            const end = String(e.closing_date ?? "").slice(0, 10);
            const venues = Array.isArray(e.venues) ? e.venues.map((v) => String(v?.name ?? "")).filter(Boolean) : [];
            return `${i + 1}. ${text(e.title, 90)} | id ${e.id ?? "?"} | ${start || "?"} to ${end || "still open"} | organizer ${text(e.organizer, 50)}${venues.length ? ` | venue ${venues.slice(0, 2).join(", ")}` : ""}`;
        }),
        total > shown.length ? `plus ${total - shown.length} more exhibitions` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
