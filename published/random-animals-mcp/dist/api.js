const BASE = 'https://some-random-api.com/animal';
const TYPES = ['dog', 'cat', 'fox', 'bird', 'panda', 'koala', 'duck'];
export async function animal(args) {
    const type = (args.type ?? 'dog').trim().toLowerCase();
    if (!TYPES.includes(type))
        return `Pick one of: ${TYPES.join(', ')}.`;
    const res = await fetch(`${BASE}/${type}`, {
        headers: { 'User-Agent': 'mrfentmen-random-animals-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Some Random API returned ${res.status}`);
    const d = (await res.json());
    if (!d.image)
        return `No ${type} photo returned.`;
    return `Random ${type}: ${d.image}${d.fact ? `\nFact: ${d.fact}` : ''}`;
}
