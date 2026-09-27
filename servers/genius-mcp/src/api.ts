const BASE = 'https://genius.com/api/search/multi';

export interface SearchArgs {
  query: string;
  limit?: number;
}

export async function search(args: SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 20));
  const res = await fetch(`${BASE}?q=${encodeURIComponent(q)}`, {
    headers: { 'User-Agent': 'mrfentmen-genius-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Genius returned ${res.status}`);
  const data = (await res.json()) as {
    response?: { sections?: Array<{ type?: string; hits?: Array<{ result?: Record<string, unknown> }> }> };
  };
  const sections = data.response?.sections ?? [];
  const rows: string[] = [];
  for (const section of sections) {
    const type = section.type ?? '';
    for (const hit of section.hits ?? []) {
      const r = hit.result ?? {};
      const name = r.name ?? r.title ?? '';
      const artist = r.primary_artist ? String((r.primary_artist as Record<string, unknown>).name ?? '') : '';
      const url = r.url ? String(r.url) : '';
      rows.push(`${name}${artist ? ` by ${artist}` : ''}${type ? ` [${type}]` : ''}${url ? `\n   ${url}` : ''}`);
      if (rows.length >= limit) break;
    }
    if (rows.length >= limit) break;
  }
  if (!rows.length) return `No Genius results for "${q}".`;
  return `Genius results for "${q}" (${rows.length} shown):\n` + rows.map((r, i) => `${i + 1}. ${r}`).join('\n');
}

async function webGet(path: string): Promise<any> {
  const res = await fetch(`https://genius.com/api${path}`, {
    headers: { 'User-Agent': 'mrfentmen-genius-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Genius returned ${res.status}`);
  return res.json();
}

export async function songDetails(args: { id?: string }): Promise<string> {
  const id = (args.id ?? '').trim();
  if (!id) return 'Provide a Genius song id.';
  const d = await webGet(`/songs/${encodeURIComponent(id)}`);
  const s = d?.response?.song ?? {};
  return `${s.title ?? '?'} by ${s.primary_artist?.name ?? '?'} | ${s.release_date_for_display ?? '?'}\nPageviews: ${s.stats?.pageviews ?? '?'}${s.album?.name ? ` | Album: ${s.album.name}` : ''}\n${s.url ?? ''}`;
}

export async function artistSongs(args: { id?: string; limit?: number }): Promise<string> {
  const id = (args.id ?? '').trim();
  if (!id) return 'Provide a Genius artist id.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 20));
  const d = await webGet(`/artists/${encodeURIComponent(id)}/songs?per_page=${limit}&sort=popularity`);
  const rows = d?.response?.songs ?? [];
  if (!rows.length) return `No songs for artist ${id}.`;
  return rows.map((s: any, i: number) => `${i + 1}. ${s.title ?? '?'}${s.release_date_for_display ? ` (${s.release_date_for_display})` : ''}`).join('\n');
}

export async function artistDetails(args: { id?: string }): Promise<string> {
  const id = (args.id ?? '').trim();
  if (!id) return 'Provide a Genius artist id.';
  const d = await webGet(`/artists/${encodeURIComponent(id)}`);
  const a = d?.response?.artist ?? {};
  return `${a.name ?? '?'}${a.alternate_names?.length ? ` aka ${a.alternate_names.slice(0, 3).join(', ')}` : ''}\n${(a.description?.plain ?? '').slice(0, 300)}${a.url ? `\n${a.url}` : ''}`;
}
