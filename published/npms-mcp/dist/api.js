/**
 * npms.io API client, keyless.
 * Docs: https://api-docs.npms.io/
 * Scores package quality/popularity/maintenance — use before adding a dependency.
 */
const BASE = "https://api.npms.io/v2";
export class NpmsError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "npms-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new NpmsError("No such package on npms.io.");
    if (!res.ok)
        throw new NpmsError(`npms.io error ${res.status}`);
    return (await res.json());
}
function scored(name, collected, score) {
    const d = (score.detail ?? {});
    const links = (collected.links ?? {});
    const meta = (collected.metadata ?? {});
    const common = (collected.common ?? {});
    return {
        name,
        version: meta.version || common?.tags?.latest,
        description: collected.description,
        final: score.final,
        quality: d.quality,
        popularity: d.popularity,
        maintenance: d.maintenance,
        links: links.repository || links.homepage || links.npm,
    };
}
export async function searchPackages(query, limit = 5) {
    const data = await getJson(`/search?q=${encodeURIComponent(query)}&size=${Math.min(Math.max(limit, 1), 25)}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, limit).map((r) => scored(String(r.package?.name ?? "?"), r.package ?? {}, r.score ?? {}));
}
export async function getPackage(name) {
    const data = await getJson(`/package/${encodeURIComponent(name.trim())}`);
    return scored(String(data.collected?.name ?? name), data.collected ?? {}, data.score ?? {});
}
const pct = (n) => (n === undefined ? "?" : `${Math.round(n * 100)}%`);
export function formatScored(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}${p.name}${p.version ? ` ${p.version}` : ""} — score ${pct(p.final)} (quality ${pct(p.quality)} / popularity ${pct(p.popularity)} / maintenance ${pct(p.maintenance)})`,
        p.description ? `${p.description}` : "",
        p.links ? `${p.links}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
async function npmsPackage(name) {
    const clean = (name ?? "").trim();
    if (!clean)
        throw new NpmsError("Provide a package name, e.g. express");
    const d = await getJson(`/package/${encodeURIComponent(clean)}`);
    return { pkg: d, label: d?.collected?.metadata?.name ?? clean };
}
