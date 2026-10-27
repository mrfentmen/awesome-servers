/**
 * Open VSX Registry API client, keyless.
 * Docs: https://github.com/eclipse-openvsx/openvsx/wiki/Registry-API
 */
const BASE = "https://open-vsx.org/api";
export class OpenVsxError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "open-vsx-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new OpenVsxError("No such extension. Namespace and name are case-sensitive on Open VSX.");
    if (!res.ok)
        throw new OpenVsxError(`Open VSX error ${res.status}`);
    return (await res.json());
}
export async function searchExtensions(query, limit = 5) {
    const data = await getJson(`/-/search?query=${encodeURIComponent(query)}&size=${Math.min(Math.max(limit, 1), 50)}&sortOrder=desc&sortBy=relevance`);
    const rows = Array.isArray(data.extensions) ? data.extensions : [];
    return rows.slice(0, limit).map((e) => ({
        namespace: String(e.namespace ?? "?"),
        name: String(e.name ?? "?"),
        description: e.description,
        downloads: e.downloadCount,
    }));
}
export async function getExtension(namespace, name) {
    const e = await getJson(`/${encodeURIComponent(namespace.trim())}/${encodeURIComponent(name.trim())}`);
    const files = e.files ?? {};
    const all = e.allVersions ?? {};
    return {
        namespace: String(e.namespace ?? namespace),
        name: String(e.name ?? name),
        description: e.description,
        downloads: e.downloadCount,
        version: e.version,
        license: e.license,
        homepage: e.homepage,
        repository: e.repository,
        versions: Object.keys(all).filter((v) => !["latest", "pre-release"].includes(v)).slice(0, 8),
        page: `https://open-vsx.org/extension/${namespace.trim()}/${name.trim()}`,
    };
}
export function formatHit(e, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}${e.namespace}.${e.name}${e.downloads !== undefined ? ` (${e.downloads.toLocaleString()} downloads)` : ""}${e.description ? `\n   ${e.description.slice(0, 140)}` : ""}`;
}
export function formatExtension(e) {
    const lines = [
        `${e.namespace}.${e.name}${e.version ? ` ${e.version}` : ""}`,
        e.description ? `${e.description}` : "",
        e.downloads !== undefined ? `Downloads: ${e.downloads.toLocaleString()}` : "",
        e.license ? `License: ${e.license}` : "",
        e.homepage ? `Home: ${e.homepage}` : "",
        e.repository ? `Repo: ${e.repository}` : "",
        e.versions.length ? `Recent versions: ${e.versions.join(", ")}` : "",
        e.page ? `Page: ${e.page}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxC tools:
const VSX_UA = "mrfentmen-open-vsx-mcp/1.0 (https://github.com/mrfentmen)";
async function vsx(path, ms = 25000) {
    const res = await fetch(`https://open-vsx.org/api${path}`, { headers: { "User-Agent": VSX_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
    if (res.status === 404)
        throw new OpenVsxError("open-vsx.org has no such extension");
    if (!res.ok)
        throw new OpenVsxError(`open-vsx.org returned ${res.status}`);
    return await res.json();
}
function rows(d) {
    return d?.extensions ?? d?.results ?? [];
}
