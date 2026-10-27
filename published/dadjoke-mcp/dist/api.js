/**
 * icanhazdadjoke API client, keyless.
 * Docs: https://icanhazdadjoke.com/api
 */
const BASE = "https://icanhazdadjoke.com";
export class DadJokeError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "dadjoke-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404)
        throw new DadJokeError("No such joke.");
    if (!res.ok)
        throw new DadJokeError(`Dad joke error ${res.status}`);
    return (await res.json());
}
export async function randomJoke() {
    const j = await getJson("/");
    return { id: String(j.id), joke: String(j.joke) };
}
export async function searchJokes(term, limit = 5) {
    const data = await getJson(`/search?term=${encodeURIComponent(term)}&limit=${Math.min(Math.max(limit, 1), 30)}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, limit).map((r) => ({ id: String(r.id), joke: String(r.joke) }));
}
export async function getJoke(id) {
    const j = await getJson(`/j/${encodeURIComponent(id.trim())}`);
    return { id: String(j.id), joke: String(j.joke) };
}
