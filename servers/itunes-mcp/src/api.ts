
export interface m0_SearchArgs {
  query: string;
  limit?: number;
}

const m0 = (() => {
const BASE = 'https://itunes.apple.com/search';

async function search(args: m0_SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const url = `${BASE}?term=${encodeURIComponent(q)}&limit=${limit}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-itunes-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`iTunes returned ${res.status}`);
  const data = (await res.json()) as {
    resultCount?: number;
    results?: Array<{
      kind?: string;
      trackName?: string;
      collectionName?: string;
      artistName?: string;
      releaseDate?: string;
      trackViewUrl?: string;
    }>;
  };
  const results = (data.results ?? []).slice(0, limit);
  if (!results.length) return `No iTunes results for "${q}".`;
  return `iTunes results for "${q}" (${data.resultCount ?? results.length} total, ${results.length} shown):\n` +
    results
      .map((r, i) => `${i + 1}. ${r.trackName ?? r.collectionName ?? 'untitled'} | ${r.artistName ?? ''} | ${r.kind ?? ''} | ${(r.releaseDate ?? '').slice(0, 10)}${r.trackViewUrl ? `\n   ${r.trackViewUrl}` : ''}`)
      .join('\n');
}

return { search };
})();

const m1 = (() => {
const UA = "mrfentmen-app-store-mcp/1.0 (https://github.com/mrfentmen)"
class AppStoreError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new AppStoreError("App Store feed rate limit hit, wait and retry")
  if (!res.ok) throw new AppStoreError(`App Store feed error ${res.status}`)
  return (await res.json()) as T
}

function fmtEntry(e: any, i: number): string {
  return `${i + 1}. ${e?.["im:name"]?.label ?? "Untitled"}\n   ${e?.["im:artist"]?.label ?? "n/a"} | rating ${e?.["im:rating"]?.label ?? "n/a"} | id ${e?.id?.attributes?.["im:id"] ?? "?"}`
}

async function topFree(args: { country?: string; limit?: number }): Promise<string> {
  const country = (args.country ?? "us").toLowerCase()
  const limit = Math.min(args.limit ?? 10, 50)
  const d = await get<any>(`https://itunes.apple.com/${country}/rss/topfreeapplications/limit=${limit}/json`)
  const entries = d?.feed?.entry ?? []
  if (!entries.length) return "No apps returned"
  return `Top free apps (${country}):\n\n${entries.map(fmtEntry).join("\n")}`
}

async function topPaid(args: { country?: string; limit?: number }): Promise<string> {
  const country = (args.country ?? "us").toLowerCase()
  const limit = Math.min(args.limit ?? 10, 50)
  const d = await get<any>(`https://itunes.apple.com/${country}/rss/toppaidapplications/limit=${limit}/json`)
  const entries = d?.feed?.entry ?? []
  if (!entries.length) return "No apps returned"
  return `Top paid apps (${country}):\n\n${entries.map(fmtEntry).join("\n")}`
}

async function appLookup(args: { appId?: number }): Promise<string> {
  const id = args.appId
  if (id === undefined || id <= 0) throw new AppStoreError("Provide an App Store numeric ID")
  const d = await get<any>(`https://itunes.apple.com/lookup?id=${id}`)
  const r = d?.results?.[0]
  if (!r) return "App not found"
  return `Name: ${r.trackName ?? "n/a"}\nDeveloper: ${r.artistName ?? "n/a"}\nCategory: ${r.primaryGenreName ?? "n/a"} | Rating: ${r.averageUserRating ?? "n/a"} (${r.userRatingCount ?? 0} ratings)\nPrice: ${r.formattedPrice ?? "n/a"}\nSize: ${r.fileSizeBytes ? (Number(r.fileSizeBytes) / 1e6).toFixed(1) + " MB" : "n/a"}\nURL: ${r.trackViewUrl ?? "n/a"}`
}

return { AppStoreError, appLookup, topFree, topPaid };
})();

const m2 = (() => {
const BASE = "https://itunes.apple.com"
const UA = "mrfentmen-podcast-search-mcp/1.0 (https://github.com/mrfentmen)"
class PodcastError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new PodcastError(`iTunes error ${res.status}`)
  return (await res.json()) as T
}

async function searchPodcasts(args: { query?: string; limit?: number }): Promise<string> {
  const q = encodeURIComponent(args.query ?? "")
  const limit = Math.min(args.limit ?? 8, 20)
  const d = await get<any>(`${BASE}/search?term=${q}&limit=${limit}&media=podcast`)
  const rows = d.results ?? []
  return rows.map((p: any, i: number) =>
    `${i + 1}. ${p.collectionName ?? ""}\n   ${p.artistName ?? ""} | ${p.trackCount ?? "?"} episodes | ${p.primaryGenreName ?? ""}\n   ${p.collectionViewUrl ?? ""}`
  ).join("\n\n") || "No podcasts found"
}

async function topPodcasts(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 25)
  const d = await get<any>(`${BASE}/us/rss/toppodcasts/limit=${limit}/json`)
  const rows = d.feed?.entry ?? []
  return rows.map((p: any, i: number) => {
    const name = typeof p["im:name"]?.label === "string" ? p["im:name"].label : ""
    const artist = typeof p["im:artist"]?.label === "string" ? p["im:artist"].label : ""
    return `${i + 1}. ${name}\n   ${artist}`
  }).join("\n") || "No podcasts found"
}

return { PodcastError, searchPodcasts, topPodcasts };
})();

export const AppStoreError = m1.AppStoreError;
export const PodcastError = m2.PodcastError;
export const appLookup = m1.appLookup;
export const search = m0.search;
export const searchPodcasts = m2.searchPodcasts;
export const topFree = m1.topFree;
export const topPaid = m1.topPaid;
export const topPodcasts = m2.topPodcasts;
export const m0_search = m0.search;
export const m1_topFree = m1.topFree;
export const m1_appLookup = m1.appLookup;
export const m1_AppStoreError = m1.AppStoreError;
export const m1_topPaid = m1.topPaid;
export const m2_PodcastError = m2.PodcastError;
export const m2_searchPodcasts = m2.searchPodcasts;
export const m2_topPodcasts = m2.topPodcasts;

// ---- muxC tools:

