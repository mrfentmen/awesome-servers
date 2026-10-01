const BASE = 'https://peertube.tv/api/v1';
const UA = 'mrfentmen-peertube-mcp/1.0 (https://github.com/mrfentmen)';
export class PeertubeError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new PeertubeError(`PeerTube returned ${res.status}`);
  return (await res.json()) as T;
}

export async function searchVideos(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) throw new PeertubeError('Provide a search query');
  const limit = Math.max(1, Math.min(args.limit ?? 8, 25));
  const d = await get<{ total?: number; data?: Array<{ name?: string; url?: string; duration?: number; views?: number; category?: { label?: string } }> }>(`${BASE}/search/videos?search=${encodeURIComponent(q)}&start=0&count=${limit}`);
  const videos = d.data ?? [];
  if (!videos.length) return `No videos found for "${q}".`;
  return `PeerTube videos for "${q}" (${d.total ?? videos.length} total, ${videos.length} shown):\n` + videos.map((v, i) => {
    const mins = v.duration ? `${Math.floor(v.duration / 60)}m${String(v.duration % 60).padStart(2, '0')}s` : '?';
    return `${i + 1}. ${v.name ?? '?'}\n   ${mins} | ${v.views ?? 0} views | ${v.category?.label ?? ''}\n   ${v.url ?? ''}`;
  }).join('\n');
}

export async function instance(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<{ instance?: { name?: string; shortDescription?: string; description?: string }; serverVersion?: string }>(`${BASE}/config`);
  const inst = d.instance ?? {};
  return [
    `PeerTube.tv: ${inst.name ?? '?'}`,
    (inst.shortDescription ?? inst.description ?? '').slice(0, 300),
    `Server version: ${d.serverVersion ?? '?'}`,
  ].filter(Boolean).join('\n');
}

// ---- muxB tools:

const SORTS: Record<string, string> = {
  trending: '-trending',
  views: '-views',
  likes: '-likes',
  published: '-publishedAt',
  duration: '-duration',
}

export interface TopVideosArgs {
  sort?: string;
  limit?: number;
}

export interface VideoDetailArgs {
  uuid: string;
}

