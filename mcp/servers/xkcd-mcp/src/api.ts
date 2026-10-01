/**
 * xkcd client. The webcomic API, keyless. Latest comic and any comic by
 * number, with the alt text that makes xkcd xkcd.
 */
const BASE = "https://xkcd.com"

export class XkcdError extends Error {}

export interface Comic {
  num?: number
  title?: string
  safe_title?: string
  alt?: string
  img?: string
  day?: string
  month?: string
  year?: string
  transcript?: string
  news?: string
}

async function getComicJson(path: string): Promise<Comic> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "xkcd-mcp/1.0" },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new XkcdError(`xkcd error ${res.status}`)
  return (await res.json()) as Comic
}

export function latestComic(): Promise<Comic> {
  return getComicJson("/info.0.json")
}

export function getComic(num: number): Promise<Comic> {
  return getComicJson(`/${num}/info.0.json`)
}

export function formatComic(c: Comic): string {
  const date = c.year && c.month && c.day ? `${c.year}-${c.month}-${c.day}` : "unknown date"
  const lines = [
    `[${c.num ?? "?"}] ${c.safe_title ?? c.title ?? "(untitled)"} (${date})`,
    c.alt ? `Alt text: ${c.alt}` : "",
    c.img ? `Image: ${c.img}` : "",
    c.transcript ? `Transcript: ${c.transcript.slice(0, 600)}${c.transcript.length > 600 ? "..." : ""}` : "",
    c.news ? `News: ${c.news.slice(0, 200)}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxE tools:
// The two existing tools each return exactly one comic. xkcd has no search
// API at all: the site's own search path answers 404 whether or not json=true
// is passed, so the only machine-readable surface is /N/info.0.json, one comic
// at a time. That makes a range the useful unit of work, and the three new
// tools are three different questions about a range rather than three more
// single-comic readers.
const XKCD = 'https://xkcd.com';

interface XComic {
  num?: number;
  title?: string;
  safe_title?: string;
  alt?: string;
  img?: string;
  day?: string;
  month?: string;
  year?: string;
  transcript?: string;
  news?: string;
}

interface Bounds {
  from: number;
  to: number;
}

// xkcd asks callers to make at most one request a second, and a range of
// comics is many requests, so the fetches are serialised with a gap. The
// existing single-comic tools make one request each and so do not need this.
let lastFetchAt = 0;
const GAP_MS = 1100;

async function politeGet(path: string): Promise<XComic | null> {
  const wait = GAP_MS - (Date.now() - lastFetchAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetchAt = Date.now();
  const res = await fetch(`${XKCD}${path}`, {
    headers: { 'User-Agent': 'xkcd-mcp/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  // A missing number is 404, and since numbering is contiguous that only
  // happens outside the published range, so it is reported as a gap rather
  // than failing the whole range.
  if (res.status === 404) return null;
  if (!res.ok) throw new XkcdError(`xkcd error ${res.status}`);
  return (await res.json()) as XComic;
}

function readRange(args: { from?: number; to?: number } | undefined): Bounds {
  const from = Math.floor(Number(args?.from));
  const to = Math.floor(Number(args?.to ?? (Number.isFinite(from) ? from : 0)));
  if (!Number.isFinite(from) || from < 1) throw new XkcdError('Provide a starting comic number of 1 or more');
  if (!Number.isFinite(to) || to < from) throw new XkcdError('The end number must be at least the start number');
  // A range is many requests against a site that asks for one a second, so it
  // is capped and the cap is stated rather than silently truncating.
  if (to - from + 1 > 40) {
    throw new XkcdError(`A range of ${to - from + 1} comics is ${to - from + 1} separate requests at one a second. Ask for 40 or fewer.`);
  }
  return { from, to };
}

async function collect(b: Bounds): Promise<Array<{ n: number; c: XComic | null }>> {
  const out: Array<{ n: number; c: XComic | null }> = [];
  for (let n = b.from; n <= b.to; n += 1) {
    out.push({ n, c: await politeGet(`/${n}/info.0.json`) });
  }
  return out;
}

const title = (c: XComic): string => {
  const t = c.safe_title ?? c.title ?? '';
  return t || '(untitled)';
};

const date = (c: XComic): string => (c.year && c.month && c.day ? `${c.year}-${c.month}-${c.day}` : 'not reported');

const short = (v: unknown, max: number): string => {
  if (typeof v !== 'string' || !v.trim()) return 'not reported';
  const t = v.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max)}...` : t;
};

export interface RangeArgs {
  from: number;
  to?: number;
  limit?: number;
}

export async function comic_range(args: RangeArgs): Promise<string> {
  const b = readRange(args);
  const limit = Math.max(1, Math.min(50, Math.floor(Number(args?.limit ?? 25) || 25)));
  const rows = await collect(b);
  const found = rows.filter((r) => r.c !== null);
  const missing = rows.filter((r) => r.c === null).map((r) => r.n);
  if (!found.length) {
    return [
      `No comic in the range ${b.from} to ${b.to}.`,
      missing.length === rows.length
        ? '  Every number in that range answered 404, which is what happens outside the published range.'
        : `  ${missing.length} of ${rows.length} numbers answered 404.`,
    ].join('\n');
  }
  const first = found[0].c as XComic;
  const last = found[found.length - 1].c as XComic;
  const withTranscript = found.filter((r) => (r.c as XComic).transcript).length;
  const withAlt = found.filter((r) => (r.c as XComic).alt).length;
  const lines = [
    `xkcd ${b.from} to ${b.to}, ${found.length} comic${found.length === 1 ? '' : 's'}${missing.length ? `, with ${missing.length} number${missing.length === 1 ? '' : 's'} answering 404 (${missing.join(', ')})` : ''}:`,
    `  running from ${date(first)} to ${date(last)} across ${first.year ?? '?'}.`,
    `  ${withAlt} of ${found.length} carry alt text and ${withTranscript} carry a transcript.`,
    ``,
    `  ${"num".padEnd(6)}${"date".padEnd(13)}${"title".padEnd(34)}alt  transcript`,
  ];
  for (const r of found.slice(0, limit)) {
    const c = r.c as XComic;
    const alt = c.alt ? String(c.alt).length : 0;
    lines.push(
      `  ${String(c.num ?? r.n).padEnd(6)}${date(c).padEnd(13)}${short(c.safe_title ?? c.title, 32).padEnd(34)}${alt ? `${alt} ch` : 'none'.padEnd(5)}${c.transcript ? 'yes' : 'no'}`,
    );
  }
  if (found.length > limit) lines.push(`  and ${found.length - limit} more not listed; raise limit to see them.`);
  lines.push('');
  lines.push(`  Latest in this range: ${last.num} ${title(last)}, image ${last.img ?? 'not reported'}.`);
  lines.push("  The existing tools return one comic at a time, so there is no way with them to see what came out over a stretch.");
  return lines.join('\n');
}

export interface FindArgs {
  from: number;
  term: string;
  to?: number;
  limit?: number;
}

export interface CensusArgs {
  from: number;
  to?: number;
}

function daysBetween(a: XComic, b: XComic): number | null {
  if (!a.year || !a.month || !a.day || !b.year || !b.month || !b.day) return null;
  const at = Date.UTC(Number(a.year), Number(a.month) - 1, Number(a.day));
  const bt = Date.UTC(Number(b.year), Number(b.month) - 1, Number(b.day));
  if (Number.isNaN(at) || Number.isNaN(bt)) return null;
  return Math.round((bt - at) / 86400000);
}

// ---- gap3a tools:

export interface TranscriptArgs {
  numbers: number[];
  maxChars?: number;
}

// get_comic prints the first 600 characters of a transcript, so the whole text
// is not readable through it. This walks a short list of comic numbers and
// prints each transcript in full, up to a bound, because that is the one thing
// the existing single-comic reader cannot show.

