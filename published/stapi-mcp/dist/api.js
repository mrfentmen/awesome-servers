/**
 * STAPI (Star Trek API) client, keyless.
 * Docs: http://stapi.co/api-documentation
 * List endpoints are GET; search endpoints are POST form-encoded.
 */
const BASE = "http://stapi.co/api/v1/rest";
export class StapiError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "stapi-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new StapiError("Not found in the Star Trek database.");
    if (!res.ok)
        throw new StapiError(`STAPI error ${res.status}`);
    return (await res.json());
}
async function postForm(path, fields) {
    const body = new URLSearchParams(fields);
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "User-Agent": "stapi-mcp/1.0", "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: body.toString(),
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new StapiError(`STAPI error ${res.status}`);
    return (await res.json());
}
export async function searchCharacters(name, limit = 5) {
    const data = await postForm("/character/search", { name, pageSize: String(Math.min(Math.max(limit, 1), 50)) });
    const rows = Array.isArray(data.characters) ? data.characters : [];
    const total = data.page?.totalElements;
    if (rows.length === 0 && total === 0)
        return [];
    return rows.slice(0, limit).map((c) => ({ uid: String(c.uid), name: String(c.name ?? "?") }));
}
const num = (v) => (typeof v === "number" ? v : undefined);
const str = (v) => (typeof v === "string" && v ? v : undefined);
export async function getCharacter(uid) {
    const clean = uid.trim().toUpperCase();
    if (!/^CHMA\d+$/.test(clean))
        throw new StapiError(`Not a character uid: "${uid}". Use search_characters (uids look like CHMA0000015352).`);
    const data = await getJson(`/character?uid=${clean}`);
    const c = data.character ?? {};
    if (!c.uid)
        return null;
    return {
        uid: String(c.uid),
        name: String(c.name ?? "?"),
        gender: str(c.gender),
        birthYear: num(c.yearOfBirth),
        birthPlace: str(c.placeOfBirth),
        height: num(c.height),
        maritalStatus: str(c.maritalStatus),
        serialNumber: str(c.serialNumber),
    };
}
export function formatCharacter(c, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const base = `${prefix}[${c.uid}] ${c.name}`;
    if (!("gender" in c))
        return base;
    const d = c;
    const extra = [
        d.gender ? d.gender : "",
        d.birthYear ? `b. ${d.birthYear}` : "",
        d.birthPlace ? `in ${d.birthPlace}` : "",
        d.maritalStatus ? d.maritalStatus : "",
    ].filter(Boolean).join(", ");
    return extra ? `${base} — ${extra}` : base;
}
// ---- gap4d2 tools:
