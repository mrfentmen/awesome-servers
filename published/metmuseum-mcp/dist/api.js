const m0 = (() => {
    /**
     * Met Museum client. The Metropolitan Museum of Art open collection API,
     * keyless. Over 500,000 objects with images.
     */
    const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
    class MetError extends Error {
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
    async function searchObjects(query, limit = 5) {
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
    async function getObject(id) {
        try {
            return await getJson(`/objects/${id}`);
        }
        catch (e) {
            if (e instanceof MetError && String(e).includes("404"))
                return null;
            throw e;
        }
    }
    async function getDepartments() {
        const d = await getJson("/departments");
        return d.departments ?? [];
    }
    function formatObject(o) {
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
    return { MetError, formatObject, getDepartments, getObject, searchObjects };
})();
const m1 = (() => {
    const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
    const UA = "mrfentmen-met-museum-mcp/1.0 (https://github.com/mrfentmen)";
    class MetError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
        });
        if (!res.ok)
            throw new MetError(`Met Museum returned HTTP ${res.status}`);
        return (await res.json());
    }
    async function object(args) {
        const id = Number(args.id);
        if (!Number.isInteger(id) || id <= 0)
            throw new MetError("Provide a positive object ID");
        const o = await get(`${BASE}/objects/${id}`);
        if (!o?.objectID)
            throw new MetError(`Object not found: ${id}`);
        const lines = [
            `Title: ${o?.title ?? "n/a"}`,
            `Artist: ${o?.artistDisplayName ?? "n/a"}${o?.artistBeginDate || o?.artistEndDate ? ` (${o.artistBeginDate ?? ""}-${o.artistEndDate ?? ""})` : ""}`,
            `Date: ${o?.objectDate ?? "n/a"}`,
            `Medium: ${o?.medium ?? "n/a"}`,
            `Department: ${o?.department ?? "n/a"}`,
            `Culture: ${o?.culture ?? "n/a"}`,
            `Credit: ${o?.creditLine ?? "n/a"}`,
        ];
        if (o?.primaryImage)
            lines.push(`\nImage: ${o.primaryImage}`);
        if (o?.objectURL)
            lines.push(`Page: ${o.objectURL}`);
        return lines.join("\n");
    }
    async function search(args) {
        const q = (args.query ?? "").trim();
        if (!q)
            throw new MetError("Provide a search query");
        const limit = Math.min(args.limit ?? 6, 10);
        const d = await get(`${BASE}/search?q=${encodeURIComponent(q)}`);
        const ids = (d?.objectIDs ?? []).slice(0, limit);
        const total = d?.total ?? 0;
        if (!ids.length)
            return `No Met objects found for \"${q}\"`;
        const rows = [];
        for (const id of ids) {
            try {
                const o = await get(`${BASE}/objects/${id}`);
                rows.push(`${id} | ${o?.title ?? "n/a"} | ${o?.objectDate ?? ""} | ${o?.artistDisplayName ?? "unknown artist"}`);
            }
            catch {
                rows.push(`${id} | (detail fetch failed)`);
            }
        }
        return `Met collection results for \"${q}\" (${total} total, ${rows.length} shown):\n` + rows.map((r, i) => `${i + 1}. ${r}`).join("\n");
    }
    return { MetError, object, search };
})();
export const MetError = m0.MetError;
export const formatObject = m0.formatObject;
export const getDepartments = m0.getDepartments;
export const getObject = m0.getObject;
export const object = m1.object;
export const search = m1.search;
export const searchObjects = m0.searchObjects;
export const m0_searchObjects = m0.searchObjects;
export const m0_getDepartments = m0.getDepartments;
export const m0_formatObject = m0.formatObject;
export const m0_MetError = m0.MetError;
export const m0_getObject = m0.getObject;
export const m1_search = m1.search;
export const m1_object = m1.object;
export const m1_MetError = m1.MetError;
// ---- muxC tools:
