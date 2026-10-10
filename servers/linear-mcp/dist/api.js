export class LinearError extends Error {
    constructor(message) {
        super(message);
        this.name = "LinearError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.LINEAR_API_KEY;
    if (!k)
        throw new LinearError("Set LINEAR_API_KEY (Linear personal key).");
    return k;
}
async function gql(query, variables = {}) {
    let res;
    try {
        res = await fetch("https://api.linear.app/graphql", {
            method: "POST",
            headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: key() },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new LinearError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new LinearError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 12000);
}
export function me() {
    return gql("query { viewer { id name email } }");
}
export function listTeams() {
    return gql("query { teams { nodes { id name key } } }");
}
export function searchIssues(term, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return gql("query($t: String!, $n: Int!) { searchIssues(term: $t, first: $n) { nodes { id identifier title state { name } } } }", { t: term, n });
}
export function getIssue(issueId) {
    return gql("query($id: String!) { issue(id: $id) { id identifier title description state { name } } }", { id: issueId });
}
export function teamIssues(teamId, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return gql("query($t: String!, $n: Int!) { team(id: $t) { issues(first: $n) { nodes { id identifier title state { name } } } } }", { t: teamId, n });
}
export function listProjects() {
    return gql("query { projects(first: 20) { nodes { id name state } } }");
}
export function myIssues(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return gql("query($n: Int!) { viewer { assignedIssues(first: $n) { nodes { id identifier title state { name } } } } }", { n });
}
export function listLabels(teamId) {
    return gql("query($t: String!) { team(id: $t) { labels(first: 50) { nodes { id name color } } } }", { t: teamId });
}
export function createIssue(teamId, title, description) {
    return gql("mutation($t: String!, $ti: String!, $d: String) { issueCreate(input: { teamId: $t, title: $ti, description: $d }) { success issue { id identifier } } }", { t: teamId, ti: title, d: description ?? "" });
}
export function updateIssueTitle(issueId, title) {
    return gql("mutation($id: String!, $ti: String!) { issueUpdate(id: $id, input: { title: $ti }) { success issue { id identifier title } } }", { id: issueId, ti: title });
}
// ---- muxG tools:
const NPM_DOWNLOADS = "https://api.npmjs.org/downloads";
const NPM_REGISTRY = "https://registry.npmjs.org";
const SCORECARD = "https://api.securityscorecards.dev/projects";
const npmName = (input) => {
    const name = String(input ?? "").trim();
    if (!/^(@?[a-z0-9][a-z0-9._-]{0,213})$/i.test(name) || name.includes("..")) {
        throw new Error(`"${input}" is not an npm package name.`);
    }
    return name;
};
async function linearJson(url) {
    const res = await fetch(url, { headers: { ...UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 404)
        throw new Error(`Upstream returned 404 for ${new URL(url).pathname}`);
    if (!res.ok)
        throw new Error(`Upstream returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new Error("Upstream returned an empty body.");
    return JSON.parse(text);
}
/** How much a package is actually used, and how recently it shipped: the adoption signal a tracker cannot see. */
export async function packageAdoption(args) {
    const name = npmName(args?.package);
    const [registry, downloads] = await Promise.all([
        linearJson(`${NPM_REGISTRY}/${encodeURIComponent(name)}`),
        linearJson(`${NPM_DOWNLOADS}/point/last-month/${encodeURIComponent(name)}`).catch(() => ({ downloads: undefined })),
    ]);
    const tags = registry["dist-tags"] ?? {};
    const latest = tags.latest ?? Object.keys(registry.versions ?? {}).pop();
    const times = registry.time ?? {};
    const published = latest ? times[latest] : undefined;
    const ageDays = published ? Math.round((Date.now() - Date.parse(published)) / 86_400_000) : null;
    const versions = Object.keys(registry.versions ?? {});
    const deprecated = versions.filter((version) => Boolean(registry.versions?.[version]?.deprecated));
    const releases = Object.entries(times)
        .filter(([version]) => /^\d+\.\d+\.\d+$/.test(version) && times[version])
        .sort((a, b) => Date.parse(a[1]) - Date.parse(b[1]));
    const lines = [
        `${name} on npm`,
        registry.description ? `  ${String(registry.description).slice(0, 200)}` : "  no description published",
        `  latest tag ${latest ?? "not reported"}${published ? `, published ${published.slice(0, 10)}${ageDays !== null ? ` (${ageDays} day(s) ago)` : ""}` : ""}`,
        `  dist-tags: ${Object.entries(tags).map(([tag, version]) => `${tag}=${version}`).join(", ") || "none published"}`,
        `  versions published: ${versions.length}${releases.length > 1 ? `, first ${releases[0][0]} on ${String(releases[0][1]).slice(0, 10)}, most recent before latest on ${String(releases[releases.length - 1][0] === latest ? releases[releases.length - 2][1] : releases[releases.length - 1][1]).slice(0, 10)}` : ""}`,
    ];
    if (typeof downloads.downloads === "number") {
        const perDay = downloads.downloads / 30;
        lines.push(`  npm downloads in the month to ${downloads.end ?? "not reported"}: ${downloads.downloads.toLocaleString("en-US")} (about ${Math.round(perDay).toLocaleString("en-US")} a day)`);
    }
    else {
        lines.push("  npm download count: not reported by the registry for this package");
    }
    if (deprecated.length) {
        lines.push(`  deprecated versions: ${deprecated.length}${deprecated.length <= 5 ? ` (${deprecated.join(", ")})` : ""}`);
    }
    if (registry.maintainers?.length)
        lines.push(`  maintainers: ${registry.maintainers.slice(0, 5).map((m) => m.name ?? "?").join(", ")}`);
    if (registry.homepage)
        lines.push(`  homepage: ${String(registry.homepage).slice(0, 120)}`);
    return lines.join("\n");
}
// The scorecard path includes the forge host, so github.com/owner/repo is the
// default and a full repository URL is accepted as written.
const scorecardPath = (input) => {
    const value = String(input ?? "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (/^[\w.-]+\/[\w.-]+$/.test(value))
        return `github.com/${value}`;
    if (/^[\w.-]+\/[\w.-]+\/[\w.-]+$/.test(value))
        return value;
    throw new Error(`"${input}" is not an owner/repository pair, or a repository URL on a forge host.`);
};
/** The OpenSSF scorecard for a repository: an aggregate supply-chain score and the checks behind it. */
export async function projectScorecard(args) {
    const path = scorecardPath(args?.repo);
    const repo = path.split("/").slice(1).join("/");
    const n = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 25);
    const data = await linearJson(`${SCORECARD}/${path}`);
    const checks = Array.isArray(data.checks) ? data.checks : [];
    if (!checks.length)
        throw new Error(`The OpenSSF scorecard has no checks for ${repo}.`);
    const ranked = [...checks].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const failing = ranked.filter((check) => (check.score ?? 0) < 5);
    const lines = [
        `OpenSSF scorecard for ${data.repo?.name ?? repo}: ${data.score ?? "not reported"} out of 10, scored ${String(data.date ?? "date not reported").slice(0, 10)}`,
        `${failing.length} of ${checks.length} check(s) score below 5, so those are the ones to read first.`,
        "",
    ];
    for (const check of ranked.slice(0, n)) {
        lines.push(`  ${check.name ?? "unnamed check"}: ${check.score ?? "not reported"}/10`);
        if (check.reason)
            lines.push(`     ${String(check.reason).slice(0, 200)}`);
    }
    if (ranked.length > n)
        lines.push(`  ...and ${ranked.length - n} more check(s).`);
    lines.push("");
    lines.push("The scorecard is automated, so a low check score means a missing control, not a hostile maintainer. Read the reasons before drawing a conclusion.");
    return lines.join("\n");
}
