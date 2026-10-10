const BASE = 'https://www.episodate.com/api';
const UA = 'mrfentmen-episodate-mcp/1.0';

export interface SearchArgs {
  query: string;
}

export interface ShowArgs {
  id: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide a show name.';
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}&page=1`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Episodate returned ${res.status}`);
  const d = (await res.json()) as { total?: number; tv_shows?: Array<{ id?: number; name?: string; status?: string; start_date?: string; network?: string }> };
  const shows = d.tv_shows ?? [];
  if (!shows.length) return `No shows found for "${query}".`;
  return `Episodate results for "${query}" (total ${d.total ?? shows.length}):\n` +
    shows.map((s, i) => `${i + 1}. ${s.name ?? '?'} (id=${s.id ?? '?'}) [${s.status ?? '?'}] ${s.network ?? ''}`.trim()).join('\n');
}

export async function show(args: ShowArgs): Promise<string> {
  const id = Number(args.id);
  if (!Number.isFinite(id) || id <= 0) return 'Provide a show id.';
  const res = await fetch(`${BASE}/show-details?thetvdb=${id}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Episodate returned ${res.status}`);
  const d = (await res.json()) as {
    tvShow?: {
      id?: number;
      name?: string;
      permalink?: string;
      start_date?: string;
      end_date?: string;
      country?: string;
      network?: string;
      status?: string;
      description?: string;
      image_thumbnail_path?: string;
      rating?: string;
      episodes?: Array<{ name?: string; episode?: number; season?: number; air_date?: string }>;
    };
  };
  const s = d.tvShow ?? {};
  return [
    `Show #${s.id ?? id}: ${s.name ?? '?'}`,
    `Status: ${s.status ?? '?'} | ${s.start_date ?? '?'} - ${s.end_date ?? 'n/a'}`,
    `${s.country ?? '?'} on ${s.network ?? '?'} | Rating: ${s.rating ?? '?'}`,
    s.description ? `Description: ${s.description.slice(0, 300)}` : null,
    s.image_thumbnail_path ? `Image: ${s.image_thumbnail_path}` : null,
    (s.episodes ?? []).length ? `Latest episodes:\n${(s.episodes ?? []).slice(-5).map((e) => `  S${e.season ?? '?'}E${e.episode ?? '?'} ${e.name ?? '?'} (${e.air_date ?? ''})`).join('\n')}` : null,
    `Permalink: ${s.permalink ?? ''}`,
  ].filter(Boolean).join('\n');
}

// ---- muxA tools:
// The existing tools search one page and print a show's last five episodes.
// These add the most popular list, and the parts of a show record the existing
// tool never reads: the whole episode list, grouped by season, and a per season
// summary.
interface EpisodateEpisode {
  season?: number
  episode?: number
  name?: string
  air_date?: string
}

interface EpisodateShow {
  id?: number
  name?: string
  permalink?: string
  url?: string
  status?: string
  start_date?: string
  end_date?: string | null
  country?: string
  network?: string
  runtime?: number | null
  rating?: string | null
  rating_count?: number
  genres?: string[]
  countdown?: Record<string, unknown> | null
  episodes?: EpisodateEpisode[]
}

// The API answers an unknown permalink with tvShow as an EMPTY ARRAY rather
// than an object or a 404, verified with does-not-exist-zzz, so every read goes
// through this and never assumes an object came back.
function episodateShow(payload: unknown): EpisodateShow | null {
  const show = (payload as { tvShow?: unknown })?.tvShow
  if (!show || Array.isArray(show) || typeof show !== "object") return null
  return show as EpisodateShow
}

function episodateAirDate(value: unknown): string {
  return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : ""
}

function episodateToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function episodateEpisodeLabel(episode: EpisodateEpisode): string {
  const season = typeof episode.season === "number" ? episode.season : "?"
  const number = typeof episode.episode === "number" ? episode.episode : "?"
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`
}

export async function popularShows(args: { page?: number }): Promise<string> {
  const page = Math.max(1, Math.trunc(args.page ?? 1))
  const res = await fetch(`${BASE}/most-popular?page=${page}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Episodate returned ${res.status}`)
  const data = (await res.json()) as { total?: number; page?: number; pages?: number; tv_shows?: EpisodateShow[] }
  const rows = Array.isArray(data.tv_shows) ? data.tv_shows : []
  if (!rows.length) return `Episodate has no popular shows on page ${page}.`
  const total = Number(data.total ?? 0)
  const pages = Number(data.pages ?? 1)
  // Asking for a page past the end returns the last page rather than an empty
  // list, verified with page 99, so the page the API served is reported.
  const served = Number(data.page ?? page)
  return [
    `Most popular shows: ${total.toLocaleString()} in all, page ${served} of ${pages}, 20 per page`,
    served !== page ? `Page ${page} was past the end, so page ${served} was served instead.` : "",
    "",
    ...rows.map((row, i) => {
      const bits = [row.status ?? "status unknown", row.network ?? "network unknown", episodateAirDate(row.start_date) || "start date unknown"]
      return `${(served - 1) * 20 + i + 1}. ${row.name ?? "(unnamed)"} (${row.permalink ?? "?"}) - ${bits.join(" | ")}`
    }),
    "",
    `The list is fixed at 20 per page, a limit parameter is ignored, verified live. Ask for page ${served + 1} for more.`,
  ]
    .filter((line) => line !== "")
    .join("\n")
}

async function episodateFetchShow(who: string): Promise<EpisodateShow> {
  const wanted = who.trim()
  if (!wanted) throw new Error("Provide a show, by permalink like breaking-bad or by numeric id like 17658.")
  // The permalink and the numeric id both resolve through q. The thetvdb
  // parameter that the original tool uses is not supported and answers an empty
  // tvShow, verified with the real TVDB id 81189 for Breaking Bad.
  const res = await fetch(`${BASE}/show-details?q=${encodeURIComponent(wanted)}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Episodate returned ${res.status}`)
  const show = episodateShow(await res.json())
  if (!show) {
    throw new Error(
      `Episodate has no show for "${wanted}". Use the permalink, like breaking-bad, or the numeric id from the search tool. A TVDB id does not work here.`
    )
  }
  return show
}

