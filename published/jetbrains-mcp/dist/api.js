/**
 * JetBrains Marketplace API client, keyless.
 * Search is public; plugin pages are public.
 */
const BASE = "https://plugins.jetbrains.com/api";
export class JetBrainsError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "mrfentmen-jetbrains-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new JetBrainsError("Not found on JetBrains Marketplace.");
    if (!res.ok)
        throw new JetBrainsError(`Marketplace error ${res.status}`);
    return (await res.json());
}
/** Sort orders the Marketplace search accepts. */
export const MARKETPLACE_ORDERS = ['relevance', 'downloads', 'rating', 'name', 'updated'];
export async function searchPlugins(query, limit = 5, orderBy = 'relevance') {
    const order = MARKETPLACE_ORDERS.includes(orderBy) ? orderBy : 'relevance';
    const data = await getJson(`/searchPlugins?search=${encodeURIComponent(query)}&orderBy=${order}&max=${limit}`);
    const rows = Array.isArray(data.plugins) ? data.plugins : [];
    return rows.slice(0, limit).map((p) => ({
        id: Number(p.id),
        xmlId: String(p.xmlId ?? p.id),
        name: String(p.name ?? "?"),
        preview: p.preview ? String(p.preview).replace(/<[^>]+>/g, "").slice(0, 140) : undefined,
        downloads: typeof p.downloads === "number" ? p.downloads : undefined,
        rating: typeof p.rating === "number" ? Math.round(p.rating * 10) / 10 : undefined,
    }));
}
/** Top of the Marketplace charts: an empty search ordered by downloads or rating. */
export async function topPlugins(orderBy, limit = 10) {
    return searchPlugins('', limit, orderBy);
}
/** Recent releases of one plugin, newest first. */
export async function pluginVersions(id, limit = 5) {
    const clean = id.trim();
    if (!/^\d+$/.test(clean))
        throw new JetBrainsError(`Plugin id must be numeric, got "${id}". Search first.`);
    const size = Math.min(Math.max(limit, 1), 20);
    const rows = await getJson(`/plugins/${clean}/updates?size=${size}`);
    const list = Array.isArray(rows) ? rows : [];
    return list.slice(0, size).map((r) => ({
        version: String(r.version ?? '?'),
        date: r.cdate ? new Date(Number(r.cdate)).toISOString().slice(0, 10) : undefined,
        link: r.link ? `https://plugins.jetbrains.com${r.link}` : undefined,
        downloads: typeof r.downloads === 'number' ? r.downloads : undefined,
    }));
}
export async function getPlugin(id) {
    const clean = id.trim();
    if (!/^\d+$/.test(clean))
        throw new JetBrainsError(`Plugin id must be numeric, got "${id}". Search first.`);
    const p = await getJson(`/plugins/${clean}`);
    return {
        id: Number(p.id ?? clean),
        xmlId: String(p.xmlId ?? clean),
        name: String(p.name ?? "?"),
        preview: p.preview ? String(p.preview).replace(/<[^>]+>/g, "").slice(0, 300) : undefined,
        downloads: typeof p.downloads === "number" ? p.downloads : undefined,
        rating: typeof p.rating === "number" ? Math.round(p.rating * 10) / 10 : undefined,
        vendor: p.vendor?.name ? String(p.vendor.name) : undefined,
        link: `https://plugins.jetbrains.com/plugin/${p.id ?? clean}`,
    };
}
export function formatHit(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const meta = [
        p.downloads !== undefined ? `${p.downloads.toLocaleString()} downloads` : "",
        p.rating !== undefined ? `${p.rating}★` : "",
    ].filter(Boolean).join(" · ");
    return `${prefix}[${p.id}] ${p.name}${meta ? ` (${meta})` : ""}${p.preview ? `\n   ${p.preview}` : ""}`;
}
/** Recent written reviews for one plugin, newest first. */
export async function pluginReviews(id, limit = 5) {
    const clean = id.trim();
    if (!/^\d+$/.test(clean))
        throw new JetBrainsError(`Plugin id must be numeric, got "${id}". Search first.`);
    const size = Math.min(Math.max(limit, 1), 20);
    const rows = await getJson(`/plugins/${clean}/comments?size=${size}`);
    const list = Array.isArray(rows) ? rows : [];
    return list.slice(0, size).map((r) => ({
        id: String(r.id ?? "?"),
        rating: typeof r.rating === "number" ? r.rating : undefined,
        date: r.cdate ? new Date(Number(r.cdate)).toISOString().slice(0, 10) : undefined,
        comment: String(r.comment ?? "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&#x27;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\n{2,}/g, "\n")
            .trim()
            .slice(0, 600),
    }));
}
/** Review score distribution: how many people gave each star rating. */
export async function pluginRatings(id) {
    const clean = id.trim();
    if (!/^\d+$/.test(clean))
        throw new JetBrainsError(`Plugin id must be numeric, got "${id}". Search first.`);
    const data = await getJson(`/plugins/${clean}/rating`);
    const rawVotes = (data.votes ?? {});
    const total = Object.values(rawVotes).reduce((sum, value) => sum + (Number(value) || 0), 0);
    const votes = [5, 4, 3, 2, 1].map((stars) => {
        const count = Number(rawVotes[stars] ?? rawVotes[String(stars)] ?? 0) || 0;
        return { stars, count, share: total ? Math.round((count / total) * 1000) / 10 : 0 };
    });
    return {
        total,
        meanRating: typeof data.meanRating === "number" ? Math.round(data.meanRating * 100) / 100 : undefined,
        votes,
    };
}
export function formatReview(review, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const stars = review.rating !== undefined ? `${review.rating}★` : "unrated";
    const when = review.date ? ` | ${review.date}` : "";
    return `${prefix}${stars}${when}\n   ${review.comment || "(no written comment)"}`;
}
export function formatRating(rating) {
    const lines = rating.votes.map((row) => `  ${row.stars}★: ${row.count} (${row.share}%)`);
    return [
        `Reviews: ${rating.total}${rating.meanRating !== undefined ? ` | average ${rating.meanRating}★` : ""}`,
        ...lines,
    ].join("\n");
}
export function formatPlugin(p) {
    const lines = [
        `[${p.id}] ${p.name} (${p.xmlId})`,
        p.vendor ? `Vendor: ${p.vendor}` : "",
        p.downloads !== undefined ? `Downloads: ${p.downloads.toLocaleString()}` : "",
        p.rating !== undefined ? `Rating: ${p.rating}★` : "",
        p.preview ? `${p.preview}` : "",
        p.link ? `${p.link}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- batch-4 tools: build-aware search and tag catalogue (2026-09-27) ----
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
function hitFromRaw(p) {
    return {
        id: Number(p.id),
        xmlId: String(p.xmlId ?? p.id),
        name: String(p.name ?? "?"),
        preview: p.preview ? String(p.preview).replace(/<[^>]+>/g, "").slice(0, 140) : undefined,
        downloads: typeof p.downloads === "number" ? p.downloads : undefined,
        rating: typeof p.rating === "number" ? Math.round(p.rating * 10) / 10 : undefined,
    };
}
/** Marketplace search restricted to plugins that install on a given IDE build. */
export async function searchByBuild(query, build, limit = 5, orderBy = "downloads") {
    const buildId = String(build ?? "").trim();
    if (!/^[A-Z]{1,4}-\d{3}\.\d+(\.\d+)?$/.test(buildId)) {
        throw new JetBrainsError(`"${build}" is not an IDE build. Use the format PRODUCT-VERSION, for example IC-241.18034.62 (IU- is IntelliJ Ultimate, PY- is PyCharm, WS- is WebStorm).`);
    }
    const order = MARKETPLACE_ORDERS.includes(orderBy) ? orderBy : "downloads";
    const size = Math.min(Math.max(Math.round(limit) || 5, 1), 20);
    const data = await getJson(`/searchPlugins?search=${encodeURIComponent(String(query ?? ""))}&max=${size}&orderBy=${order}&build=${encodeURIComponent(buildId)}`);
    const rows = Array.isArray(data.plugins) ? data.plugins : [];
    if (!rows.length)
        return `No plugin on build ${buildId} matches "${query}".`;
    return (`${rows.length} plugin(s) installable on ${buildId}, ordered by ${order}:\n\n` +
        rows.map((p, i) => formatHit(hitFromRaw(p), i)).join("\n\n"));
}
export async function listTags(limit = 80, family) {
    const raw = await getJson("/tags");
    const rows = (Array.isArray(raw) ? raw : [])
        .filter((t) => t && t.name)
        .map((t) => ({
        id: Number(t.id),
        name: String(t.name),
        searchable: t.searchable === true,
        privileged: t.privileged === true,
        families: Array.isArray(t.families) ? t.families.map(String) : [],
    }));
    const wanted = String(family ?? "").trim().toLowerCase();
    const filtered = wanted ? rows.filter((t) => (t.families ?? []).some((f) => f.toLowerCase() === wanted)) : rows;
    if (!filtered.length) {
        const families = [...new Set(rows.flatMap((t) => t.families ?? []))].sort();
        return `No tags for family "${family}". Known families: ${families.join(", ")}.`;
    }
    const n = Math.min(Math.max(Math.round(limit) || 80, 1), 300);
    const searchable = filtered.filter((t) => t.searchable).length;
    const byFamily = new Map();
    for (const t of filtered)
        for (const f of t.families ?? [])
            byFamily.set(f, (byFamily.get(f) ?? 0) + 1);
    return [
        `JetBrains Marketplace tags${wanted ? ` for family ${wanted}` : ""}: ${filtered.length} in total, ${searchable} searchable, showing ${Math.min(n, filtered.length)}`,
        "",
        ...filtered.slice(0, n).map((t) => `  ${String(t.id).padStart(4)}  ${t.name}${t.families?.length ? `  [${t.families.join(", ")}]` : ""}`),
        "",
        "Tags per family:",
        ...[...byFamily.entries()].sort((a, b) => b[1] - a[1]).map(([f, count]) => `  ${f.padEnd(12)} ${count}`),
    ].join("\n");
}
// ---- muxG tools:
const JETBRAINS_RELEASES = "https://data.services.jetbrains.com/products/releases";
const JETBRAINS_PRODUCTS = {
    IU: "IntelliJ IDEA Ultimate",
    IC: "IntelliJ IDEA Community",
    IIU: "IntelliJ IDEA (Ultimate build)",
    PS: "PhpStorm",
    PY: "PyCharm Professional",
    PC: "PyCharm Community",
    WS: "WebStorm",
    RD: "Rider",
    GO: "GoLand",
    CL: "CLion",
    DB: "DataGrip",
    AI: "Android Studio",
    GR: "IntelliJ IDEA (new unified build)",
    RR: "Rider for Rust",
    TJ: "Toolbox",
    DS: "Datagrip",
    AIU: "Android Studio (new build)",
};
const bytes = (value) => {
    const size = Number(value);
    if (!Number.isFinite(size) || size <= 0)
        return "size not reported";
    if (size >= 1e9)
        return `${(size / 1e9).toFixed(2)} GB`;
    if (size >= 1e6)
        return `${(size / 1e6).toFixed(1)} MB`;
    return `${(size / 1e3).toFixed(0)} KB`;
};
async function jetbrainsReleases(code, latest) {
    const params = new URLSearchParams({ code, type: "release" });
    if (latest)
        params.set("latest", "true");
    const res = await fetch(`${JETBRAINS_RELEASES}?${params.toString()}`, {
        headers: { "User-Agent": "mrfentmen-jetbrains-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new JetBrainsError(`JetBrains release service returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new JetBrainsError("The JetBrains release service returned an empty body.");
    const data = JSON.parse(text);
    const list = Object.values(data)[0];
    if (!Array.isArray(list) || !list.length)
        throw new JetBrainsError(`The release service has no entry for ${code}.`);
    return { code, releases: list };
}
/** The current release of a JetBrains product, with the exact build number to paste into search_by_build. */
export async function productRelease(args) {
    const raw = String(args?.product ?? "").trim().toUpperCase().replace(/[\s-]/g, "");
    if (!/^[A-Z]{2,4}$/.test(raw))
        throw new JetBrainsError(`"${args.product}" is not a product code. Try IU, PY, WS or RS.`);
    const { code, releases } = await jetbrainsReleases(raw, true);
    const latest = releases[0];
    const lines = [
        `${JETBRAINS_PRODUCTS[code] ?? code} (${code}) - ${latest.printableReleaseType ?? "release"} ${latest.version ?? "version not reported"}`,
        `Released ${latest.date ?? "date not reported"} · build number ${latest.build ?? "not reported"}${latest.majorVersion ? ` · major version ${latest.majorVersion}` : ""}`,
        `Licence required: ${latest.licenseRequired === true ? "yes" : latest.licenseRequired === false ? "no" : "not reported"}`,
    ];
    if (latest.patches?.length) {
        lines.push(`Patches in this release: ${latest.patches.map((p) => `${p.version ?? "?"} (${p.date ?? "date not reported"})`).join(", ")}`);
    }
    if (latest.notesLink)
        lines.push(`Release notes: ${latest.notesLink}`);
    if (latest.build)
        lines.push(`Use build ${latest.build} with search_by_build to find plugins that install on it.`);
    const downloads = latest.downloads ?? {};
    const wanted = ["windows", "mac", "macM1", "linux", "linuxARM64"];
    const rows = wanted.filter((platform) => downloads[platform]?.link);
    if (rows.length) {
        lines.push("");
        lines.push("Downloads published with this release:");
        for (const platform of rows.slice(0, 6)) {
            lines.push(`  ${platform.padEnd(10)} ${bytes(downloads[platform].size)}  ${String(downloads[platform].link).slice(0, 110)}`);
        }
        if (rows.length > 6)
            lines.push(`  ...and ${rows.length - 6} more platform(s).`);
    }
    return lines.join("\n");
}
/** Which IDE builds each release of a plugin is compatible with, which the version list never shows. */
export async function pluginCompatibility(args) {
    const id = String(args?.id ?? "").trim();
    if (!/^\d+$/.test(id))
        throw new JetBrainsError(`Plugin id must be numeric, got "${args.id}". Search first.`);
    const size = Math.min(Math.max(Math.round(Number(args.limit ?? 6) || 6), 1), 20);
    const res = await fetch(`https://plugins.jetbrains.com/api/plugins/${id}/updates?size=${size}`, {
        headers: { "User-Agent": "mrfentmen-jetbrains-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new JetBrainsError(`No plugin with id ${id} on the Marketplace.`);
    if (!res.ok)
        throw new JetBrainsError(`Marketplace returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new JetBrainsError("The Marketplace returned an empty update list.");
    const rows = JSON.parse(text);
    if (!Array.isArray(rows) || !rows.length)
        throw new JetBrainsError(`Plugin ${id} has no published updates.`);
    const lines = [`Compatibility of the last ${rows.length} release(s) of plugin ${id}:`];
    for (const [i, row] of rows.entries()) {
        const published = typeof row.cdate === "number" ? new Date(row.cdate).toISOString().slice(0, 10) : "date not reported";
        const flags = [row.channel ? `channel ${row.channel}` : "", row.approve === false ? "not approved" : "", row.listed === false ? "unlisted" : "", row.hidden === true ? "hidden" : ""].filter(Boolean).join(", ");
        lines.push(`  ${i + 1}. ${row.version ?? "version not reported"} · published ${published}${row.downloads ? ` · ${row.downloads} download(s)` : ""}${flags ? ` · ${flags}` : ""}`);
        lines.push(`     compatible since ${row.since ?? "not reported"}${row.until ? ` until ${row.until}` : ""}${row.compatibleVersions?.length ? ` · declares ${row.compatibleVersions.join(", ")}` : ""}`);
        if (row.file)
            lines.push(`     artifact ${String(row.file).slice(0, 90)} · ${bytes(row.size)}`);
    }
    lines.push("");
    lines.push("A since/until range is the IDE build range the plugin declares; it is not a guarantee that it runs on every build in that range.");
    return lines.join("\n");
}
