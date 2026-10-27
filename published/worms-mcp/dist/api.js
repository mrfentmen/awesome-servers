/**
 * WoRMS — keyless public API client.
 */
const BASE = "https://www.marinespecies.org/rest";
const SOURCE = "WoRMS";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "worms-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
const id = (n) => {
    if (!Number.isInteger(n) || n < 1)
        throw new SourceError("AphiaID must be a positive integer");
    return n;
};
const checkName = (raw) => {
    const v = raw.trim();
    if (v.length < 2)
        throw new SourceError("species name must be at least 2 characters");
    return v;
};
function summary(r) {
    return [
        `${r.scientificname} (AphiaID ${r.AphiaID})`,
        `  rank: ${r.rank} · status: ${r.status}`,
        r.valid_name && r.valid_name !== r.scientificname ? `  valid name: ${r.valid_name} (AphiaID ${r.valid_AphiaID})` : "",
        r.authority ? `  authority: ${r.authority}` : "",
        `  ${[r.kingdom, r.phylum, r.class, r.order, r.family].filter(Boolean).join(" > ")}`,
    ].filter(Boolean).join("\n");
}
export async function searchSpecies(a) {
    const name = checkName(a.name);
    const d = await getJson(`/AphiaRecordsByName/${encodeURIComponent(name)}?like=false&marine_only=true`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `WoRMS has no marine species named "${name}".`;
    return [`${rows.length} WoRMS records for "${name}" (showing ${Math.min(a.limit, rows.length)}):`, ...rows.slice(0, a.limit).map(summary)].join("\n");
}
export async function speciesRecord(a) {
    const d = await getJson(`/AphiaRecordByAphiaID/${id(a.aphiaId)}`);
    if (!d || !d.AphiaID)
        throw new SourceError(`WoRMS has no record ${a.aphiaId}`);
    return [
        summary(d),
        `  habitat: ${[d.isMarine && "marine", d.isBrackish && "brackish", d.isFresh && "freshwater", d.isTerrestrial && "terrestrial"].filter(Boolean).join(", ") || "unknown"}`,
        `  extinct: ${d.isExtinct ? "yes" : "no"}${d.isFossil ? " (fossil)" : ""}`,
        `  WoRMS: ${d.url}`,
    ].join("\n");
}
export async function speciesChildren(a) {
    const d = await getJson(`/AphiaChildrenByAphiaID/${id(a.aphiaId)}?offset=1`);
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        return `No children listed for AphiaID ${a.aphiaId}.`;
    return [`${rows.length} children of AphiaID ${a.aphiaId}:`, ...rows.slice(0, a.limit).map((r, i) => `${i + 1}. ${r.scientificname} (${r.rank}, AphiaID ${r.AphiaID})${r.status !== "accepted" ? ` - ${r.status}` : ""}`)].join("\n");
}
export async function speciesClassification(a) {
    let node = await getJson(`/AphiaClassificationByAphiaID/${id(a.aphiaId)}`);
    if (!node || !node.AphiaID)
        throw new SourceError(`WoRMS has no classification for ${a.aphiaId}`);
    const chain = [];
    while (node && node.scientificname) {
        chain.push(`${node.rank}: ${node.scientificname} (${node.AphiaID})`);
        node = node.child;
    }
    return [`Classification for AphiaID ${a.aphiaId}:`, ...chain.map((c, i) => `${"  ".repeat(1)}${i + 1}. ${c}`)].join("\n");
}
