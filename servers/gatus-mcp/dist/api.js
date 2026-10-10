import { connect } from "node:tls";
const UA = "mrfentmen-gatus-mcp/1.0";
const DOH = "https://dns.google/resolve";
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
/** Accepts "example.com", "https://example.com/x" or "example.com:8080". */
export function normalizeTarget(input) {
    const raw = (input ?? "").trim();
    if (!raw)
        throw new Error("Provide a URL or hostname, for example https://example.com.");
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let url;
    try {
        url = new URL(withScheme);
    }
    catch {
        throw new Error(`"${input}" is not a valid URL or hostname.`);
    }
    if (!url.hostname.includes("."))
        throw new Error(`"${input}" does not look like a public hostname.`);
    return url;
}
const HEADER_KEYS = [
    "content-type",
    "server",
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
    "cache-control",
    "x-powered-by",
];
async function request(target, timeoutMs = 15000) {
    const start = Date.now();
    let url = normalizeTarget(target);
    const hops = [];
    let last = null;
    let body = "";
    for (let i = 0; i < 6; i += 1) {
        const res = await fetch(url, {
            method: "GET",
            redirect: "manual",
            headers: { "User-Agent": UA, Accept: "*/*" },
            signal: AbortSignal.timeout(timeoutMs),
        });
        last = res;
        const location = res.headers.get("location");
        hops.push({ url: url.toString(), status: res.status, location });
        if (res.status >= 300 && res.status < 400 && location) {
            url = new URL(location, url);
            continue;
        }
        body = (await res.text()).slice(0, 200000);
        break;
    }
    if (!last)
        throw new Error("No response received.");
    const headers = {};
    for (const key of HEADER_KEYS) {
        const value = last.headers.get(key);
        if (value)
            headers[key] = value.slice(0, 400);
    }
    return {
        ok: last.status >= 200 && last.status < 400,
        status: last.status,
        statusText: last.statusText,
        finalUrl: url.toString(),
        ms: Date.now() - start,
        bytes: Buffer.byteLength(body),
        contentType: last.headers.get("content-type") ?? "",
        server: last.headers.get("server"),
        headers,
        hops,
        bodySnippet: body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
        body,
    };
}
const verdict = (title, conditions) => {
    const passed = conditions.filter((c) => c.passed).length;
    const width = Math.max(...conditions.map((c) => c.name.length));
    return [
        title,
        `${passed === conditions.length ? "HEALTHY" : "UNHEALTHY"} — ${passed} of ${conditions.length} condition(s) met`,
        "",
        ...conditions.map((c) => `${c.passed ? "met " : "MISS"} ${c.name.padEnd(width)}  ${c.detail}`),
    ].join("\n");
};
/**
 * Evaluates the conditions a health dashboard would attach to an endpoint:
 * the status it must return, a latency budget, and text the body must contain.
 */
export async function checkEndpoint(args) {
    const url = normalizeTarget(args.url);
    const r = await request(url.toString(), 20000);
    const expected = Number(args.expectedStatus ?? 200) || 200;
    const budget = Number(args.maxMs ?? 0) || 0;
    const needle = (args.bodyContains ?? "").trim();
    const conditions = [
        { name: "status", passed: r.status === expected, detail: `got HTTP ${r.status}, expected ${expected}` },
    ];
    if (budget > 0) {
        conditions.push({ name: "latency", passed: r.ms <= budget, detail: `${r.ms} ms against a ${budget} ms budget` });
    }
    if (needle) {
        conditions.push({
            name: "body",
            passed: r.body.includes(needle),
            detail: r.body.includes(needle) ? `contains "${needle}"` : `does not contain "${needle}"`,
        });
    }
    conditions.push({
        name: "no loop",
        passed: r.hops.length < 6,
        detail: r.hops.length >= 6 ? "redirect chain hit the 6-hop limit" : `${r.hops.length} hop(s) to ${r.finalUrl}`,
    });
    return verdict(`Endpoint check for ${url.toString()}`, conditions);
}
/** Health rollup across several endpoints, judged against the status each should return. */
export async function healthRollup(args) {
    const urls = (args.urls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 10);
    if (!urls.length)
        return "Provide up to 10 endpoints to roll up.";
    const expected = Number(args.expectedStatus ?? 200) || 200;
    const budget = Number(args.maxMs ?? 0) || 0;
    const rows = [];
    const failing = [];
    const latencies = [];
    for (const url of urls) {
        try {
            const r = await request(url, 15000);
            latencies.push(r.ms);
            const statusOk = r.status === expected;
            const fastEnough = budget === 0 || r.ms <= budget;
            if (!statusOk || !fastEnough)
                failing.push(url);
            const flags = [statusOk ? "" : `expected ${expected}`, fastEnough ? "" : `over ${budget} ms`].filter(Boolean);
            rows.push(`${statusOk && fastEnough ? "PASS" : "FAIL"} ${String(r.status).padStart(3)} ${String(r.ms).padStart(6)} ms  ${url}${flags.length ? `  (${flags.join(", ")})` : ""}`);
        }
        catch (e) {
            failing.push(url);
            rows.push(`FAIL ---        -  ${url}  (${errorMessage(e)})`);
        }
    }
    const checked = urls.length;
    const passing = checked - failing.length;
    const rate = ((passing / checked) * 100).toFixed(0);
    const sorted = [...latencies].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : 0;
    return [
        `Health rollup: ${passing} of ${checked} endpoint(s) healthy (${rate}%)`,
        latencies.length ? `Latency across endpoints — median ${median} ms, fastest ${sorted[0]} ms, slowest ${sorted[sorted.length - 1]} ms` : "No endpoint answered, so there is no latency to report.",
        failing.length ? `Failing: ${failing.join(", ")}` : "Nothing failed.",
        "",
        ...rows,
    ].join("\n");
}
export async function endpointLatency(args) {
    const url = normalizeTarget(args.url);
    const samples = Math.min(Math.max(Number(args.samples ?? 3) || 3, 2), 10);
    const times = [];
    const statuses = new Set();
    // Sequential so one request does not distort the next one's timing.
    for (let i = 0; i < samples; i += 1) {
        const start = Date.now();
        const res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "*/*" },
            signal: AbortSignal.timeout(20000),
        });
        // Read the body so the timing covers the whole transfer, not just the headers.
        await res.arrayBuffer();
        times.push(Date.now() - start);
        statuses.add(res.status);
    }
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]
        : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const spread = sorted[sorted.length - 1] - sorted[0];
    return [
        `Latency for ${url.toString()} (${samples} sample(s))`,
        `fastest ${sorted[0]} ms | median ${median} ms | average ${avg} ms | slowest ${sorted[sorted.length - 1]} ms`,
        `Spread: ${spread} ms — ${spread > Math.max(100, median) ? "inconsistent, some requests are much slower than others" : "consistent between requests"}`,
        `HTTP statuses seen: ${[...statuses].join(", ")}`,
        "",
        "Per-request: " + times.map((t, i) => `#${i + 1} ${t}ms`).join(", "),
    ].join("\n");
}
/** Reads the live leaf certificate off the host's own TLS handshake. */
function leafCertificate(hostname, port = 443) {
    return new Promise((resolve, reject) => {
        const socket = connect({ host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout: 15000 }, () => {
            const c = socket.getPeerCertificate();
            if (!c || !c.valid_to) {
                socket.destroy();
                reject(new Error(`No certificate returned by ${hostname}:${port}.`));
                return;
            }
            const validTo = new Date(c.valid_to);
            const subject = (c.subject ?? {});
            const issuer = (c.issuer ?? {});
            const summary = {
                validTo,
                daysRemaining: Math.floor((validTo.getTime() - Date.now()) / 86400000),
                issuer: issuer.O ?? issuer.CN ?? "unknown",
                subject: subject.CN ?? hostname,
                authorized: socket.authorized,
                protocol: socket.getProtocol() ?? "unknown",
            };
            socket.destroy();
            resolve(summary);
        });
        socket.on("error", (e) => reject(new Error(`TLS connection to ${hostname}:${port} failed: ${e.message}`)));
        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error(`TLS connection to ${hostname}:${port} timed out.`));
        });
    });
}
export async function tlsExpiry(args) {
    const target = normalizeTarget(args.host);
    const host = target.hostname;
    const info = await leafCertificate(host, target.port ? Number(target.port) : 443);
    const days = info.daysRemaining;
    const status = days < 0
        ? `EXPIRED ${Math.abs(days)} day(s) ago — visitors get a browser warning`
        : days <= 7
            ? `CRITICAL: ${days} day(s) left`
            : days <= 30
                ? `WARNING: ${days} day(s) left`
                : `OK: ${days} day(s) left`;
    return [
        `TLS certificate for ${host}`,
        `Status: ${status}`,
        `Expires: ${info.validTo.toISOString()}`,
        `Issuer: ${info.issuer}`,
        `Common name: ${info.subject}`,
        `Protocol: ${info.protocol}`,
        `Trusted chain: ${info.authorized ? "yes" : "no"}`,
        days >= 0 && days <= 30 ? "Renew before it lapses: an expired certificate shows every visitor a browser warning." : null,
    ].filter((line) => line !== null).join("\n");
}
const RECORD_TYPES = ["A", "AAAA", "NS", "MX", "TXT", "CAA"];
const TYPE_NAMES = {
    1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA", 257: "CAA",
};
async function dnsQuery(name, type) {
    const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
        headers: { "User-Agent": UA, Accept: "application/dns-json" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`DNS-over-HTTPS returned ${res.status}`);
    return (await res.json());
}
const answerLines = (d) => (d.Answer ?? []).map((row) => {
    const kind = TYPE_NAMES[row.type ?? 0] ?? `TYPE${row.type ?? "?"}`;
    return `${kind} ${String(row.data ?? "").trim()}`;
});
export async function dnsRecords(args) {
    const domain = normalizeTarget(args.domain).hostname;
    const wanted = (args.type ?? "").trim().toUpperCase();
    const types = wanted ? [wanted] : [...RECORD_TYPES];
    const unknown = types.filter((t) => !RECORD_TYPES.includes(t));
    if (unknown.length)
        return `Record type must be one of ${RECORD_TYPES.join(", ")}, or omit it to fetch all of them.`;
    const results = await Promise.allSettled(types.map((type) => dnsQuery(domain, type)));
    const lines = [`DNS records for ${domain}`, ""];
    let missing = 0;
    results.forEach((result, i) => {
        const type = types[i];
        if (result.status === "rejected") {
            lines.push(`${type}: lookup failed (${errorMessage(result.reason)})`);
            missing += 1;
            return;
        }
        const answers = answerLines(result.value);
        if (!answers.length) {
            lines.push(`${type}: none`);
            if (type === "A" || type === "NS")
                missing += 1;
            return;
        }
        lines.push(`${type}:`);
        answers.slice(0, 8).forEach((a) => lines.push(`  ${a}`));
    });
    const ttls = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => (r.value.Answer ?? []).map((a) => a.TTL ?? 0));
    if (ttls.length)
        lines.push("", `Lowest TTL: ${Math.min(...ttls)} second(s).`);
    lines.push(`Core records present: ${missing === 0 ? "yes" : `no — ${missing} missing`}`);
    return lines.join("\n");
}
const SECURITY_HEADERS = [
    { header: "strict-transport-security", why: "forces HTTPS for future visits" },
    { header: "content-security-policy", why: "blocks cross-site scripting and injected content" },
    { header: "x-frame-options", why: "stops clickjacking through iframes" },
    { header: "x-content-type-options", why: "stops MIME-sniffing attacks" },
    { header: "referrer-policy", why: "limits how much URL data leaks to other sites" },
    { header: "permissions-policy", why: "switches off browser features the site does not need" },
];
export async function securityHeaders(args) {
    const r = await request(args.url, 20000);
    const present = SECURITY_HEADERS.filter(({ header }) => r.headers[header]).length;
    const grade = present >= 6 ? "A" : present === 5 ? "B" : present === 4 ? "C" : present === 3 ? "D" : "F";
    const lines = [
        `Security headers for ${r.finalUrl} (HTTP ${r.status})`,
        `Grade: ${grade} — ${present} of ${SECURITY_HEADERS.length} recommended headers present`,
        "",
    ];
    for (const { header, why } of SECURITY_HEADERS) {
        const value = r.headers[header];
        lines.push(`${value ? "PASS" : "MISS"} ${header} — ${why}`);
        if (value)
            lines.push(`     ${value.slice(0, 300)}`);
    }
    if (r.headers["x-powered-by"])
        lines.push("", `Note: x-powered-by discloses ${r.headers["x-powered-by"]} — consider removing it.`);
    return lines.join("\n");
}
// ---- batch-4 tools: payload, methods, health paths (2026-09-27) ----
export async function payloadReport(args) {
    const url = normalizeTarget(args.url);
    const start = Date.now();
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "*/*" }, signal: AbortSignal.timeout(20000) });
    const body = await res.arrayBuffer();
    const ms = Date.now() - start;
    const encoding = res.headers.get("content-encoding");
    const declared = Number(res.headers.get("content-length"));
    const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
    const type = res.headers.get("content-type") ?? "unknown";
    const isHtml = /text\/html/i.test(type);
    const notes = [];
    if (isHtml && !encoding)
        notes.push("HTML is not compressed - gzip or brotli would cut the transfer");
    if (Number.isFinite(declared) && declared > 0 && Math.abs(declared - body.byteLength) / declared > 0.1) {
        notes.push(`content-length says ${kb(declared)} but ${kb(body.byteLength)} arrived`);
    }
    if (body.byteLength > 500 * 1024)
        notes.push(`${kb(body.byteLength)} is large for one request; check the page weight budget`);
    return [
        `Payload for ${url.toString()} (HTTP ${res.status} in ${ms} ms)`,
        `Transferred: ${kb(body.byteLength)}${encoding ? ` compressed as ${encoding}` : " uncompressed"}`,
        `Content type: ${type}${Number.isFinite(declared) ? ` | declared length ${kb(declared)}` : ""}`,
        res.headers.get("cache-control") ? `Cache-Control: ${res.headers.get("cache-control")}` : "Cache-Control: not sent",
        res.headers.get("etag") ? "ETag: present (conditional requests can save bandwidth)" : "ETag: not sent",
        "",
        notes.length ? `Worth fixing (${notes.length}):\n${notes.map((n) => `  - ${n}`).join("\n")}` : "No payload problems found in this response.",
    ].join("\n");
}
export async function allowedMethods(args) {
    const url = normalizeTarget(args.url);
    const call = async (method) => {
        const start = Date.now();
        try {
            const res = await fetch(url, { method, redirect: "manual", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
            await res.arrayBuffer();
            return { method, status: res.status, ms: Date.now() - start, allow: res.headers.get("allow") };
        }
        catch (e) {
            return { method, status: 0, ms: Date.now() - start, allow: null, error: errorMessage(e) };
        }
    };
    const [options, head, get] = await Promise.all([call("OPTIONS"), call("HEAD"), call("GET")]);
    const seen = [
        `OPTIONS ${options.status || "failed"}${options.allow ? ` | Allow: ${options.allow}` : ""}${options.error ? ` (${options.error})` : ""}`,
        `HEAD    ${head.status || "failed"}${head.error ? ` (${head.error})` : ""}`,
        `GET     ${get.status || "failed"}${get.error ? ` (${get.error})` : ""}`,
    ];
    return [
        `Method support for ${url.toString()}`,
        "",
        ...seen,
        "",
        options.allow
            ? `The Allow header advertises: ${options.allow}`
            : "OPTIONS did not advertise an Allow header - many servers only answer OPTIONS on a real API route.",
        head.status === 0
            ? "HEAD is refused; some uptime monitors probe with HEAD and will report this endpoint down."
            : `HEAD answered with ${head.status}, so a HEAD-based monitor works.`,
    ].join("\n");
}
const HEALTH_PATHS = ["/health", "/healthz", "/status", "/ready", "/livez", "/-/health", "/api/health", "/health/live"];
export async function healthPathProbe(args) {
    const url = normalizeTarget(args.host);
    const candidates = args.paths
        ? args.paths.split(/[,\s]+/).map((p) => p.trim()).filter(Boolean).map((p) => (p.startsWith("/") ? p : `/${p}`))
        : HEALTH_PATHS;
    const list = [...new Set(candidates)].slice(0, 12);
    const rows = [];
    const responding = [];
    for (const path of list) {
        const target = new URL(path, url.origin).toString();
        const start = Date.now();
        try {
            const res = await fetch(target, { headers: { "User-Agent": UA, Accept: "*/*" }, signal: AbortSignal.timeout(12000) });
            await res.arrayBuffer();
            const ms = Date.now() - start;
            const ok = res.status >= 200 && res.status < 400;
            if (ok)
                responding.push(path);
            rows.push(`${ok ? "FOUND" : "miss "} HTTP ${String(res.status).padStart(3)} ${String(ms).padStart(5)} ms  ${path}`);
        }
        catch (e) {
            rows.push(`miss  ${"---".padStart(3)} ${"-".padStart(5)}    ${path}  (${errorMessage(e)})`);
        }
    }
    return [
        `Health path probe for ${url.origin} (${list.length} candidate path(s))`,
        responding.length ? `Responding: ${responding.join(", ")}` : "None of the usual health paths answered.",
        "",
        ...rows,
        "",
        responding.length
            ? "Wire the responding path into your uptime monitor."
            : "No health endpoint found - add one so monitors can judge the app, not just the web server.",
    ].join("\n");
}
// ---- muxG tools:
import net from "node:net";
const RESOLVERS = [
    { label: "Google Public DNS", url: "https://dns.google/resolve" },
    { label: "Cloudflare 1.1.1.1", url: "https://cloudflare-dns.com/dns-query" },
    { label: "AdGuard DNS", url: "https://dns.adguard-dns.com/resolve" },
];
const PORT_NAMES = {
    21: "FTP", 22: "SSH", 25: "SMTP", 53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
    443: "HTTPS", 445: "SMB", 3306: "MySQL", 5432: "PostgreSQL", 6379: "Redis", 8080: "HTTP alt",
    8443: "HTTPS alt", 9200: "Elasticsearch", 27017: "MongoDB",
};
async function queryResolver(url, name, type) {
    try {
        const res = await fetch(`${url}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
            headers: { "User-Agent": UA, Accept: "application/dns-json" },
            signal: AbortSignal.timeout(15000),
        });
        if (!res.ok)
            return { ok: false, note: `HTTP ${res.status}`, answers: [], ttls: [], truncated: false };
        const body = (await res.text()).trim();
        if (!body)
            return { ok: false, note: "empty body", answers: [], ttls: [], truncated: false };
        const data = JSON.parse(body);
        if (typeof data.Status === "number" && data.Status !== 0) {
            const reasons = { 2: "server failure", 3: "NXDOMAIN", 5: "refused" };
            return { ok: false, note: reasons[data.Status] ?? `DNS status ${data.Status}`, answers: [], ttls: [], truncated: data.TC === true };
        }
        const answers = answerLines(data).map((line) => line.replace(/^TYPE\d+\s+/, ""));
        const ttls = (data.Answer ?? []).map((row) => Number(row.TTL) || 0).filter((ttl) => ttl > 0);
        return { ok: true, note: "", answers, ttls, truncated: data.TC === true };
    }
    catch (e) {
        return { ok: false, note: e.message, answers: [], ttls: [], truncated: false };
    }
}
function tcpProbe(host, port, timeoutMs) {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();
        let settled = false;
        const finish = (state, note) => {
            if (settled)
                return;
            settled = true;
            socket.destroy();
            resolve({ port, state, ms: Date.now() - start, note });
        };
        socket.setTimeout(timeoutMs);
        socket.once("connect", () => finish("open", ""));
        socket.once("timeout", () => finish("filtered", "no response before the timeout"));
        socket.once("error", (e) => {
            const note = e.code ?? e.message;
            finish(note === "ECONNREFUSED" ? "closed" : "error", note);
        });
        socket.connect(port, host);
    });
}
