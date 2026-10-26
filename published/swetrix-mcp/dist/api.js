export class SwetrixError extends Error {
    constructor(message) {
        super(message);
        this.name = "SwetrixError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new SwetrixError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    return { Authorization: "Bearer " + envStrict("SWETRIX_API_KEY") };
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
        throw new SwetrixError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function listProjects() {
    let url = `https://api.swetrix.com/v1/project`;
    const data = await req(url);
    return pretty(data);
}
export async function getProject(projectId) {
    let url = `https://api.swetrix.com/v1/project/${encodeURIComponent(String(projectId))}`;
    const data = await req(url);
    return pretty(data);
}
// ---- muxG tools:
const SW_LIST_CAP = 10;
function swBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
/** Parse the campaign parameters out of a set of URLs and report what is missing or malformed. */
export async function campaignParameters(args) {
    const raw = String(args?.urls ?? "").trim();
    if (!raw)
        throw new SwetrixError("urls is empty. Paste one URL per line.");
    if (raw.length > 30000)
        throw new SwetrixError(`urls is ${raw.length} characters, over the 30000 limit.`);
    const limit = swBound(args?.limit, 1, SW_LIST_CAP * 2, 12);
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length)
        throw new SwetrixError("urls contains only blank lines.");
    const rows = [];
    const unparseable = [];
    for (const line of lines) {
        let u;
        try {
            u = new URL(/^https?:\/\//i.test(line) ? line : `https://${line}`);
        }
        catch {
            unparseable.push(line);
            continue;
        }
        const p = u.searchParams;
        rows.push({
            raw: line,
            host: u.hostname,
            path: u.pathname || "/",
            source: p.get("utm_source"),
            medium: p.get("utm_medium"),
            campaign: p.get("utm_campaign"),
            term: p.get("utm_term"),
            content: p.get("utm_content"),
            otherParams: [...p.keys()].filter((k) => !/^utm_/i.test(k)),
        });
    }
    const withAny = rows.filter((r) => r.source || r.medium || r.campaign);
    const none = rows.filter((r) => !r.source && !r.medium && !r.campaign);
    const partial = rows.filter((r) => [r.source, r.medium, r.campaign].filter(Boolean).length < 3 && (r.source || r.medium || r.campaign));
    const campaigns = new Map();
    const sources = new Map();
    const mediums = new Map();
    const hosts = new Map();
    for (const r of withAny) {
        const key = r.campaign ?? "(no utm_campaign)";
        campaigns.set(key, (campaigns.get(key) ?? 0) + 1);
        if (r.source)
            sources.set(r.source, (sources.get(r.source) ?? 0) + 1);
        if (r.medium)
            mediums.set(r.medium, (mediums.get(r.medium) ?? 0) + 1);
        hosts.set(r.host, (hosts.get(r.host) ?? 0) + 1);
    }
    const bump = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${String(v).padStart(4)}  ${k.slice(0, 70)}`);
    const out = [
        "Campaign parameter audit, computed locally from the URLs you supplied",
        `${lines.length} URL(s): ${rows.length} parsed, ${unparseable.length} could not be parsed as a URL`,
        `Carrying at least one utm_ parameter: ${withAny.length}; carrying none at all: ${none.length}; partially tagged: ${partial.length}`,
        "",
    ];
    if (withAny.length) {
        out.push(`Campaigns (${campaigns.size}):`, ...bump(campaigns), "", "Sources:", ...bump(sources), "", "Mediums:", ...bump(mediums), "");
    }
    out.push(`Hosts: ${hosts.size ? "" : "none parsed"}`, ...bump(hosts), "");
    const problems = [];
    if (partial.length) {
        problems.push(`${partial.length} URL(s) are only partly tagged, so they will be split across dimensions in any report: ${partial.slice(0, 3).map((r) => `${r.path} (${[r.source, r.medium, r.campaign].filter(Boolean).join("/") || "one parameter only"})`).join("; ")}`);
    }
    const anyTerm = rows.filter((r) => r.term);
    if (!anyTerm.length)
        problems.push("no utm_term anywhere, so paid search keywords are not being captured");
    const anyContent = rows.filter((r) => r.content);
    if (!anyContent.length)
        problems.push("no utm_content anywhere, so you cannot separate two creatives or placements inside one campaign");
    for (const r of withAny) {
        if (r.source && r.source !== r.source.toLowerCase()) {
            problems.push(`source "${r.source}" is not lowercase, so "Google" and "google" will be counted as two sources`);
            break;
        }
    }
    const mixedCaseMedium = withAny.find((r) => r.medium && r.medium !== r.medium.toLowerCase());
    if (mixedCaseMedium)
        problems.push(`medium "${mixedCaseMedium.medium}" is not lowercase, which splits the same channel across rows`);
    if (unparseable.length)
        problems.push(`${unparseable.length} line(s) were not valid URLs: ${unparseable.slice(0, 3).map((u) => u.slice(0, 60)).join("; ")}`);
    const extraParams = new Set(rows.flatMap((r) => r.otherParams));
    if (extraParams.size)
        problems.push(`non-utm query parameters present, which are usually session or click ids rather than campaign data: ${[...extraParams].slice(0, 6).join(", ")}`);
    out.push(problems.length ? "Problems found:" : "No parameter problem found in what you supplied.", ...problems.map((p) => `  - ${p}`), "", "Analytics tools agree on names and case, not on everything else: utm_source and utm_medium and utm_campaign are the near-universal three, while term and content are the ones most often left out. Lowercase matters because a report treats Source and source as two different values.", "This reads the URLs as text. It cannot tell you whether the tags are being received by your analytics tool, which is the failure that actually costs you the data.");
    return out.filter(Boolean).join("\n");
}
