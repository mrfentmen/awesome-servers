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

// ---- muxH tools:
// The tools above read RAWG, which needs a key. Steam publishes its own store
// metadata and SteamSpy publishes ownership and concurrency estimates, all
// keylessly, and between them they answer the two questions a game database
// actually gets asked: what is this title, and how big is it actually.

const STEAM_APP = "https://store.steampowered.com/api/appdetails"
const STEAMSPY = "https://steamspy.com/api.php"
const RAWG_UA = "rawg-mcp/1.1 (https://github.com/mrfentmen/rawg-mcp)"

interface SteamApp {
  steam_appid?: number
  name?: string
  type?: string
  is_free?: boolean
  short_description?: string
  about_the_game?: string
  detailed_description?: string
  developers?: string[]
  publishers?: string[]
  release_date?: { coming_soon?: boolean; date?: string }
  platforms?: Record<string, boolean>
  categories?: Array<{ id?: number; description?: string }>
  genres?: Array<{ id?: number; description?: string }>
  recommendations?: { total?: number }
  metacritic?: { score?: number } | null
  price_overview?: { initial_formatted?: string; final_formatted?: string; discount_percent?: number; currency?: string } | null
  content_descriptors?: { ids?: number[]; notes?: string } | null
  required_age?: number
  dlc?: number[]
  achievements?: { total?: number; highlighted?: Array<{ name?: string; description?: string }> }
  screenshots?: Array<{ id?: number; path_full?: string }>
  movies?: Array<{ name?: string; webm?: Record<string, string> }>
  supported_languages?: string
}

interface SteamSpyApp {
  appid?: number
  name?: string
  developer?: string
  publisher?: string
  genre?: string
  owners?: string
  owners_min?: number
  owners_max?: number
  ccu?: number
  positive?: number
  negative?: number
  price?: string
  initialprice?: string
  discount?: string
  average_forever?: number
  median_forever?: number
  average_2weeks?: number
  median_2weeks?: number
  score_rank?: number
  userscore?: number
  tags?: Record<string, number>
  languages?: Record<string, number>
}

async function steamApp(appId: string): Promise<{ app: SteamApp; }> {
  if (!/^\d{1,10}$/.test(appId)) throw new RawgError(`"${appId}" is not a Steam app id. Those are the numbers in store.steampowered.com/app/<id>/.`)
  let res: Response
  try {
    res = await fetch(`${STEAM_APP}?appids=${encodeURIComponent(appId)}&l=english`, {
      headers: { Accept: "application/json", "User-Agent": RAWG_UA },
      signal: AbortSignal.timeout(30000),
    })
  } catch (e) {
    throw new RawgError(`Could not reach the Steam store: ${e instanceof Error ? e.message : String(e)}`)
  }
  if (!res.ok) throw new RawgError(`Steam store error ${res.status}: ${res.statusText}`)
  const body = (await res.json()) as Record<string, { success?: boolean; data?: SteamApp }>
  const entry = body[appId]
  if (!entry?.success || !entry.data) throw new RawgError(`Steam has no store page for app ${appId}, or it is not published in this region.`)
  return { app: entry.data }
}

async function steamSpyApp(appId: string): Promise<SteamSpyApp | null> {
  try {
    const res = await fetch(`${STEAMSPY}?request=appdetails&appid=${encodeURIComponent(appId)}`, {
      headers: { Accept: "application/json", "User-Agent": RAWG_UA },
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) return null
    const body = (await res.json()) as SteamSpyApp & { error?: string }
    return body.error ? null : body
  } catch {
    return null
  }
}

const stripTags = (html: string | undefined): string =>
  String(html ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()

