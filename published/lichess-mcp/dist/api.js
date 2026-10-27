/**
 * Lichess client — keyless public API.
 * Docs: https://lichess.org/api — be polite: ~1 request / 2s.
 */
const BASE = "https://lichess.org/api";
export class LichessError extends Error {
}
let lastRequest = 0;
async function getJson(path) {
    const now = Date.now();
    const gap = 1100 - (now - lastRequest);
    if (gap > 0)
        await new Promise((r) => setTimeout(r, gap));
    lastRequest = Date.now();
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "lichess-mcp/1.0" },
    });
    if (!res.ok)
        throw new LichessError(`Lichess error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function getDailyPuzzle() {
    const d = await getJson("/puzzle/daily");
    if (!d?.puzzle)
        return null;
    return mapPuzzle(d.puzzle, d.game?.url);
}
export async function getPuzzleById(id) {
    const d = await getJson(`/puzzle/${encodeURIComponent(id)}`);
    return d?.puzzle ? mapPuzzle(d.puzzle, d.game?.url) : null;
}
export async function getPlayer(username) {
    try {
        const u = await getJson(`/user/${encodeURIComponent(username)}`);
        if (!u?.username)
            return null;
        return {
            username: u.username,
            title: u.title,
            perfs: u.perfs,
            createdAt: u.createdAt,
            seenAt: u.seenAt,
            count: u.count,
        };
    }
    catch (e) {
        if (e instanceof LichessError && String(e).includes("404"))
            return null;
        throw e;
    }
}
export async function getTopPlayers(perf, limit = 10) {
    // Docs: GET /api/player/top/{nb}/{perfType}
    const d = await getJson(`/player/top/${limit}/${encodeURIComponent(perf)}`);
    return (d.users ?? []).map((u) => ({
        username: u.username ?? "?",
        title: u.title,
        rating: u.perfs?.[perf]?.rating,
    }));
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
function mapPuzzle(p, gameUrl) {
    // /api/puzzle/daily returns moves as `solution` (array); /api/puzzle/{id}
    // returns them as `moves` (space-separated string). Handle both.
    const raw = p.solution ?? p.moves ?? "";
    const moves = Array.isArray(raw) ? raw : String(raw).split(" ").filter(Boolean);
    return {
        id: p.id ?? "?",
        fen: p.fen ?? "",
        moves,
        rating: p.rating ?? 0,
        ratingDeviation: p.ratingDeviation,
        popularity: p.popularity,
        themes: p.themes,
        gameUrl,
    };
}
/** UCI move list → readable SAN-ish hint list (pairs are white/black). */
export function formatPuzzle(p) {
    const lines = [
        `Puzzle ${p.id} — rated ${p.rating}${p.themes?.length ? ` · themes: ${p.themes.join(", ")}` : ""}`,
        `FEN: ${p.fen}`,
        `Solution: ${p.moves.join(" ")}`,
        p.gameUrl ?? "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatPlayer(u) {
    const perfs = u.perfs ?? {};
    const best = Object.entries(perfs)
        .filter(([, v]) => v?.rating)
        .sort((a, b) => (b[1]?.rating ?? 0) - (a[1]?.rating ?? 0))[0];
    const bestLine = best
        ? `Best rating: ${best[0]} ${best[1]?.rating}${best[1]?.prog ? ` (${best[1].prog >= 0 ? "+" : ""}${best[1].prog}/month)` : ""}`
        : "";
    const lines = [
        `${u.username}${u.title ? ` (${u.title})` : ""}`,
        bestLine,
        u.createdAt ? `On Lichess since ${new Date(u.createdAt).toISOString().slice(0, 10)}` : "",
        u.count?.all ? `${u.count.all.toLocaleString()} games played` : "",
        `https://lichess.org/@/${u.username}`,
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxC tools:
