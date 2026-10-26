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
// The scorecard path includes the forge host, so github.com/owner/repo is the
// default and a full repository URL is accepted as written.
const REGISTRY = "https://registry.npmjs.org";
const DOWNLOADS = "https://api.npmjs.org/downloads/point/last-month";
const SCORECARD = "https://api.securityscorecards.dev/projects";
const LINEAR_UA = "linear-mcp/1.1 (https://github.com/mrfentmen/linear-mcp)";
async function publicJson(url, label) {
    let res;
    try {
        res = await fetch(url, { headers: { "User-Agent": LINEAR_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    }
    catch (e) {
        throw new LinearError(`Could not reach ${label}: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (res.status === 404)
        throw new LinearError(`${label} has no record at that address.`);
    if (!res.ok)
        throw new LinearError(`${label} returned HTTP ${res.status}.`);
    return res.json();
}
const dayGap = (a, b) => {
    const x = Date.parse(a ?? "");
    const y = Date.parse(b ?? "");
    return Number.isFinite(x) && Number.isFinite(y) ? (x - y) / 86400000 : null;
};
const median = (values) => {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
/** How much an npm package is actually used, and how alive it is. */
export async function packageAdoption(args) {
    const name = String(args?.package ?? "").trim();
    if (!name)
        throw new LinearError("Give an npm package name, for example lodash.");
    const encoded = name.startsWith("@") ? name.replace("/", "%2F") : name;
    const meta = await publicJson(`${REGISTRY}/${encoded}`, `the npm registry record for ${name}`);
    if (!meta?.name || !meta["dist-tags"])
        throw new LinearError(`${name} is not an npm package the registry knows.`);
    let downloads = null;
    try {
        const d = await publicJson(`${DOWNLOADS}/${encoded}`, `the npm download count for ${name}`);
        downloads = Number.isFinite(Number(d?.downloads)) ? Number(d.downloads) : null;
    }
    catch {
        downloads = null;
    }
    const versions = Object.keys(meta.versions ?? {});
    const times = meta.time ?? {};
    const publishedAt = versions
        .map((v) => ({ v, t: times[v] }))
        .filter((x) => x.t)
        .sort((a, b) => Date.parse(b.t) - Date.parse(a.t));
    const deprecated = versions.filter((v) => meta.versions[v]?.deprecated);
    const gaps = [];
    for (let i = 1; i < Math.min(publishedAt.length, 21); i += 1) {
        const gap = dayGap(publishedAt[i - 1].t, publishedAt[i].t);
        if (gap !== null)
            gaps.push(gap);
    }
    const tags = Object.entries(meta["dist-tags"] ?? {}).map(([k, v]) => `${k} ${v}`);
    const latestVersion = meta["dist-tags"].latest;
    const latestMeta = meta.versions?.[latestVersion] ?? {};
    const rows = [
        `${meta.name} — npm adoption and release health`,
        `  monthly downloads ${downloads === null ? "not reported by the downloads API" : downloads.toLocaleString("en-US")}`,
        `  dist-tags         ${tags.join(" | ")}`,
        `  versions          ${versions.length} published, ${deprecated.length} deprecated`,
        `  last publish      ${String(times[latestVersion] ?? "not recorded").slice(0, 10)}${publishedAt[0] ? ` (newest version ${publishedAt[0].v})` : ""}`,
        `  release cadence   ${gaps.length ? `median ${median(gaps).toFixed(1)} day(s) between the last ${gaps.length + 1} release(s)` : "too few releases to measure"}`,
        `  first published   ${String(times.created ?? "not recorded").slice(0, 10)}`,
        `  maintainers       ${(meta.maintainers ?? []).map((m) => m.name ?? m.email).filter(Boolean).join(", ") || "not published"}`,
        `  licence           ${latestMeta.license ?? "not declared"}`,
        `  dependencies      ${Object.keys(latestMeta.dependencies ?? {}).length} direct`,
    ];
    if (deprecated.length)
        rows.push(`  deprecated note   ${String(meta.versions[deprecated[0]]?.deprecated ?? "").slice(0, 160)}`);
    if (meta.description)
        rows.push(`  description       ${String(meta.description).slice(0, 200)}`);
    rows.push("", "note: monthly downloads are npm's own registry counts and count installs, not users, so CI and mirror traffic inflate them. A package with no downloads figure is one the downloads API does not track, not one nobody uses.");
    return rows.join("\n");
}
/** The OpenSSF scorecard behind a repository, worst check first. */
export async function projectScorecard(args) {
    const raw = String(args?.repo ?? "").trim().replace(/^https?:\/\//i, "").replace(/\.git$/, "").replace(/\/+$/, "");
    const limit = Math.round(Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 25));
    const parts = raw.split("/").filter(Boolean);
    if (parts.length < 3)
        throw new LinearError(`"${args.repo}" is not a repository path; give github.com/owner/repository.`);
    const host = parts[0].toLowerCase();
    if (!["github.com", "gitlab.com", "codeberg.org"].includes(host))
        throw new LinearError(`"${host}" is not a forge the scorecard API indexes; it covers github.com, gitlab.com and codeberg.org.`);
    const [owner, repo] = [parts[1], parts.slice(2).join("/")];
    const data = await publicJson(`${SCORECARD}/${host}/${owner}/${repo}`, `the scorecard for ${owner}/${repo}`);
    const card = data?.scorecard ?? {};
    const checks = Array.isArray(data?.checks) ? [...data.checks] : Array.isArray(card.checks) ? [...card.checks] : [];
    if (!checks.length)
        throw new LinearError(`The scorecard for ${owner}/${repo} carries no checks; the project may not have been scored yet.`);
    const worst = checks.filter((c) => Number(c.score) >= 0).sort((a, b) => Number(a.score) - Number(b.score));
    const unscored = checks.filter((c) => Number(c.score) < 0);
    const rows = [
        `${host}/${owner}/${repo} — OpenSSF scorecard ${Number.isFinite(Number(data?.score)) ? `${data.score}/10` : "score not published"}`,
        `  scored           ${String(data?.date ?? "date not reported").slice(0, 10)} against commit ${String(data?.repo?.commit ?? card.commit ?? "not reported").slice(0, 12)}`,
        `  checks           ${checks.length}, of which ${unscored.length} could not be scored`,
        "",
        `Worst ${Math.min(limit, worst.length)} check(s):`,
        ...worst.slice(0, limit).map((c) => `  ${String(c.score).padStart(2)}/10  ${String(c.name ?? "unnamed").padEnd(28)} ${String(c.reason ?? "").slice(0, 120)}`),
    ];
    if (unscored.length)
        rows.push("", `Not scored: ${unscored.slice(0, 6).map((c) => `${c.name} (${String(c.reason ?? "no reason given").slice(0, 60)})`).join("; ")}`);
    rows.push("", "note: the score is a supply-chain hygiene number computed from the repository's public settings, not a security audit of its code. A 10 does not mean safe and a low check may be impossible for the project to fix, which is why each reason is shown.");
    return rows.join("\n");
}
