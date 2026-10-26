export class KongError extends Error {
    constructor(message) {
        super(message);
        this.name = "KongError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    return (process.env.KONG_ADMIN_URL ?? "http://localhost:8001").replace(/\/$/, "");
}
async function get(path) {
    let res;
    try {
        res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: "application/json" } });
    }
    catch (e) {
        throw new KongError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new KongError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 8000);
}
export function getStatus() {
    return get("/status");
}
export function listServices() {
    return get("/services");
}
export function listRoutes() {
    return get("/routes");
}
// ---- muxG tools:
const KONG_UA = { "User-Agent": "mrfentmen-kong-mcp/1.0" };
const edgeTarget = (input) => {
    const raw = String(input ?? "").trim();
    if (!raw)
        throw new Error("Provide the public base URL of the gateway, for example https://api.example.com.");
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let url;
    try {
        url = new URL(withScheme);
    }
    catch {
        throw new Error(`"${input}" is not a URL.`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:")
        throw new Error("Only http and https URLs can be probed.");
    return url;
};
const CORS_HEADERS = [
    "access-control-allow-origin",
    "access-control-allow-methods",
    "access-control-allow-headers",
    "access-control-allow-credentials",
    "access-control-expose-headers",
    "access-control-max-age",
    "vary",
    "allow",
];
/** Ask the gateway's edge what cross-origin requests it will accept, with a real preflight. */
export async function corsPreflight(args) {
    const url = edgeTarget(args?.url);
    const origin = String(args?.origin ?? "").trim();
    if (!/^https?:\/\/[^\s]+$/.test(origin))
        throw new Error(`"${args?.origin}" is not an http or https origin.`);
    const method = String(args?.method ?? "GET").trim().toUpperCase();
    if (!/^[A-Z]{3,10}$/.test(method))
        throw new Error("Provide a single HTTP method, e.g. GET or POST.");
    const wanted = (args?.headers ?? ["content-type", "authorization"]).map((value) => value.trim().toLowerCase()).filter(Boolean).slice(0, 8);
    const requestHeaders = { ...KONG_UA, Origin: origin, "Access-Control-Request-Method": method };
    if (wanted.length)
        requestHeaders["Access-Control-Request-Headers"] = wanted.join(", ");
    const started = Date.now();
    let res;
    try {
        res = await fetch(url, { method: "OPTIONS", headers: requestHeaders, redirect: "manual", signal: AbortSignal.timeout(20000) });
    }
    catch (e) {
        throw new Error(`Preflight failed: ${e.message}`);
    }
    const ms = Date.now() - started;
    const lines = [`CORS preflight to ${url.toString()}: OPTIONS with Origin ${origin} and Access-Control-Request-Method ${method} · HTTP ${res.status} in ${ms} ms`];
    const answered = [];
    for (const key of CORS_HEADERS) {
        const value = res.headers.get(key);
        if (value === null)
            continue;
        answered.push(key);
        lines.push(`  ${key}: ${value.slice(0, 200)}`);
    }
    if (!answered.length)
        lines.push("  the edge returned no CORS headers at all, so a browser would block the cross-origin request.");
    const allowOrigin = res.headers.get("access-control-allow-origin");
    const credentials = res.headers.get("access-control-allow-credentials");
    lines.push("");
    if (!allowOrigin) {
        lines.push("Verdict: no Access-Control-Allow-Origin, so a browser refuses this cross-origin call.");
    }
    else if (allowOrigin === "*") {
        lines.push(`Verdict: wildcard origin allowed${credentials === "true" ? ", but credentials are also allowed, which browsers reject together" : ""}.`);
    }
    else if (allowOrigin === origin) {
        lines.push(`Verdict: this exact origin is allowed${credentials === "true" ? ", with credentials" : ", without credentials"}.`);
    }
    else {
        lines.push(`Verdict: allowed origin is "${allowOrigin}", which is not the origin asked for, so this call is blocked.`);
    }
    if (!res.headers.get("access-control-allow-headers") && wanted.length) {
        lines.push(`No Access-Control-Allow-Headers was returned, so a browser would also reject the requested headers ${wanted.join(", ")}.`);
    }
    return lines.join("\n");
}
const SECURITY_HEADERS = [
    { header: "strict-transport-security", why: "HSTS" },
    { header: "content-security-policy", why: "CSP" },
    { header: "x-frame-options", why: "clickjacking" },
    { header: "x-content-type-options", why: "MIME sniffing" },
    { header: "referrer-policy", why: "referrer leakage" },
    { header: "permissions-policy", why: "feature policy" },
];
const GATEWAY_SIGNALS = ["server", "via", "x-powered-by", "x-kong-proxy-latency", "x-kong-upstream-latency", "x-kong-request-id", "x-request-id", "cf-ray", "x-amzn-requestid", "x-cache", "age"];
/** What the public edge of a gateway discloses: its version, its cache, its own headers and what is missing. */
export async function edgeHeaders(args) {
    const url = edgeTarget(args?.url);
    const method = String(args?.method ?? "GET").trim().toUpperCase();
    if (!/^(GET|HEAD|OPTIONS)$/.test(method)) {
        throw new Error("Use GET, HEAD or OPTIONS so the probe stays safe.");
    }
    const started = Date.now();
    let res;
    try {
        res = await fetch(url, { method, headers: { ...KONG_UA, Accept: "*/*" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    }
    catch (e) {
        throw new Error(`Probe failed: ${e.message}`);
    }
    const ms = Date.now() - started;
    const lines = [`Edge probe of ${url.toString()}: ${method} returned HTTP ${res.status} ${res.statusText} in ${ms} ms`];
    const signals = [];
    for (const key of GATEWAY_SIGNALS) {
        const value = res.headers.get(key);
        if (value === null)
            continue;
        signals.push(key);
        lines.push(`  ${key}: ${value.slice(0, 200)}`);
    }
    if (!signals.length)
        lines.push("  no gateway or cache signature header was returned, so the edge is hiding what it runs.");
    lines.push("");
    lines.push("Security headers:");
    let missing = 0;
    for (const item of SECURITY_HEADERS) {
        const value = res.headers.get(item.header);
        if (value === null) {
            missing += 1;
            lines.push(`  ${item.header.padEnd(26)} not set (${item.why})`);
        }
        else {
            lines.push(`  ${item.header.padEnd(26)} ${value.slice(0, 120)}`);
        }
    }
    lines.push("");
    lines.push(missing
        ? `${missing} of ${SECURITY_HEADERS.length} security headers are missing on the edge.`
        : `All ${SECURITY_HEADERS.length} security headers are present on the edge.`);
    const allow = res.headers.get("allow");
    if (allow)
        lines.push(`Allowed methods advertised: ${allow}`);
    return lines.join("\n");
}
