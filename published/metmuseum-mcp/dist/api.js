/**
 * Met Museum client. The Metropolitan Museum of Art open collection API,
 * keyless. Over 500,000 objects with images.
 */
const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
export class MetError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "metmuseum-mcp/1.0" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new MetError(`Met API error ${res.status}`);
    return (await res.json());
}
export async function searchObjects(query, limit = 5) {
    const s = await getJson(`/objects?hasImages=true&q=${encodeURIComponent(query)}`);
    const ids = (s.objectIDs ?? []).slice(0, limit);
    const out = [];
    for (const id of ids) {
        try {
            out.push(await getJson(`/objects/${id}`));
        }
        catch {
            // skip any object that fails to load
        }
    }
    return out;
}
export async function getObject(id) {
    try {
        return await getJson(`/objects/${id}`);
    }
    catch (e) {
        if (e instanceof MetError && String(e).includes("404"))
            return null;
        throw e;
    }
}
export async function getDepartments() {
    const d = await getJson("/departments");
    return d.departments ?? [];
}
export function formatObject(o) {
    const lines = [
        `[${o.objectID}] ${o.title ?? "(untitled)"}`,
        o.artistDisplayName ? `Artist: ${o.artistDisplayName}${o.artistDisplayBio ? ` (${o.artistDisplayBio})` : ""}` : "",
        o.objectDate ? `Date: ${o.objectDate}` : "",
        o.medium ? `Medium: ${o.medium}` : "",
        [o.department, o.culture, o.classification].filter(Boolean).join(" | "),
        o.dimensions ? `Dimensions: ${o.dimensions}` : "",
        o.accessionYear ? `Accession year: ${o.accessionYear}` : "",
        o.isPublicDomain != null ? (o.isPublicDomain ? "Public domain" : "Image rights reserved") : "",
        o.primaryImage || o.objectURL,
    ].filter(Boolean);
    return lines.join("\n");
}
