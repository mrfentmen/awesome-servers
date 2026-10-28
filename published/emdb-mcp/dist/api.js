/**
 * EMDB Cryo-EM — keyless public API client.
 */
const BASE = "https://www.ebi.ac.uk/emdb/api";
const SOURCE = "EMDB Cryo-EM";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "emdb-mcp", accept },
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
export async function getJson(path, accept = "application/json", timeoutMs = 25000) {
    const res = await request(path, accept, timeoutMs);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
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
function asList(value) {
    return Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
}
function entryId(raw) {
    const candidate = raw?.emdb_id ?? raw?.id ?? raw?._id ?? raw?.entry_id;
    return clean(candidate);
}
function entryTitle(raw) {
    return clean(raw?.title ?? raw?.admin?.title ?? raw?.admin?.title_list?.[0]?.title ?? raw?.entry?.title);
}
function normalizeId(emdbId) {
    const id = clean(emdbId).toUpperCase();
    const m = id.match(/^(?:EMD-)?(\d{4,6})$/);
    if (!m)
        throw new SourceError(`"${emdbId}" does not look like an EMDB accession (EMD-1001)`);
    return `EMD-${m[1]}`;
}
function scalar(value) {
    if (value === undefined || value === null)
        return "";
    if (typeof value === "object") {
        const inner = value.valueOf_ ?? value.value ?? value.name ?? value.title;
        return inner === undefined || inner === null ? "" : clean(inner);
    }
    return clean(value);
}
export async function searchEntries(a) {
    const limit = clampLimit(a.limit, 10, 25);
    const data = await getJson(`/search/${encodeURIComponent(clean(a.query))}?rows=${limit}`, "application/json", 30000);
    const entries = asList(Array.isArray(data) ? data : data?.entries ?? data?.result ?? data?.hits);
    if (!entries.length)
        return `EMDB has no entries matching "${clean(a.query)}".`;
    return [
        `${entries.length} EMDB entr(ies) matching "${clean(a.query)}":`,
        "",
        ...entries.slice(0, limit).map((e, i) => {
            const id = entryId(e);
            const title = entryTitle(e);
            const resolution = e?.resolution ?? e?.structure_determination?.resolution ?? e?.admin?.resolution;
            const bits = [title.slice(0, 110), resolution ? `resolution ${clean(resolution)} A` : ""].filter(Boolean);
            return `${i + 1}. ${id || "(no id)"}${bits.length ? ` - ${bits.join(" · ")}` : ""}`;
        }),
    ].join("\n");
}
async function fetchEntry(emdbId) {
    const id = normalizeId(emdbId);
    const data = await getJson(`/entry/${id}`, "application/json", 30000);
    if (!data || typeof data !== "object" || data?.error)
        throw new SourceError(`EMDB has no entry "${id}"`);
    return { id, data };
}
export async function entryDetail(a) {
    const { id, data } = await fetchEntry(a.emdbId);
    const admin = data.admin ?? {};
    const authors = asList(admin.authors_list?.author).map((x) => clean(x?.valueOf_ ?? x)).filter(Boolean);
    const resolution = data?.resolution ?? data?.structure_determination?.[0]?.resolution?.valueOf_ ??
        data?.structure_determination?.resolution ?? admin?.resolution;
    const date = admin?.key_dates?.deposition ?? admin?.deposition_date;
    const citation = asList(admin?.primary_citation).map((c) => clean(c?.title ?? c)).filter(Boolean);
    const journal = asList(admin?.primary_citation).map((c) => clean(c?.journal ?? c?.journal_info ?? "")).filter(Boolean);
    return [
        `${id} - ${entryTitle(data) || "(no title)"}`,
        "",
        bullet("resolution", resolution ? `${scalar(resolution)} angstrom` : ""),
        bullet("method", scalar(data?.structure_determination?.[0]?.method ?? data?.method)),
        bullet("deposited", date),
        bullet("status", scalar(admin?.current_status)),
        bullet("authors", authors.length ? `${authors.slice(0, 5).join(", ")}${authors.length > 5 ? ` (+${authors.length - 5})` : ""}` : ""),
        citation.length ? `\nCitation: ${citation[0].slice(0, 220)}` : "",
        journal.length ? `Journal: ${journal[0].slice(0, 120)}` : "",
    ].filter(Boolean).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
export async function entryPdbs(a) {
    const { id, data } = await fetchEntry(a.emdbId);
    const xrefs = asList(data?.crossreferences ?? data?.cross_references ?? data?.admin?.crossreferences);
    const pdbs = new Set();
    for (const x of xrefs) {
        const candidates = [
            ...asList(x?.pdb_list?.pdb_reference),
            ...asList(x?.pdb),
            ...asList(x?.pdb_id),
        ];
        for (const p of candidates) {
            const v = clean(typeof p === "string" ? p : p?.pdb_id ?? p?.valueOf_ ?? p?.accession);
            if (/^[0-9][A-Za-z0-9]{3}$/.test(v))
                pdbs.add(v.toUpperCase());
        }
    }
    if (!pdbs.size)
        return `${id} lists no PDB cross-references in its entry record.`;
    return [
        `${id} links ${pdbs.size} PDB structure(s):`,
        "",
        ...Array.from(pdbs).sort().map((p) => `- ${p}`),
    ].join("\n");
}
