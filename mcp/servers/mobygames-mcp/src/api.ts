export class MobyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MobyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.mobygames.com/v1";

async function req(path: string, params: Record<string, string | number | undefined>): Promise<string> {
  void params;
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
  } catch (e) {
    throw new MobyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new MobyError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

function key(): string {
  const k = process.env.MOBYGAMES_API_KEY;
  if (!k) throw new MobyError("Set MOBYGAMES_API_KEY (free MobyGames API key).");
  return k;
}

export function searchGames(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return req(`/games?api_key=${encodeURIComponent(key())}&title=${encodeURIComponent(query)}&limit=${n}`, {});
}

export function getGame(gameId: string): Promise<string> {
  return req(`/games/${encodeURIComponent(gameId)}?api_key=${encodeURIComponent(key())}`, {});
}

// ---- muxF tools:

const STEAM_STORE = "https://store.steampowered.com/api";

interface SteamApp {
  steam_appid?: number;
  name?: string;
  type?: string;
  is_free?: boolean;
  short_description?: string;
  developers?: string[];
  publishers?: string[];
  genres?: Array<{ id?: string; description?: string }>;
  release_date?: { date?: string; coming_soon?: boolean };
  price_overview?: { currency?: string; initial?: number; final?: number; discount_percent?: number; final_formatted?: string; initial_formatted?: string };
  metacritic?: { score?: number; url?: string };
  recommendations?: { total?: number };
  achievements?: { total?: number; highlighted?: Array<{ name?: string; description?: string }> };
  categories?: Array<{ id?: number; description?: string }>;
  platforms?: Record<string, boolean>;
  required_age?: number;
  controller_support?: string;
  supported_languages?: Record<string, string> | string[];
  packages?: Array<{ package_id?: number; price?: number }>;
  website?: string;
}

interface SteamSpecial {
  id?: number;
  name?: string;
  type?: string;
  final_price?: number;
  discount_percent?: number;
  final_formatted?: string;
  header_image?: string;
  capsule_image?: string;
}

// Steam sends supported_languages as an object keyed by code, not a list.

