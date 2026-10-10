const BASE = 'https://officeapi.akashrajpurohit.com';
const UA = 'mrfentmen-office-quotes-mcp/1.0 (https://github.com/mrfentmen)';
export class OfficeError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new OfficeError(`Office API returned ${res.status}`);
  return (await res.json()) as T;
}

export async function randomQuote(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<{ id?: number; character?: string; quote?: string }>(`${BASE}/quote/random`);
  if (!d.quote) throw new OfficeError('Office API returned an empty quote');
  return `"${d.quote}" — ${d.character ?? '?'}`;
}

export async function quoteById(args: { id?: number }): Promise<string> {
  const id = Number(args.id);
  if (!Number.isFinite(id) || id <= 0) throw new OfficeError('Provide a quote id');
  const d = await get<{ id?: number; character?: string; quote?: string }>(`${BASE}/quote/${id}`);
  if (!d.quote) throw new OfficeError(`Quote ${id} not found`);
  return `"${d.quote}" — ${d.character ?? '?'}`;
}

// ---- muxB tools:
const TVMAZE = 'https://api.tvmaze.com';

type TvShow = {
  id?: number;
  name?: string;
  premiered?: string;
  ended?: string;
  status?: string;
  averageRuntime?: number | null;
  genres?: string[];
  network?: { name?: string } | null;
  webChannel?: { name?: string } | null;
  officialSite?: string | null;
  summary?: string | null;
  _embedded?: { cast?: { person?: { name?: string }; character?: { name?: string } }[] };
}

type TvEpisode = {
  id?: number;
  name?: string;
  season?: number;
  number?: number | null;
  airdate?: string | null;
  airstamp?: string | null;
  runtime?: number | null;
  rating?: { average?: number | null } | null;
  summary?: string | null;
  type?: string;
}

async function tvmazeGet<T>(path: string): Promise<T> {
  const res = await fetch(`${TVMAZE}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (res.status === 404) throw new OfficeError('TVmaze has no match for that.');
  if (!res.ok) throw new OfficeError(`TVmaze returned ${res.status}`);
  return (await res.json()) as T;
}

const stripTags = (v: string | null | undefined, max: number): string => {
  const t = (v ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return 'no summary reported';
  return t.length > max ? `${t.slice(0, max)}...` : t;
};

export async function showInfo(args: { show?: string }): Promise<string> {
  const term = (args.show ?? '').trim();
  if (!term) return 'Provide a show name, for example "The Office".';
  const show = await tvmazeGet<TvShow>(`/singlesearch/shows?q=${encodeURIComponent(term)}&embed=cast`);
  if (!show.name) throw new OfficeError(`TVmaze found no show called "${term}".`);
  const cast = (show._embedded?.cast ?? []).slice(0, 12).map((c) =>
    `${c.person?.name ?? '?'}${c.character?.name ? ` as ${c.character.name}` : ''}`,
  );
  const run = show.premiered
    ? `${show.premiered.slice(0, 10)}${show.ended ? ` to ${show.ended.slice(0, 10)}` : ' onwards'}`
    : 'not reported';
  return [
    `${show.name} - TVmaze show id ${show.id ?? 'not reported'}`,
    `  status ${show.status ?? 'not reported'} | premiered ${run}`,
    `  ${show.averageRuntime ?? '?'} minute episodes | genres ${show.genres?.length ? show.genres.join(', ') : 'not reported'}`,
    `  network ${show.network?.name ?? show.webChannel?.name ?? 'not reported'} | site ${show.officialSite ?? 'not reported'}`,
    `  summary: ${stripTags(show.summary, 300)}`,
    `  cast (${cast.length} shown): ${cast.length ? cast.join(' | ') : 'not reported'}`,
  ].join('\n');
}

export async function episodeList(args: { show?: string; season?: number; limit?: number }): Promise<string> {
  const term = (args.show ?? '').trim();
  if (!term) return 'Provide a show name, for example "The Office".';
  const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 20) || 20), 60));
  const onlySeason = args.season === undefined ? null : Math.max(0, Math.trunc(Number(args.season)))
  const show = await tvmazeGet<TvShow>(`/singlesearch/shows?q=${encodeURIComponent(term)}`)
  if (!show.id) throw new OfficeError(`TVmaze found no show called "${term}".`)
  const all = await tvmazeGet<TvEpisode[]>(`/shows/${show.id}/episodes?specials=1`)
  const rows = (onlySeason === null ? all : all.filter((e) => e.season === onlySeason)).slice(0, limit)
  if (!rows.length) {
    return onlySeason === null
      ? `${show.name} has no episodes listed on TVmaze.`
      : `${show.name} has no season ${onlySeason} episodes listed on TVmaze.`
  }
  const lines = rows.map((e, i) => {
    const rating = e.rating?.average != null ? ` | TVmaze rating ${e.rating.average.toFixed(1)}` : ''
    return [
      `${i + 1}. S${String(e.season ?? '?').padStart(2, '0')}E${e.number === null || e.number === undefined ? '  ?' : String(e.number).padStart(2, '0')} ${e.name ?? 'untitled'}`,
      `   aired ${(e.airdate ?? 'not reported')}${e.runtime ? ` | ${e.runtime} min` : ''}${rating}`,
      `   ${stripTags(e.summary, 160)}`,
    ].join('\n')
  })
  const scope = onlySeason === null ? 'all seasons' : `season ${onlySeason}`
  return `${show.name} episodes from TVmaze (${scope}, ${all.length} total listed, showing ${rows.length}):\n${lines.join('\n')}`
}
