const DEFAULT = 'https://mastodon.social';

export interface InstanceArgs {
  domain?: string;
}

export interface TrendsArgs {
  domain?: string;
  limit?: number;
}

export async function instance(args: InstanceArgs): Promise<string> {
  const base = (args.domain ?? '').trim().replace(/\/$/, '') || DEFAULT;
  const res = await fetch(`${base}/api/v1/instance`, {
    headers: { 'User-Agent': 'mrfentmen-mastodon-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Mastodon returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const s = (k: string) => (d[k] != null ? String(d[k]) : '');
  const stats = (d.stats && typeof d.stats === 'object' ? d.stats as Record<string, unknown> : {});
  const ss = (k: string) => (stats[k] != null ? String(stats[k]) : '');
  return [
    `${s('title')} (${s('uri') ?? base.replace('https://', '')})`,
    s('description') ? `Desc: ${s('description').slice(0, 150)}` : '',
    ss('user_count') ? `Users: ${ss('user_count')}` : '',
    ss('status_count') ? `Posts: ${ss('status_count')}` : '',
    s('version') ? `Version: ${s('version')}` : '',
  ].filter(Boolean).join('\n') || `No data for ${base}.`;
}

export async function trends(args: TrendsArgs): Promise<string> {
  const base = (args.domain ?? '').trim().replace(/\/$/, '') || DEFAULT;
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const res = await fetch(`${base}/api/v1/trends?limit=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-mastodon-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Mastodon returned ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  if (!rows.length) return `No trends on ${base}.`;
  return `Trending tags on ${base} (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        return `${i + 1}. ${s('name')}${s('history') && (r.history as unknown[])?.[0] ? ` | ${(r.history as Array<Record<string, unknown>>)[0].uses ?? ''} posts` : ''}`;
      })
      .join('\n');
}

// ---- muxF tools:
/**
 * Two more public Mastodon endpoints: resolving a handle to a real account
 * across the fediverse, and reading a hashtag timeline, which is a different
 * question from what is trending right now.
 */
const MS_UA = { "User-Agent": "mrfentmen-mastodon-mcp/1.0", Accept: "application/json" };

function msBase(domain?: string): string {
  const base = (domain ?? "").trim().replace(/\/+$/, "");
  if (base && !/^https:\/\//i.test(base)) return `https://${base}`;
  return base || DEFAULT;
}

async function msGet<T>(url: string, what: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { headers: MS_UA, signal: AbortSignal.timeout(20000) });
  } catch (e) {
    throw new Error(`Network error talking to Mastodon: ${(e as Error).message}`);
  }
  if (res.status === 401 || res.status === 403) throw new Error(`Mastodon requires authentication for ${what} (${res.status}).`);
  if (res.status === 404) throw new Error(`Mastodon returned 404 for ${what}.`);
  if (!res.ok) throw new Error(`Mastodon returned ${res.status} for ${what}.`);
  const body = (await res.text()).trim();
  if (!body) throw new Error(`Mastodon returned an empty body for ${what}.`);
  return JSON.parse(body) as T;
}

const msText = (value: unknown, max = 120): string =>
  String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const msDate = (value: unknown): string => {
  const stamp = Date.parse(String(value ?? ""));
  if (!Number.isFinite(stamp)) return "not reported";
  const days = Math.round((Date.now() - stamp) / 86_400_000);
  return `${new Date(stamp).toISOString().slice(0, 10)} (${days} day(s) ago)`;
};

const msHost = (raw: string): string => new URL(raw).host.replace(/^www\./, "");

const msLastStatus = (value: unknown): string => {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return "not reported";
  return msDate(new Date(seconds * 1000).toISOString());
};

