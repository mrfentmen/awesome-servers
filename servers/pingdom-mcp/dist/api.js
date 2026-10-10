import { connect } from "node:tls";
import { resolve4 } from "node:dns/promises";
const UA = "mrfentmen-pingdom-mcp/1.0";
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
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
async function fetchChain(target, timeoutMs = 20000) {
    const start = Date.now();
    let url = normalizeTarget(target);
    const hops = [];
    let res = null;
    for (let i = 0; i < 6; i += 1) {
        const hopStart = Date.now();
        res = await fetch(url, {
            redirect: "manual",
            headers: { "User-Agent": UA, Accept: "*/*" },
            signal: AbortSignal.timeout(timeoutMs),
        });
        const location = res.headers.get("location");
        hops.push({ url: url.toString(), status: res.status, location, ms: Date.now() - hopStart });
        if (res.status >= 300 && res.status < 400 && location) {
            url = new URL(location, url);
            continue;
        }
        break;
    }
    if (!res)
        throw new Error("No response received.");
    const body = await res.text();
    return {
        status: res.status,
        statusText: res.statusText,
        finalUrl: url.toString(),
        ms: Date.now() - start,
        headers: res.headers,
        html: body.slice(0, 200000),
        hops,
        bytes: Buffer.byteLength(body),
    };
}
function timeFor(target, samples, timeoutMs) {
    const url = normalizeTarget(target).toString();
    const run = async () => {
        const start = Date.now();
        const res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "*/*" },
            signal: AbortSignal.timeout(timeoutMs),
        });
        // Read the body so the timing covers the whole transfer, not just the headers.
        await res.arrayBuffer();
        return { ms: Date.now() - start, status: res.status };
    };
    // Sequential so one check does not distort the next one's timing.
    return (async () => {
        const out = [];
        for (let i = 0; i < samples; i += 1)
            out.push(await run());
        return out;
    })();
}
export async function checkUrl(args) {
    const r = await fetchChain(args.url, 15000);
    const ok = r.status >= 200 && r.status < 400;
    return [
        `${ok ? "UP" : "DOWN"} — ${r.finalUrl}`,
        `HTTP ${r.status} ${r.statusText} in ${r.ms} ms`,
        `Server: ${r.headers.get("server") ?? "not disclosed"} | Content type: ${r.headers.get("content-type") ?? "unknown"}`,
        r.hops.length > 1 ? `Redirects: ${r.hops.length - 1}` : "Redirects: none",
        r.headers.get("x-cache") ? `CDN cache: ${r.headers.get("x-cache")}` : "",
    ].filter(Boolean).join("\n");
}
export async function responseTimes(args) {
    const samples = Math.min(Math.max(Number(args.samples ?? 3) || 3, 2), 10);
    // One uncounted request first, so a cold DNS/TLS connection is not reported
    // as the site being unstable.
    await timeFor(args.url, 1, 20000);
    const results = await timeFor(args.url, samples, 20000);
    const times = results.map((r) => r.ms);
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]
        : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const spread = sorted[sorted.length - 1] - sorted[0];
    const failing = results.filter((r) => r.status >= 400 || r.status === 0).length;
    const unsteady = spread > Math.max(100, median);
    return [
        `Response times for ${normalizeTarget(args.url).toString()} (${samples} sample(s), after one warm-up request)`,
        `min ${sorted[0]} ms | median ${median} ms | avg ${avg} ms | max ${sorted[sorted.length - 1]} ms`,
        `Jitter (max - min): ${spread} ms — ${unsteady ? "high, requests take noticeably different times" : "low, the site answers steadily"}`,
        `HTTP statuses: ${[...new Set(results.map((r) => r.status))].join(", ")}`,
        failing ? `Attention: ${failing} of ${samples} request(s) returned an error status.` : "",
        "",
        "Per-request: " + times.map((t, i) => `#${i + 1} ${t}ms`).join(", "),
    ].filter(Boolean).join("\n");
}
export async function checkRedirects(args) {
    const r = await fetchChain(args.url, 15000);
    const lines = [`Redirect chain for ${normalizeTarget(args.url).toString()} — ${r.hops.length} hop(s)`, ""];
    r.hops.forEach((hop, i) => {
        lines.push(`${i + 1}. ${hop.status} ${hop.url} (${hop.ms} ms)`);
        if (hop.location)
            lines.push(`     -> ${hop.location}`);
    });
    const seen = new Set();
    let loop = false;
    for (const hop of r.hops) {
        if (seen.has(hop.url))
            loop = true;
        seen.add(hop.url);
    }
    const insecureFirst = r.hops[0]?.url.startsWith("http://") ?? false;
    const endsSecure = r.finalUrl.startsWith("https://");
    const extra = r.hops.length - 1;
    lines.push("", `Final URL: ${r.finalUrl}`);
    lines.push(`Redirect loop: ${loop ? "YES — the chain revisits a URL" : "no"}`);
    lines.push(`Extra hops to remove: ${Math.max(extra - 1, 0)} (${extra} redirect(s) suggest a http->https or www->apex rule)`);
    if (insecureFirst)
        lines.push(`Starts on plain HTTP: yes ${endsSecure ? "and upgrades to HTTPS" : "and never upgrades to HTTPS"}`);
    if (r.hops.length >= 6)
        lines.push("Warning: the chain hit the 6-hop limit, so it may never terminate.");
    return lines.join("\n");
}
export async function measureTiming(target) {
    const url = normalizeTarget(target);
    const secure = url.protocol === "https:";
    const port = url.port ? Number(url.port) : secure ? 443 : 80;
    const dnsStart = Date.now();
    await resolve4(url.hostname);
    const dnsMs = Date.now() - dnsStart;
    const tlsStart = Date.now();
    const handshake = await new Promise((resolve, reject) => {
        if (!secure) {
            // A plain-HTTP check has no handshake, but still needs a reachable socket.
            const socket = connect({ host: url.hostname, port, rejectUnauthorized: false, timeout: 15000 }, () => {
                const connectMs = Date.now() - tlsStart;
                socket.destroy();
                resolve({ connectMs, tlsMs: 0 });
            });
            socket.on("error", (e) => reject(new Error(`Cannot open a TCP connection to ${url.hostname}:${port}: ${e.message}`)));
            socket.on("timeout", () => {
                socket.destroy();
                reject(new Error(`TCP connection to ${url.hostname}:${port} timed out.`));
            });
            return;
        }
        const socket = connect({ host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false, timeout: 15000 }, () => {
            resolve({ connectMs: Date.now() - tlsStart, tlsMs: Math.max(Date.now() - tlsStart, 0) });
            socket.destroy();
        });
        socket.on("error", (e) => reject(new Error(`TLS handshake with ${url.hostname}:${port} failed: ${e.message}`)));
        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error(`TLS handshake with ${url.hostname}:${port} timed out.`));
        });
    });
    const requestStart = Date.now();
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "*/*" },
        signal: AbortSignal.timeout(20000),
    });
    const firstByteMs = Date.now() - requestStart;
    await res.arrayBuffer();
    const totalMs = dnsMs + handshake.connectMs + (Date.now() - requestStart);
    return {
        dnsMs,
        connectMs: handshake.connectMs,
        tlsMs: handshake.tlsMs,
        firstByteMs,
        totalMs,
    };
}
export async function performanceReport(args) {
    const url = normalizeTarget(args.url);
    const [timing, page] = await Promise.all([
        measureTiming(url.toString()),
        fetchChain(url.toString(), 20000),
    ]);
    const html = page.html;
    const scripts = (html.match(/<script[^>]+src=/gi) ?? []).length;
    const styles = (html.match(/<link[^>]+rel=["']?stylesheet/gi) ?? []).length;
    const images = (html.match(/<img[^>]/gi) ?? []).length;
    const kb = Math.round(page.bytes / 1024);
    const encoding = page.headers.get("content-encoding") ?? "none";
    const cacheControl = page.headers.get("cache-control") ?? "not set";
    const compressed = encoding !== "none";
    const cacheable = /max-age=\d+/.test(cacheControl);
    const grades = [];
    if (timing.firstByteMs > 800)
        grades.push(`slow server response (${timing.firstByteMs} ms to first byte)`);
    if (timing.totalMs > 2000)
        grades.push(`slow total load (${timing.totalMs} ms)`);
    if (!compressed)
        grades.push("response is not compressed");
    if (!cacheable)
        grades.push("no cache max-age on the HTML response");
    if (images > 0 && !/<img[^>]+(loading=["']?lazy|width=)/i.test(html))
        grades.push("images are not lazy-loaded or sized");
    if (scripts > 10)
        grades.push(`${scripts} blocking script tags`);
    return [
        `Performance report for ${page.finalUrl}`,
        "",
        "Timing breakdown:",
        `  DNS lookup:      ${timing.dnsMs} ms`,
        `  Connect + TLS:   ${timing.connectMs} ms${timing.tlsMs ? " (handshake included)" : ""}`,
        `  Time to headers: ${timing.firstByteMs} ms`,
        `  Total (approx):  ${timing.totalMs} ms`,
        "",
        "Payload:",
        `  HTML transferred: ${kb} KB`,
        `  Compression: ${compressed ? encoding : "off — enable gzip or brotli"} (${page.headers.get("content-type") ?? "unknown type"})`,
        `  Cache-Control: ${cacheControl}`,
        `  Server: ${page.headers.get("server") ?? "not disclosed"}`,
        "",
        "Page contents:",
        `  ${scripts} script(s), ${styles} stylesheet(s), ${images} image(s)`,
        `  HTTP ${page.status} after ${page.hops.length} hop(s)`,
        "",
        grades.length
            ? `Fixes worth doing (${grades.length}):\n${grades.map((g) => `  - ${g}`).join("\n")}`
            : "No obvious performance problems found in the timings or headers.",
    ].join("\n");
}
export async function certificateExpiry(args) {
    const host = normalizeTarget(args.host).hostname;
    const cert = await new Promise((resolve, reject) => {
        const socket = connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 15000 }, () => {
            const c = socket.getPeerCertificate();
            if (!c || !c.valid_to) {
                socket.destroy();
                reject(new Error(`No certificate returned by ${host}.`));
                return;
            }
            const issuer = (c.issuer ?? {});
            const subject = (c.subject ?? {});
            const info = {
                validTo: new Date(c.valid_to),
                issuer: issuer.O ?? issuer.CN ?? "unknown",
                subject: subject.CN ?? host,
                authorized: socket.authorized,
            };
            socket.destroy();
            resolve(info);
        });
        socket.on("error", (e) => reject(new Error(`TLS connection to ${host} failed: ${e.message}`)));
        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error(`TLS connection to ${host} timed out.`));
        });
    });
    const days = Math.floor((cert.validTo.getTime() - Date.now()) / 86400000);
    const status = days < 0
        ? `EXPIRED ${Math.abs(days)} day(s) ago — visitors see a browser warning`
        : days <= 7
            ? `CRITICAL: ${days} day(s) left`
            : days <= 30
                ? `WARNING: ${days} day(s) left`
                : `OK: ${days} day(s) left`;
    return [
        `Certificate expiry for ${host}`,
        `Status: ${status}`,
        `Expires: ${cert.validTo.toISOString()}`,
        `Issuer: ${cert.issuer}`,
        `Common name: ${cert.subject}`,
        `Trusted chain: ${cert.authorized ? "yes" : "no"}`,
    ].join("\n");
}
export async function brokenLinks(args) {
    const base = normalizeTarget(args.url);
    const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 40);
    const page = await fetchChain(base.toString(), 20000);
    const hrefs = [...page.html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)]
        .map((m) => m[1])
        .filter((href) => !/^(mailto:|tel:|javascript:|data:)/i.test(href));
    const unique = [];
    const seen = new Set();
    for (const href of hrefs) {
        let absolute;
        try {
            absolute = new URL(href, base).toString();
        }
        catch {
            continue;
        }
        if (seen.has(absolute))
            continue;
        seen.add(absolute);
        unique.push(absolute);
        if (unique.length >= limit)
            break;
    }
    if (!unique.length)
        return `No links found on ${page.finalUrl}.`;
    const rows = [];
    let broken = 0;
    // Sequential: a link check should not open many sockets to one host at once.
    for (const link of unique) {
        try {
            const res = await fetch(link, {
                method: "HEAD",
                redirect: "follow",
                headers: { "User-Agent": UA },
                signal: AbortSignal.timeout(12000),
            });
            const bad = res.status >= 400;
            if (bad)
                broken += 1;
            rows.push(`${bad ? "BROKEN" : "ok    "} ${res.status} ${link}`);
        }
        catch (e) {
            broken += 1;
            rows.push(`BROKEN --- ${link} (${errorMessage(e)})`);
        }
    }
    return [
        `Link check for ${page.finalUrl}`,
        `Checked ${unique.length} link(s) found on the page: ${broken} broken.`,
        "",
        ...rows,
        "",
        broken ? "Fix these before they cost you rankings or trust." : "Every link answered without an error status.",
    ].join("\n");
}
// ---- muxH tools:
// Everything above this marker answers "is the site up and how fast is it".
// These two answer the other half of an uptime question: is the host configured
// safely and safely resolvable.
const SECURITY_HEADERS = [
    { name: "strict-transport-security", why: "tells browsers to refuse plain HTTP for a year", weight: 3 },
    { name: "content-security-policy", why: "restricts which scripts and frames a page may load", weight: 3 },
    { name: "x-content-type-options", why: "stops a browser guessing a response's type", weight: 2 },
    { name: "x-frame-options", why: "stops the page being framed for clickjacking", weight: 2 },
    { name: "referrer-policy", why: "controls how much URL is leaked to third parties", weight: 1 },
    { name: "permissions-policy", why: "turns off browser features the page does not need", weight: 1 },
    { name: "cross-origin-opener-policy", why: "isolates the browsing context from cross-origin windows", weight: 1 },
];
async function securityFetch(target) {
    const url = normalizeTarget(target);
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "*/*" },
        signal: AbortSignal.timeout(20000),
    });
    await res.arrayBuffer();
    if (!res.ok && res.status >= 500) {
        throw new Error(`${url.hostname} answered HTTP ${res.status} ${res.statusText}, so its headers cannot be judged.`);
    }
    return { url, res, bytes: 0 };
}
async function resolveAny(host, type) {
    const dns = await import("node:dns/promises");
    switch (type) {
        case "A":
        case "AAAA":
        case "CNAME":
        case "NS":
        case "TXT":
        case "SRV":
        case "CAA":
            return (await dns.resolve(host, type));
        case "MX":
            return (await dns.resolveMx(host));
        case "SOA":
            return [await dns.resolveSoa(host)];
        default:
            return [];
    }
}
function describeRecord(type, row) {
    if (typeof row === "string")
        return row;
    if (Array.isArray(row))
        return row.join(" ");
    if (type === "MX" && typeof row === "object" && "exchange" in row) {
        return `${String(row.exchange)} (priority ${String(row.priority)})`;
    }
    if (type === "SRV" && typeof row === "object" && "name" in row) {
        const s = row;
        return `${s.name} (priority ${s.priority}, weight ${s.weight}, port ${s.port})`;
    }
    if (type === "CAA" && typeof row === "object" && "issue" in row) {
        const c = row;
        return `${c.issue} (critical flag ${c.critical})`;
    }
    if (type === "SOA" && typeof row === "object" && "nsname" in row) {
        const s = row;
        return `${s.nsname}, hostmaster ${s.hostmaster}, serial ${s.serial}, refresh ${s.refresh}s, retry ${s.retry}s, expire ${s.expire}s, minimum ttl ${s.minttl}s`;
    }
    return String(row);
}
