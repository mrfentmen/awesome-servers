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
// ---- muxH tools:
// The tools above read the authenticated Product Hunt feed for one account.
// These two read the other launch surfaces, keylessly: what the Hacker News
// Show HN feed has launched and how it scored, and the public GitHub footprint
// of a project, which is the only place a launch's adoption is verifiable.
const HN_SEARCH = "https://hn.algolia.com/api/v1/search";
const GITHUB = "https://api.github.com";
const PH_UA = "producthunt-mcp/1.1 (https://github.com/mrfentmen/producthunt-mcp)";
async function phGet(url, label = "upstream") {
    const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": PH_UA }, signal: AbortSignal.timeout(25000) });
    if (res.status === 403)
        throw new PhError(`${label} rate-limited this host. Try again shortly.`);
    if (res.status === 422)
        throw new PhError(`${label} rejected the query.`);
    if (!res.ok)
        throw new PhError(`${label} error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
const hnLink = (hit) => `https://news.ycombinator.com/item?id=${hit.objectID ?? "?"}`;
const ghAge = (date) => {
    if (!date)
        return "not reported";
    const days = Math.floor((Date.now() - Date.parse(date)) / 86400000);
    if (!Number.isFinite(days))
        return "not reported";
    return days < 1 ? "today" : `${days} day(s) ago`;
};
/**
 * What the Show HN feed has launched lately and how each launch actually scored.
 * A product that cleared a thousand points here has been tried by a thousand
 * developers, which is a very different signal from a like count.
 */
export async function showHnLaunches(args) {
    const days = Math.min(Math.max(Math.trunc(args.days ?? 30), 1), 3650);
    const minPoints = Math.min(Math.max(Math.trunc(args.minPoints ?? 0), 0), 5000);
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 15), 1), 30);
    const since = Math.floor(Date.now() / 1000) - days * 86400;
    const filters = [`created_at_i>${since}`];
    if (minPoints > 0)
        filters.push(`points>${minPoints}`);
    const params = new URLSearchParams({ tags: "show_hn", hitsPerPage: String(size), numericFilters: filters.join(",") });
    const data = await phGet(`${HN_SEARCH}?${params}`, "Hacker News");
    const hits = (data.hits ?? []).filter((hit) => hit.title);
    if (!hits.length) {
        throw new PhError(`No Show HN launch in the last ${days} day(s) cleared ${minPoints} point(s).`);
    }
    const withUrl = hits.filter((h) => typeof h.url === "string" && !/news\.ycombinator\.com\/vote/.test(String(h.url)));
    const points = hits.map((h) => h.points ?? 0);
    const totalPoints = points.reduce((a, b) => a + b, 0);
    const totalComments = hits.reduce((sum, h) => sum + (h.num_comments ?? 0), 0);
    return [
        `Show HN launches, last ${days} day(s)${minPoints ? ` with at least ${minPoints} points` : ""}`,
        `  ${data.nbHits ?? hits.length} launch(es) in the window, showing ${hits.length}`,
        `  ${totalPoints.toLocaleString()} points and ${totalComments.toLocaleString()} comments across the page`,
        "",
        ...hits.map((hit, i) => {
            const title = String(hit.title).replace(/^Show HN:\s*/i, "");
            return [
                `${String(i + 1).padStart(2)}. ${title.slice(0, 84)}`,
                `    ${hit.points ?? 0} points, ${hit.num_comments ?? 0} comments, by ${hit.author ?? "unknown"}, ${String(hit.created_at ?? "").slice(0, 10)}`,
                `    ${hnLink(hit)}`,
                typeof hit.url === "string" && !/news\.ycombinator\.com\/vote/.test(hit.url) ? `    ${hit.url.slice(0, 100)}` : "    no external link posted",
            ].join("\n");
        }),
        "",
        `${withUrl.length} of ${hits.length} posted a link outside Hacker News.`,
        "Source: the public Hacker News search API (Algolia), no account needed.",
    ].join("\n");
}
/**
 * The public GitHub footprint of a project: stars, forks, contributors, open
 * issues, licence and when it was last pushed. A launch page claims traction;
 * this is what the repository says.
 */
export async function githubFootprint(args) {
    const repo = (args.repo ?? "").trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
    const parts = repo.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new PhError(`Give an owner/repository, e.g. 'vercel/next.js' or a full github.com URL.`);
    }
    const path = `${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`;
    let data;
    try {
        data = await phGet(`${GITHUB}/repos/${path}`, "GitHub");
    }
    catch (e) {
        if (e instanceof PhError && /rate-limited/.test(e.message))
            throw e;
        throw new PhError(`GitHub has no public repository at ${parts[0]}/${parts[1]}.`);
    }
    if (!data.full_name)
        throw new PhError(`GitHub returned no repository record for ${parts[0]}/${parts[1]}.`);
    const releases = await phGet(`${GITHUB}/repos/${path}/releases?per_page=3`).catch(() => []);
    const contributors = await phGet(`${GITHUB}/repos/${path}/contributors?per_page=1&anon=false`).catch(() => []);
    let contributorCount = null;
    try {
        const link = await fetch(`${GITHUB}/repos/${path}/contributors?per_page=1&anon=false`, { headers: { "User-Agent": PH_UA } });
        const last = link.headers.get("link") ?? "";
        const match = /[?&]page=(\d+)>; rel="last"/.exec(last);
        if (match)
            contributorCount = Number(match[1]);
    }
    catch {
        contributorCount = null;
    }
    const daysOld = data.created_at ? Math.floor((Date.now() - Date.parse(data.created_at)) / 86400000) : null;
    const stars = data.stargazers_count ?? 0;
    const forks = data.forks_count ?? 0;
    const issues = data.open_issues_count ?? 0;
    const contributorsOnPage = contributors.length;
    return [
        `GitHub footprint: ${data.full_name}`,
        `  ${stars.toLocaleString()} stars | ${forks.toLocaleString()} forks | ${issues.toLocaleString()} open issues and pull requests`,
        contributorCount === null
            ? `  contributors: ${contributorsOnPage ? `at least ${contributorsOnPage}, count not reported by GitHub` : "not reported"}`
            : `  contributors: ${contributorCount.toLocaleString()}`,
        `  watchers/subscribers: ${(data.subscribers_count ?? 0).toLocaleString()}`,
        "",
        `  primary language: ${data.language ?? "not reported"} | licence: ${data.license?.spdx_id ?? data.license?.name ?? "not reported"}`,
        `  created ${data.created_at?.slice(0, 10) ?? "not reported"}${daysOld === null ? "" : ` (${daysOld} day(s) ago)`}`,
        `  last pushed ${data.pushed_at?.slice(0, 10) ?? "not reported"} (${ghAge(data.pushed_at)})`,
        data.archived === true ? "  the repository is archived and no longer maintained" : "",
        "",
        `  description: ${data.description ? data.description.slice(0, 220) : "none given"}`,
        `  homepage: ${data.homepage ?? "not set"}`,
        `  topics: ${(data.topics ?? []).slice(0, 12).join(", ") || "none set"}`,
        "",
        `  releases: ${releases.length ? releases.map((r) => `${r.tag_name ?? r.name ?? "untagged"} (${(r.published_at ?? "").slice(0, 10)})`).join(", ") : "none published on GitHub"}`,
        `  ${data.html_url ?? `https://github.com/${data.full_name}`}`,
        "",
        stars > 0 && forks / Math.max(stars, 1) > 0.2
            ? `Fork ratio ${((forks / Math.max(stars, 1)) * 100).toFixed(0)}% of stars, which is high enough to be worth a look.`
            : `Fork ratio ${((forks / Math.max(stars, 1)) * 100).toFixed(1)}% of stars.`,
        "Source: the public GitHub REST API, unauthenticated.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
/**
 * Which open-source projects a topic or idea has produced, ranked by stars, so
 * the crowded end of a market can be seen before something is launched into it.
 */
export async function competitiveScan(args) {
    const query = (args.query ?? "").trim();
    if (query.length < 2)
        throw new PhError("Give at least two characters to search repositories for.");
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 25);
    const language = (args.language ?? "").trim();
    const params = new URLSearchParams({ q: language ? `${query} language:${language}` : query, sort: "stars", order: "desc", per_page: String(size) });
    const data = await phGet(`${GITHUB}/search/repositories?${params}`, "GitHub");
    const items = (data.items ?? []).filter((repo) => repo.full_name);
    if (!items.length)
        throw new PhError(`No GitHub repository matches "${query}"${language ? ` in ${language}` : ""}.`);
    const languages = new Map();
    for (const repo of items) {
        const name = repo.language ?? "not reported";
        languages.set(name, (languages.get(name) ?? 0) + 1);
    }
    const stars = items.map((r) => r.stargazers_count ?? 0);
    const totalStars = stars.reduce((a, b) => a + b, 0);
    const stale = items.filter((r) => r.pushed_at && Date.now() - Date.parse(r.pushed_at) > 365 * 86400000).length;
    return [
        `Competitive scan: GitHub repositories matching "${query}"${language ? ` in ${language}` : ""}`,
        `  ${(data.total_count ?? items.length).toLocaleString()} repositories match, showing the top ${items.length} by stars`,
        `  ${totalStars.toLocaleString()} stars across the page; ${stale} not pushed in the last year`,
        "",
        "Languages on this page: " + [...languages.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => `${name} x${n}`).join(", "),
        "",
        ...items.map((repo, i) => [
            `${String(i + 1).padStart(2)}. ${String(repo.full_name).slice(0, 48).padEnd(48)} ${(repo.stargazers_count ?? 0).toLocaleString().padStart(7)} stars, ${(repo.forks_count ?? 0).toLocaleString()} forks`,
            `    ${repo.description ? repo.description.slice(0, 130) : "no description"}`,
            `    ${repo.language ?? "language not reported"} | ${repo.license?.spdx_id ?? "licence not reported"} | last push ${(repo.pushed_at ?? "").slice(0, 10)}`,
        ].join("\n")),
        "",
        "Source: the public GitHub search API, unauthenticated.",
    ].join("\n");
}
