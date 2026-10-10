export class SupabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = "SupabaseError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    const b = process.env.SUPABASE_URL;
    if (!b)
        throw new SupabaseError("Set SUPABASE_URL (project URL).");
    return b.replace(/\/$/, "");
}
function headers() {
    const k = process.env.SUPABASE_SERVICE_KEY;
    if (!k)
        throw new SupabaseError("Set SUPABASE_SERVICE_KEY (service_role key).");
    return { ...UA, Accept: "application/json", apikey: k, Authorization: `Bearer ${k}` };
}
async function req(path, init = {}) {
    let res;
    try {
        res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: { ...headers(), ...(init.headers ?? {}) }, ...init });
    }
    catch (e) {
        throw new SupabaseError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new SupabaseError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function queryTable(table, select, limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return req(`/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(select ?? "*")}&limit=${n}`);
}
export function listUsers(page) {
    const p = Number(page ?? 1) || 1;
    return req(`/auth/v1/admin/users?page=${p}&per_page=20`);
}
export function callRpc(fn, params) {
    let body = "{}";
    if (params) {
        try {
            body = JSON.stringify(JSON.parse(params));
        }
        catch {
            throw new SupabaseError("params must be valid JSON.");
        }
    }
    return req(`/rest/v1/rpc/${encodeURIComponent(fn)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    }).then((t) => t.slice(0, 8000));
}
export function storageBuckets() {
    return req("/storage/v1/bucket");
}
export function storageObjects(bucket, limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return req(`/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: n }),
    }).then((t) => t.slice(0, 8000));
}
export function authUser(userId) {
    return req(`/auth/v1/admin/users/${encodeURIComponent(userId)}`);
}
export function createUser(email, password) {
    const body = { email, email_confirm: "true" };
    if (password)
        body.password = password;
    return req("/auth/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }).then((t) => t.slice(0, 4000));
}
export function deleteUser(userId) {
    return req(`/auth/v1/admin/users/${encodeURIComponent(userId)}`, { method: "DELETE" }).then((t) => t.slice(0, 2000));
}
export function insertRow(table, rowJson) {
    let body;
    try {
        body = JSON.parse(rowJson);
    }
    catch {
        throw new SupabaseError("row_json must be valid JSON.");
    }
    return req(`/rest/v1/${encodeURIComponent(table)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(body),
    }).then((t) => t.slice(0, 4000));
}
export function updateRows(table, rowId, patchJson) {
    let body;
    try {
        body = JSON.parse(patchJson);
    }
    catch {
        throw new SupabaseError("patch_json must be valid JSON.");
    }
    return req(`/rest/v1/${encodeURIComponent(table)}?id=eq.${encodeURIComponent(rowId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(body),
    }).then((t) => t.slice(0, 4000));
}
export function deleteRows(table, rowId) {
    return req(`/rest/v1/${encodeURIComponent(table)}?id=eq.${encodeURIComponent(rowId)}`, { method: "DELETE" }).then((t) => t.slice(0, 2000));
}
// ---- muxG tools:
const SB_STATUS = "https://status.supabase.com/api/v2";
const SB_PG_VERSIONS = "https://www.postgresql.org/versions.json";
const SB_LIST_CAP = 12;
async function sbJson(url, accept = "application/json") {
    const res = await fetch(url, { headers: { "User-Agent": "awesome-mcp/1.0", Accept: accept }, signal: AbortSignal.timeout(40000) });
    if (res.status === 404)
        throw new SupabaseError(`Not found: ${url.replace(/^https:\/\//, "")}`);
    if (res.status === 429)
        throw new SupabaseError("That service is rate limiting this IP. Wait a moment and try again.");
    if (!res.ok)
        throw new SupabaseError(`Returned ${res.status} for ${url.replace(/^https:\/\//, "")}`);
    return (await res.json());
}
function sbBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function sbToday() {
    return new Date().toISOString().slice(0, 10);
}
function sbDaysUntil(date) {
    return Math.round((Date.parse(date) - Date.now()) / 86400000);
}
/**
 * Review a CREATE TABLE statement the way a Supabase project will actually be
 * used: row level security, primary keys, indexes on foreign keys, and the
 * column choices that only bite once the table has real data in it.
 */
export async function schemaReview(args) {
    const ddl = String(args?.ddl ?? "").trim();
    if (!ddl)
        throw new SupabaseError("ddl is empty. Paste one or more CREATE TABLE statements.");
    if (ddl.length > 40000)
        throw new SupabaseError(`ddl is ${ddl.length} characters, over the 40000 limit. Review one table at a time.`);
    const tables = [];
    const createRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w."]+)\s*\(([\s\S]*?)\)\s*(?:WITH\s*\([^)]*\))?\s*;/gi;
    let m;
    while ((m = createRe.exec(ddl)) !== null) {
        const body = m[2];
        const columns = [];
        const constraints = [];
        const indexLines = [];
        // Split on top-level commas only, so "decimal(10,2)" and numeric(4, 2) survive.
        const depth = [];
        let current = "";
        const parts = [];
        for (const ch of body) {
            if (ch === "(")
                depth.push(1);
            else if (ch === ")")
                depth.pop();
            if (ch === "," && depth.length === 0) {
                parts.push(current);
                current = "";
                continue;
            }
            current += ch;
        }
        if (current.trim())
            parts.push(current);
        for (const raw of parts) {
            const line = raw.trim().replace(/\s+/g, " ");
            if (!line)
                continue;
            if (/^(CONSTRAINT|PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY|EXCLUDE)\b/i.test(line)) {
                constraints.push(line);
                continue;
            }
            const ref = /REFERENCES\s+([\w."]+)\s*(?:\(([^)]*)\))?(?:\s+ON\s+DELETE\s+(\w+))?(?:\s+ON\s+UPDATE\s+(\w+))?/i.exec(line);
            const colName = /^"([^"]+)"|^(\w+)/.exec(line);
            if (!colName)
                continue;
            const name = colName[1] ?? colName[2];
            const typeMatch = /\b(?:(\w+)\s*\(\s*([^)]*)\s*\)|(\w+(?:\s+with(?:out)?\s+time\s+zone)?)|(\w+)\s+\[\])/i.exec(line.slice((colName[0] ?? "").length));
            const type = (typeMatch?.[0] ?? "unknown").trim();
            columns.push({
                name,
                raw: line,
                // A column-level PRIMARY KEY appears after the type, as in "id serial PRIMARY KEY".
                isPk: /\bPRIMARY\s+KEY\b/i.test(line),
                isFk: Boolean(ref),
                references: ref ? ref[1] : null,
                type,
                notNull: /\bNOT\s+NULL\b/i.test(line),
                hasDefault: /\bDEFAULT\b/i.test(line),
                isUnique: /\bUNIQUE\b/i.test(line) || /^PRIMARY\s+KEY/i.test(line),
            });
        }
        // A table-level PRIMARY KEY clause names the column; fold that in.
        const pkClause = constraints.find((c) => /^PRIMARY\s+KEY/i.test(c));
        if (pkClause) {
            const pkName = /PRIMARY\s+KEY\s*\(\s*"?([\w"]+)"?\s*\)/i.exec(pkClause)?.[1];
            for (const col of columns)
                if (col.name.replace(/"/g, "") === pkName)
                    col.isPk = true;
        }
        tables.push({ name: m[1].replace(/"/g, ""), raw: m[0], columns, constraints, indexLines });
    }
    const createIndex = [...ddl.matchAll(/CREATE\s+(UNIQUE\s+)?INDEX[\s\S]*?;/gi)].map((x) => x[0].replace(/\s+/g, " "));
    for (const stmt of createIndex) {
        const on = /ON\s+([\w."]+)/i.exec(stmt)?.[1]?.replace(/"/g, "");
        const table = tables.find((t) => t.name === on);
        if (table)
            table.indexLines.push(stmt);
    }
    const hasRls = /ENABLE\s+ROW\s+LEVEL\s+SECURITY|CREATE\s+POLICY|ALTER\s+TABLE[\s\S]*?FORCE\s+ROW\s+LEVEL\s+SECURITY/i.test(ddl);
    const policies = [...ddl.matchAll(/CREATE\s+POLICY[\s\S]*?;/gi)].map((x) => x[0].replace(/\s+/g, " "));
    if (!tables.length) {
        return [
            "Schema review of the supplied DDL",
            "No CREATE TABLE statement was recognised.",
            "This parser looks for CREATE TABLE [IF NOT EXISTS] name ( ... ); and does not read other forms such as CREATE TABLE AS, partitions, or a schema-qualified name inside quotes it cannot resolve.",
        ].join("\n");
    }
    const out = [
        "Schema review, computed locally from the DDL you supplied",
        `${tables.length} table(s) found${hasRls ? "" : "; no row level security anywhere in this DDL, which matters on Supabase because every table is reachable through PostgREST unless RLS is on"}`,
        "",
    ];
    for (const t of tables) {
        const findings = [];
        if (!t.columns.some((c) => c.isPk)) {
            findings.push("no primary key: every row is addressable only by ctid, so updates and replication behave badly and Supabase's PostgREST cannot address a single row");
        }
        const fks = t.columns.filter((c) => c.isFk);
        const unindexed = fks.filter((c) => !t.indexLines.some((i) => new RegExp(`\\b${c.name}\\b`, "i").test(i)) && !c.isUnique);
        for (const fk of unindexed) {
            findings.push(`foreign key ${fk.name} is not indexed, so every join and every delete or update on the parent table scans this table`);
        }
        for (const c of t.columns) {
            if (/\btimestamp\s+without\s+time\s+zone\b/i.test(c.type)) {
                findings.push(`${c.name} is timestamp without time zone, so a value means different instants depending on the session timezone; use timestamptz`);
            }
            if (/^serial\b|^bigserial\b/i.test(c.type)) {
                findings.push(`${c.name} uses ${c.type.split(/\s+/)[0]}, which is legacy: identity columns (GENERATED ... AS IDENTITY) are the current form`);
            }
            if (/\bchar\s*\(\s*\d+\s*\)/i.test(c.type) && !/varying/i.test(c.type)) {
                findings.push(`${c.name} is char(n), which blank-pads and silently compares and stores differently from varchar(n)`);
            }
            if (/^(text|varchar)\b/i.test(c.type) && c.notNull && !c.hasDefault && !/uuid|json|timestamp|date|time|bool/i.test(c.type)) {
                findings.push(`${c.name} is a required ${c.type.split(/\s+/)[0]} with no default, so every insert must supply it`);
            }
            if (/\bjsonb?\b/i.test(c.type) && !/\[\]/.test(c.type)) {
                findings.push(`${c.name} is untyped json/jsonb: there is no way to index or constrain its contents without an expression index`);
            }
        }
        for (const c of t.constraints) {
            if (/FOREIGN\s+KEY/i.test(c) && !/ON\s+DELETE/i.test(c)) {
                findings.push(`a foreign key constraint has no ON DELETE action, so it defaults to NO ACTION and a parent delete fails silently rather than cascading`);
            }
        }
        if (t.columns.length > 40)
            findings.push(`${t.columns.length} columns is a lot for one table; consider splitting rather than adding more nullable flags`);
        out.push(`Table ${t.name}: ${t.columns.length} column(s), ${t.constraints.length} constraint(s), ${t.indexLines.length} index(es) in the DDL`, `  columns: ${t.columns.map((c) => `${c.name} ${c.type.replace(/\s+/g, " ")}${c.notNull ? " NOT NULL" : ""}${c.isPk ? " PK" : ""}${c.isUnique && !c.isPk ? " UNIQUE" : ""}${c.isFk ? ` -> ${c.references}` : ""}`).slice(0, SB_LIST_CAP).join("; ")}`, ...(findings.length ? findings.map((f) => `  - ${f}`) : ["  - nothing flagged"]));
    }
    if (policies.length) {
        out.push("", `Row level security policies in this DDL (${policies.length}):`);
        out.push(...policies.slice(0, SB_LIST_CAP).map((p) => `  ${p.slice(0, 160)}`));
    }
    out.push("", "This reads the DDL as text, so it cannot see indexes created elsewhere, a primary key added by a later migration, or column defaults set in code. It is a first pass to catch the mistakes that are cheap to fix before the first row exists and expensive afterwards, not a substitute for looking at the live table.");
    return out.join("\n");
}
/** How the hosted platform is behaving, per region and per service. */
export async function platformStatus(_args) {
    const summary = await sbJson(`${SB_STATUS}/summary.json`);
    const components = summary.components ?? [];
    const down = components.filter((c) => c.status && c.status !== "operational");
    const regions = components.filter((c) => /^([a-z]{2}-[a-z]+-\d)$/.test(c.name ?? ""));
    const services = components.filter((c) => !c.group && !/^([a-z]{2}-[a-z]+-\d)$/.test(c.name ?? ""));
    const byStatus = new Map();
    for (const c of components)
        byStatus.set(c.status ?? "unknown", (byStatus.get(c.status ?? "unknown") ?? 0) + 1);
    return [
        `Supabase platform status: ${summary.status?.description ?? "not reported"} (indicator ${summary.status?.indicator ?? "?"})`,
        `${components.length} component(s): ${[...byStatus.entries()].map(([k, v]) => `${k} ${v}`).join(", ")}`,
        `${regions.length} regional component(s) and ${services.length} non-regional one(s)`,
        "",
        down.length ? "Not operational:" : "Every tracked component is operational.",
        ...down.map((c) => `  ${c.name ?? "?"} — ${c.status}${c.description ? `: ${c.description}` : ""}`),
        "",
        "Services tracked:",
        ...services.slice(0, SB_LIST_CAP).map((c) => `  ${c.status === "operational" ? "ok  " : "!!  "}${c.name ?? "?"}${c.description ? ` — ${c.description}` : ""}`),
        "",
        "Regional components are per-region, so one red region is a single-location problem and several is a platform problem. The regional list is long because Supabase exposes capacity separately for each region it runs.",
    ].filter(Boolean).join("\n");
}
/** Which Postgres versions are safe to run, and which are past end of life. */
export async function postgresVersionWatch(_args) {
    const rows = await sbJson(SB_PG_VERSIONS);
    if (!Array.isArray(rows) || !rows.length)
        throw new SupabaseError("The PostgreSQL version feed returned nothing usable.");
    const today = sbToday();
    const majors = rows
        .map((r) => ({
        major: String(r.major ?? ""),
        latestMinor: r.latestMinor ?? "not reported",
        relDate: String(r.relDate ?? "").slice(0, 10),
        eolDate: String(r.eolDate ?? "").slice(0, 10),
        supported: r.supported === true,
        current: r.current === true,
        daysLeft: r.eolDate ? sbDaysUntil(String(r.eolDate).slice(0, 10)) : null,
    }))
        .filter((r) => r.major);
    // "major" arrives as 6.3, 13, 14, 15, 16, 17: the first digit is the major, the rest the minor.
    const toMajor = (s) => Number(s.split(".")[0]);
    const supportedMajors = [...new Set(majors.filter((m) => m.supported).map((m) => toMajor(m.major)))].sort((a, b) => a - b);
    const eolSoon = majors
        .filter((m) => m.daysLeft !== null && m.daysLeft > 0 && m.daysLeft < 400)
        .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
    const alreadyEol = majors.filter((m) => m.daysLeft !== null && m.daysLeft <= 0);
    const newest = majors.filter((m) => m.current);
    return [
        "PostgreSQL support window, from postgresql.org",
        `Feed lists ${majors.length} version line(s); supported major versions: ${supportedMajors.length ? supportedMajors.join(", ") : "none reported"}`,
        "",
        `Current release lines: ${newest.length ? newest.map((m) => `${m.major} (latest minor ${m.latestMinor}, released ${m.relDate})`).join("; ") : "not reported"}`,
        "",
        "Supported versions and when they lose support:",
        ...majors
            .filter((m) => m.supported && m.daysLeft !== null)
            .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
            .map((m) => `  ${m.major.padEnd(7)} EOL ${m.eolDate}, ${m.daysLeft} day(s) left`),
        "",
        "Reaching end of life within about a year:",
        ...(eolSoon.length ? eolSoon.map((m) => `  ${m.major.padEnd(7)} EOL ${m.eolDate}, ${m.daysLeft} day(s) left, latest minor ${m.latestMinor}`) : ["  none"]),
        "",
        `Version lines already past end of life on the feed: ${alreadyEol.length ? alreadyEol.map((m) => m.major).join(", ") : "none"}`,
        "",
        "End of life means no further fixes, including security fixes, so a managed platform may still run an EOL major perfectly happily while quietly refusing to patch it. Check which major your database is on before assuming a provider is maintaining it.",
    ].filter(Boolean).join("\n");
}
