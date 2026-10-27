/**
 * gPodder directory API client, keyless.
 * Docs: https://gpoddernet.readthedocs.io/en/latest/api/
 */
const BASE = "https://gpodder.net";
export class GpodderError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "gpodder-mcp/1.0" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new GpodderError(`gPodder error ${res.status}`);
    return (await res.json());
}
const toPodcast = (p) => ({
    title: String(p.title ?? "?"),
    author: p.author || undefined,
    feed: p.url || undefined,
    description: p.description ? String(p.description).replace(/\s+/g, " ").trim().slice(0, 160) : undefined,
    subscribers: typeof p.subscribers === "number" ? p.subscribers : undefined,
    logo: p.scaled_logo_url || p.logo_url || undefined,
});
export async function searchPodcasts(query, limit = 5) {
    const rows = await getJson(`/search.json?q=${encodeURIComponent(query)}`);
    return rows.slice(0, limit).map(toPodcast);
}
export async function topPodcasts(limit = 10) {
    const rows = await getJson(`/toplist/${Math.min(Math.max(limit, 1), 100)}.json`);
    return rows.slice(0, limit).map(toPodcast);
}
export async function listTags(limit = 20) {
    const rows = await getJson(`/api/2/tags/${Math.min(Math.max(limit, 1), 100)}.json`);
    return rows.slice(0, limit).map((t) => ({
        tag: String(t.tag ?? "?"),
        title: t.title || undefined,
        usage: typeof t.usage === "number" ? t.usage : undefined,
    }));
}
export async function podcastsByTag(tag, limit = 10) {
    const rows = await getJson(`/api/2/tag/${encodeURIComponent(tag)}/${Math.min(Math.max(limit, 1), 100)}.json`);
    return rows.slice(0, limit).map(toPodcast);
}
export function formatPodcast(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}${p.title}${p.author ? ` — ${p.author}` : ""}${p.subscribers !== undefined ? ` (${p.subscribers} subs)` : ""}`,
        p.description ? `${p.description}` : "",
        p.feed ? `Feed: ${p.feed}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxB tools:
async function searchRows(query) {
    const res = await fetch(`https://gpodder.net/search.json?q=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": "gpodder-mcp/1.0" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new GpodderError(`gPodder error ${res.status}`);
    const rows = (await res.json());
    return Array.isArray(rows) ? rows : [];
}
export async function searchOverlap(args) {
    const queries = (args.queries ?? []).map((q) => (q ?? "").trim()).filter(Boolean).slice(0, 5);
    if (queries.length < 2)
        return "Provide at least two search terms to compare.";
    const limit = Math.max(1, Math.min(Number(args.limit ?? 10) || 10, 20));
    const sets = await Promise.all(queries.map(async (q) => ({ q, rows: await searchRows(q) })));
    for (const { q, rows } of sets) {
        if (!rows.length)
            return `No podcasts match "${q}", so there is nothing to compare.`;
    }
    const index = new Map();
    const perQuery = [];
    for (const { q, rows } of sets) {
        perQuery.push(`"${q}": ${rows.length} result(s)`);
        for (const row of rows) {
            const key = String(row.url ?? row.title ?? "").toLowerCase();
            if (!key)
                continue;
            const entry = index.get(key) ?? {
                title: String(row.title ?? "?"),
                author: String(row.author ?? "not reported"),
                hits: [],
                subs: 0,
            };
            entry.hits.push(q);
            if (typeof row.subscribers === "number")
                entry.subs = Math.max(entry.subs, row.subscribers);
            index.set(key, entry);
        }
    }
    const shared = [...index.values()].filter((e) => e.hits.length > 1).sort((a, b) => b.hits.length - a.hits.length || b.subs - a.subs);
    const lines = [`Comparing ${queries.length} gPodder searches: ${perQuery.join("; ")}.`, ""];
    if (!shared.length) {
        lines.push(`No feed appears in more than one of the ${queries.length} result sets (${index.size} distinct feeds checked).`);
        return lines.join("\n");
    }
    lines.push(`${shared.length} feed(s) appear in more than one result set:`);
    shared.slice(0, limit).forEach((e, i) => {
        lines.push(`${i + 1}. ${e.title} - ${e.author} | matched: ${e.hits.join(" + ")} | up to ${e.subs.toLocaleString("en-US")} subscribers`);
    });
    return lines.join("\n");
}
