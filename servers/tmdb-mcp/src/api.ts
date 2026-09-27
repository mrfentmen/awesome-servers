const KEY = process.env.TMDB_API_KEY ?? ""
const BASE = "https://api.themoviedb.org/3"
export class TmdbError extends Error {}

async function get<T>(path: string, params: Record<string, string>): Promise<T> {
  if (!KEY) throw new TmdbError("Set the TMDB_API_KEY environment variable to your free TMDB key")
  const qs = new URLSearchParams({ api_key: KEY, ...params }).toString()
  const res = await fetch(`${BASE}${path}?${qs}`, { signal: AbortSignal.timeout(25000) })
  if (res.status === 401) throw new TmdbError("TMDB rejected the key. Check TMDB_API_KEY.")
  if (!res.ok) throw new TmdbError(`TMDB error ${res.status}`)
  return (await res.json()) as T
}

function fmtRows(rows: any[]): string {
  return rows.map((r: any) =>
    `${r.title ?? r.name ?? ""} (${(r.release_date ?? r.first_air_date ?? "").slice(0, 4)}) | rating ${r.vote_average ?? "n/a"}\n  ${(r.overview ?? "").slice(0, 180)}`
  ).join("\n\n")
}

export async function searchMovie(args: { query?: string; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 8, 20)
  const d = await get<any>("/search/movie", { query: args.query ?? "", include_adult: "false" })
  return `Movies matching ${args.query}\n${fmtRows((d.results ?? []).slice(0, limit)) || "None found"}`
}

export async function searchTv(args: { query?: string; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 8, 20)
  const d = await get<any>("/search/tv", { query: args.query ?? "", include_adult: "false" })
  return `TV shows matching ${args.query}\n${fmtRows((d.results ?? []).slice(0, limit)) || "None found"}`
}

export async function trending(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>("/trending/all/week", {})
  return `Trending this week\n${fmtRows((d.results ?? []).slice(0, limit))}`
}

export async function searchPerson(args: { query?: string; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 8, 20)
  const d = await get<any>("/search/person", { query: args.query ?? "", include_adult: "false" })
  const rows = (d.results ?? []).slice(0, limit)
  if (!rows.length) return `Nobody found for ${args.query}`
  return rows.map((r: any) => `${r.name ?? "?"} (id ${r.id ?? "?"}) | known for ${r.known_for_department ?? "?"}\n  ${((r.known_for ?? []) as any[]).slice(0, 3).map((k: any) => k.title ?? k.name ?? "").filter(Boolean).join(", ")}`).join("\n\n")
}

export async function movieDetails(args: { id?: string }): Promise<string> {
  const id = (args.id ?? "").trim()
  if (!id) throw new TmdbError("Provide a TMDB movie id")
  const d = await get<any>(`/movie/${encodeURIComponent(id)}`, {})
  return `${d.title ?? "?"} (${String(d.release_date ?? "").slice(0, 4)}) | ${d.vote_average ?? "n/a"}/10 (${d.vote_count ?? 0} votes)\n${(d.genres ?? []).map((g: any) => g.name).join(", ")}\n${(d.overview ?? "").slice(0, 300)}`
}

export async function tvDetails(args: { id?: string }): Promise<string> {
  const id = (args.id ?? "").trim()
  if (!id) throw new TmdbError("Provide a TMDB TV id")
  const d = await get<any>(`/tv/${encodeURIComponent(id)}`, {})
  return `${d.name ?? "?"} (${String(d.first_air_date ?? "").slice(0, 4)}) | ${d.vote_average ?? "n/a"}/10 | ${d.number_of_seasons ?? "?"} seasons, ${d.number_of_episodes ?? "?"} episodes\n${(d.genres ?? []).map((g: any) => g.name).join(", ")}\n${(d.overview ?? "").slice(0, 300)}`
}

export async function personDetails(args: { id?: string }): Promise<string> {
  const id = (args.id ?? "").trim()
  if (!id) throw new TmdbError("Provide a TMDB person id")
  const d = await get<any>(`/person/${encodeURIComponent(id)}`, {})
  return `${d.name ?? "?"} | ${d.known_for_department ?? "?"}\nBorn: ${d.birthday ?? "?"}${d.place_of_birth ? ` in ${d.place_of_birth}` : ""}\n${(d.biography ?? "").slice(0, 300)}`
}

export async function movieCredits(args: { id?: string }): Promise<string> {
  const id = (args.id ?? "").trim()
  if (!id) throw new TmdbError("Provide a TMDB movie id")
  const d = await get<any>(`/movie/${encodeURIComponent(id)}/credits`, {})
  const cast = (d.cast ?? []).slice(0, 10).map((c: any) => `${c.name ?? "?"} as ${c.character ?? "?"}`)
  const crew = (d.crew ?? []).filter((c: any) => c.job === "Director").map((c: any) => c.name)
  return [`Cast: ${cast.join(", ") || "n/a"}`, crew.length ? `Director: ${crew.join(", ")}` : ""].filter(Boolean).join("\n")
}

export async function discoverMovies(args: { genre?: string; year?: string; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 8, 20)
  const params: Record<string, string> = { sort_by: "popularity.desc" }
  if ((args.genre ?? "").trim()) params.with_genres = args.genre!.trim()
  if ((args.year ?? "").trim()) params.primary_release_year = args.year!.trim()
  const d = await get<any>("/discover/movie", params)
  return `Discover movies\n${fmtRows((d.results ?? []).slice(0, limit)) || "None found"}`
}

export async function discoverTv(args: { genre?: string; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 8, 20)
  const params: Record<string, string> = { sort_by: "popularity.desc" }
  if ((args.genre ?? "").trim()) params.with_genres = args.genre!.trim()
  const d = await get<any>("/discover/tv", params)
  return `Discover TV\n${fmtRows((d.results ?? []).slice(0, limit)) || "None found"}`
}
