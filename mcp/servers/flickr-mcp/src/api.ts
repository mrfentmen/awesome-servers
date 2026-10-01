const BASE = 'https://www.flickr.com/services/feeds/photos_public.gne?format=json';

export interface RecentArgs {
  limit?: number;
}

export async function recent(args: RecentArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-flickr-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Flickr returned ${res.status}`);
  const text = await res.text();
  const jsonText = text.replace(/^jsonFlickrFeed\(/, '').replace(/\)\s*$/, '');
  const d = JSON.parse(jsonText) as { items?: Array<Record<string, unknown>> };
  const rows = (d.items ?? []).slice(0, limit);
  if (!rows.length) return 'No public photos returned.';
  return `Recent public Flickr photos (${rows.length} shown):\n` +
    rows
      .map((r, i) => {
        const s = (k: string) => (r[k] != null ? String(r[k]) : '');
        const t = (r.title && (r.title as string).trim()) || (r.author && String(r.author).replace(/^nobody@flickr\.com \("?/, '').replace(/"?\)?$/, '')) || 'untitled';
        return `${i + 1}. ${t}${r.link ? `\n   ${s('link')}` : ''}`;
      })
      .join('\n');
}

// ---- muxC tools:

const FLICKR_UA = "mrfentmen-flickr-mcp/1.0 (https://github.com/mrfentmen)"

class FlickrError extends Error {}

interface FlickrItem {
  title?: string
  link?: string
  media?: { m?: string }
  date_taken?: string
  tags?: string
  author?: string
  author_id?: string
  published?: string
}

