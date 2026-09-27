const BASE = "https://api.jikan.moe/v4"
const UA = "mrfentmen-jikan-mcp/1.0 (https://github.com/mrfentmen)"
export class JikanError extends Error {}

async function get<T>(url: string, retries = 2): Promise<T> {
  let last: unknown = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
      if (res.status === 429 || res.status === 504) {
        last = new JikanError(`Jikan is busy (${res.status}), wait and retry`)
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
        continue
      }
      if (!res.ok) throw new JikanError(`Jikan error ${res.status}`)
      return (await res.json()) as T
    } catch (e) {
      last = e
      if (e instanceof JikanError && !String(e.message).startsWith("Jikan is busy")) throw e
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
    }
  }
  throw last instanceof Error ? last : new JikanError("Jikan request failed")
}

export async function searchAnime(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new JikanError("Provide an anime title")
  const limit = Math.min(args.limit ?? 5, 15)
  const d = await get<any>(`${BASE}/anime?q=${encodeURIComponent(q)}&limit=${limit}&sfw=true`)
  const items = d?.data ?? []
  if (!items.length) return "No anime found"
  return items.map((a: any, i: number) => `${i + 1}. ${a.title} (${a.year ?? "year n/a"}) | score ${a.score ?? "n/a"} | id ${a.mal_id}\n   ${a.synopsis ? a.synopsis.slice(0, 160) + "..." : "no synopsis"}`).join("\n\n")
}

export async function animeInfo(args: { animeId?: number }): Promise<string> {
  const id = args.animeId
  if (id === undefined || id <= 0) throw new JikanError("Provide a MyAnimeList anime ID")
  const d = await get<any>(`${BASE}/anime/${id}/full`)
  const a = d?.data ?? {}
  return `Title: ${a.title}\n${a.title_english ? `English: ${a.title_english}\n` : ""}Type: ${a.type ?? "n/a"} | Episodes: ${a.episodes ?? "n/a"} | Status: ${a.status ?? "n/a"}\nScore: ${a.score ?? "n/a"} (${a.scored_by ?? "?"} votes) | Rank: ${a.rank ?? "n/a"}\nGenres: ${(a.genres ?? []).map((g: any) => g.name).join(", ") || "n/a"}\n${a.synopsis ? `\n${a.synopsis.slice(0, 400)}` : ""}`
}

export async function seasonAnime(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}/seasons/now?limit=${limit}&sfw=true`)
  const items = d?.data ?? []
  if (!items.length) return "No season anime"
  return items.map((a: any, i: number) => `${i + 1}. ${a.title} | ${a.type ?? ""} | score ${a.score ?? "n/a"}`).join("\n")
}

export async function searchManga(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new JikanError("Provide a manga title")
  const limit = Math.min(args.limit ?? 5, 15)
  const d = await get<any>(`${BASE}/manga?q=${encodeURIComponent(q)}&limit=${limit}&sfw=true`)
  const items = d?.data ?? []
  if (!items.length) return "No manga found"
  return items.map((m: any, i: number) => `${i + 1}. ${m.title} (${m.year ?? "year n/a"}) | score ${m.score ?? "n/a"} | id ${m.mal_id}\n   ${m.synopsis ? m.synopsis.slice(0, 160) + "..." : "no synopsis"}`).join("\n\n")
}

export async function mangaInfo(args: { mangaId?: number }): Promise<string> {
  const id = args.mangaId
  if (id === undefined || id <= 0) throw new JikanError("Provide a MyAnimeList manga ID")
  const d = await get<any>(`${BASE}/manga/${id}/full`)
  const m = d?.data ?? {}
  return `Title: ${m.title}\nType: ${m.type ?? "n/a"} | Chapters: ${m.chapters ?? "n/a"} | Volumes: ${m.volumes ?? "n/a"} | Status: ${m.status ?? "n/a"}\nScore: ${m.score ?? "n/a"} (${m.scored_by ?? "?"} votes) | Rank: ${m.rank ?? "n/a"}\nGenres: ${(m.genres ?? []).map((g: any) => g.name).join(", ") || "n/a"}\n${m.synopsis ? `\n${m.synopsis.slice(0, 400)}` : ""}`
}

export async function topAnime(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}/top/anime?limit=${limit}&sfw=true`)
  const items = d?.data ?? []
  if (!items.length) return "No top anime"
  return items.map((a: any, i: number) => `${i + 1}. ${a.title} | score ${a.score ?? "n/a"} | rank ${a.rank ?? "?"} | id ${a.mal_id}`).join("\n")
}

export async function topManga(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}/top/manga?limit=${limit}&sfw=true`)
  const items = d?.data ?? []
  if (!items.length) return "No top manga"
  return items.map((m: any, i: number) => `${i + 1}. ${m.title} | score ${m.score ?? "n/a"} | rank ${m.rank ?? "?"} | id ${m.mal_id}`).join("\n")
}

export async function animeCharacters(args: { animeId?: number }): Promise<string> {
  const id = args.animeId
  if (id === undefined || id <= 0) throw new JikanError("Provide a MyAnimeList anime ID")
  const d = await get<any>(`${BASE}/anime/${id}/characters`)
  const items = d?.data ?? []
  if (!items.length) return "No characters found"
  return items.slice(0, 15).map((c: any, i: number) => {
    const ch = c.character ?? {}
    const va = (c.voice_actors ?? []).find((v: any) => v.language === "Japanese")
    return `${i + 1}. ${ch.name ?? "?"} (${c.role ?? "?"})${va ? ` voiced by ${va.person?.name ?? "?"}` : ""}`
  }).join("\n")
}

export async function scheduleDay(args: { day?: string; limit?: number }): Promise<string> {
  const day = (args.day ?? "").trim().toLowerCase()
  if (!day) throw new JikanError("Provide a weekday like monday")
  const limit = Math.min(args.limit ?? 10, 20)
  const d = await get<any>(`${BASE}/schedules?filter=${encodeURIComponent(day)}&limit=${limit}&sfw=true`)
  const items = d?.data ?? []
  if (!items.length) return `Nothing airing ${day}`
  return items.map((a: any, i: number) => `${i + 1}. ${a.title} | ${a.broadcast?.string ?? ""} | score ${a.score ?? "n/a"}`).join("\n")
}
