const BASE = "https://www.swapi.tech/api";
const UA = "mrfentmen-star-wars-mcp/1.0 (https://github.com/mrfentmen)";
export class StarWarsError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new StarWarsError("SWAPI rate limit hit, wait and retry");
    if (!res.ok)
        throw new StarWarsError(`SWAPI error ${res.status}`);
    return (await res.json());
}
export async function peopleInfo(args) {
    const id = args.id;
    if (id === undefined || id <= 0)
        throw new StarWarsError("Provide a person ID");
    const d = await get(`${BASE}/people/${id}`);
    const p = d?.result?.properties ?? {};
    return `Name: ${p.name ?? "n/a"}\nHeight: ${p.height ?? "n/a"} cm | Mass: ${p.mass ?? "n/a"} kg\nHair: ${p.hair_color ?? "n/a"} | Skin: ${p.skin_color ?? "n/a"} | Eyes: ${p.eye_color ?? "n/a"}\nBorn: ${p.birth_year ?? "n/a"} | Gender: ${p.gender ?? "n/a"}`;
}
export async function planetInfo(args) {
    const id = args.id;
    if (id === undefined || id <= 0)
        throw new StarWarsError("Provide a planet ID");
    const d = await get(`${BASE}/planets/${id}`);
    const p = d?.result?.properties ?? {};
    return `Name: ${p.name ?? "n/a"}\nClimate: ${p.climate ?? "n/a"} | Terrain: ${p.terrain ?? "n/a"}\nPopulation: ${p.population ?? "n/a"} | Gravity: ${p.gravity ?? "n/a"}\nDiameter: ${p.diameter ?? "n/a"} km | Rotation: ${p.rotation_period ?? "n/a"} hours`;
}
export async function searchPeople(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new StarWarsError("Provide a character name");
    const limit = Math.min(args.limit ?? 5, 10);
    const d = await get(`${BASE}/people/?name=${encodeURIComponent(q)}`);
    const res = d?.result ?? [];
    if (!res.length)
        return "No characters found";
    return res.slice(0, limit).map((r, i) => `${i + 1}. ${r?.properties?.name ?? "n/a"} (id ${r?.uid ?? "?"})`).join("\n");
}
// ---- muxC tools:
function n(value) {
    if (value === undefined || value === null || value === "")
        return "not reported";
    if (typeof value === "string" && (value === "n/a" || value === "unknown"))
        return "not reported";
    return String(value);
}
export async function searchPlanets(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new StarWarsError("Provide a planet name");
    const limit = Math.max(1, Math.min(args.limit ?? 5, 10));
    const d = await get(`${BASE}/planets/?name=${encodeURIComponent(q)}`);
    const res = d?.result ?? [];
    if (!Array.isArray(res) || !res.length)
        return "No planets found";
    return res.slice(0, limit)
        .map((r, i) => {
        const p = r?.properties ?? {};
        return [
            `${i + 1}. ${n(p.name)} (id ${r?.uid ?? "?"})`,
            `   ${n(p.terrain)} terrain, ${n(p.climate)} climate | gravity ${n(p.gravity)} | population ${n(p.population)}`,
        ].join("\n");
    })
        .join("\n");
}
