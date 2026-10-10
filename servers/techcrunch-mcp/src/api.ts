const BASE = 'https://techcrunch.com/wp-json/wp/v2/posts';

export interface LatestArgs {
  limit?: number;
}

export interface SearchArgs {
  query: string;
  limit?: number;
}

interface TcPost {
  id?: number;
  title?: { rendered?: string };
  link?: string;
  date?: string;
  excerpt?: { rendered?: string };
}

async function fetchPosts(url: string): Promise<TcPost[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-techcrunch-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`TechCrunch returned ${res.status}`);
  return (await res.json()) as TcPost[];
}

function formatRows(posts: TcPost[]): string {
  if (!posts.length) return 'No TechCrunch posts found.';
  return posts
    .map((p, i) => `${i + 1}. ${p.title?.rendered ?? 'untitled'}\n   ${(p.date ?? '').slice(0, 10)} | ${p.link ?? ''}`)
    .join('\n');
}

export async function latest(args: LatestArgs = {}): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const posts = await fetchPosts(`${BASE}?per_page=${limit}`);
  return `Latest TechCrunch posts (${posts.length} shown):\n` + formatRows(posts);
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const posts = await fetchPosts(`${BASE}?search=${encodeURIComponent(q)}&per_page=${limit}`);
  if (!posts.length) return `No TechCrunch posts found for "${q}".`;
  return `TechCrunch results for "${q}" (${posts.length} shown):\n` + formatRows(posts);
}

// ---- muxB tools:
const CATEGORIES_URL = 'https://techcrunch.com/wp-json/wp/v2/categories';

export interface CategoryArgs {
  category: number;
  limit?: number;
}

export interface CategoryListArgs {
  limit?: number;
}

export async function listCategories(args: CategoryListArgs = {}): Promise<string> {
  const limit = Math.max(1, Math.min(Number(args.limit ?? 15) || 15, 40));
  const res = await fetch(`${CATEGORIES_URL}?per_page=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-techcrunch-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`TechCrunch returned ${res.status}`);
  const rows = (await res.json()) as Array<{ id?: number; name?: string; slug?: string; count?: number; description?: string }>;
  if (!Array.isArray(rows) || !rows.length) return 'No TechCrunch categories returned.';
  return `TechCrunch categories (${rows.length} shown, id / name / post count):\n` +
    rows
      .slice(0, limit)
      .map((c) => `${c.id ?? '?'} — ${c.name ?? '?'} (${c.slug ?? 'no slug'}) | ${c.count ?? 0} post(s)${c.description ? ` | ${c.description.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 140)}` : ''}`)
      .join('\n');
}

