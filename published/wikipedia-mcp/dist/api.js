const BASE = "https://en.wikipedia.org/api/rest_v1";
const UA = "mrfentmen-wikipedia-mcp/1.0 (https://github.com/mrfentmen)";
export class WikipediaError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new WikipediaError("Wikipedia rate limit hit, wait and retry");
    if (!res.ok)
        throw new WikipediaError(`Wikipedia error ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new WikipediaError("Provide a search query");
    const limit = Math.min(args.limit ?? 5, 15);
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=${limit}&format=json&origin=*`;
    const d = await get(url);
    const hits = d?.query?.search ?? [];
    if (hits.length === 0)
        return "No results";
    return hits.map((h, i) => `${i + 1}. ${h.title}\n   ${(h.snippet ?? "").replace(/<[^>]+>/g, "")}`).join("\n\n");
}
export async function summary(args) {
    const title = (args.title ?? "").trim();
    if (!title)
        throw new WikipediaError("Provide an article title");
    const d = await get(`${BASE}/page/summary/${encodeURIComponent(title)}`);
    return `Title: ${d.title ?? ""}\n${d.description ? `About: ${d.description}\n` : ""}${d.extract ?? ""}${d.content_urls?.desktop?.page ? `\nRead more: ${d.content_urls.desktop.page}` : ""}`;
}
export async function random(args) {
    const d = await get(`${BASE}/page/random/summary`);
    return `Title: ${d.title ?? ""}\n${d.description ? `About: ${d.description}\n` : ""}${d.extract ?? ""}${d.content_urls?.desktop?.page ? `\nRead more: ${d.content_urls.desktop.page}` : ""}`;
}
// ---- muxC tools:
// ---- gap4a4 tools:
