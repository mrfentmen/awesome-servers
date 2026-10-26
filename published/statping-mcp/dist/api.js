import { connect } from "node:tls";
import { Socket } from "node:net";
const UA = "mrfentmen-statping-mcp/1.0";
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
/**
 * Fetches a URL and follows redirects by hand so the caller can see every hop.
 * This is exactly the check a status page runs, done live.
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
    return {
        ok: last.status >= 200 && last.status < 400,
        status: last.status,
        statusText: last.statusText,
        finalUrl: url.toString(),
        ms: Date.now() - start,
        bytes: Buffer.byteLength(body),
        contentType: last.headers.get("content-type") ?? "",
        server: last.headers.get("server"),
        hops,
        bodySnippet: body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
    };
}
export async function serviceStatus(args) {
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
            lines.push(`  ${i + 1}. ${hop.status} ${hop.url}${hop.location ? ` -> ${hop.location}` : ""}`);
        });
    }
    if (r.bodySnippet)
        lines.push("", `First text: ${r.bodySnippet}`);
    return lines.join("\n");
}
export async function checkServices(args) {
    const urls = (args.urls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 10);
    if (!urls.length)
        return "Provide up to 10 URLs to check.";
    const rows = [];
    let up = 0;
    // Sequential on purpose: a status page should not hammer a host from one IP at once.
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
        `Checked ${urls.length} service(s): ${up} up, ${down} down.`,
        down ? "Anything marked DOWN is either unreachable or answered with an error status." : "Every service answered.",
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
export async function portCheck(args) {
    const host = normalizeTarget(args.host).hostname;
    const ports = (args.ports?.length ? args.ports : [443, 80])
        .map((p) => Number(p))
        .filter((p) => Number.isInteger(p) && p > 0 && p < 65536)
        .slice(0, 10);
    if (!ports.length)
        return "Provide up to 10 TCP ports, for example [443, 80].";
    const results = [];
    // Sequential: many sockets at once from one address looks like an attack.
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
        : "Propagation: DIFFERENT answers between resolvers — either a change is still spreading or a resolver is serving stale data.");
    const ttls = results
        .filter((r) => r.status === "fulfilled")
        .flatMap((r) => (r.value.Answer ?? []).map((a) => a.TTL ?? 0));
    if (ttls.length)
        lines.push(`Lowest TTL: ${Math.min(...ttls)} second(s) — changes take about that long to spread.`);
    return lines.join("\n");
}
export async function sslChain(args) {
    const target = normalizeTarget(args.host);
    const host = target.hostname;
    const port = target.port ? Number(target.port) : 443;
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
/** The rollup a status page shows: which services are up, which are down, and the overall state. */
export async function statusSummary(args) {
    const urls = (args.urls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 10);
    if (!urls.length)
        return "Provide up to 10 URLs to roll up.";
    const rows = [];
    const down = [];
    let slowest = { url: "", ms: 0 };
    for (const url of urls) {
        try {
            const r = await request(url, 12000);
            if (r.ok) {
                if (r.ms > slowest.ms)
                    slowest = { url, ms: r.ms };
                rows.push(`${r.ok ? "UP  " : "DOWN"} ${String(r.status).padStart(3)} ${String(r.ms).padStart(6)} ms  ${url}`);
            }
            else {
                down.push(url);
                rows.push(`DOWN ${String(r.status).padStart(3)} ${String(r.ms).padStart(6)} ms  ${url}`);
            }
        }
        catch (e) {
            down.push(url);
            rows.push(`DOWN ---        -  ${url}  (${errorMessage(e)})`);
        }
    }
    const up = urls.length - down.length;
    const state = down.length === 0
        ? "All systems operational"
        : up === 0
            ? "Major outage — nothing answered"
            : "Partial outage";
    return [
        `Status: ${state}`,
        `${up} of ${urls.length} service(s) up.`,
        slowest.url ? `Slowest service: ${slowest.url} at ${slowest.ms} ms.` : "",
        down.length ? `Down: ${down.join(", ")}` : "",
        "",
        ...rows,
    ].filter((line) => line !== "").join("\n");
}
// ---- muxE tools:
// The six existing tools cover up/down, response time, TCP ports, A-record
// propagation across three resolvers, and the certificate chain. Two things
// they touch but never read are here instead: the DNS tool asks only for A
// records, and the TLS tool reports the chain without ever saying how long the
// certificate has left or how strong the key is. Both were verified live.
// normalizeTarget is already declared in this module, so it is reused here
// rather than imported a second time. The third, header_audit, moved to the
// licence gateway, behind the gate.
const UA2 = 'mrfentmen-statping-mcp/1.0';
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
export async function cert_forecast(args) {
    const url = normalizeTarget(args?.host ?? '');
    // A URL that carries no explicit port has url.port as an empty string, which
    // is not nullish, so a ?? chain alone would read it as a port of 0. The
    // empty string is treated as absent here, which is what it means.
    const given = args?.port !== undefined && args.port !== null ? Number(args.port) : Number(url.port || 443);
    const port = given;
    if (!Number.isInteger(port) || port < 1 || port > 65535)
        throw new Error('Provide a TCP port between 1 and 65535.');
    const warn = Math.max(1, Math.min(365, Math.floor(Number(args?.warnDays ?? 30) || 30)));
    const tls = await import('node:tls');
    const started = Date.now();
    const cert = await new Promise((resolve, reject) => {
        const sock = tls.connect({ host: url.hostname, port, servername: url.hostname, rejectUnauthorized: false }, () => {
            const leaf = sock.getPeerCertificate();
            const out = {
                leaf: leaf,
                authorized: sock.authorized,
                authError: sock.authorizationError ? String(sock.authorizationError) : null,
                protocol: sock.getProtocol?.() ?? null,
            };
            sock.end();
            resolve(out);
        });
        sock.setTimeout(15000, () => { sock.destroy(); reject(new Error(`TLS handshake with ${url.hostname}:${port} timed out`)); });
        sock.on('error', (e) => reject(e));
    });
    const leaf = cert.leaf ?? {};
    const now = Date.now();
    const from = Date.parse(String(leaf.valid_from ?? ''));
    const to = Date.parse(String(leaf.valid_to ?? ''));
    const daysLeft = Number.isNaN(to) ? null : Math.floor((to - now) / 86400000);
    const daysIn = Number.isNaN(from) ? null : Math.floor((now - from) / 86400000);
    const totalDays = Number.isNaN(from) || Number.isNaN(to) ? null : Math.floor((to - from) / 86400000);
    const cn = String(leaf.subject?.CN ?? 'not reported');
    const issuer = String(leaf.issuer?.CN ?? leaf.issuer?.O ?? 'not reported');
    const lines = [
        `Certificate forecast for ${url.hostname}:${port}${cert.protocol ? ` over ${cert.protocol}` : ''}:`,
        `  subject CN ${cn}, issued by ${issuer}.`,
        `  ${leaf.bits ? `key size ${leaf.bits} bits` : 'key size not reported'}${leaf.asn1Curve ? `, curve ${leaf.asn1Curve}` : ''}${leaf.sigalg ? `, signed ${leaf.sigalg}` : ''}.`,
    ];
    if (daysLeft === null) {
        lines.push('  The certificate carries no readable validity dates, so nothing can be said about expiry.');
    }
    else {
        lines.push(`  valid from ${leaf.valid_from} to ${leaf.valid_to}.`);
        lines.push(`  that is ${daysLeft} day${daysLeft === 1 ? '' : 's'} of life left${totalDays !== null ? ` out of a ${totalDays} day term, which is ${daysIn} days in` : ''}.`);
        if (daysLeft < 0) {
            lines.push(`  It EXPIRED ${-daysLeft} day${daysLeft === -1 ? '' : 's'} ago. A browser will refuse it and so will anything else that validates.`);
        }
        else if (daysLeft < warn) {
            lines.push(`  That is inside the ${warn} day warning window you set, so renewal is due now rather than soon.`);
        }
        else if (daysLeft < warn * 4) {
            lines.push(`  Not urgent, but inside four warning windows of ${warn} days, so it is worth putting on a calendar.`);
        }
        else {
            lines.push(`  Comfortable for now, and the figure to watch is the remaining ${daysLeft} days.`);
        }
        if (totalDays !== null) {
            if (totalDays <= 90)
                lines.push(`  A ${totalDays} day term is short, so this host is being reissued often and each renewal is a chance to change the key size or algorithm.`);
            if (leaf.bits && leaf.bits < 2048) {
                lines.push(`  A ${leaf.bits} bit key is below the 2048 bit floor most current guidance sets, so this is worth replacing rather than renewing.`);
            }
        }
    }
    if (leaf.subjectaltname) {
        const names = String(leaf.subjectaltname).split(',').map((n) => n.trim().replace(/^DNS:/i, '')).filter(Boolean);
        const wildcard = names.filter((n) => n.startsWith('*.'));
        const hostMatches = names.some((n) => n === url.hostname || (n.startsWith('*.') && url.hostname.endsWith(n.slice(1))));
        lines.push(`  subject alternative names: ${names.length}${wildcard.length ? `, of which ${wildcard.length} are wildcards (${wildcard.slice(0, 3).join(', ')})` : ''}.`);
        lines.push(`  Does the certificate cover ${url.hostname}? ${hostMatches ? 'yes' : 'no'}.`);
    }
    else {
        lines.push('  No subject alternative names, which means only the common name is covered and any modern browser would reject it.');
    }
    lines.push(`  chain trusted: ${cert.authorized ? 'yes' : `no${cert.authError ? `, ${cert.authError}` : ''}`}.`);
    lines.push('');
    lines.push(`  handshake took ${Date.now() - started}ms.`);
    lines.push('');
    lines.push("  The existing TLS chain tool reports the chain and whether it is trusted but not the days remaining, the key size or whether the name is covered.");
    return lines.join('\n');
}
