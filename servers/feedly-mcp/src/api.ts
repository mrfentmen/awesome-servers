export class FeedlyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FeedlyError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.FEEDLY_TOKEN;
  if (!k) throw new FeedlyError("Set FEEDLY_TOKEN (Feedly developer token).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.feedly.com/v3" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new FeedlyError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new FeedlyError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function profile(): Promise<string> {
  return get("/profile");
}

export function subscriptions(): Promise<string> {
  return get("/subscriptions");
}

export function streamContents(streamId: string, count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 10) || 10, 100);
  return get(`/streams/${encodeURIComponent(streamId)}/contents?count=${n}`);
}

// ---- muxD tools:

/**
 * Feedly v3 answers before it authenticates for some routes, which is unusual and
 * useful here. Verified live on 2026-09-27:
 *   keyless 200: /search/feeds?query=&size=, /streams/contents?streamId=feed/<url>&count=, /entries/{ids}
 *   route check before auth: /streams/contents?streamId=user/abc answers 400 "invalid stream id"
 *   401 otherwise: /profile, /subscriptions, /markers/counts, /boards,
 *                  /collections, /tags/<tag>/feeds, /opml
 */

async function feedlyGet<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch("https://api.feedly.com/v3" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    throw new FeedlyError(`Network error: ${(e as Error).message}`)
  }
  const body = await res.text()
  let parsed: any
  try {
    parsed = JSON.parse(body)
  } catch {
    throw new FeedlyError(`Feedly returned HTTP ${res.status} with a non-JSON body: ${body.slice(0, 200)}`)
  }
  if (parsed?.errorCode) {
    const msg = String(parsed.errorMessage ?? "")
    throw new FeedlyError(
      `Feedly error ${parsed.errorCode}: ${msg}` +
        (parsed.errorCode === 401 ? " — a Feedly developer token is required and FEEDLY_TOKEN is not accepted for this call." : ""),
    )
  }
  if (!res.ok) throw new FeedlyError(`HTTP ${res.status}: ${body.slice(0, 250)}`)
  return parsed as T
}

async function feedlyKeyless<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch("https://api.feedly.com/v3" + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    throw new FeedlyError(`Network error: ${(e as Error).message}`)
  }
  const body = await res.text()
  if (!res.ok) {
    throw new FeedlyError(`Feedly returned HTTP ${res.status}: ${body.slice(0, 250)}`)
  }
  try {
    return JSON.parse(body) as T
  } catch {
    throw new FeedlyError("Feedly returned a non-JSON body.")
  }
}

const n = (v: unknown): number | null => {
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

/**
 * Feedly is not consistent about timestamp units: /search/feeds returns created,
 * updated and lastUpdated in milliseconds, while the entry timestamps elsewhere
 * in v3 are in seconds. A millisecond value read as seconds is a date in the
 * year 58000, so the unit is detected from the magnitude rather than assumed.
 * Anything past 1e11 is milliseconds: that is the year 5138 read as seconds.
 */
const toDate = (v: unknown): string => {
  const x = n(v)
  if (x === null || x <= 0) return "unknown"
  const ms = x >= 1e11 ? x : x * 1000
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return "unknown"
  if (d.getUTCFullYear() < 1995 || d.getUTCFullYear() > 2100) {
    // Out of any plausible range, so the unit guess was wrong. Say so instead
    // of printing a date four hundred years out.
    return `raw ${x} (out of range; Feedly returned a value in an unexpected unit)`
  }
  return d.toISOString().slice(0, 10)
}

export interface DiscoverFeedsArgs {
  query: string;
  size?: number;
  offset?: number;
}

/**
 * Feed search, which Feedly serves without a token. This is the only tool in the
 * server that can do anything at all with no credentials, and it is the
 * discovery half of an RSS reader, which the other tools never cover because they
 * all require a token and all operate on feeds you already subscribe to.
 */
export async function discoverFeeds(args: DiscoverFeedsArgs): Promise<string> {
  const q = String(args.query ?? "").trim()
  if (!q) throw new FeedlyError("Provide a search query, for example a topic or a publication name.")
  const size = Math.min(Math.max(Math.floor(args.size ?? 10) || 10, 1), 50)
  const offset = Math.max(Math.floor(args.offset ?? 0) || 0, 0)

  const qs = new URLSearchParams({ query: q, size: String(size), offset: String(offset) })
  const data = await feedlyKeyless<any>(`/search/feeds?${qs.toString()}`)
  const rows: any[] = Array.isArray(data?.results) ? data.results : []
  if (!rows.length) {
    return [
      `No feed matched "${q}".`,
      "",
      `Requested ${size} at offset ${offset} and Feedly returned nothing.${offset > 0 ? " An offset past the end of the result set returns an empty list rather than an error, so this may simply be past the last page." : ""}`,
      "",
      "Feedly's feed index is built from what its users have subscribed to, so a brand new site with no subscribers is not in it at all, and a site that has never been subscribed to is invisible however real it is. An empty result is a statement about Feedly's index rather than about whether the feed exists.",
    ].join("\n")
  }

  const lines = [`Feeds matching "${q}": ${rows.length}${offset ? ` at offset ${offset}` : ""}`, ""]
  for (const r of rows) {
    const subs = n(r?.subscribers)
    const velocity = n(r?.velocity)
    const topics = Array.isArray(r?.topics) && r.topics.length ? r.topics.slice(0, 4).join(", ") : ""
    lines.push(
      `${String(r?.title ?? "(untitled)").slice(0, 56)}`,
      `  id ${String(r?.feedId ?? "?")}`,
      `${subs !== null ? `  ${subs.toLocaleString()} subscribers` : "  subscriber count not published"}${velocity !== null ? `  |  velocity ${velocity.toFixed(3)}` : ""}${r?.language ? `  |  ${r.language}` : ""}${r?.valid === false ? "  |  marked invalid by Feedly" : ""}`,
      `  updated ${toDate(r?.lastUpdated)}`,
      topics ? `  topics: ${topics}` : "",
      r?.created ? `  in Feedly's index since ${toDate(r.created)}` : "",
      r?.website ? `  site: ${r.website}` : "",
      r?.description ? `  ${String(r.description).replace(/\s+/g, " ").trim().slice(0, 130)}` : "",
      "",
    )
  }
  const lines2 = [
    lines.join("\n").trimEnd(),
    "",
    "Subscriber count is how many Feedly users have the feed, and it is the single best signal of whether a feed is worth subscribing to. Velocity is Feedly's own measure of update rate, so a high subscriber count with a low velocity is a large but quiet publication, and the reverse is a busy one nobody reads. A feed marked invalid has failed Feedly's fetch checks and will not update.",
    "Search runs without a Feedly token, so it works even when none is configured. To read what a found feed actually published, pass its id to stream_contents as feed/<url>.",
  ]
  return lines2.join("\n")
}

export interface UnreadCountsArgs {
  top?: number;
  group_by?: string;
}

/**
 * Unread counts across every feed, board and tag. This is the call a reader makes
 * constantly and the server has none of it: profile says who you are,
 * subscriptions says what you read, and neither says how much of it is unread.
 */
export async function unreadCounts(args: UnreadCountsArgs): Promise<string> {
  const top = Math.min(Math.max(Math.floor(args.top ?? 20) || 20, 1), 200)
  const data = await feedlyGet<any>("/markers/counts")
  const counts = data?.unreadcounts ?? data
  const feeds: Record<string, number> = (counts?.feeds ?? {}) as Record<string, number>
  const boards: Record<string, number> = (counts?.boards ?? {}) as Record<string, number>
  const tags: Record<string, number> = (counts?.tags ?? {}) as Record<string, number>
  const reportedTotal = n(data?.total)

  const feedEntries = Object.entries(feeds).map(([id, v]) => ({ id, v: n(v) ?? 0 }))
  const boardEntries = Object.entries(boards).map(([id, v]) => ({ id, v: n(v) ?? 0 }))
  const tagEntries = Object.entries(tags).map(([id, v]) => ({ id, v: n(v) ?? 0 }))
  const feedTotal = feedEntries.reduce((a, e) => a + e.v, 0)
  const grand = feedTotal + boardEntries.reduce((a, e) => a + e.v, 0) + tagEntries.reduce((a, e) => a + e.v, 0)

  if (!feedEntries.length && !boardEntries.length && !tagEntries.length) {
    return [
      "Feedly returned no unread counts at all.",
      "",
      "An empty counts object with a valid token usually means the account has no subscriptions, or that the token belongs to a user with no saved state. It is not a report of being fully caught up, because a caught-up account with subscriptions still returns a feeds object with zeroes in it.",
    ].join("\n")
  }

  const feedIdToName = (id: string): string => {
    // Feedly ids look like feed/https://example.com/rss; the readable part is
    // the host plus a hint of the path, which is enough to tell feeds apart
    // without a second lookup per feed.
    const url = id.replace(/^feed\//, "")
    try {
      const u = new URL(url)
      const path = u.pathname.replace(/\/+$/, "")
      return `${u.hostname}${path && path !== "/index" ? path : ""}`
    } catch {
      return id
    }
  }

  const group = String(args.group_by ?? "all").toLowerCase()
  // The headline uses Feedly's own total when it sends one, because the sum of
  // the three groups is knowingly wrong: board and tag counts overlap the feeds.
  const headline = reportedTotal !== null ? reportedTotal : feedTotal
  const lines: string[] = [
    `Unread: ${intOr(headline, headline)} total`,
    `${feedEntries.length} feed(s) with ${intOr(feedTotal, feedTotal)} unread | ${boardEntries.length} board(s) | ${tagEntries.length} tag(s)`,
  ]
  if (reportedTotal !== null) {
    if (reportedTotal === feedTotal) {
      lines.push(`Feedly's reported total of ${intOr(reportedTotal, reportedTotal)} matches the feed-level sum exactly, which confirms that board and tag counts are views over those same feeds rather than extra items.`)
    } else if (reportedTotal === grand) {
      lines.push(`Feedly's reported total of ${intOr(reportedTotal, reportedTotal)} equals the sum of all three groups, so on this account the boards and tags do not overlap the feed counts and the groups can be added.`)
    } else {
      lines.push(
        `Feedly's reported total of ${intOr(reportedTotal, reportedTotal)} matches neither the feed sum (${intOr(feedTotal, feedTotal)}) nor the sum of all three groups (${intOr(grand, grand)}). Use the reported total: the three groups are different views over the same unread items and cannot be added together, and at least one of them is scoped differently from the total.`,
      )
    }
  }
  lines.push(
    "",
    "Board and tag unread counts are views over the same underlying feeds, not additional items, so a feed that is unread inside a board is already counted once in the feed total. Adding the three group totals together double-counts, and the reported total avoids that.",
    "",
  )

  const showGroup = (title: string, entries: Array<{ id: string; v: number }>, render: (e: { id: string; v: number }) => string) => {
    if (!entries.length) return
    const sorted = [...entries].sort((a, b) => b.v - a.v)
    const nonzero = sorted.filter((e) => e.v > 0)
    lines.push(`${title} (${entries.length}, ${nonzero.length} unread):`)
    for (const e of sorted.slice(0, top)) lines.push(`  ${String(e.v).padStart(7)}  ${render(e)}`)
    if (sorted.length > top) lines.push(`  ...and ${sorted.length - top} more; raise top to see them.`)
    if (nonzero.length) {
      const topN = nonzero.slice(0, 5)
      const topSum = topN.reduce((a, e) => a + e.v, 0)
      const share = feedTotal > 0 ? (topSum / feedTotal) * 100 : NaN
      // "Clears most of the backlog" is only true for a large share. Printed for
      // a 1% tag it was simply false.
      const concentration = Number.isFinite(share)
        ? share >= 60
          ? `, so clearing these clears most of it`
          : share >= 25
            ? `, so a meaningful part of the backlog is here but not most of it`
            : `, so this group holds a small share of the backlog`
        : ""
      lines.push(`  the ${topN.length} largest here hold ${topSum} of ${feedTotal} feed-level unread (${Number.isFinite(share) ? share.toFixed(0) : "?"}%)${concentration}`)
    }
    lines.push("")
  }

  if (group === "all" || group === "feeds") showGroup("Feeds", feedEntries, (e) => feedIdToName(e.id))
  if (group === "all" || group === "boards") showGroup("Boards", boardEntries, (e) => e.id.replace(/^.*\/board\//, ""))
  if (group === "all" || group === "tags") showGroup("Tags", tagEntries, (e) => e.id.replace(/^.*\/tag\//, ""))

  if (!feedEntries.some((e) => e.v > 0)) {
    lines.push("Every feed reports zero unread, so the backlog is clear.")
  }
  return lines.join("\n").trimEnd()
}

const intOr = (v: number | null, fallback: number): string => (v === null ? fallback.toLocaleString("en-US") : Math.round(v).toLocaleString("en-US"))

export interface BoardCatalogueArgs {
  limit?: number;
}

/**
 * Boards and the feeds inside them. The subscriptions endpoint returns a flat list
 * of feeds, so the folder structure a reader actually navigates by is invisible,
 * and two feeds can look unrelated when they are filed together.
 */
export async function boardCatalogue(args: BoardCatalogueArgs): Promise<string> {
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 20) || 20, 1), 200)
  const data = await feedlyGet<any>("/boards")
  const boards: any[] = Array.isArray(data?.boards) ? data.boards : []

  if (!boards.length) {
    return [
      "This Feedly account has no boards.",
      "",
      "Boards are the folder mechanism, and an account that has never filed a feed into one has none. That is normal for a new account and means the subscriptions are a single flat list rather than that anything is wrong.",
    ].join("\n")
  }

  // The counts come in the same call as the board list on the Pro tier and not
  // on others, so they are read when present and left out when not.
  const rows: Array<{ id: string; name: string; feeds: string; count: number | null }> = boards.map((b) => ({
    id: String(b?.id ?? "?"),
    name: String(b?.name ?? "(unnamed)"),
    feeds: Array.isArray(b?.feeds) ? b.feeds.map((f: any) => String(f?.id ?? f?.feedId ?? "")).filter(Boolean) : [],
    count: n(b?.feedCount ?? b?.feedsCount),
  }))

  const lines = [
    `Boards: ${boards.length}, ${rows.reduce((a, r) => a + r.feeds.length, 0)} feed references across them`,
    "",
    `${"feeds".padEnd(7)}board`,
  ]
  for (const r of rows.slice(0, limit)) {
    const c = r.count ?? r.feeds.length
    lines.push(`${String(c).padEnd(7)}${r.name.slice(0, 50)}`)
  }
  if (rows.length > limit) lines.push(`  ...and ${rows.length - limit} more; raise limit to see them.`)
  lines.push("")

  const withFeeds = rows.filter((r) => r.feeds.length || r.count)
  for (const r of withFeeds.slice(0, Math.min(limit, 12))) {
    lines.push(`${r.name} (${r.count ?? r.feeds.length} feed(s))`)
    if (r.feeds.length) {
      for (const f of r.feeds.slice(0, 8)) {
        const url = f.replace(/^feed\//, "")
        let host = f
        try {
          host = new URL(url).hostname
        } catch { /* keep the raw id */ }
        lines.push(`  ${host}`)
      }
      if (r.feeds.length > 8) lines.push(`  ...and ${r.feeds.length - 8} more feeds in this board`)
    } else {
      lines.push("  Feedly returned a feed count for this board but not the feed list, which is the shape of a response on a plan that does not expand boards.")
    }
    lines.push("")
  }
  if (!withFeeds.length) {
    lines.push("No board reported any feeds, so every feed in the account sits outside the folder structure.")
  }
  const biggest = rows.reduce((a, b) => (b.count ?? b.feeds.length) > (a.count ?? a.feeds.length) ? b : a)
  if (withFeeds.length) {
    lines.push(`The largest board is "${biggest.name}" with ${biggest.count ?? biggest.feeds.length} feed(s). A board holding a large share of the subscriptions is where the unread backlog tends to sit, and unread_counts breaks the counts down by board as well as by feed.`)
  }
  return lines.join("\n").trimEnd()
}
