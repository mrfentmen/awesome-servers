const KEY = process.env.TMDB_API_KEY ?? "";
const BASE = "https://api.themoviedb.org/3";
export class TmdbError extends Error {
}
async function get(path, params) {
    if (!KEY)
        throw new TmdbError("Set the TMDB_API_KEY environment variable to your free TMDB key");
    const qs = new URLSearchParams({ api_key: KEY, ...params }).toString();
    const res = await fetch(`${BASE}${path}?${qs}`, { signal: AbortSignal.timeout(25000) });
    if (res.status === 401)
        throw new TmdbError("TMDB rejected the key. Check TMDB_API_KEY.");
    if (!res.ok)
        throw new TmdbError(`TMDB error ${res.status}`);
    return (await res.json());
}
function fmtRows(rows) {
    return rows.map((r) => `${r.title ?? r.name ?? ""} (${(r.release_date ?? r.first_air_date ?? "").slice(0, 4)}) | rating ${r.vote_average ?? "n/a"}\n  ${(r.overview ?? "").slice(0, 180)}`).join("\n\n");
}
export async function searchMovie(args) {
    const limit = Math.min(args.limit ?? 8, 20);
    const d = await get("/search/movie", { query: args.query ?? "", include_adult: "false" });
    return `Movies matching ${args.query}\n${fmtRows((d.results ?? []).slice(0, limit)) || "None found"}`;
}
export async function searchTv(args) {
    const limit = Math.min(args.limit ?? 8, 20);
    const d = await get("/search/tv", { query: args.query ?? "", include_adult: "false" });
    return `TV shows matching ${args.query}\n${fmtRows((d.results ?? []).slice(0, limit)) || "None found"}`;
}
export async function trending(args) {
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get("/trending/all/week", {});
    return `Trending this week\n${fmtRows((d.results ?? []).slice(0, limit))}`;
}
export async function searchPerson(args) {
    const limit = Math.min(args.limit ?? 8, 20);
    const d = await get("/search/person", { query: args.query ?? "", include_adult: "false" });
    const rows = (d.results ?? []).slice(0, limit);
    if (!rows.length)
        return `Nobody found for ${args.query}`;
    return rows.map((r) => `${r.name ?? "?"} (id ${r.id ?? "?"}) | known for ${r.known_for_department ?? "?"}\n  ${(r.known_for ?? []).slice(0, 3).map((k) => k.title ?? k.name ?? "").filter(Boolean).join(", ")}`).join("\n\n");
}
export async function movieDetails(args) {
    const id = (args.id ?? "").trim();
    if (!id)
        throw new TmdbError("Provide a TMDB movie id");
    const d = await get(`/movie/${encodeURIComponent(id)}`, {});
    return `${d.title ?? "?"} (${String(d.release_date ?? "").slice(0, 4)}) | ${d.vote_average ?? "n/a"}/10 (${d.vote_count ?? 0} votes)\n${(d.genres ?? []).map((g) => g.name).join(", ")}\n${(d.overview ?? "").slice(0, 300)}`;
}
export async function tvDetails(args) {
    const id = (args.id ?? "").trim();
    if (!id)
        throw new TmdbError("Provide a TMDB TV id");
    const d = await get(`/tv/${encodeURIComponent(id)}`, {});
    return `${d.name ?? "?"} (${String(d.first_air_date ?? "").slice(0, 4)}) | ${d.vote_average ?? "n/a"}/10 | ${d.number_of_seasons ?? "?"} seasons, ${d.number_of_episodes ?? "?"} episodes\n${(d.genres ?? []).map((g) => g.name).join(", ")}\n${(d.overview ?? "").slice(0, 300)}`;
}
export async function personDetails(args) {
    const id = (args.id ?? "").trim();
    if (!id)
        throw new TmdbError("Provide a TMDB person id");
    const d = await get(`/person/${encodeURIComponent(id)}`, {});
    return `${d.name ?? "?"} | ${d.known_for_department ?? "?"}\nBorn: ${d.birthday ?? "?"}${d.place_of_birth ? ` in ${d.place_of_birth}` : ""}\n${(d.biography ?? "").slice(0, 300)}`;
}
export async function movieCredits(args) {
    const id = (args.id ?? "").trim();
    if (!id)
        throw new TmdbError("Provide a TMDB movie id");
    const d = await get(`/movie/${encodeURIComponent(id)}/credits`, {});
    const cast = (d.cast ?? []).slice(0, 10).map((c) => `${c.name ?? "?"} as ${c.character ?? "?"}`);
    const crew = (d.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name);
    return [`Cast: ${cast.join(", ") || "n/a"}`, crew.length ? `Director: ${crew.join(", ")}` : ""].filter(Boolean).join("\n");
}
export async function discoverMovies(args) {
    const limit = Math.min(args.limit ?? 8, 20);
    const params = { sort_by: "popularity.desc" };
    if ((args.genre ?? "").trim())
        params.with_genres = args.genre.trim();
    if ((args.year ?? "").trim())
        params.primary_release_year = args.year.trim();
    const d = await get("/discover/movie", params);
    return `Discover movies\n${fmtRows((d.results ?? []).slice(0, limit)) || "None found"}`;
}
export async function discoverTv(args) {
    const limit = Math.min(args.limit ?? 8, 20);
    const params = { sort_by: "popularity.desc" };
    if ((args.genre ?? "").trim())
        params.with_genres = args.genre.trim();
    const d = await get("/discover/tv", params);
    return `Discover TV\n${fmtRows((d.results ?? []).slice(0, limit)) || "None found"}`;
}
