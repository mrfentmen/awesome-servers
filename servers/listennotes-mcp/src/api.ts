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
