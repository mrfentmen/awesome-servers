export class SpreakerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SpreakerError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.spreaker.com/v2"

function optAuth(): Record<string, string> {
  const tok = process.env.SPREAKER_ACCESS_TOKEN
  return tok ? { Authorization: "Bearer " + tok } : {}
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...optAuth(), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new SpreakerError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function getShow(showId: string): Promise<string> {
  return req(`/shows/${encodeURIComponent(showId)}`)
}

export function listShowEpisodes(showId: string, limit?: string): Promise<string> {
  const q = limit ? `?limit=${encodeURIComponent(limit)}` : ""
  return req(`/shows/${encodeURIComponent(showId)}/episodes${q}`)
}

export function getEpisode(episodeId: string): Promise<string> {
  return req(`/episodes/${encodeURIComponent(episodeId)}`)
}

export function searchShows(query: string, limit?: string): Promise<string> {
  const p = new URLSearchParams({ type: "shows", q: query })
  if (limit) p.set("limit", limit)
  return req(`/search?${p.toString()}`)
}

export function createShow(title: string, language: string): Promise<string> {
  const tok = process.env.SPREAKER_ACCESS_TOKEN
  if (!tok) throw new SpreakerError("Set the SPREAKER_ACCESS_TOKEN environment variable.")
  return req("/shows", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, language }),
  })
}

// ---- muxH tools:
// The five tools above all work on a single show or a single episode. These two
// step up a level: who is publishing, what they publish and how often, and a way
// to find individual episodes across every show rather than inside one feed.

const SK_UA = { "User-Agent": "mcfentmen-spreaker-mcp/1.1 (https://github.com/mcfentmen/spreaker-mcp)" };

interface SkUser {
  user_id?: number;
  fullname?: string;
  username?: string | null;
  site_url?: string;
  kind?: string;
  plan?: string;
  followers_count?: number;
  followings_count?: number;
  shows_count?: number;
  contact_email?: string | null;
  description?: string | null;
}

interface SkShow {
  show_id?: number;
  title?: string;
  author_id?: number;
  explicit?: boolean;
  last_episode_at?: string | null;
  slug?: string;
  site_url?: string;
  ai_generated?: boolean;
  category?: string | null;
  category_2?: string | null;
  category_3?: string | null;
}

interface SkEpisode {
  episode_id?: number;
  type?: string;
  title?: string;
  duration?: number;
  explicit?: boolean;
  show_id?: number;
  author_id?: number;
  published_at?: string;
  ai_generated?: boolean;
  site_url?: string;
  download_enabled?: boolean;
}

async function skGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      signal: AbortSignal.timeout(30000),
      headers: { ...SK_UA, Accept: "application/json" },
    });
  } catch (e) {
    throw new SpreakerError(`Could not reach Spreaker: ${(e as Error).message}`);
  }
  const body = (await res.json()) as { response?: T & { error?: { messages?: string[]; code?: number } } };
  if (!res.ok) {
    const detail = body?.response?.error?.messages?.[0] ?? `HTTP ${res.status}`;
    throw new SpreakerError(`Spreaker rejected the request: ${detail}`);
  }
  if (body?.response?.error) {
    throw new SpreakerError(`Spreaker reported: ${body.response.error.messages?.[0] ?? "unknown error"}`);
  }
  return (body.response ?? {}) as T;
}

/** Spreaker publishes episode duration in milliseconds. */
const spoken = (ms?: number): string => {
  if (!ms || !Number.isFinite(ms) || ms < 0) return "duration not reported";
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`;
};

/**
 * Find individual episodes anywhere on Spreaker by keyword, which the show-scoped
 * episode list cannot do: it returns the show each hit belongs to, so a phrase
 * can be traced back to the feed that published it.
 */
export async function episodeSearch(args: { query: string; limit?: number }): Promise<string> {
  const query = String(args.query ?? "").trim();
  if (!query) throw new SpreakerError("Give a phrase to search for, for example 'budget'.");
  const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 50);
  const found = await skGet<{ items?: SkEpisode[] }>(`/search?type=episodes&q=${encodeURIComponent(query)}&limit=${limit}`);
  const rows = found.items ?? [];
  if (!rows.length) {
    return `Spreaker's episode index holds nothing matching "${query}". The index covers published episodes only, so an unlisted or private episode will not appear.`;
  }

  const durations = rows.map((e) => e.duration ?? 0).filter((d) => d > 0);
  const explicit = rows.filter((e) => e.explicit).length;
  const shows = new Set(rows.map((e) => e.show_id));

  return [
    `Episodes matching "${query}" — ${rows.length} hit(s) across ${shows.size} show(s)`,
    `  lengths ${durations.length ? `${spoken(Math.min(...durations))} to ${spoken(Math.max(...durations))}` : "not reported in the hits"} | ${explicit} flagged explicit | ${rows.filter((e) => e.ai_generated).length} flagged machine-generated`,
    "",
    ...rows.map((e, i) => {
      const published = String(e.published_at ?? "").slice(0, 10);
      return [
        `  ${String(i + 1).padStart(2)}. ${e.title ?? "untitled"}`,
        `      show ${e.show_id} | author ${e.author_id} | ${spoken(e.duration)} | published ${published || "not reported"} | type ${e.type ?? "not reported"}`,
        `      ${e.site_url ?? `https://www.spreaker.com/episode/${e.episode_id}`}${e.download_enabled ? " | download enabled" : " | download not enabled"}`,
      ].join("\n");
    }),
    "",
    "Spreaker's search ranks by its own relevance rules and returns a capped page, so this is a sample rather than a complete census of every episode containing the phrase. Titles are matched, not full transcripts.",
  ].join("\n");
}
