/**
 * Mailgun API client. Needs MAILGUN_API_KEY (free at https://www.mailgun.com/).
 * US region default; set MAILGUN_REGION=eu for EU accounts.
 * Docs: https://documentation.mailgun.com/
 */
const REGIONS = { us: "https://api.mailgun.net", eu: "https://api.eu.mailgun.net" };
export class MailgunError extends Error {
}
function base() {
    const r = (process.env.MAILGUN_REGION ?? "us").trim().toLowerCase();
    if (!REGIONS[r])
        throw new MailgunError(`Region must be us or eu, got "${process.env.MAILGUN_REGION}".`);
    return REGIONS[r];
}
function auth() {
    const key = process.env.MAILGUN_API_KEY;
    if (!key)
        throw new MailgunError("Set MAILGUN_API_KEY first (free at mailgun.com).");
    return `Basic ${Buffer.from(`api:${key}`).toString("base64")}`;
}
async function getJson(path) {
    const res = await fetch(`${base()}${path}`, {
        headers: { "User-Agent": "mailgun-mcp/1.0", Accept: "application/json", Authorization: auth() },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new MailgunError("Mailgun rejected the key (401/403). Check MAILGUN_API_KEY and MAILGUN_REGION.");
    if (res.status === 404)
        throw new MailgunError("Not found.");
    if (!res.ok)
        throw new MailgunError(`Mailgun error ${res.status}`);
    return (await res.json());
}
export async function listDomains(limit = 10) {
    const data = await getJson(`/v3/domains?limit=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.items) ? data.items : [];
    return rows.slice(0, limit).map((d) => ({
        name: String(d.name),
        state: d.state,
        created: d.created_at ? String(d.created_at).slice(0, 10) : undefined,
    }));
}
export async function domainStats(domain) {
    if (!domain.includes("."))
        throw new MailgunError(`Not a domain: "${domain}".`);
    const data = await getJson(`/v3/${encodeURIComponent(domain.trim())}/stats/total?event=sent&event=delivered&event=opened&event=failed`);
    const stats = data.stats ?? {};
    const pick = (ev) => {
        const row = (stats[ev] ?? {});
        const tot = (row.total ?? {});
        return typeof tot.count === "number" ? tot.count : undefined;
    };
    return { sent: pick("sent"), delivered: pick("delivered"), opened: pick("opened"), failed: pick("failed") };
}
export async function listBounces(domain, limit = 10) {
    if (!domain.includes("."))
        throw new MailgunError(`Not a domain: "${domain}".`);
    const data = await getJson(`/v3/${encodeURIComponent(domain.trim())}/bounces?limit=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.items) ? data.items : [];
    return rows.slice(0, limit).map((b) => `${String(b.address ?? "?")} — ${String(b.code ?? "?")} ${String(b.error ?? "").slice(0, 100)}`);
}
export function formatStats(domain, s) {
    const lines = [
        `Stats for ${domain}`,
        s.sent !== undefined ? `Sent: ${s.sent.toLocaleString()}` : "",
        s.delivered !== undefined ? `Delivered: ${s.delivered.toLocaleString()}` : "",
        s.opened !== undefined ? `Opened: ${s.opened.toLocaleString()}` : "",
        s.failed !== undefined ? `Failed: ${s.failed.toLocaleString()}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxF tools:
const MG_DOH = "https://dns.google/resolve";
const MG_STATUS = "https://status.mailgun.com/api/v2";
const MG_SELECTORS = [
    "default", "google", "selector1", "selector2", "s1", "s2", "k1", "k2",
    "mailgun", "mg", "dkim", "mandrill", "amazonses", "smtp", "mta", "zoho",
];
function mgDohUrl(name) {
    return `${MG_DOH}?name=${encodeURIComponent(name)}&type=TXT`;
}
async function mgDoh(name) {
    let res;
    try {
        res = await fetch(mgDohUrl(name), {
            headers: { "User-Agent": "mailgun-mcp/1.0", Accept: "application/dns-json" },
            signal: AbortSignal.timeout(15000),
        });
    }
    catch (e) {
        throw new MailgunError(`DNS lookup failed: ${e.message}`);
    }
    if (!res.ok)
        throw new MailgunError(`DNS-over-HTTPS returned ${res.status}.`);
    return (await res.json());
}
function mgTxtValues(answer, name) {
    const rows = Array.isArray(answer?.Answer) ? answer.Answer : [];
    return rows
        .filter((r) => Number(r.type) === 16 && String(r.name ?? "").toLowerCase().replace(/\.$/, "") === name.toLowerCase().replace(/\.$/, ""))
        .map((r) => String(r.data ?? "").replace(/"\s*"/g, "").replace(/"/g, "").replace(/\\;/g, ";"))
        .filter(Boolean);
}
function mgTagValue(record, tag) {
    const m = new RegExp(`(?:^|;)\\s*${tag}\\s*=\\s*([^;]*)`, "i").exec(record);
    return m ? m[1].trim() : null;
}
// Read the RSA modulus size out of a base64 DKIM public key (DER SubjectPublicKeyInfo).
function mgRsaBits(base64) {
    let bytes;
    try {
        bytes = Buffer.from(base64.replace(/\s+/g, ""), "base64");
    }
    catch {
        return null;
    }
    if (bytes.length < 8)
        return null;
    let i = 0;
    const readTlv = () => {
        if (i + 2 > bytes.length)
            return null;
        const tag = bytes[i++];
        let len = bytes[i++];
        if (len & 0x80) {
            const count = len & 0x7f;
            if (!count || count > 4 || i + count > bytes.length)
                return null;
            len = 0;
            for (let k = 0; k < count; k++)
                len = (len << 8) | bytes[i++];
        }
        const start = i;
        i += len;
        return { tag, start, len };
    };
    const spki = readTlv();
    if (!spki || spki.tag !== 0x30)
        return null;
    const algorithm = readTlv();
    if (!algorithm || algorithm.tag !== 0x30)
        return null;
    const bitString = readTlv();
    if (!bitString || bitString.tag !== 0x03)
        return null;
    i = bitString.start + 1;
    const rsa = readTlv();
    if (!rsa || rsa.tag !== 0x30)
        return null;
    const modulus = readTlv();
    if (!modulus || modulus.tag !== 0x02)
        return null;
    let size = modulus.len;
    let first = bytes[modulus.start];
    if (first === 0x00 && size > 1) {
        size -= 1;
        first = bytes[modulus.start + 1];
    }
    let top = 0;
    let byte = first;
    while (byte) {
        top += 1;
        byte >>= 1;
    }
    return (size - 1) * 8 + top;
}
export async function dkimSelectorScan(domain, selectors) {
    const host = String(domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!host.includes("."))
        throw new MailgunError(`Not a domain: "${domain}". Give a sending domain such as acme.com.`);
    const extra = String(selectors ?? "")
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    const names = [...new Set([...extra, ...MG_SELECTORS])].slice(0, 40);
    const found = [];
    for (const selector of names) {
        const qname = `${selector}._domainkey.${host}`;
        const answer = await mgDoh(qname);
        const records = mgTxtValues(answer, qname);
        if (!records.length)
            continue;
        for (const record of records) {
            const version = mgTagValue(record, "v");
            if (version && version.toUpperCase() !== "DKIM1")
                continue;
            const keyType = mgTagValue(record, "k") ?? "rsa";
            const publicKey = mgTagValue(record, "p") ?? "";
            const flags = mgTagValue(record, "t");
            const notes = [
                mgTagValue(record, "n"),
                mgTagValue(record, "h") ? `hashes ${mgTagValue(record, "h")}` : null,
                mgTagValue(record, "s") ? `service ${mgTagValue(record, "s")}` : null,
            ].filter(Boolean);
            found.push({
                selector,
                keyType,
                bits: keyType.toLowerCase() === "rsa" && publicKey ? mgRsaBits(publicKey) : null,
                revoked: Boolean(flags && /(^|:)\s*s\b/i.test(flags)),
                testing: Boolean(flags && /(^|:)\s*y\b/i.test(flags)),
                emptyKey: publicKey.trim() === "",
                notes,
            });
        }
    }
    const lines = [`DKIM selectors for ${host} (DNS-over-HTTPS, ${names.length} selector name(s) probed)`];
    if (!found.length) {
        lines.push("", "No DKIM key found at any probed selector.", "A domain can sign mail under a selector name that is not in the usual list; pass it in the selectors argument.");
        return lines.join("\n");
    }
    lines.push(`${found.length} key record(s) found:`);
    for (const f of found) {
        const state = f.emptyKey ? "revoked (empty p=)" : f.revoked ? "revoked (t=s)" : "active";
        const size = f.bits ? `${f.bits}-bit` : f.keyType.toLowerCase() === "rsa" ? "key size unreadable" : "not RSA";
        lines.push("", `${f.selector}._domainkey.${host}`, `  ${f.keyType.toUpperCase()}, ${size}, ${state}${f.testing ? ", testing mode (t=y)" : ""}`);
        for (const n of f.notes)
            lines.push(`  ${n}`);
    }
    lines.push("", "A missing key means mail signed with that selector cannot be verified; it does not prove the domain is unauthenticated, since another selector may still sign.");
    return lines.join("\n");
}
const MG_INDICATORS = { none: "operational", minor: "minor outage", major: "major outage", critical: "critical outage" };
async function mgStatusJson(path) {
    let res;
    try {
        res = await fetch(`${MG_STATUS}${path}`, {
            headers: { "User-Agent": "mailgun-mcp/1.0", Accept: "application/json" },
            signal: AbortSignal.timeout(20000),
        });
    }
    catch (e) {
        throw new MailgunError(`Status page unreachable: ${e.message}`);
    }
    if (!res.ok)
        throw new MailgunError(`Status page returned ${res.status}.`);
    return (await res.json());
}
export async function mailgunStatusAudit() {
    const status = await mgStatusJson("/status.json");
    const components = await mgStatusJson("/components.json");
    const incidents = await mgStatusJson("/incidents/unresolved.json");
    const maintenance = await mgStatusJson("/scheduled-maintenances/upcoming.json");
    const indicator = String(status?.status?.indicator ?? "unknown");
    const lines = [
        `Mailgun status: ${MG_INDICATORS[indicator] ?? indicator} — "${String(status?.status?.description ?? "no description").trim()}"`,
    ];
    const groups = Array.isArray(components?.components) ? components.components : [];
    const top = groups.filter((c) => !c.group);
    const degraded = groups.filter((c) => c.status && c.status !== "operational");
    lines.push("", `${groups.length} component(s), ${degraded.length} not operational.`);
    for (const c of degraded)
        lines.push(`  ${c.name} — ${String(c.status).replace(/_/g, " ")}`);
    if (!degraded.length && top.length)
        lines.push(`  All named components report operational (${top.slice(0, 8).map((c) => c.name).join(", ")}${top.length > 8 ? ", ..." : ""}).`);
    const openIncidents = Array.isArray(incidents?.incidents) ? incidents.incidents : [];
    lines.push("", openIncidents.length ? `${openIncidents.length} open incident(s):` : "No open incidents.");
    for (const inc of openIncidents.slice(0, 5)) {
        const update = Array.isArray(inc.incident_updates) ? inc.incident_updates[0] : null;
        lines.push("", `  ${inc.name} — ${String(inc.status ?? "?").replace(/_/g, " ")} (${String(inc.impact ?? "?")})`);
        if (update)
            lines.push(`  latest update ${String(update.created_at ?? "").slice(0, 16).replace("T", " ")}: ${String(update.body ?? "").slice(0, 240)}`);
    }
    const upcoming = Array.isArray(maintenance?.scheduled_maintenances) ? maintenance.scheduled_maintenances : [];
    lines.push("", upcoming.length ? `${upcoming.length} scheduled maintenance window(s):` : "No scheduled maintenance.");
    for (const m of upcoming.slice(0, 5)) {
        lines.push(`  ${m.name} — ${String(m.scheduled_for ?? "").slice(0, 16).replace("T", " ")} to ${String(m.scheduled_until ?? "").slice(0, 16).replace("T", " ")} (${String(m.status ?? "?")})`);
    }
    lines.push("", "Read from Mailgun's public status page; it needs no API key and may lag the actual service by a few minutes.");
    return lines.join("\n");
}
