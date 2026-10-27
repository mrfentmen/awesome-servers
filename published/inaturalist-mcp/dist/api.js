const BASE = "https://api.inaturalist.org/v1";
const UA = "mrfentmen-inaturalist-mcp/1.0 (https://github.com/mrfentmen)";
export class InaturalistError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new InaturalistError("iNaturalist rate limit hit, wait and retry");
    if (!res.ok)
        throw new InaturalistError(`iNaturalist error ${res.status}`);
    return (await res.json());
}
export async function searchSpecies(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new InaturalistError("Provide a species name");
    const limit = Math.min(args.limit ?? 8, 20);
    const d = await get(`${BASE}/taxa?q=${encodeURIComponent(q)}&per_page=${limit}`);
    const results = d?.results ?? [];
    if (!results.length)
        return "No species found";
    return results.map((t, i) => {
        const common = t?.preferred_common_name ?? "no common name";
        return `${i + 1}. ${t?.name ?? "n/a"} (${common})\n   ${t?.rank ?? ""} | observations ${t?.observations_count ?? 0} | id ${t?.id ?? "?"}${t?.wikipedia_url ? ` | ${t.wikipedia_url}` : ""}`;
    }).join("\n\n");
}
export async function recentObservations(args) {
    const id = args.taxonId;
    if (id === undefined || id <= 0)
        throw new InaturalistError("Provide a taxon ID");
    const limit = Math.min(args.limit ?? 5, 15);
    const d = await get(`${BASE}/observations?taxon_id=${id}&per_page=${limit}&order=desc&order_by=created_at`);
    const results = d?.results ?? [];
    if (!results.length)
        return "No observations found";
    return results.map((o, i) => {
        const place = o?.place_guess ?? "unknown location";
        const img = o?.photos?.[0]?.url ?? "";
        const date = o?.observed_on_string ?? "";
        return `${i + 1}. ${o?.taxon?.name ?? "n/a"} observed at ${place} on ${date}${img ? `\n   ${img}` : ""}`;
    }).join("\n\n");
}
// ---- muxC tools:
