export class PhError extends Error {
    constructor(message) {
        super(message);
        this.name = "PhError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.PRODUCTHUNT_TOKEN;
    if (!k)
        throw new PhError("Set PRODUCTHUNT_TOKEN (Product Hunt OAuth token).");
    return k;
}
async function gql(query, variables = {}) {
    let res;
    try {
        res = await fetch("https://api.producthunt.com/v2/api/graphql", {
            method: "POST",
            headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${key()}` },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new PhError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new PhError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 12000);
}
export function viewer() {
    return gql("query { viewer { user { name username } } }");
}
export function listPosts(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return gql("query($n: Int!) { posts(first: $n, order: RANKING) { edges { node { name tagline votesCount url } } } }", { n });
}
// ---- muxF tools:
// Launch research reads two keyless indexes — Hacker News (Algolia) and GitHub —
// so it works without a Product Hunt token.
const HN = "https://hn.algolia.com/api/v1";
const GH = "https://api.github.com";
const PUBLIC_UA = { "User-Agent": "producthunt-mcp/1.1", Accept: "application/json" };
async function publicJson(url, what) {
    let res;
    try {
        res = await fetch(url, { headers: PUBLIC_UA, signal: AbortSignal.timeout(25000) });
    }
    catch (e) {
        throw new PhError(`Network error while reading ${what}: ${e.message}`);
    }
    if (res.status === 403 || res.status === 429)
        throw new PhError(`${what} rate-limited this request (HTTP ${res.status}). It allows a limited number of anonymous calls; wait and retry.`);
    if (res.status === 404)
        throw new PhError(`${what} has nothing at that address (404).`);
    if (!res.ok)
        throw new PhError(`${what} answered HTTP ${res.status}.`);
    return { data: await res.json(), headers: res.headers };
}
const dayAge = (iso) => {
    const t = Date.parse(String(iso ?? ""));
    return Number.isFinite(t) ? Math.max(0, Math.round((Date.now() - t) / 86400000)) : null;
};
export async function showHnLaunches(args) {
    const days = Math.min(Math.max(Math.trunc(Number(args.days ?? 30)) || 30, 1), 3650);
    const limit = Math.min(Math.max(Math.trunc(Number(args.limit ?? 15)) || 15, 1), 30);
    const minPoints = args.min_points === undefined || args.min_points === null ? null : Math.max(0, Math.trunc(Number(args.min_points)));
    const cutoff = Math.floor((Date.now() - days * 86400000) / 1000);
    const filters = [`created_at_i>${cutoff}`];
    if (minPoints !== null && Number.isFinite(minPoints))
        filters.push(`points>=${minPoints}`);
    const url = `${HN}/search_by_date?tags=show_hn&hitsPerPage=${limit}&numericFilters=${encodeURIComponent(filters.join(","))}`;
    const { data } = await publicJson(url, "Hacker News");
    const hits = Array.isArray(data.hits) ? data.hits : [];
    if (!hits.length)
        throw new PhError(`Show HN posted nothing in the last ${days} day(s)${minPoints !== null ? ` with at least ${minPoints} point(s)` : ""}.`);
    const rows = hits.slice(0, limit);
    const totalPoints = rows.reduce((s, h) => s + (Number(h.points) || 0), 0);
    const lines = [
        `Show HN launches in the last ${days} day(s)${minPoints !== null ? ` with ${minPoints}+ point(s)` : ""} — ${rows.length} of ${data.nbHits ?? rows.length} match(es)`,
        `  ${totalPoints} point(s) and ${rows.reduce((s, h) => s + (Number(h.num_comments) || 0), 0)} comment(s) across them`,
        "",
    ];
    rows.forEach((h, i) => {
        const title = String(h.title ?? "(untitled)");
        lines.push(`${i + 1}. ${title} — ${Number(h.points) || 0} point(s), ${Number(h.num_comments) || 0} comment(s)`);
        lines.push(`   by ${h.author ?? "unknown"}, ${dayAge(h.created_at)} day(s) ago`);
        if (h.url)
            lines.push(`   Link: ${h.url}`);
        lines.push(`   Thread: https://news.ycombinator.com/item?id=${h.objectID}`);
    });
    lines.push("", "Show HN is self-submitted: points measure attention on a tech forum, not revenue or retention.");
    return lines.join("\n");
}
function parseRepo(input) {
    const raw = String(input ?? "").trim();
    const fromUrl = raw.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
    const cleaned = fromUrl ? `${fromUrl[1]}/${fromUrl[2]}` : raw.replace(/^\/+|\/+$/g, "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(cleaned))
        throw new PhError(`"${raw}" is not owner/repository, e.g. 'vercel/next.js'.`);
    return cleaned.replace(/\.git$/i, "");
}
export async function githubFootprint(input) {
    const full = parseRepo(typeof input === "object" ? input?.repo : input);
    const repo = (await publicJson(`${GH}/repos/${full}`, "GitHub")).data;
    let contributors = null;
    try {
        const page = await publicJson(`${GH}/repos/${full}/contributors?per_page=1&anon=1`, "GitHub");
        const link = page.headers.get("link") ?? "";
        const last = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
        contributors = last ? Number(last[1]) : Array.isArray(page.data) ? page.data.length : null;
    }
    catch {
        contributors = null;
    }
    let releases = [];
    try {
        const rel = await publicJson(`${GH}/repos/${full}/releases?per_page=5`, "GitHub");
        releases = Array.isArray(rel.data) ? rel.data : [];
    }
    catch {
        releases = [];
    }
    const pushed = dayAge(repo.pushed_at);
    const lines = [
        `${repo.full_name ?? full}${repo.archived ? " (archived)" : ""}`,
        repo.description ? `  ${repo.description}` : "  (no description)",
        "",
        `Stars ${repo.stargazers_count ?? 0} | forks ${repo.forks_count ?? 0} | watchers ${repo.subscribers_count ?? 0}`,
        `Open issues ${repo.open_issues_count ?? 0}${contributors !== null ? ` | contributors ${contributors}` : ""}`,
        `Language ${repo.language ?? "not stated"} | licence ${repo.license?.spdx_id ?? "none published"}`,
        `Created ${String(repo.created_at ?? "").slice(0, 10)} | last push ${String(repo.pushed_at ?? "").slice(0, 10)}${pushed !== null ? ` (${pushed} day(s) ago)` : ""}`,
        `Default branch ${repo.default_branch ?? "unknown"} | home ${repo.homepage || "none"}`,
        repo.topics?.length ? `Topics: ${repo.topics.join(", ")}` : "Topics: none published",
        "",
        releases.length ? `Recent releases (${releases.length}):` : "Releases: none published",
        ...releases.map((r, i) => `  ${i + 1}. ${r.tag_name ?? "(untagged)"}${r.name && r.name !== r.tag_name ? ` — ${r.name}` : ""} | ${String(r.published_at ?? "").slice(0, 10)}`),
        "",
        "Anonymous GitHub access is capped at 60 requests an hour, so a burst of these calls can be refused rather than wrong.",
    ];
    return lines.join("\n");
}
export async function competitiveScan(args) {
    const query = String(args.query ?? "").trim();
    if (!query)
        throw new PhError("Give a topic to scan for, e.g. 'local first sync'.");
    const limit = Math.min(Math.max(Math.trunc(Number(args.limit ?? 10)) || 10, 1), 25);
    const language = String(args.language ?? "").trim();
    const q = `${query} in:name,description,readme${language ? ` language:${language}` : ""}`;
    const { data } = await publicJson(`${GH}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${limit}`, "GitHub search");
    const rows = Array.isArray(data.items) ? data.items : [];
    if (!rows.length)
        throw new PhError(`GitHub has no repository matching "${query}"${language ? ` in ${language}` : ""}.`);
    const lines = [
        `Open-source projects already covering "${query}"${language ? ` in ${language}` : ""} — ${rows.length} of ${data.total_count ?? rows.length} match(es)`,
        "",
    ];
    rows.forEach((r, i) => {
        const pushed = dayAge(r.pushed_at);
        lines.push(`${i + 1}. ${r.full_name} — ${r.stargazers_count ?? 0} star(s), ${r.forks_count ?? 0} fork(s)`);
        lines.push(`   ${r.description ?? "(no description)"}`);
        lines.push(`   ${r.language ?? "language not stated"} | ${r.license?.spdx_id ?? "no licence"} | last push ${String(r.pushed_at ?? "").slice(0, 10)}${pushed !== null ? ` (${pushed}d)` : ""}`);
        lines.push(`   ${r.html_url ?? `https://github.com/${r.full_name}`}`);
    });
    lines.push("", `Ranked by stars, which measures attention rather than fitness: ${data.incomplete_results ? "GitHub flagged this result set as incomplete." : "read the repositories before assuming they solve the same problem."}`);
    return lines.join("\n");
}
