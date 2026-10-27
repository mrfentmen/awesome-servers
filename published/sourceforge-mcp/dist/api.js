/**
 * SourceForge REST API client, keyless.
 * Docs: https://sourceforge.net/p/forge/documentation/Allura%20API/
 */
const BASE = "https://sourceforge.net/rest";
export class SourceForgeError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "sourceforge-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new SourceForgeError("Not found on SourceForge.");
    if (!res.ok)
        throw new SourceForgeError(`SourceForge error ${res.status}`);
    return (await res.json());
}
export async function getProject(shortname) {
    if (!/^[a-z0-9-]+$/i.test(shortname.trim()))
        throw new SourceForgeError(`Not a project shortname: "${shortname}".`);
    const p = await getJson(`/p/${encodeURIComponent(shortname.trim().toLowerCase())}`);
    return {
        shortname: String(p.shortname ?? shortname),
        name: p.name,
        description: p.short_description ? String(p.short_description).slice(0, 200) : undefined,
        url: `https://sourceforge.net/p/${encodeURIComponent(shortname.trim().toLowerCase())}/`,
    };
}
export function formatProject(p) {
    const lines = [
        `${p.name ?? p.shortname} [${p.shortname}]`,
        p.description ? `${p.description}` : "",
        p.url ? `${p.url}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
