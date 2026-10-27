export class OpenpanelError extends Error {
    constructor(message) {
        super(message);
        this.name = "OpenpanelError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new OpenpanelError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    const id = envStrict("OPENPANEL_CLIENT_ID");
    const sec = envStrict("OPENPANEL_CLIENT_SECRET");
    return { Authorization: "Basic " + Buffer.from(`${id}:${sec}`).toString("base64") };
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new OpenpanelError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getMetrics(projectId, startDate, endDate) {
    let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/metrics`;
    const qs = new URLSearchParams();
    if (startDate !== undefined)
        qs.append("startDate", String(startDate));
    if (endDate !== undefined)
        qs.append("endDate", String(endDate));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getLive(projectId) {
    let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/live`;
    const data = await req(url);
    return pretty(data);
}
export async function getPages(projectId) {
    let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/pages`;
    const data = await req(url);
    return pretty(data);
}
export async function getReferrer(projectId) {
    let url = `https://api.openpanel.dev/insights/${encodeURIComponent(String(projectId))}/referrer`;
    const data = await req(url);
    return pretty(data);
}
// ---- muxG tools:
const OP_LIST_CAP = 10;
function opBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
const OP_SEARCH_ENGINES = [
    { name: "Google", re: /(^|\.)google\.[a-z.]+$/i },
    { name: "Bing", re: /(^|\.)bing\.com$/i },
    { name: "DuckDuckGo", re: /duckduckgo\.com$/i },
    { name: "Yahoo", re: /(^|\.)search\.yahoo\./i },
    { name: "Yandex", re: /yandex\.[a-z.]+$/i },
    { name: "Baidu", re: /baidu\.com$/i },
    { name: "Ecosia", re: /ecosia\.org$/i },
    { name: "Brave", re: /search\.brave\.com$/i },
    { name: "Startpage", re: /startpage\.com$/i },
    { name: "Qwant", re: /qwant\.com$/i },
];
const OP_SOCIAL = [
    { name: "Facebook", re: /(^|\.)facebook\.com$|(^|\.)l\.facebook\.com$/i },
    { name: "Instagram", re: /(^|\.)instagram\.com$/i },
    { name: "X / Twitter", re: /(^|\.)(twitter|x)\.com$/i },
    { name: "LinkedIn", re: /(^|\.)linkedin\.com$/i },
    { name: "Reddit", re: /(^|\.)reddit\.com$/i },
    { name: "YouTube", re: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
    { name: "TikTok", re: /(^|\.)tiktok\.com$/i },
    { name: "Pinterest", re: /(^|\.)pinterest\.[a-z.]+$/i },
    { name: "Mastodon", re: /mastodon\.[a-z.]+$/i },
    { name: "Bluesky", re: /bsky\.app$/i },
    { name: "Threads", re: /(^|\.)threads\.net$/i },
];
const OP_EMAIL = /(^|\.)(mail\.|email\.|outlook\.|gmail\.|yahoo\.|proton(mail)?\.|fastmail\.|zoho\.)/i;
const OP_NEWSLETTER = /(^|\.)(newsletter\.|substack\.com|buttondown\.|mailchimp\.|convertkit\.|beehiiv\.|ghost\.|sendgrid\.)/i;
const OP_PAID = /(^|\.)(googleadservices\.|doubleclick\.net|ads?\.|adnxs\.|criteo\.|taboola\.|outbrain\.|linkedin\.com\/ads|bing\.com\/aclp)/i;
/** Classify a list of referrers the way a traffic report has to before it can be read. */
export async function referrerTaxonomy(args) {
    const raw = String(args?.referrers ?? "").trim();
    if (!raw)
        throw new OpenpanelError("referrers is empty. Paste one referrer per line, as your analytics export gives them.");
    const limit = opBound(args.limit, 1, OP_LIST_CAP, 10);
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length)
        throw new OpenpanelError("referrers contains only blank lines.");
    const buckets = new Map();
    const detail = new Map();
    let ownSite = 0;
    let bare = 0;
    let unparseable = 0;
    for (const line of lines) {
        let host = line;
        try {
            const withScheme = /^https?:\/\//i.test(line) ? line : `https://${line}`;
            host = new URL(withScheme).hostname.toLowerCase();
        }
        catch {
            unparseable += 1;
        }
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) {
            if (!host)
                bare += 1;
        }
        let bucket;
        if (OP_NEWSLETTER.test(host))
            bucket = "email newsletter";
        else if (OP_EMAIL.test(host))
            bucket = "email client";
        else if (OP_PAID.test(host))
            bucket = "paid advertising";
        else if (OP_SEARCH_ENGINES.some((s) => s.re.test(host)))
            bucket = "organic search";
        else if (OP_SOCIAL.some((s) => s.re.test(host)))
            bucket = "social";
        else if (!host || host === "direct")
            bucket = "direct / none";
        else
            bucket = "referral, unrecognised";
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
        if (!detail.has(bucket))
            detail.set(bucket, []);
        const list = detail.get(bucket);
        if (list.length < 3)
            list.push(host || "(no host)");
    }
    const total = lines.length;
    const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
    const own = ranked.find(([k]) => k === "referral, unrecognised");
    return [
        "Referrer taxonomy, computed locally on the list you supplied",
        `${total} referrer(s) classified into ${ranked.length} bucket(s)${unparseable ? `, ${unparseable} could not be parsed as a URL` : ""}${bare ? `, ${bare} were bare hostnames` : ""}`,
        "",
        ...ranked.map(([bucket, n]) => {
            const hosts = detail.get(bucket) ?? [];
            return `  ${String(n).padStart(5)}  ${((n / total) * 100).toFixed(1).padStart(5)}%  ${bucket}${hosts.length ? `   e.g. ${hosts.join(", ")}` : ""}`;
        }),
        "",
        own
            ? `${own[1]} referrer(s) did not match any known search, social, email or paid host. That bucket is where a self-referral, a link shortener, an in-app browser or a crawler ends up, so read it before treating it as real traffic.`
            : "Every referrer matched a known category, which is unusual and worth double checking your export.",
        "A referrer host is not a source of truth: in-app browsers report the app, link shorteners report the shortener, and most privacy settings send nothing at all, so direct traffic here understates what most analytics tools report.",
    ].join("\n");
}
// ---- muxF tools:
// The npm registry and the GitHub API need no credentials, so these use their
// own public fetch rather than req(), which insists on the client id and secret.
const OP_SDK_PACKAGES = [
    { name: "@openpanel/web", role: "web" },
    { name: "@openpanel/nextjs", role: "Next.js" },
    { name: "@openpanel/react-native", role: "React Native" },
    { name: "@openpanel/server", role: "server" },
    { name: "@openpanel/cli", role: "CLI" },
];
async function publicJson(url) {
    const res = await fetch(url, {
        signal: AbortSignal.timeout(25000),
        headers: { ...UA, Accept: "application/json" },
    });
    if (res.status === 404)
        return null;
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 200) : JSON.stringify(data).slice(0, 200);
        throw new OpenpanelError(`HTTP ${res.status} from ${new URL(url).hostname}: ${detail}`);
    }
    return data;
}
function opDaysSince(iso) {
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? Math.floor((Date.now() - t) / 86400000) : null;
}
export async function trackerSdkMatrix() {
    const rows = [];
    for (const pkg of OP_SDK_PACKAGES) {
        const doc = await publicJson(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`);
        if (!doc) {
            rows.push({ role: pkg.role, package: pkg.name, published: false });
            continue;
        }
        const latest = doc["dist-tags"]?.latest ?? null;
        const version = latest ? doc.versions?.[latest] ?? {} : {};
        const weekly = await publicJson(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg.name)}`);
        rows.push({
            role: pkg.role,
            package: pkg.name,
            published: true,
            latest,
            versions: Object.keys(doc.versions ?? {}).length,
            latest_published: doc.time?.[latest] ?? null,
            latest_age_days: latest ? opDaysSince(doc.time?.[latest]) : null,
            downloads_last_week: weekly?.downloads ?? null,
            dependencies: Object.keys(version.dependencies ?? {}).length,
            peer_dependencies: Object.keys(version.peerDependencies ?? {}).length,
            peer_names: Object.keys(version.peerDependencies ?? {}),
        });
    }
    const total = rows.reduce((sum, r) => sum + (r.downloads_last_week ?? 0), 0);
    for (const r of rows)
        r.share_pct = total && r.downloads_last_week ? Math.round((r.downloads_last_week / total) * 1000) / 10 : null;
    rows.sort((a, b) => (b.downloads_last_week ?? -1) - (a.downloads_last_week ?? -1));
    const published = rows.filter((r) => r.published);
    if (!published.length)
        throw new OpenpanelError("None of the Openpanel SDK packages could be read from the npm registry.");
    return pretty({
        packages_checked: rows.length,
        packages_published: published.length,
        downloads_last_week_total: total,
        rows,
        note: "Versions and downloads are read from the public npm registry, so they count installs, not active projects. Dependencies are what an upgrade pulls in; peer dependencies are what the host app has to provide. A package missing here is simply not published under that name.",
    });
}
async function openpanelRepo() {
    for (const pkg of OP_SDK_PACKAGES) {
        const doc = await publicJson(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}`);
        if (!doc)
            continue;
        const raw = doc.repository?.url ?? doc.repository ?? "";
        const match = typeof raw === "string" ? raw.match(/github\.com[/:]([\w.-]+)\/([\w.-]+)/i) : null;
        if (match)
            return { slug: `${match[1]}/${match[2].replace(/\.git$/i, "")}`, found_via: pkg.name };
    }
    return null;
}
export async function projectHealth(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 10);
    const repo = await openpanelRepo();
    if (!repo)
        throw new OpenpanelError("Could not resolve the Openpanel GitHub repository from the npm metadata of its SDK packages.");
    const info = await publicJson(`https://api.github.com/repos/${repo.slug}`);
    if (!info)
        throw new OpenpanelError(`GitHub has no repository at ${repo.slug}.`);
    const contributors = (await publicJson(`https://api.github.com/repos/${repo.slug}/contributors?per_page=${limit}`)) ?? [];
    const tags = (await publicJson(`https://api.github.com/repos/${repo.slug}/tags?per_page=${limit}`)) ?? [];
    const commits = (await publicJson(`https://api.github.com/repos/${repo.slug}/commits?per_page=${limit}`)) ?? [];
    return pretty({
        repo: repo.slug,
        resolved_from: repo.found_via,
        licence: info.license?.spdx_id ?? info.license?.name ?? "none declared",
        stars: info.stargazers_count ?? null,
        forks: info.forks_count ?? null,
        open_issues: info.open_issues_count ?? null,
        age_days: opDaysSince(info.created_at),
        days_since_last_push: opDaysSince(info.pushed_at),
        default_branch: info.default_branch ?? null,
        contributors: contributors.filter((c) => c?.login).map((c) => ({ login: c.login, commits: c.contributions ?? null })),
        tags: tags.map((t) => t?.name).filter(Boolean),
        recent_commits: commits.map((c) => ({
            sha: String(c?.sha ?? "").slice(0, 7),
            date: c?.commit?.author?.date ?? null,
            message: String(c?.commit?.message ?? "").split("\n")[0],
        })),
        note: "Repository, contributors, tags and commits come from the public GitHub API. open_issues counts pull requests as well, which is how GitHub reports it, and contributor commits are all-time, not this year.",
    });
}
