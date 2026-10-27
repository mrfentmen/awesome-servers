const BASE = "https://api.figshare.com/v2";
const UA = "mrfentmen-figshare-mcp/1.0 (https://github.com/mrfentmen)";
export class FigshareError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new FigshareError(`Figshare returned HTTP ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new FigshareError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 20);
    const res = await fetch(`${BASE}/articles/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA, Accept: "application/json" },
        body: JSON.stringify({ search_for: q, limit, order: "published_date" }),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new FigshareError(`Figshare returned HTTP ${res.status}`);
    const d = (await res.json());
    const list = (Array.isArray(d) ? d : d?.items ?? []);
    if (!list.length)
        return `No Figshare articles found for \"${q}\"`;
    return `Figshare results for \"${q}\" (${list.length} shown):\n` + list.map((a, i) => {
        const authors = (a?.authors ?? []).map((x) => x?.full_name).filter(Boolean).slice(0, 3).join(", ");
        const type = a?.defined_type ?? a?.resource_type?.title ?? "";
        return `${i + 1}. ${a?.title ?? "untitled"}\n   ${authors || "unknown"} | ${type} | ${a?.published_date?.slice(0, 10) ?? ""} | ${a?.url_public_html ?? ""}`;
    }).join("\n");
}
export async function article(args) {
    const id = Number(args.id);
    if (!Number.isInteger(id) || id <= 0)
        throw new FigshareError("Provide a positive article ID");
    const a = await get(`${BASE}/articles/${id}`);
    if (!a?.id)
        throw new FigshareError(`Article not found: ${id}`);
    const lines = [
        `Title: ${a?.title ?? "n/a"}`,
        `Authors: ${(a?.authors ?? []).map((x) => x?.full_name).join(", ") || "n/a"}`,
        `Type: ${a?.defined_type ?? "n/a"}`,
        `Published: ${a?.published_date?.slice(0, 10) ?? "n/a"}`,
        `DOI: ${a?.doi ?? "n/a"}`,
    ];
    if (a?.description)
        lines.push(`\n${a.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 500)}`);
    if (a?.url_public_html)
        lines.push(`\nURL: ${a.url_public_html}`);
    return lines.join("\n");
}
// ---- muxB tools:
const FS_UA = 'mrfentmen-figshare-mcp/1.0';
const fsField = (value, fallback = 'not reported') => value != null && String(value) !== '' ? String(value) : fallback;
export async function articleVersionHistory(args) {
    const id = Math.floor(args.id ?? 0);
    if (!id)
        throw new Error('Provide a Figshare article id.');
    const res = await fetch(`https://api.figshare.com/v2/articles/${id}/versions`, {
        headers: { 'User-Agent': FS_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        return `Figshare has no article with id ${id}.`;
    if (!res.ok)
        throw new Error(`Figshare error ${res.status}`);
    const rows = (await res.json());
    if (!Array.isArray(rows) || !rows.length)
        return `Figshare reports no published versions for article ${id}.`;
    return `Published versions of Figshare article ${id} (${rows.length}):\n` +
        rows.map((r, i) => `${i + 1}. version ${fsField(r.version)} - ${fsField(r.url)}`).join('\n');
}
