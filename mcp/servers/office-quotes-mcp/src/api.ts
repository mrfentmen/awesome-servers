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

// ---- gap4a2 tools:

export async function showSeasons(args: { show_id: number; limit?: number }): Promise<string> {
  const id = Math.max(1, Math.min(Math.trunc(args.show_id), 10000000))
  const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 15), 50))
  const rows = await tvmazeGet<Array<{ number?: number; episodeOrder?: number | null; premiereDate?: string | null; endDate?: string | null; summary?: string | null }>>(`/shows/${id}/seasons`)
  return `TVmaze seasons for show ${id} (${rows.length} total):\n` + rows.slice(0, limit).map(s => `Season ${s.number ?? 'not reported'} | episodes ordered ${s.episodeOrder ?? 'not reported'} | ${s.premiereDate ?? 'not reported'} to ${s.endDate ?? 'not reported'}\n${stripTags(s.summary, 250)}`).join('\n')
}

