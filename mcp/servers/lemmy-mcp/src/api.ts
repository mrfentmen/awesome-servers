const BASE = 'https://lemmy.world/api/v3/community/list';

export interface CommunitiesArgs {
  limit?: number;
}

export async function communities(args: CommunitiesArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const params = new URLSearchParams({
    limit: String(limit),
    sort: 'TopAll',
    type_: 'All',
  });
  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'mrfentmen-lemmy-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Lemmy returned ${res.status}`);
  const d = (await res.json()) as { communities?: Array<Record<string, unknown>> };
  const rows = d.communities ?? [];
  if (!rows.length) return 'No communities returned.';
  return `Top Lemmy communities on lemmy.world (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const c = (r.community && typeof r.community === 'object' ? r.community as Record<string, unknown> : {});
        const s = (k: string) => (c[k] != null ? String(c[k]) : '');
        const subs = r.counts && typeof r.counts === 'object' ? (r.counts as Record<string, unknown>).subscribers : undefined;
        return `${i + 1}. ${s('name')}${s('title') ? ` | ${s('title')}` : ''}${subs ? ` | subscribers ${subs}` : ''}`;
      })
      .join('\n');
}

// ---- muxC tools:

const LEMMY_BASE = "https://lemmy.world/api/v3"
const LEMMY_UA = "mrfentmen-lemmy-mcp/1.0"

class LemmyLookupError extends Error {}

async function lemmyGet<T>(path: string): Promise<T> {
  const res = await fetch(`${LEMMY_BASE}${path}`, {
    headers: { "User-Agent": LEMMY_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new LemmyLookupError(`lemmy.world returned HTTP ${res.status}`)
  return (await res.json()) as T
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function text(value: unknown): string {
  return value === undefined || value === null || value === "" ? "" : String(value)
}

/** The most active posts across lemmy.world, with their community and score. */
export async function recentPosts(args: { limit?: number; sort?: string }): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 8, 20))
  const sort = (args.sort ?? "Active").trim()
  const allowed = ["Active", "Hot", "New", "TopAll", "TopDay", "TopWeek", "TopMonth", "TopYear", "MostComments", "NewComments"]
  if (!allowed.includes(sort)) throw new LemmyLookupError(`sort must be one of: ${allowed.join(", ")}`)
  const d = await lemmyGet<{ posts?: unknown[] }>(`/post/list?limit=${limit}&sort=${encodeURIComponent(sort)}&type_=All&page=1`)
  const rows = d.posts ?? []
  if (!rows.length) return "lemmy.world returned no posts."
  return `lemmy.world posts, sorted by ${sort} (${rows.length}):\n` +
    rows
      .map((entry, i) => {
        // Lemmy nests the community and creator on the envelope, not on the post.
        const p = object(object(entry).post)
        const counts = object(object(entry).counts)
        const community = object(object(entry).community)
        const creator = object(object(entry).creator)
        const host = community.actor_id ? String(community.actor_id).split("/u/")[0] : "https://lemmy.world"
        const link = text(p.ap_id) || `${host}/post/${text(p.id)}`
        return `${i + 1}. ${text(p.name) || "(untitled)"}\n   in !${text(community.name) || "?"} by ${text(creator.name) || "?"} | ${text(counts.score)} points, ${text(counts.comments)} comments${text(p.nsfw === true) ? " | NSFW" : ""} | ${text(p.published).slice(0, 19).replace("T", " ")}\n   ${link}`
      })
      .join("\n")
}

/** What this Lemmy instance is: name, version, user counts and its sidebar rules. */
export async function instanceInfo(): Promise<string> {
  const d = await lemmyGet<{ site_view?: { site?: unknown; counts?: unknown }; admins?: unknown[]; my_user?: unknown }>("/site")
  const view = d.site_view ?? {}
  const site = object(view.site)
  const counts = object(view.counts)
  const num = (value: unknown): string => (typeof value === "number" ? value.toLocaleString("en-US") : "not reported")
  const sidebar = text(site.sidebar).replace(/\s+/g, " ").trim()
  return [
    `Instance: ${text(site.name) || "not reported"}`,
    `Software: ${text(site.version) || "not reported"}`,
    `Published: ${text(site.published).slice(0, 10) || "not reported"} | actor domain: ${text(site.actor_domain) || "not reported"}`,
    `Users: ${num(counts.users)} active ${num(counts.users_active_month)} this month, ${num(counts.users_active_halfyear)} this half year | posts ${num(counts.posts)} | comments ${num(counts.comments)} | communities ${num(counts.communities)}`,
    sidebar ? `Sidebar: ${sidebar.slice(0, 400)}` : "Sidebar: not published",
  ].join("\n")
}
