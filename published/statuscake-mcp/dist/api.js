import { connect } from "node:tls";
import { Socket } from "node:net";
const UA = "mrfentmen-statuscake-mcp/1.0";
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
export async function checkUrl(args) {
    const url = normalizeTarget(args.url);
    const start = Date.now();
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "*/*" },
        signal: AbortSignal.timeout(20000),
    });
    await res.arrayBuffer();
    const ms = Date.now() - start;
    const up = res.status < 400;
    return [
        `${up ? "UP" : "DOWN"} — ${url.toString()}`,
        `HTTP ${res.status} ${res.statusText} in ${ms} ms`,
        `Redirected to: ${res.url || url.toString()}`,
        `Server: ${res.headers.get("server") ?? "not disclosed"}`,
        up ? "Check passed." : "Check failed: the server answered with an error status.",
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
            resolve({ host, port, open, ms: Date.now() - start, service: WELL_KNOWN[port] ?? "unknown service" });
        };
        socket.setTimeout(timeoutMs);
        socket.once("connect", () => done(true));
        socket.once("timeout", () => done(false));
        socket.once("error", () => done(false));
        socket.connect(port, host);
    });
}
export async function portCheck(args) {
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
    const rows = results.map((r) => `${r.open ? "OPEN  " : "CLOSED"} ${String(r.port).padStart(5)} (${r.service}) ${String(r.ms).padStart(6)} ms`);
    const open = results.filter((r) => r.open).length;
    return [
        `TCP port check for ${host}`,
        `${open} of ${ports.length} port(s) accepting connections.`,
        "",
        ...rows,
    ].join("\n");
}
export async function sslChain(args) {
    const host = normalizeTarget(args.host).hostname;
    const port = normalizeTarget(args.host).port ? Number(normalizeTarget(args.host).port) : 443;
    const chain = await new Promise((resolve, reject) => {
        const socket = connect({ host, port, servername: host, rejectUnauthorized: false, timeout: 15000 }, () => {
            const certs = [];
            let current = socket.getPeerCertificate(true);
            const seen = new Set();
            for (let depth = 0; depth < 10 && current; depth += 1) {
                const fingerprint = String(current.fingerprint ?? depth);
                if (seen.has(fingerprint))
                    break;
                seen.add(fingerprint);
                const subject = (current.subject ?? {});
                const issuer = (current.issuer ?? {});
                const validTo = new Date(current.valid_to);
                certs.push({
                    depth,
                    subject: subject.CN ?? subject.O ?? "unknown",
                    issuer: issuer.O ?? issuer.CN ?? "unknown",
                    validTo: validTo.toISOString(),
                    daysRemaining: Math.floor((validTo.getTime() - Date.now()) / 86400000),
                    altNames: String(current.subjectaltname ?? "")
                        .split(",")
                        .map((n) => n.trim().replace(/^DNS:/, ""))
                        .filter(Boolean),
                });
                const next = current.issuerCertificate;
                if (!next || next === current)
                    break;
                current = next;
            }
            const result = {
                certs,
                authorized: socket.authorized,
                error: socket.authorized ? null : String(socket.authorizationError ?? "unknown"),
            };
            socket.destroy();
            resolve(result);
        });
        socket.on("error", (e) => reject(new Error(`TLS connection to ${host}:${port} failed: ${e.message}`)));
        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error(`TLS connection to ${host}:${port} timed out.`));
        });
    });
    if (!chain.certs.length)
        return `No certificate chain returned by ${host}:${port}.`;
    const lines = [
        `Certificate chain for ${host}:${port}`,
        `Chain depth: ${chain.certs.length} certificate(s)`,
        `Trusted: ${chain.authorized ? "yes" : `no (${chain.error})`}`,
        "",
    ];
    for (const cert of chain.certs) {
        lines.push(`${cert.depth === 0 ? "Leaf " : `CA ${cert.depth}`} — ${cert.subject}`);
        lines.push(`     issued by ${cert.issuer}`);
        lines.push(`     valid to ${cert.validTo} (${cert.daysRemaining} day(s) left)`);
        if (cert.depth === 0 && cert.altNames.length)
            lines.push(`     covers ${cert.altNames.slice(0, 10).join(", ")}`);
    }
    const soon = chain.certs.filter((c) => c.daysRemaining < 21);
    if (soon.length)
        lines.push("", `Attention: ${soon.length} certificate(s) in this chain expire within 21 days.`);
    return lines.join("\n");
}
const RESOLVERS = [
    { name: "Cloudflare", url: "https://cloudflare-dns.com/dns-query" },
    { name: "Google", url: "https://dns.google/resolve" },
    { name: "AdGuard", url: "https://dns.adguard-dns.com/resolve" },
];
async function queryResolver(base, name, type) {
    const res = await fetch(`${base}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
        headers: { "User-Agent": UA, Accept: "application/dns-json" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return (await res.json());
}
const values = (d) => (d.Answer ?? []).map((row) => String(row.data ?? "").trim());
export async function dnsPropagation(args) {
    const domain = normalizeTarget(args.domain).hostname;
    const type = (args.type ?? "A").trim().toUpperCase();
    const results = await Promise.allSettled(RESOLVERS.map((r) => queryResolver(r.url, domain, type)));
    const lines = [`DNS propagation for ${domain} (${type})`, ""];
    const perResolver = [];
    results.forEach((result, i) => {
        const name = RESOLVERS[i].name;
        if (result.status === "rejected") {
            lines.push(`${name}: lookup failed (${errorMessage(result.reason)})`);
            perResolver.push([]);
            return;
        }
        const answers = values(result.value);
        perResolver.push(answers);
        lines.push(answers.length
            ? `${name}: ${answers.join(", ")}`
            : `${name}: no ${type} answer (DNS status ${result.value.Status ?? 0})`);
    });
    const answered = perResolver.filter((a) => a.length);
    const first = answered[0] ?? [];
    const agree = answered.length > 0 && answered.every((a) => a.length === first.length && a.every((v) => first.includes(v)));
    lines.push("");
    lines.push(agree
        ? `Propagation: consistent across ${answered.length} resolver(s).`
        : `Propagation: DIFFERENT answers between resolvers — either a change is still spreading or a resolver is serving stale data.`);
    const ttls = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => (r.value.Answer ?? []).map((a) => a.TTL ?? 0));
    if (ttls.length)
        lines.push(`Lowest TTL: ${Math.min(...ttls)} second(s) — changes take about that long to spread.`);
    return lines.join("\n");
}
/** One call that runs every check a monitoring service would run on a host. */
export async function uptimeReport(args) {
    const url = normalizeTarget(args.url);
    const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
    const lines = [`Uptime report for ${url.toString()}`, ""];
    const http = await Promise.allSettled([
        fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) }),
    ]);
    const response = http[0];
    if (response.status === "fulfilled") {
        await response.value.arrayBuffer();
        lines.push(`HTTP: ${response.value.status < 400 ? "UP" : "DOWN"} — ${response.value.status} ${response.value.statusText}`);
    }
    else {
        lines.push(`HTTP: DOWN — ${errorMessage(response.reason)}`);
    }
    const tcp = await probePort(url.hostname, port);
    lines.push(`TCP ${port}: ${tcp.open ? `open in ${tcp.ms} ms` : "not accepting connections"}`);
    const certs = await Promise.allSettled([
        new Promise((resolve, reject) => {
            const socket = connect({ host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false, timeout: 15000 }, () => {
                const c = socket.getPeerCertificate();
                socket.destroy();
                if (!c || !c.valid_to) {
                    reject(new Error("no certificate returned"));
                    return;
                }
                const validTo = new Date(c.valid_to);
                resolve([{
                        depth: 0,
                        subject: (c.subject ?? {}).CN ?? url.hostname,
                        issuer: ((c.issuer ?? {}).O) ?? "unknown",
                        validTo: validTo.toISOString(),
                        daysRemaining: Math.floor((validTo.getTime() - Date.now()) / 86400000),
                        altNames: [],
                    }]);
            });
            socket.on("error", (e) => reject(new Error(e.message)));
            socket.on("timeout", () => {
                socket.destroy();
                reject(new Error("timed out"));
            });
        }),
    ]);
    const leaf = certs[0];
    let certHealthy = false;
    if (leaf.status === "fulfilled") {
        const c = leaf.value[0];
        certHealthy = c.daysRemaining > 7;
        lines.push(`SSL: ${c.subject} from ${c.issuer} — ${c.daysRemaining} day(s) left`);
    }
    else {
        lines.push(`SSL: unavailable (${errorMessage(leaf.reason)})`);
    }
    const dns = await Promise.allSettled([queryResolver(RESOLVERS[0].url, url.hostname, "A")]);
    if (dns[0].status === "fulfilled") {
        const answers = values(dns[0].value);
        lines.push(`DNS: ${answers.length ? answers.join(", ") : "no A record"}`);
    }
    else {
        lines.push(`DNS: unavailable (${errorMessage(dns[0].reason)})`);
    }
    const healthy = response.status === "fulfilled" && response.value.status < 400 && tcp.open && certHealthy;
    lines.push("", `Verdict: ${healthy ? "healthy — serving traffic over HTTPS" : "needs attention, see the lines marked DOWN or unavailable"}`);
    return lines.join("\n");
}
// ---- muxE tools:
// The six existing tools cover up/down with a total response time, TCP ports,
// the certificate chain, A-record propagation across three resolvers, a rollup
// report and a multi-host sweep. Two things they read but never show are here
// instead: the DNS tool asks only for A records, and every existing measurement
// is a single total that does not say whether the time went into name
// resolution, the connection, the handshake or the server.
// The certificate work is deliberately NOT repeated here: this server's
// ssl_chain already reports days until expiry and the names the leaf covers.
// header_audit, the tool that read the headers check_url ignores, moved to the
// licence gateway, behind the gate.
const UA2 = 'mrfentmen-statuscake-mcp/1.0';
const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA', 'CAA'];
const TYPE_WHY = {
    A: 'the IPv4 address a name resolves to',
    AAAA: 'the IPv6 address, so a host with no AAAA here cannot be reached over IPv6',
    MX: 'which mail servers accept mail for the domain, and in what order',
    TXT: 'used for SPF, domain verification and other policy records',
    NS: 'which nameservers are authoritative for the domain',
    CNAME: 'the name this one is an alias for',
    SOA: "the zone's start of authority record, carrying the serial number",
    CAA: 'which certificate authorities are allowed to issue for the domain',
};
export async function dns_records(args) {
    const raw = (args?.domain ?? '').trim().toLowerCase();
    if (!raw)
        return 'Provide a domain name, for example example.com.';
    // A hostname is the input here, not a URL, so the shared target normaliser
    // is deliberately not used: it forces an https scheme and a dot check.
    const domain = raw.replace(/^https?:\/\//, '').split('/')[0].replace(/:\d+$/, '');
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
        return `"${args?.domain}" does not look like a domain name. Try example.com.`;
    }
    const want = (args?.types ?? '').trim().toUpperCase();
    const types = want
        ? want.split(',').map((t) => t.trim()).filter(Boolean)
        : ['A', 'AAAA', 'MX', 'TXT', 'NS'];
    for (const t of types) {
        if (!RECORD_TYPES.includes(t)) {
            return `"${t}" is not a record type this tool reads. Use any of ${RECORD_TYPES.join(', ')}.`;
        }
    }
    // Cloudflare and Google both answer DoH over JSON without a key, and asking
    // two of them is what turns this from a lookup into a cross-check.
    const resolvers = [
        { name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query' },
        { name: 'Google', url: 'https://dns.google/resolve' },
    ];
    // Declared before the loop that reads it, rather than after, so the two
    // agreement checks in one place are obviously the same rule.
    function consistentFor(perResolver) {
        const sets = perResolver.map((p) => [...p.answers].sort().join('|'));
        return sets.every((s) => s === sets[0]);
    }
    const out = [];
    let consistent = 0;
    let checked = 0;
    for (const type of types) {
        const perResolver = [];
        for (const r of resolvers) {
            let status = -1;
            let answers = [];
            try {
                const res = await fetch(`${r.url}?name=${encodeURIComponent(domain)}&type=${type}`, {
                    headers: { Accept: 'application/dns-json', 'User-Agent': UA2 },
                    signal: AbortSignal.timeout(15000),
                });
                if (res.ok) {
                    const d = (await res.json());
                    status = typeof d.Status === 'number' ? d.Status : -1;
                    // Answer 5 is NXDOMAIN, so a status of 0 with no answer is a real
                    // "this type does not exist here" rather than a lookup failure.
                    answers = (d.Answer ?? []).map((a) => String(a.data ?? '')).filter(Boolean);
                }
            }
            catch {
                status = -1;
            }
            perResolver.push({ resolver: r.name, answers, status });
        }
        const sets = perResolver.map((p) => [...p.answers].sort().join('|'));
        checked += 1;
        if (sets.length > 1 && sets.every((s) => s === sets[0]))
            consistent += 1;
        const primary = perResolver[0];
        out.push('');
        out.push(`  ${type} — ${TYPE_WHY[type] ?? 'a DNS record type'}`);
        for (const p of perResolver) {
            const verdict = p.status === 0 && p.answers.length ? 'answered' :
                p.status === 0 ? 'no such record' :
                    p.status === 3 ? 'name does not exist' :
                        p.status === -1 ? 'the resolver could not be reached' :
                            `resolver status ${p.status}`;
            out.push(`    ${p.resolver.padEnd(11)}${p.answers.length ? p.answers.slice(0, 6).join(', ') : verdict}${p.answers.length > 6 ? `, and ${p.answers.length - 6} more` : ''}`);
        }
        if (perResolver.some((p) => p.answers.length)) {
            out.push(`    ${consistentFor(perResolver) ? 'both resolvers agree' : 'the two resolvers disagree, so this record is still propagating'}.`);
        }
    }
    const text = [
        `DNS records for ${domain}, read over DoH from two resolvers:`,
        `  ${types.length} record type${types.length === 1 ? '' : 's'} asked for, ${consistent} of which both resolvers answered identically.`,
        ...out,
        '',
        `  ${consistent === checked ? 'Nothing here is mid-propagation between the two resolvers.' : 'At least one type differs between resolvers, which is what a record in flight looks like.'}`,
        '',
        '  The existing DNS propagation tool asks only for A records, so MX, TXT, NS, CNAME, SOA, CAA and AAAA have never been readable through this server.',
    ];
    return text.join('\n');
}
export async function http_timing(args) {
    const url = normalizeTarget(args?.url ?? '');
    const repeats = Math.max(1, Math.min(5, Math.floor(Number(args?.repeats ?? 3) || 3)));
    const dns = await import('node:dns').then((m) => m.promises ?? m);
    const net = await import('node:net');
    const tls = await import('node:tls');
    const host = url.hostname;
    const port = url.port ? Number(url.port) : url.protocol === 'http:' ? 80 : 443;
    const lines = [
        `Where the time goes on a request to ${url.toString()}, split by phase rather than given as one total:`,
        `  ${repeats} attempt${repeats === 1 ? '' : 's'}, the median of each phase reported since the first request is cold.`,
    ];
    const runs = [];
    for (let i = 0; i < repeats; i += 1) {
        const t0 = Date.now();
        let tDns = 0;
        let tTcp = 0;
        let tTls = 0;
        let address = null;
        try {
            const d0 = Date.now();
            const resolved = await dns.lookup(host);
            tDns = Date.now() - d0;
            const ip = resolved.address;
            address = ip;
            const n0 = Date.now();
            await new Promise((resolve, reject) => {
                const s = net.connect({ host: ip, port }, () => { s.end(); resolve(); });
                s.setTimeout(15000, () => { s.destroy(); reject(new Error('TCP connect timed out')); });
                s.on('error', reject);
            });
            tTcp = Date.now() - n0;
            if (port === 443 || url.protocol === 'https:') {
                const s0 = Date.now();
                await new Promise((resolve, reject) => {
                    const s = tls.connect({ host: ip, port, servername: host, rejectUnauthorized: false }, () => { s.end(); resolve(); });
                    s.setTimeout(15000, () => { s.destroy(); reject(new Error('TLS handshake timed out')); });
                    s.on('error', reject);
                });
                tTls = Date.now() - s0;
            }
        }
        catch (e) {
            lines.push(`  attempt ${i + 1} failed before the request: ${e instanceof Error ? e.message : String(e)}`);
            continue;
        }
        const r0 = Date.now();
        try {
            const res = await fetch(url.toString(), { headers: { 'User-Agent': UA2, Accept: '*/*' }, signal: AbortSignal.timeout(20000) });
            const body = await res.arrayBuffer();
            runs.push({ dns: tDns, tcp: tTcp, tls: tTls, request: Date.now() - r0, total: Date.now() - t0, status: res.status, bytes: body.byteLength });
        }
        catch (e) {
            lines.push(`  attempt ${i + 1} reached the host but the request failed: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    if (!runs.length)
        return lines.join('\n');
    const median = (vals) => {
        const s = [...vals].sort((a, b) => a - b);
        return s[s.length >> 1];
    };
    const med = {
        dns: median(runs.map((r) => r.dns)),
        tcp: median(runs.map((r) => r.tcp)),
        tls: median(runs.map((r) => r.tls)),
        request: median(runs.map((r) => r.request)),
        total: median(runs.map((r) => r.total)),
    };
    lines.push(`  ${runs.length} completed, median total ${med.total}ms.`);
    lines.push('');
    lines.push(`  ${"phase".padEnd(34)}${"median ms".padEnd(11)}share`);
    const phases = [
        ['DNS resolution', med.dns],
        ['TCP connect', med.tcp],
        ['TLS handshake', med.tls],
        ['request sent to last byte', med.request],
    ];
    for (const [name, v] of phases) {
        lines.push(`  ${name.padEnd(34)}${String(v).padEnd(11)}${med.total > 0 ? ((v / med.total) * 100).toFixed(0) + '%' : 'n/a'}`);
    }
    const sum = phases.reduce((a, [, v]) => a + v, 0);
    lines.push(`  ${'measured total'.padEnd(34)}${String(sum).padEnd(11)}${med.total > 0 ? ((sum / med.total) * 100).toFixed(0) + '%' : 'n/a'}`);
    if (sum < med.total) {
        const gap = String(med.total - sum).padEnd(43);
        lines.push(`  ${gap}unaccounted, which is process startup and the gap between the separate probes and the real request`);
    }
    const first = runs[0];
    const rest = runs.slice(1);
    if (rest.length) {
        const later = median(rest.map((r) => r.total));
        lines.push('');
        lines.push(`  first attempt ${first.total}ms against a median of ${later}ms on the rest, a ${first.total > later ? 'cold' : 'slower'} start worth ${Math.abs(first.total - later)}ms.`);
    }
    const slowest = phases.reduce((a, b) => (b[1] > a[1] ? b : a));
    lines.push('');
    lines.push(`  The dominant phase is ${slowest[0]} at ${slowest[1]}ms, which is where tuning would go.`);
    if (med.tls > 200)
        lines.push('  A handshake over 200ms is worth looking at: a session resumption failure or a long certificate chain both do it.');
    if (med.request > 500)
        lines.push('  The server itself is the slow part here, not the network in front of it.');
    if (med.dns > 150)
        lines.push('  Name resolution is unusually slow, which points at the resolver or at a resolver that is not caching, rather than at the site.');
    lines.push(`  response ${runs[0].status}, ${runs[0].bytes.toLocaleString('en-US')} bytes on the first completed attempt.`);
    lines.push('');
    lines.push('  The existing check_url reports one total response time per host, so a slow page caused by a slow handshake is indistinguishable from a slow page caused by a slow server.');
    return lines.join('\n');
}
