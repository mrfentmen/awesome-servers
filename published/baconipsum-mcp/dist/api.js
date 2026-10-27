const BASE = 'https://baconipsum.com/api/';
export async function generate(args) {
    const type = (args?.type ?? 'meat-and-filler').trim();
    const sentences = Math.min(Math.max(Number(args?.sentences ?? 3) || 3, 1), 10);
    const url = `${BASE}?type=${encodeURIComponent(type)}&sentences=${sentences}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-baconipsum-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bacon Ipsum returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        return 'No text returned.';
    return d.join(' ');
}
// ---- muxA tools:
// The existing tool returns one joined blob of sentences. This returns the real
// paragraph blocks the API can produce, in JSON, HTML or plain text, and refuses
// a type the API would silently ignore.
const TYPES = ['meat-and-filler', 'all-meat'];
