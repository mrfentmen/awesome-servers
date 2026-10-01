export class ListenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ListenError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.LISTENNOTES_API_KEY;
  if (!k) throw new ListenError("Set LISTENNOTES_API_KEY (free Listen Notes tier).");
  return { ...UA, Accept: "application/json", "X-ListenAPI-Key": k };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://listen-api.listennotes.com/api/v2" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new ListenError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new ListenError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function search(query: string): Promise<string> {
  return get(`/search?q=${encodeURIComponent(query)}&type=episode&len_min=2`);
}

export function bestPodcasts(page?: string): Promise<string> {
  const p = Number(page ?? 1) || 1;
  return get(`/best_podcasts?page=${p}`);
}

export function getEpisode(episodeId: string): Promise<string> {
  return get(`/episodes/${encodeURIComponent(episodeId)}`);
}



export function justListen(): Promise<string> {
  return get("/just_listen");
}

export function getPodcast(podcastId: string): Promise<string> {
  return get(`/podcasts/${encodeURIComponent(podcastId)}`);
}

export function podcastRecommendations(podcastId: string): Promise<string> {
  return get(`/podcasts/${encodeURIComponent(podcastId)}/recommendations`);
}

export function listGenres(): Promise<string> {
  return get("/genres");
}

export function trendingSearches(): Promise<string> {
  return get("/trending_searches");
}

// ---- muxF tools:
/**
 * Keyless podcast surfaces: the Apple Podcasts catalogue (itunes.apple.com) and
 * the podcast RSS feeds it hands out. Listen Notes itself needs a key, but the
 * shows and their feeds are public documents.
 */
const APPLE_SEARCH = "https://itunes.apple.com/search";
const APPLE_LOOKUP = "https://itunes.apple.com/lookup";

interface ApplePodcast {
  collectionId?: number;
  collectionName?: string;
  artistName?: string;
  feedUrl?: string;
  genres?: string[];
  trackCount?: number;
  releaseDate?: string;
  primaryGenreName?: string;
  artworkUrl100?: string;
}

interface AppleResult {
  resultCount?: number;
  results?: ApplePodcast[];
}

async function appleJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { ...UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
  } catch (e) {
    throw new ListenError(`Network error: ${(e as Error).message}`);
  }
  if (res.status === 404) throw new ListenError("The Apple Podcasts catalogue returned 404.");
  if (!res.ok) throw new ListenError(`Apple Podcasts returned HTTP ${res.status}`);
  const body = await res.text();
  if (!body.trim()) throw new ListenError("Apple Podcasts returned an empty body.");
  return JSON.parse(body) as T;
}

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const rssTag = (block: string, tag: string): string | null => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;
  const value = match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return value || null;
};

/** Search the Apple Podcasts catalogue, which is public and needs no key. */
export async function applePodcastSearch(args: { term: string; limit?: number }): Promise<string> {
  const term = clean(args?.term);
  if (!term) throw new ListenError("Give a search term.");
  const n = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
  const data = await appleJson<AppleResult>(
    `${APPLE_SEARCH}?term=${encodeURIComponent(term)}&media=podcast&entity=podcast&limit=${n}`,
  );
  const rows = data.results ?? [];
  if (!rows.length) throw new ListenError(`No Apple Podcasts result for "${term}".`);
  const lines = [`Apple Podcasts search for "${term}": ${data.resultCount ?? rows.length} match(es), showing ${rows.length}`];
  rows.forEach((row, i) => {
    const genres = (row.genres ?? []).filter((g) => g !== "Podcasts").join(", ") || "not reported";
    lines.push(
      `  ${i + 1}. ${clean(row.collectionName) || "untitled show"} by ${clean(row.artistName) || "not reported"}`,
    );
    lines.push(
      `     ${row.trackCount ?? "not reported"} episode(s) · ${genres} · last release ${row.releaseDate ? String(row.releaseDate).slice(0, 10) : "not reported"}`,
    );
    lines.push(`     feed ${row.feedUrl ?? "not published by the show"}`);
  });
  return lines.join("\n");
}

/** Read a show's own RSS feed and measure how consistently it publishes. */
export async function podcastFeedCadence(args: { feed: string; limit?: number }): Promise<string> {
  const feed = clean(args?.feed);
  if (!/^https:\/\/\S+$/i.test(feed)) throw new ListenError("Give the https:// RSS feed URL of a podcast.");
  const n = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 25);
  let res: Response;
  try {
    res = await fetch(feed, { headers: { ...UA, Accept: "application/rss+xml, application/xml, text/xml" }, signal: AbortSignal.timeout(30000) });
  } catch (e) {
    throw new ListenError(`Network error: ${(e as Error).message}`);
  }
  if (res.status === 403) throw new ListenError(`The feed host refused the request (HTTP 403): ${new URL(feed).hostname}`);
  if (!res.ok) throw new ListenError(`The feed returned HTTP ${res.status}`);
  const CAP = 8_000_000;
  const whole = await res.text();
  const xml = whole.slice(0, CAP);
  const truncated = whole.length > CAP;
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  if (!items.length) throw new ListenError("That URL is not a podcast feed with any episode in it.");
  const dates = items
    .map((item) => Date.parse(rssTag(item, "pubDate") ?? ""))
    .filter((n2) => Number.isFinite(n2))
    .sort((a, b) => b - a);
  if (!dates.length) throw new ListenError("The feed has episodes but none of them carries a pubDate.");

  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i += 1) gaps.push((dates[i - 1] - dates[i]) / 86_400_000);
  const sorted = [...gaps].sort((a, b) => a - b);
  const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
  const longest = sorted.length ? sorted[sorted.length - 1] : null;
  const perYear = median && median > 0 ? Math.round((365 / median) * 10) / 10 : null;
  const showTitle = rssTag(xml.slice(0, 20000), "title") ?? new URL(feed).hostname;
  const last = dates[0];
  const sinceLast = Math.round((Date.now() - last) / 86_400_000);

  const lines = [
    `Feed cadence for ${clean(showTitle)}`,
    `  feed host: ${new URL(feed).hostname}`,
    `  episodes in the feed: ${items.length}${truncated ? ", at least" : ""}${dates.length !== items.length ? ` (${items.length - dates.length} without a pubDate)` : ""}`,
    `  newest episode: ${new Date(last).toISOString().slice(0, 10)}, ${sinceLast} day(s) ago`,
    dates.length > 1 ? `  oldest episode: ${new Date(dates[dates.length - 1]).toISOString().slice(0, 10)}` : "  oldest episode: not reported",
    median !== null ? `  median gap between episodes: ${Math.round(median)} day(s)` : "  median gap: only one dated episode",
    longest !== null && median !== null ? `  longest gap: ${Math.round(longest)} day(s)` : "",
    perYear !== null ? `  that cadence is about ${perYear} episode(s) a year` : "",
    "  newest episodes:",
  ];
  for (const item of items.slice(0, n)) {
    const when = rssTag(item, "pubDate");
    const whenText = when ? new Date(Date.parse(when)).toISOString().slice(0, 10) : "pubDate not reported";
    lines.push(`    ${whenText} · ${(rssTag(item, "title") ?? "untitled episode").slice(0, 110)}`);
  }
  if (items.length > n) lines.push(`    ...and ${items.length - n} more in the feed.`);
  return lines.filter((line) => line !== "").join("\n");
}
