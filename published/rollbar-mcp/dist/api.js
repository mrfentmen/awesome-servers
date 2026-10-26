export class RollbarError extends Error {
    constructor(message) {
        super(message);
        this.name = "RollbarError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function token() {
    const k = process.env.ROLLBAR_ACCESS_TOKEN;
    if (!k)
        throw new RollbarError("Set ROLLBAR_ACCESS_TOKEN (free Rollbar tier).");
    return k;
}
async function get(path) {
    const sep = path.includes("?") ? "&" : "?";
    let res;
    try {
        res = await fetch(`https://api.rollbar.com/api/1${path}${sep}access_token=${encodeURIComponent(token())}`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new RollbarError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new RollbarError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function listProjects() {
    return get("/projects/");
}
export function listItems(projectId) {
    return get(`/projects/${encodeURIComponent(projectId)}/items/`);
}
export function getItem(projectId, itemId) {
    return get(`/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/`);
}
// ---- muxH tools:
// Rollbar reports the errors you already have. These two read OSV.dev, the
// vulnerability database Google runs, which is keyless, and answer the two
// questions before an incident: is the version we ship inside a known bad
// range, and what exactly does one advisory cover.
const OSV = "https://api.osv.dev/v1";
const OSV_UA = "rollbar-mcp/1.1 (https://github.com/mrfentmen/rollbar-mcp)";
const ECOSYSTEMS = ["npm", "PyPI", "Go", "Maven", "NuGet", "RubyGems", "crates.io", "Packagist", "Hex", "Pub", "Android", "Linux", "Debian", "Alpine"];
async function osv(path, init) {
    let res;
    try {
        res = await fetch(`${OSV}${path}`, {
            ...init,
            headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": OSV_UA },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new RollbarError(`Could not reach OSV.dev: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (res.status === 404)
        return null;
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new RollbarError(`OSV returned HTTP ${res.status}: ${body}`);
    }
    return res.json();
}
function verParts(v) {
    return String(v ?? "").trim().replace(/^v/i, "").split(/[.+_\-~]/).filter((s) => s !== "").map((s) => (/^\d+$/.test(s) ? Number(s) : s));
}
function cmpVer(a, b) {
    const pa = verParts(a);
    const pb = verParts(b);
    const n = Math.max(pa.length, pb.length);
    for (let i = 0; i < n; i += 1) {
        const x = pa[i];
        const y = pb[i];
        if (x === undefined)
            return -1;
        if (y === undefined)
            return 1;
        if (typeof x === "number" && typeof y === "number") {
            if (x !== y)
                return x < y ? -1 : 1;
            continue;
        }
        if (typeof x === "number")
            return -1;
        if (typeof y === "number")
            return 1;
        if (x !== y)
            return x < y ? -1 : 1;
    }
    return 0;
}
function severityOf(vuln) {
    const db = vuln?.database_specific ?? {};
    if (typeof db.severity === "string")
        return db.severity.toUpperCase();
    const cvss = Array.isArray(vuln?.severity) ? vuln.severity.find((s) => typeof s?.score === "string") : null;
    if (cvss) {
        const numeric = cvss.score.match(/^\d+(\.\d+)?$/);
        return numeric ? `${cvss.score} (${cvss.type ?? "CVSS"})` : `${cvss.type ?? "CVSS"} ${cvss.score}`;
    }
    return "unscored";
}
function rangesFor(vuln, name, ecosystem) {
    const out = [];
    for (const aff of vuln?.affected ?? []) {
        const pkg = aff?.package ?? {};
        if (name && pkg.name && pkg.name.toLowerCase() !== name.toLowerCase())
            continue;
        if (ecosystem && pkg.ecosystem && pkg.ecosystem.toLowerCase() !== ecosystem.toLowerCase())
            continue;
        for (const range of aff?.ranges ?? []) {
            out.push({ type: range.type ?? "ECOSYSTEM", events: range.events ?? [], pkg });
        }
        if (!(aff?.ranges ?? []).length)
            out.push({ type: "VERSIONS", events: [], pkg, versions: aff?.versions ?? [] });
    }
    return out;
}
function verdictFor(ranges, version) {
    let affected = false;
    const fixes = [];
    let introduced = null;
    for (const range of ranges) {
        if (Array.isArray(range.versions) && range.versions.includes(version)) {
            affected = true;
            continue;
        }
        let inside = false;
        for (const ev of range.events) {
            if (ev.introduced !== undefined) {
                if (ev.introduced === "0" || cmpVer(version, ev.introduced) >= 0) {
                    inside = true;
                    if (introduced === null)
                        introduced = ev.introduced;
                }
            }
            else if (ev.fixed !== undefined) {
                if (cmpVer(version, ev.fixed) >= 0)
                    inside = false;
                else if (cmpVer(ev.fixed, version) > 0)
                    fixes.push(ev.fixed);
            }
            else if (ev.last_affected !== undefined) {
                if (cmpVer(version, ev.last_affected) > 0)
                    inside = false;
                else
                    affected = true;
            }
            else if (ev.limit !== undefined) {
                if (cmpVer(version, ev.limit) >= 0)
                    inside = false;
            }
        }
        if (inside)
            affected = true;
    }
    fixes.sort(cmpVer);
    return { affected, fixed: fixes[0] ?? null, introduced };
}
const renderEvents = (events) => events.length
    ? events.map((ev) => {
        if (ev.introduced !== undefined)
            return `introduced ${ev.introduced}`;
        if (ev.fixed !== undefined)
            return `fixed ${ev.fixed}`;
        if (ev.last_affected !== undefined)
            return `last affected ${ev.last_affected}`;
        if (ev.limit !== undefined)
            return `limit ${ev.limit}`;
        return "unknown event";
    }).join(", ")
    : "no range events";
/**
 * One package version against the whole OSV database, with the verdict read
 * from the range events rather than guessed from the advisory text.
 */
export async function dependencyAudit(args) {
    const name = String(args?.package ?? "").trim();
    if (!name)
        throw new RollbarError("Give a package name, for example lodash.");
    const wanted = String(args?.ecosystem ?? "npm").trim();
    const ecosystem = ECOSYSTEMS.find((e) => e.toLowerCase() === wanted.toLowerCase());
    if (!ecosystem)
        throw new RollbarError(`"${wanted}" is not an OSV ecosystem. Use one of ${ECOSYSTEMS.join(", ")}.`);
    const version = String(args?.version ?? "").trim() || null;
    const limit = Math.round(Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 25));
    const payload = { package: { name, ecosystem } };
    if (version)
        payload.version = version;
    const body = await osv("/query", { method: "POST", body: JSON.stringify(payload) });
    const vulns = body?.vulns ?? [];
    const rows = [`OSV audit of ${name} (${ecosystem})${version ? ` at ${version}` : ""}`, ""];
    if (!vulns.length) {
        rows.push(`No advisory in OSV covers ${name} (${ecosystem})${version ? ` at ${version}` : ""}.`);
        rows.push("", "note: OSV aggregates the GitHub Advisory Database, PyPA, RustSec, Go VulnDB and others; absence here means no published advisory, not that the code is safe.");
        return rows.join("\n");
    }
    let affectedCount = 0;
    for (const vuln of vulns.slice(0, limit)) {
        const ranges = rangesFor(vuln, name, ecosystem);
        const verdict = version ? verdictFor(ranges, version) : null;
        if (verdict?.affected)
            affectedCount += 1;
        const aliases = (vuln.aliases ?? []).join(", ") || "none";
        rows.push(`  ${vuln.id} — ${severityOf(vuln)} — ${String(vuln.summary ?? "(no summary)").slice(0, 140)}`);
        if (verdict) {
            if (verdict.affected)
                rows.push(`    ${version} IS affected${verdict.fixed ? `; fixed in ${verdict.fixed}` : "; no fixed version published"}`);
            else
                rows.push(`    ${version} is not inside the affected range${verdict.fixed ? ` (fix released in ${verdict.fixed})` : ""}`);
        }
        rows.push(`    ranges: ${ranges.length ? ranges.map((r) => `${r.type}: ${renderEvents(r.events)}`).join(" | ") : "none published"}`);
        rows.push(`    aliases: ${aliases}`);
    }
    if (vulns.length > limit)
        rows.push(`  ... ${vulns.length - limit} further advisory(ies); raise limit to see them`);
    rows.push("", version
        ? `${affectedCount} of the ${Math.min(vulns.length, limit)} listed advisory(ies) cover ${name}@${version}.`
        : `${vulns.length} advisory(ies) exist for ${name}; pass version to get a verdict for what you ship.`);
    rows.push("", "note: verdicts are computed from OSV's range events with a segment-wise version comparison, which orders pre-release and build tags more simply than each ecosystem's own resolver — treat a boundary case as worth a manual read.");
    return rows.join("\n");
}
/**
 * One advisory, in full, including every package and range it covers.
 */
export async function advisoryDetail(args) {
    const id = String(args?.id ?? "").trim();
    if (!id)
        throw new RollbarError("Give an advisory id, for example GHSA-29mw-wpgm-hmr9 or CVE-2021-23337.");
    const vuln = await osv(`/vulns/${encodeURIComponent(id)}`);
    if (!vuln)
        throw new RollbarError(`OSV has no record for "${id}". It accepts OSV, GHSA and CVE identifiers.`);
    const rows = [
        `${vuln.id} — ${severityOf(vuln)}`,
        `  ${String(vuln.summary ?? "(no summary)").replace(/\s+/g, " ")}`,
        `  aliases      ${(vuln.aliases ?? []).join(", ") || "none"}`,
        `  published    ${vuln.published ?? "not published"}`,
        `  modified     ${vuln.modified ?? "not published"}`,
        `  withdrawn    ${vuln.withdrawn ?? "no (still current)"}`,
    ];
    const affected = vuln.affected ?? [];
    rows.push(`  packages     ${affected.length}`);
    for (const aff of affected) {
        const pkg = aff.package ?? {};
        rows.push(`    ${pkg.name ?? "(unnamed)"} (${pkg.ecosystem ?? "unknown"})${pkg.purl ? ` ${pkg.purl}` : ""}`);
        for (const range of aff.ranges ?? []) {
            rows.push(`      ${range.type ?? "ECOSYSTEM"}: ${renderEvents(range.events ?? [])}`);
        }
        if ((aff.ranges ?? []).length === 0 && (aff.versions ?? []).length)
            rows.push(`      explicit versions: ${aff.versions.slice(0, 12).join(", ")}${aff.versions.length > 12 ? ` … (+${aff.versions.length - 12})` : ""}`);
    }
    const desc = String(vuln.details ?? "").replace(/\r/g, "").trim();
    if (desc)
        rows.push("", "Description:", ...desc.split("\n").slice(0, 24).map((l) => `  ${l}`));
    const refs = vuln.references ?? [];
    if (refs.length) {
        rows.push("", "References:");
        for (const ref of refs.slice(0, 12))
            rows.push(`  ${ref.type ?? "WEB"}  ${ref.url}`);
    }
    rows.push("", "note: read live from OSV.dev; the description is the maintainers' own text and is quoted rather than paraphrased.");
    return rows.join("\n");
}
