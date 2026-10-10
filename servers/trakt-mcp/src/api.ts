/**
 * Trakt API client. Needs TRAKT_API_KEY (free at https://trakt.tv/oauth/applications).
 * Docs: https://trakt.docs.apiary.io/
 */
const BASE = "https://api.trakt.tv"

export class TraktError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.TRAKT_API_KEY
  if (!key) throw new TraktError("Set TRAKT_API_KEY first (free at trakt.tv/oauth/applications).")
  return {
    "User-Agent": "trakt-mcp/1.0",
    Accept: "application/json",
    "Content-Type": "application/json",
    "trakt-api-version": "2",
    "trakt-api-key": key,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new TraktError("Trakt refused (401/403). Check API key.")
  if (res.status === 404) throw new TraktError("Not found.")
  if (res.status === 429) throw new TraktError("Trakt rate limit hit; wait and retry.")
  if (!res.ok) throw new TraktError(`Trakt error ${res.status}`)
  return (await res.json()) as T
}

export interface Show {
  title?: string
  year?: number
  ids: Raw
}

export async function searchShows(query: string, limit = 5): Promise<Show[]> {
  if (!query.trim()) throw new TraktError("Query is empty.")
  const data = await getJson<Raw[]>(`/search/show?query=${encodeURIComponent(query.trim())}`)
  return data.slice(0, limit).map((r) => {
    const s: Raw = r.show ?? {}
    return { title: s.title, year: s.year, ids: s.ids ?? {} }
  })
}

export async function trendingShows(limit = 5): Promise<Show[]> {
  const data = await getJson<Raw[]>(`/shows/trending?limit=${Math.min(Math.max(limit, 1), 100)}`)
  return data.slice(0, limit).map((r) => {
    const s: Raw = r.show ?? {}
    return { title: s.title, year: s.year, ids: s.ids ?? {} }
  })
}

export async function trendingMovies(limit = 5): Promise<Show[]> {
  const data = await getJson<Raw[]>(`/movies/trending?limit=${Math.min(Math.max(limit, 1), 100)}`)
  return data.slice(0, limit).map((r) => {
    const m: Raw = r.movie ?? {}
    return { title: m.title, year: m.year, ids: m.ids ?? {} }
  })
}

export function imdbOf(ids: Raw): string {
  return ids.imdb ? `https://www.imdb.com/title/${ids.imdb}/` : ""
}

export function formatShow(s: Show, imdb: string, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}${s.title ?? "(untitled)"}${s.year ? ` (${s.year})` : ""}${imdb ? `\n   ${imdb}` : ""}`
}

// ---- muxE tools:
// The three existing tools all reduce a result to the same three fields,
// title, year and an id bag, and then print the IMDb URL. Two problems follow.
// First, a title alone is ambiguous: Battlestar Galactica exists as 1978 and
// 2003, Doctor Who as 1963 and 2005, and the year is often the only thing that
// tells them apart. Second, the same show comes back more than once in a search
// with different slugs, and picking the right record to save means comparing id
// sets rather than reading a list. All three tools below are local: they do the
// identity work on records the caller already holds and make no request, since
// Trakt itself needs an API key this server will not have without one.
// This block is spliced into the same module, so TraktError is already in
// scope here and is not imported again.

// A Trakt show or movie record as these tools return it. Every field is
// optional because a caller may hand over a raw search row instead.
interface Entry {
  title?: string;
  year?: number | string | null;
  ids?: Record<string, unknown> | null;
  [k: string]: unknown;
}

function rows(input: unknown): Entry[] {
  if (!Array.isArray(input)) return [];
  return input.filter((r): r is Entry => !!r && typeof r === 'object');
}

// Case, punctuation and the decorations a database adds are not part of a
// title's identity, so they are removed before anything is compared.
function normalise(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// The article and a handful of words carry no distinguishing weight, so they go.
const STOP = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'part']);

const tokens = (value: unknown): string[] =>
  normalise(value).split(' ').filter((w) => w.length > 0 && !STOP.has(w));

// Word order is not identity, so two titles that share every content word
// match however differently they are punctuated or ordered.
function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a);
  const sb = new Set(b);
  let shared = 0;
  for (const w of sa) if (sb.has(w)) shared += 1;
  const union = sa.size + sb.size - shared;
  return union ? shared / union : 0;
}

function yearOf(entry: Entry): number | null {
  const y = entry.year;
  const n = typeof y === 'string' ? Number(y) : y;
  return typeof n === 'number' && Number.isFinite(n) && n > 1800 && n < 2200 ? n : null;
}

// The id services Trakt records, and the base URL each one is usable at. These
// are fixed public addresses, not a lookup table invented for the tool.
const ID_SERVICES: Array<[string, (id: string) => string]> = [
  ['imdb', (id) => `https://www.imdb.com/title/${id}/`],
  ['tmdb', (id) => `https://www.themoviedb.org/${id.startsWith('movie') ? 'movie' : 'tv'}/${id.replace(/^(movie|tv)\//, '')}`],
  ['tvdb', (id) => `https://thetvdb.com/?tab=series&id=${id}`],
];

const TRACKED_IDS = ['trakt', 'slug', 'imdb', 'tmdb', 'tvdb', 'tvrage'];

function idMap(entry: Entry): Map<string, string> {
  const out = new Map<string, string>();
  const src = entry.ids && typeof entry.ids === 'object' ? entry.ids : {};
  for (const key of TRACKED_IDS) {
    const v = src[key];
    if (typeof v === 'string' && v.trim()) out.set(key, v.trim());
    else if (typeof v === 'number' && Number.isFinite(v)) out.set(key, String(v));
  }
  return out;
}

function label(e: Entry): string {
  const t = typeof e.title === 'string' ? e.title.trim() : '';
  const y = yearOf(e);
  return t ? (y ? `${t} (${y})` : t) : 'untitled';
}

export interface MatchTitleArgs {
  query: string;
  candidates: Entry[];
  limit?: number;
}

export function match_title(args: MatchTitleArgs): string {
  const q = (args?.query ?? '').trim();
  if (!q) throw new TraktError('Provide the title you are looking for in query.');
  const cands = rows(args?.candidates);
  if (!cands.length) throw new TraktError('Provide a candidates array of the show or movie records to choose between.');
  const limit = Math.max(1, Math.min(25, Math.floor(Number(args?.limit ?? 8) || 8)));
  const qt = tokens(q);
  const qYear = /\b(19|20)\d{2}\b/.exec(q);
  const qy = qYear ? Number(qYear[0]) : null;
  // The year inside the query is removed before comparing words, or every
  // candidate would score against a token the query was using as a date.
  const qtNoYear = tokens(q.replace(/\b(19|20)\d{2}\b/, ' '));
  const scored = cands.map((e) => {
    const ct = tokens(e.title);
    const word = jaccard(qtNoYear.length ? qtNoYear : qt, ct);
    const cy = yearOf(e);
    let yearScore = 0.5; // unknown year is neither a match nor a mismatch
    let yearNote = 'no year on the record';
    if (qy !== null && cy !== null) {
      const d = Math.abs(qy - cy);
      yearScore = d === 0 ? 1 : d <= 1 ? 0.7 : d <= 3 ? 0.35 : 0;
      yearNote = d === 0 ? 'year matches exactly' : d === 1 ? 'year is off by one' : d <= 3 ? `year is off by ${d}` : `year differs by ${d}`;
    } else if (qy === null) {
      yearNote = 'the query names no year, so the year was not scored';
    } else {
      yearNote = 'the record carries no year, so the year could not be checked';
    }
    // Title similarity dominates and the year breaks ties, which is the order a
    // person would decide in.
    const score = word * 0.7 + yearScore * 0.3;
    return { e, word, yearScore, yearNote, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const lines = [
    `Which of these records is "${q}", scored on word overlap and then year:`,
    `  ${cands.length} candidate${cands.length === 1 ? '' : 's'}, ranked by how close each is.`,
  ];
  for (const s of scored.slice(0, limit)) {
    const pct = (s.score * 100).toFixed(0);
    const verdict =
      s.score >= 0.9 ? 'almost certainly it' :
      s.score >= 0.7 ? 'a close match' :
      s.score >= 0.45 ? 'a partial match, check the year' :
      s.score >= 0.2 ? 'a weak match' :
      'not this one';
    lines.push(`  ${pct}%  ${label(s.e)} — ${verdict}`);
    lines.push(`        title words overlap ${(s.word * 100).toFixed(0)}%${s.word === 0 ? ' (no shared content word)' : ''}; ${s.yearNote}`);
    const ids = idMap(s.e);
    if (ids.size) lines.push(`        ids: ${[...ids.entries()].map(([k, v]) => `${k} ${v}`).join(', ')}`);
  }
  if (scored.length > limit) lines.push(`  and ${scored.length - limit} further candidate(s) not listed.`);
  const best = scored[0];
  lines.push("");
  if (best.score >= 0.9) lines.push(`  ${label(best.e)} is the record to use.`);
  else if (best.score >= 0.7) lines.push(`  ${label(best.e)} is the closest, but confirm the year before saving it.`);
  else lines.push('  Nothing here is a confident match, so the search itself did not find what you were after.');
  lines.push("  This scores titles only, so a remake, a reboot or a same-named series from a different country cannot be told apart by it alone. The year is the field that separates those, which is why it is weighted and shown.");
  return lines.join('\n');
}

export interface DedupeArgs {
  entries: Entry[];
}

export function dedupe_entries(args: DedupeArgs): string {
  const all = rows(args?.entries);
  if (!all.length) throw new TraktError('Provide an entries array of the show or movie records to check for duplicates.');

  // Union-find over the records. Two are merged when they share any identifier,
  // and again when their normalised title and year agree and no identifier
  // contradicts the other. The second rule matters because a search routinely
  // returns the same show under two different trakt ids with no other id in
  // common, and the first rule alone let that pair through as distinct.
  const parent = all.map((_, i) => i);
  const find = (i: number): number => {
    let cur = i;
    while (parent[cur] !== cur) cur = parent[cur];
    parent[i] = cur;
    return cur;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };
  const byId = new Map<string, number[]>();
  for (let i = 0; i < all.length; i += 1) {
    for (const [svc, val] of idMap(all[i])) {
      const k = `${svc}:${val}`;
      for (const j of byId.get(k) ?? []) union(i, j);
      byId.set(k, [...(byId.get(k) ?? []), i]);
    }
  }
  // Same normalised title and same year, merged unless an id service disagrees.
  // A year is required on both sides, since a title with no year is too weak a
  // key to merge on and a mismatch is exactly what separates a remake.
  const byTitle = new Map<string, number[]>();
  for (let i = 0; i < all.length; i += 1) {
    const y = yearOf(all[i]);
    const nt = normalise(all[i].title);
    if (!nt || y === null) continue;
    byTitle.set(`${nt}|${y}`, [...(byTitle.get(`${nt}|${y}`) ?? []), i]);
  }
  let contradicted = 0;
  for (const group of byTitle.values()) {
    for (let a = 0; a < group.length; a += 1) {
      for (let b = a + 1; b < group.length; b += 1) {
        const ia = idMap(all[group[a]]);
        const ib = idMap(all[group[b]]);
        let clash = false;
        for (const [svc, va] of ia) {
          const vb = ib.get(svc);
          if (vb !== undefined && vb !== va) clash = true;
        }
        if (clash) {
          contradicted += 1;
        } else {
          union(group[a], group[b]);
        }
      }
    }
  }

  const merged = new Map<number, Entry[]>();
  for (let i = 0; i < all.length; i += 1) {
    const r = find(i);
    merged.set(r, [...(merged.get(r) ?? []), all[i]]);
  }
  const groups = [...merged.values()];
  const dupes = groups.filter((list) => list.length > 1);
  const lines = [
    `Duplicate check over ${all.length} record${all.length === 1 ? '' : 's'}:`,
    `  ${groups.length} distinct after merging, so ${all.length - groups.length} ${all.length - groups.length === 1 ? 'record was' : 'records were'} a duplicate.`,
  ];
  if (contradicted) {
    lines.push(`  ${contradicted} pair(s) share a title and year but disagree on an identifier, so they were left apart: that is a real conflict rather than a repeat.`);
  }
  if (!dupes.length) {
    lines.push("  nothing repeated, so every record here is a different title as far as any identifier, or the title and year together, can tell.");
    return lines.join('\n');
  }
  lines.push('');
  lines.push('  the repeats, and what they agreed on:');
  for (const list of dupes.slice(0, 15)) {
    lines.push(`    ${label(list[0])} — ${list.length} records`);
    for (const e of list) {
      const ids = idMap(e);
      const missing = TRACKED_IDS.filter((k) => !ids.has(k));
      lines.push(`      ${label(e)} | ${ids.size ? [...ids.entries()].map(([k, v]) => `${k} ${v}`).join(', ') : 'no ids at all'}${missing.length ? ` | missing ${missing.join(', ')}` : ' | complete'}`);
    }
    const idSets = list.map((e) => [...idMap(e).keys()].sort().join(','));
    const consistent = idSets.every((s) => s === idSets[0]);
    lines.push(`      ${consistent ? 'every record here carries the same set of ids, so the choice between them does not matter.' : 'these records carry different id sets, so the one with the fewest missing ids is the safer one to keep.'}`);
  }
  if (dupes.length > 15) lines.push(`    and ${dupes.length - 15} further repeated title(s) not listed.`);
  lines.push('');
  lines.push("  Records are matched on any shared trakt, slug, imdb, tmdb or tvdb id first, then on a normalised title and year where no identifier contradicts the other. A same-named title from two different years is never merged, because the year is required on both sides.");
  return lines.join('\n');
}

export interface ShowIdsArgs {
  entry: Entry;
}

export function show_identifiers(args: ShowIdsArgs): string {
  const e = args?.entry;
  if (!e || typeof e !== 'object') throw new TraktError('Provide a single show or movie record in entry.');
  const ids = idMap(e);
  const lines = [
    `Every identifier this record carries, and where each one leads:`,
    `  record: ${label(e)}`,
  ];
  for (const [svc, url] of ID_SERVICES) {
    const v = ids.get(svc);
    lines.push(`  ${svc.padEnd(6)} ${v ? v.padEnd(18) : 'not reported'.padEnd(18)} ${v ? url(v) : 'nothing to link to'}`);
  }
  for (const k of ['trakt', 'slug', 'tvrage']) {
    lines.push(`  ${k.padEnd(6)} ${(ids.get(k) ?? 'not reported')}`);
  }
  const missing = TRACKED_IDS.filter((k) => !ids.has(k));
  lines.push("");
  if (!missing.length) {
    lines.push("  This record is complete, so it can be resolved against any of these services.");
  } else {
    lines.push(`  ${missing.length} of the ${TRACKED_IDS.length} identifiers this server knows about are absent (${missing.join(', ')}).`);
    lines.push("  An incomplete record still works here, but anything that has to look the title up on another service will not find it without one of the missing ids.");
    if (!ids.get('imdb')) lines.push("  There is no imdb id, so the one link the existing tools print would have been empty for this record.");
  }
  const y = yearOf(e);
  lines.push("");
  lines.push(
    y === null
      ? "  This record carries no usable year, so it cannot be told apart from a same-named title of a different vintage."
      : `  The year is ${y}, and that is the field that separates this from any same-named title of a different year.`,
  );
  lines.push("  The existing tools return the imdb link only, and nothing at all when the imdb id is missing.");
  return lines.join('\n');
}
