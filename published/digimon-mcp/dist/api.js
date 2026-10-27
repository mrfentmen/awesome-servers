const UA = "mrfentmen-digimon-mcp/1.0 (https://github.com/mrfentmen)";
const BASE = "https://digimon-api.vercel.app/api";
export class DigimonError extends Error {
}
async function get(path) {
    const res = await fetch(`${BASE}${path}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new DigimonError(`Digimon API returned HTTP ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new DigimonError("Provide a Digimon name");
    const limit = Math.min(args.limit ?? 10, 50);
    const data = await get(`/digimon/name/${encodeURIComponent(name)}`);
    const list = data.slice(0, limit);
    if (!list.length)
        return `No Digimon found for "${name}"`;
    return list.map((d, i) => `${i + 1}. ${d.name} | Level: ${d.level}`).join("\n");
}
export async function level(args) {
    const level = (args.level ?? "").trim();
    if (!level)
        throw new DigimonError("Provide a level like Rookie or Champion");
    const limit = Math.min(args.limit ?? 10, 50);
    const data = await get(`/digimon/level/${encodeURIComponent(level)}`);
    const list = data.slice(0, limit);
    if (!list.length)
        return `No Digimon at level "${level}"`;
    return list.map((d, i) => `${i + 1}. ${d.name} | Level: ${d.level}`).join("\n");
}
export async function levelIndex(args) {
    const all = await get("/digimon");
    if (!all.length)
        return "The Digimon API returned no entries.";
    const byLevel = new Map();
    for (const d of all) {
        const level = d.level ?? "level not reported";
        const bucket = byLevel.get(level);
        if (bucket)
            bucket.push(d.name ?? "unnamed");
        else
            byLevel.set(level, [d.name ?? "unnamed"]);
    }
    const samples = Math.max(0, Math.min(Math.trunc(args.samples ?? 3), 10));
    const ranked = [...byLevel.entries()].sort((a, b) => b[1].length - a[1].length);
    const lines = [`Digimon catalogue levels: ${ranked.length} levels over ${all.length} entries`];
    for (const [level, names] of ranked) {
        const share = Math.round((names.length / all.length) * 100);
        const sample = samples > 0 ? ` — e.g. ${names.slice(0, samples).join(", ")}` : "";
        lines.push(`  ${level}: ${names.length} (${share}%)${sample}`);
    }
    return lines.join("\n");
}
