/**
 * Steam client — keyless store endpoints.
 *  - Store search:   /api/storesearch
 *  - App details:    /api/appdetails   (filtered to keep payloads small)
 *  - News:           ISteamNews/GetNewsForApp (Steamworks Web API, no key
 *                    required for this endpoint)
 */

const STORE = "https://store.steampowered.com/api"
const NEWS = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2"

export class SteamError extends Error {}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    headers: { Accept: "application/json", "User-Agent": "steam-mcp/1.0" },
  })
  if (!res.ok) throw new SteamError(`Steam API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoreItem {
  type: string
  appid: number
  name: string
  price?: {
    currency: string
    initial: number
    final: number
    discount_percent: number
  }
  tinyImage?: string
}

export interface AppDetail {
  appid: number
  name: string
  type?: string
  isFree?: boolean
  price: {
    currency: string
    initial: number
    final: number
    discountPercent: number
  } | null
  releaseDate?: string
  developers: string[]
  genres: string[]
  metacritic?: number
  description?: string
  headerImage?: string
  url: string
}

export interface NewsItem {
  title: string
  url: string
  author?: string
  date?: string
  contents?: string
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function searchStore(query: string): Promise<StoreItem[]> {
  const data = await getJson<{ items?: any[] }>(
    `${STORE}/storesearch/?term=${encodeURIComponent(query)}&cc=US&l=en`
  )
  return (data.items ?? [])
    .filter((i) => i.type === "app")
    .slice(0, 12)
    .map((i) => ({ ...i, appid: i.id }))
}

/**
 * Steam keys an appdetails response by an id of its own choosing, which is not
 * always the appid that was asked for: requesting 620 comes back under the key
 * 323180, with the real appid inside data.steam_appid. So the entry is matched
 * on steam_appid first, then on the requested key, then taken as the only entry.
 */
function pickApp(
  payload: Record<string, { success?: boolean; data?: any }>,
  appid: number
): any | null {
  const direct = payload?.[String(appid)]
  if (direct?.success && direct.data) return direct.data
  const entries = Object.values(payload ?? {}).filter((entry) => entry?.success && entry.data)
  const matched = entries.find((entry) => Number(entry.data?.steam_appid) === appid)
  if (matched) return matched.data
  return entries.length === 1 ? entries[0].data : null
}

export async function getAppDetail(appid: number): Promise<AppDetail | null> {
  const filters = [
    "basic",
    "price_overview",
    "release_date",
    "developers",
    "genres",
    "metacritic",
    "short_description",
    "header_image",
  ].join(",")
  const payload = await getJson<Record<string, { success: boolean; data?: any }>>(
    `${STORE}/appdetails?appids=${appid}&cc=US&l=en&filters=${filters}`
  )
  const d = pickApp(payload, appid)
  if (!d) return null
  const price = d.price_overview
  return {
    appid,
    name: d.name ?? "?",
    type: d.type,
    isFree: d.is_free,
    price: price
      ? {
          currency: price.currency ?? "USD",
          initial: price.initial ?? 0,
          final: price.final ?? 0,
          discountPercent: price.discount_percent ?? 0,
        }
      : null,
    releaseDate: d.release_date?.date,
    developers: d.developers ?? [],
    genres: (d.genres ?? []).map((g: any) => g.description),
    metacritic: d.metacritic?.score,
    description: d.short_description,
    headerImage: d.header_image,
    url: `https://store.steampowered.com/app/${appid}`,
  }
}

export async function getNews(appid: number, count: number): Promise<NewsItem[]> {
  const data = await getJson<{ appnews?: { newsitems?: any[] } }>(
    `${NEWS}/?appid=${appid}&count=${count}&maxlength=600`
  )
  return (data.appnews?.newsitems ?? []).map((n) => ({
    title: n.title ?? "?",
    url: n.url ?? "",
    author: n.author,
    date: n.date ? new Date(n.date * 1000).toISOString().slice(0, 10) : undefined,
    contents: n.contents ? stripHtml(n.contents).slice(0, 300) : undefined,
  }))
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtPrice(cents: number, currency = "USD"): string {
  const symbol = currency === "USD" ? "$" : `${currency} `
  return `${symbol}${(cents / 100).toFixed(2)}`
}

export function formatStoreItem(i: StoreItem): string {
  const price = i.price
    ? i.price.discount_percent > 0
      ? `~~${fmtPrice(i.price.initial, i.price.currency)}~~ → **${fmtPrice(
          i.price.final,
          i.price.currency
        )}** (-${i.price.discount_percent}%)`
      : fmtPrice(i.price.final, i.price.currency)
    : "no price data"
  return `[${i.appid}] ${i.name}\n   ${price}\n   https://store.steampowered.com/app/${i.appid}`
}

export function formatAppDetail(a: AppDetail): string {
  const lines = [
    `[${a.appid}] ${a.name}${a.type ? ` (${a.type})` : ""}`,
    a.price
      ? a.price.discountPercent > 0
        ? `Price: ~~${fmtPrice(a.price.initial)}~~ → ${fmtPrice(a.price.final)} (-${a.price.discountPercent}%)`
        : `Price: ${fmtPrice(a.price.final)}`
      : a.isFree
        ? "Free to play"
        : "Price unavailable",
    a.releaseDate ? `Released: ${a.releaseDate}` : "",
    a.developers.length ? `Developers: ${a.developers.join(", ")}` : "",
    a.genres.length ? `Genres: ${a.genres.join(", ")}` : "",
    a.metacritic ? `Metacritic: ${a.metacritic}` : "",
  ].filter(Boolean)
  if (a.description) lines.push(`\n${a.description}`)
  lines.push(`\n${a.url}`)
  return lines.join("\n")
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\[\[([^\]]*)\]\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export interface ReviewSummary {
  total: number;
  positive: number;
  negative: number;
  score_desc: string;
}

export async function getReviewSummary(appid: number): Promise<ReviewSummary> {
  const d = await getJson<{ success?: number; query_summary?: { total_reviews?: number; total_positive?: number; total_negative?: number; review_score_desc?: string } }>(
    `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&purchase_type=all&num_per_page=0`);
  const q = d.query_summary ?? {};
  return {
    total: q.total_reviews ?? 0,
    positive: q.total_positive ?? 0,
    negative: q.total_negative ?? 0,
    score_desc: q.review_score_desc ?? 'unknown',
  };
}

export async function getPlayerCount(appid: number): Promise<number> {
  const d = await getJson<{ response?: { player_count?: number; result?: number } }>(
    `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`);
  if (d.response?.result !== 1 || d.response?.player_count == null) {
    throw new SteamError(`No player count for app ${appid}.`);
  }
  return d.response.player_count;
}

export interface TopSeller {
  id?: number;
  name?: string;
  final_price?: number;
  currency?: string;
  discount_percent?: number;
}

export async function getTopSellers(count: number): Promise<TopSeller[]> {
  const d = await getJson<{ top_sellers?: { items?: { id?: number; name?: string; final_price?: number; currency?: string; discount_percent?: number }[] } }>(
    `https://store.steampowered.com/api/featuredcategories/?cc=US&l=en`);
  return (d.top_sellers?.items ?? []).slice(0, count).map((i) => ({
    id: i.id, name: i.name, final_price: i.final_price,
    currency: i.currency, discount_percent: i.discount_percent,
  }));
}
// ---- batch-5 tools: store highlights, sale check, live player rank (2026-09-27) ----

interface FeaturedItem {
  id?: number
  name?: string
  final_price?: number
  original_price?: number
  currency?: string
  discount_percent?: number
}

interface FeaturedSlices {
  specials?: { items?: FeaturedItem[] }
  new_releases?: { items?: FeaturedItem[] }
  coming_soon?: { items?: FeaturedItem[] }
}

const usd = (cents?: number) => (typeof cents === "number" ? `$${(cents / 100).toFixed(2)}` : "n/a")

/**
 * The front page of the Store: what is discounted right now, what released
 * this week and what is coming. top_sellers is a separate tool; these three
 * slices were never read.
 */
export async function storeHighlights(args: { limit?: number }): Promise<string> {
  const limit = Math.min(Math.max(Math.trunc(args.limit ?? 6), 1), 20)
  const d = await getJson<FeaturedSlices>(`${STORE}/featuredcategories/?cc=US&l=en`)
  const section = (title: string, items: FeaturedItem[] | undefined) => {
    const rows = (items ?? []).slice(0, limit)
    if (!rows.length) return ""
    return [
      `${title} (${rows.length} of ${(items ?? []).length})`,
      ...rows.map((item, i) => {
        const cut = item.discount_percent ? `-${item.discount_percent}%` : ""
        const was = item.original_price && item.final_price ? ` (was ${usd(item.original_price)})` : ""
        return `  ${i + 1}. ${item.name ?? "?"} — ${usd(item.final_price)}${cut ? ` ${cut}` : ""}${was}${item.id ? ` [${item.id}]` : ""}`
      }),
      "",
    ].filter((line) => line !== "")
  }
  const blocks = [
    section("On sale now", d.specials?.items),
    section("New releases", d.new_releases?.items),
    section("Coming soon", d.coming_soon?.items),
  ].filter((block) => block.length)
  if (!blocks.length) throw new Error("Steam returned no featured categories. It is a public endpoint; try again shortly.")
  return [`Steam store highlights (US store, USD)`, "", ...blocks.flat()].join("\n")
}

/**
 * Checks a list of app ids for a discount, one request each, which is how a
 * wishlist is reviewed before a sale ends. Steam rejects a multi-id request.
 */
export async function salesCheck(args: { appids: number[] }): Promise<string> {
  const ids = [...new Set((args.appids ?? []).map((id) => Math.trunc(Number(id))).filter((id) => Number.isFinite(id) && id > 0))]
  if (!ids.length) throw new Error("Give at least one Steam app id, e.g. [620, 440].")
  if (ids.length > 15) throw new Error("Check at most 15 app ids per call; each one is a request to Steam.")
  const rows: { appid: number; name: string; price?: number; original?: number; discount?: number }[] = []
  const failed: number[] = []
  for (const appid of ids) {
    const d = await getJson<Record<string, { success?: boolean; data?: { name?: string; steam_appid?: number; is_free?: boolean; price_overview?: { final?: number; initial?: number; discount_percent?: number } } }>>(
      `${STORE}/appdetails?appids=${appid}&cc=US&l=en&filters=price_overview,basic`
    )
    const entry = pickApp(d, appid)
    if (!entry?.name) {
      failed.push(appid)
      continue
    }
    rows.push({
      appid,
      name: entry.name,
      // Steam omits price_overview for free-to-play titles, so is_free is the
      // only signal that a 0 is real and not missing data.
      price: entry.price_overview?.final ?? (entry.is_free ? 0 : undefined),
      original: entry.price_overview?.initial,
      discount: entry.price_overview?.discount_percent,
    })
  }
  const discounted = rows.filter((row) => (row.discount ?? 0) > 0)
  const free = rows.filter((row) => row.price === 0)
  const best = [...discounted].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))[0]
  return [
    `Steam sale check: ${ids.length} app id(s)`,
    `  ${discounted.length} discounted, ${free.length} free to play, ${rows.length - discounted.length - free.length} at full price`,
    "",
    ...rows.map((row) => {
      const cut = row.discount ? `-${row.discount}%` : "no discount"
      const price = row.price === 0 ? "free" : usd(row.price)
      return `  ${row.name} [${row.appid}] — ${price} (${cut})${row.original && row.original !== row.price ? ` | full price ${usd(row.original)}` : ""}`
    }),
    best ? `\nBiggest discount: ${best.name} at -${best.discount}%.` : "\nNothing in this list is on sale.",
    failed.length ? `\nSteam returned no price data for: ${failed.join(", ")} — the id may be a package, a delisted app or region-locked.` : "",
  ].filter((line) => line !== "").join("\n")
}

/**
 * Live player counts for several games at once, ranked, which is the honest
 * measure of what is actually being played right now.
 */
export async function playerCountRank(args: { appids: number[] }): Promise<string> {
  const ids = [...new Set((args.appids ?? []).map((id) => Math.trunc(Number(id))).filter((id) => Number.isFinite(id) && id > 0))]
  if (!ids.length) throw new Error("Give at least one Steam app id, e.g. [730, 570].")
  if (ids.length > 15) throw new Error("Rank at most 15 app ids per call; each one is a request to Steam.")
  const rows: { appid: number; players: number }[] = []
  const failed: number[] = []
  for (const appid of ids) {
    try {
      const players = await getPlayerCount(appid)
      rows.push({ appid, players })
    } catch {
      failed.push(appid)
    }
  }
  if (!rows.length) throw new Error("Steam returned no live player counts for those app ids.")
  const ranked = [...rows].sort((a, b) => b.players - a.players)
  const total = ranked.reduce((sum, row) => sum + row.players, 0)
  return [
    `Live player counts (ranked, ${ranked.length} game(s), ${total.toLocaleString()} players together)`,
    "",
    ...ranked.map((row, i) => `  ${i + 1}. app ${row.appid} — ${row.players.toLocaleString()} playing now${total ? ` (${Math.round((row.players / total) * 100)}% of the sample)` : ""}`),
    "",
    "Counts are concurrent players, not owners, and they move hour to hour.",
    failed.length ? `No count returned for: ${failed.join(", ")} (the id may not be a game with a public player counter).` : "",
  ].filter((line) => line !== "").join("\n")
}

// ---- muxE tools:
// Nine existing tools cover discovery and popularity: store search, app
// details, news, review summaries, player counts, top sellers, store
// highlights, wishlist sale checks and a player-count ranking. Between them
// they answer what a game is, what people think of it, and how popular it is.
//
// They do not answer the three questions a buyer has immediately before
// paying: can my machine run it, what does owning all of it actually cost, and
// how much content is in it. Steam's appdetails response carries all three,
// and the three new tools read them.
//
// Two shapes had to be handled from the live API rather than from the docs. The
// requirements fields are HTML fragments, so they are stripped to text. And
// appdetails serves one appid per request: a comma separated list returns HTTP
// 400, which is why the DLC pricing tool below fetches each id on its own.

const APP = "https://store.steampowered.com/api/appdetails";
const H = { "User-Agent": "awesome-mcps/1.0", Accept: "application/json" };

type Json = Record<string, unknown>;

async function appDetails(appid: number): Promise<Json | null> {
  const res = await fetch(`${APP}?appids=${encodeURIComponent(String(appid))}&l=english&cc=us`, {
    headers: H,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Steam store error ${res.status} for appid ${appid}`);
  const body = (await res.json()) as Record<string, { success?: boolean; data?: Json }>;
  const entry = body[String(appid)];
  if (!entry || entry.success !== true || !entry.data) return null;
  return entry.data;
}

function checkAppid(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) {
    throw new Error(`Give a Steam appid as a positive number. You gave ${typeof raw === "string" ? `"${raw.slice(0, 20)}"` : String(raw)}.`);
  }
  return n;
}

// The requirements arrive as markup like
//   <strong>Minimum:</strong><br><ul class="bb_ul"><li>Requires a 64-bit ...
// so the tags become line breaks before the tags are dropped, or the whole
// thing collapses into one run of text.

const str = (v: unknown): string => (typeof v === "string" ? v : "");

export interface GameRequirementsArgs {
  appid: number;
}

function cents(data: Json): number | null {
  const po = data.price_overview as Json | undefined;
  if (!po) return null;
  const f = po.final_formatted;
  if (typeof f === "string" && /\$|€|£/.test(f)) {
    const m = /([\d.,]+)/.exec(f.replace(/[^\d.,]/g, ""));
    if (m) {
      const n = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(n)) return Math.round(n * 100);
    }
  }
  return null;
}

export interface GameDlcCostArgs {
  appid: number;
}

export interface GameAchievementsArgs {
  appid: number;
}

export function game_achievements(args: GameAchievementsArgs): Promise<string> {
  const appid = checkAppid(args?.appid);
  return appDetails(appid).then((data) => {
    if (!data) return `Steam has no store entry for appid ${appid}, so it lists no achievements.`;
    const name = str(data.name) || `appid ${appid}`;
    const ach = (data.achievements as Json | undefined) ?? null;
    if (!ach) {
      return [
        `"${name}" (appid ${appid}) has no Steam achievements at all.`,
        "",
        "  On the store record that means either the title ships without the achievement system, or it is not a game that uses it.",
      ].join("\n");
    }
    const total = Number(ach.total ?? 0);
    const shown = Number(ach.shown ?? 0);
    const highlighted = Array.isArray(ach.highlighted) ? (ach.highlighted as Json[]) : [];
    // hidden is 0 or 1 per achievement, and a hidden one is a secret the store
    // will not name in advance.
    const hidden = highlighted.filter((h) => Number(h.hidden ?? 0) === 1).length;
    const visible = highlighted.length - hidden;
    const lines = [`Steam achievements for "${name}" (appid ${appid}):`];
    if (total > 0) {
      lines.push(`  ${total} achievement${total === 1 ? "" : "s"} in total.`);
    } else {
      lines.push("  the store reports an achievement object with a total of zero, which is a known Steam state for titles that removed or never wired up the system.");
    }
    if (shown > 0) lines.push(`  ${shown} currently visible on the store page.`);
    if (highlighted.length) {
      lines.push(`  ${highlighted.length} are listed with a name, of which ${hidden} are hidden secret${hidden === 1 ? "" : "s"} and ${visible} ${visible === 1 ? "is" : "are"} named.`);
      lines.push("  the ones Steam will name up front:");
      for (const h of highlighted.filter((x) => Number(x.hidden ?? 0) !== 1).slice(0, 8)) {
        lines.push(`    ${(str(h.localized_name) || str(h.name) || "unnamed").slice(0, 60)}`);
      }
      if (hidden) lines.push(`  the other ${hidden} are hidden, so their names are not on the store page until they are earned.`);
    }
    const cat = (data.categories as Json[] | undefined) ?? [];
    const hasMult = cat.some((c) => str(c.description) === "Steam Achievements");
    if (!hasMult && total > 0) lines.push("  the categories do not include Steam Achievements even though the record lists some, so the store page may not surface them.");
    lines.push("");
    lines.push("  The existing game details tool does not report achievements, and the review summary tool reports sentiment rather than the achievement list.");
    return lines.join("\n");
  });
}
