const BASE = 'https://api.discogs.com';
const UA = 'mrfentmen-discogs-mcp/1.0 +https://github.com/mrfentmen/discogs-mcp';
export async function search(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide search terms.';
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 25);
    const res = await fetch(`${BASE}/database/search?q=${encodeURIComponent(query)}&per_page=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Discogs returned ${res.status}`);
    const d = (await res.json());
    const results = d.results ?? [];
    if (!results.length)
        return `No Discogs results for "${query}".`;
    return `Discogs results for "${query}":\n` +
        results.slice(0, limit).map((r, i) => `${i + 1}. [${r.type ?? '?'}] ${r.title ?? '?'} (${r.year ?? '?'}) id=${r.id ?? '?'}`).join('\n');
}
export async function release(args) {
    const id = Number(args.id);
    if (!Number.isFinite(id) || id <= 0)
        return 'Provide a release id.';
    const res = await fetch(`${BASE}/releases/${id}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Discogs returned ${res.status}`);
    const d = (await res.json());
    return [
        `Discogs release #${id}`,
        `Title: ${d.title ?? '?'}`,
        `Artist: ${(d.artists ?? []).map((a) => a.name ?? '?').join(', ') || '?'}`,
        `Year: ${d.year ?? '?'} | Country: ${d.country ?? '?'}`,
        d.genres?.length ? `Genres: ${d.genres.join(', ')}` : null,
        d.styles?.length ? `Styles: ${d.styles.join(', ')}` : null,
        d.labels?.length ? `Label: ${(d.labels[0] ?? {}).name ?? '?'}` : null,
        (d.tracklist ?? []).length ? `Tracks:\n${(d.tracklist ?? []).slice(0, 20).map((t) => `  ${t.position ?? '?'}. ${t.title ?? '?'} ${t.duration ?? ''}`).join('\n')}` : null,
    ].filter(Boolean).join('\n');
}
// ---- muxE tools:
// The two existing tools search releases and read one release. The new tools go
// to the two Discogs entities behind a release that nothing here reads: the
// artist, with their catalogue and their aliases, and the master release, which
// is the record that says how many pressings of one album exist and where.
const DISCOGS = "https://api.discogs.com";
const DISCOGS_UA = "mrfentmen-discogs-mcp/1.0 +https://github.com/mrfentmen/discogs-mcp";
async function discogsGet(path, notFound) {
    const res = await fetch(`${DISCOGS}${path}`, {
        headers: { "User-Agent": DISCOGS_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error(notFound);
    if (res.status === 429)
        throw new Error("Discogs rate limit hit, wait a moment and retry.");
    if (res.status === 401)
        throw new Error("Discogs refused the request; that route needs a personal access token.");
    if (!res.ok)
        throw new Error(`Discogs returned ${res.status}`);
    const raw = await res.text();
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        throw new Error("Discogs returned a body that is not JSON.");
    }
    if (typeof parsed?.message === "string")
        throw new Error(`Discogs said: ${parsed.message}`);
    return parsed;
}
const show = (v) => (v === undefined || v === null || v === "" ? "not reported" : String(v));
const nameOf = (v) => {
    if (typeof v === "string")
        return v;
    if (v && typeof v === "object" && "name" in v)
        return String(v.name);
    return "";
};
export async function masterRelease(args) {
    const id = Math.floor(Number(args?.master_id));
    if (!Number.isInteger(id) || id <= 0)
        throw new Error("Provide the Discogs master release id as a whole number, for example 1660109.");
    const limit = Math.max(1, Math.min(Math.floor(Number(args?.limit ?? 20) || 20), 100));
    const master = await discogsGet(`/masters/${id}`, `Discogs has no master release with id ${id}.`);
    const title = show(master.title);
    const artists = Array.isArray(master.artists) ? master.artists.map(nameOf).filter(Boolean) : [];
    const versions = await discogsGet(`/masters/${id}/versions?per_page=${limit}`, `Discogs listed no versions for master ${id}.`);
    const rows = Array.isArray(versions.versions) ? versions.versions : [];
    const totalVersions = typeof versions.pagination?.items === "number" ? versions.pagination.items : rows.length;
    const countries = new Map();
    const labels = new Map();
    const formats = new Map();
    for (const v of rows) {
        const country = String(v.country ?? "not reported");
        countries.set(country, (countries.get(country) ?? 0) + 1);
        const label = String(v.label ?? "not reported");
        labels.set(label, (labels.get(label) ?? 0) + 1);
        const format = Array.isArray(v.format) ? v.format.map(String).join(" + ") : String(v.format ?? "not reported");
        formats.set(format, (formats.get(format) ?? 0) + 1);
    }
    const genres = Array.isArray(master.genres) ? master.genres.map(String) : [];
    const styles = Array.isArray(master.styles) ? master.styles.map(String) : [];
    const tracklist = Array.isArray(master.tracklist) ? master.tracklist : [];
    const lines = [
        `Discogs master release ${id}: ${title}`,
        `  artist: ${artists.length ? artists.join(", ") : "not reported"}`,
        `  year: ${show(master.year)}`,
        `  genre: ${genres.length ? genres.join(", ") : "not reported"}, styles: ${styles.length ? styles.join(", ") : "not reported"}`,
        `  data quality: ${show(master.data_quality)}`,
        `  main release: ${show(master.main_release)}`,
        `  most recent pressing added: ${show(master.most_recent_release)}`,
        `  for sale now: ${show(master.num_for_sale)}, lowest price: ${show(master.lowest_price)}`,
        `  versions: ${totalVersions} in total, ${rows.length} read here${totalVersions > rows.length ? ", so the tallies below cover only this page" : ""}`,
    ];
    if (tracklist.length) {
        lines.push(`  tracklist on the master (${tracklist.length}):`);
        for (const t of tracklist.slice(0, 25)) {
            lines.push(`    ${t.position ?? ""} ${t.title ?? "untitled"}${t.duration ? ` (${t.duration})` : ""}`);
        }
        if (tracklist.length > 25)
            lines.push(`    and ${tracklist.length - 25} more track(s)`);
    }
    if (!rows.length) {
        lines.push("  Discogs listed no individual pressings for this master.");
        return lines.join("\n");
    }
    lines.push(`  countries pressed in on this page: ${[...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} (${v})`).join(", ")}`);
    lines.push(`  labels on this page: ${[...labels.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} (${v})`).join(", ")}`);
    lines.push(`  formats on this page: ${[...formats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} (${v})`).join(", ")}`);
    lines.push(`  the ${Math.min(20, rows.length)} pressings, with their catalogue numbers:`);
    for (const v of rows.slice(0, 20)) {
        lines.push(`    release ${v.id ?? "?"} - ${v.country ?? "country not reported"}, ${v.released ?? "date not reported"}, ${Array.isArray(v.format) ? v.format.map(String).join(" + ") : "format not reported"}`);
        lines.push(`      ${v.label ?? "label not reported"} ${v.catno ?? "no catalogue number"}${v.title ? ` - ${v.title}` : ""}${v.status ? `, status ${v.status}` : ""}`);
    }
    if (rows.length > 20)
        lines.push(`    and ${rows.length - 20} more pressing(s) on this page`);
    lines.push("  a master groups every pressing of one recording, which is a different record from any single release and cannot be reached from the release id alone.");
    return lines.join("\n");
}
