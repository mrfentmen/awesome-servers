const BASE = "https://api.nobelprize.org/2.1";
const UA = "mrfentmen-nobel-mcp/1.0 (https://github.com/mrfentmen)";
export class NobelError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new NobelError(`Nobel API error ${res.status}`);
    return (await res.json());
}
export async function laureates(args) {
    const limit = Math.min(args.limit ?? 10, 25);
    const year = args.year ? `year=${args.year}&` : "";
    const d = await get(`${BASE}/laureates?${year}limit=${limit}`);
    const rows = (d.laureates ?? []).slice(0, limit);
    return rows.map((l) => {
        const name = l.fullName?.en ?? l.knownName?.en ?? "unknown";
        const prizes = (l.nobelPrizes ?? []).map((p) => `${p.category?.en ?? ""} ${p.awardYear ?? ""}`).join(", ");
        return `${name}\n  ${prizes || "no prize data"}`;
    }).join("\n\n") || "No laureates found";
}
export async function prizes(args) {
    const year = args.year ? `?year=${args.year}` : "";
    const d = await get(`${BASE}/nobelPrizes.json${year}`);
    const rows = d.nobelPrizes ?? [];
    return rows.map((p) => {
        const laureates = (p.laureates ?? []).map((l) => l.fullName?.en ?? l.knownName?.en ?? "unknown").join(", ");
        return `${p.awardYear ?? ""} ${p.category?.en ?? ""}\n  ${laureates || "no laureates listed"}`;
    }).join("\n\n") || "No prizes found";
}
// ---- muxC tools:
const NOBEL_UA = "mrfentmen-nobel-mcp/1.0 (https://github.com/mrfentmen)";
async function nobelGet(path) {
    const res = await fetch(`https://api.nobelprize.org/2.1/${path}`, {
        headers: { "User-Agent": NOBEL_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new NobelError(`Nobel API error ${res.status}`);
    return (await res.json());
}
