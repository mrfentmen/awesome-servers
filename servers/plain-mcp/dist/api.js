export class PlainError extends Error {
    constructor(message) {
        super(message);
        this.name = "PlainError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://core-api.uk.plain.com/graphql/v1";
function key() {
    const k = process.env.PLAIN_API_KEY;
    if (!k)
        throw new PlainError("Set PLAIN_API_KEY (free Plain tier).");
    return k;
}
async function gql(query, variables = {}) {
    let res;
    try {
        res = await fetch(BASE, {
            signal: AbortSignal.timeout(30000),
            method: "POST",
            headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${key()}` },
            body: JSON.stringify({ query, variables }),
        });
    }
    catch (e) {
        throw new PlainError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new PlainError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 12000);
}
export function listCustomers(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return gql(`query($n: Int!) { customers(first: $n) { edges { node { id fullName email { email } } } } }`, { n });
}
export function listThreads(limit) {
    const n = Math.min(Number(limit ?? 10) || 10, 50);
    return gql(`query($n: Int!) { threads(first: $n) { edges { node { id title status priority } } } }`, { n });
}
export function getThread(threadId) {
    return gql(`query($id: ID!) { thread(id: $id) { id title status priority } }`, { id: threadId });
}
// ---- muxH tools:
// Plain is a support desk, so the questions that matter are "can we reach this
// customer's inbox" and "did we answer fast enough". Neither needs a Plain
// account, so these two answer them from the DNS and from the caller's clock.
const MAIL_UA = "plain-mcp/1.1 (https://github.com/mrfentmen/plain-mcp)";
async function dnsMx(host) {
    const dns = await import("node:dns/promises");
    try {
        return await dns.resolveMx(host);
    }
    catch {
        return null;
    }
}
async function dnsTxt(host) {
    const dns = await import("node:dns/promises");
    try {
        const rows = await dns.resolveTxt(host);
        return rows.map((chunks) => chunks.join(""));
    }
    catch {
        return null;
    }
}
async function dnsSoa(host) {
    const dns = await import("node:dns/promises");
    try {
        return await dns.resolveSoa(host);
    }
    catch {
        return null;
    }
}
const hostOf = (input) => {
    const raw = (input ?? "").trim().toLowerCase();
    if (!raw)
        throw new PlainError("Give an email address or a domain, e.g. someone@example.com.");
    const domain = raw.includes("@") ? raw.slice(raw.lastIndexOf("@") + 1) : raw;
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
        throw new PlainError(`"${input}" does not look like an email address or a domain.`);
    }
    return domain;
};
/**
 * Whether mail to an address can actually be delivered: the domain's MX
 * records, its SPF and DMARC policy, and whether it publishes a null MX that
 * refuses all mail. Every support reply depends on this.
 */
export async function emailDeliverability(args) {
    const domain = hostOf(args.email);
    const [mx, spf, dmarc, soa] = await Promise.all([
        dnsMx(domain),
        dnsTxt(domain),
        dnsTxt(`_dmarc.${domain}`),
        dnsSoa(domain),
    ]);
    const findings = [];
    const nullMx = Array.isArray(mx) && mx.length === 1 && (mx[0].exchange === "" || mx[0].exchange === ".");
    const ordered = Array.isArray(mx) ? [...mx].sort((a, b) => a.priority - b.priority) : [];
    const lines = [];
    if (nullMx) {
        lines.push("  MX: none (RFC 7505 null MX) — the domain explicitly publishes that it receives no mail");
    }
    else if (!ordered.length) {
        lines.push("  MX: no record published — RFC 5321 falls back to the A record, which usually means no mail");
    }
    else {
        lines.push(`  MX: ${ordered.length} exchanger(s), in delivery order`);
        for (const row of ordered.slice(0, 6))
            lines.push(`      ${String(row.priority).padStart(4)}  ${row.exchange}`);
        if (ordered.length > 6)
            lines.push(`      … ${ordered.length - 6} more`);
    }
    const spfRecord = (spf ?? []).find((row) => row.toLowerCase().startsWith("v=spf1"));
    lines.push("");
    if (spfRecord) {
        // Everything after the v=spf1 tag: each colon-separated term, and a bare
        // terminal term such as -all when the record has no colon at all.
        const tail = spfRecord.slice(spfRecord.toLowerCase().indexOf("v=spf1") + 6).trim();
        const mechanisms = tail ? (tail.includes(":") ? tail.split(":").filter(Boolean) : [tail]) : [];
        lines.push(`  SPF: ${spfRecord.slice(0, 200)}`);
        lines.push(`      ${mechanisms.length} mechanism(s) after v=spf1: ${mechanisms.slice(0, 8).join(" ")}${mechanisms.length > 8 ? ` (+${mechanisms.length - 8} more)` : ""}`);
        const qualifiers = (spfRecord.match(/[?~+-]/g) ?? []).length;
        if (qualifiers > 10)
            findings.push(`SPF has ${qualifiers} mechanism qualifiers; a lookup-heavy policy is slow to evaluate and can hit the 10-lookup limit.`);
        if (!/^v=spf1\s*(\+all|~all|\?all|-all)/i.test(spfRecord))
            findings.push("SPF has no terminal all mechanism, so the policy is incomplete.");
    }
    else {
        lines.push("  SPF: no v=spf1 record published");
        findings.push("No SPF record, so nothing authorises this domain to send on its behalf and receivers cannot check it.");
    }
    lines.push("");
    const dmarcRecord = (dmarc ?? []).find((row) => row.toLowerCase().includes("v=dmarc1"));
    if (dmarcRecord) {
        const policy = /p=(\w+)/i.exec(dmarcRecord)?.[1] ?? "not stated";
        lines.push(`  DMARC: ${dmarcRecord.slice(0, 200)}`);
        lines.push(`      published policy p=${policy}`);
        if (policy === "none")
            findings.push("DMARC is at p=none, so the domain monitors but enforces nothing.");
        if (policy === "quarantine")
            findings.push("DMARC is at p=quarantine; p=reject is the enforcing setting.");
        if (!/rua=/i.test(dmarcRecord))
            lines.push("      no rua= address, so no aggregate reports come back");
    }
    else {
        lines.push("  DMARC: no _dmarc record published");
        findings.push("No DMARC record, so the domain cannot tell receivers what to do with a forged message claiming to be from it.");
    }
    if (soa) {
        lines.push("");
        lines.push(`  SOA: ${soa.nsname}, serial ${soa.serial}, minimum ttl ${soa.minttl}s`);
    }
    return [
        `Mail deliverability for ${domain}`,
        "",
        ...lines,
        "",
        findings.length ? `Findings (${findings.length}):` : "Findings: none",
        ...findings.map((f) => `  - ${f}`),
        "",
        nullMx || (!ordered.length && !spfRecord)
            ? "This domain cannot receive mail today, so a support reply would bounce."
            : "Mail routing is published, so delivery depends on the receiving side accepting the message.",
        `Queried live over DNS on behalf of the Plain support desk. Contact: ${MAIL_UA}`,
    ].join("\n");
}
const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted.length % 2 === 1
        ? sorted[(sorted.length - 1) / 2]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
};
const percentile = (values, p) => {
    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length)
        return 0;
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
    return sorted[index];
};
const hours = (ms) => {
    const h = ms / 3600000;
    if (h < 1)
        return `${Math.round(ms / 60000)}m`;
    if (h < 48)
        return `${h.toFixed(1)}h`;
    return `${(h / 24).toFixed(1)}d`;
};
/**
 * First-response times for a batch of support threads, measured against a target,
 * so an SLA can be checked without pulling the whole thread list out of Plain.
 */
export async function responseTimeReport(args) {
    const target = Number(args.target_hours);
    if (!Number.isFinite(target) || target <= 0 || target > 8760) {
        throw new PlainError("target_hours must be a positive number of hours, up to 8760 (one year).");
    }
    const list = Array.isArray(args.samples) ? args.samples : [];
    if (!list.length)
        throw new PlainError("Give at least one sample with created_at and first_reply_at.");
    const capped = list.slice(0, 200);
    const rows = [];
    const broken = [];
    for (const [i, sample] of capped.entries()) {
        const created = Date.parse(String(sample.created_at ?? ""));
        const replied = Date.parse(String(sample.first_reply_at ?? ""));
        if (!Number.isFinite(created) || !Number.isFinite(replied)) {
            broken.push(`#${i + 1} (${String(sample.label ?? "unlabelled")}): unparseable timestamps`);
            continue;
        }
        const delta = replied - created;
        if (delta < 0) {
            broken.push(`#${i + 1} (${String(sample.label ?? "unlabelled")}): first reply is before the thread was created`);
            continue;
        }
        rows.push({ label: String(sample.label ?? `thread ${i + 1}`), ms: delta, breach: delta > target * 3600000 });
    }
    if (!rows.length) {
        throw new PlainError(`None of the ${capped.length} sample(s) could be read. ${broken.slice(0, 3).join(" | ")}`);
    }
    const times = rows.map((r) => r.ms);
    const breaches = rows.filter((r) => r.breach);
    const worst = [...rows].sort((a, b) => b.ms - a.ms).slice(0, 5);
    const targetMs = target * 3600000;
    return [
        `First-response report against a ${target}h target`,
        `  ${rows.length} sample(s) read${broken.length ? `, ${broken.length} skipped` : ""}`,
        "",
        `  fastest ${hours(Math.min(...times))} | median ${hours(median(times))} | mean ${(times.reduce((a, b) => a + b, 0) / times.length / 3600000).toFixed(1)}h`,
        `  90th percentile ${hours(percentile(times, 90))} | slowest ${hours(Math.max(...times))}`,
        `  met the target on ${rows.length - breaches.length} of ${rows.length} (${(((rows.length - breaches.length) / rows.length) * 100).toFixed(1)}%)`,
        "",
        `  Average breach: ${breaches.length ? hours(breaches.reduce((sum, r) => sum + r.ms - targetMs, 0) / breaches.length) : "n/a"} past the target`,
        "",
        "Slowest threads:",
        ...worst.map((r, i) => `  ${i + 1}. ${r.label.slice(0, 46)} — ${hours(r.ms)}${r.breach ? " (breach)" : ""}`),
        broken.length ? `\nSkipped: ${broken.slice(0, 5).join("; ")}` : "",
        "",
        "Measured from the timestamps supplied; nothing was fetched and no business-hours calendar is applied.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
