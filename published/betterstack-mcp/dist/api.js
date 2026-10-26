import { connect } from "node:tls";
import { resolve4 } from "node:dns/promises";
import { connect as netConnect } from "node:net";
const UA = "mrfentmen-betterstack-mcp/1.0";
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
/** Fetches a URL hop by hop so every redirect is visible, and keeps the HTML for content checks. */
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
        `HTTP statuses seen: ${[...new Set(results.map((r) => r.status))].join(", ")}`,
        failing ? `Attention: ${failing} of ${samples} request(s) returned an error status.` : "",
        "",
        "Per-request: " + times.map((t, i) => `#${i + 1} ${t}ms`).join(", "),
    ].filter(Boolean).join("\n");
}
/** Splits one request into the stages an observability tool would chart. */
async function measureTiming(target) {
    const url = normalizeTarget(target);
    const secure = url.protocol === "https:";
    const port = url.port ? Number(url.port) : secure ? 443 : 80;
    const dnsStart = Date.now();
    await resolve4(url.hostname);
    const dnsMs = Date.now() - dnsStart;
    const connectStart = Date.now();
    const handshake = await new Promise((resolve, reject) => {
        const socket = connect(secure
            ? { host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false, timeout: 15000 }
            : { host: url.hostname, port, rejectUnauthorized: false, timeout: 15000 }, () => {
            const connectMs = Date.now() - connectStart;
            socket.destroy();
            resolve({ connectMs, tlsMs: secure ? connectMs : 0 });
        });
        socket.on("error", (e) => reject(new Error(`Cannot open a TCP connection to ${url.hostname}:${port}: ${e.message}`)));
        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error(`Connection to ${url.hostname}:${port} timed out.`));
        });
    });
    const requestStart = Date.now();
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "*/*" },
        signal: AbortSignal.timeout(20000),
    });
    const firstByteMs = Date.now() - requestStart;
    await res.arrayBuffer();
    return {
        dnsMs,
        connectMs: handshake.connectMs,
        tlsMs: handshake.tlsMs,
        firstByteMs,
        totalMs: dnsMs + handshake.connectMs + (Date.now() - requestStart),
    };
}
export async function latencyBreakdown(args) {
    const url = normalizeTarget(args.url);
    const t = await measureTiming(url.toString());
    const slowest = Math.max(t.dnsMs, t.connectMs, t.firstByteMs);
    const stage = slowest === t.firstByteMs
        ? "the server itself — it takes the longest to start answering, which means slow code or a slow database, not a slow network"
        : slowest === t.connectMs
            ? "the network hop — connecting takes the longest, so the host is far away or the connection setup is slow"
            : "DNS — resolving the name takes the longest, so the resolver or the domain's nameservers need attention";
    return [
        `Latency breakdown for ${url.toString()}`,
        "",
        `  DNS lookup:       ${String(t.dnsMs).padStart(6)} ms`,
        `  TCP connect:      ${String(t.connectMs).padStart(6)} ms`,
        t.tlsMs ? `  TLS handshake:    ${String(t.tlsMs).padStart(6)} ms (included in the connect time)` : "  TLS handshake:    none (plain HTTP)",
        `  Time to headers:  ${String(t.firstByteMs).padStart(6)} ms`,
        `  Total:            ${String(t.totalMs).padStart(6)} ms`,
        "",
        `Slowest stage: ${stage}.`,
        t.totalMs > 2000
            ? "Total above 2 seconds: visitors on a slow connection will notice this."
            : "Total is inside the usual budget for a page request.",
    ].join("\n");
}
export async function contentCheck(args) {
    const page = await fetchChain(args.url, 20000);
    const html = page.html;
    const meta = (name) => {
        const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
        const reversed = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i");
        return (html.match(pattern)?.[1] ?? html.match(reversed)?.[1] ?? "").trim();
    };
    const rawTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const title = rawTitle.replace(/\s+/g, " ").trim();
    const description = meta("description");
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? "";
    const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? "";
    const viewport = meta("viewport");
    const h1s = (html.match(/<h1[\s>]/gi) ?? []).length;
    const images = (html.match(/<img[\s>]/gi) ?? []).length;
    const imagesWithoutAlt = (html.match(/<img(?![^>]*\balt=)[^>]*>/gi) ?? []).length;
    const scripts = (html.match(/<script[\s>]/gi) ?? []).length;
    const stylesheets = (html.match(/<link[^>]+rel=["']stylesheet["']/gi) ?? []).length;
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
    const words = text ? text.split(" ").length : 0;
    const issues = [];
    if (!title)
        issues.push("no <title> — search results and browser tabs show nothing useful");
    else if (title.length > 60)
        issues.push(`title is ${title.length} characters, search results cut it near 60`);
    if (!description)
        issues.push("no meta description — search engines invent one from the page");
    else if (description.length > 160)
        issues.push(`meta description is ${description.length} characters, search results cut it near 160`);
    if (!lang)
        issues.push("no lang attribute on <html> — screen readers cannot pick a voice");
    if (!viewport)
        issues.push("no viewport meta tag — the page will not scale on phones");
    if (h1s === 0)
        issues.push("no <h1> — the page has no stated headline");
    if (h1s > 1)
        issues.push(`${h1s} <h1> tags — a page should have exactly one`);
    if (imagesWithoutAlt)
        issues.push(`${imagesWithoutAlt} image(s) without alt text — invisible to screen readers and image search`);
    if (words < 150)
        issues.push(`only about ${words} words — thin pages rank poorly`);
    return [
        `Content check for ${page.finalUrl} (HTTP ${page.status})`,
        "",
        "Page metadata:",
        `  Title: ${title || "(missing)"}${title ? ` (${title.length} chars)` : ""}`,
        `  Description: ${description || "(missing)"}${description ? ` (${description.length} chars)` : ""}`,
        `  Canonical: ${canonical || "(not set)"}`,
        `  Language: ${lang || "(not declared)"}`,
        `  Viewport: ${viewport || "(not set)"}`,
        "",
        "Structure:",
        `  ${h1s} <h1>, ${images} image(s), ${scripts} <script>, ${stylesheets} stylesheet(s)`,
        `  About ${words} words of visible text | ${Math.round(page.bytes / 1024)} KB transferred`,
        "",
        issues.length
            ? `Problems found (${issues.length}):\n${issues.map((i) => `  - ${i}`).join("\n")}`
            : "No content problems found in the metadata or structure.",
    ].join("\n");
}
export async function redirectChain(args) {
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
    const slowest = [...r.hops].sort((a, b) => b.ms - a.ms)[0];
    lines.push("", `Final URL: ${r.finalUrl}`);
    lines.push(`Redirect loop: ${loop ? "YES — the chain revisits a URL" : "no"}`);
    lines.push(`Extra hops to remove: ${Math.max(extra - 1, 0)} (${extra} redirect(s) suggest a http->https or www->apex rule)`);
    if (insecureFirst)
        lines.push(`Starts on plain HTTP: yes ${endsSecure ? "and upgrades to HTTPS" : "and never upgrades to HTTPS"}`);
    if (slowest && slowest.ms > 300)
        lines.push(`Slowest hop: ${slowest.ms} ms at ${slowest.url} — a redirect that lands on a slow host is paid for twice`);
    if (r.hops.length >= 6)
        lines.push("Warning: the chain hit the 6-hop limit, so it may never terminate.");
    return lines.join("\n");
}
const HEADER_GROUPS = [
    { name: "Server and origin", headers: ["server", "via", "x-powered-by", "x-served-by", "x-backend"] },
    { name: "Caching and CDN", headers: ["cache-control", "age", "x-cache", "cf-cache-status", "etag", "last-modified", "vary"] },
    { name: "Compression and type", headers: ["content-encoding", "content-type", "content-length", "transfer-encoding"] },
    { name: "Security", headers: ["strict-transport-security", "content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy"] },
    { name: "Cookies", headers: ["set-cookie"] },
];
export async function headersReport(args) {
    const page = await fetchChain(args.url, 20000);
    const lines = [`Response headers for ${page.finalUrl} (HTTP ${page.status} ${page.statusText})`, ""];
    for (const group of HEADER_GROUPS) {
        lines.push(`${group.name}:`);
        const found = group.headers
            .map((h) => [h, page.headers.get(h)])
            .filter(([, v]) => Boolean(v));
        if (!found.length)
            lines.push("  (none sent)");
        for (const [name, value] of found)
            lines.push(`  ${name}: ${String(value).slice(0, 300)}`);
        lines.push("");
    }
    const encoding = page.headers.get("content-encoding");
    const cacheControl = page.headers.get("cache-control") ?? "";
    const notes = [];
    if (!encoding)
        notes.push("nothing is compressed — turn on gzip or brotli to shrink the transfer");
    if (!/max-age=\d+/.test(cacheControl))
        notes.push("no cache max-age — browsers and CDNs will re-fetch this page every time");
    if (page.headers.get("x-powered-by"))
        notes.push("x-powered-by tells attackers the exact stack");
    if (page.headers.get("set-cookie") && !/httponly/i.test(page.headers.get("set-cookie") ?? "")) {
        notes.push("a cookie is set without HttpOnly — script on the page can read it");
    }
    if (!page.headers.get("strict-transport-security"))
        notes.push("no HSTS — a first plain-HTTP request can still be intercepted");
    lines.push(notes.length
        ? `Worth fixing (${notes.length}):\n${notes.map((n) => `  - ${n}`).join("\n")}`
        : "No problems found in the headers sent by this response.");
    return lines.join("\n");
}
async function dnsA(name) {
    const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=A`, {
        headers: { "User-Agent": UA, Accept: "application/dns-json" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`DNS-over-HTTPS returned ${res.status}`);
    const body = (await res.json());
    return (body.Answer ?? []).map((row) => String(row.data ?? "").trim()).filter(Boolean);
}
/** One call combining reachability, latency, TLS and DNS for a single endpoint. */
export async function endpointSummary(args) {
    const url = normalizeTarget(args.url);
    const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
    const [timing, tls, dns] = await Promise.allSettled([
        measureTiming(url.toString()),
        new Promise((resolve, reject) => {
            const socket = connect({ host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false, timeout: 15000 }, () => {
                const c = socket.getPeerCertificate();
                socket.destroy();
                if (!c || !c.valid_to) {
                    reject(new Error("no certificate returned"));
                    return;
                }
                resolve({
                    days: Math.floor((new Date(c.valid_to).getTime() - Date.now()) / 86400000),
                    issuer: (c.issuer ?? {}).O ?? "unknown",
                });
            });
            socket.on("error", (e) => reject(new Error(e.message)));
            socket.on("timeout", () => {
                socket.destroy();
                reject(new Error("timed out"));
            });
        }),
        dnsA(url.hostname),
    ]);
    const lines = [`Endpoint summary for ${url.toString()}`, ""];
    if (timing.status === "fulfilled") {
        const t = timing.value;
        lines.push(`Reachable: yes — total ${t.totalMs} ms (DNS ${t.dnsMs} ms, connect ${t.connectMs} ms, headers ${t.firstByteMs} ms)`);
        lines.push(`  Verdict: ${t.totalMs > 2000 ? "slow, over 2 seconds" : t.totalMs > 800 ? "acceptable but not quick" : "fast"}`);
    }
    else {
        lines.push(`Reachable: NO — ${errorMessage(timing.reason)}`);
    }
    if (tls.status === "fulfilled") {
        lines.push(`TLS: ${tls.value.issuer} — ${tls.value.days} day(s) left${tls.value.days < 14 ? " (renew soon)" : ""}`);
    }
    else {
        lines.push(`TLS: unavailable — ${errorMessage(tls.reason)}`);
    }
    if (dns.status === "fulfilled") {
        lines.push(`DNS: ${dns.value.length ? dns.value.join(", ") : "no A record published"}`);
    }
    else {
        lines.push(`DNS: unavailable — ${errorMessage(dns.reason)}`);
    }
    return lines.join("\n");
}
// ---- batch-3 tools: certificate, DNS, ports, TLS (2026-09-27) ----
export async function certificateInfo(args) {
    const url = normalizeTarget(args.url);
    const port = url.port ? Number(url.port) : 443;
    const info = await new Promise((resolve, reject) => {
        const socket = connect({ host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false, timeout: 15000 }, () => {
            const cert = socket.getPeerCertificate(true);
            const trusted = socket.authorized;
            socket.destroy();
            if (!cert || !cert.valid_to) {
                reject(new Error(`No TLS certificate returned by ${url.hostname}:${port}.`));
                return;
            }
            // Node types the certificate name fields as string | string[], so coerce them.
            const flat = (value) => Array.isArray(value) ? (value[0] ?? 'unknown') : value ?? 'unknown';
            const commonName = flat(cert.subject?.CN);
            const subject = commonName === 'unknown' ? flat(Object.values(cert.subject ?? {})[0]) : commonName;
            const issuerOrg = flat(cert.issuer?.O);
            const issuer = issuerOrg === 'unknown' ? flat(cert.issuer?.CN) : issuerOrg;
            const validTo = new Date(cert.valid_to);
            let chain = 0;
            let node = cert;
            while (node && chain < 6) {
                chain += 1;
                const next = node.issuerCertificate;
                if (!next || next.fingerprint === node.fingerprint)
                    break;
                node = next;
            }
            resolve({
                subject,
                issuer,
                validFrom: cert.valid_from ?? '?',
                validTo: cert.valid_to ?? '?',
                daysLeft: Math.floor((validTo.getTime() - Date.now()) / 86400000),
                serial: cert.serialNumber ?? '?',
                fingerprint: cert.fingerprint256 ?? '?',
                altNames: String(cert.subjectaltname ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20),
                chain,
                selfSigned: subject === issuer,
                trusted,
            });
        });
        socket.on('error', (e) => reject(new Error(`Cannot read the certificate of ${url.hostname}:${port}: ${e.message}`)));
        socket.on('timeout', () => {
            socket.destroy();
            reject(new Error(`Connection to ${url.hostname}:${port} timed out.`));
        });
    });
    return [
        `TLS certificate for ${url.hostname}:${port}`,
        `Subject: ${info.subject} | Issuer: ${info.issuer}`,
        `Valid: ${String(info.validFrom).slice(0, 16)} to ${String(info.validTo).slice(0, 16)} — ${info.daysLeft} day(s) left${info.daysLeft < 21 ? ' (renew soon)' : ''}`,
        `Chain presented: ${info.chain} certificate(s) | Self-signed: ${info.selfSigned ? 'yes' : 'no'} | Trusted by Node: ${info.trusted ? 'yes' : 'no'}`,
        `Serial: ${info.serial}`,
        `SHA-256 fingerprint: ${info.fingerprint}`,
        info.altNames.length ? `Alternate names (${info.altNames.length}): ${info.altNames.map((n) => n.replace(/^DNS:/, '')).join(', ')}` : 'No subject alternative names published.',
    ].join('\n');
}
const DNS_TYPES = { A: 1, NS: 2, CNAME: 5, MX: 15, TXT: 16, AAAA: 28, CAA: 257 };
const DNS_STATUS = { 0: 'ok', 2: 'server failure', 3: 'NXDOMAIN (name does not exist)', 5: 'refused' };
async function dnsLookup(name, type) {
    const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/dns-json' },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`DNS-over-HTTPS returned ${res.status}`);
    const body = (await res.json());
    const values = (body.Answer ?? [])
        .filter((row) => row.type === DNS_TYPES[type])
        .map((row) => String(row.data ?? '').trim().replace(/^"([\s\S]*)"$/, '$1'));
    return { status: body.Status ?? -1, values };
}
export async function dnsRecords(args) {
    const raw = (args.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!raw || !raw.includes('.'))
        throw new Error('Provide a domain like example.com.');
    const types = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'CAA'];
    const lines = [`DNS records for ${raw} (via DNS-over-HTTPS)`];
    let anyRecord = false;
    for (const type of types) {
        const { status, values } = await dnsLookup(raw, type);
        if (!values.length) {
            lines.push(`${type}: none${status === 3 ? ' (name does not exist)' : status !== 0 ? ` (${DNS_STATUS[status] ?? `status ${status}`})` : ''}`);
            continue;
        }
        anyRecord = true;
        const shown = values.slice(0, 5).map((v) => (v.length > 160 ? `${v.slice(0, 160)}…` : v));
        lines.push(`${type} (${values.length}): ${shown.join(' | ')}`);
    }
    if (!anyRecord) {
        lines.push('', 'Nothing resolved. Check the spelling or the domain may be parked/expired.');
        return lines.join('\n');
    }
    const txt = (await dnsLookup(raw, 'TXT')).values;
    const spf = txt.find((t) => t.startsWith('v=spf1'));
    const dmarc = (await dnsLookup(`_dmarc.${raw}`, 'TXT')).values.find((t) => t.startsWith('v=DMARC1'));
    lines.push('', `SPF: ${spf ?? 'not published'}`, `DMARC: ${dmarc ?? 'not published'}`);
    return lines.join('\n');
}
async function probePort(host, port, timeoutMs = 5000) {
    const start = Date.now();
    return new Promise((resolve) => {
        const socket = netConnect({ host, port, timeout: timeoutMs }, () => {
            const ms = Date.now() - start;
            socket.destroy();
            resolve({ port, open: true, ms, reason: 'Connection accepted' });
        });
        socket.on('error', (e) => resolve({ port, open: false, ms: Date.now() - start, reason: e.message }));
        socket.on('timeout', () => {
            socket.destroy();
            resolve({ port, open: false, ms: Date.now() - start, reason: `No answer within ${timeoutMs} ms` });
        });
    });
}
export async function portCheck(args) {
    const url = normalizeTarget(args.host);
    const wanted = (args.ports ?? '80,443')
        .split(/[,\s]+/)
        .map((p) => Number(p.trim()))
        .filter((p) => Number.isInteger(p) && p > 0 && p <= 65535)
        .slice(0, 10);
    if (!wanted.length)
        throw new Error('Provide TCP ports to test, e.g. "80,443,22".');
    const results = [];
    let open = 0;
    for (const port of wanted) {
        const r = await probePort(url.hostname, port);
        if (r.open)
            open += 1;
        results.push(`${r.open ? 'OPEN' : 'closed'} ${port}/tcp — ${r.reason} (${r.ms} ms)`);
    }
    return [
        `TCP port check for ${url.hostname} (${wanted.length} port(s) tested)`,
        `${open} of ${wanted.length} port(s) accepted a connection.`,
        '',
        ...results,
    ].join('\n');
}
const TLS_VERSIONS = ['TLSv1.2', 'TLSv1.3'];
export async function tlsVersions(args) {
    const url = normalizeTarget(args.host);
    const port = Number(args.port ?? (url.port ? Number(url.port) : 443));
    const results = [];
    for (const version of TLS_VERSIONS) {
        results.push(await new Promise((resolve) => {
            const socket = connect({ host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false, timeout: 10000, minVersion: version, maxVersion: version }, () => {
                const protocol = socket.getProtocol();
                const cipher = socket.getCipher();
                socket.destroy();
                resolve(`SUPPORTED ${version} — negotiated ${protocol ?? version} with ${cipher?.name ?? 'unknown cipher'}`);
            });
            socket.on('error', (e) => resolve(`not supported ${version} — ${e.message}`));
            socket.on('timeout', () => {
                socket.destroy();
                resolve(`not supported ${version} — connection timed out`);
            });
        }));
    }
    const supported = results.filter((r) => r.startsWith('SUPPORTED')).length;
    return [
        `TLS protocol support for ${url.hostname}:${port}`,
        `${supported} of ${TLS_VERSIONS.length} modern version(s) work.`,
        '',
        ...results,
        '',
        supported === 0
            ? 'Neither TLS 1.2 nor TLS 1.3 completed: the port may not speak TLS at all.'
            : 'TLS 1.2 and 1.3 are the only versions that should be enabled; older versions are unsafe.',
    ].join('\n');
}
// ---- muxD tools:
const RDAP_BOOTSTRAP = "https://rdap.org/domain/";
const IP_GEO = "http://ip-api.com/json/";
/** RDAP vcard: ["vcard", [["fn", {}, "text", "Name"], ...]] - the value sits at index 3. */
function vcardName(entity) {
    const arr = entity.vcardArray;
    if (!Array.isArray(arr) || !Array.isArray(arr[1]))
        return null;
    for (const prop of arr[1]) {
        if (Array.isArray(prop) && prop[0] === "fn" && typeof prop[3] === "string" && prop[3])
            return prop[3];
    }
    return null;
}
export async function hostNetwork(args) {
    const host = normalizeTarget(args.host).hostname;
    const addresses = await dnsA(host);
    if (!addresses.length)
        throw new Error(`No A record for ${host}.`);
    const ip = addresses[0];
    const res = await fetch(`${IP_GEO}${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,isp,org,as,asname,reverse,hosting`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`The network lookup service returned ${res.status} for ${ip}.`);
    const geo = (await res.json());
    if (geo.status !== "success") {
        throw new Error(`The network lookup service could not place ${ip}: ${geo.message ?? "no reason given"}`);
    }
    return [
        `Network profile for ${host}`,
        `IP: ${addresses.join(", ")}`,
        `Autonomous system: ${geo.as ?? "not reported"}${geo.asname ? ` (${geo.asname})` : ""}`,
        `Operator: ${geo.org || geo.isp || "not reported"}`,
        `Reverse DNS: ${geo.reverse ?? "none published"}`,
        `Location: ${[geo.city, geo.regionName, geo.country].filter(Boolean).join(", ") || "not reported"}${geo.countryCode ? ` (${geo.countryCode})` : ""}`,
        geo.hosting === true ? "This address is flagged as hosting/datacentre space rather than a residential ISP." : "",
    ].filter(Boolean).join("\n");
}
async function fetchText(target, timeoutMs = 15000) {
    const res = await fetch(target, {
        headers: { "User-Agent": UA, Accept: "text/plain, application/xml, */*" },
        signal: AbortSignal.timeout(timeoutMs),
    });
    return { status: res.status, body: (await res.text()).slice(0, 200000) };
}
const ISO_DAY = (value) => {
    const date = new Date(String(value ?? ""));
    return Number.isNaN(date.getTime()) ? "not published" : date.toISOString().slice(0, 10);
};
function cleanDomain(input) {
    const raw = String(input ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!raw || !raw.includes("."))
        throw new Error("Provide a domain like example.com.");
    return raw;
}
export async function domainRegistration(args) {
    const domain = cleanDomain(args.domain);
    const res = await fetch(`${RDAP_BOOTSTRAP}${encodeURIComponent(domain)}`, {
        headers: { "User-Agent": UA, Accept: "application/rdap+json, application/json" },
        signal: AbortSignal.timeout(20000),
        redirect: "follow",
    });
    if (res.status === 404)
        throw new Error(`No RDAP record for ${domain} — the domain may be unregistered, or its registry may not publish RDAP.`);
    if (!res.ok)
        throw new Error(`The RDAP service returned ${res.status} for ${domain}.`);
    const data = (await res.json());
    const events = new Map((data.events ?? []).map((event) => [String(event.eventAction ?? ""), String(event.eventDate ?? "")]));
    const registrar = (data.entities ?? []).find((entity) => Array.isArray(entity.roles) && entity.roles.includes("registrar"));
    const registrarName = registrar ? vcardName(registrar) ?? String(registrar.handle ?? "not published") : "not published";
    const nameservers = (data.nameservers ?? []).map((ns) => String(ns.ldhName ?? "").toLowerCase()).filter(Boolean);
    const statuses = (data.status ?? []).map((value) => String(value));
    const expiry = events.get("expiration") ?? "";
    const expiryDate = expiry ? new Date(expiry) : null;
    const daysLeft = expiryDate && !Number.isNaN(expiryDate.getTime())
        ? Math.floor((expiryDate.getTime() - Date.now()) / 86400000)
        : null;
    const createdAt = events.get("registration") ?? "";
    const ageDays = createdAt && !Number.isNaN(new Date(createdAt).getTime())
        ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
        : null;
    const locks = statuses.filter((value) => /lock|hold|prohibited/i.test(value));
    return [
        `RDAP registration record for ${domain}`,
        `Registrar: ${registrarName}`,
        `Created: ${createdAt ? ISO_DAY(createdAt) : "not published"}${ageDays !== null ? ` (${ageDays} day(s) old)` : ""}`,
        `Expires: ${expiry ? ISO_DAY(expiry) : "not published"}${daysLeft !== null ? ` (${daysLeft} day(s) left${daysLeft < 30 ? ", renewal is due" : ""})` : ""}`,
        `Last changed: ${events.get("last changed") ? ISO_DAY(events.get("last changed")) : "not published"}`,
        `DNSSEC: ${data.secureDNS?.delegationSigned === true ? `signed${data.secureDNS.dsData ? " (DS published)" : ""}` : "not signed"}`,
        `Registry locks: ${locks.length ? locks.join(", ") : "none"}`,
        `All registry status codes: ${statuses.length ? statuses.join(", ") : "none published"}`,
        `Nameservers (${nameservers.length}): ${nameservers.length ? nameservers.join(", ") : "none published"}`,
        "",
        daysLeft !== null && daysLeft < 30
            ? "The domain expires soon: renew it before the registrar's grace period ends."
            : "The domain is not close to expiry.",
    ].join("\n");
}
export async function crawlRules(args) {
    const url = normalizeTarget(args.url);
    const target = new URL("/robots.txt", url.origin).toString();
    const { status, body } = await fetchText(target, 15000);
    if (status === 404) {
        return [
            `Crawl rules for ${url.origin}`,
            `No robots.txt is published (HTTP 404), so by convention every crawler may fetch the whole site.`,
            "Sitemaps: none declared in robots.txt (look for /sitemap.xml separately).",
        ].join("\n");
    }
    if (status >= 400)
        throw new Error(`robots.txt returned HTTP ${status} for ${url.origin}.`);
    const lines = body
        .split(/\r?\n/)
        .map((line) => line.replace(/#.*$/, "").trim())
        .filter(Boolean);
    const groups = [];
    let current = null;
    const sitemaps = [];
    for (const line of lines) {
        const colon = line.indexOf(":");
        if (colon < 0)
            continue;
        const key = line.slice(0, colon).trim().toLowerCase();
        const value = line.slice(colon + 1).trim();
        if (key === "sitemap") {
            if (value)
                sitemaps.push(value);
            continue;
        }
        if (key === "user-agent") {
            if (!current || current.rules.length) {
                current = { agents: [], rules: [] };
                groups.push(current);
            }
            current.agents.push(value.toLowerCase());
            continue;
        }
        if (!current)
            continue;
        if (key === "disallow" || key === "allow")
            current.rules.push({ type: key, path: value });
        else if (key === "crawl-delay")
            current.rules.push({ type: key, path: value });
    }
    const generic = groups.filter((group) => group.agents.includes("*"));
    const rules = generic.flatMap((group) => group.rules);
    if (!groups.length) {
        return [`Crawl rules for ${url.origin}`, `robots.txt answered HTTP ${status} but declares no user-agent groups, so no rule applies.`, `Sitemaps declared: ${sitemaps.length ? sitemaps.join(", ") : "none"}`].join("\n");
    }
    const lines2 = [
        `Crawl rules for ${url.origin} (robots.txt, HTTP ${status}, ${groups.length} user-agent group(s))`,
        generic.length
            ? `A generic crawler (*) matches ${generic.length} group(s) with ${rules.length} directive(s).`
            : "No group names a generic crawler (*), so nothing here restricts one; only the named agents are addressed.",
    ];
    if (rules.length) {
        const denied = rules.filter((rule) => rule.type === "disallow" && rule.path);
        const allowed = rules.filter((rule) => rule.type === "allow" && rule.path);
        if (denied.length)
            lines2.push(`Disallowed (${denied.length}): ${denied.slice(0, 15).map((rule) => rule.path).join(", ")}${denied.length > 15 ? " …" : ""}`);
        else
            lines2.push("Disallowed: nothing, so every path is open to a generic crawler.");
        if (allowed.length)
            lines2.push(`Allowed back (${allowed.length}): ${allowed.slice(0, 15).map((rule) => rule.path).join(", ")}${allowed.length > 15 ? " …" : ""}`);
        const delays = rules.filter((rule) => rule.type === "crawl-delay" && rule.path);
        if (delays.length)
            lines2.push(`Crawl delay: ${delays.map((rule) => `${rule.path}s`).join(", ")}`);
    }
    lines2.push(`Sitemaps declared: ${sitemaps.length ? sitemaps.join(", ") : "none"}`);
    return lines2.join("\n");
}
