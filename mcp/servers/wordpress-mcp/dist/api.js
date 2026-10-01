const m0 = (() => {
    const BASE = "https://api.wordpress.org/plugins/info/1.0";
    const UA = "mrfentmen-wordpress-plugins-mcp/1.0 (https://github.com/mrfentmen)";
    class WpError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
        if (res.status === 429)
            throw new WpError("WordPress API rate limit hit, wait and retry");
        if (!res.ok)
            throw new WpError(`WordPress API error ${res.status}`);
        return (await res.json());
    }
    async function pluginInfo(args) {
        const slug = (args.slug ?? "").trim();
        if (!slug)
            throw new WpError("Provide a plugin slug");
        const d = await get(`${BASE}/${encodeURIComponent(slug)}.json`);
        if (d?.error)
            throw new WpError(d.error);
        return `Plugin: ${d.name ?? slug}\nVersion: ${d.version ?? "n/a"} | Requires WP: ${d.requires ?? "n/a"}\nRating: ${d.rating ?? "n/a"}/100 (${d.num_ratings ?? 0} ratings)\nDownloads: ${(d.downloads ?? 0).toLocaleString()} (active: ${(d.active_installs ?? 0).toLocaleString()})\nDescription: ${(d.short_description ?? d.sections?.description ?? "").slice(0, 300)}`;
    }
    async function searchPlugins(args) {
        const q = (args.query ?? "").trim();
        if (!q)
            throw new WpError("Provide search terms");
        const limit = Math.min(args.limit ?? 10, 30);
        const d = await get(`${BASE}/search.php?q=${encodeURIComponent(q)}&fields=name,slug,version,rating,downloads,active_installs,short_description`);
        const plugins = d?.plugins ?? [];
        if (!plugins.length)
            return "No plugins found";
        return plugins.slice(0, limit).map((p, i) => `${i + 1}. ${p.name} ${p.version ?? ""}\n   ${(p.short_description ?? "").slice(0, 110)} | ${(p.active_installs ?? 0).toLocaleString()} active`).join("\n\n");
    }
    return { WpError, pluginInfo, searchPlugins };
})();
const m1 = (() => {
    const BASE = 'https://api.wordpress.org/themes/info/1.1/';
    async function search(args) {
        const q = (args.query ?? '').trim();
        if (!q)
            return 'Provide a search query.';
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
        if (!res.ok)
            throw new Error(`WordPress API returned ${res.status}`);
        const data = (await res.json());
        const themes = data.themes ?? [];
        if (!themes.length)
            return `No WordPress themes found for "${q}".`;
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
// ---- gap4b4 tools:
