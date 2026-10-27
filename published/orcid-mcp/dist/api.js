/**
 * ORCID — keyless public API client.
 */
const BASE = "https://pub.orcid.org/v3.0";
const SOURCE = "ORCID";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "orcid-mcp", accept },
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
const ORCID_ID = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
function checkOrcid(raw) {
    const id = raw.trim();
    if (!ORCID_ID.test(id))
        throw new SourceError(`"${raw}" is not an ORCID iD (0000-0000-0000-0000)`);
    return id;
}
const val = (v) => String(v?.["value"] ?? v ?? "").trim();
export async function searchResearchers(a) {
    const q = a.query.trim();
    if (q.length < 2)
        throw new SourceError("search query must be at least 2 characters");
    const d = await getJson(`/expanded-search/?q=${encodeURIComponent(q)}&rows=${a.limit}`);
    const rows = Array.isArray(d?.["expanded-result"]) ? d["expanded-result"] : [];
    if (!rows.length)
        return `ORCID found no researchers matching "${q}".`;
    return [
        `${Number(d?.["num-found"] ?? rows.length).toLocaleString("en-US")} researchers match "${q}" (showing ${rows.length}):`,
        ...rows.map((r, i) => {
            const inst = (r?.["institution-name"] ?? []).slice(0, 2).join("; ");
            return `${i + 1}. ${r?.["given-names"] ?? ""} ${r?.["family-names"] ?? ""} - ${r?.["orcid-id"]}${inst ? `\n   ${inst}` : ""}`;
        }),
    ].join("\n");
}
export async function getResearcher(a) {
    const id = checkOrcid(a.orcid);
    const [person, employments] = await Promise.all([
        getJson(`/${id}/person`),
        getJson(`/${id}/employments`).catch(() => null),
    ]);
    const name = person?.name;
    const full = [name?.["given-names"]?.value, name?.["family-name"]?.value].filter(Boolean).join(" ");
    const bio = val(person?.biography?.content ?? person?.biography);
    const affiliations = [];
    for (const g of employments?.["affiliation-group"] ?? []) {
        for (const s of g?.summaries ?? []) {
            const e = s?.["employment-summary"];
            if (e)
                affiliations.push(`${e?.["organization"]?.name ?? "?"}${e?.["role-title"] ? ` - ${e["role-title"]}` : ""}`);
        }
    }
    return [
        `${full || "Unnamed researcher"} (${id})`,
        `Profile: https://orcid.org/${id}`,
        bio ? `Bio: ${bio.slice(0, 700)}` : "",
        affiliations.length ? `Affiliations:\n${affiliations.slice(0, 8).map((x) => `  - ${x}`).join("\n")}` : "Affiliation: not listed",
    ].filter(Boolean).join("\n");
}
export async function listWorks(a) {
    const id = checkOrcid(a.orcid);
    const d = await getJson(`/${id}/works`);
    const out = [];
    for (const group of d?.group ?? []) {
        const w = group?.["work-summary"]?.[0];
        if (!w)
            continue;
        const doi = (group?.["external-ids"]?.["external-id"] ?? []).find((x) => String(x?.["external-id-type"]).toLowerCase() === "doi");
        const title = w?.title?.title?.value ?? "Untitled";
        const year = w?.["publication-date"]?.year?.value ?? "n.d.";
        const type = w?.type ?? "work";
        out.push(`${out.length + 1}. ${title}\n   ${year} · ${type}${doi ? ` · doi:${doi["external-id-value"]}` : ""}`);
        if (out.length >= a.limit)
            break;
    }
    return out.length ? [`Works on ${id} (${out.length} shown):`, ...out].join("\n") : `No public works listed on ${id}.`;
}
