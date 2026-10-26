import crypto from "node:crypto";
export class MailchimpError extends Error {
    constructor(message) {
        super(message);
        this.name = "MailchimpError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function conf() {
    const k = process.env.MAILCHIMP_API_KEY;
    if (!k)
        throw new MailchimpError("Set MAILCHIMP_API_KEY (Mailchimp API key).");
    const dc = process.env.MAILCHIMP_DC ?? (k.includes("-") ? k.split("-").pop() : "us1");
    return { dc, auth: `Basic ${Buffer.from(`anyuser:${k}`).toString("base64")}` };
}
async function get(path) {
    const { dc, auth } = conf();
    let res;
    try {
        res = await fetch(`https://${dc}.api.mailchimp.com/3.0${path}`, {
            headers: { ...UA, Accept: "application/json", Authorization: auth },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new MailchimpError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new MailchimpError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function ping() {
    return get("/ping");
}
export function listLists(count) {
    const n = Math.min(Number(count ?? 10) || 10, 100);
    return get(`/lists?count=${n}`);
}
export function listMembers(listId, count) {
    const n = Math.min(Number(count ?? 10) || 10, 100);
    return get(`/lists/${encodeURIComponent(listId)}/members?count=${n}`);
}
export function listCampaigns(count) {
    const n = Math.min(Number(count ?? 10) || 10, 100);
    return get(`/campaigns?count=${n}`);
}
export function listDetails(listId) {
    return get(`/lists/${encodeURIComponent(listId)}`);
}
export function memberDetails(listId, email) {
    const hash = crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
    return get(`/lists/${encodeURIComponent(listId)}/members/${hash}`);
}
export function campaignDetails(campaignId) {
    return get(`/campaigns/${encodeURIComponent(campaignId)}`);
}
export function automations() {
    return get("/automations?count=10");
}
export function segments(listId) {
    return get(`/lists/${encodeURIComponent(listId)}/segments?count=20`);
}
export function campaignReport(campaignId) {
    return get(`/reports/${encodeURIComponent(campaignId)}`);
}
// ---- muxF tools:
/**
 * The two things a campaign manager checks before sending that do not need the
 * Mailchimp account at all: whether the audience list is clean and whether the
 * email body is deliverable under CAN-SPAM and GDPR.
 */
const CH_DNS = "https://dns.google/resolve";
const CH_MAX_ADDRESSES = 500;
async function chMx(domain) {
    let res;
    try {
        res = await fetch(`${CH_DNS}?name=${encodeURIComponent(domain)}&type=MX`, {
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(15000),
        });
    }
    catch (e) {
        throw new MailchimpError(`DNS lookup failed for ${domain}: ${e.message}`);
    }
    if (!res.ok)
        throw new MailchimpError(`DNS-over-HTTPS returned HTTP ${res.status} for ${domain}.`);
    const body = (await res.text()).trim();
    if (!body)
        throw new MailchimpError(`DNS-over-HTTPS returned an empty body for ${domain}.`);
    const reply = JSON.parse(body);
    if (reply.Status === 3)
        return { state: "domain does not exist", hosts: [] };
    const data = (reply.Answer ?? []).map((a) => String(a.data ?? "")).filter(Boolean);
    if (!data.length)
        return { state: "no MX record", hosts: [] };
    const hosts = data
        .map((d) => d.split(/\s+/)[1]?.replace(/\.$/, "") ?? "")
        .filter(Boolean);
    if (hosts.length === 1 && hosts[0] === "")
        return { state: "null MX, accepts no mail", hosts: [] };
    return { state: "accepts mail", hosts };
}
const stripDisplayName = (raw) => {
    const value = raw.trim();
    const angled = value.match(/<([^<>]+)>/);
    if (angled)
        return angled[1].trim();
    return value.replace(/^<|>$/g, "").trim();
};
const LOCAL_OK = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_OK = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const CH_ROLE = new Set([
    "admin", "abuse", "billing", "compliance", "contact", "hello", "help", "hostmaster", "info",
    "mail", "marketing", "noreply", "no-reply", "postmaster", "sales", "security", "support",
    "team", "unsubscribe", "webmaster",
]);
/** Whether a pasted address list can be mailed: syntax, duplicates, role accounts and per-domain mail routing. */
export async function audienceHygieneAudit(args) {
    const raw = String(args?.addresses ?? "");
    const entries = raw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    if (!entries.length)
        throw new MailchimpError("Paste the address list to audit, one address or a comma-separated row per line.");
    const capped = entries.slice(0, CH_MAX_ADDRESSES);
    const checkDns = args?.checkDns !== false;
    const malformed = [];
    const roles = [];
    const valid = [];
    const seen = new Map();
    const duplicates = [];
    for (const entry of capped) {
        const address = stripDisplayName(entry);
        const at = address.lastIndexOf("@");
        if (at <= 0) {
            malformed.push(entry.slice(0, 60));
            continue;
        }
        const local = address.slice(0, at);
        const domain = address.slice(at + 1).toLowerCase();
        if (!LOCAL_OK.test(local) || !DOMAIN_OK.test(domain) || local.length > 64 || domain.length > 253) {
            malformed.push(entry.slice(0, 60));
            continue;
        }
        const folded = `${local.toLowerCase()}@${domain}`;
        if (seen.has(folded)) {
            const row = duplicates.find((d) => d.address === folded);
            if (row)
                row.count += 1;
            else
                duplicates.push({ address: folded, count: 2 });
        }
        else {
            seen.set(folded, entry);
        }
        if (CH_ROLE.has(local.toLowerCase()))
            roles.push(folded);
        valid.push({ address, domain, local });
    }
    const lines = [
        `Audience hygiene over ${capped.length} pasted address(es)${entries.length > capped.length ? ` of ${entries.length} supplied` : ""}`,
        `  usable addresses: ${seen.size}, malformed: ${malformed.length}, repeated on the list: ${duplicates.length} (${duplicates.reduce((sum, d) => sum + d.count - 1, 0)} extra row(s))`,
        `  role accounts: ${roles.length}${roles.length ? ` (${roles.slice(0, 6).join(", ")}${roles.length > 6 ? ", ..." : ""})` : ""}`,
    ];
    if (duplicates.length) {
        for (const d of duplicates.slice(0, 8))
            lines.push(`    ${d.count} copies of ${d.address}`);
        if (duplicates.length > 8)
            lines.push(`    ...and ${duplicates.length - 8} more repeated address(es).`);
    }
    if (malformed.length) {
        for (const m of malformed.slice(0, 8))
            lines.push(`    malformed: ${m}`);
        if (malformed.length > 8)
            lines.push(`    ...and ${malformed.length - 8} more malformed row(s).`);
    }
    const domains = [...new Set(valid.map((v) => v.domain))];
    if (!checkDns) {
        lines.push("  DNS was not checked, so deliverability of each domain is unknown.");
        return lines.join("\n");
    }
    if (!domains.length)
        throw new MailchimpError("No usable address in the list, so there is no domain to check.");
    lines.push(`  mail routing for ${domains.length} distinct domain(s), looked up over DNS-over-HTTPS:`);
    let deliverableAddresses = 0;
    const unroutableDomains = [];
    for (const domain of domains.slice(0, 20)) {
        const { state, hosts } = await chMx(domain);
        const count = valid.filter((v) => v.domain === domain).length;
        if (state === "accepts mail")
            deliverableAddresses += count;
        else
            unroutableDomains.push(domain);
        lines.push(`    ${state === "accepts mail" ? "accepts mail" : state} · ${count} address(es) · ${domain}${hosts.length ? ` -> ${hosts.slice(0, 2).join(", ")}${hosts.length > 2 ? ` (+${hosts.length - 2} more)` : ""}` : ""}`);
    }
    if (domains.length > 20)
        lines.push(`    ...and ${domains.length - 20} more domain(s) not checked.`);
    const pct = valid.length ? Math.round((deliverableAddresses / valid.length) * 1000) / 10 : 0;
    lines.push(`  ${deliverableAddresses} of ${seen.size} address(es) (${pct}%) sit on a domain that publishes MX records.`);
    if (unroutableDomains.length) {
        lines.push(`  ${unroutableDomains.length} domain(s) cannot receive mail: ${unroutableDomains.slice(0, 8).join(", ")}${unroutableDomains.length > 8 ? ", ..." : ""}`);
    }
    lines.push("  Syntax and MX say nothing about whether an address exists or whether it will engage.");
    return lines.join("\n");
}
/** Whether a campaign body is sendable: unsubscribe, postal address, tracking and link hygiene. */
export async function emailComplianceScan(args) {
    const html = String(args?.html ?? "");
    if (!html.trim())
        throw new MailchimpError("Paste the campaign HTML to scan.");
    const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 40);
    const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({
        href: m[1].trim(),
        text: m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    }));
    const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
    const trackers = images.filter((tag) => {
        const w = /width\s*=\s*["']?(\d+)/i.exec(tag)?.[1];
        const h = /height\s*=\s*["']?(\d+)/i.exec(tag)?.[1];
        return (w !== undefined && Number(w) <= 2) || (h !== undefined && Number(h) <= 2);
    });
    const missingAlt = images.filter((tag) => !/\balt\s*=/i.test(tag));
    const hosts = new Map();
    for (const link of links) {
        try {
            const host = new URL(link.href).host;
            hosts.set(host, (hosts.get(host) ?? 0) + 1);
        }
        catch {
            /* relative or malformed link, counted below */
        }
    }
    const unsubscribe = links.filter((l) => /unsubscribe|opt[ -]?out|remove/i.test(`${l.href} ${l.text}`));
    const hasListUnsubscribe = /list-unsubscribe/i.test(html);
    const hasPhysicalAddress = /\b\d{1,6}\s+[\w.'-]+(\s+[\w.'-]+){0,4}\s+(street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|way|suite|ste|po box|p\.o\. box)\b/i.test(html.replace(/<[^>]+>/g, " "));
    const preheader = /display:none[^>]*>[\s\S]{0,200}?<([\s\S]{0,200}?)>/i.test(html);
    const hasPlainPart = /Content-Type\s*:\s*text\/plain/i.test(html);
    const rawText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const findings = [];
    if (!unsubscribe.length)
        findings.push("no unsubscribe link found in the body");
    if (!hasListUnsubscribe)
        findings.push("no List-Unsubscribe header or preheader found in this HTML");
    if (!hasPhysicalAddress)
        findings.push("no street address found, which CAN-SPAM requires for commercial mail");
    if (images.length && missingAlt.length === images.length)
        findings.push("no image has alt text");
    if (!preheader)
        findings.push("no hidden preheader text found");
    if (!hasPlainPart)
        findings.push("this HTML carries no text/plain part, so some clients will show nothing");
    const lines = [
        `Campaign body scan: ${rawText.length} visible character(s), ${links.length} link(s), ${images.length} image(s)`,
        `  unsubscribe link(s): ${unsubscribe.length}${unsubscribe.length ? ` (${unsubscribe.slice(0, 3).map((l) => l.href.slice(0, 60)).join(", ")}${unsubscribe.length > 3 ? ", ..." : ""})` : ""}`,
        `  List-Unsubscribe present: ${hasListUnsubscribe ? "yes" : "no"}`,
        `  postal address present: ${hasPhysicalAddress ? "yes" : "no"}`,
        `  hidden preheader present: ${preheader ? "yes" : "no"}`,
        `  text/plain part present: ${hasPlainPart ? "yes" : "no"}`,
        `  tracking pixels (images 2px or smaller): ${trackers.length}`,
        `  images with no alt attribute: ${missingAlt.length} of ${images.length}`,
        `  link hosts: ${[...hosts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([host, count]) => `${host} (${count})`).join(", ") || "none resolved, all links relative or malformed"}`,
    ];
    const brokenish = links.filter((l) => {
        try {
            const u = new URL(l.href);
            return u.protocol !== "https:" && u.protocol === "http:";
        }
        catch {
            return true;
        }
    });
    if (brokenish.length) {
        lines.push(`  ${brokenish.length} link(s) are not https or are malformed: ${brokenish.slice(0, 5).map((l) => l.href.slice(0, 50)).join(", ")}`);
    }
    const emptyAnchors = links.filter((l) => !l.text).length;
    if (emptyAnchors)
        lines.push(`  ${emptyAnchors} link(s) have no anchor text at all`);
    lines.push("");
    lines.push(findings.length ? `  before sending: ${findings.join("; ")}.` : "  nothing in the usual pre-flight list is missing.");
    return lines.join("\n");
}
