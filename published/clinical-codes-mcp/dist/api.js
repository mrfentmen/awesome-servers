/**
 * NIH Clinical Tables — keyless public API client.
 */
const BASE = "https://clinicaltables.nlm.nih.gov";
const SOURCE = "NIH Clinical Tables";
const UA = "clinical-codes-mcp";
export class SourceError extends Error {
}
async function request(path, init, timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            ...init,
            signal: ctrl.signal,
            headers: {
                "user-agent": UA,
                accept: "application/json",
                ...init?.headers,
            },
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
export async function getJson(path, init) {
    const res = await request(path, init);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, init) {
    const res = await request(path, init);
    return await res.text();
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
const LOINC_FIELDS = "LOINC_NUM,LONG_COMMON_NAME,COMPONENT,SYSTEM,SCALE_TYP";
function table(d) {
    const count = Number(d?.[0] ?? 0);
    const rows = Array.isArray(d?.[3]) ? d[3] : [];
    return { count: Number.isFinite(count) ? count : rows.length, rows };
}
function cells(row) {
    return Array.isArray(row) ? row.map((x) => clean(x)) : [clean(row)];
}
export async function search_loinc(a) {
    const term = clean(a.term);
    if (term.length < 2)
        throw new SourceError("term must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 25);
    const q = encodeURIComponent(term);
    const d = await getJson(`/api/loinc_items/v3/search?terms=${q}&maxList=${limit}&sf=LOINC_NUM,LONG_COMMON_NAME&df=${LOINC_FIELDS}`);
    const { count, rows } = table(d);
    if (!rows.length)
        return `No LOINC codes match "${term}".`;
    return section(`${count} LOINC match(es) for "${term}"`, rows.map((r, i) => {
        const c = cells(r);
        return `${i + 1}. ${c[0]} · ${c[1]}${c[2] ? ` · component ${c[2]}` : ""}${c[3] ? ` · system ${c[3]}` : ""}`;
    }));
}
export async function loinc_detail(a) {
    const code = clean(a.code);
    if (!/^[0-9]{1,6}-[0-9]$/.test(code))
        throw new SourceError("code must look like 54071-6");
    const q = encodeURIComponent(code);
    const df = "LOINC_NUM,LONG_COMMON_NAME,SHORTNAME,COMPONENT,PROPERTY,TIME_ASPECT,SYSTEM,SCALE_TYP,METHOD_TYP,CLASS,STATUS";
    const d = await getJson(`/api/loinc_items/v3/search?terms=${q}&maxList=5&sf=LOINC_NUM&df=${df}`);
    const { rows } = table(d);
    const r = rows[0];
    if (!r)
        throw new SourceError(`No LOINC code ${code}`);
    const c = cells(r);
    return section(`${c[0]} · ${c[1]}`, [
        bullet("Short name", c[2]),
        bullet("Component", c[3]),
        bullet("Property", c[4]),
        bullet("Time aspect", c[5]),
        bullet("System", c[6]),
        bullet("Scale", c[7]),
        bullet("Method", c[8]),
        bullet("Class", c[9]),
        bullet("Status", c[10]),
    ]);
}
export async function search_icd10(a) {
    const term = clean(a.term);
    if (term.length < 2)
        throw new SourceError("term must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 25);
    const q = encodeURIComponent(term);
    const d = await getJson(`/api/icd10cm/v3/search?terms=${q}&maxList=${limit}&sf=code,name&df=code,name`);
    const { count, rows } = table(d);
    if (!rows.length)
        return `No ICD-10-CM codes match "${term}".`;
    return section(`${count} ICD-10-CM match(es) for "${term}"`, rows.map((r, i) => {
        const c = cells(r);
        return `${i + 1}. ${c[0]} · ${c[1]}`;
    }));
}
export async function icd10_detail(a) {
    const code = clean(a.code).toUpperCase();
    if (!/^[A-Z][0-9][0-9A-Z.]{1,8}$/.test(code))
        throw new SourceError("code must look like E11.9");
    const q = encodeURIComponent(code);
    const d = await getJson(`/api/icd10cm/v3/search?terms=${q}&maxList=5&sf=code&df=code,name`);
    const { rows } = table(d);
    const r = rows[0];
    if (!r)
        throw new SourceError(`No ICD-10-CM code ${code}`);
    const c = cells(r);
    return `${c[0]} · ${c[1]}`;
}
export async function search_conditions(a) {
    const term = clean(a.term);
    if (term.length < 2)
        throw new SourceError("term must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 25);
    const q = encodeURIComponent(term);
    const d = await getJson(`/api/conditions/v3/search?terms=${q}&maxList=${limit}`);
    const { count, rows } = table(d);
    if (!rows.length)
        return `No conditions match "${term}".`;
    return section(`${count} condition match(es) for "${term}"`, rows.map((r, i) => {
        const c = cells(r);
        return `${i + 1}. ${c[0]}${c[1] ? ` · ${c[1]}` : ""}`;
    }));
}
