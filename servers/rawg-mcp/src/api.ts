export class RawgError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RawgError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.rawg.io/api";

async function req(path: string, params: Record<string, string | number | undefined>): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new RawgError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new RawgError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

function key(): string {
  const k = process.env.RAWG_API_KEY;
  if (!k) throw new RawgError("Set RAWG_API_KEY (free at rawg.io/apidocs).");
  return k;
}

function slimGame(g: Record<string, unknown>): Record<string, unknown> {
  const plats = ((g.platforms ?? []) as Record<string, unknown>[])
    .map((p) => (p.platform as Record<string, unknown> | undefined)?.name).filter(Boolean);
  const genres = ((g.genres ?? []) as Record<string, unknown>[]).map((x) => x.name).filter(Boolean);
  return { id: g.id, slug: g.slug, name: g.name, released: g.released, rating: g.rating,
    ratings_count: g.ratings_count, metacritic: g.metacritic ?? null, platforms: plats,
    genres, image: g.background_image ?? null };
}

export function searchGames(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 40);
  return req(`/games?key=${encodeURIComponent(key())}&search=${encodeURIComponent(query)}&page_size=${n}`, {}).then((t) => {
    const d = JSON.parse(t) as { count?: number; results?: Record<string, unknown>[] };
    return JSON.stringify({ count: d.count ?? null, games: (d.results ?? []).map(slimGame) }, null, 2);
  });
}

export function getGame(gameId: string): Promise<string> {
  return req(`/games/${encodeURIComponent(gameId)}?key=${encodeURIComponent(key())}`, {}).then((t) =>
    JSON.stringify(slimGame(JSON.parse(t) as Record<string, unknown>), null, 2));
}

