import { connect } from "node:tls";
import { Socket } from "node:net";
const UA = "mrfentmen-uptimerobot-mcp/1.0";
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
    "via",
    "x-cache",
];
/**
 * Fetches a URL and follows redirects by hand so the caller can see every hop.
 * This is exactly the check an uptime monitor runs, done live.
 */
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
        body = (await res.text()).slice(0, 4000);
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
    };
}
export async function checkUrl(args) {
    const r = await request(args.url);
    const lines = [
        `${r.ok ? "UP" : "DOWN"} — ${r.finalUrl}`,
        `HTTP ${r.status} ${r.statusText} in ${r.ms} ms`,
        `Content type: ${r.contentType || "unknown"} | Server: ${r.server ?? "not disclosed"}`,
        `Body read: ${r.bytes} byte(s)`,
    ];
    if (r.hops.length > 1) {
        lines.push("", `Redirect chain (${r.hops.length} hop(s)):`);
        r.hops.forEach((hop, i) => {
            const arrow = hop.location ? ` -> ${hop.location}` : "";
            lines.push(`  ${i + 1}. ${hop.status} ${hop.url}${arrow}`);
        });
    }
    if (r.bodySnippet)
        lines.push("", `First text: ${r.bodySnippet}`);
    return lines.join("\n");
}
export async function checkEndpoints(args) {
    const urls = (args.urls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 10);
    if (!urls.length)
        return "Provide up to 10 URLs to check.";
    const rows = [];
    let up = 0;
    // Sequential on purpose: a monitor should not hammer a host from one IP at once.
    for (const url of urls) {
        try {
            const r = await request(url, 12000);
            if (r.ok)
                up += 1;
            rows.push(`${r.ok ? "UP  " : "DOWN"} ${r.status} ${String(r.ms).padStart(6)} ms  ${url}${r.finalUrl !== url ? ` -> ${r.finalUrl}` : ""}`);
        }
        catch (e) {
            rows.push(`DOWN --- ${url}  (${errorMessage(e)})`);
        }
    }
    const down = urls.length - up;
    return [
        `Checked ${urls.length} endpoint(s): ${up} up, ${down} down.`,
        down ? "Anything marked DOWN is either unreachable or answered with an error status." : "Every endpoint answered.",
        "",
        ...rows,
    ].join("\n");
}
const WELL_KNOWN = {
    21: "FTP", 22: "SSH", 25: "SMTP", 53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
    443: "HTTPS", 465: "SMTPS", 587: "SMTP submission", 993: "IMAPS", 995: "POP3S",
    3306: "MySQL", 5432: "PostgreSQL", 6379: "Redis", 8080: "HTTP alternate", 8443: "HTTPS alternate",
};
function probePort(host, port, timeoutMs = 8000) {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new Socket();
        const done = (open) => {
            socket.destroy();
            resolve({ port, open, ms: Date.now() - start, service: WELL_KNOWN[port] ?? "unknown service" });
        };
        socket.setTimeout(timeoutMs);
        socket.once("connect", () => done(true));
        socket.once("timeout", () => done(false));
        socket.once("error", () => done(false));
        socket.connect(port, host);
    });
}
export async function portMonitor(args) {
    const host = normalizeTarget(args.host).hostname;
    const ports = (args.ports?.length ? args.ports : [443, 80])
        .map((p) => Number(p))
        .filter((p) => Number.isInteger(p) && p > 0 && p < 65536)
        .slice(0, 10);
    if (!ports.length)
        return "Provide up to 10 TCP ports, for example [443, 80].";
    const results = [];
    // Sequential: a monitor opening many sockets at once looks like an attack.
    for (const port of ports)
        results.push(await probePort(host, port));
    const open = results.filter((r) => r.open).length;
    return [
        `TCP port check for ${host}`,
        `${open} of ${ports.length} port(s) accepting connections.`,
        "",
        ...results.map((r) => `${r.open ? "OPEN  " : "CLOSED"} ${String(r.port).padStart(5)} (${r.service}) ${String(r.ms).padStart(6)} ms`),
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
            const summary = {
                validTo,
                daysRemaining: Math.floor((validTo.getTime() - Date.now()) / 86400000),
                issuer: (c.issuer ?? {}).O ?? (c.issuer ?? {}).CN ?? "unknown",
                subject: (c.subject ?? {}).CN ?? hostname,
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
export async function sslExpiry(args) {
    const host = normalizeTarget(args.host).hostname;
    const info = await leafCertificate(host);
    const days = info.daysRemaining;
    const status = days < 0
        ? `EXPIRED ${Math.abs(days)} day(s) ago — every visitor gets a browser warning`
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
export async function dnsHealth(args) {
    const domain = normalizeTarget(args.domain).hostname;
    const results = await Promise.allSettled(RECORD_TYPES.map((type) => dnsQuery(domain, type)));
    const lines = [`DNS health for ${domain}`];
    let missing = 0;
    results.forEach((result, i) => {
        const type = RECORD_TYPES[i];
        if (result.status === "rejected") {
            lines.push(`  ${type}: lookup failed (${errorMessage(result.reason)})`);
            missing += 1;
            return;
        }
        const answers = answerLines(result.value);
        if (!answers.length) {
            lines.push(`  ${type}: none`);
            if (type === "A" || type === "NS")
                missing += 1;
            return;
        }
        lines.push(`  ${type}:`);
        answers.slice(0, 6).forEach((a) => lines.push(`    ${a}`));
    });
    const spf = results[4]?.status === "fulfilled"
        ? answerLines(results[4].value).find((a) => a.includes("v=spf1"))
        : undefined;
    lines.push("", `Core records present: ${missing === 0 ? "yes" : `no (${missing} missing)`}`);
    lines.push(`SPF: ${spf ? spf.replace(/^TXT /, "") : "not published — mail from this domain is unprotected"}`);
    return lines.join("\n");
}
/** One call that combines the HTTP, TLS and DNS checks a monitor would run. */
export async function monitorReport(args) {
    const url = normalizeTarget(args.url);
    const [http, cert, dns] = await Promise.allSettled([
        request(url.toString()),
        leafCertificate(url.hostname, url.port ? Number(url.port) : 443),
        dnsQuery(url.hostname, "A"),
    ]);
    const lines = [`Monitor report for ${url.toString()}`, ""];
    if (http.status === "fulfilled") {
        const r = http.value;
        lines.push(`HTTP: ${r.ok ? "UP" : "DOWN"} — ${r.status} ${r.statusText} in ${r.ms} ms`);
        lines.push(`  Final URL: ${r.finalUrl}${r.hops.length > 1 ? ` (${r.hops.length - 1} redirect(s))` : ""}`);
    }
    else {
        lines.push(`HTTP: DOWN — ${errorMessage(http.reason)}`);
    }
    if (cert.status === "fulfilled") {
        const c = cert.value;
        const state = c.daysRemaining < 0
            ? `expired ${Math.abs(c.daysRemaining)} day(s) ago`
            : `expires in ${c.daysRemaining} day(s)`;
        lines.push(`TLS: ${c.subject} issued by ${c.issuer} — ${state}`);
        lines.push(`  Trusted chain: ${c.authorized ? "yes" : "no"} | ${c.protocol}`);
    }
    else {
        lines.push(`TLS: unavailable — ${errorMessage(cert.reason)}`);
    }
    if (dns.status === "fulfilled") {
        const addresses = answerLines(dns.value);
        lines.push(`DNS: ${addresses.length ? addresses.join(", ") : "no A record published"}`);
    }
    else {
        lines.push(`DNS: unavailable — ${errorMessage(dns.reason)}`);
    }
    const healthy = http.status === "fulfilled" && http.value.ok
        && cert.status === "fulfilled" && cert.value.daysRemaining > 14;
    lines.push("", `Verdict: ${healthy ? "healthy — reachable over HTTPS with a valid certificate" : "needs attention, see the lines marked DOWN or unavailable"}`);
    return lines.join("\n");
}
