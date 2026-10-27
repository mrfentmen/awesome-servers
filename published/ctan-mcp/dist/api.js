/**
 * CTAN JSON API client, keyless.
 * Docs: https://ctan.org/help/json
 */
const BASE = "https://ctan.org/json/2.0";
export class CtanError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "ctan-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new CtanError("No such CTAN package.");
    if (!res.ok)
        throw new CtanError(`CTAN error ${res.status}`);
    return (await res.json());
}
export async function getPackage(key) {
    const clean = key.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(clean))
        throw new CtanError(`Not a CTAN package key: "${key}".`);
    const p = await getJson(`/pkg/${clean}`);
    const authors = Array.isArray(p.authors) ? p.authors : [];
    const ctanPath = p.ctan?.path ? String(p.ctan.path).replace(/^\/+/, "") : undefined;
    return {
        key: String(p.key ?? clean),
        name: p.name,
        caption: p.caption,
        authors: authors.map((a) => String(a.name ?? a.id ?? "?")).slice(0, 6),
        version: p.version?.number ? String(p.version.number) : undefined,
        ctanPath: p.ctan?.path,
        mirrors: [`https://ctan.org/pkg/${clean}`, ...(ctanPath ? [`https://mirrors.ctan.org/${ctanPath}`] : [])],
    };
}
export function formatPackage(p) {
    const lines = [
        `${p.key}${p.name && p.name !== p.key ? ` (${p.name})` : ""}${p.version ? ` ${p.version}` : ""}`,
        p.caption ? `${p.caption}` : "",
        p.authors.length ? `Authors: ${p.authors.join(", ")}` : "",
        p.ctanPath ? `CTAN path: ${p.ctanPath}` : "",
        p.mirrors.length ? `Links:\n- ${p.mirrors.join("\n- ")}` : "",
        `Install: tlmgr install ${p.key}`,
    ].filter(Boolean);
    return lines.join("\n");
}
async function getJsonPublic(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "ctan-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new CtanError("No such CTAN package.");
    if (!res.ok)
        throw new CtanError(`CTAN error ${res.status}`);
    return (await res.json());
}
/** The licence vocabulary CTAN itself uses, so a package licence can be read as free or not. */
export async function licenseCatalog(_args) {
    const rows = await getJsonPublic("/licenses");
    const free = rows.filter((r) => r.free);
    const restricted = rows.filter((r) => !r.free);
    const line = (r) => `${r.key}: ${r.name ?? "name not reported"}`;
    return [
        `CTAN licence list: ${rows.length} licence keys, ${free.length} marked free and ${restricted.length} not marked free`,
        `Marked free (${free.length}):`,
        ...free.map((r) => `- ${line(r)}`),
        `Not marked free (${restricted.length}):`,
        ...restricted.map((r) => `- ${line(r)}`),
        "A package lists its licences by these keys, so a key that is absent here cannot be read as free or non-free.",
    ].join("\n");
}
