const BASE = "https://pokeapi.co/api/v2";
const UA = "mrfentmen-pokeapi-mcp/1.0 (https://github.com/mrfentmen)";
export class PokeError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new PokeError("PokéAPI rate limit hit, wait and retry");
    if (!res.ok)
        throw new PokeError(`PokéAPI error ${res.status}`);
    return (await res.json());
}
export async function pokemonInfo(args) {
    const name = (args.name ?? "").trim().toLowerCase();
    if (!name)
        throw new PokeError("Provide a Pokemon name or ID");
    const d = await get(`${BASE}/pokemon/${encodeURIComponent(name)}`);
    const types = (d?.types ?? []).map((t) => t.type?.name).join(", ");
    const stats = (d?.stats ?? []).map((s) => `${s.stat?.name}: ${s.base_stat}`).join(" | ");
    const species = await get(`${BASE}/pokemon-species/${d.id}`).catch(() => null);
    const flavor = species?.flavor_text_entries?.find((f) => f.language?.name === "en")?.flavor_text?.replace(/[\n\f]/g, " ") ?? "";
    return `${d.name} (#${d.id})\nTypes: ${types}\nHeight: ${(d.height ?? 0) / 10} m | Weight: ${(d.weight ?? 0) / 10} kg\nBase stats: ${stats}${flavor ? `\n\n${flavor}` : ""}`;
}
export async function searchPokemon(args) {
    const q = (args.query ?? "").trim().toLowerCase();
    if (!q)
        throw new PokeError("Provide a partial name");
    const limit = Math.min(args.limit ?? 10, 30);
    const d = await get(`${BASE}/pokemon?limit=2000`);
    const hits = (d?.results ?? []).filter((p) => p.name.includes(q)).slice(0, limit);
    if (!hits.length)
        return "No Pokemon match";
    return hits.map((p) => p.name).join("\n");
}
/** Every ability a Pokemon has, with its effect text. */
export async function pokemonAbilities(args) {
    const name = (args.name ?? "").trim().toLowerCase();
    if (!name)
        throw new PokeError("Provide a Pokemon name or ID");
    const d = await get(`${BASE}/pokemon/${encodeURIComponent(name)}`);
    const slots = d?.abilities ?? [];
    if (!slots.length)
        return `${d.name} has no ability listed.`;
    const rows = [];
    for (const entry of slots.slice(0, 3)) {
        const detail = await get(entry.ability.url);
        // effect_entries is not English-only, so match the language explicitly
        const text = detail?.effect_entries?.find((e) => e.language?.name === "en" && e.short_effect)?.short_effect ??
            detail?.effect_entries?.find((e) => e.short_effect)?.short_effect ??
            "no effect text published";
        rows.push(`[slot ${entry.slot}] ${entry.ability.name}: ${text}${detail?.is_main_series === false ? " (not in the main series)" : ""}`);
    }
    return `Abilities of ${d.name} (#${d.id}):\n${rows.join("\n")}`;
}
