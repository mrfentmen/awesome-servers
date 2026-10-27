/**
 * LibriVox client. Keyless. Public-domain audiobooks read by volunteers:
 * catalog search, per-book detail, chapter lists and download links.
 */
const BASE = "https://librivox.org/api/feed/audiobooks";
export class LibriVoxError extends Error {
}
async function get(params) {
    const url = new URL(BASE);
    for (const [k, v] of Object.entries({ ...params, format: "json" }))
        url.searchParams.set(k, v);
    const res = await fetch(url, {
        headers: { "User-Agent": "librivox-mcp/1.0 (awesome-servers)" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new LibriVoxError(`LibriVox error ${res.status}`);
    const body = (await res.json());
    if (body.error)
        throw new LibriVoxError(body.error);
    return body;
}
export function authorName(a) {
    return [a.first_name, a.last_name].filter(Boolean).join(" ");
}
export function bookLine(b) {
    const authors = (b.authors ?? []).map(authorName).join(", ") || "unknown author";
    return `#${b.id} ${b.title} — ${authors} (${b.num_sections ?? "?"} sections, ${b.totaltime ?? "?"})`;
}
export async function searchByTitle(title, limit) {
    return (await get({ title, limit: String(limit) })).books ?? [];
}
export async function searchByAuthor(author, limit) {
    return (await get({ author, limit: String(limit) })).books ?? [];
}
export async function detail(id) {
    return (await get({ id: String(id), extended: "1" })).books?.[0];
}
export async function browse(limit, offset) {
    return (await get({ limit: String(limit), offset: String(offset) })).books ?? [];
}
export function detailText(b) {
    const authors = (b.authors ?? [])
        .map((a) => `${authorName(a)}${a.dob ? ` (${a.dob}–${a.dod ?? ""})` : ""}`)
        .join(", ");
    return [
        `#${b.id} ${b.title}`,
        `author: ${authors || "unknown"}`,
        `language: ${b.language ?? "?"} | year: ${b.copyright_year ?? "?"}`,
        `sections: ${b.num_sections ?? "?"} | runtime: ${b.totaltime ?? "?"}`,
        "",
        (b.description ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 900),
    ].join("\n");
}
export function sectionsText(b, limit) {
    const rows = (b.sections ?? []).slice(0, limit);
    if (!rows.length)
        return "No chapters listed.";
    return rows
        .map((s) => `${s.section_number}. ${s.title} — ${s.playtime ?? "?"}s — ${(s.readers ?? [])
        .map((r) => r.display_name)
        .filter(Boolean)
        .join(", ")}\n   ${s.listen_url ?? ""}`)
        .join("\n");
}
export function linksText(b) {
    return [
        `catalog: ${b.url_librivox ?? "-"}`,
        `zip of all mp3s: ${b.url_zip_file ?? "-"}`,
        `podcast rss: ${b.url_rss ?? "-"}`,
        `text source: ${b.url_text_source ?? "-"}`,
        `internet archive: ${b.url_iarchive ?? "-"}`,
    ].join("\n");
}
