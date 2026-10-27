const BASE = "https://datatracker.ietf.org/api/v1";
const HEADERS = { "User-Agent": "mrfentmen-ietf-mcp/1.0" };
export class IetfError extends Error {
}
async function get(path, params = {}) {
    const url = new URL(`${BASE}/${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30000) });
    if (!response.ok)
        throw new IetfError(`IETF Datatracker error ${response.status}`);
    return response.json();
}
export function searchDocuments(query, limit = 10, offset = 0) {
    return get("doc/document/", { name: query, limit: String(limit), offset: String(offset) });
}
export function getDocument(name) {
    return get("doc/document/", { name, limit: "1" });
}
export function searchGroups(query, limit = 10) {
    return get("group/group/", { name: query, limit: String(limit), offset: "0" });
}
export function listMeetings(limit = 10) {
    return get("meeting/meeting/", { limit: String(limit), offset: "0" });
}
export function format(value) { return JSON.stringify(value, null, 2).slice(0, 16000); }
async function ietfObjects(path, params) {
    const data = (await get(path, params));
    return { rows: data.objects ?? [], total: Number(data.meta?.total_count ?? 0) };
}
const ietfName = (value) => {
    if (value == null)
        return "not reported";
    if (typeof value === "object" && value !== null) {
        const row = value;
        for (const key of ["acronym", "name", "short_name", "title"]) {
            const found = row[key];
            if (found != null && String(found) !== "")
                return String(found);
        }
        return "not reported";
    }
    const text = String(value).trim();
    if (!text)
        return "not reported";
    // the Datatracker hands back related objects as resource URIs, so name them by
    // their last path segment: /api/v1/name/groupstatename/active/ -> active
    const parts = text.split("/").filter(Boolean);
    return parts.length ? parts[parts.length - 1] : text;
};
export async function documentAuthors(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new IetfError("Provide a document name, e.g. \"rfc9110\".");
    const limit = Math.max(1, Math.min(args.limit ?? 20, 60));
    const { rows, total } = await ietfObjects("doc/documentauthor/", {
        document__name: name,
        limit: String(limit),
    });
    if (!rows.length)
        return `No author records for document "${name}".`;
    // the author rows only carry a person resource URI, so resolve the names
    const ids = [...new Set(rows.map((r) => ietfName(r.person)).filter((id) => /^\d+$/.test(id)))];
    const names = new Map();
    for (const id of ids) {
        const { rows: people } = await ietfObjects("person/person/", { id, limit: "1" });
        const person = people[0];
        const full = String(person?.name ?? "").trim() || String(person?.ascii ?? "").trim();
        if (full)
            names.set(id, full);
    }
    return `Authors of ${name} (${rows.length} of ${total} records):\n` +
        rows.slice(0, limit).map((r, i) => {
            const id = ietfName(r.person);
            const who = names.get(id) ?? (/\d+/.test(id) ? `person ${id} (name not published)` : id);
            return [
                `${i + 1}. ${who}`,
                `   affiliation: ${String(r.affiliation ?? "").trim() || "not reported"}${r.country ? ` | country: ${ietfName(r.country)}` : ""}`,
                ...(r.email ? [`   email: ${ietfName(r.email)}`] : []),
            ].join("\n");
        }).join("\n");
}
