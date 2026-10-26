export class HackTargetError extends Error {
    constructor(message) {
        super(message);
        this.name = "HackTargetError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.hackertarget.com";
async function req(path, params, text = false) {
    void params;
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: { ...UA, Accept: text ? "text/plain" : "application/json" } });
    }
    catch (e) {
        throw new HackTargetError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new HackTargetError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function dnsLookup(query) {
    return req(`/dnslookup/?q=${encodeURIComponent(query)}`, {}, true);
}
export function reverseDns(ip) {
    return req(`/reversedns/?q=${encodeURIComponent(ip)}`, {}, true);
}
export function whoisLookup(query) {
    return req(`/whois/?q=${encodeURIComponent(query)}`, {}, true);
}
export function geoIpLookup(query) {
    return req(`/geoip/?q=${encodeURIComponent(query)}`, {}, true);
}
export function httpHeaders(url) {
    return req(`/httpheaders/?q=${encodeURIComponent(url)}`, {}, true);
}
export function reverseIp(ip) {
    return req(`/reverseiplookup/?q=${encodeURIComponent(ip)}`, {}, true);
}
// ---- muxG tools:
// req() takes a full path, so the query string is built here.
//
// hostsearch and aslookup answer in plain text, and both report their failures
// as an English sentence in the body with HTTP 200. Left unchecked that would be
// presented as data: a rate-limited "API count exceeded" line parses as zero
// hosts, which reads as "the domain has no subdomains". They are separated here.
const HT_FAILURE = /^(error|api count exceeded|no records found|no data|invalid|too many|please|you have)/i;
function assertText(body, what) {
    const trimmed = body.trim();
    if (!trimmed)
        throw new HackTargetError(`HackerTarget returned an empty body for the ${what} query.`);
    if (HT_FAILURE.test(trimmed))
        throw new HackTargetError(`HackerTarget refused the ${what} query: ${trimmed.split("\n")[0].slice(0, 200)}`);
    return trimmed;
}
function firstLabel(host, domain) {
    const h = host.toLowerCase().replace(/\.$/, "");
    const suffix = `.${domain.toLowerCase()}`;
    const head = h.endsWith(suffix) ? h.slice(0, -suffix.length) : h;
    if (!head || head === h)
        return null;
    const parts = head.split(".");
    return parts[parts.length - 1] || null;
}
/**
 * hostsearch returns one `hostname,ip` pair per line, so the useful summary is
 * about the shape of the estate: how many names resolve, onto how few addresses,
 * and which first labels repeat. A repeated label is what a wildcard or a fleet
 * of identically named hosts looks like.
 */
export async function hostSearch(args = {}) {
    const domain = String(args.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain))
        throw new HackTargetError(`"${args.domain ?? ""}" is not a bare domain like stripe.com.`);
    const limit = Math.min(Math.max(Number(args.limit ?? 25) || 25, 1), 200);
    const body = assertText(await req(`/hostsearch/?q=${encodeURIComponent(domain)}`, {}, true), "host search");
    const rows = [];
    for (const line of body.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed)
            continue;
        const comma = trimmed.lastIndexOf(",");
        if (comma < 1)
            continue;
        const host = trimmed.slice(0, comma).trim().toLowerCase();
        const ip = trimmed.slice(comma + 1).trim();
        if (!host)
            continue;
        rows.push({ host, ip });
    }
    if (!rows.length)
        throw new HackTargetError(`HackerTarget listed no hostnames for ${domain}. That is not proof none exist: the service reports only names its own enumeration finds.`);
    const ips = new Map();
    const labels = new Map();
    for (const r of rows) {
        ips.set(r.ip, (ips.get(r.ip) ?? 0) + 1);
        const label = firstLabel(r.host, domain);
        if (label)
            labels.set(label, (labels.get(label) ?? 0) + 1);
    }
    const repeated = [...labels.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
    const shared = [...ips.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]);
    const lines = [
        `${rows.length} hostname(s) resolve under ${domain}, on ${ips.size} distinct address(es)`,
        "",
        ...rows.slice(0, limit).map((r) => `${r.host.padEnd(46)} ${r.ip}`),
    ];
    if (rows.length > limit)
        lines.push(`  ...and ${rows.length - limit} more (raise limit, max 200).`);
    if (repeated.length) {
        lines.push("", "First labels that repeat (fleet or wildcard shape):");
        for (const [label, n] of repeated.slice(0, 10))
            lines.push(`  ${label.padEnd(24)} ${n} host(s)`);
    }
    if (shared.length) {
        lines.push("", "Addresses carrying more than one name:");
        for (const [ip, n] of shared.slice(0, 10))
            lines.push(`  ${ip.padEnd(20)} ${n} host(s)`);
    }
    lines.push("", "This is passive enumeration of public name data, not a scan: a name missing here may still exist, and a name present is not by itself a target worth probing.");
    return lines.join("\n");
}
/**
 * aslookup returns an ASN header followed by the prefixes that AS announces. An
 * address query answers with the one covering prefix; an AS query answers with
 * the whole announcement list, which is why the same tool reports both counts.
 */
export async function asLookup(args = {}) {
    const query = String(args.query ?? "").trim();
    if (!query)
        throw new HackTargetError("Provide an IP address or an AS number such as AS13335.");
    const isAs = /^as\d+$/i.test(query);
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(query) || /^[0-9a-f:]+$/i.test(query) && query.includes(":");
    if (!isAs && !isIp)
        throw new HackTargetError(`"${query}" is neither an IP address nor an AS number (AS13335).`);
    const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 100);
    const body = assertText(await req(`/aslookup/?q=${encodeURIComponent(query.toUpperCase())}`, {}, true), "AS lookup");
    const lines = body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    // HackerTarget answers in two shapes: "ip","asn","prefix","holder" for an
    // address query, "asn","holder" followed by one bare prefix per line for an
    // AS query. Quoted fields are the only reliable marker.
    const quoted = (line) => [...line.matchAll(/"([^"]*)"/g)].map((m) => m[1].trim());
    let asn = null;
    let holder = null;
    const prefixes = [];
    const matchedIps = [];
    for (const line of lines) {
        const fields = quoted(line);
        if (fields.length >= 4) {
            matchedIps.push(fields[0]);
            asn ??= fields[1];
            holder ??= fields[3];
            if (fields[2])
                prefixes.push(fields[2]);
            continue;
        }
        if (fields.length === 2 && /^\d+$/.test(fields[0])) {
            asn ??= fields[0];
            holder ??= fields[1];
            continue;
        }
        if (!fields.length && /^[0-9a-f:.]+\/\d+$/i.test(line))
            prefixes.push(line);
    }
    if (!asn && !prefixes.length) {
        throw new HackTargetError(`HackerTarget answered the AS lookup for ${query} with neither an AS number nor a prefix: ${lines[0]?.slice(0, 160) ?? "empty"}`);
    }
    const out = [];
    if (asn) {
        out.push(`Announcing AS: AS${asn}`);
        if (holder)
            out.push(`Registered holder: ${holder}`);
    }
    if (isIp) {
        out.push(`Covering prefix for ${query}: ${prefixes[0] ?? "not reported"}`);
        if (prefixes.length > 1)
            out.push(`${prefixes.length} prefixes came back for one address, which usually means the query was the AS itself rather than a single address.`);
    }
    else {
        out.push(`${prefixes.length} announced prefix(es) returned${prefixes.length >= limit ? ` (showing the first ${limit})` : ""}`);
    }
    if (prefixes.length) {
        out.push("");
        for (const p of prefixes.slice(0, limit))
            out.push(`  ${p}`);
        if (prefixes.length > limit)
            out.push(`  ...and ${prefixes.length - limit} more.`);
    }
    out.push("", "BGP ownership is registration data, not a statement about where traffic goes: anycast and transit mean the address you query may be served from somewhere else entirely.");
    return out.join("\n");
}
