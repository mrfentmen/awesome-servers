const BASE = 'https://api.biorxiv.org/details/biorxiv';
export async function details(args) {
    const doi = (args.doi ?? '').trim();
    if (!doi)
        return 'Provide a bioRxiv DOI.';
    const res = await fetch(`${BASE}/${encodeURIComponent(doi)}`, {
        headers: { 'User-Agent': 'mrfentmen-biorxiv-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`bioRxiv returned ${res.status}`);
    const d = (await res.json());
    const rows = d.collection ?? [];
    if (!rows.length)
        return `No bioRxiv record for ${doi}.`;
    const r = rows[0];
    const s = (k) => (r[k] != null ? String(r[k]) : '');
    return [
        s('title') || `bioRxiv ${doi}`,
        `Authors: ${s('authors').slice(0, 300)}`,
        `Posted: ${s('date')} | Version ${s('version')}`,
        `Category: ${s('category')}`,
    ].filter(Boolean).join('\n');
}
export async function recent(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}/0/0/0/${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-biorxiv-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`bioRxiv returned ${res.status}`);
    const d = (await res.json());
    const rows = d.collection ?? [];
    if (!rows.length)
        return 'No bioRxiv preprints returned.';
    return `Recent bioRxiv preprints (${rows.length} shown):\n` +
        rows.map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('title')} | ${s('date')} | ${s('doi')}`;
        }).join('\n');
}
// ---- muxA tools:
const BX = "https://api.biorxiv.org";
function one(value, max = 200) {
    if (value == null)
        return "not recorded";
    const s = String(value).replace(/\s+/g, " ").trim();
    if (!s)
        return "not recorded";
    return s.length > max ? `${s.slice(0, max)}...` : s;
}
async function bxGet(path) {
    const res = await fetch(`${BX}${path}`, {
        headers: { "User-Agent": "mrfentmen-biorxiv-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(`bioRxiv returned ${res.status}`);
    const d = (await res.json());
    return { collection: d.collection ?? [], messages: d.messages ?? [] };
}
export async function preprintVersions(args) {
    const doi = (args.doi ?? "").trim();
    if (!doi)
        throw new Error("Provide a bioRxiv DOI.");
    // The slash inside a DOI has to stay literal: percent encoding it returns 404.
    const { collection } = await bxGet(`/details/biorxiv/${doi}`);
    if (!collection.length)
        return `No bioRxiv record for ${doi}.`;
    // The details endpoint uses short field names while the pubs endpoint uses
    // preprint_ prefixed ones, so both shapes are accepted.
    const field = (row, short, long) => row[short] ?? row[long];
    const first = collection[0];
    return [
        `bioRxiv DOI ${doi} has ${collection.length} posted version(s).`,
        ...collection.map((p, i) => `  v${String(field(p, "version", "preprint_date") ? p.version ?? i + 1 : i + 1)}` +
            ` | posted ${String(field(p, "date", "preprint_date") ?? "?").slice(0, 10)}` +
            ` | ${field(p, "category", "preprint_category") ?? "?"}` +
            ` | ${field(p, "license", "preprint_abstract") ? `licence ${String(p.license ?? "not reported")}` : "licence not reported"}` +
            ` | ${p.published ? "published in a journal" : "not yet published"}`),
        "",
        `Title: ${one(field(first, "title", "preprint_title"), 300)}`,
        `Authors: ${one(field(first, "authors", "preprint_authors"), 400)}`,
        `Corresponding author: ${one(field(first, "author_corresponding", "preprint_author_corresponding"), 120)}` +
            `${field(first, "author_corresponding_institution", "preprint_author_corresponding_institution") ? ` (${String(field(first, "author_corresponding_institution", "preprint_author_corresponding_institution"))})` : ""}`,
        `Server ${first.server ?? "not reported"} | type ${first.type ?? "not reported"}` +
            `${first.jatsxml ? ` | JATS XML at ${String(first.jatsxml).slice(0, 90)}` : ""}`,
        `Abstract: ${one(field(first, "abstract", "preprint_abstract"), 800)}`,
    ].join("\n");
}
