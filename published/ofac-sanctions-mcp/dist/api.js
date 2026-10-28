/**
 * OFAC sanctions lists — keyless public API client.
 */
const BASE = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports";
const SOURCE = "OFAC";
const UA = "ofac-sanctions-mcp";
export class SourceError extends Error {
}
async function request(path, init, timeoutMs = 90000) {
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
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                }
                else
                    quoted = false;
            }
            else
                field += c;
        }
        else if (c === '"')
            quoted = true;
        else if (c === ",") {
            row.push(field);
            field = "";
        }
        else if (c === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        }
        else if (c !== "\r")
            field += c;
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}
let cache = null;
let inflight = null;
async function sdnRows() {
    const now = Date.now();
    if (cache && now - cache.at < 30 * 60 * 1000)
        return cache.rows;
    if (inflight)
        return inflight;
    inflight = (async () => {
        const text = await getText("/SDN.CSV");
        const rows = parseCsv(text);
        const head = ["ent_num", "SDN_Name", "SDN_Type", "Program", "Title", "Call_Sign", "Vess_type", "Tonnage", "GRT", "Vess_flag", "Vess_owner", "Remarks"];
        const out = rows.filter((r) => r.length > 2).map((r) => {
            const o = {};
            head.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
            return o;
        });
        cache = { at: Date.now(), rows: out };
        inflight = null;
        return out;
    })();
    return inflight;
}
export async function screen_name(a) {
    const needle = clean(a.name).toLowerCase();
    if (needle.length < 2)
        throw new SourceError("name must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 50);
    const rows = await sdnRows();
    const parts = needle.split(/\s+/);
    const hits = rows.filter((r) => {
        const n = clean(r.SDN_Name).toLowerCase();
        return parts.every((p) => n.includes(p)) || n.includes(needle);
    });
    if (!hits.length)
        return `No SDN entry matches "${a.name}". A miss is not a clearance - screen aliases too.`;
    return section(`${hits.length} SDN match(es) for "${a.name}"`, hits.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.SDN_Name)} · ${clean(r.SDN_Type)} · ${clean(r.Program)} · OFAC ${clean(r.ent_num)}`));
}
export async function entry_detail(a) {
    const num = clean(a.number);
    if (!/^\d{1,10}$/.test(num))
        throw new SourceError("number must be the numeric OFAC ent_num");
    const rows = await sdnRows();
    const hit = rows.find((r) => clean(r.ent_num) === num);
    if (!hit)
        throw new SourceError(`No SDN entry with number ${num}`);
    return section(clean(hit.SDN_Name), [
        bullet("OFAC number", hit.ent_num),
        bullet("Type", hit.SDN_Type),
        bullet("Program", hit.Program),
        bullet("Title", hit.Title),
        bullet("Call sign", hit.Call_Sign),
        bullet("Vessel type", hit.Vess_type),
        bullet("Tonnage", hit.Tonnage),
        bullet("Flag", hit.Vess_flag),
        bullet("Owner", hit.Vess_owner),
        bullet("Remarks", clean(hit.Remarks).slice(0, 500)),
    ]);
}
export async function entries_by_program(a) {
    const prog = clean(a.program).toLowerCase();
    if (prog.length < 2)
        throw new SourceError("program must be at least 2 characters");
    const limit = clampLimit(a.limit, 15, 50);
    const rows = await sdnRows();
    const hits = rows.filter((r) => clean(r.Program).toLowerCase().includes(prog));
    if (!hits.length)
        return `No SDN entries in a program matching "${a.program}".`;
    return section(`${hits.length} SDN entry(ies) in programs matching "${a.program}"`, hits.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.SDN_Name)} · ${clean(r.SDN_Type)} · ${clean(r.Program)}`));
}
export async function entries_by_type(a) {
    const limit = clampLimit(a.limit, 15, 50);
    const want = a.type === "entity" ? "-0-" : a.type;
    const rows = await sdnRows();
    const hits = rows.filter((r) => {
        const t = clean(r.SDN_Type).toLowerCase();
        return a.type === "entity" ? t === "" || t === "-0-" || t === "entity" : t === want;
    });
    if (!hits.length)
        return `No SDN ${a.type} entries found.`;
    return section(`${hits.length} SDN ${a.type} entry(ies)`, hits.slice(0, limit).map((r, i) => `${i + 1}. ${clean(r.SDN_Name)} · ${clean(r.Program)} · OFAC ${clean(r.ent_num)}`));
}
export async function list_stats(a) {
    const rows = await sdnRows();
    const byType = new Map();
    const byProgram = new Map();
    for (const r of rows) {
        const t = clean(r.SDN_Type) || "entity";
        byType.set(t, (byType.get(t) ?? 0) + 1);
        for (const p of clean(r.Program).split(";")) {
            const k = p.trim();
            if (k)
                byProgram.set(k, (byProgram.get(k) ?? 0) + 1);
        }
    }
    const top = [...byProgram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    return section(`${rows.length} SDN entries`, [
        ...Array.from(byType.entries()).map(([t, n]) => `${t}: ${n}`),
        "",
        "Top programs:",
        ...top.map(([p, n]) => `${p}: ${n}`),
    ]);
}
