const BASE = "https://en.wiktionary.org/w/api.php";
const UA = "mrfentmen-wiktionary-mcp/1.0 (https://github.com/mrfentmen)";
export class WiktionaryError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new WiktionaryError("Wiktionary rate limit hit, wait and retry");
    if (!res.ok)
        throw new WiktionaryError(`Wiktionary error ${res.status}`);
    return (await res.json());
}
export async function define(args) {
    const word = (args.word ?? "").trim();
    if (!word)
        throw new WiktionaryError("Provide a word to look up");
    const d = await get(`${BASE}?action=query&prop=extracts&titles=${encodeURIComponent(word)}&explaintext=1&format=json&origin=*`);
    const pages = d?.query?.pages ?? {};
    const page = Object.values(pages)[0];
    if (!page || page?.missing !== undefined)
        return `No entry for "${word}"`;
    const extract = page?.extract ?? "";
    if (!extract)
        return `No definition for "${word}"`;
    const cleaned = extract
        .replace(/\n==+\s*English\s*==+\n/, "")
        .replace(/====[^=]*====/g, "")
        .replace(/==[^=]*==/g, "")
        .split("\n")
        .filter((l) => l.trim())
        .slice(0, 25);
    return `# ${word}\n\n${cleaned.join("\n")}`;
}
function firstPage(data) {
    const pages = (data?.query?.pages ?? {});
    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined)
        return null;
    return page;
}
export async function wordRevisions(args) {
    const word = (args.word ?? "").trim();
    if (!word)
        throw new WiktionaryError("Provide a word to look up");
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const d = await get(`${BASE}?action=query&prop=revisions&rvprop=timestamp%7Cuser%7Ccomment&rvlimit=${limit}&titles=${encodeURIComponent(word)}&format=json&origin=*`);
    const page = firstPage(d);
    if (!page)
        return `No entry for "${word}"`;
    const revisions = page.revisions;
    if (!revisions?.length)
        return `No revision history recorded for "${word}".`;
    return `Latest revisions of "${word}" (${revisions.length} shown):\n` +
        revisions
            .map((r, i) => {
            const when = String(r.timestamp ?? "?").slice(0, 10);
            const who = String(r.user ?? "?").slice(0, 60);
            const comment = String(r.comment ?? "").replace(/\s+/g, " ").trim();
            return `${i + 1}. ${when} by ${who}${comment ? ` - ${comment.slice(0, 120)}` : " - no edit summary"}`;
        })
            .join("\n");
}
// ---- gap4b4 tools:
export async function searchEntries(args) {
    const query = args.query.trim();
    if (!query)
        throw new WiktionaryError("Provide search terms");
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10), 30));
    const params = new URLSearchParams({ action: "query", list: "search", srsearch: query, srlimit: String(limit), format: "json" });
    const d = await get(`${BASE}?${params}`);
    if (d.error)
        throw new WiktionaryError(d.error.info ?? "Search failed");
    const rows = d.query?.search ?? [];
    return `Wiktionary search: ${query.slice(0, 100)} | total ${d.query?.searchinfo?.totalhits ?? "not reported"}\n` +
        rows.slice(0, limit).map((r) => `${String(r.title ?? "not reported").slice(0, 120)}: ${String(r.snippet ?? "not reported").replace(/<[^>]*>/g, "").slice(0, 240)}`).join("\n");
}
