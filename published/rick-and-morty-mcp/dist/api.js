const UA = "mrfentmen-rick-and-morty-mcp/1.0 (https://github.com/mrfentmen)";
const BASE = "https://rickandmortyapi.com/api";
export class RamError extends Error {
}
async function get(path) {
    const res = await fetch(`${BASE}/${path}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new RamError(`Rick and Morty API returned HTTP ${res.status}`);
    return (await res.json());
}
export async function character(args) {
    const id = args.id;
    if (id === undefined || !Number.isInteger(id) || id < 1)
        throw new RamError("Provide a character ID");
    const c = await get(`character/${id}`);
    return [
        `${c.name} (id ${c.id})`,
        `Status: ${c.status} | Species: ${c.species} | Gender: ${c.gender}`,
        `Origin: ${c.origin?.name ?? "n/a"}`,
        `Location: ${c.location?.name ?? "n/a"}`,
        `Image: ${c.image ?? "n/a"}`,
    ].join("\n");
}
export async function search(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new RamError("Provide a character name");
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`character/?name=${encodeURIComponent(name)}&limit=${limit}`);
    const results = d.results ?? [];
    if (!results.length)
        return `No characters match "${name}"`;
    return results.map((c, i) => `${i + 1}. ${c.name} | ${c.status} | ${c.species} | ${c.location?.name ?? "n/a"}`).join("\n");
}
export async function episode(args) {
    const id = args.id;
    if (id === undefined || !Number.isInteger(id) || id < 1)
        throw new RamError("Provide an episode ID");
    const e = await get(`episode/${id}`);
    return [
        `${e.episode} | ${e.name} (id ${e.id})`,
        `Air date: ${e.air_date ?? "n/a"}`,
        `Characters: ${e.characters?.length ?? 0}`,
    ].join("\n");
}
