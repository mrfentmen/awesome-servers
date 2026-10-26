import { connect } from "node:tls";
const UA = "mrfentmen-ohdear-mcp/1.0";
const DOH = "https://dns.google/resolve";
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
const HEADER_KEYS = [
    "content-type",
    "server",
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
    "cache-control",
    "x-powered-by",
];
/**
 * Fetches a URL and follows redirects by hand so the caller can see every hop.
 * This is exactly the check an uptime monitor runs, done live.
 */
export async function request(target, timeoutMs = 15000) {
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
    const headers = {};
    for (const key of HEADER_KEYS) {
        const value = last.headers.get(key);
        if (value)
            headers[key] = value.slice(0, 400);
    }
    return {
        ok: last.status >= 200 && last.status < 400,
        status: last.status,
        statusText: last.statusText,
        finalUrl: url.toString(),
        ms: Date.now() - start,
        bytes: Buffer.byteLength(body),
        contentType: last.headers.get("content-type") ?? "",
        server: last.headers.get("server"),
        headers,
        hops,
        bodySnippet: body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200),
    };
}
export async function checkUrl(args) {
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
            const arrow = hop.location ? ` -> ${hop.location}` : "";
            lines.push(`  ${i + 1}. ${hop.status} ${hop.url}${arrow}`);
        });
    }
    if (r.bodySnippet)
        lines.push("", `First text: ${r.bodySnippet}`);
    return lines.join("\n");
}
export async function checkMany(args) {
    const urls = (args.urls ?? []).map((u) => String(u).trim()).filter(Boolean).slice(0, 10);
    if (!urls.length)
        return "Provide up to 10 URLs to check.";
    const rows = [];
    let up = 0;
    // Sequential on purpose: a monitor should not hammer a host from one IP at once.
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
    return `Checked ${urls.length} URL(s): ${up} up, ${urls.length - up} down.\n\n${rows.join("\n")}`;
}
/** Reads the live certificate off the host's own TLS handshake. */
export async function fetchCertificate(hostname, port = 443) {
    return new Promise((resolve, reject) => {
        const socket = connect({ host: hostname, port, servername: hostname, rejectUnauthorized: false, timeout: 15000 }, () => {
            const cert = socket.getPeerCertificate();
            if (!cert || !cert.valid_to) {
                socket.destroy();
                reject(new Error(`No certificate returned by ${hostname}:${port}.`));
                return;
            }
            const validTo = new Date(cert.valid_to);
            const info = {
                subject: (cert.subject ?? {}),
                issuer: (cert.issuer ?? {}),
                validFrom: new Date(cert.valid_from).toISOString(),
                validTo: validTo.toISOString(),
                daysRemaining: Math.floor((validTo.getTime() - Date.now()) / 86400000),
                altNames: String(cert.subjectaltname ?? "")
                    .split(",")
                    .map((n) => n.trim().replace(/^DNS:/, ""))
                    .filter(Boolean)
                    .slice(0, 50),
                authorized: socket.authorized,
                authorizationError: socket.authorized ? null : String(socket.authorizationError ?? "unknown"),
                protocol: socket.getProtocol() ?? "unknown",
            };
            socket.destroy();
            resolve(info);
        });
        socket.on("error", (e) => reject(new Error(`TLS connection to ${hostname}:${port} failed: ${e.message}`)));
        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error(`TLS connection to ${hostname}:${port} timed out.`));
        });
    });
}
export async function sslCertificate(args) {
    const host = normalizeTarget(args.host).hostname;
    const c = await fetchCertificate(host);
    const expiry = c.daysRemaining < 0
        ? `EXPIRED ${Math.abs(c.daysRemaining)} day(s) ago`
        : c.daysRemaining < 14
            ? `EXPIRES IN ${c.daysRemaining} day(s) — renew now`
            : `valid for ${c.daysRemaining} more day(s)`;
    return [
        `Certificate for ${host}`,
        `Status: ${expiry}`,
        `Subject: ${c.subject.CN ?? c.subject.O ?? "unknown"}`,
        `Issuer: ${c.issuer.O ?? c.issuer.CN ?? "unknown"}`,
        `Valid from: ${c.validFrom}`,
        `Valid to:   ${c.validTo}`,
        `Protocol: ${c.protocol}`,
        `Trusted chain: ${c.authorized ? "yes" : `no (${c.authorizationError})`}`,
        c.altNames.length ? `Covers ${c.altNames.length} name(s): ${c.altNames.slice(0, 12).join(", ")}` : "No subject alternative names.",
    ].join("\n");
}
const RECORD_TYPES = ["A", "AAAA", "NS", "MX", "TXT", "CAA"];
const TYPE_NAMES = {
    1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA", 257: "CAA",
};
async function dnsQuery(name, type) {
    const res = await fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
        headers: { "User-Agent": UA, Accept: "application/dns-json" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`DNS-over-HTTPS returned ${res.status}`);
    return (await res.json());
}
const answerLines = (d) => (d.Answer ?? []).map((row) => {
    const kind = TYPE_NAMES[row.type ?? 0] ?? `TYPE${row.type ?? "?"}`;
    return `${kind} ${String(row.data ?? "").trim()}`;
});
export async function dnsHealth(args) {
    const domain = normalizeTarget(args.domain).hostname;
    const results = await Promise.allSettled(RECORD_TYPES.map((type) => dnsQuery(domain, type)));
    const lines = [`DNS health for ${domain}`];
    let missing = 0;
    results.forEach((result, i) => {
        const type = RECORD_TYPES[i];
        if (result.status === "rejected") {
            lines.push(`  ${type}: lookup failed (${errorMessage(result.reason)})`);
            missing += 1;
            return;
        }
        const answers = answerLines(result.value);
        if (!answers.length) {
            lines.push(`  ${type}: none`);
            if (type === "A" || type === "NS")
                missing += 1;
            return;
        }
        lines.push(`  ${type}:`);
        answers.slice(0, 6).forEach((a) => lines.push(`    ${a}`));
    });
    const spf = results[4]?.status === "fulfilled"
        ? answerLines(results[4].value).find((a) => a.includes("v=spf1"))
        : undefined;
    lines.push("", `Core records present: ${missing === 0 ? "yes" : `no (${missing} missing)`}`);
    lines.push(`SPF: ${spf ? spf.replace(/^TXT /, "") : "not published — mail from this domain is unprotected"}`);
    return lines.join("\n");
}
const SECURITY_HEADERS = [
    { header: "strict-transport-security", why: "forces HTTPS for future visits" },
    { header: "content-security-policy", why: "blocks cross-site scripting and injected content" },
    { header: "x-frame-options", why: "stops clickjacking through iframes" },
    { header: "x-content-type-options", why: "stops MIME-sniffing attacks" },
    { header: "referrer-policy", why: "limits how much URL data leaks to other sites" },
    { header: "permissions-policy", why: "switches off browser features the site does not need" },
];
export async function securityHeaders(args) {
    const r = await request(args.url);
    const audit = SECURITY_HEADERS.map(({ header, why }) => ({
        header,
        present: Boolean(r.headers[header]),
        value: r.headers[header] ?? null,
        why,
    }));
    const present = audit.filter((a) => a.present).length;
    const grade = present >= 6 ? "A" : present === 5 ? "B" : present === 4 ? "C" : present === 3 ? "D" : "F";
    const lines = [
        `Security headers for ${r.finalUrl} (HTTP ${r.status})`,
        `Grade: ${grade} — ${present} of ${audit.length} recommended headers present`,
        "",
    ];
    for (const a of audit) {
        lines.push(`${a.present ? "PASS" : "MISS"} ${a.header} — ${a.why}`);
        if (a.value)
            lines.push(`     ${a.value.slice(0, 300)}`);
    }
    if (r.headers["x-powered-by"])
        lines.push("", `Note: x-powered-by discloses ${r.headers["x-powered-by"]} — consider removing it.`);
    return lines.join("\n");
}
/** One call that combines the HTTP, TLS, DNS and header checks a monitor would run. */
export async function siteReport(args) {
    const url = normalizeTarget(args.url);
    const [http, cert, dns] = await Promise.allSettled([
        request(url.toString()),
        fetchCertificate(url.hostname, url.port ? Number(url.port) : 443),
        dnsQuery(url.hostname, "A"),
    ]);
    const lines = [`Site report for ${url.toString()}`, ""];
    if (http.status === "fulfilled") {
        const r = http.value;
        lines.push(`HTTP: ${r.ok ? "UP" : "DOWN"} — ${r.status} ${r.statusText} in ${r.ms} ms`);
        lines.push(`  Final URL: ${r.finalUrl}${r.hops.length > 1 ? ` (${r.hops.length - 1} redirect(s))` : ""}`);
        const present = SECURITY_HEADERS.filter(({ header }) => r.headers[header]).length;
        lines.push(`  Security headers: ${present}/${SECURITY_HEADERS.length}`);
    }
    else {
        lines.push(`HTTP: DOWN — ${errorMessage(http.reason)}`);
    }
    if (cert.status === "fulfilled") {
        const c = cert.value;
        const state = c.daysRemaining < 0
            ? `expired ${Math.abs(c.daysRemaining)} day(s) ago`
            : `expires in ${c.daysRemaining} day(s)`;
        lines.push(`TLS: ${c.subject.CN ?? url.hostname} issued by ${c.issuer.O ?? "unknown"} — ${state}`);
        lines.push(`  Trusted: ${c.authorized ? "yes" : `no (${c.authorizationError})`} | ${c.protocol}`);
    }
    else {
        lines.push(`TLS: unavailable — ${errorMessage(cert.reason)}`);
    }
    if (dns.status === "fulfilled") {
        const addresses = answerLines(dns.value);
        lines.push(`DNS: ${addresses.length ? addresses.join(", ") : "no A record published"}`);
    }
    else {
        lines.push(`DNS: unavailable — ${errorMessage(dns.reason)}`);
    }
    const healthy = http.status === "fulfilled" && http.value.ok
        && cert.status === "fulfilled" && cert.value.daysRemaining > 14;
    lines.push("", `Verdict: ${healthy ? "healthy — reachable with a valid certificate" : "needs attention"}`);
    return lines.join("\n");
}
// ---- muxG tools:
const OHDEAR_CRTSH = "https://crt.sh/";
const OHDEAR_RDAP = "https://rdap.org/domain/";
const ohDate = (value) => {
    const stamp = Date.parse(String(value ?? ""));
    return Number.isFinite(stamp) ? new Date(stamp).toISOString().slice(0, 10) : null;
};
const ohDays = (value) => {
    const stamp = Date.parse(String(value ?? ""));
    return Number.isFinite(stamp) ? Math.round((stamp - Date.now()) / 86400000) : null;
};
/** Groups rows by a key and returns the busiest first. */
const ohRank = (map, take) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, take);
export async function certificateTransparency(args = {}) {
    const domain = normalizeTarget(args.domain ?? "").hostname;
    const limit = Math.min(Math.max(Number(args.limit ?? 8) || 8, 1), 12);
    const res = await fetch(`${OHDEAR_CRTSH}?q=${encodeURIComponent(`%.${domain}`)}&output=json`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(45000),
    });
    if (res.status === 404)
        throw new Error(`The transparency log has no record matching ${domain}.`);
    if (!res.ok)
        throw new Error(`The transparency log returned ${res.status} for ${domain}; crt.sh throttles under load, so retry in a minute.`);
    const body = (await res.text()).trim();
    if (!body || body === "[]")
        throw new Error(`The transparency log has no certificate for ${domain}.`);
    let rows;
    try {
        rows = JSON.parse(body);
    }
    catch {
        throw new Error("The transparency log answered with something that is not JSON; it is probably throttling. Retry in a minute.");
    }
    if (!Array.isArray(rows) || !rows.length)
        throw new Error(`The transparency log has no certificate for ${domain}.`);
    // The same certificate is logged by several logs, so count each serial once.
    const seen = new Map();
    for (const row of rows) {
        const key = String(row.serial_number ?? row.id ?? Math.random());
        if (!seen.has(key))
            seen.set(key, row);
    }
    const certs = [...seen.values()];
    const issuers = new Map();
    const names = new Set();
    let valid = 0;
    let expiringSoon = 0;
    let soonest = null;
    for (const cert of certs) {
        const issuer = String(cert.issuer_name ?? "unknown").replace(/\s+/g, " ").trim();
        issuers.set(issuer, (issuers.get(issuer) ?? 0) + 1);
        for (const name of String(cert.name_value ?? cert.common_name ?? "").split("\n")) {
            const clean = name.trim().toLowerCase();
            if (clean)
                names.add(clean);
        }
        const days = ohDays(cert.not_after);
        if (days !== null && days > 0) {
            valid += 1;
            if (days <= 30)
                expiringSoon += 1;
            if (soonest === null || days < soonest.days)
                soonest = { days, name: String(cert.common_name ?? ""), expires: ohDate(cert.not_after) };
        }
    }
    const recent = [...certs]
        .sort((a, b) => String(b.not_before ?? "").localeCompare(String(a.not_before ?? "")))
        .slice(0, limit)
        .map((cert) => ({
        common_name: String(cert.common_name ?? "").trim() || null,
        issuer: String(cert.issuer_name ?? "unknown").replace(/\s+/g, " ").trim(),
        not_before: ohDate(cert.not_before),
        not_after: ohDate(cert.not_after),
        days_left: ohDays(cert.not_after),
        names_covered: String(cert.name_value ?? "").split("\n").filter((n) => n.trim()).length,
    }));
    const lines = [
        `Certificate transparency for ${domain} — ${certs.length} distinct certificate(s) logged, ${rows.length} log entries`,
        `Names covered: ${names.size}`,
        `Still valid: ${valid} | expiring within 30 days: ${expiringSoon}`,
        soonest ? `Soonest expiry: ${soonest.expires} (${soonest.days} day(s)) for ${soonest.name || "an unnamed certificate"}` : "Soonest expiry: no unexpired certificate in the log",
        "",
        `Issuers (${issuers.size}):`,
    ];
    for (const [issuer, count] of ohRank(issuers, 8)) {
        lines.push(`  ${count} — ${issuer}`);
    }
    lines.push("", `Most recently issued (${recent.length} of ${certs.length}):`);
    for (const cert of recent) {
        const window = `${cert.not_before ?? "?"} to ${cert.not_after ?? "?"}`;
        lines.push(`  ${cert.common_name ?? "(no common name)"} — ${window}${cert.days_left !== null ? ` (${cert.days_left} day(s) left)` : ""}, ${cert.names_covered} name(s)`);
    }
    lines.push("", "A certificate in the log only proves it was issued, not that it is still served; the live TLS certificate is what the ssl_certificate tool reads.");
    return lines.join("\n");
}
export async function domainRegistration(args = {}) {
    const domain = normalizeTarget(args.domain ?? "").hostname;
    const res = await fetch(`${OHDEAR_RDAP}${encodeURIComponent(domain)}`, {
        headers: { "User-Agent": UA, Accept: "application/rdap+json, application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404) {
        throw new Error(`The registry publishes no RDAP record for ${domain}. Many country-code registries still do not, which is not the same as the domain being unregistered.`);
    }
    if (!res.ok)
        throw new Error(`RDAP lookup for ${domain} returned ${res.status}.`);
    const d = (await res.json());
    if (!d || typeof d !== "object")
        throw new Error(`RDAP returned no record for ${domain}.`);
    const events = Array.isArray(d.events) ? d.events : [];
    const eventDate = (action, fallbackAction) => {
        const hit = events.find((e) => String(e.eventAction ?? "").toLowerCase() === action)
            ?? (fallbackAction ? events.find((e) => String(e.eventAction ?? "").toLowerCase() === fallbackAction) : undefined);
        return hit ? ohDate(hit.eventDate) : null;
    };
    const registered = eventDate("registration");
    const expires = eventDate("expiration");
    const changed = eventDate("last changed", "last update of rdap database");
    const transferred = eventDate("transfer");
    const statuses = Array.isArray(d.status) ? d.status.map((s) => String(s)) : [];
    const entities = Array.isArray(d.entities) ? d.entities : [];
    const vcardValue = (entity, key) => {
        const card = entity?.vcardArray;
        const rows = Array.isArray(card) && Array.isArray(card[1]) ? card[1] : [];
        const row = rows.find((r) => Array.isArray(r) && r[0] === key);
        return row && row[3] != null ? String(row[3]) : null;
    };
    const registrar = entities.find((e) => Array.isArray(e.roles) && e.roles.includes("registrar"));
    const registrarName = registrar ? vcardValue(registrar, "fn") : null;
    const registrarId = registrar && Array.isArray(registrar.publicIds)
        ? registrar.publicIds.find((p) => /iana/i.test(String(p.type ?? "")))?.identifier ?? null
        : null;
    const nameservers = Array.isArray(d.nameservers)
        ? d.nameservers.map((ns) => String(ns.ldhName ?? "").toLowerCase()).filter(Boolean)
        : [];
    const signed = d.secureDNS ? d.secureDNS.delegationSigned === true : null;
    const ageDays = registered ? Math.round((Date.now() - Date.parse(`${registered}T00:00:00Z`)) / 86400000) : null;
    const daysLeft = expires ? ohDays(`${expires}T00:00:00Z`) : null;
    const lines = [
        `Registration record for ${String(d.ldhName ?? domain).toLowerCase()} (RDAP)`,
        `Registrar: ${registrarName ?? "not disclosed"}${registrarId ? ` (IANA id ${registrarId})` : ""}`,
        `Registered: ${registered ?? "not published"}${ageDays !== null ? ` (${ageDays} day(s) old)` : ""}`,
        `Expires: ${expires ?? "not published"}${daysLeft !== null ? ` (${daysLeft} day(s) left)` : ""}`,
        `Last changed: ${changed ?? "not published"}`,
        transferred ? `Last transfer: ${transferred}` : null,
        `DNSSEC signed: ${signed === null ? "not reported" : signed ? "yes" : "no"}`,
        `Status: ${statuses.length ? statuses.join(", ") : "not published"}`,
        nameservers.length ? `Nameservers (${nameservers.length}): ${nameservers.slice(0, 8).join(", ")}` : "Nameservers: none published",
        "",
        "RDAP is the registry's own record; it says nothing about whether the site is up or what it serves.",
    ].filter(Boolean);
    return lines.join("\n");
}
const OHDEAR_WAYBACK_URL = "https://archive.org/wayback/available";
/** The archive's view of the page: when it was last captured, and what it looked like at a point in time. */
export async function archivedSnapshot(args) {
    const url = normalizeTarget(args.url ?? "").hostname;
    const at = String(args.at ?? "").trim();
    const cleanedAt = at.replace(/-/g, "");
    if (at && !/^\d{4}$|^\d{6}$|^\d{8}$/.test(cleanedAt)) {
        throw new Error(`"${at}" is not a YYYY, YYYYMM or YYYYMMDD date.`);
    }
    const params = new URLSearchParams({ url });
    if (at)
        params.set("timestamp", cleanedAt);
    const res = await fetch(`${OHDEAR_WAYBACK_URL}?${params}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`The archive availability API returned ${res.status}`);
    const d = (await res.json());
    const c = d.archived_snapshots?.closest;
    if (!c || c.available !== true) {
        return [
            `Archive coverage for ${url}`,
            at ? `The archive has no capture on or near ${at}.` : "The archive has no capture of this name.",
            "Absence here is not evidence the site was down; the archive only captures what it happened to crawl.",
        ].join("\n");
    }
    const stamp = c.timestamp ?? "";
    const y = stamp.slice(0, 4);
    const m = stamp.slice(4, 6);
    const day = stamp.slice(6, 8);
    const ageDays = Math.round((Date.now() - Date.parse(`${y}-${m}-${day}T00:00:00Z`)) / 86400000);
    return [
        `Archive coverage for ${url}`,
        at ? `Closest capture to ${at}:` : "Most recent capture:",
        `  ${y}-${m}-${day} (${ageDays} day(s) ago), archive status ${c.status ?? "not reported"}`,
        `  ${c.url ?? "not reported"}`,
        at ? "The archive picks the nearest capture to the date you asked for, not an exact one." : "A recent capture only means the archive crawled it then; it says nothing about the days in between.",
    ].join("\n");
}
