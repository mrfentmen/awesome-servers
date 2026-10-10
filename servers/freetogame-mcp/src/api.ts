const BASE = "https://www.freetogame.com/api"
const UA = "mrfentmen-freetogame-mcp/1.0 (https://github.com/mrfentmen)"
export class FreetogameError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new FreetogameError(`FreeToGame returned HTTP ${res.status}`)
  return (await res.json()) as T
}

const VALID_CATS = ["mmorpg", "shooter", "strategy", "moba", "racing", "sports", "social", "sandbox", "open-world", "survival", "pvp", "pve", "pixel", "voxel", "zombie", "turn-based", "first-person", "third-person", "top-down", "tank", "space", "sailing", "side-scroller", "hero-shooter", "fighting", "battle-royale", "mmo", "mmofps", "mmotps", "3d", "2d", "anime", "fantasy", "sci-fi", "fighting", "action-rpg", "action", "military", "martial-arts", "flight", "low-spec", "tower-defense", "horror", "mmorts"]

function fmtGame(g: any, i: number): string {
  return `${i + 1}. ${g?.title ?? "n/a"} | ${g?.genre ?? ""} | ${g?.platform ?? ""}\n   ${(g?.short_description ?? "").slice(0, 140)} | ${g?.release_date ?? ""} | ${g?.freetogame_profile_url ?? ""}`
}

export async function games(args: { platform?: string; category?: string; sortBy?: string }): Promise<string> {
  const platform = (args.platform ?? "pc").trim().toLowerCase()
  const category = (args.category ?? "").trim()
  const sortBy = (args.sortBy ?? "").trim()
  const params = new URLSearchParams()
  if (platform && platform !== "all") params.set("platform", platform)
  if (category) {
    if (!VALID_CATS.includes(category.toLowerCase())) throw new FreetogameError(`Unknown category ${category}`)
    params.set("category", category)
  }
  if (sortBy) params.set("sort-by", sortBy)
  const qs = params.toString()
  const d = await get<any[]>(`${BASE}/games${qs ? `?${qs}` : ""}`)
  const list = (d ?? []).slice(0, 20)
  if (!list.length) return "No games found with those filters"
  return `Free games (${list.length} shown):\n` + list.map(fmtGame).join("\n")
}

export async function game(args: { id?: number }): Promise<string> {
  const id = Number(args.id)
  if (!Number.isInteger(id) || id <= 0) throw new FreetogameError("Provide a positive game ID")
  const g = await get<any>(`${BASE}/game?id=${id}`)
  if (!g?.id) throw new FreetogameError(`Game not found: ${id}`)
  const req = g?.minimum_system_requirements ?? {}
  const lines = [
    `${g?.title ?? "n/a"} | ${g?.genre ?? ""} | ${g?.platform ?? ""} | ${g?.release_date ?? ""}`,
    `Publisher: ${g?.publisher ?? "n/a"} | Developer: ${g?.developer ?? "n/a"}`,
    `\n${(g?.description ?? "no description").slice(0, 700)}`,
    g?.game_url ? `\nPlay: ${g.game_url}` : "",
    req?.graphics ? `\nMinimum requirements: OS ${req.os ?? "n/a"}, CPU ${req.processor ?? "n/a"}, RAM ${req.memory ?? "n/a"}, GPU ${req.graphics}` : "",
  ]
  return lines.filter((l) => l !== "").join("\n")
}

// ---- muxB tools:

// Aggregates over the whole /api/games catalogue, which the per-row listing
// tools never summarise. The /api/games rows carry no category field, only
// genre, platform, developer and publisher.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Game = any;

const FTG_BASE = "https://www.freetogame.com/api";
const FTG_UA = "mrfentmen-freetogame-mcp/1.0 (https://github.com/mrfentmen)";

async function ftgGames(platform: string): Promise<Game[]> {
  const params = new URLSearchParams();
  if (platform && platform !== "all") params.set("platform", platform);
  const qs = params.toString();
  const res = await fetch(`${FTG_BASE}/games${qs ? `?${qs}` : ""}`, {
    headers: { "User-Agent": FTG_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new FreetogameError(`FreeToGame returned HTTP ${res.status}`);
  const d = (await res.json()) as Game[];
  return Array.isArray(d) ? d : [];
}

const yearOf = (g: Game): number | null => {
  const raw = typeof g?.release_date === "string" ? g.release_date : "";
  const m = raw.match(/(\d{4})/);
  return m ? Number(m[1]) : null;
};

export interface GenrePlatformMatrixArgs {
  platform?: string;
  genre?: string;
  limit?: number;
}

export interface StudioRankingArgs {
  role?: string;
  limit?: number;
}

export async function studioRanking(args: StudioRankingArgs): Promise<string> {
  const role = (args.role ?? "developer").trim().toLowerCase();
  if (role !== "developer" && role !== "publisher") return 'Provide role "developer" or "publisher".';
  const list = await ftgGames("all");
  if (!list.length) return "The FreeToGame catalogue came back empty.";
  const limit = Math.max(1, Math.min(Number(args.limit ?? 20) || 20, 50));
  const tally = new Map<string, { count: number; titles: string[]; platforms: Set<string>; newest: number | null }>();
  for (const g of list) {
    const name = typeof g?.[role] === "string" ? g[role].trim() : "";
    if (!name) continue;
    const entry = tally.get(name) ?? { count: 0, titles: [], platforms: new Set<string>(), newest: null };
    entry.count += 1;
    if (entry.titles.length < 3) entry.titles.push(String(g?.title ?? "?"));
    if (typeof g?.platform === "string") entry.platforms.add(g.platform);
    const y = yearOf(g);
    if (y) entry.newest = Math.max(entry.newest ?? 0, y);
    tally.set(name, entry);
  }
  if (!tally.size) return `No games in the catalogue report a ${role}.`;
  const ranked = [...tally.entries()].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]));
  const lines = [
    `Top ${role}s by number of free-to-play games in the whole catalogue (${list.length} games, ${tally.size} distinct ${role}s):`,
  ];
  ranked.slice(0, limit).forEach(([name, v], i) => {
    lines.push(
      `${i + 1}. ${name} - ${v.count} game(s) | ${[...v.platforms].join(" + ") || "platform not reported"}${v.newest ? ` | newest release ${v.newest}` : ""} | e.g. ${v.titles.join("; ")}`
    );
  });
  return lines.join("\n");
}
