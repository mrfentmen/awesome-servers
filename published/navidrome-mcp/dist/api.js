/**
 * Navidrome (Subsonic API) client. Points at any instance via NAVIDROME_URL
 * (default http://localhost:4533). Auth with NAVIDROME_USER + NAVIDROME_PASSWORD
 * (converted to Subsonic token+salt, never sent in clear).
 * Docs: https://www.navidrome.org/docs/usage/subsonic/
 */
import { createHash, randomBytes } from "node:crypto";
const BASE = (process.env.NAVIDROME_URL ?? "http://localhost:4533").replace(/\/+$/, "");
const CLIENT = "navidrome-mcp";
const API_VERSION = "1.16.1";
export class NavidromeError extends Error {
}
function authParams() {
    const user = process.env.NAVIDROME_USER;
    const pass = process.env.NAVIDROME_PASSWORD;
    if (!user || !pass)
        throw new NavidromeError("Set NAVIDROME_USER and NAVIDROME_PASSWORD.");
    const salt = randomBytes(8).toString("hex");
    const token = createHash("md5").update(pass + salt).digest("hex");
    return new URLSearchParams({ u: user, t: token, s: salt, v: API_VERSION, c: CLIENT, f: "json" });
}
async function subsonic(endpoint, extra = {}) {
    const qs = authParams();
    for (const [k, v] of Object.entries(extra))
        qs.set(k, v);
    let res;
    try {
        res = await fetch(`${BASE}/rest/${endpoint}?${qs}`, {
            headers: { "User-Agent": CLIENT, Accept: "application/json" },
            signal: AbortSignal.timeout(20000),
        });
    }
    catch {
        throw new NavidromeError(`Navidrome at ${BASE} is unreachable. Set NAVIDROME_URL.`);
    }
    if (res.status === 401 || res.status === 403)
        throw new NavidromeError("Navidrome refused (401/403). Check user/password.");
    if (!res.ok)
        throw new NavidromeError(`Navidrome error ${res.status}`);
    const data = (await res.json());
    const inner = data["subsonic-response"] ?? {};
    if (inner.status !== "ok") {
        const err = (inner.error ?? {});
        throw new NavidromeError(`Navidrome: ${err.message ?? "request failed"}`);
    }
    return inner;
}
export async function ping() {
    await subsonic("ping.view");
    return `Navidrome at ${BASE} answers.`;
}
export async function listArtists() {
    const data = await subsonic("getIndexes.view", {});
    const groups = Array.isArray(data.indexes?.index) ? data.indexes.index : [];
    const out = [];
    for (const g of groups) {
        const arts = Array.isArray(g.artist) ? g.artist : [];
        for (const a of arts.slice(0, 100)) {
            out.push({ id: String(a.id), name: String(a.name ?? "?"), albumCount: Number(a.albumCount ?? 0) });
            if (out.length >= 50)
                return out;
        }
    }
    return out;
}
export async function searchLibrary(query, limit = 10) {
    if (!query.trim())
        throw new NavidromeError("Query is empty.");
    const data = await subsonic("search3.view", { query: query.trim(), artistCount: String(limit), albumCount: String(limit), songCount: "0" });
    const res = data.searchResult3 ?? {};
    const artists = Array.isArray(res.artist) ? res.artist : [];
    const albums = Array.isArray(res.album) ? res.album : [];
    return {
        artists: artists.slice(0, limit).map((a) => ({ id: String(a.id), name: String(a.name ?? "?") })),
        albums: albums.slice(0, limit).map((a) => ({
            id: String(a.id),
            name: String(a.name ?? a.title ?? "?"),
            artist: a.artist,
            year: a.year,
            songs: a.songCount,
        })),
    };
}
export function streamUrl(songId) {
    const qs = authParams();
    return `${BASE}/rest/stream.view?id=${encodeURIComponent(songId)}&${qs}`;
}
export function formatAlbum(a, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${a.id}] ${a.name}${a.artist ? ` — ${a.artist}` : ""}${a.year ? ` (${a.year})` : ""}${a.songs !== undefined ? ` [${a.songs} songs]` : ""}`;
}
