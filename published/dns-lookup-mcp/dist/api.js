const BASE = "https://dns.google/resolve";
const UA = "mrfentmen-dns-lookup-mcp/1.0 (https://github.com/mrfentmen)";
export class DnsError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new DnsError("DNS resolver rate limit hit, wait and retry");
    if (!res.ok)
        throw new DnsError(`DNS resolver error ${res.status}`);
    return (await res.json());
}
function fmtAnswer(d, type) {
    const ans = d?.Answer ?? [];
    if (d?.Status === 3)
        return "Domain does not exist (NXDOMAIN)";
    if (!ans.length)
        return `No ${type} records found`;
    return ans
        .map((a) => {
        const v = a?.data ?? "";
        const ttl = a?.TTL ?? "?";
        return `  ${v}  (ttl ${ttl})`;
    })
        .join("\n");
}
export async function lookup(args) {
    const domain = (args.domain ?? "").trim().toLowerCase();
    if (!domain)
        throw new DnsError("Provide a domain name");
    const type = (args.type ?? "A").trim().toUpperCase();
    const d = await get(`${BASE}?name=${encodeURIComponent(domain)}&type=${type}`);
    return `${domain} ${type} records:\n${fmtAnswer(d, type)}`;
}
export async function lookupAll(args) {
    const domain = (args.domain ?? "").trim().toLowerCase();
    if (!domain)
        throw new DnsError("Provide a domain name");
    const types = ["A", "AAAA", "MX", "NS", "TXT", "CNAME"];
    const out = [];
    for (const t of types) {
        try {
            const d = await get(`${BASE}?name=${encodeURIComponent(domain)}&type=${t}`);
            out.push(`${t}:\n${fmtAnswer(d, t)}`);
        }
        catch (e) {
            out.push(`${t}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    return out.join("\n\n");
}
// ---- muxA tools:
// The existing tools answer one record type and the six common types together.
// These add a reverse lookup for an address, the DNSSEC posture of a name, and
// the CNAME chain a name actually resolves through.
const STATUS_TEXT = {
    0: "NOERROR",
    1: "FORMERR",
    2: "SERVFAIL",
    3: "NXDOMAIN",
    5: "REFUSED",
};
function statusText(status) {
    if (typeof status !== "number")
        return "not reported";
    return STATUS_TEXT[status] ?? `status ${status}`;
}
export async function cnameChain(args) {
    const domain = (args.domain ?? "").trim().toLowerCase();
    if (!domain)
        throw new DnsError("Provide a domain name");
    const d = await get(`${BASE}?name=${encodeURIComponent(domain)}&type=A`);
    const status = statusText(d?.Status);
    const answers = (d?.Answer ?? []);
    const cnames = answers.filter((a) => a?.type === 5);
    const addresses = answers.filter((a) => a?.type === 1);
    const lines = [`${domain} A lookup — ${status}`];
    if (cnames.length) {
        lines.push(`  follows ${cnames.length} CNAME hop(s):`);
        for (const c of cnames)
            lines.push(`    ${c.name ?? "?"} -> ${c.data ?? "?"}  (ttl ${c.TTL ?? "?"})`);
    }
    else {
        lines.push("  no CNAME: the name is answered directly");
    }
    if (addresses.length) {
        lines.push("  final addresses:");
        for (const a of addresses)
            lines.push(`    ${a.data ?? "?"}  (ttl ${a.TTL ?? "?"})`);
    }
    else {
        lines.push("  no A record in the answer");
    }
    return lines.join("\n");
}
