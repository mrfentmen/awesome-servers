/**
 * xkcd client. The webcomic API, keyless. Latest comic and any comic by
 * number, with the alt text that makes xkcd xkcd.
 */
const BASE = "https://xkcd.com";
export class XkcdError extends Error {
}
async function getComicJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "xkcd-mcp/1.0" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new XkcdError(`xkcd error ${res.status}`);
    return (await res.json());
}
export function latestComic() {
    return getComicJson("/info.0.json");
}
export function getComic(num) {
    return getComicJson(`/${num}/info.0.json`);
}
export function formatComic(c) {
    const date = c.year && c.month && c.day ? `${c.year}-${c.month}-${c.day}` : "unknown date";
    const lines = [
        `[${c.num ?? "?"}] ${c.safe_title ?? c.title ?? "(untitled)"} (${date})`,
        c.alt ? `Alt text: ${c.alt}` : "",
        c.img ? `Image: ${c.img}` : "",
        c.transcript ? `Transcript: ${c.transcript.slice(0, 600)}${c.transcript.length > 600 ? "..." : ""}` : "",
        c.news ? `News: ${c.news.slice(0, 200)}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
