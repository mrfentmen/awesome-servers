const DAD_BASE = 'https://icanhazdadjoke.com';
const JOKEAPI_BASE = 'https://v2.jokeapi.dev/joke';
const UA = 'mrfentmen-jokes-mcp/1.0 (https://github.com/mrfentmen)';
export class JokesError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new JokesError('rate limit hit, wait and retry');
    if (!res.ok)
        throw new JokesError(`Jokes API error ${res.status}`);
    return (await res.json());
}
export async function dadJoke(_args = {}) {
    const d = await get(`${DAD_BASE}/`);
    if (!d.joke)
        throw new JokesError('No joke returned');
    return d.joke;
}
export async function searchDadJokes(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        throw new JokesError('Provide a search query');
    const limit = Math.min(args.limit ?? 8, 20);
    const d = await get(`${DAD_BASE}/search?term=${encodeURIComponent(q)}&limit=${limit}`);
    const results = d.results ?? [];
    if (!results.length)
        return `No dad jokes found for "${q}"`;
    return `Dad jokes matching "${q}" (${d.total_jokes ?? results.length} total):\n` +
        results.map((j, i) => `${i + 1}. ${j.joke}`).join('\n');
}
export async function joke(args) {
    const cat = (args.category ?? '').trim();
    const url = cat
        ? `${JOKEAPI_BASE}/${encodeURIComponent(cat)}?type=single`
        : `${JOKEAPI_BASE}/Any?type=single`;
    const d = await get(url);
    if (d.error)
        throw new JokesError(d.message ?? 'JokeAPI error');
    if (!d.joke)
        throw new JokesError('JokeAPI returned an empty joke');
    return d.joke;
}
export async function categories(_args = {}) {
    const d = await get('https://v2.jokeapi.dev/categories');
    const cats = d.categories ?? [];
    return cats.length ? `JokeAPI categories: ${cats.join(', ')}` : 'No categories returned';
}
