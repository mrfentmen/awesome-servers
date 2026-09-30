const BASE = 'https://ron-swanson-quotes.herokuapp.com/v2';

export async function random(_args: Record<string, never> = {}): Promise<string> {
  const res = await fetch(`${BASE}/quotes`, {
    headers: { 'User-Agent': 'mrfentmen-ron-swanson-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`ron-swanson quotes returned ${res.status}`);
  const data = (await res.json()) as string[];
  if (!Array.isArray(data) || data.length === 0 || !data[0]) {
    throw new Error('ron-swanson quotes returned an empty response');
  }
  return data[0];
}

// ---- gap2a tools:

const UA = 'mrfentmen-ron-swanson-mcp/1.0';
// Every quote in the corpus contains a space, so searching for one is the only
// way to ask the API for the whole catalogue at once.
const EVERY_QUOTE = '%20';

export interface BatchArgs {
  count?: number;
}

export interface TermArgs {
  term: string;
  limit?: number;
}

export interface PageArgs {
  limit?: number;
  offset?: number;
}

export interface RankArgs {
  limit?: number;
}

async function getQuotes(path: string): Promise<string[]> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 429) throw new Error('The Ron Swanson quotes API is rate limiting this client, try again shortly');
  if (!res.ok) throw new Error(`Ron Swanson quotes returned ${res.status}`);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error('Ron Swanson quotes returned a body that is not JSON');
  }
  if (!Array.isArray(body)) throw new Error('Ron Swanson quotes returned something other than a list of quotes');
  return body.filter((q): q is string => typeof q === 'string' && q.trim() !== '');
}

export async function batch(args: BatchArgs): Promise<string> {
  const count = Math.max(1, Math.min(Math.round(args.count ?? 5), 25));
  const quotes = await getQuotes(`/quotes/${count}`);
  if (!quotes.length) return 'The Ron Swanson quotes API returned no quotes.';
  return [
    `${quotes.length} Ron Swanson quote(s) in one draw:`,
    ...quotes.map((q, i) => `${i + 1}. ${q}`),
  ].join('\n');
}

export async function search(args: TermArgs): Promise<string> {
  const term = (args.term ?? '').trim();
  if (!term) return 'Provide a word or phrase to search the quotes for.';
  const limit = Math.max(1, Math.min(Math.round(args.limit ?? 10), 50));
  const matches = await getQuotes(`/quotes/search/${encodeURIComponent(term)}`);
  if (!matches.length) return `No Ron Swanson quote contains "${term.slice(0, 40)}".`;
  const shown = matches.slice(0, limit);
  return [
    `${matches.length} of the quotes contain "${term.slice(0, 40)}"${matches.length > shown.length ? `, first ${shown.length} shown` : ''}:`,
    ...shown.map((q, i) => `${i + 1}. ${q}`),
  ].join('\n');
}

export async function rateLimit(_args: Record<string, never> = {}): Promise<string> {
  // The API reports its own budget in headers on every response, so one real
  // call is all it takes to read them.
  const res = await fetch(`${BASE}/quotes`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  const reset = Number(res.headers.get('x-ratelimit-reset'));
  const resetAt = Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000).toISOString() : 'not reported';
  return [
    `Ron Swanson quotes API rate limit, read from a live ${BASE}/quotes call:`,
    `Requests allowed per window: ${res.headers.get('x-ratelimit-limit') ?? 'not reported'}`,
    `Requests remaining now: ${res.headers.get('x-ratelimit-remaining') ?? 'not reported'}`,
    `Window resets at: ${resetAt}`,
    `That call returned: HTTP ${res.status}`,
  ].join('\n');
}
