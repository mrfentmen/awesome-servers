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

const PARAGRAPH_TYPES = ['meat-and-filler', 'all-meat'];
const PARAGRAPH_FORMATS = ['json', 'html', 'text'];
export async function paragraphs(args = {}) {
    const paras = Math.min(Math.max(Number(args?.paras ?? 3) || 3, 1), 10);
    const type = String(args?.type ?? 'meat-and-filler').trim().toLowerCase();
    if (!PARAGRAPH_TYPES.includes(type))
        throw new Error(`Unknown type "${args?.type}". Use meat-and-filler or all-meat.`);
    const format = String(args?.format ?? 'json').trim().toLowerCase();
    if (!PARAGRAPH_FORMATS.includes(format))
        throw new Error(`Unknown format "${args?.format}". Use json, html or text.`);
    const qs = new URLSearchParams({ type, paras: String(paras), format });
    if (args?.startWithLorem)
        qs.set('start-with-lorem', '1');
    const res = await fetch(`${BASE}?${qs}`, {
        headers: { 'User-Agent': 'mrfentmen-baconipsum-mcp/1.0', Accept: 'text/plain, application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bacon Ipsum returned ${res.status}`);
    const body = await res.text();
    if (format === 'json') {
        let blocks;
        try {
            blocks = JSON.parse(body);
        }
        catch {
            throw new Error('Bacon Ipsum returned unreadable JSON');
        }
        if (!Array.isArray(blocks) || !blocks.length)
            throw new Error('Bacon Ipsum returned no paragraphs');
        return blocks.map((b, i) => `${i + 1}. ${String(b).trim()}`).join('\n\n');
    }
    const trimmed = body.trim();
    if (!trimmed)
        throw new Error('Bacon Ipsum returned no paragraphs');
    return trimmed;
}
