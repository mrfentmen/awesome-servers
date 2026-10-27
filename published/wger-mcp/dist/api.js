const BASE = "https://wger.de/api/v2";
const UA = "mrfentmen-wger-mcp/1.0 (https://github.com/mrfentmen)";
export class WgerError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new WgerError(`wger returned HTTP ${res.status}`);
    return (await res.json());
}
function stripHtml(html) {
    return html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function translation(translations, lang) {
    const list = translations ?? [];
    const hit = list.find((t) => t?.language === lang) ?? list[0];
    return { name: hit?.name, description: hit?.description };
}
export async function exercises(args) {
    const lang = Number(args.language ?? 2);
    const limit = Math.min(args.limit ?? 10, 12);
    const d = await get(`${BASE}/exerciseinfo/?limit=${limit}`);
    const list = (d?.results ?? []);
    if (!list.length)
        return "No exercises found";
    const rows = [];
    for (const e of list.slice(0, limit)) {
        const tr = translation(e?.translations, lang);
        const cat = e?.category?.name ?? "";
        const muscles = (e?.muscles ?? []).map((m) => m?.name).filter(Boolean).slice(0, 3).join(", ");
        const desc = stripHtml(tr.description ?? "").slice(0, 100);
        rows.push(`${e?.id ?? "?"} | ${tr.name ?? "exercise"}${cat ? ` | ${cat}` : ""}\n   ${desc || "no description"}${muscles ? ` | ${muscles}` : ""}`);
    }
    return `Exercises (${d?.count ?? list.length} total, ${rows.length} shown):\n` + rows.join("\n");
}
export async function exercise(args) {
    const id = Number(args.id);
    if (!Number.isInteger(id) || id <= 0)
        throw new WgerError("Provide a positive exercise ID");
    const d = await get(`${BASE}/exerciseinfo/?exercise=${id}`);
    const e = (d?.results ?? [])[0];
    if (!e)
        throw new WgerError(`Exercise not found: ${id}`);
    const tr = translation(e?.translations, 2);
    const lines = [
        `${tr.name ?? e?.name ?? `Exercise ${id}`} | ${e?.category?.name ?? ""}`,
        `\n${stripHtml(tr.description ?? e?.description ?? "no description").slice(0, 600)}`,
    ];
    const muscles = (e?.muscles ?? []).map((m) => m?.name).filter(Boolean);
    if (muscles.length)
        lines.push(`\nMuscles: ${muscles.join(", ")}`);
    return lines.join("\n");
}
export async function muscles(_args) {
    const d = await get(`${BASE}/muscle/`);
    const list = (d?.results ?? []);
    if (!list.length)
        return "No muscles found";
    return `Muscles (${d?.count ?? list.length}):\n` + list.map((m, i) => {
        return `${i + 1}. ${m?.name ?? "n/a"}${m?.is_front != null ? ` | ${m.is_front ? "front" : "back"}` : ""}`;
    }).join("\n");
}
// ---- muxC tools:
const WGER_UA = "mrfentmen-wger-mcp/1.0 (https://github.com/mrfentmen)";
class WgerToolError extends Error {
}
async function wger(path, ms = 25000) {
    const res = await fetch(`https://wger.de/api/v2${path}`, { headers: { "User-Agent": WGER_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
    if (!res.ok)
        throw new WgerToolError(`wger.de returned ${res.status} for ${path}`);
    return await res.json();
}
// ---- gap4d3 tools:
