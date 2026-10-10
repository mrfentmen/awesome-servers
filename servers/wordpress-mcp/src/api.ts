
export interface m1_SearchArgs {
  query: string;
  limit?: number;
}

const m0 = (() => {
const BASE = "https://api.wordpress.org/plugins/info/1.0"
const UA = "mrfentmen-wordpress-plugins-mcp/1.0 (https://github.com/mrfentmen)"
class WpError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new WpError("WordPress API rate limit hit, wait and retry")
  if (!res.ok) throw new WpError(`WordPress API error ${res.status}`)
  return (await res.json()) as T
}

async function pluginInfo(args: { slug?: string }): Promise<string> {
  const slug = (args.slug ?? "").trim()
  if (!slug) throw new WpError("Provide a plugin slug")
  const d = await get<any>(`${BASE}/${encodeURIComponent(slug)}.json`)
  if (d?.error) throw new WpError(d.error)
  return `Plugin: ${d.name ?? slug}\nVersion: ${d.version ?? "n/a"} | Requires WP: ${d.requires ?? "n/a"}\nRating: ${d.rating ?? "n/a"}/100 (${d.num_ratings ?? 0} ratings)\nDownloads: ${(d.downloads ?? 0).toLocaleString()} (active: ${(d.active_installs ?? 0).toLocaleString()})\nDescription: ${(d.short_description ?? d.sections?.description ?? "").slice(0, 300)}`
}

async function searchPlugins(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim()
  if (!q) throw new WpError("Provide search terms")
  const limit = Math.min(args.limit ?? 10, 30)
  const d = await get<any>(`${BASE}/search.php?q=${encodeURIComponent(q)}&fields=name,slug,version,rating,downloads,active_installs,short_description`)
  const plugins = d?.plugins ?? []
  if (!plugins.length) return "No plugins found"
  return plugins.slice(0, limit).map((p: any, i: number) => `${i + 1}. ${p.name} ${p.version ?? ""}\n   ${(p.short_description ?? "").slice(0, 110)} | ${(p.active_installs ?? 0).toLocaleString()} active`).join("\n\n")
}

return { WpError, pluginInfo, searchPlugins };
})();

const m1 = (() => {
const BASE = 'https://api.wordpress.org/themes/info/1.1/';


async function search(args: m1_SearchArgs): Promise<string> {
  const q = (args.query ?? '').trim();
  if (!q) return 'Provide a search query.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
  const body = new URLSearchParams({
    action: 'query_themes',
    'request[search]': q,
    'request[per_page]': String(limit),
  });
  const res = await fetch(`${BASE}?${body}`, {
    headers: { 'User-Agent': 'mrfentmen-wordpress-themes-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`WordPress API returned ${res.status}`);
  const data = (await res.json()) as {
    info?: { results?: number };
    themes?: Array<Record<string, unknown>>;
  };
  const themes = data.themes ?? [];
  if (!themes.length) return `No WordPress themes found for "${q}".`;
  return `WordPress themes for "${q}" (${data.info?.results ?? themes.length} total, ${themes.length} shown):\n` +
    themes
      .map((t, i) => {
        const version = t.version ? ` v${t.version}` : '';
        const rating = typeof t.rating === 'number' ? ` | rating ${t.rating.toFixed(1)}` : '';
        const downloads = t.downloaded ? ` | ${Number(t.downloaded).toLocaleString()} downloads` : '';
        return `${i + 1}. ${t.name ?? 'untitled'}${version}${rating}${downloads}`;
      })
      .join('\n');
}

return { search };
})();

export const WpError = m0.WpError;
export const pluginInfo = m0.pluginInfo;
export const search = m1.search;
export const searchPlugins = m0.searchPlugins;
export const m0_searchPlugins = m0.searchPlugins;
export const m0_WpError = m0.WpError;
export const m0_pluginInfo = m0.pluginInfo;
export const m1_search = m1.search;

// ---- muxC tools:

const WP_UA = "mrfentmen-wordpress-mcp/1.0 (https://github.com/mrfentmen)"

class WordPressOrgError extends Error {}

async function wporg(url: string, ms = 30000): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": WP_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) })
  if (res.status === 400) throw new WordPressOrgError("the wordpress.org api rejected that request; check the slug and action")
  if (!res.ok) throw new WordPressOrgError(`wordpress.org returned ${res.status}`)
  return await res.json()
}

/** One theme's record, which the plugin tools cannot fetch. */
export async function themeInfo(args: { slug?: string }): Promise<string> {
  const slug = (args.slug ?? "").trim()
  if (!slug) throw new WordPressOrgError("Provide a theme slug, e.g. twentytwentyfour")
  if (!/^[a-z0-9-]+$/i.test(slug)) throw new WordPressOrgError("A theme slug is lowercase letters, digits and hyphens")
  const d = await wporg(`https://api.wordpress.org/themes/info/1.1/?action=theme_information&request[slug]=${encodeURIComponent(slug)}`)
  if (!d || !d.name) throw new WordPressOrgError(`wordpress.org has no theme with the slug "${slug}".`)
  return [
    `${d.name} (${slug}) version ${d.version ?? "not reported"}`,
    d.author?.display_name ? `by ${d.author.display_name}` : "author not reported",
    d.description ? `${String(d.description).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240)}` : null,
    `active installs ${d.active_installs ?? "not reported"} | rated ${Number(d.rating ?? 0).toFixed(1)} of 100 by ${d.num_ratings ?? 0} raters`,
    d.tags?.length ? `tags: ${(d.tags ?? []).slice(0, 8).join(", ")}` : null,
    d.download_link ?? "",
  ]
    .filter(Boolean)
    .join("\n")
}

/** Browse the theme directory, which no existing tool does. */
export async function themeList(args: { query?: string; limit?: number }): Promise<string> {
  const query = (args.query ?? "blog").trim()
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  const d = await wporg(`https://api.wordpress.org/themes/info/1.1/?action=query_themes&request[search]=${encodeURIComponent(query)}&request[per_page]=${limit}&request[fields][short_description]=1`)
  const themes: any[] = d?.themes ?? []
  if (!themes.length) return `The wordpress.org theme directory has nothing matching "${query}".`
  return `wordpress.org themes matching "${query}" (${d?.info?.results ?? themes.length} found, ${themes.length} shown):\n` +
    themes.map((t, i) => `${i + 1}. ${t.name} (${t.slug})\n   ${String(t.short_description ?? "no description").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140)}\n   rated ${Number(t.rating ?? 0).toFixed(0)} by ${t.num_ratings ?? 0} raters | ${t.active_installs ?? "?"} active installs`).join("\n")
}
