/**
 * Twitch Helix API client. Needs TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET
 * (free at https://dev.twitch.tv/console). Uses client-credentials grant.
 * Docs: https://dev.twitch.tv/docs/api/
 */
export class TwitchError extends Error {}

let cached: { token: string; exp: number } | null = null

async function appToken(): Promise<string> {
  const id = process.env.TWITCH_CLIENT_ID
  const secret = process.env.TWITCH_CLIENT_SECRET
  if (!id || !secret) {
    throw new TwitchError("Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET (free at dev.twitch.tv/console).")
  }
  if (cached && cached.exp > Date.now() + 60000) return cached.token
  const body = new URLSearchParams({ client_id: id, client_secret: secret, grant_type: "client_credentials" })
  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "User-Agent": "twitch-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new TwitchError(`Twitch OAuth failed (${res.status}). Check client id/secret.`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any
  if (!data.access_token) throw new TwitchError("Twitch OAuth returned no token.")
  cached = { token: data.access_token, exp: Date.now() + (data.expires_in ?? 3600) * 1000 }
  return cached.token
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function helix<T>(path: string): Promise<T> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const res = await fetch(`https://api.twitch.tv/helix${path}`, {
    headers: { "User-Agent": "twitch-mcp/1.0", Accept: "application/json", "Client-Id": clientId ?? "", Authorization: `Bearer ${await appToken()}` },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new TwitchError("Twitch refused (401/403). Check credentials.")
  if (!res.ok) throw new TwitchError(`Twitch error ${res.status}`)
  return (await res.json()) as T
}

export interface Game {
  id: string
  name: string
}

export async function topGames(limit = 10): Promise<Game[]> {
  const data = await helix<{ data: Raw[] }>(`/games/top?first=${Math.min(Math.max(limit, 1), 100)}`)
  return (data.data ?? []).slice(0, limit).map((g) => ({ id: String(g.id), name: String(g.name) }))
}

export interface Stream {
  user: string
  game?: string
  title?: string
  viewers?: number
  language?: string
}

export async function topStreams(gameId = "", limit = 10): Promise<Stream[]> {
  const qs = new URLSearchParams({ first: String(Math.min(Math.max(limit, 1), 100)) })
  if (gameId.trim()) qs.set("game_id", gameId.trim())
  const data = await helix<{ data: Raw[] }>(`/streams?${qs}`)
  return (data.data ?? []).slice(0, limit).map((s) => ({
    user: String(s.user_name ?? s.user_login ?? "?"),
    game: s.game_name,
    title: s.title,
    viewers: s.viewer_count,
    language: s.language,
  }))
}

export interface TwitchUser {
  id: string
  login: string
  name?: string
  broadcasterType?: string
  description?: string
}

export async function getUser(login: string): Promise<TwitchUser | null> {
  if (!login.trim()) throw new TwitchError("Login is empty.")
  const data = await helix<{ data: Raw[] }>(`/users?login=${encodeURIComponent(login.trim())}`)
  const u = (data.data ?? [])[0]
  if (!u) return null
  return {
    id: String(u.id),
    login: String(u.login),
    name: u.display_name,
    broadcasterType: u.broadcaster_type || undefined,
    description: u.description ? String(u.description).slice(0, 200) : undefined,
  }
}

export function formatStream(s: Stream, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}${s.user}${s.game ? ` playing ${s.game}` : ""}${s.viewers !== undefined ? ` (${s.viewers.toLocaleString()} viewers)` : ""}${s.title ? `\n   ${s.title.slice(0, 120)}` : ""}`
}

export function formatUser(u: TwitchUser): string {
  return `[${u.id}] ${u.name ?? u.login} (@${u.login})${u.broadcasterType ? ` — ${u.broadcasterType}` : ""}${u.description ? `\n${u.description}` : ""}`
}

// ---- muxH tools:
// The three tools above all call Twitch's Helix API, which needs a client id and
// secret. These two need no credentials: one reads Twitch's own public status
// record, component by component, and the other asks Steam's public charts and
// SteamSpy what is actually being played right now, which is the question behind
// most streaming decisions.

const TW_STATUS = "https://status.twitch.tv/api/v2";
const TW_UA = "mcfentmen-twitch-mcp/1.1 (https://github.com/mcfentmen/twitch-mcp)";
const TW_STEAM_CHARTS = "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/";
const TW_STEAMSPY = "https://steamspy.com/api.php?request=appdetails&appid=";

interface TwComponent {
  id?: string;
  name?: string;
  status?: string;
  description?: string | null;
  updated_at?: string;
  position?: number;
}
interface TwIncident {
  id?: string;
  name?: string;
  status?: string;
  impact?: string;
  created_at?: string;
  resolved_at?: string | null;
  shortlink?: string;
  components?: TwComponent[];
  incident_updates?: { status?: string; body?: string; created_at?: string }[];
}
interface TwStatusPage {
  name?: string;
  url?: string;
  time_zone?: string;
  updated_at?: string;
}
interface TwStatusResponse {
  page?: TwStatusPage;
  status?: { indicator?: string; description?: string };
  components?: TwComponent[];
  active_incidents?: TwIncident[];
  incidents?: TwIncident[];
}

interface SteamRank {
  rank?: number;
  appid?: number;
  last_week_rank?: number | null;
  peak_in_game?: number;
}
interface SteamSpyApp {
  appid?: number;
  name?: string;
  developer?: string;
  publisher?: string;
  positive?: number;
  negative?: number;
  owners?: string;
  price?: string;
  genre?: string;
  tags?: Record<string, number> | string[];
}

async function twGet<T>(url: string, label: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { "User-Agent": TW_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
  } catch (e) {
    throw new TwitchError(`Could not reach ${label}: ${(e as Error).message}`);
  }
  if (!res.ok) throw new TwitchError(`${label} returned HTTP ${res.status}.`);
  return (await res.json()) as T;
}

const twWait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const twClean = (raw?: string): string =>
  String(raw ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const twStatusWord = (raw?: string): string => {
  const key = String(raw ?? "").toLowerCase();
  if (key === "operational") return "operational";
  if (key.includes("degraded")) return "degraded performance";
  if (key.includes("outage")) return "major outage";
  if (key.includes("maintenance")) return "under maintenance";
  if (key.includes("partial")) return "partial outage";
  return raw ? raw.replace(/_/g, " ") : "state not reported";
};

/**
 * Whether Twitch itself is up, component by component: login, web, chat, watching,
 * broadcasting and purchases each with their published state, plus anything open
 * right now. Worth checking before blaming a stream for not going out.
 */
export async function serviceStatus(): Promise<string> {
  // status.json carries only the indicator, so the component list comes from its own endpoint.
  const [current, componentList, incidents] = await Promise.all([
    twGet<TwStatusResponse>(`${TW_STATUS}/status.json`, "Twitch's status service"),
    twGet<TwStatusResponse>(`${TW_STATUS}/components.json`, "Twitch's status service"),
    twGet<TwStatusResponse>(`${TW_STATUS}/incidents.json`, "Twitch's status service"),
  ]);
  const components = componentList.components ?? [];
  const page = current.page ?? componentList.page ?? {};
  const indicator = current.status?.indicator ?? "not reported";
  const description = current.status?.description ?? "not reported";
  if (!components.length && !current.status) {
    throw new TwitchError("Twitch's status service returned neither a status nor any components.");
  }

  const all = incidents.incidents ?? [];
  const open = all.filter((i) => i.status !== "resolved");
  const recent = all.slice(0, 5);
  const byImpact = new Map<string, number>();
  for (const incident of all) {
    const key = incident.impact ?? "not reported";
    byImpact.set(key, (byImpact.get(key) ?? 0) + 1);
  }
  const openComponents = new Set<string>();
  for (const incident of open) for (const c of incident.components ?? []) if (c.name) openComponents.add(c.name);

  return [
    `Twitch service status`,
    `  overall: ${String(indicator).toUpperCase()} — ${description}`,
    `  page ${page.name ?? "Twitch"} last updated ${page.updated_at ?? "not reported"} (${page.time_zone ?? "timezone not reported"})`,
    `  ${components.length} component(s) published`,
    "",
    "Components:",
    ...components.map((c) =>
      `  ${String(c.name ?? "?").padEnd(22)} ${twStatusWord(c.status).padEnd(20)} ${openComponents.has(c.name ?? "") ? "<- named in an open incident" : ""}  updated ${String(c.updated_at ?? "not reported").slice(0, 16).replace("T", " ")}`,
    ),
    "",
    open.length
      ? `Open right now: ${open.length} incident(s) not resolved`
      : "Open right now: no unresolved incident in the published record",
    ...open.slice(0, 4).map((i) =>
      `  - ${i.name ?? "untitled"} (${i.status ?? "status not reported"}, impact ${i.impact ?? "not reported"}) since ${String(i.created_at ?? "").slice(0, 16).replace("T", " ")}` +
      `${(i.components ?? []).map((c) => c.name).join(", ") ? ` | components: ${(i.components ?? []).map((c) => c.name).join(", ")}` : ""}`,
    ),
    "",
    `Most recent resolved incidents of ${all.length} published: ${[...byImpact.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} ${k}`).join(", ")} by impact`,
    ...recent.map((i) =>
      `  - ${String(i.created_at ?? "").slice(0, 10)} ${(i.name ?? "untitled").slice(0, 68)} (${i.impact ?? "?"})` +
      `${(i.components ?? []).length ? ` | ${(i.components ?? []).map((c) => c.name).join(", ")}` : ""}`,
    ),
    "",
    "This is Twitch's public status page, which reports problems above its own internal threshold. A component marked operational means Twitch is not currently reporting a fault against it, not that a given stream or account has no problem; anything below Twitch's reporting threshold never appears here.",
  ].join("\n");
}

/**
 * What is actually being played, from Steam's public most-played chart enriched
 * with SteamSpy's record of each title: genre, developer, review split, price and
 * owner estimate, plus how each game's rank moved in a week. A streamer's choice of
 * what to play is a demand question, and no Twitch endpoint answers it.
 */
export async function gameDemand(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 6) || 6, 1), 12);
  const chart = await twGet<{ response?: { ranks?: SteamRank[] } }>(TW_STEAM_CHARTS, "Steam's charts service");
  const ranks = chart.response?.ranks ?? [];
  if (!ranks.length) throw new TwitchError("Steam's charts service returned no ranked games.");

  const top = ranks.slice(0, limit);
  const lines: string[] = [];
  let resolved = 0;
  for (const entry of top) {
    if (entry.appid === undefined) continue;
    // SteamSpy asks for no more than one call a second and a half, so these are paced.
    let detail: SteamSpyApp | null = null;
    try {
      detail = await twGet<SteamSpyApp>(`${TW_STEAMSPY}${entry.appid}`, "SteamSpy");
    } catch {
      detail = null;
    }
    if (detail?.name) resolved += 1;
    const tags = detail?.tags
      ? Object.entries(detail.tags as Record<string, number>)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 4)
          .map(([tag]) => tag)
          .join(", ")
      : "";
    const totalReviews = (detail?.positive ?? 0) + (detail?.negative ?? 0);
    const positivePct = totalReviews ? ((detail!.positive ?? 0) / totalReviews) * 100 : null;
    const weekDelta = entry.last_week_rank ? entry.last_week_rank - (entry.rank ?? 0) : null;
    lines.push(
      `  ${String(entry.rank ?? "?").padStart(2)}. ${(detail?.name ?? `app ${entry.appid}`).slice(0, 42).padEnd(42)} peak ${(entry.peak_in_game ?? 0).toLocaleString().padStart(9)} concurrent` +
        `  week rank ${entry.last_week_rank ?? "new"}${weekDelta !== null ? ` (${weekDelta > 0 ? "up" : "down"} ${Math.abs(weekDelta)})` : ""}`,
    );
    lines.push(
      `      ${(detail?.developer ?? "developer not reported").slice(0, 40)} | ${(detail?.genre ?? "genre not reported").slice(0, 40)}` +
        `  ${detail?.price ?? "price not reported"}` +
        `  ${positivePct !== null ? `reviews ${positivePct.toFixed(0)}% positive of ${totalReviews.toLocaleString()}` : "review split not reported"}` +
        `  owners ${detail?.owners ?? "not reported"}`,
    );
    if (tags) lines.push(`      tags: ${tags}`);
    await twWait(1600);
  }

  const climbers = top
    .filter((r) => r.last_week_rank !== null && r.last_week_rank !== undefined && r.rank !== undefined && r.last_week_rank > r.rank)
    .map((r) => `#${r.rank} (was #${r.last_week_rank})`);
  const peak = top.reduce((sum, r) => sum + (r.peak_in_game ?? 0), 0);

  return [
    "What is being played right now, from Steam's public most-played chart",
    `  ${ranks.length} game(s) ranked by the service; the top ${top.length} shown, ${resolved} enriched with SteamSpy's record`,
    `  combined peak concurrent players in the top ${top.length}: ${peak.toLocaleString()}`,
    climbers.length ? `  climbing since last week: ${climbers.join(", ")}` : "  nothing in this selection has climbed since last week",
    "",
    ...lines,
    "",
    "Concurrent player counts are a twenty-four hour peak reported by Steam, not a live count, and a game's audience on Twitch is a different population that partly overlaps. Review percentages come from Steam's own store reviews and owner figures are SteamSpy's estimate band, not a number Steam publishes. This reads two public services and neither is affiliated with Twitch.",
  ].join("\n");
}
