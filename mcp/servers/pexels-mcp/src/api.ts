const BASE = 'https://api.pexels.com/v1/search';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const res = await fetch(`${BASE}?query=${encodeURIComponent(q)}&per_page=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-pexels-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Pexels returned ${res.status}`);
  const data = (await res.json()) as {
    total_results?: number;
    photos?: Array<{
      photographer?: string;
      width?: number;
      height?: number;
      url?: string;
      src?: { large?: string };
    }>;
  };
  const photos = data.photos ?? [];
  if (!photos.length) return `No Pexels photos for "${q}".`;
  return `Pexels photos for "${q}" (${data.total_results ?? photos.length} total, ${photos.length} shown):\n` +
    photos
      .map((p, i) => `${i + 1}. ${p.photographer ?? 'unknown'} | ${p.width ?? ''}x${p.height ?? ''}${p.src?.large ? `\n   ${p.src.large}` : ''}`)
      .join('\n');
}
