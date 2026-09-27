const UA = 'mrfentmen-wikipedia-pageviews-mcp/1.0 (https://github.com/mrfentmen)';
const BASE = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access';

async function wikiGet(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Wikimedia returned ${res.status}`);
  return res.json();
}

export interface TopArgs {
  date?: string;
  limit?: number;
}

export interface ArticleArgs {
  article: string;
  start?: string;
  end?: string;
}

export interface AccessArgs {
  access?: string;
  date?: string;
  limit?: number;
}

export async function articleViews(args: ArticleArgs): Promise<string> {
  const article = (args.article ?? '').trim().replace(/ /g, '_');
  if (!article) return 'Provide an article title.';
  const end = (args.end ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10)).slice(0, 10);
  const start = (args.start ?? new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10)).slice(0, 10);
  const fmt = (d: string): string => d.replace(/-/g, '');
  const d = await wikiGet(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(article)}/daily/${fmt(start)}/${fmt(end)}`) as { items?: Array<{ views?: number; timestamp?: string }> };
  const items = d.items ?? [];
  if (!items.length) return `No views for ${article}.`;
  const total = items.reduce((s, x) => s + Number(x.views ?? 0), 0);
  return `${article}: ${total.toLocaleString()} views ${start}..${end}\n` + items.slice(-7).map((x) => `${String(x.timestamp ?? '').slice(0, 8)}: ${Number(x.views ?? 0).toLocaleString()}`).join('\n');
}

export async function projectAggregate(args: { start?: string; end?: string }): Promise<string> {
  const end = (args.end ?? new Date(Date.now() - 86400000).toISOString().slice(0, 10)).slice(0, 10);
  const start = (args.start ?? new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10)).slice(0, 10);
  const fmt = (d: string): string => d.replace(/-/g, '');
  const d = await wikiGet(`https://wikimedia.org/api/rest_v1/metrics/pageviews/aggregate/en.wikipedia/all-access/user/daily/${fmt(start)}/${fmt(end)}`) as { items?: Array<{ views?: number; timestamp?: string }> };
  const items = d.items ?? [];
  if (!items.length) return 'No aggregate data.';
  const total = items.reduce((s, x) => s + Number(x.views ?? 0), 0);
  return `en.wikipedia total ${start}..${end}: ${total.toLocaleString()} views\n` + items.slice(-7).map((x) => `${String(x.timestamp ?? '').slice(0, 8)}: ${Number(x.views ?? 0).toLocaleString()}`).join('\n');
}

export async function topByAccess(args: AccessArgs): Promise<string> {
  const access = (args.access ?? 'mobile-app').trim() || 'mobile-app';
  const date = ((args.date ?? '').trim().length === 10 ? args.date! : new Date(Date.now() - 86400000).toISOString().slice(0, 10));
  const day = `${date.slice(0, 4)}/${date.slice(5, 7)}/${date.slice(8, 10)}`;
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const d = await wikiGet(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/${encodeURIComponent(access)}/${day}`) as { items?: Array<{ articles?: Array<{ article?: string; views?: number }> }> };
  const articles = d.items?.[0]?.articles ?? [];
  if (!articles.length) return `No pageview data for ${day}.`;
  return `Top Wikipedia pages (${access}) on ${day}:\n` + articles.slice(0, limit).map((a, i) => `${i + 1}. ${a.article ?? 'unknown'} | ${Number(a.views ?? 0).toLocaleString()} views`).join('\n');
}

export async function top(args: TopArgs = {}): Promise<string> {
  const date = (args.date ?? '').trim();
  // Wikimedia lags about a day, so the default is yesterday.
  const fallback = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const iso = date.length === 10 ? date : fallback;
  const day = `${iso.slice(0, 4)}/${iso.slice(5, 7)}/${iso.slice(8, 10)}`;
  const url = `${BASE}/${day}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'mrfentmen-wikipedia-pageviews-mcp/1.0 (https://github.com/mrfentmen)', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Wikimedia returned ${res.status}`);
  const data = (await res.json()) as {
    items?: Array<{ articles?: Array<{ article?: string; views?: number }> }>;
  };
  const articles = data.items?.[0]?.articles ?? [];
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const shown = articles.slice(0, limit);
  if (!shown.length) return `No pageview data for ${day}.`;
  return `Top Wikipedia pages on ${day} (${shown.length} shown):\n` +
    shown.map((a, i) => `${i + 1}. ${a.article ?? 'unknown'} | ${Number(a.views ?? 0).toLocaleString()} views`).join('\n');
}
