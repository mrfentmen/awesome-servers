/**
 * Dwarf Fortress wiki client (dwarffortresswiki.org). MediaWiki API,
 * keyless. Contains the lore, !!FUN!!, adamantine, and magma knowledge.
 */
const BASE = "https://dwarffortresswiki.org/api.php";
export class DfError extends Error {
}
async function getJson(params) {
    const qs = new URLSearchParams({ format: "json", ...params });
    const res = await fetch(`${BASE}?${qs.toString()}`, {
        headers: { "User-Agent": "dwarffortress-mcp/1.0 (research)" },
    });
    if (!res.ok)
        throw new DfError(`DF wiki error ${res.status}`);
    return (await res.json());
}
export async function searchPages(query, limit = 8) {
    const d = await getJson({
        action: "query",
        list: "search",
        srsearch: query,
        srlimit: String(limit),
        srprop: "snippet",
    });
    return (d.query?.search ?? []).map((s) => ({
        pageid: s.pageid,
        title: s.title,
        snippet: (s.snippet ?? "").replace(/<[^>]+>/g, ""),
    }));
}
export async function getPage(title, maxChars = 15000) {
    const d = await getJson({
        action: "parse",
        page: title,
        prop: "wikitext",
        formatversion: "2",
    });
    const p = d.parse;
    if (!p)
        return null;
    const wt = typeof p.wikitext === "string" ? p.wikitext : (p.wikitext?.["*"] ?? "");
    return {
        title: p.title ?? title,
        wikitext: wt.slice(0, maxChars),
        url: `https://dwarffortresswiki.org/index.php/${encodeURIComponent(p.title ?? title).replace(/%2F/g, "/")}`,
    };
}
export function wikiTextToPlain(wt, maxChars = 12000) {
    return wt
        .replace(/\{\{[^{}]*\}\}/g, "")
        .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
        .replace(/'''/g, "")
        .replace(/''/g, "")
        .replace(/\{\|[\s\S]*?\|\}/g, "[table]")
        .replace(/={2,}([^=]+)={2,}/g, "\n$1\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, maxChars);
}
