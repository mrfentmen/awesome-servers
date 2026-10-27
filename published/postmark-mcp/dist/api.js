export class PostmarkError extends Error {
    constructor(message) {
        super(message);
        this.name = "PostmarkError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.postmarkapp.com";
function headers() {
    const k = process.env.POSTMARK_SERVER_TOKEN;
    if (!k)
        throw new PostmarkError("Set POSTMARK_SERVER_TOKEN (free Postmark tier).");
    return { ...UA, Accept: "application/json", "X-Postmark-Server-Token": k };
}
async function get(path) {
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new PostmarkError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new PostmarkError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function getServer() {
    return get("/server");
}
export function listTemplates(count) {
    const n = Math.min(Number(count ?? 10) || 10, 100);
    return get(`/templates?count=${n}&offset=0`);
}
export function listOutbound(count) {
    const n = Math.min(Number(count ?? 10) || 10, 100);
    return get(`/messages/outbound?count=${n}&offset=0`);
}
// ---- muxH tools:
// The tools above read one Postmark account. These two check the thing that
// decides whether a transactional sender is trusted at all: whether its sending
// addresses are on a blocklist, and whether it publishes MTA-STS, BIMI and
// TLS-RPT. Both read the public DNS and the public policy files, so neither
// needs a Postmark server token.
const MAIL_UA = "postmark-mcp/1.1 (https://github.com/mrfentmen/postmark-mcp)";
const DNSBLS = [
    { zone: "zen.spamhaus.org", name: "Spamhaus ZEN", meaning: "the list most receivers weight most heavily" },
    { zone: "bl.spamcop.net", name: "SpamCop", meaning: "reported sending IPs" },
    { zone: "b.barracudacentral.org", name: "Barracuda", meaning: "Barracuda reputation blocks" },
    { zone: "dnsbl.sorbs.net", name: "SORBS", meaning: "historic spam sources" },
    { zone: "spam.dnsbl.sorbs.net", name: "SORBS spam", meaning: "confirmed spam sources" },
];
async function resolve4(host) {
    const dns = await import("node:dns/promises");
    try {
        return await dns.resolve4(host);
    }
    catch {
        return [];
    }
}
async function resolve6(host) {
    const dns = await import("node:dns/promises");
    try {
        return await dns.resolve6(host);
    }
    catch {
        return [];
    }
}
async function resolveMx(host) {
    const dns = await import("node:dns/promises");
    try {
        return await dns.resolveMx(host);
    }
    catch {
        return [];
    }
}
async function resolveTxt(host) {
    const dns = await import("node:dns/promises");
    try {
        return (await dns.resolveTxt(host)).map((chunks) => chunks.join(""));
    }
    catch {
        return [];
    }
}
async function reversePtr(ip) {
    const dns = await import("node:dns/promises");
    try {
        const rows = await dns.reverse(ip);
        return rows[0] ?? "no PTR";
    }
    catch {
        return "no PTR";
    }
}
async function dnsblLookup(reversedIp, zone) {
    const dns = await import("node:dns/promises");
    try {
        return (await dns.resolveTxt(`${reversedIp}.${zone}`)).map((chunks) => chunks.join(""));
    }
    catch {
        return [];
    }
}
const reverseIpv4 = (ip) => {
    const parts = ip.split(".");
    if (parts.length !== 4)
        return null;
    if (parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255))
        return null;
    return [...parts].reverse().join(".");
};
const hostOnly = (input) => {
    const raw = (input ?? "").trim().toLowerCase();
    if (!raw)
        throw new PostmarkError("Give an email address or a domain.");
    const domain = raw.includes("@") ? raw.slice(raw.lastIndexOf("@") + 1) : raw;
    if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(domain)) {
        throw new PostmarkError(`"${input}" does not look like an email address or a domain.`);
    }
    return domain;
};
/**
 * Whether the servers a domain sends mail from are on any public blocklist.
 * A single listing is enough for a receiving MTA to reject or junk a stream, so
 * this is the first thing to check when transactional mail starts landing in spam.
 */
export async function blacklistCheck(args) {
    const domain = hostOnly(args.email);
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 12), 1), 40);
    const mx = await resolveMx(domain);
    const hosts = mx.length ? mx.map((row) => row.exchange).filter(Boolean) : [domain];
    const addresses = [];
    for (const host of [...new Set(hosts)].slice(0, 6)) {
        for (const ip of await resolve4(host))
            addresses.push({ host, ip, ptr: "", family: "IPv4" });
        for (const ip of await resolve6(host))
            addresses.push({ host, ip, ptr: "", family: "IPv6" });
    }
    if (!addresses.length) {
        return [
            `Blocklist check for ${domain}`,
            `  ${mx.length} MX record(s): ${hosts.join(", ")}`,
            "  No IPv4 or IPv6 address resolved for the mail hosts, so nothing can be looked up on a blocklist.",
            "",
            "A domain with MX records but no address record cannot deliver mail at all.",
        ].join("\n");
    }
    const capped = addresses.slice(0, size);
    for (const entry of capped) {
        if (!entry.ptr && entry.family === "IPv4")
            entry.ptr = await reversePtr(entry.ip);
    }
    const checked = DNSBLS;
    const listed = [];
    for (const entry of capped) {
        const reversed = reverseIpv4(entry.ip);
        if (!reversed)
            continue;
        for (const list of checked) {
            const hits = await dnsblLookup(reversed, list.zone);
            if (hits.length)
                listed.push(`${entry.ip} (${entry.host}) is listed on ${list.name}: ${hits.slice(0, 2).join(" ")}`);
        }
    }
    const lines = [
        `Blocklist check for ${domain}`,
        `  ${mx.length} MX record(s), ${addresses.length} address(es) across ${new Set(capped.map((c) => c.host)).size} host(s)`,
        "",
        ...capped.map((entry) => `  ${entry.family} ${entry.ip.padEnd(40)} ${entry.ptr}`),
        "",
    ];
    if (listed.length) {
        lines.push(`Listed on ${listed.length} list check(s):`);
        lines.push(...listed.map((l) => `  - ${l}`));
        lines.push("");
        lines.push("A listed sending address will be rejected or junked by most receiving servers.");
    }
    else {
        lines.push(`Not listed on any of the ${checked.length} lists checked: ${checked.map((c) => c.name).join(", ")}.`);
        lines.push("");
        lines.push("An absent listing is not a reputation score; it only means no public list currently names these addresses.");
    }
    if (capped.length < addresses.length) {
        lines.push("");
        lines.push(`${addresses.length - capped.length} further address(es) were not checked because of the limit.`);
    }
    lines.push("");
    lines.push("Source: the public DNS blocklists themselves, queried over DNS.");
    return lines.join("\n");
}
/**
 * Whether a sending domain publishes the modern transport-security policies:
 * an MTA-STS policy file that pins which hosts may send for it, a BIMI record
 * for logo display, and a TLS-RPT record for reporting failed handshakes.
 */
export async function mailPolicyReport(args) {
    const domain = hostOnly(args.domain);
    const findings = [];
    // MTA-STS: a DNS TXT record pointing at a host serving /.well-known/mta-sts.txt
    const mtaStsTxt = (await resolveTxt(`_mta-sts.${domain}`)).find((row) => row.toLowerCase().includes("v=stsv1"));
    const lines = [`Transport policy for ${domain}`, ""];
    if (mtaStsTxt) {
        const id = /v=STSv1;\\s*id=([0-9A-Za-z]+)/i.exec(mtaStsTxt)?.[1];
        lines.push(`  MTA-STS DNS record: published${id ? ` (policy id ${id})` : ""}`);
        try {
            const res = await fetch(`https://mta-sts.${domain}/.well-known/mta-sts.txt`, {
                headers: { "User-Agent": MAIL_UA },
                redirect: "follow",
                signal: AbortSignal.timeout(20000),
            });
            const text = await res.text();
            if (!res.ok) {
                findings.push(`the MTA-STS DNS record exists but https://mta-sts.${domain}/.well-known/mta-sts.txt answered HTTP ${res.status}`);
            }
            else {
                const field = (name) => new RegExp(`^${name}\\s*:\\s*(.*)$`, "im").exec(text)?.[1]?.trim();
                const mode = field("mode") ?? "not stated";
                const maxAge = field("max_age") ?? "not stated";
                const mxs = [...text.matchAll(/^mx\s*:\s*(.*)$/gim)].map((m) => m[1].trim());
                lines.push(`  MTA-STS policy file: HTTP ${res.status}, mode ${mode}, max_age ${maxAge}`);
                lines.push(`    authorised MX (${mxs.length}): ${mxs.join(", ") || "none listed"}`);
                if (mode === "none")
                    findings.push("MTA-STS mode is none, so the policy authorises nothing and mail will not be delivered over TLS.");
                if (mode === "testing" && Number(maxAge) < 86400)
                    findings.push("MTA-STS is still in testing mode, so a receiver will not enforce it yet.");
                if (mxs.length > 25)
                    findings.push(`the policy lists ${mxs.length} MX hosts, above the 25 the RFC caps.`);
            }
        }
        catch (e) {
            findings.push(`the MTA-STS policy file could not be fetched: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    else {
        lines.push("  MTA-STS: no _mta-sts TXT record, so senders are free to present any certificate for this domain");
        findings.push("no MTA-STS policy, so nothing forces senders to use a valid certificate");
    }
    const bimi = (await resolveTxt(`default._bimi.${domain}`)).find((row) => row.toLowerCase().includes("v=bmimi"));
    lines.push("");
    if (bimi) {
        const logo = /l=([^;]+)/i.exec(bimi)?.[1];
        const authority = /a=([^;]+)/i.exec(bimi)?.[1];
        lines.push(`  BIMI record: published${logo ? ` (logo ${logo})` : ""}${authority ? `, authority ${authority}` : " with no authority, which is display-only"}`);
        if (!authority)
            findings.push("BIMI has no a= authority certificate, so the logo can be displayed but not verified.");
    }
    else {
        lines.push("  BIMI: no default._bimi TXT record, so no brand logo can be shown in supporting mail clients");
    }
    const tlsRpt = (await resolveTxt(`_smtp._tls.${domain}`)).find((row) => row.toLowerCase().includes("v=tlsrpt"));
    lines.push("");
    if (tlsRpt) {
        const rua = /rua=mailto:([^;]+)/i.exec(tlsRpt)?.[1];
        lines.push(`  TLS-RPT record: published, reports to ${rua ?? "an address not parsed out of the record"}`);
    }
    else {
        lines.push("  TLS-RPT: no _smtp._tls record, so failed TLS handshakes for this domain are never reported back");
        findings.push("no TLS-RPT record, so the domain never learns that senders are failing to negotiate TLS");
    }
    return [
        ...lines,
        "",
        findings.length ? `Findings (${findings.length}):` : "Findings: none, every policy is published and enforcing",
        ...findings.map((f) => `  - ${f}`),
        "",
        "Source: the domain's own DNS records and its published MTA-STS policy file.",
    ].join("\n");
}
