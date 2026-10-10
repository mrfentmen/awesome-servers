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
// Rollbar records what broke. The question that always follows is whether it
// broke because of a known vulnerable dependency, and OSV answers that
// keylessly across every ecosystem, with the exact version ranges affected.
const OSV = "https://api.osv.dev/v1";
const RB_UA = "mcfentmen-rollbar-mcp/1.1 (https://github.com/mcfentmen/rollbar-mcp)";
const ECOSYSTEMS = [
    "npm", "PyPI", "Go", "Maven", "NuGet", "RubyGems", "crates.io", "Packagist",
    "Hex", "Pub", "Android", "Linux", "Debian", "Alpine", "OSS-Fuzz",
];
async function osvPost(path, body, label) {
    const res = await fetch(`${OSV}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": RB_UA },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new RollbarError(`OSV has no record matching that ${label}.`);
    if (!res.ok)
        throw new RollbarError(`OSV error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
async function osvGet(path) {
    const res = await fetch(`${OSV}${path}`, {
        headers: { Accept: "application/json", "User-Agent": RB_UA },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new RollbarError(`OSV has no record at ${path}. Check the id.`);
    if (!res.ok)
        throw new RollbarError(`OSV error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
const severityOf = (vuln) => {
    const score = vuln.severity?.[0]?.score;
    if (typeof score === "string" && score.startsWith("CVSS:"))
        return score;
    const db = vuln.database_specific?.severity ?? vuln.database_specific?.cvss;
    return typeof db === "string" ? db : "not reported";
};
/**
 * Whether a dependency version is inside a known advisory's affected range,
 * reading the range events rather than guessing from a version list. This is
 * the check that turns an error report into a security ticket.
 */
function rangeVerdict(affected, version) {
    if (!version)
        return "no version given, so the range could not be checked";
    const hits = [];
    for (const range of affected.ranges ?? []) {
        for (const event of range.events ?? []) {
            if (event.introduced && compareVersions(version, event.introduced) < 0)
                return `fixed in ${event.introduced}, so ${version} is before the vulnerability was introduced`;
            if (event.fixed && compareVersions(version, event.fixed) < 0)
                hits.push(`fixed in ${event.fixed}`);
            if (event.last_affected && compareVersions(version, event.last_affected) <= 0)
                hits.push(`last affected ${event.last_affected}`);
        }
    }
    if (!hits.length)
        return `no range event in this record marks ${version} as affected`;
    return `AFFECTED: ${[...new Set(hits)].join(", ")} (asked about ${version})`;
}
const parseVersion = (value) => String(value).split("-")[0].split(".").map((part) => Number.parseInt(part.replace(/\D.*$/, ""), 10) || 0);
function compareVersions(a, b) {
    const left = parseVersion(a);
    const right = parseVersion(b);
    for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
        const diff = (left[i] ?? 0) - (right[i] ?? 0);
        if (diff !== 0)
            return diff;
    }
    return 0;
}
/**
 * Is a package version affected by anything OSV knows about, with the CVE each
 * advisory aliases and the exact range that covers the version.
 */
export async function dependencyAudit(args) {
    const name = (args.package ?? "").trim();
    if (!name)
        throw new RollbarError("Give a package name.");
    const ecosystem = (args.ecosystem ?? "").trim();
    const key = ECOSYSTEMS.find((e) => e.toLowerCase() === ecosystem.toLowerCase());
    if (!key) {
        throw new RollbarError(`ecosystem must be one of: ${ECOSYSTEMS.join(", ")}.`);
    }
    const size = Math.min(Math.max(Number(args.limit) || 8 || 8, 1), 25);
    const query = {
        package: { name, ecosystem: key },
    };
    if (args.version)
        query.version = String(args.version).trim();
    const data = await osvPost("/query", query, "query");
    const vulns = (data.vulns ?? []).filter((v) => !v.withdrawn);
    if (!vulns.length) {
        return `${name}${args.version ? ` ${args.version}` : ""} (${key}) has no unwithdrawn advisory in OSV.`;
    }
    const affected = vulns.filter((v) => {
        if (!args.version)
            return true;
        const record = v.affected?.find((a) => a.package?.name?.toLowerCase() === name.toLowerCase());
        return record ? rangeVerdict(record, String(args.version)).startsWith("AFFECTED") || rangeVerdict(record, String(args.version)).startsWith("no range event") : true;
    });
    const shown = affected.slice(0, size);
    return [
        `OSV dependency audit: ${name}${args.version ? ` ${args.version}` : ""} (${key})`,
        `  ${vulns.length} unwithdrawn advisory/advisories reference this package, ${shown.length} shown`,
        "",
        ...shown.map((vuln) => {
            const record = vuln.affected?.find((a) => a.package?.name?.toLowerCase() === name.toLowerCase()) ?? vuln.affected?.[0];
            const fixed = (record?.ranges ?? [])
                .flatMap((r) => r.events ?? [])
                .map((e) => e.fixed)
                .filter((v) => typeof v === "string");
            return [
                `  ${vuln.id}${vuln.aliases?.length ? ` (${vuln.aliases.filter((a) => a.startsWith("CVE-")).join(", ") || vuln.aliases.join(", ")})` : ""}`,
                `    ${vuln.summary ?? "no summary"}.`,
                `    published ${String(vuln.published ?? "not reported").slice(0, 10)} | severity ${severityOf(vuln)}`,
                `    affected: ${record ? rangeVerdict(record, args.version) : "no record for this package"}`,
                fixed.length ? `    upgrade to ${[...new Set(fixed)].slice(-3).join(", ")} to clear it` : "    no fixed version is published",
            ].join("\n");
        }),
        affected.length > shown.length ? `  (+${affected.length - shown.length} more advisories)` : "",
        "",
        "Source: OSV, the Open Source Vulnerability database. A package with no advisory here is not thereby proven safe.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
/**
 * One advisory in full: its description, severity vector, the packages and
 * version ranges it covers, and the references to read about it. This is what
 * goes in the incident write-up.
 */
export async function advisoryDetail(args) {
    const id = (args.id ?? "").trim();
    if (!/^(GHSA|CVE|PYSEC|RUSTSEC|GO|OSV|MAL)-?[A-Za-z0-9._-]*$/i.test(id)) {
        throw new RollbarError("Give an OSV, GHSA or CVE identifier, e.g. GHSA-29mw-wpgm-hmr9 or CVE-2020-28500.");
    }
    const vuln = await osvGet(`/vulns/${encodeURIComponent(id)}`);
    const details = String(vuln.details ?? "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    const refs = vuln.references ?? [];
    return [
        `${vuln.id}${vuln.aliases?.length ? ` — also known as ${vuln.aliases.join(", ")}` : ""}`,
        `  ${vuln.summary ?? "no summary published"}`,
        `  published ${String(vuln.published ?? "not reported").slice(0, 10)} | last modified ${String(vuln.modified ?? "not reported").slice(0, 10)}`,
        vuln.withdrawn ? `  WITHDRAWN ${String(vuln.withdrawn).slice(0, 10)}: treat this advisory as no longer applicable` : "",
        `  severity: ${severityOf(vuln)}`,
        "",
        `Affected packages (${vuln.affected?.length ?? 0}):`,
        ...(vuln.affected ?? []).map((affected) => {
            const events = (affected.ranges ?? []).flatMap((r) => r.events ?? []);
            const introduced = events.find((e) => e.introduced)?.introduced;
            const fixed = events.filter((e) => e.fixed).map((e) => e.fixed);
            return [
                `  ${affected.package?.name ?? "unnamed"} (${affected.package?.ecosystem ?? "ecosystem not reported"}${affected.package?.purl ? `, ${affected.package.purl}` : ""})`,
                `    from ${introduced ?? "version not stated"}${fixed.length ? ` until ${[...new Set(fixed)].join(" or ")}` : ", no fixed version published"}`,
                affected.versions?.length ? `    ${affected.versions.length} version(s) enumerated explicitly` : "    versions are given as a range, not enumerated",
            ].join("\n");
        }),
        "",
        details ? `Description:\n${details.slice(0, 1400)}${details.length > 1400 ? "…" : ""}` : "Description: none published.",
        "",
        `References (${refs.length}):`,
        ...refs.slice(0, 8).map((r) => `  ${String(r.type ?? "reference").padEnd(10)} ${String(r.url ?? "not reported").slice(0, 110)}`),
        refs.length > 8 ? `  (+${refs.length - 8} more)` : "",
        "",
        "Source: OSV, which aggregates the GitHub Advisory Database, PyPA, RustSec, Go and the other upstream trackers.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
