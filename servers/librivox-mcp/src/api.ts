const BASE = 'https://librivox.org/api/feed/audiobooks';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}?q=${encodeURIComponent(query)}&format=json&limit=${limit}&fields=id,title,authors,totaltimesecs`, {
    headers: { 'User-Agent': 'mrfentmen-librivox-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`LibriVox returned ${res.status}`);
  const d = (await res.json()) as { books?: Array<Record<string, unknown>> };
  const books = d.books ?? [];
  if (!books.length) return `No audiobooks found for "${query}".`;
  const secs = (n: unknown) => {
    const v = Number(n);
    if (!v) return '';
    const h = Math.floor(v / 3600);
    const m = Math.floor((v % 3600) / 60);
    return `${h}h ${m}m`;
  };
  return `Audiobooks for "${query}" (${books.length} shown):\n` +
    books.map((b, i) => {
      const s = (k: string) => (b[k] != null ? String(b[k]) : '');
      const authors = (b.authors ?? []) as Array<Record<string, unknown>>;
      const auth = authors.slice(0, 2).map((a) => String(a.first_name ?? '') + ' ' + String(a.last_name ?? '')).join(', ');
      return `${i + 1}. ${s('title')}${auth ? ` by ${auth}` : ''}${secs(b.totaltimesecs) ? ` | ${secs(b.totaltimesecs)}` : ''}`;
    }).join('\n');
}

// ---- muxC tools:

const LIBRIVOX_BASE = "https://librivox.org/api/feed/audiobooks"
const LIBRIVOX_UA = "mrfentmen-librivox-mcp/1.0"

class LibrivoxError extends Error {}

function totalTime(seconds: unknown): string {
  const v = Number(seconds)
  if (!Number.isFinite(v) || v <= 0) return ""
  const h = Math.floor(v / 3600)
  const m = Math.round((v % 3600) / 60)
  return `${h}h ${String(m).padStart(2, "0")}m`
}

function stripTags(value: unknown, max = 260): string {
  const s = String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  return s.length > max ? `${s.slice(0, max)}...` : s
}

