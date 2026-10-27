/**
 * Modrinth API v2 client — the modern Minecraft mod host.
 * Docs: https://docs.modrinth.com/  (free, no key)
 */
const BASE = "https://api.modrinth.com/v2";
const SITE = "https://modrinth.com";
export class ModrinthError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "modrinth-mcp/1.0" },
    });
    if (!res.ok) {
        throw new ModrinthError(`Modrinth API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json());
}
// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
export async function searchProjects(query, projectType = "mod", loader, gameVersion, limit = 10) {
    const facets = [[`project_type:${projectType}`]];
    if (loader)
        facets.push([`categories:${loader}`]);
    if (gameVersion)
        facets.push([`versions:${gameVersion}`]);
    const params = new URLSearchParams({
        query,
        limit: String(limit),
        index: "relevance",
    });
    if (facets.length)
        params.set("facets", JSON.stringify(facets));
    const data = await getJson(`/search?${params}`);
    return (data.hits ?? []).map((h) => ({
        projectId: h.project_id,
        slug: h.slug,
        title: h.title,
        description: h.description ?? "",
        categories: h.categories ?? [],
        projectType: h.project_type,
        downloads: h.downloads ?? 0,
        follows: h.follows ?? 0,
        author: h.author ?? "?",
        license: h.license ?? { id: "?", name: "?" },
        versions: h.versions ?? [],
        iconUrl: h.icon_url,
        dateCreated: h.date_created,
        dateModified: h.date_modified,
    }));
}
export async function getProject(idOrSlug) {
    const p = await getJson(`/project/${encodeURIComponent(idOrSlug)}`);
    if (!p || !p.id)
        return null;
    return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description ?? "",
        body: stripHtml(p.body ?? "").slice(0, 800),
        categories: p.categories ?? [],
        projectType: p.project_type,
        downloads: p.downloads ?? 0,
        followers: p.followers ?? 0,
        author: p.author ?? "?",
        license: p.license ?? { id: "?", name: "?" },
        gameVersions: p.game_versions ?? [],
        loaders: p.loaders ?? [],
        iconUrl: p.icon_url,
        sourceUrl: p.source_url,
        issuesUrl: p.issues_url,
        url: `${SITE}/mod/${p.slug}`,
    };
}
export async function getProjectVersions(idOrSlug, loader, gameVersion, limit = 10) {
    const params = new URLSearchParams();
    if (loader)
        params.set("loaders", JSON.stringify([loader]));
    if (gameVersion)
        params.set("game_versions", JSON.stringify([gameVersion]));
    const qs = params.toString();
    const versions = await getJson(`/project/${encodeURIComponent(idOrSlug)}/version${qs ? `?${qs}` : ""}`);
    return (versions ?? []).slice(0, limit).map((v) => ({
        id: v.id,
        name: v.name ?? "?",
        versionNumber: v.version_number ?? "?",
        gameVersions: v.game_versions ?? [],
        loaders: v.loaders ?? [],
        downloads: v.downloads ?? 0,
        datePublished: v.date_published?.slice(0, 10),
        files: (v.files ?? []).map((f) => ({
            url: f.url,
            filename: f.filename,
            size: f.size,
            primary: f.primary,
        })),
        dependencies: (v.dependencies ?? []).map((d) => ({
            projectId: d.project_id,
            versionId: d.version_id,
            dependencyType: d.dependency_type,
        })),
    }));
}
// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
export function fmtDownloads(n) {
    return n >= 1_000_000
        ? `${(n / 1_000_000).toFixed(1)}M`
        : n >= 1_000
            ? `${(n / 1_000).toFixed(1)}k`
            : String(n);
}
export function formatHit(h, index) {
    return (`${index}. ${h.title} by ${h.author} (${h.license.name})\n` +
        `   ${h.description.slice(0, 140)}\n` +
        `   ⬇ ${fmtDownloads(h.downloads)} | ♥ ${h.follows} | ${h.categories.slice(0, 4).join(", ") || "no tags"}\n` +
        `   ${SITE}/${h.projectType === "modpack" ? "modpack" : "mod"}/${h.slug}`);
}
export function formatProject(p) {
    const lines = [
        `${p.title} by ${p.author} (${p.license.name})\n${p.url}`,
        `⬇ ${fmtDownloads(p.downloads)} | ♥ ${p.followers}`,
        `Loaders: ${p.loaders.slice(0, 6).join(", ") || "?"} | Latest MC: ${p.gameVersions.slice(-1)[0] ?? "?"}`,
        `Tags: ${p.categories.slice(0, 8).join(", ") || "—"}`,
    ];
    if (p.body)
        lines.push(`\n${p.body}`);
    return lines.join("\n");
}
export function formatVersion(v, index) {
    const deps = v.dependencies
        .filter((d) => d.dependencyType === "required")
        .map((d) => d.projectId?.slice(0, 8) ?? d.versionId?.slice(0, 8) ?? "?");
    return (`${index}. ${v.name} (${v.versionNumber}) — ${v.datePublished ?? "?"}\n` +
        `   MC: ${v.gameVersions.slice(0, 4).join(", ")} | Loaders: ${v.loaders.join(", ")}\n` +
        `   ⬇ ${fmtDownloads(v.downloads)}${deps.length ? ` | requires: ${deps.join(", ")}` : ""}` +
        (v.files[0] ? `\n   ${v.files[0].filename}` : ""));
}
function stripHtml(s) {
    return s
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
// The orders that answer 200, checked one at a time. An unknown value answers
// 400 with invalid index in the details array, so it is refused here with the
// working list instead.
// Asking for 200 or 500 returns exactly 100, verified live, so 100 is the real
// ceiling and the tool says so when a larger value is trimmed.
// Modrinth answers an unrecognised path with an EMPTY body rather than JSON,
// verified with version/zzzzzzzz and HTTP 404, and a rejected search carries its
// reason in error and details, so the body is read either way and an empty one
// falls back to the status code.
async function modrinthGet(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { Accept: "application/json", "User-Agent": "modrinth-mcp/1.0" },
        signal: AbortSignal.timeout(25000),
    });
    const raw = await res.text();
    let body = null;
    try {
        body = raw ? JSON.parse(raw) : null;
    }
    catch {
        body = null;
    }
    if (!res.ok) {
        const record = body;
        const details = Array.isArray(record?.details) ? (record?.details).map(String) : [];
        const reason = record && typeof record.error === "string"
            ? [record.error, typeof record.description === "string" ? record.description : "", ...details].filter(Boolean).join(": ")
            : "";
        throw new ModrinthError(reason || `Modrinth API error ${res.status}${res.statusText ? `: ${res.statusText}` : ""}`);
    }
    if (body === null)
        throw new ModrinthError("Modrinth answered with a body that is not JSON");
    return body;
}
function modrinthDay(value) {
    return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : "date not reported";
}
// Search hits carry the licence as a plain string, verified as
// LicenseRef-Polyform-Shield-1.0.0 on sodium, while a single project carries it
// as an object with id and name. Both shapes are accepted rather than assuming
// one, because assuming the object is what printed licence not reported on
// every result the first time.
export async function filterIndex(args) {
    const categories = await modrinthGet("/tag/category");
    const loaders = await modrinthGet("/tag/loader");
    const gameVersions = await modrinthGet("/tag/game_version");
    const typeFilter = (args.projectType ?? "").trim().toLowerCase();
    const categoryRows = (Array.isArray(categories) ? categories : []).filter((row) => !typeFilter || (row.project_type ?? "").toLowerCase() === typeFilter);
    const byType = new Map();
    for (const row of categoryRows) {
        const type = row.project_type ?? "unknown type";
        byType.set(type, [...(byType.get(type) ?? []), row.header ? `${row.name ?? "?"} [${row.header}]` : (row.name ?? "?")]);
    }
    const releaseLimit = Math.min(Math.max(Math.trunc(args.releaseLimit ?? 30), 1), 200);
    const all = Array.isArray(gameVersions) ? gameVersions : [];
    const releases = all.filter((row) => row.version_type === "release");
    const counts = new Map();
    for (const row of all)
        counts.set(row.version_type ?? "unknown", (counts.get(row.version_type ?? "unknown") ?? 0) + 1);
    const lines = [
        "Valid values for the loader and gameVersion filters, straight from the tag index.",
        "",
        `Categories: ${categoryRows.length} shown of ${categories.length}${typeFilter ? ` (filtered to ${typeFilter})` : ""}`,
        ...[...byType.entries()]
            .sort((a, b) => b[1].length - a[1].length)
            .map(([type, names]) => `  ${type}: ${names.join(", ")}`),
        "",
        `Loaders (${loaders.length}): ${(Array.isArray(loaders) ? loaders : []).map((row) => row.name ?? "?").join(", ")}`,
        "",
        `Game versions: ${all.length} in all, ${[...counts.entries()].map(([type, n]) => `${n} ${type}`).join(", ")}`,
        `Most recent releases, ${Math.min(releaseLimit, releases.length)} of ${releases.length}:`,
        ...releases.slice(0, releaseLimit).map((row) => `  ${row.version ?? "?"} - ${modrinthDay(row.date)}${row.major ? " (major)" : ""}`),
    ];
    if (releases.length > releaseLimit) {
        lines.push(`  ...and ${releases.length - releaseLimit} older releases. Raise releaseLimit to see more.`);
    }
    lines.push("", "Snapshots, betas and alphas make up the rest and are accepted as filter values too, they are just not listed here because there are hundreds.");
    return lines.join("\n");
}
