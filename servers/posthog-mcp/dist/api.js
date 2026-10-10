export class PosthogError extends Error {
    constructor(message) {
        super(message);
        this.name = "PosthogError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    return (process.env.POSTHOG_BASE_URL ?? "https://us.posthog.com").replace(/\/$/, "");
}
function headers() {
    const k = process.env.POSTHOG_PERSONAL_API_KEY;
    if (!k)
        throw new PosthogError("Set POSTHOG_PERSONAL_API_KEY (PostHog personal key).");
    return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch(base() + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new PosthogError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new PosthogError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function me() {
    return get("/api/users/@me/");
}
export function listProjects() {
    return get("/api/projects/");
}
export function listInsights(projectId) {
    return get(`/api/projects/${encodeURIComponent(projectId)}/insights/?limit=20`);
}
export function insightDetails(projectId, insightId) {
    return get(`/api/projects/${encodeURIComponent(projectId)}/insights/${encodeURIComponent(insightId)}/`);
}
export function dashboards(projectId) {
    return get(`/api/projects/${encodeURIComponent(projectId)}/dashboards/`);
}
export function actions(projectId) {
    return get(`/api/projects/${encodeURIComponent(projectId)}/actions/`);
}
export function events(projectId, limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 100);
    return get(`/api/projects/${encodeURIComponent(projectId)}/events/?limit=${n}`);
}
export function persons(projectId) {
    return get(`/api/projects/${encodeURIComponent(projectId)}/persons/?limit=10`);
}
export function flags(projectId) {
    return get(`/api/projects/${encodeURIComponent(projectId)}/feature_flags/`);
}
export function cohorts(projectId) {
    return get(`/api/projects/${encodeURIComponent(projectId)}/cohorts/`);
}
// ---- muxH tools:
// The tools above read a PostHog workspace. These two read the public web a
// product is actually served from: what certificates exist for its domains, and
// whether the page it serves is valid markup. Neither needs a PostHog key.
const CRT_SH = "https://crt.sh";
const NU_CHECKER = "https://validator.w3.org/nu";
const WEB_UA = "posthog-mcp/1.2 (https://github.com/mrfentmen/posthog-mcp)";
async function crtJson(query, attempts) {
    let lastError = "";
    for (let i = 0; i < attempts; i += 1) {
        let res;
        try {
            res = await fetch(`${CRT_SH}/?q=${encodeURIComponent(query)}&output=json&exclude=expired`, {
                headers: { Accept: "application/json", "User-Agent": WEB_UA },
                signal: AbortSignal.timeout(45000),
            });
        }
        catch (e) {
            lastError = e instanceof Error ? e.message : String(e);
            continue;
        }
        if (res.ok) {
            const body = (await res.json());
            if (Array.isArray(body))
                return body;
            lastError = "crt.sh returned a body that is not a list";
            continue;
        }
        lastError = `HTTP ${res.status} ${res.statusText}`;
        // crt.sh answers 502 while it rebuilds a query; that clears on its own.
        if (res.status !== 502)
            break;
        await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    throw new PosthogError(`Certificate Transparency lookup for "${query}" failed after ${attempts} attempt(s): ${lastError}`);
}
const crtDay = (value) => (value ? value.slice(0, 10) : "not reported");
function shortIssuer(issuer) {
    const cn = /CN=([^,/]+)/.exec(String(issuer ?? ""));
    if (cn)
        return cn[1].trim().slice(0, 34);
    return String(issuer ?? "not reported").split(",").pop()?.trim().slice(0, 34) || "not reported";
}
/**
 * What the public certificate transparency log says about a domain: how many
 * names have ever been certified, which authorities issued them and when. This
 * is the list of hosts a product is actually reachable on, including the ones
 * nobody remembers shipping.
 */
export async function certificateTransparency(args) {
    const domain = (args.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(domain)) {
        throw new PosthogError(`"${args.domain}" does not look like a domain name.`);
    }
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 15), 1), 40);
    const rows = await crtJson(domain, 3);
    if (!rows.length)
        throw new PosthogError(`No unexpired certificate in the transparency log names "${domain}".`);
    const names = new Set();
    const issuers = new Map();
    let earliest = Number.POSITIVE_INFINITY;
    let latest = 0;
    for (const row of rows) {
        for (const name of String(row.name_value ?? "").split("\n")) {
            const clean = name.trim().toLowerCase();
            if (clean)
                names.add(clean);
        }
        const issuer = shortIssuer(row.issuer_name);
        issuers.set(issuer, (issuers.get(issuer) ?? 0) + 1);
        const from = Date.parse(String(row.not_before ?? ""));
        if (Number.isFinite(from))
            earliest = Math.min(earliest, from);
        const to = Date.parse(String(row.not_after ?? ""));
        if (Number.isFinite(to))
            latest = Math.max(latest, to);
    }
    const wildcards = [...names].filter((n) => n.startsWith("*."));
    const hosts = [...names].filter((n) => !n.startsWith("*.")).sort();
    const ranked = [...issuers.entries()].sort((a, b) => b[1] - a[1]);
    return [
        `Certificate transparency for ${domain}`,
        `  ${rows.length} unexpired certificate(s) in the log, ${names.size} distinct name(s)`,
        `  first seen ${Number.isFinite(earliest) ? crtDay(new Date(earliest).toISOString()) : "not reported"}, latest expiry ${latest ? crtDay(new Date(latest).toISOString()) : "not reported"}`,
        "",
        `Issuing authorities: ${ranked.slice(0, 6).map(([name, n]) => `${name} x${n}`).join(", ")}`,
        "",
        `Wildcard names (${wildcards.length}): ${wildcards.slice(0, 6).join(", ") || "none"}${wildcards.length > 6 ? ` (+${wildcards.length - 6} more)` : ""}`,
        "",
        `Specific hostnames (${hosts.length}):`,
        ...hosts.slice(0, size).map((name, i) => `  ${String(i + 1).padStart(2)}. ${name}`),
        hosts.length > size ? `  (+${hosts.length - size} more)` : "",
        "",
        "Source: crt.sh, which reads the public Certificate Transparency logs.",
    ].join("\n");
}
/**
 * Whether the page a product serves is valid HTML, broken down by error type,
 * with the messages themselves. A tracking snippet that silently breaks the
    * document is invisible from analytics and obvious here.
 */
export async function markupAudit(args) {
    const url = (args.url ?? "").trim();
    if (!url)
        throw new PosthogError("Give a URL to validate, e.g. https://example.com.");
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 30);
    let res;
    try {
        res = await fetch(`${NU_CHECKER}/?doc=${encodeURIComponent(url)}&out=json`, {
            headers: { Accept: "application/json", "User-Agent": WEB_UA },
            signal: AbortSignal.timeout(45000),
        });
    }
    catch (e) {
        throw new PosthogError(`Could not reach the Nu HTML Checker: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (res.status === 400)
        throw new PosthogError(`The Nu HTML Checker could not fetch ${url}.`);
    if (!res.ok)
        throw new PosthogError(`Nu HTML Checker error ${res.status}: ${res.statusText}`);
    const body = (await res.json());
    const messages = Array.isArray(body.messages) ? body.messages : [];
    if (!messages.length)
        return `${url} produced no validator messages at all; Nu version ${body.version ?? "not reported"}.`;
    const byType = new Map();
    const bySubType = new Map();
    for (const message of messages) {
        const type = String(message.type ?? "unknown");
        byType.set(type, (byType.get(type) ?? 0) + 1);
        const sub = String(message.subType ?? "");
        if (sub)
            bySubType.set(sub, (bySubType.get(sub) ?? 0) + 1);
    }
    const errors = messages.filter((m) => m.type === "error");
    const warnings = messages.filter((m) => m.type === "info");
    const seen = new Set();
    const distinct = [];
    for (const message of messages) {
        const key = String(message.message ?? "");
        if (seen.has(key))
            continue;
        seen.add(key);
        distinct.push(message);
    }
    return [
        `Markup audit for ${body.url ?? url}`,
        `  Nu HTML Checker ${body.version ?? "version not reported"}, ${messages.length} message(s)`,
        `  ${errors.length} error(s), ${warnings.length} warning(s), ${[...byType.keys()].filter((t) => t !== "error" && t !== "info").join(", ") || "no other types"}`,
        "",
        "By type: " + [...byType.entries()].map(([t, n]) => `${t} x${n}`).join(", "),
        "By category: " + ([...bySubType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, n]) => `${t} x${n}`).join(", ") || "none reported"),
        "",
        `Distinct messages (${distinct.length} of ${messages.length} rows), most frequent first:`,
        ...distinct
            .slice(0, size)
            .map((m, i) => {
            const where = m.lastLine ? ` at line ${m.lastLine}${m.lastColumn ? `, column ${m.lastColumn}` : ""}` : "";
            return `  ${String(i + 1).padStart(2)}. [${String(m.type ?? "?")}]${where} ${String(m.message ?? "").slice(0, 180)}`;
        }),
        distinct.length > size ? `  (+${distinct.length - size} more distinct messages)` : "",
        "",
        `Verdict: ${errors.length ? `${errors.length} conformance error(s) — a tag is unclosed or an attribute is not allowed.` : "no conformance errors; the rest are advisories."}`,
        "Source: W3C Nu HTML Checker, which parses the live document.",
    ].join("\n");
}
