/**
 * Pinterest API v5 client. Requires PINTEREST_ACCESS_TOKEN.
 * Get one free at https://developers.pinterest.com/ (create an app).
 * Docs: https://developers.pinterest.com/docs/api/v5/
 */
const BASE = "https://api.pinterest.com/v5";
export class PinterestError extends Error {
}
function token() {
    const t = process.env.PINTEREST_ACCESS_TOKEN;
    if (!t)
        throw new PinterestError("Set PINTEREST_ACCESS_TOKEN first (free at developers.pinterest.com).");
    return t;
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "pinterest-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${token()}` },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new PinterestError("Pinterest rejected the token (401/403). Check PINTEREST_ACCESS_TOKEN.");
    if (res.status === 404)
        throw new PinterestError("Not found on Pinterest.");
    if (!res.ok)
        throw new PinterestError(`Pinterest error ${res.status}`);
    return (await res.json());
}
export async function myAccount() {
    const a = await getJson("/user_account");
    return { username: a.username, profileImage: a.profile_image, websiteUrl: a.website_url };
}
export async function listBoards(limit = 10) {
    const data = await getJson(`/boards?page_size=${Math.min(Math.max(limit, 1), 250)}`);
    const rows = Array.isArray(data.items) ? data.items : [];
    return rows.slice(0, limit).map(toBoard);
}
const toBoard = (b) => ({
    id: String(b.id),
    name: b.name,
    description: b.description,
    pinCount: typeof b.pin_count === "number" ? b.pin_count : undefined,
    url: `https://www.pinterest.com/${b.owner?.username ?? ""}/${b.id}/`.replace(/\/\//g, "/").replace("https:/", "https://"),
});
export async function getBoard(id) {
    return toBoard(await getJson(`/boards/${encodeURIComponent(id.trim())}`));
}
export async function boardPins(id, limit = 10) {
    const data = await getJson(`/boards/${encodeURIComponent(id.trim())}/pins?page_size=${Math.min(Math.max(limit, 1), 250)}`);
    const rows = Array.isArray(data.items) ? data.items : [];
    return rows.slice(0, limit).map(toPin);
}
export async function getPin(id) {
    return toPin(await getJson(`/pins/${encodeURIComponent(id.trim())}`));
}
const toPin = (p) => ({
    id: String(p.id),
    title: p.title,
    description: p.description,
    link: p.link,
    image: p.media?.images?.["600x"]?.url ?? p.image_large_url,
});
export function formatBoard(b, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${b.id}] ${b.name ?? "(unnamed)"}${b.pinCount !== undefined ? ` (${b.pinCount} pins)` : ""}${b.description ? `\n   ${b.description.slice(0, 140)}` : ""}`;
}
export function formatPin(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}[${p.id}] ${p.title ?? "(untitled)"}`,
        p.description ? `${p.description.slice(0, 160)}` : "",
        p.link ? `Link: ${p.link}` : "",
        p.image ? `Image: ${p.image}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxH tools:
// The tools above all need a Pinterest token and read one account. Openverse is
// a keyless index of openly licensed media, so these two find imagery that can
// legally be pinned, with the licence attached to every result.
const OPENVERSE = "https://api.openverse.org/v1";
const OPENVERSE_UA = "pinterest-mcp/1.1 (https://github.com/mrfentmen/pinterest-mcp)";
async function ovGet(path) {
    const res = await fetch(`${OPENVERSE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": OPENVERSE_UA },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 400)
        throw new PinterestError("Openverse rejected the query. Check the search terms and filters.");
    if (res.status === 404)
        throw new PinterestError(`Openverse has no endpoint for ${path}.`);
    if (!res.ok)
        throw new PinterestError(`Openverse API error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
const ovSize = (w, h) => typeof w === "number" && typeof h === "number" ? `${w}x${h}` : "dimensions not reported";
export async function findLicensedImages(args) {
    const q = String(args.query ?? "").trim();
    if (!q)
        throw new PinterestError("Give something to search for, e.g. 'mountain landscape'.");
    const limit = Math.min(Math.max(Math.trunc(Number(args.limit ?? 8)) || 8, 1), 20);
    const source = String(args.source ?? "").trim();
    const params = new URLSearchParams({ q, page_size: String(limit) });
    if (source)
        params.set("source", source);
    if (args.commercial_only === true)
        params.set("license_type", "commercial");
    const data = await ovGet(`/images/?${params.toString()}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    if (!rows.length)
        throw new PinterestError(`Openverse found no image for "${q}"${source ? ` on ${source}` : ""}${args.commercial_only === true ? " with a commercial licence" : ""}.`);
    const lines = [
        `Openly licensed images for "${q}" — ${rows.length} of ${data.result_count ?? rows.length} match(es)`,
        source || args.commercial_only === true
            ? `Filters: ${[source ? `source ${source}` : null, args.commercial_only === true ? "commercial use only" : null].filter(Boolean).join(", ")}`
            : "Filters: none",
        "",
    ];
    rows.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.title ?? "(untitled)"}${r.creator ? ` — by ${r.creator}` : ""}`);
        lines.push(`   Licence: ${r.license ?? "not reported"} ${r.license_version ?? ""}`.trimEnd());
        lines.push(`   Source: ${r.source ?? "not reported"} | ${ovSize(r.width, r.height)}`);
        if (r.foreign_landing_url)
            lines.push(`   Page: ${r.foreign_landing_url}`);
        if (r.url)
            lines.push(`   File: ${r.url}`);
    });
    lines.push("", "Every result carries its own licence: check the licence URL before publishing, and credit the creator as the licence requires.");
    return lines.join("\n");
}
export async function imageLicence(id) {
    const wanted = String(id ?? "").trim();
    if (!wanted)
        throw new PinterestError("Give an Openverse image id (a UUID).");
    const r = await ovGet(`/images/${encodeURIComponent(wanted)}/`);
    const licence = `${r.license ?? "not reported"} ${r.license_version ?? ""}`.trimEnd();
    const attribution = r.attribution || [r.title, r.creator, r.source, licence].filter(Boolean).join(" — ");
    return [
        `${r.title ?? "(untitled)"}${r.creator ? ` — by ${r.creator}` : ""}`,
        `Openverse id: ${r.id ?? wanted}`,
        "",
        `Licence: ${licence}`,
        r.license_url ? `Licence terms: ${r.license_url}` : "Licence terms: not reported",
        `Source: ${r.source ?? "not reported"}`,
        `Dimensions: ${ovSize(r.width, r.height)}`,
        r.foreign_landing_url ? `Source page: ${r.foreign_landing_url}` : "Source page: not reported",
        r.url ? `File: ${r.url}` : "File: not reported",
        r.creator_url ? `Creator: ${r.creator_url}` : "Creator: not reported",
        "",
        `Attribution: ${attribution}`,
        "",
        "Credit this line wherever the image is published; a licence that needs no credit still needs the terms checked.",
    ].join("\n");
}
const ovPixelCount = (r) => typeof r.width === "number" && typeof r.height === "number" ? r.width * r.height : 0;
/**
 * How the openly licensed image index is made up: which source holds how much,
 * which licences dominate, and the biggest images in the collection.
 */
export async function imageSources(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new PinterestError("Give a search term to profile, e.g. 'architecture'.");
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 20), 1), 50);
    const data = await ovGet(`/images/?q=${encodeURIComponent(q)}&page_size=${String(size)}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    if (!rows.length)
        throw new PinterestError(`Openverse found nothing for "${q}".`);
    const sources = new Map();
    const licences = new Map();
    for (const row of rows) {
        const name = row.source ?? "not reported";
        sources.set(name, (sources.get(name) ?? 0) + 1);
        const licence = row.license ?? "not reported";
        licences.set(licence, (licences.get(licence) ?? 0) + 1);
    }
    const ranked = [...sources.entries()].sort((a, b) => b[1] - a[1]);
    const biggest = [...rows].sort((a, b) => ovPixelCount(b) - ovPixelCount(a)).slice(0, 3);
    let catalogue = [];
    try {
        catalogue = await ovGet("/images/stats/");
    }
    catch {
        catalogue = [];
    }
    return [
        `Openverse image pool for "${q}"`,
        `  ${data.result_count ?? rows.length} index match(es); ${rows.length} sampled`,
        "",
        `Sources in the sample: ${ranked.map(([name, n]) => `${name} x${n}`).join(", ")}`,
        `Licences in the sample: ${[...licences.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => `${name} x${n}`).join(", ")}`,
        "",
        "Largest images in the sample:",
        ...biggest.map((r, i) => `  ${i + 1}. ${r.title ?? "(untitled)"} — ${ovSize(r.width, r.height)}, ${r.source ?? "source not reported"}`),
        "",
        catalogue.length ? "Whole index by source:" : "Whole index by source: not reported",
        ...catalogue
            .slice()
            .sort((a, b) => (b.media_count ?? 0) - (a.media_count ?? 0))
            .slice(0, 8)
            .map((c) => `  ${c.display_name ?? c.source_name ?? "unnamed"} — ${(c.media_count ?? 0).toLocaleString()} item(s)`),
        "Source: openverse.org aggregate index.",
    ].join("\n");
}
