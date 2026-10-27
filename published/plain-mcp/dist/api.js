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
// ---- muxF tools:
// Deliverability is answered from DNS over HTTPS, so it works without a Plain
// key and without outbound UDP/53, which most hosting environments block.
const DOH_RESOLVERS = [
    { name: "cloudflare", url: "https://cloudflare-dns.com/dns-query" },
    { name: "google", url: "https://dns.google/resolve" },
];
async function dnsQuery(name, type) {
    let last = "no resolver answered";
    for (const r of DOH_RESOLVERS) {
        try {
            const res = await fetch(`${r.url}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
                headers: { Accept: "application/dns-json", "User-Agent": "plain-mcp/1.1" },
                signal: AbortSignal.timeout(15000),
            });
            if (!res.ok) {
                last = `${r.name} answered HTTP ${res.status}`;
                continue;
            }
            return { resolver: r.name, data: await res.json() };
        }
        catch (e) {
            last = `${r.name}: ${e.message}`;
        }
    }
    throw new PlainError(`DNS lookup for ${name} (${type}) failed on every resolver (${last}).`);
}
const dnsAnswers = (packet, type) => Array.isArray(packet?.Answer) ? packet.Answer.filter((a) => a.type === type) : [];
const txtOf = (answer) => String(answer.data ?? "").replace(/"\s+"/g, "").replace(/^"|"$/g, "").trim();
function emailParts(input) {
    const raw = String(input ?? "").trim();
    const at = raw.lastIndexOf("@");
    const domain = (at >= 0 ? raw.slice(at + 1) : raw).trim().toLowerCase().replace(/^@/, "");
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain))
        throw new PlainError(`"${raw}" is not an email address or a domain with a dot in it.`);
    return { address: at >= 0 ? raw : null, domain };
}
export async function emailDeliverability(input) {
    const { address, domain } = emailParts(typeof input === "object" ? input?.email : input);
    const mx = await dnsQuery(domain, "MX");
    const records = dnsAnswers(mx.data, 15)
        .map((a) => {
        const [priority, host] = String(a.data ?? "").trim().split(/\s+/);
        return { priority: Number(priority), host: String(host ?? "").replace(/\.$/, "") };
    })
        .filter((r) => Number.isFinite(r.priority))
        .sort((a, b) => a.priority - b.priority);
    const nullMx = records.some((r) => r.host === "" || r.host === ".");
    const usable = records.filter((r) => r.host && r.host !== ".");
    const spfPacket = await dnsQuery(domain, "TXT");
    const spf = dnsAnswers(spfPacket.data, 16).map(txtOf).filter((t) => /^v=spf1\b/i.test(t));
    const dmarcPacket = await dnsQuery(`_dmarc.${domain}`, "TXT");
    const dmarc = dnsAnswers(dmarcPacket.data, 16).map(txtOf).filter((t) => /^v=DMARC1\b/i.test(t));
    const dmarcPolicy = dmarc.length ? (dmarc[0].match(/\bp\s*=\s*(none|quarantine|reject)/i)?.[1] ?? "unstated").toLowerCase() : null;
    const spfAll = spf.length ? (spf[0].match(/\b([-+~?])all\b/i)?.[1] ?? null) : null;
    const problems = [];
    const warnings = [];
    if (!records.length)
        problems.push(`No MX record: mail to ${domain} cannot be delivered at all.`);
    if (nullMx)
        problems.push("A null MX (priority 0, host \".\") is published: the domain says it accepts no mail.");
    if (!spf.length)
        problems.push("No SPF record: receivers cannot tell authorised senders from forged ones.");
    if (spf.length > 1)
        problems.push(`${spf.length} SPF records exist; RFC 7208 makes more than one a permanent error.`);
    if (spfAll === "+")
        warnings.push("SPF ends in +all, which authorises every server on the internet to send as this domain.");
    if (spfAll === "~")
        warnings.push("SPF ends in ~all (softfail): forged mail is marked, not rejected.");
    if (spfAll === "?")
        warnings.push("SPF ends in ?all (neutral): it asserts nothing about unauthorised senders.");
    if (!dmarc.length)
        problems.push(`No DMARC record at _dmarc.${domain}: there is no published policy for failures.`);
    if (dmarcPolicy === "none")
        warnings.push("DMARC policy is p=none, which reports failures but never blocks them.");
    if (records.length && !usable.length)
        problems.push("Every MX record is a null MX, so no host will accept mail.");
    const lines = [
        `Deliverability for ${address ?? domain}${address ? ` (domain ${domain})` : ""}`,
        `DNS answers from ${mx.resolver}`,
        "",
        records.length ? `MX records, in delivery order (${records.length}):` : "MX records: none",
        ...records.map((r) => (r.host === "" || r.host === "." ? `  ${r.priority}  . (null MX)` : `  ${r.priority}  ${r.host}`)),
        "",
        spf.length ? `SPF: ${spf[0]}` : "SPF: not published",
        dmarc.length ? `DMARC: ${dmarc[0]}` : "DMARC: not published",
        dmarc.length ? `DMARC policy: ${dmarcPolicy}` : "",
        "",
        problems.length ? `Problems (${problems.length}):` : "Problems: none",
        ...problems.map((p) => `  - ${p}`),
        warnings.length ? `Warnings (${warnings.length}):` : "Warnings: none",
        ...warnings.map((w) => `  - ${w}`),
        "",
        "DNS decides where mail is routed and whether it is authenticated; inbox placement is a separate question the receiving provider decides.",
    ];
    return lines.join("\n");
}
export function responseTimeReport(targetHours, samples) {
    const target = Number(targetHours);
    if (!Number.isFinite(target) || target <= 0)
        throw new PlainError("target_hours must be a positive number of hours, e.g. 4 or 24.");
    const rows = Array.isArray(samples) ? samples.slice(0, 200) : [];
    if (!rows.length)
        throw new PlainError("Give at least one sample with created_at and first_reply_at.");
    const measured = [];
    const skipped = [];
    for (const [i, row] of rows.entries()) {
        const label = String(row?.label ?? `row ${i + 1}`);
        const start = Date.parse(String(row?.created_at ?? ""));
        const reply = Date.parse(String(row?.first_reply_at ?? ""));
        if (!Number.isFinite(start) || !Number.isFinite(reply)) {
            skipped.push(`${label} (timestamp unreadable)`);
            continue;
        }
        if (reply < start) {
            skipped.push(`${label} (reply before creation)`);
            continue;
        }
        const hours = (reply - start) / 3600000;
        measured.push({ label, hours, created_at: String(row.created_at), first_reply_at: String(row.first_reply_at) });
    }
    if (!measured.length)
        throw new PlainError(`None of the ${rows.length} sample(s) carried a usable pair of timestamps.`);
    const times = measured.map((m) => m.hours).sort((a, b) => a - b);
    const pick = (q) => {
        const idx = Math.min(times.length - 1, Math.max(0, Math.ceil(q * times.length) - 1));
        return times[idx];
    };
    const median = times.length % 2 ? times[(times.length - 1) / 2] : (times[times.length / 2 - 1] + times[times.length / 2]) / 2;
    const mean = times.reduce((s, n) => s + n, 0) / times.length;
    const breaches = measured.filter((m) => m.hours > target);
    const slowest = [...measured].sort((a, b) => b.hours - a.hours).slice(0, 5);
    const fmt = (h) => `${(Math.round(h * 100) / 100).toFixed(2)}h`;
    return [
        `First-response time against a ${target}h target`,
        `  ${measured.length} thread(s) measured${skipped.length ? `, ${skipped.length} skipped` : ""}`,
        "",
        `Fastest  ${fmt(times[0])}`,
        `Median   ${fmt(median)}`,
        `Mean     ${fmt(mean)}`,
        `P90      ${fmt(pick(0.9))}`,
        `Slowest  ${fmt(times[times.length - 1])}`,
        "",
        breaches.length
            ? `Breaches: ${breaches.length} of ${measured.length} (${Math.round((breaches.length / measured.length) * 1000) / 10}%) exceeded ${target}h.`
            : `Breaches: none — every thread was answered within ${target}h.`,
        "",
        "Slowest threads:",
        ...slowest.map((m, i) => `  ${i + 1}. ${m.label} — ${fmt(m.hours)} (created ${m.created_at}, first reply ${m.first_reply_at})`),
        skipped.length ? "" : null,
        skipped.length ? `Skipped rows (${skipped.length}): ${skipped.slice(0, 8).join("; ")}` : null,
        "",
        "Computed from the timestamps you supplied: no clock-skew correction is applied, so a client clock that disagrees with the server shifts every number by the same amount.",
    ].filter((l) => l !== null).join("\n");
}
