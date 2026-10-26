/**
 * Brevo API v3 client. Needs BREVO_API_KEY (free at https://app.brevo.com/).
 * Docs: https://developers.brevo.com/docs
 */
const BASE = "https://api.brevo.com/v3";
export class BrevoError extends Error {
}
function headers() {
    const key = process.env.BREVO_API_KEY;
    if (!key)
        throw new BrevoError("Set BREVO_API_KEY first (free at app.brevo.com).");
    return { "User-Agent": "brevo-mcp/1.0", Accept: "application/json", "api-key": key };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new BrevoError("Brevo rejected the key (401/403).");
    if (res.status === 404)
        throw new BrevoError("Not found.");
    if (!res.ok)
        throw new BrevoError(`Brevo error ${res.status}`);
    return (await res.json());
}
export async function accountInfo() {
    const a = await getJson("/account");
    const plan = (a.plan ?? {});
    return [
        `${a.email ?? "(unknown account)"}${a.firstName ? ` (${a.firstName}${a.lastName ? ` ${a.lastName}` : ""})` : ""}`,
        `Plan: ${plan.type ?? "?"}${plan.credits ? ` — ${plan.credits} credits` : ""}`,
        a.companyName ? `Company: ${a.companyName}` : "",
    ].filter(Boolean).join("\n");
}
export async function listContacts(limit = 10) {
    const data = await getJson(`/contacts?limit=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.contacts) ? data.contacts : [];
    return rows.slice(0, limit).map((c) => ({
        email: c.email,
        created: c.createdAt ? String(c.createdAt).slice(0, 10) : undefined,
        blacklisted: c.emailBlacklisted,
    }));
}
export async function emailReports(days = 30) {
    if (days < 1 || days > 90)
        throw new BrevoError("Days must be 1-90.");
    const data = await getJson(`/smtp/statistics/reports?days=${days}`);
    const rows = Array.isArray(data.reports) ? data.reports : [];
    const tot = (k) => rows.reduce((n, r) => n + (Number(r[k] ?? 0) || 0), 0);
    return [
        `Email reports (last ${days}d)`,
        `Requests: ${tot("requests").toLocaleString()}`,
        `Delivered: ${tot("delivered").toLocaleString()}`,
        `Opened: ${tot("opened").toLocaleString()}`,
        `Clicked: ${tot("clicked").toLocaleString()}`,
        `Bounced: ${tot("hardBounces") + tot("softBounces")}`,
    ].join("\n");
}
export function formatContact(c, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}${c.email ?? "?"}${c.blacklisted ? " [blacklisted]" : ""}${c.created ? ` — since ${c.created}` : ""}`;
}
const STATUSES = ["draft", "sent", "archive", "queued", "suspended", "in_process", "in_review", "cancelling", "cancelled"];
const TYPES = ["classic", "trigger"];
/**
 * GET /emailCampaigns?statistics=globalStats&excludeHtmlContent=true
 * campaigns[].statistics.globalStats carries sent, delivered, uniqueViews,
 * uniqueClicks, clickers, hardBounces, softBounces, unsubscriptions,
 * complaints and opensRate.
 */
export async function campaignPerformance(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const qs = new URLSearchParams({ limit: String(limit), offset: "0", sort: "desc", statistics: "globalStats", excludeHtmlContent: "true" });
    if (args.status) {
        const s = args.status.trim().toLowerCase();
        if (!STATUSES.includes(s))
            throw new BrevoError(`Status must be one of: ${STATUSES.join(", ")}.`);
        qs.set("status", s);
    }
    if (args.type) {
        const t = args.type.trim().toLowerCase();
        if (!TYPES.includes(t))
            throw new BrevoError("Type must be classic or trigger.");
        qs.set("type", t);
    }
    const data = await getJson(`/emailCampaigns?${qs.toString()}`);
    const rows = Array.isArray(data.campaigns) ? data.campaigns : [];
    if (!rows.length)
        throw new BrevoError("Brevo returned no campaigns for that filter.");
    const pct = (n, d) => (d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "n/a");
    const n = (v) => Number(v ?? 0) || 0;
    const lines = [`Brevo campaign performance (${rows.length} of ${data.count ?? rows.length} campaign(s) matching)`, ""];
    for (const c of rows) {
        const g = (c.statistics?.globalStats ?? {});
        const sent = n(g.sent);
        const delivered = n(g.delivered);
        const hard = n(g.hardBounces);
        const soft = n(g.softBounces);
        lines.push(`${c.id} ${c.name ?? "(unnamed)"} [${c.status ?? "status not reported"}/${c.type ?? "type not reported"}]`);
        lines.push(`  Subject: ${c.subject ?? c.previewText ?? "not reported"}`);
        if (c.sender?.email)
            lines.push(`  Sender: ${c.sender.name ?? "unnamed"} <${c.sender.email}>`);
        if (c.scheduledAt)
            lines.push(`  Scheduled: ${String(c.scheduledAt).slice(0, 16)}`);
        if (c.sentDate)
            lines.push(`  Sent: ${String(c.sentDate).slice(0, 16)}`);
        const lists = Array.isArray(c.recipients?.lists) ? c.recipients.lists : [];
        const excl = Array.isArray(c.recipients?.exclusionLists) ? c.recipients.exclusionLists : [];
        if (lists.length || excl.length)
            lines.push(`  Target lists: ${lists.join(", ") || "none"} | exclusions: ${excl.join(", ") || "none"}`);
        if (Object.keys(g).length === 0) {
            lines.push("  Brevo returned no statistics for this campaign (statistics cover the last 6 months only).");
        }
        else {
            lines.push(`  Sent ${sent.toLocaleString()} -> delivered ${delivered.toLocaleString()} (${pct(delivered, sent)})`);
            lines.push(`  Hard bounces ${hard.toLocaleString()} | soft bounces ${soft.toLocaleString()} (${pct(hard + soft, sent)}) | unsubscribes ${n(g.unsubscriptions).toLocaleString()} | complaints ${n(g.complaints).toLocaleString()}`);
            lines.push(`  Unique views ${n(g.uniqueViews).toLocaleString()} (${pct(n(g.uniqueViews), sent)}) | unique clicks ${n(g.uniqueClicks).toLocaleString()} (${pct(n(g.uniqueClicks), sent)}) | clickers ${n(g.clickers).toLocaleString()}`);
            if (g.opensRate !== undefined)
                lines.push(`  Brevo-reported opens rate: ${g.opensRate}%`);
        }
        lines.push("");
    }
    return lines.join("\n").trimEnd();
}
/** GET /senders - identities, whether each is activated, and any dedicated IPs. */
export async function senderInventory(args) {
    const qs = new URLSearchParams();
    if (args.domain?.trim())
        qs.set("domain", args.domain.trim());
    const data = await getJson(`/senders${qs.toString() ? `?${qs.toString()}` : ""}`);
    const rows = Array.isArray(data.senders) ? data.senders : [];
    if (!rows.length)
        throw new BrevoError("Brevo returned no email senders for this account.");
    const active = rows.filter((s) => s.active === true);
    const withIps = rows.filter((s) => Array.isArray(s.ips) && s.ips.length > 0);
    const lines = [`Brevo senders (${rows.length} total, ${active.length} activated, ${rows.length - active.length} deactivated)`, ""];
    for (const s of rows) {
        const ips = (Array.isArray(s.ips) ? s.ips : []);
        lines.push(`${s.active === true ? "ACTIVE   " : "inactive"} ${s.name ?? "(unnamed)"} <${s.email ?? "email not reported"}> [id ${s.id ?? "?"}]`);
        if (ips.length) {
            for (const ip of ips)
                lines.push(`           dedicated IP ${ip.ip ?? "?"} (${ip.domain ?? "domain not reported"}) weight ${ip.weight ?? "?"}`);
        }
    }
    lines.push("");
    if (withIps.length) {
        const weights = withIps.flatMap((s) => (s.ips ?? []).map((i) => Number(i.weight ?? 0)));
        lines.push(`Dedicated IPs are configured for ${withIps.length} sender(s); weights reported: ${weights.join(", ")} (Brevo requires them to sum to 100 per sender).`);
    }
    else {
        lines.push("No sender has a dedicated IP, so this account sends from shared Brevo infrastructure.");
    }
    return lines.join("\n");
}
/**
 * GET /contacts/lists
 * Brevo documents that totalSubscribers and totalBlacklisted are being
 * retired and will read 0, so they are reported as sent with that caveat.
 */
export async function listInventory(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 20, 100));
    const data = await getJson(`/contacts/lists?limit=${limit}&offset=0&sort=desc`);
    const rows = Array.isArray(data.lists) ? data.lists : [];
    if (!rows.length)
        throw new BrevoError("Brevo returned no contact lists for this account.");
    const n = (v) => Number(v ?? 0) || 0;
    const totalSubs = rows.reduce((s, l) => s + n(l.totalSubscribers), 0);
    const totalBlack = rows.reduce((s, l) => s + n(l.totalBlacklisted), 0);
    const lines = [`Brevo contact lists (${rows.length} of ${data.count ?? rows.length} in the account)`, ""];
    for (const l of rows) {
        const bits = [`  ${l.id ?? "?"} ${l.name ?? "(unnamed)"}`];
        if (l.folderId !== undefined)
            bits.push(` | folder ${l.folderId}`);
        bits.push(` | subscribers ${n(l.totalSubscribers).toLocaleString()} | unique ${n(l.uniqueSubscribers).toLocaleString()} | blacklisted ${n(l.totalBlacklisted).toLocaleString()}`);
        lines.push(bits.join(""));
    }
    lines.push("");
    lines.push(`Totals across the lists shown: ${totalSubs.toLocaleString()} subscribers, ${totalBlack.toLocaleString()} blacklisted.`);
    lines.push("Brevo is retiring totalSubscribers and totalBlacklisted on this endpoint, so both may read 0 even for populated lists; uniqueSubscribers is the count still being maintained.");
    return lines.join("\n");
}
