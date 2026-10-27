const BASE = 'https://random-word-api.herokuapp.com/word';
export async function word(args = {}) {
    const count = Math.max(1, Math.min(args.count ?? 1, 20));
    const res = await fetch(`${BASE}?number=${count}`, {
        headers: { 'User-Agent': 'mrfentmen-random-word-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Random Word API returned ${res.status}`);
    const data = (await res.json());
    if (!Array.isArray(data) || !data.length)
        throw new Error('Random Word API returned an empty response');
    return data.length === 1 ? data[0] : `Random words (${data.length}):\n` + data.map((w, i) => `${i + 1}. ${w}`).join('\n');
}
// ---- muxB tools:
const WIKTIONARY_API = 'https://en.wiktionary.org/w/api.php';
const rwField = (value, fallback = 'not reported') => value != null && String(value) !== '' ? String(value) : fallback;
