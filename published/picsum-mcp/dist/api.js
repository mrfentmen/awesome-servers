/**
 * Picsum.photos API client, keyless.
 * Docs: https://picsum.photos/
 * Image URLs are deterministic: https://picsum.photos/id/{id}/{w}/{h}
 */
const BASE = "https://picsum.photos";
export class PicsumError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "picsum-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404)
        throw new PicsumError("No such photo.");
    if (!res.ok)
        throw new PicsumError(`Picsum error ${res.status}`);
    return (await res.json());
}
export async function listPhotos(page = 1, limit = 5) {
    const rows = await getJson(`/v2/list?page=${Math.max(page, 1)}&limit=${Math.min(Math.max(limit, 1), 100)}`);
    return rows.slice(0, limit).map(toPhoto);
}
export async function getPhoto(id) {
    const clean = id.trim();
    if (!/^\d+$/.test(clean))
        throw new PicsumError(`Photo id must be numeric, got "${id}".`);
    return toPhoto(await getJson(`/id/${clean}/info`));
}
function toPhoto(p) {
    return {
        id: String(p.id),
        author: String(p.author ?? "?"),
        width: typeof p.width === "number" ? p.width : undefined,
        height: typeof p.height === "number" ? p.height : undefined,
        page: p.url,
    };
}
export function photoUrl(id, width = 800, height = 600, grayscale = false, blur = 0) {
    const clean = id.trim();
    if (!/^\d+$/.test(clean))
        throw new PicsumError(`Photo id must be numeric, got "${id}".`);
    const w = Math.min(Math.max(width, 1), 5000);
    const h = Math.min(Math.max(height, 1), 5000);
    const q = new URLSearchParams();
    if (grayscale)
        q.set("grayscale", "");
    if (blur >= 1 && blur <= 10)
        q.set("blur", String(blur));
    const qs = q.toString() ? `?${q.toString()}` : "";
    return `https://picsum.photos/id/${clean}/${w}/${h}${qs}`;
}
export function formatPhoto(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const dims = p.width && p.height ? ` (${p.width}x${p.height})` : "";
    return `${prefix}[${p.id}] by ${p.author}${dims}${p.page ? `\n   ${p.page}` : ""}`;
}
// ---- muxC tools:
