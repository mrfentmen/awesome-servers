/**
 * HTTP Check — keyless public API client.
 */
export class SourceError extends Error {
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
const SECURITY_HEADERS = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
    "cross-origin-opener-policy",
    "cross-origin-embedder-policy",
];
function parsePublicUrl(value) {
    let url;
    try {
        url = new URL(clean(value));
    }
    catch {
        throw new SourceError(`"${value}" is not a valid URL`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new SourceError("only http and https URLs can be checked");
    }
    if (isPrivateHost(url.hostname)) {
        throw new SourceError("private and loopback addresses are refused — this checker only looks at public hosts");
    }
    return url;
}
function isPrivateHost(host) {
    const name = host.toLowerCase().replace(/^\[|\]$/g, "");
    if (name === "localhost" || name.endsWith(".localhost") || name.endsWith(".local") || name.endsWith(".internal"))
        return true;
    if (name === "::1")
        return true;
    const v4 = name.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (v4) {
        const [a, b] = [Number(v4[1]), Number(v4[2])];
        if (a === 10 || a === 127 || a === 0)
            return true;
        if (a === 172 && b >= 16 && b <= 31)
            return true;
        if (a === 192 && b === 168)
            return true;
        if (a === 169 && b === 254)
            return true;
        if (a === 100 && b >= 64 && b <= 127)
            return true;
        return false;
    }
    if (name.startsWith("fc") || name.startsWith("fd") || name.startsWith("fe80"))
        return true;
    return false;
}
async function timedFetch(url, init, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const started = Date.now();
    try {
        const res = await fetch(url, { ...init, signal: ctrl.signal });
        return { res, ms: Date.now() - started };
    }
    catch (e) {
        if (e.name === "AbortError")
            throw new SourceError(`the request timed out after ${timeoutMs / 1000} seconds`);
        throw new SourceError(`the request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
function headList(headers, names) {
    return names.filter((name) => headers.has(name)).map((name) => `${name}: ${String(headers.get(name)).slice(0, 120)}`);
}
export async function checkUrl(a) {
    const url = parsePublicUrl(a.url);
    const method = (clean(a.method) || "GET").toUpperCase();
    if (!["GET", "HEAD", "POST"].includes(method))
        throw new SourceError("method must be GET, HEAD or POST");
    const { res, ms } = await timedFetch(url.toString(), { method, redirect: "follow", headers: { "user-agent": "http-check-mcp" } }, 20000);
    const body = method === "HEAD" ? "" : (await res.text()).slice(0, 300);
    return [
        `${method} ${url.toString()} -> ${res.status} ${res.statusText} in ${ms} ms`,
        "",
        bullet("final url", res.url !== url.toString() ? res.url : ""),
        bullet("content-type", res.headers.get("content-type")),
        bullet("content-length", res.headers.get("content-length")),
        bullet("server", res.headers.get("server")),
        bullet("cache-control", res.headers.get("cache-control")),
        bullet("redirects", res.redirected ? "followed" : "none"),
        body ? `\nbody (first 300 characters):\n${body}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
export async function checkRedirects(a) {
    let url = parsePublicUrl(a.url);
    const maxHops = clampLimit(a.maxHops, 5, 10);
    const hops = [];
    for (let hop = 0; hop <= maxHops; hop++) {
        const { res, ms } = await timedFetch(url.toString(), { method: "GET", redirect: "manual", headers: { "user-agent": "http-check-mcp" } }, 15000);
        const location = res.headers.get("location");
        hops.push(`${hop}. ${url.toString()} -> ${res.status}${location ? ` -> ${location}` : ""} (${ms} ms)`);
        if (!location || ![301, 302, 303, 307, 308].includes(res.status))
            break;
        if (hop === maxHops) {
            hops.push(`... still redirecting after ${maxHops} hops`);
            break;
        }
        let next;
        try {
            next = new URL(location, url);
        }
        catch {
            hops.push("   the Location header is not a valid URL");
            break;
        }
        if (isPrivateHost(next.hostname)) {
            hops.push("   next hop points at a private address, stopping there");
            break;
        }
        url = next;
    }
    return [`Redirect chain (${hops.length} hop(s) shown):`, "", ...hops].join("\n");
}
export async function checkHeaders(a) {
    const url = parsePublicUrl(a.url);
    const { res } = await timedFetch(url.toString(), { method: "HEAD", redirect: "follow", headers: { "user-agent": "http-check-mcp" } }, 15000);
    const present = headList(res.headers, SECURITY_HEADERS);
    const missing = SECURITY_HEADERS.filter((name) => !res.headers.has(name));
    const notes = [];
    const hsts = res.headers.get("strict-transport-security");
    if (hsts && !/max-age=\d+/.test(hsts))
        notes.push("HSTS is present but has no max-age");
    if (url.protocol === "http:" && hsts)
        notes.push("HSTS on a plain http URL has no effect for this request");
    return [
        `Security headers for ${url.toString()} (status ${res.status}):`,
        "",
        present.length ? "Present:" : "Present: none of the usual ones",
        ...present.map((h) => `  ${h}`),
        "",
        `Missing (${missing.length}):`,
        ...missing.map((name) => `  ${name}`),
        ...(notes.length ? ["", "Notes:", ...notes.map((n) => `- ${n}`)] : []),
    ].join("\n");
}
