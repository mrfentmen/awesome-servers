export class FreshdeskError extends Error {
    constructor(message) {
        super(message);
        this.name = "FreshdeskError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function conf() {
    const domain = process.env.FRESHDESK_DOMAIN;
    const k = process.env.FRESHDESK_API_KEY;
    if (!domain || !k)
        throw new FreshdeskError("Set FRESHDESK_DOMAIN and FRESHDESK_API_KEY.");
    return { domain, auth: `Basic ${Buffer.from(`${k}:X`).toString("base64")}` };
}
async function get(path) {
    const { domain, auth } = conf();
    let res;
    try {
        res = await fetch(`https://${domain}.freshdesk.com/api/v2${path}`, {
            headers: { ...UA, Accept: "application/json", Authorization: auth },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new FreshdeskError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new FreshdeskError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function listTickets() {
    return get("/tickets?per_page=20");
}
export function getTicket(ticketId) {
    return get(`/tickets/${encodeURIComponent(ticketId)}`);
}
export function listContacts() {
    return get("/contacts?per_page=20");
}
export function contactDetails(contactId) {
    return get(`/contacts/${encodeURIComponent(contactId)}`);
}
export function agents() {
    return get("/agents?per_page=20");
}
export function companies() {
    return get("/companies?per_page=20");
}
export function groups() {
    return get("/groups?per_page=20");
}
export function conversations(ticketId) {
    return get(`/tickets/${encodeURIComponent(ticketId)}/conversations`);
}
export function satisfaction() {
    return get("/surveys/satisfaction_ratings?per_page=10");
}
export function canned() {
    return get("/canned_response_folders?per_page=10").then((t) => t.slice(0, 4000));
}
async function supportFetchJson(url, accept = "application/json") {
    let res;
    try {
        res = await fetch(url, { headers: { ...UA, Accept: accept }, signal: AbortSignal.timeout(30000) });
    }
    catch (e) {
        throw new FreshdeskError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        throw new FreshdeskError(`HTTP ${res.status} from ${url.split("?")[0]}: ${body}`);
    }
    const body = await res.text();
    if (!body.trim())
        throw new FreshdeskError(`${url.split("?")[0]} returned an empty body.`);
    return JSON.parse(body);
}
function statusHost(input) {
    const value = (input ?? "").trim();
    if (!value)
        throw new FreshdeskError("Pass a status page, for example https://www.githubstatus.com");
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    let host;
    try {
        host = new URL(withScheme).hostname;
    }
    catch {
        throw new FreshdeskError(`"${input}" is not a URL.`);
    }
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host))
        throw new FreshdeskError(`"${host}" is not a hostname.`);
    return host;
}
export async function serviceStatus(args) {
    const host = statusHost(args.status_page);
    const data = await supportFetchJson(`https://${host}/api/v2/summary.json`);
    if (!data?.page || !data.status)
        throw new FreshdeskError(`${host} is not a Statuspage page (no page object in the response).`);
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 5) || 5, 10));
    const lines = [`${data.page.name ?? host} status — ${data.status.description ?? data.status.indicator ?? "state not reported"} (updated ${data.page.updated_at ?? "not reported"})`];
    const components = data.components ?? [];
    lines.push("");
    lines.push(`Components (${components.length}):`);
    for (const component of components.slice(0, limit * 2)) {
        lines.push(`  ${(component.status ?? "?").padEnd(9)} ${(component.name ?? "unnamed").slice(0, 60)}`);
    }
    if (components.length > limit * 2)
        lines.push(`  ...and ${components.length - limit * 2} more.`);
    const incidents = data.incidents ?? [];
    lines.push("");
    lines.push(`Open incidents (${incidents.length}):`);
    if (!incidents.length)
        lines.push("  none reported.");
    for (const incident of incidents.slice(0, limit)) {
        lines.push(`  [${incident.status ?? "?"}/${incident.impact ?? "?"}] ${(incident.name ?? "unnamed").slice(0, 90)}`);
        lines.push(`     started ${incident.created_at ?? "not reported"}${incident.shortlink ? ` · ${incident.shortlink}` : ""}`);
    }
    if (incidents.length > limit)
        lines.push(`  ...and ${incidents.length - limit} more.`);
    const maintenance = data.scheduled_maintenances ?? [];
    if (maintenance.length) {
        lines.push("");
        lines.push(`Scheduled maintenance (${maintenance.length}):`);
        for (const item of maintenance.slice(0, 3))
            lines.push(`  [${item.status ?? "?"}] ${(item.name ?? "unnamed").slice(0, 90)}`);
        if (maintenance.length > 3)
            lines.push(`  ...and ${maintenance.length - 3} more.`);
    }
    return lines.join("\n");
}
// crt.sh answers 404 for roughly one query in three while it rebuilds its index,
// so give the same query a few tries before reporting a failure.
async function crtFetch(url) {
    let last = "";
    for (let attempt = 0; attempt < 4; attempt += 1) {
        if (attempt)
            await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
        let res;
        try {
            res = await fetch(url, { headers: { ...UA, Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
        }
        catch (e) {
            last = `network error: ${e.message}`;
            continue;
        }
        if (res.ok) {
            const body = await res.text();
            if (body.trim())
                return JSON.parse(body);
            last = "empty body";
            continue;
        }
        last = `HTTP ${res.status}`;
    }
    throw new FreshdeskError(`crt.sh did not answer after 4 attempts (${last}).`);
}
export async function domainCertificates(args) {
    const domain = (args.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)+$/.test(domain)) {
        throw new FreshdeskError(`"${args.domain}" does not look like a domain name.`);
    }
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 8) || 8, 20));
    const query = args.include_expired ? `q=%25.${domain}&output=json` : `q=%25.${domain}&output=json&exclude=expired`;
    const data = await crtFetch(`https://crt.sh/?${query}`);
    if (!Array.isArray(data))
        throw new FreshdeskError("crt.sh did not return a certificate list.");
    if (!data.length)
        throw new FreshdeskError(`crt.sh has no certificate records for %.${domain}.`);
    const rows = data.slice(0, limit);
    const names = new Set();
    for (const entry of data) {
        for (const name of String(entry.name_value ?? "").split("\n")) {
            const clean = name.trim().toLowerCase();
            if (clean)
                names.add(clean);
        }
    }
    const issuers = new Map();
    for (const entry of data) {
        const issuer = (entry.issuer_name ?? "not reported").split(",")[0].trim();
        issuers.set(issuer, (issuers.get(issuer) ?? 0) + 1);
    }
    const topIssuers = Array.from(issuers.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const now = Date.now();
    const soonest = data
        .map((entry) => Date.parse(String(entry.not_after ?? "")))
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b)[0];
    const lines = [
        `Certificate transparency for %.${domain} — ${data.length} record${data.length === 1 ? "" : "s"}${args.include_expired ? "" : " (expired ones excluded)"}, ${names.size} distinct name${names.size === 1 ? "" : "s"}`,
        soonest !== undefined
            ? `Earliest expiry still in the list: ${new Date(soonest).toISOString().slice(0, 10)}${soonest < now ? " (already past)" : ""}`
            : "Expiry dates: not reported",
        `Issuers: ${topIssuers.map(([name, count]) => `${name} (${count})`).join(", ")}`,
        "",
        "Most recent records:",
    ];
    for (const entry of rows) {
        lines.push(`  ${(entry.common_name ?? "not reported").slice(0, 70)}`);
        lines.push(`    ${entry.issuer_name?.split(",")[0]?.trim() ?? "issuer not reported"} · valid ${String(entry.not_before ?? "?").slice(0, 10)} to ${String(entry.not_after ?? "?").slice(0, 10)}`);
    }
    return lines.join("\n");
}
