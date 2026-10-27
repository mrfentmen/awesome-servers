const BASE = 'https://www.flickr.com/services/feeds/photos_public.gne?format=json';
export async function recent(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-flickr-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Flickr returned ${res.status}`);
    const text = await res.text();
    const jsonText = text.replace(/^jsonFlickrFeed\(/, '').replace(/\)\s*$/, '');
    const d = JSON.parse(jsonText);
    const rows = (d.items ?? []).slice(0, limit);
    if (!rows.length)
        return 'No public photos returned.';
    return `Recent public Flickr photos (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            const t = (r.title && r.title.trim()) || (r.author && String(r.author).replace(/^nobody@flickr\.com \("?/, '').replace(/"?\)?$/, '')) || 'untitled';
            return `${i + 1}. ${t}${r.link ? `\n   ${s('link')}` : ''}`;
        })
            .join('\n');
}
// ---- muxC tools:
const FLICKR_UA = "mrfentmen-flickr-mcp/1.0 (https://github.com/mrfentmen)";
class FlickrError extends Error {
}
