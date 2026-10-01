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
/**
 * MobyGames needs a key. Valve's own store endpoints are public, so a game
 * profile and the current specials list both come from there.
 */
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
const steamLanguages = (value: SteamApp["supported_languages"]): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v));
  return Object.values(value).map((v) => String(v)).sort();
};

const steamPlain = (value: unknown, max = 160): string =>
  String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

async function steamJson<T>(path: string, what: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${STEAM_STORE}${path}`, { headers: { ...UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
  } catch (e) {
    throw new MobyError(`Network error: ${(e as Error).message}`);
  }
  if (res.status === 404) throw new MobyError(`Steam has no ${what}.`);
  if (!res.ok) throw new MobyError(`The Steam store returned HTTP ${res.status} for ${what}.`);
  const body = (await res.text()).trim();
  if (!body) throw new MobyError(`The Steam store returned an empty body for ${what}.`);
  return JSON.parse(body) as T;
}

/** One game's store profile, from Valve's own app details document. */
export async function steamGameProfile(args: { appid: number; limit?: number }): Promise<string> {
  const appid = Number(args?.appid);
  if (!Number.isInteger(appid) || appid <= 0) throw new MobyError("Give a Steam app id, e.g. 400 for Portal.");
  const n = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 20);

  const data = await steamJson<Record<string, { success?: boolean; data?: SteamApp }>>(
    `/appdetails?appids=${appid}&cc=us&l=en`,
    `app details for app id ${appid}`,
  );
  const entry = data[String(appid)];
  if (!entry?.success) throw new MobyError(`Steam reports no store data for app id ${appid}. It may not be on sale in this region.`);
  const app = entry.data;
  if (!app) throw new MobyError(`Steam returned an empty document for app id ${appid}.`);

  const price = app.price_overview;
  const platforms = Object.entries(app.platforms ?? {})
    .filter(([, ok]) => ok)
    .map(([name]) => name);
  const dlcCount = Array.isArray((app as unknown as { dlc?: unknown[] }).dlc) ? ((app as unknown as { dlc: unknown[] }).dlc).length : 0;
  const lines = [
    `${app.name ?? `app ${appid}`} (Steam app ${appid}, ${app.type ?? "not reported"})`,
    `  ${steamPlain(app.short_description, 200) || "no store description"}`,
    `  developers: ${(app.developers ?? []).join(", ") || "not reported"}`,
    `  publishers: ${(app.publishers ?? []).join(", ") || "not reported"}`,
    `  genres: ${(app.genres ?? []).map((g) => g.description).filter(Boolean).join(", ") || "not reported"}`,
    `  release: ${app.release_date?.date ?? "not reported"}${app.release_date?.coming_soon ? " (not released yet)" : ""}`,
    `  platforms: ${platforms.length ? platforms.join(", ") : "not reported"}`,
    `  price: ${price ? `${price.final_formatted || `$${(price.final! / 100).toFixed(2)}`}${price.discount_percent ? `, cut from ${price.initial_formatted || `$${(price.initial! / 100).toFixed(2)}`} (${price.discount_percent}% off)` : ", no discount"}` : app.is_free ? "free to play" : "not reported"}`,
    `  user reviews recommended: ${app.recommendations?.total ?? "not reported"}`,
    `  Metacritic: ${app.metacritic?.score ?? "not reported"}`,
    `  achievements: ${app.achievements?.total ?? "not reported"} total, ${app.achievements?.highlighted?.length ?? 0} highlighted`,
    `  store categories: ${(app.categories ?? []).map((c) => c.description).filter(Boolean).slice(0, 6).join(", ") || "not reported"}`,
    `  languages: ${steamLanguages(app.supported_languages).slice(0, 8).join(", ") || "not reported"}${app.controller_support ? `, controller support: ${app.controller_support}` : ""}`,
    `  DLC entries: ${dlcCount}, website: ${app.website ?? "not reported"}`,
  ];
  const highlighted = app.achievements?.highlighted ?? [];
  if (highlighted.length) {
    lines.push("");
    lines.push(`  ${n} highlighted achievement(s):`);
    for (const achievement of highlighted.slice(0, n)) {
      lines.push(`    ${achievement.name ?? "untitled"}${achievement.description ? `: ${steamPlain(achievement.description, 70)}` : ""}`);
    }
  }
  return lines.join("\n");
}

/** What is on special in the store right now, and how deep each discount runs. */
export async function steamSpecialsCensus(args: { limit?: number }): Promise<string> {
  const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 40);
  const data = await steamJson<Record<string, { name?: string; items?: SteamSpecial[] }>>(
    "/featuredcategories?cc=us&l=en",
    "the specials list",
  );
  const specials = data.specials?.items ?? [];
  if (!specials.length) throw new MobyError("The Steam specials section is empty right now.");

  const rows = specials
    .map((item) => ({ ...item, price: Number(item.final_price ?? 0) / 100, discount: Number(item.discount_percent ?? 0) }))
    .sort((a, b) => b.discount - a.discount);
  const discounts = rows.map((r) => r.discount).filter((d) => d > 0);
  const median = discounts.length ? discounts[Math.floor(discounts.length / 2)] : 0;
  const bands = new Map<string, number>();
  for (const row of rows) {
    const band = row.discount >= 80 ? "80% or more" : row.discount >= 60 ? "60-79%" : row.discount >= 40 ? "40-59%" : row.discount >= 20 ? "20-39%" : row.discount > 0 ? "under 20%" : "no discount";
    bands.set(band, (bands.get(band) ?? 0) + 1);
  }
  const free = rows.filter((r) => r.price === 0).length;

  const lines = [
    `Steam specials: ${rows.length} title(s) on offer, median discount ${median}%, ${free} free`,
    `  depth: ${[...bands.entries()].map(([band, count]) => `${band} (${count})`).join(", ")}`,
    "",
    "  app id     discount  price now     title",
  ];
  for (const row of rows.slice(0, n)) {
    lines.push(
      `  ${String(row.id ?? "not reported").padEnd(10)}${String(row.discount ? `${row.discount}%` : "not reported").padEnd(10)}${String(row.final_formatted ?? `$${row.price.toFixed(2)}`).padEnd(13)}${String(row.name ?? "untitled").slice(0, 60)}`,
    );
  }
  if (rows.length > n) lines.push(`  ...and ${rows.length - n} more special(s).`);
  lines.push("");
  lines.push("  Prices are the US store's final price in the requested currency, straight from the store API.");
  return lines.join("\n");
}
