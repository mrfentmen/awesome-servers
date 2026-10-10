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
const OP_NPM = "https://registry.npmjs.org";
const OP_DOWNLOADS = "https://api.npmjs.org/downloads/point/last-week";
const OP_GITHUB = "https://api.github.com/repos/Openpanel-dev/openpanel";
const OP_SDKS = ["@openpanel/sdk", "@openpanel/web", "@openpanel/nextjs", "@openpanel/react-native", "openpanel"];
const OP_LIST_CAP = 10;
async function opJson(url, accept = "application/json") {
    const res = await fetch(url, {
        headers: { "User-Agent": "awesome-mcps/1.0", Accept: accept },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new OpenpanelError(`Not found: ${url.replace(/^https:\/\//, "")}`);
    if (res.status === 403)
        throw new OpenpanelError("GitHub or npm is rate limiting this IP. Wait a minute and try again.");
    if (!res.ok)
        throw new OpenpanelError(`Returned ${res.status} for ${url.replace(/^https:\/\//, "")}`);
    return (await res.json());
}
async function opWeeklyDownloads(pkg) {
    try {
        const d = await opJson(`${OP_DOWNLOADS}/${encodeURIComponent(pkg)}`);
        return typeof d.downloads === "number" ? d.downloads : null;
    }
    catch {
        return null;
    }
}
function opBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
/** Which Openpanel SDK to install, and how much of each one is actually in use. */
export async function trackerSdkMatrix(_args) {
    const rows = await Promise.all(OP_SDKS.map(async (pkg) => {
        const [doc, downloads] = await Promise.all([
            opJson(`${OP_NPM}/${encodeURIComponent(pkg)}`, "application/vnd.npm.install-v1+json"),
            opWeeklyDownloads(pkg),
        ]);
        const latest = doc["dist-tags"]?.latest;
        const manifest = latest ? doc.versions?.[latest] : undefined;
        return {
            pkg,
            latest,
            versions: Object.keys(doc.versions ?? {}).length,
            downloads,
            deps: Object.keys(manifest?.dependencies ?? {}).length,
            peers: Object.keys(manifest?.peerDependencies ?? {}).length,
            description: doc.description,
            maintainers: doc.maintainers?.length ?? 0,
        };
    }));
    const total = rows.reduce((s, r) => s + (r.downloads ?? 0), 0);
    return [
        "Openpanel SDK matrix, from the npm registry and the public download counter",
        ...rows.map((r) => [
            `${r.pkg} — ${r.latest ?? "no latest tag"}, ${r.versions} version(s)`,
            r.downloads !== null ? `  weekly downloads: ${r.downloads.toLocaleString("en-US")}${total ? ` (${((r.downloads / total) * 100).toFixed(1)}% of the five)` : ""}` : "  weekly downloads: not reported",
            `  dependencies on latest: ${r.deps} runtime, ${r.peers} peer`,
            r.description ? `  ${r.description.slice(0, 120)}` : "",
        ].filter(Boolean).join("\n")),
        "",
        `Combined weekly downloads: ${total.toLocaleString("en-US")}`,
        "A package with a high peer count is coupling itself to your framework version, so a major bump there is a breaking change for you. A package with no downloads may be new rather than unused.",
    ].join("\n");
}
/** The project's own health from GitHub: activity, contributors, open work and licence. */
export async function projectHealth(args) {
    const limit = opBound(args?.limit, 1, OP_LIST_CAP, 5);
    const [repo, contributors, tags, commits] = await Promise.all([
        opJson(OP_GITHUB),
        opJson(`${OP_GITHUB}/contributors?per_page=${limit}`),
        opJson(`${OP_GITHUB}/tags?per_page=${limit}`),
        opJson(`${OP_GITHUB}/commits?per_page=${limit}`),
    ]);
    const lastPush = repo.pushed_at ? Date.parse(repo.pushed_at) : 0;
    const daysSincePush = lastPush ? Math.round((Date.now() - lastPush) / 86400000) : null;
    const ageDays = repo.created_at ? Math.round((Date.now() - Date.parse(repo.created_at)) / 86400000) : null;
    return [
        `${repo.full_name ?? "Openpanel-dev/openpanel"}${repo.archived ? " (ARCHIVED)" : ""}`,
        repo.description ?? "",
        `Licence: ${repo.license?.spdx_id ?? "not reported"}`,
        `Stars: ${repo.stargazers_count?.toLocaleString("en-US") ?? "not reported"}, forks ${repo.forks_count ?? "not reported"}, watchers ${repo.subscribers_count ?? "not reported"}`,
        `Open issues and pull requests: ${repo.open_issues_count ?? "not reported"} (GitHub counts both together)`,
        `Created ${String(repo.created_at ?? "?").slice(0, 10)}${ageDays !== null ? `, ${(ageDays / 365).toFixed(1)} year(s) old` : ""}`,
        `Last push ${String(repo.pushed_at ?? "?").slice(0, 10)}${daysSincePush !== null ? `, ${daysSincePush} day(s) ago` : ""}${daysSincePush !== null && daysSincePush > 60 ? " — that is a slow release cadence for a hosted service" : ""}`,
        repo.topics?.length ? `Topics: ${repo.topics.join(", ")}` : "",
        "",
        `Contributors by commits (top ${Math.min(limit, contributors.length)}):`,
        ...contributors.slice(0, limit).map((c) => `  ${String(c.contributions ?? 0).padStart(6)}  ${c.login ?? "?"}${c.type === "Bot" ? " (bot)" : ""}`),
        "",
        `Most recent tags: ${tags.map((t) => t.name ?? "?").join(", ") || "none reported"}`,
        "",
        `Latest ${Math.min(limit, commits.length)} commit(s) on ${repo.default_branch ?? "the default branch"}:`,
        ...commits.slice(0, limit).map((c) => {
            const msg = String(c.commit?.message ?? "").split("\n")[0];
            return `  ${String(c.commit?.author?.date ?? "?").slice(0, 10)}  ${msg.slice(0, 90)}`;
        }),
        "",
        "The repository has tags but may publish no GitHub releases, so the release history is in the image tags and the changelog rather than in release notes.",
    ].filter(Boolean).join("\n");
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
