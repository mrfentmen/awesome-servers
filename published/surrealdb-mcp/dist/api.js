/**
 * SurrealDB HTTP API client. Points at any instance via SURREALDB_URL
 * (default http://127.0.0.1:8000). Auth via SURREALDB_USER + SURREALDB_PASS
 * (root) or SURREALDB_TOKEN, plus SURREALDB_NS + SURREALDB_DB.
 * Docs: https://surrealdb.com/docs/surrealdb/integration/http
 */
const BASE = (process.env.SURREALDB_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
export class SurrealDbError extends Error {
}
function authHeaders() {
    const h = {
        "User-Agent": "surrealdb-mcp/1.0",
        Accept: "application/json",
        "Surreal-NS": process.env.SURREALDB_NS ?? "test",
        "Surreal-DB": process.env.SURREALDB_DB ?? "test",
    };
    if (process.env.SURREALDB_TOKEN) {
        h.Authorization = `Bearer ${process.env.SURREALDB_TOKEN}`;
    }
    else if (process.env.SURREALDB_USER && process.env.SURREALDB_PASS) {
        h.Authorization = `Basic ${Buffer.from(`${process.env.SURREALDB_USER}:${process.env.SURREALDB_PASS}`).toString("base64")}`;
    }
    else {
        throw new SurrealDbError("Set SURREALDB_USER + SURREALDB_PASS (or SURREALDB_TOKEN).");
    }
    return h;
}
export async function serverVersion() {
    const res = await fetch(`${BASE}/version`, {
        headers: { "User-Agent": "surrealdb-mcp/1.0", Accept: "text/plain" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new SurrealDbError(`SurrealDB at ${BASE} is unreachable (${res.status}). Set SURREALDB_URL.`);
    return (await res.text()).trim();
}
const READ_ONLY_RE = /^\s*(SELECT|RETURN|SHOW|DESCRIBE|INFO|COUNT|LET)\b/i;
export async function runQuery(sql) {
    if (!sql.trim())
        throw new SurrealDbError("Query is empty.");
    if (!READ_ONLY_RE.test(sql)) {
        throw new SurrealDbError("Only read queries (SELECT/RETURN/SHOW/DESCRIBE/INFO/COUNT/LET) are allowed through this tool.");
    }
    const res = await fetch(`${BASE}/sql`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/surql" },
        body: sql,
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 401 || res.status === 403)
        throw new SurrealDbError("SurrealDB refused auth (401/403). Check credentials.");
    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new SurrealDbError(`SurrealDB error ${res.status}: ${msg.slice(0, 200)}`);
    }
    const data = (await res.json());
    return Array.isArray(data) ? data : [data];
}
export function formatResult(rows) {
    if (rows.length === 0)
        return "Query returned no results.";
    const out = rows.slice(0, 3).map((r) => JSON.stringify(r.result ?? r).slice(0, 600)).join("\n");
    return rows.length > 3 ? `${out}\n... (${rows.length} statements)` : out;
}
// ---- muxG tools:
const SD_CRATES = "https://crates.io/api/v1/crates";
const SD_GITHUB = "https://api.github.com/repos/surrealdb/surrealdb";
const SD_LIST_CAP = 10;
async function sdJson(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "awesome-mcp/1.0 (surrealdb tooling)", Accept: "application/json" },
        signal: AbortSignal.timeout(40000),
    });
    if (res.status === 404)
        throw new SurrealDbError(`Not found: ${url.replace(/^https:\/\//, "")}`);
    if (res.status === 429)
        throw new SurrealDbError("crates.io or GitHub is rate limiting this IP. Wait a moment and try again.");
    if (!res.ok)
        throw new SurrealDbError(`Returned ${res.status} for ${url.replace(/^https:\/\//, "")}`);
    return (await res.json());
}
function sdBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
const SD_KEYWORDS = [
    { kind: "SELECT", re: /^\s*SELECT\b/i, label: "read" },
    { kind: "CREATE", re: /^\s*CREATE\b/i, label: "write" },
    { kind: "UPDATE", re: /^\s*UPDATE\b/i, label: "write" },
    { kind: "UPSERT", re: /^\s*UPSERT\b/i, label: "write" },
    { kind: "DELETE", re: /^\s*DELETE\b/i, label: "write" },
    { kind: "RELATE", re: /^\s*RELATE\b/i, label: "write" },
    { kind: "INSERT", re: /^\s*INSERT\b/i, label: "write" },
    { kind: "DEFINE", re: /^\s*DEFINE\b/i, label: "schema" },
    { kind: "REMOVE", re: /^\s*REMOVE\b/i, label: "schema" },
    { kind: "ALTER", re: /^\s*ALTER\b/i, label: "schema" },
    { kind: "INFO", re: /^\s*INFO\b/i, label: "introspection" },
    { kind: "USE", re: /^\s*USE\b/i, label: "session" },
    { kind: "BEGIN", re: /^\s*(BEGIN|START)\b/i, label: "transaction" },
    { kind: "CANCEL", re: /^\s*CANCEL\b/i, label: "transaction" },
    { kind: "BEGIN", re: /^\s*RETURN\s+(NONE|THROW|FAIL|BREAK)\b/i, label: "control" },
    { kind: "FOR", re: /^\s*FOR\b/i, label: "loop" },
    { kind: "IF", re: /^\s*(IF|ELSE)\b/i, label: "control" },
    { kind: "LET", re: /^\s*LET\b/i, label: "binding" },
    { kind: "THROW", re: /^\s*THROW\b/i, label: "control" },
    { kind: "BREAK", re: /^\s*BREAK\b/i, label: "control" },
];
/**
 * Read a SurrealQL statement without running it: what it touches, whether it is
 * safe to run against a live database, and which of the usual footguns it walks into.
 */
export async function surrealqlReview(args) {
    const q = String(args?.query ?? "").trim();
    if (!q)
        throw new SurrealDbError("query is empty. Paste the SurrealQL to review.");
    if (q.length > 20000)
        throw new SurrealDbError(`query is ${q.length} characters, over the 20000 limit. Review one statement at a time.`);
    // Split on the semicolon that ends a statement, ignoring ones inside strings.
    const statements = [];
    let current = "";
    let quote = null;
    for (let i = 0; i < q.length; i += 1) {
        const ch = q[i];
        if (quote) {
            if (ch === "\\") {
                current += ch + (q[i + 1] ?? "");
                i += 1;
                continue;
            }
            if (ch === quote)
                quote = null;
            current += ch;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === "`") {
            quote = ch;
            current += ch;
            continue;
        }
        if (ch === ";") {
            if (current.trim())
                statements.push(current.trim());
            current = "";
            continue;
        }
        current += ch;
    }
    if (current.trim())
        statements.push(current.trim());
    const findings = [];
    const lines = [
        "SurrealQL review, computed locally without executing anything",
        `${statements.length} statement(s), ${q.length} character(s) in total`,
    ];
    if (quote)
        findings.push("a string or identifier is left unterminated, so this will not parse");
    let writes = 0;
    let reads = 0;
    for (const [i, stmt] of statements.entries()) {
        const firstWord = stmt.split(/\s+/)[0].toUpperCase();
        const kind = SD_KEYWORDS.find((k) => k.re.test(stmt));
        const label = kind?.label ?? "unknown";
        if (label === "write")
            writes += 1;
        if (label === "read")
            reads += 1;
        const tables = [...stmt.matchAll(/\b(?:FROM|INTO|UPDATE|RELATE|TABLE)\s+([`\w.]+)/gi)]
            .map((m) => m[1].replace(/[`"]/g, ""))
            .filter((t) => !/^\d/.test(t));
        const n = i + 1;
        lines.push(`  ${n}. ${firstWord} — ${label}${tables.length ? ` on ${[...new Set(tables)].join(", ")}` : ""} (${stmt.split(/\s+/).length} token(s))`);
        if (/^\s*SELECT\b/i.test(stmt)) {
            if (!/\bLIMIT\b/i.test(stmt)) {
                findings.push(`statement ${n}: a SELECT with no LIMIT, which in SurrealDB streams the whole result set into memory unless the client streams it`);
            }
            if (/\bSELECT\s+\*/i.test(stmt)) {
                findings.push(`statement ${n}: SELECT * returns every field, so a later schema change silently widens the payload and can break a strict decoder`);
            }
            if (/GROUP\s+BY\s+ALL/i.test(stmt)) {
                findings.push(`statement ${n}: GROUP BY ALL is a full aggregation; on a large table it will hold every group in memory`);
            }
        }
        if (/^\s*(DELETE)\b/i.test(stmt) && !/\bWHERE\b/i.test(stmt)) {
            findings.push(`statement ${n}: DELETE with no WHERE clause removes every row in the table`);
        }
        if (/^\s*UPDATE\b/i.test(stmt) && !/\b(where|content|merge)\b/i.test(stmt)) {
            findings.push(`statement ${n}: UPDATE with no WHERE, CONTENT or MERGE clause has nothing to act on and will match nothing`);
        }
        if (/^\s*(RELATE)\b/i.test(stmt) && !/\bCONTENT\b/i.test(stmt)) {
            findings.push(`statement ${n}: RELATE with no CONTENT creates an edge with no data on it`);
        }
        if (/\bPASSWORD\b/i.test(stmt) && !/\b(RETURN\s+NONE|FOR\b)/i.test(stmt)) {
            findings.push(`statement ${n}: a DEFINE USER with a PASSWORD clause; the password is sent to the server, so keep it out of any log of this query`);
        }
        if (/^\s*USE\b/i.test(stmt)) {
            findings.push(`statement ${n}: USE changes the namespace and database for the connection, so every later statement in the same run is affected`);
        }
    }
    lines.push("", "Findings:", ...(findings.length ? findings.map((f) => `  - ${f}`) : ["  - nothing flagged"]));
    lines.push("", `Shape: ${reads} read statement(s), ${writes} write statement(s).`, "This reads the statement text only. It cannot check whether a table exists, whether a field is spelled right, or whether a permission rule would allow the statement, all of which only the server can answer. A review is a pre-flight, not a validation.");
    return lines.join("\n");
}
/** The published SurrealDB crate: how fast it moves, what it depends on and how it is licensed. */
export async function crateVersionMatrix(args) {
    const crate = String(args?.crate ?? "surrealdb").trim() || "surrealdb";
    const limit = sdBound(args?.limit, 3, SD_LIST_CAP, 8);
    const d = await sdJson(`${SD_CRATES}/${encodeURIComponent(crate)}`);
    const c = d.crate;
    if (!c)
        throw new SurrealDbError(`crates.io has no crate called "${crate}".`);
    const versions = d.versions ?? [];
    if (!versions.length)
        throw new SurrealDbError(`crates.io lists no versions for ${crate}.`);
    const newest = versions[0];
    const yanked = versions.filter((v) => v.yanked);
    const features = Object.keys(newest.features ?? {}).sort();
    const recent = versions.slice(0, limit);
    const totalRecent = versions.slice(0, 10).reduce((s, v) => s + (v.downloads ?? 0), 0);
    const top = [...versions].sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0)).slice(0, 5);
    return [
        `crates.io record for ${c.name ?? crate}`,
        c.description ?? "",
        `Latest ${c.max_version ?? "not reported"}, newest stable ${c.max_stable_version ?? "not reported"}, ${c.num_versions ?? versions.length} version(s) published`,
        `Downloads: ${(c.downloads ?? 0).toLocaleString("en-US")} all time, ${(c.recent_downloads ?? 0).toLocaleString("en-US")} in the last 90 days`,
        `Licence: ${c.license ?? newest.license ?? "not reported"} | first published ${String(c.created_at ?? "?").slice(0, 10)}, last updated ${String(c.updated_at ?? "?").slice(0, 10)}`,
        c.keywords?.length ? `Keywords: ${c.keywords.join(", ")}` : "",
        c.categories?.length ? `Categories: ${c.categories.join(", ")}` : "",
        "",
        `${features.length} cargo feature flag(s) on the latest version: ${features.slice(0, 24).join(", ")}${features.length > 24 ? `, and ${features.length - 24} more` : ""}`,
        `Latest version: ${newest.num}, ${newest.num_dependencies ?? 0} dependency crate(s), minimum Rust ${newest.rust_version ?? "not reported"}, package ${((newest.crate_size ?? 0) / 1024).toFixed(0)} kB`,
        "",
        "Most recent versions:",
        ...recent.map((v) => `  ${String(v.num ?? "?").padEnd(12)} ${String(v.created_at ?? "?").slice(0, 10)}  ${(v.downloads ?? 0).toLocaleString("en-US").padStart(10)} downloads${v.yanked ? "  YANKED" : ""}`),
        "",
        "Most downloaded of any version on the crate:",
        ...top.map((v) => `  ${String(v.num ?? "?").padEnd(12)} ${(v.downloads ?? 0).toLocaleString("en-US").padStart(12)}`),
        "",
        `${yanked.length} version(s) have been yanked. A yanked release stays on the index and can still be installed by exact version, but a fresh cargo build will not select it.`,
        "The feature flags are how the same crate is compiled for different uses; picking the wrong default set is a common way to end up with a binary missing a protocol handler.",
    ]
        .filter(Boolean)
        .join("\n");
}
/** The upstream release train, with notes, against the published crate. */
export async function releaseFeed(args) {
    const limit = sdBound(args?.limit, 1, SD_LIST_CAP, 6);
    const [releases, repo] = await Promise.all([
        sdJson(`${SD_GITHUB}/releases?per_page=${limit}`),
        sdJson(SD_GITHUB),
    ]);
    if (!releases.length)
        throw new SurrealDbError("GitHub returned no releases for surrealdb/surrealdb.");
    const gaps = [];
    for (let i = 1; i < releases.length; i += 1) {
        const a = releases[i].published_at;
        const b = releases[i - 1].published_at;
        if (a && b)
            gaps.push(Math.abs((Date.parse(b) - Date.parse(a)) / 86400000));
    }
    const clean = (s) => String(s ?? "").replace(/<!--[\s\S]*?-->/g, "").replace(/^#+\s*/gm, "").replace(/\*\*/g, "").replace(/`/g, "").trim();
    return [
        `SurrealDB releases, latest ${releases[0].tag_name ?? "?"} published ${String(releases[0].published_at ?? "?").slice(0, 10)}`,
        `${releases.filter((r) => !r.prerelease).length} stable of the ${releases.length} most recent${gaps.length ? `, ${(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1)} day(s) mean between them` : ""}`,
        repo.stargazers_count !== undefined ? `${repo.stargazers_count.toLocaleString("en-US")} stars, ${repo.forks_count ?? "?"} forks, ${repo.open_issues_count ?? "?"} open issues, licence ${repo.license?.spdx_id ?? "not reported"}, last push ${String(repo.pushed_at ?? "?").slice(0, 10)}` : "",
        "",
        ...releases.map((r) => {
            const notes = clean(r.body)
                .split("\n")
                .map((l) => l.trim())
                .filter((l) => l && !/^[-=]{3,}$/.test(l));
            return [
                `${r.tag_name ?? "?"}${r.prerelease ? " (prerelease)" : ""} — ${String(r.published_at ?? "?").slice(0, 10)}`,
                ...(notes.length ? notes.slice(0, 6).map((l) => `  ${l.slice(0, 120)}`) : ["  (no release notes)"]),
                r.html_url ?? "",
            ].filter(Boolean).join("\n");
        }),
        "",
        "A release here is the server and SDK together. The crate version and the release tag are published from the same commit, so a mismatch between the two almost always means one of them was pulled from a different branch.",
    ]
        .filter(Boolean)
        .join("\n");
}
