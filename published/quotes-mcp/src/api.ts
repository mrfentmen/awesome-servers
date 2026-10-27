
export interface m1_SearchArgs {
  query: string;
  limit?: number;
}

export interface m2_RandomArgs {
  // No arguments needed.
}

const m0 = (() => {
const UA = "mrfentmen-quotes-mcp/1.0 (https://github.com/mrfentmen)"
class QuotesError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new QuotesError(`Quotes API error ${res.status}`)
  return (await res.json()) as T
}

async function quoteOfTheDay(_args: Record<string, never>): Promise<string> {
  const d = await get<any>("https://favqs.com/api/qotd")
  const q = d.quote ?? {}
  return `"${q.body ?? ""}"\n- ${q.author ?? "unknown"}`
}

async function randomQuote(_args: Record<string, never>): Promise<string> {
  const arr = await get<any[]>("https://zenquotes.io/api/random")
  const q = arr?.[0] ?? {}
  return `"${q.q ?? ""}"\n- ${q.a ?? "unknown"}`
}

return { QuotesError, quoteOfTheDay, randomQuote };
})();

const m1 = (() => {
const BASE = 'https://favqs.com/api';

async function qotd(_args?: unknown): Promise<string> {
  const res = await fetch(`${BASE}/qotd`, {
    headers: { 'User-Agent': 'mrfentmen-favqs-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`FavQs returned ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  const q = (d.quote ?? {}) as Record<string, unknown>;
  const s = (k: string) => (q[k] != null ? String(q[k]) : '');
  const a = (q.author ?? {}) as Record<string, unknown>;
  return [
    `Quote of the day:`,
    `"${s('body')}"`,
    `- ${String(a.name ?? s('author') ?? 'unknown')}`,
  ].filter(Boolean).join('\n');
}

async function search(args: m1_SearchArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide search terms.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/quotes?filter=${encodeURIComponent(query)}&page=1`, {
    headers: { 'User-Agent': 'mrfentmen-favqs-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`FavQs returned ${res.status}`);
  const d = (await res.json()) as { quotes?: Array<Record<string, unknown>> };
  const rows = d.quotes ?? [];
  if (!rows.length) return `No quotes for "${query}".`;
  return `Quotes for "${query}" (${Math.min(rows.length, limit)} shown):\n` +
    rows.slice(0, limit).map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      return `${i + 1}. "${s('body')}" - ${s('author')}`;
    }).join('\n');
}

return { qotd, search };
})();

const m2 = (() => {
const BASE = 'https://dummyjson.com/quotes/random';

async function random(_args: m2_RandomArgs): Promise<string> {
  const res = await fetch(BASE, {
    headers: { 'User-Agent': 'mrfentmen-quotes-rest-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Quote API returned ${res.status}`);
  const data = (await res.json()) as { quote?: string; author?: string };
  if (!data.quote) return 'No quote returned.';
  return `${data.quote}\n   -- ${data.author ?? 'Unknown'}`;
}

return { random };
})();

const m3 = (() => {
const UA = "mrfentmen-stoic-quotes-mcp/1.0 (https://github.com/mrfentmen)"

class StoicError extends Error {}

async function one(): Promise<{ text: string; author: string }> {
  const res = await fetch("https://stoic-quotes.com/api/quote", {
    headers: { "User-Agent": UA, Accept: "application/json" },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new StoicError(`Stoic Quotes returned HTTP ${res.status}`)
  return (await res.json()) as { text: string; author: string }
}

async function random(_args?: unknown): Promise<string> {
  const q = await one()
  return `"${q.text}"\n  ${q.author ?? "unknown"}`
}

async function many(args: { count?: number }): Promise<string> {
  const count = Math.min(args.count ?? 3, 10)
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    const q = await one()
    out.push(`${i + 1}. "${q.text}" ${q.author ?? "unknown"}`)
  }
  return out.join("\n\n")
}

return { StoicError, many, random };
})();

const m4 = (() => {
const BASE = 'https://zenquotes.io/api';
const UA = 'mrfentmen-zenquotes-mcp/1.0 (https://github.com/mrfentmen)';
class ZenquotesError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new ZenquotesError(`zenquotes.io returned ${res.status}`);
  return (await res.json()) as T;
}

function fmt(q: { q?: string; a?: string }): string {
  return `"${q.q ?? ''}" — ${q.a ?? 'Unknown'}`;
}

async function random(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<Array<{ q?: string; a?: string }>>(`${BASE}/random`);
  if (!d.length) throw new ZenquotesError('zenquotes.io returned nothing');
  return fmt(d[0]);
}

async function today(_args: Record<string, never> = {}): Promise<string> {
  const d = await get<Array<{ q?: string; a?: string }>>(`${BASE}/today`);
  if (!d.length) throw new ZenquotesError('zenquotes.io returned nothing');
  return `Today's quote:\n${fmt(d[0])}`;
}

async function quotes(args: { limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
  const d = await get<Array<{ q?: string; a?: string }>>(`${BASE}/quotes`);
  if (!d.length) throw new ZenquotesError('zenquotes.io returned nothing');
  return `Quotes (${d.length} available, ${limit} shown):\n` + d.slice(0, limit).map((q, i) => `${i + 1}. ${fmt(q)}`).join('\n');
}

return { ZenquotesError, quotes, random, today };
})();

export const QuotesError = m0.QuotesError;
export const StoicError = m3.StoicError;
export const ZenquotesError = m4.ZenquotesError;
export const many = m3.many;
export const qotd = m1.qotd;
export const quoteOfTheDay = m0.quoteOfTheDay;
export const quotes = m4.quotes;
export const random = m2.random;
export const randomQuote = m0.randomQuote;
export const search = m1.search;
export const today = m4.today;
export const m0_quoteOfTheDay = m0.quoteOfTheDay;
export const m0_QuotesError = m0.QuotesError;
export const m0_randomQuote = m0.randomQuote;
export const m1_search = m1.search;
export const m1_qotd = m1.qotd;
export const m2_random = m2.random;
export const m3_random = m3.random;
export const m3_many = m3.many;
export const m3_StoicError = m3.StoicError;
export const m4_random = m4.random;
export const m4_today = m4.today;
export const m4_quotes = m4.quotes;
export const m4_ZenquotesError = m4.ZenquotesError;

// ---- muxC tools:

