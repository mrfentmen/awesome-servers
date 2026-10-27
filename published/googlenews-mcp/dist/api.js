const BASE = 'https://news.google.com/rss/search';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ q, hl: 'en-US', gl: 'US', ceid: 'US:en' });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-googlenews-mcp/1.0', Accept: 'application/rss+xml' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Google News returned ${res.status}`);
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
        .slice(0, limit)
        .map((m) => {
        const block = m[1];
        const title = block.match(/<title>(.*?)<\/title>/s)?.[1] ?? '';
        const link = block.match(/<link>(.*?)<\/link>/s)?.[1] ?? '';
        const date = block.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] ?? '';
        const src = block.match(/<source[^>]*>(.*?)<\/source>/s)?.[1] ?? '';
        return `${title.replace(/<!\[CDATA\[|\]\]>/g, '').trim()}${src ? ` [${src}]` : ''}${date ? ` | ${String(date).slice(5, 16)}` : ''}${link ? `\n   ${link}` : ''}`;
    });
    if (!items.length)
        return `No Google News headlines for "${q}".`;
    return `Google News for "${q}" (${items.length} shown):\n` + items.map((s, i) => `${i + 1}. ${s}`).join('\n');
}
