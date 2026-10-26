import { promises as dns } from "node:dns";
import { createConnection } from "node:net";
export class EmailError extends Error {
}
/**
 * Throwaway-mail domains seen in signup fraud. Kept small on purpose so a
 * false positive is rare; the list is easy to extend.
 */
export const DISPOSABLE = new Set([
    "mailinator.com", "10minutemail.com", "guerrillamail.com", "sharklasers.com",
    "yopmail.com", "tempmail.com", "throwawaymail.com", "maildrop.cc", "temp-mail.org",
    "getnada.com", "dispostable.com", "mohmal.com", "emailondeck.com", "burnermail.io",
    "trashmail.com", "spam4.me", "fakeinbox.com", "mailnesia.com", "mintemail.com",
    "mailcatch.com", "mailnull.com", "spamgourmet.com", "tempr.email", "discard.email",
    "33mail.com", "mytemp.email", "tempinbox.com", "email-temp.com",
]);
/** Shared/role mailboxes — deliverable, but usually not a real person. */
export const ROLE_LOCALPARTS = new Set([
    "info", "support", "sales", "admin", "administrator", "help", "contact", "billing",
    "accounts", "accounting", "hr", "jobs", "careers", "marketing", "press", "media",
    "noreply", "no-reply", "donotreply", "postmaster", "webmaster", "abuse", "security",
    "hello", "team", "office", "enquiries", "inquiries", "service", "customerservice",
]);
const FREE_PROVIDERS = new Set([
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "outlook.com", "hotmail.com",
    "live.com", "msn.com", "aol.com", "icloud.com", "me.com", "mac.com", "proton.me",
    "protonmail.com", "gmx.com", "gmx.de", "yandex.com", "zoho.com", "mail.com", "qq.com",
    "163.com", "126.com", "web.de", "fastmail.com", "tutanota.com", "hey.com",
]);
const LOCAL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
const DOMAIN_RE = /^(?=.{1,253}$)([A-Za-z0-9](-*[A-Za-z0-9])*\.)+[A-Za-z]{2,}$/;
async function checkOne(email) {
    const trimmed = email.trim();
    const at = trimmed.lastIndexOf("@");
    const localpart = at > 0 ? trimmed.slice(0, at) : "";
    const domain = (at > 0 ? trimmed.slice(at + 1) : "").toLowerCase();
    const base = {
        email: trimmed,
        format: at > 0 && localpart && LOCAL_RE.test(localpart) && !localpart.startsWith(".") &&
            !localpart.endsWith(".") && !localpart.includes("..") && DOMAIN_RE.test(domain)
            ? "valid"
            : "invalid",
        domain,
        localpart,
        mx_hosts: [],
        disposable: DISPOSABLE.has(domain),
        free_provider: FREE_PROVIDERS.has(domain),
        role_account: ROLE_LOCALPARTS.has(localpart.toLowerCase()),
        plus_tag: localpart.includes("+") ? localpart.slice(localpart.indexOf("+") + 1) : null,
        deliverable: "unknown",
    };
    if (base.format === "invalid") {
        base.deliverable = "not checked";
        return base;
    }
    try {
        const hosts = await dns.resolveMx(domain);
        base.mx_hosts = hosts.sort((a, b) => a.priority - b.priority).map((h) => h.exchange);
        base.deliverable = base.mx_hosts.length > 0 ? "likely" : "no MX record";
    }
    catch {
        base.deliverable = "no MX record or domain not found";
    }
    return base;
}
function fmt(r) {
    const flags = [
        r.format === "invalid" ? "INVALID FORMAT" : null,
        r.disposable ? "DISPOSABLE" : null,
        r.role_account ? "ROLE ACCOUNT" : null,
        r.free_provider ? "free provider" : null,
    ].filter(Boolean);
    return (`${r.email}\n` +
        `  Format: ${r.format}\n` +
        `  Domain: ${r.domain}\n` +
        `  MX: ${r.mx_hosts.slice(0, 5).join(", ") || "none"}\n` +
        `  Deliverable: ${r.deliverable}${flags.length ? ` | ${flags.join(" | ")}` : ""}` +
        (r.plus_tag ? `\n  Plus tag: +${r.plus_tag}` : ""));
}
export async function validateEmail(args) {
    const email = (args.email ?? "").trim();
    if (!email)
        throw new EmailError("Provide an email address");
    return fmt(await checkOne(email));
}
export async function validateBatch(args) {
    const list = (args.emails ?? "").split(/[,\s]+/).map((e) => e.trim()).filter(Boolean);
    if (list.length === 0)
        throw new EmailError("Provide at least one email address");
    const results = await Promise.all(list.slice(0, 25).map(checkOne));
    const valid = results.filter((r) => r.format === "valid").length;
    const risky = results.filter((r) => r.disposable || r.role_account).length;
    return (`${results.length} address(es): ${valid} well-formed, ${results.length - valid} malformed, ${risky} flagged (disposable or role).\n\n` +
        results.map(fmt).join("\n\n"));
}
/** Domain-level check: MX plus A record and disposable status, no address needed. */
export async function checkDomain(args) {
    const domain = (args.domain ?? "").trim().toLowerCase().replace(/^@/, "");
    if (!domain)
        throw new EmailError("Provide a domain, e.g. 'example.com'");
    if (!DOMAIN_RE.test(domain))
        throw new EmailError(`"${domain}" is not a valid domain name`);
    const [mx, a] = await Promise.all([
        dns.resolveMx(domain).catch(() => []),
        dns.resolve4(domain).catch(() => []),
    ]);
    const sorted = mx.sort((x, y) => x.priority - y.priority);
    const lines = [
        `Domain: ${domain}`,
        `Accepts mail: ${sorted.length > 0 ? "yes" : "NO — no MX record, addresses here will bounce"}`,
        `MX records (${sorted.length}):`,
        ...(sorted.length ? sorted.map((m) => `  ${m.priority} ${m.exchange}`) : ["  none"]),
        `A records (${a.length}): ${a.slice(0, 4).join(", ") || "none"}`,
        `Disposable provider: ${DISPOSABLE.has(domain) ? "YES" : "no"}`,
        `Free mail provider: ${FREE_PROVIDERS.has(domain) ? "yes" : "no"}`,
    ];
    return lines.join("\n");
}
/** Canonical form of an address, plus the variants providers will also accept. */
export function normalizeEmail(args) {
    const raw = (args.email ?? "").trim();
    if (!raw)
        throw new EmailError("Provide an email address");
    const at = raw.lastIndexOf("@");
    if (at <= 0)
        throw new EmailError(`"${raw}" has no @, so it cannot be normalised`);
    const local = raw.slice(0, at);
    const domain = raw.slice(at + 1).toLowerCase();
    const withoutTag = local.split("+")[0];
    // Gmail and Googlemail ignore dots in the local part.
    const isGoogle = domain === "gmail.com" || domain === "googlemail.com";
    const canonicalLocal = isGoogle ? withoutTag.replace(/\./g, "") : withoutTag;
    const canonical = `${canonicalLocal}@${domain === "googlemail.com" ? "gmail.com" : domain}`;
    const variants = new Set([raw.toLowerCase(), `${local.toLowerCase()}@${domain}`, canonical]);
    return [
        `Input:     ${raw}`,
        `Normalised: ${canonical}`,
        `Local part: ${local}${args.email?.includes("+") ? " (has a plus tag)" : ""}`,
        `Domain:     ${domain}`,
        "",
        "Equivalent forms:",
        ...[...variants].map((v) => `  ${v}`),
    ].join("\n");
}
/** Pull every email address out of a blob of text. */
export function extractEmails(args) {
    const body = args.text ?? "";
    if (!body.trim())
        throw new EmailError("Provide some text to scan");
    const found = body.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
    const unique = [...new Set(found.map((e) => e.replace(/[.,;:]+$/, "")))];
    if (!unique.length)
        return "No email addresses found in that text.";
    const junk = unique.filter((e) => DISPOSABLE.has(e.split("@")[1]?.toLowerCase() ?? ""));
    return (`Found ${unique.length} unique address(es):\n` +
        unique.map((e) => `  ${e}`).join("\n") +
        (junk.length ? `\n\nFlagged as disposable (${junk.length}): ${junk.join(", ")}` : ""));
}
/** The disposable-domain list this server checks against. */
export function disposableDomains(args) {
    const limit = Math.min(Math.max(Number(args.limit) || 40, 1), DISPOSABLE.size);
    const all = [...DISPOSABLE].sort();
    return (`${DISPOSABLE.size} known disposable domains, showing ${Math.min(limit, all.length)}:\n` +
        all.slice(0, limit).map((d, i) => `${i + 1}. ${d}`).join("\n"));
}
// ---- batch-4 tools: auth records, MX health, typo help (2026-09-27) ----
const DKIM_SELECTORS = ["default", "google", "selector1", "selector2", "k1", "mail", "dkim"];
const txtOf = (name) => dns.resolveTxt(name).then((rows) => rows.map((parts) => parts.join(""))).catch(() => []);
/** The full anti-spoofing picture: MX hosts, SPF, DMARC policy and DKIM selectors. */
export async function emailAuthRecords(args) {
    const domain = (args.domain ?? "").trim().toLowerCase().replace(/^@/, "");
    if (!domain)
        throw new EmailError("Provide a domain, e.g. 'example.com'");
    if (!DOMAIN_RE.test(domain))
        throw new EmailError(`"${domain}" is not a valid domain name`);
    const [root, dmarc, mx] = await Promise.all([
        txtOf(domain),
        txtOf(`_dmarc.${domain}`),
        dns.resolveMx(domain).catch(() => []),
    ]);
    const spf = root.find((t) => t.toLowerCase().startsWith("v=spf1"));
    const dmarcRecord = dmarc.find((t) => t.toLowerCase().startsWith("v=dmarc1"));
    const dkim = [];
    for (const selector of DKIM_SELECTORS) {
        const rows = await txtOf(`${selector}._domainkey.${domain}`);
        if (rows.some((r) => /v=dkim1|k=rsa|p=/i.test(r)))
            dkim.push(selector);
    }
    const policy = dmarcRecord?.match(/p=(none|quarantine|reject)/i)?.[1] ?? null;
    const allRule = spf?.match(/([-~?])all/)?.[1] ?? null;
    const allNote = allRule === "-" ? " - hard fail, unauthorised senders are rejected" :
        allRule === "~" ? " - soft fail, unauthorised senders are marked" :
            allRule === "?" ? " - neutral, unauthorised senders are allowed" : "";
    return [
        `Mail authentication for ${domain}`,
        `MX hosts (${mx.length}): ${mx.length ? mx.sort((a, b) => a.priority - b.priority).map((m) => m.exchange).join(", ") : "none - the domain cannot receive mail"}`,
        `SPF: ${spf ?? "missing"}${allRule ? `  (all rule "${allRule}all"${allNote})` : ""}`,
        `DMARC: ${dmarcRecord ?? "missing"}${policy ? `  (policy ${policy.toUpperCase()})` : ""}`,
        `DKIM selectors found: ${dkim.length ? dkim.join(", ") : `none at ${DKIM_SELECTORS.join(", ")}`}`,
        "",
        spf && dmarcRecord && policy && policy !== "none" && dkim.length
            ? "SPF, DMARC and DKIM are all in place."
            : "Gaps above are what let spoofed mail through; fix them at the DNS host.",
    ].join("\n");
}
/** Every MX host, whether it resolves, and its reverse DNS. */
export async function mxHealth(args) {
    const domain = (args.domain ?? "").trim().toLowerCase().replace(/^@/, "");
    if (!domain)
        throw new EmailError("Provide a domain, e.g. 'example.com'");
    if (!DOMAIN_RE.test(domain))
        throw new EmailError(`"${domain}" is not a valid domain name`);
    const mx = await dns.resolveMx(domain).catch(() => []);
    if (!mx.length)
        return `${domain} has no MX record, so it cannot receive mail. Add one at the DNS host.`;
    const rows = [];
    let unreachable = 0;
    for (const record of mx.sort((a, b) => a.priority - b.priority).slice(0, 10)) {
        const host = record.exchange.replace(/\.$/, "");
        const [addresses, ptr] = await Promise.all([
            dns.resolve4(host).catch(() => []),
            dns.reverse(host).catch(() => []),
        ]);
        if (!addresses.length)
            unreachable += 1;
        rows.push(`${String(record.priority).padStart(3)} ${host} | ${addresses.length ? `A ${addresses.slice(0, 2).join(", ")}` : "NO A record - mail routed here will fail"}${ptr.length ? ` | PTR ${ptr[0]}` : ""}`);
    }
    return [
        `MX health for ${domain}: ${mx.length} host(s), ${unreachable ? `${unreachable} without an A record` : "all resolve"}`,
        "",
        ...rows,
        "",
        unreachable ? "Fix the hosts that do not resolve before mail starts bouncing." : "Every MX host resolves, so mail has a route in.",
    ].join("\n");
}
const KNOWN_DOMAINS = [...new Set([...FREE_PROVIDERS, "zoho.com", "yandex.com", "gmx.de", "web.de", "fastmail.com", "hey.com", "qq.com", "163.com"])];
const editDistance = (a, b) => {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 0; j <= b.length; j += 1)
        dp[0][j] = j;
    for (let i = 1; i <= a.length; i += 1) {
        for (let j = 1; j <= b.length; j += 1) {
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
    }
    return dp[a.length][b.length];
};
/** Suggests the provider a mistyped domain was probably meant to be. Nothing is sent anywhere. */
export function correctTypo(args) {
    const raw = (args.email ?? "").trim();
    if (!raw)
        throw new EmailError("Provide an email address to check");
    const at = raw.lastIndexOf("@");
    if (at <= 0)
        throw new EmailError(`"${raw}" has no @, so there is nothing to correct`);
    const local = raw.slice(0, at);
    const domain = raw.slice(at + 1).toLowerCase();
    if (KNOWN_DOMAINS.includes(domain)) {
        return `${raw} uses ${domain}, a known mail provider - no correction suggested.`;
    }
    const best = KNOWN_DOMAINS
        .map((candidate) => ({ candidate, distance: editDistance(domain, candidate) }))
        .sort((a, b) => a.distance - b.distance)[0];
    if (!best || best.distance > 2) {
        return `No close match for the domain "${domain}" - it may be a real domain. Run check_domain to test whether it accepts mail.`;
    }
    return [
        `Possible typo in "${domain}"`,
        `Closest known provider: ${best.candidate} (edit distance ${best.distance})`,
        `Suggested address: ${local}@${best.candidate}`,
        "",
        "Suggestion only - the domain was not contacted.",
    ].join("\n");
}
const EDGE_LOCALPARTS = new Set(["postmaster", "abuse", "hostmaster", "webmaster", "noc", "security", "hostmaster", "postmaster"]);
const GIT_HOSTING = new Set(["github.com", "gitlab.com", "bitbucket.org", "codeberg.org", "gitea.com", "sourcehut.org"]);
/** Purely local: derives the plus-tag and dot-stripped forms of an address so alias-based duplicates can be spotted. */
export async function aliasVariants(args) {
    const email = String(args.email ?? "").trim().toLowerCase();
    if (!email)
        throw new EmailError("Provide an email address, e.g. 'someone+news@example.com'");
    const at = email.lastIndexOf("@");
    if (at <= 0 || at === email.length - 1)
        throw new EmailError(`"${email}" is not an address`);
    const localRaw = email.slice(0, at);
    const domain = email.slice(at + 1);
    if (!DOMAIN_RE.test(domain))
        throw new EmailError(`"${domain}" is not a valid domain name`);
    if (!LOCAL_RE.test(localRaw))
        throw new EmailError(`"${localRaw}" contains characters that are not valid in a local part`);
    const max = Math.min(Math.max(Math.floor(args.max ?? 40) || 40, 1), 200);
    const set = new Set();
    const add = (s) => { if (s && s !== email && s.length <= 64)
        set.add(s); };
    const plusIdx = localRaw.indexOf("+");
    const base = plusIdx === -1 ? localRaw : localRaw.slice(0, plusIdx);
    const tag = plusIdx === -1 ? null : localRaw.slice(plusIdx + 1);
    if (tag) {
        add(`${base}@${domain}`);
        // The tag is a routing label, so every plausible reading of it is a
        // different mailbox that reaches the same person.
        for (const part of tag.split(/[._-]+/).filter(Boolean).slice(0, 6)) {
            add(`${base}+${part}@${domain}`);
            add(`${base}+${part.toUpperCase()}@${domain}`);
        }
    }
    // Gmail and a handful of others ignore dots in the local part, so these all
    // resolve to the same mailbox. Almost no other provider does this.
    const dotInsensitive = new Set(["gmail.com", "googlemail.com"]);
    if (dotInsensitive.has(domain) && base.includes(".")) {
        add(`${base.replace(/\./g, "")}@${domain}`);
        if (base.replace(/\./g, "").length > 0)
            add(`${base.split(".")[0]}@${domain}`);
    }
    if (domain === "googlemail.com")
        add(`${base}@gmail.com`);
    if (domain === "gmail.com")
        add(`${base}@googlemail.com`);
    // Fastmail-style plus addressing is a documented feature, not a provider quirk.
    if (["fastmail.com", "fastmail.fm", "migumail.com", "runbox.com", "hushmail.com", "tutanota.com", "zoho.com", "yandex.com", "hey.com", "icloud.com", "outlook.com", "proton.me", "protonmail.com", "fastmail.ch"].includes(domain)) {
        add(`${base}+${tag ?? "unused"}@${domain}`);
    }
    const out = [...set].slice(0, max);
    const isRole = EDGE_LOCALPARTS.has(base) || ROLE_LOCALPARTS.has(base);
    const isFree = FREE_PROVIDERS.has(domain);
    const isHosting = GIT_HOSTING.has(domain);
    const lines = [
        `Alias analysis for ${email}`,
        `canonical-looking local part: ${base}${tag !== null ? `  (plus tag "${tag}" stripped)` : ""}`,
        `domain: ${domain}  ${isFree ? "- a free consumer provider, where addresses are cheap to create in bulk" : ""}${isHosting ? "- a code-hosting domain, often a forge login rather than a person" : ""}`,
        "",
    ];
    if (isRole) {
        lines.push(`"${base}" is a role address, not a person. Role mailboxes are accepted by mail servers and always accept an SMTP probe, so an SMTP existence check will pass for one and it should not be read as a deliverable individual.`, "");
    }
    if (isFree) {
        lines.push("Free providers hand out addresses freely, so a valid address from one is weak evidence that anyone chose it deliberately.", "");
    }
    if (isHosting) {
        lines.push("On a code-hosting domain the address is usually a forge account, so a signup there is not a personal mailbox and often is not intended to receive mail.", "");
    }
    lines.push(`${out.length} variant(s) that reach the same person or the same inbox:`);
    for (const v of out.slice(0, 20))
        lines.push(`  ${v}`);
    if (out.length > 20)
        lines.push(`  ...and ${out.length - 20} more`);
    if (!out.length)
        lines.push("  none: there is no plus tag, no dot-insensitive provider and no alias feature to expand");
    lines.push("", "Whether these are the same person cannot be decided from the address. Only a provider that documents alias collapsing, such as Gmail ignoring dots or Fastmail accepting plus tags, will treat them as identical; everywhere else plus is a real, separate mailbox.");
    return lines.join("\n");
}
/** One SMTP conversation: does this server accept this recipient? */
function smtpProbe(host, mailFrom, rcptTo, timeoutMs) {
    return new Promise((resolve) => {
        const socket = createConnection({ host, port: 25 });
        const transcript = [];
        let buffer = "";
        let stage = "greeting";
        let settled = false;
        const finish = (result) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            socket.destroy();
            resolve({ host, transcript, ...result });
        };
        const timer = setTimeout(() => finish({
            status: "timeout",
            detail: `no reply within ${timeoutMs} ms — the port is probably filtered rather than the mailbox missing`,
        }), timeoutMs);
        socket.setEncoding("utf8");
        socket.on("error", (err) => finish({
            status: "unreachable",
            detail: `${err.code ?? "socket error"}: ${err.message}. This says nothing about whether the address exists.`,
        }));
        socket.on("connect", () => { /* the server greets first */ });
        socket.on("data", (chunk) => {
            buffer += chunk;
            let index;
            while ((index = buffer.indexOf("\r\n")) >= 0) {
                const line = buffer.slice(0, index);
                buffer = buffer.slice(index + 2);
                transcript.push(line);
                // A hyphen after the code means more lines follow this reply.
                if (line.length > 3 && line[3] === "-")
                    continue;
                const code = Number(line.slice(0, 3));
                if (!Number.isFinite(code))
                    continue;
                if (stage === "greeting") {
                    if (code === 421) {
                        finish({ status: "unreachable", detail: `server refused service: ${line.slice(4)}` });
                        return;
                    }
                    if (code >= 500) {
                        stage = "helo";
                        socket.write(`HELO probe.local\r\n`);
                        return;
                    }
                    stage = "ehlo";
                    socket.write(`EHLO probe.local\r\n`);
                    return;
                }
                if (stage === "ehlo" || stage === "helo") {
                    if (code >= 500 && stage === "ehlo") {
                        stage = "helo";
                        socket.write(`HELO probe.local\r\n`);
                        return;
                    }
                    stage = "mail";
                    socket.write(`MAIL FROM:<${mailFrom}>\r\n`);
                    return;
                }
                if (stage === "mail") {
                    stage = "rcpt";
                    socket.write(`RCPT TO:<${rcptTo}>\r\n`);
                    return;
                }
                if (stage === "rcpt") {
                    socket.write("QUIT\r\n");
                    if (code === 250 || code === 251) {
                        finish({ status: "exists", code, detail: line.slice(4) });
                        return;
                    }
                    if (code >= 500) {
                        finish({ status: "no-such-user", code, detail: line.slice(4) });
                        return;
                    }
                    finish({ status: "deferred", code, detail: `${line.slice(4)} — a 4xx reply is temporary, so the address is neither confirmed nor denied` });
                }
            }
        });
    });
}
/** Ask the receiving mail server whether one mailbox exists, then test for a catch-all domain. */
export async function smtpMailboxCheck(args) {
    const email = (args.email ?? "").trim();
    const at = email.lastIndexOf("@");
    if (at <= 0 || at === email.length - 1)
        throw new EmailError("Provide an address like someone@example.com");
    const domain = email.slice(at + 1).toLowerCase();
    if (!DOMAIN_RE.test(domain))
        throw new EmailError(`"${domain}" is not a valid domain name`);
    const timeoutMs = Math.min(Math.max(Math.floor(Number(args.timeout_ms ?? 8000)) || 8000, 2000), 20000);
    const mx = await dns.resolveMx(domain).catch(() => []);
    if (!mx.length) {
        return `${domain} publishes no MX record, so no server will accept mail for ${email}. That is a fact about the domain, not the mailbox.`;
    }
    const hosts = mx.sort((a, b) => a.priority - b.priority).slice(0, 3).map((m) => m.exchange.replace(/\.$/, ""));
    const results = [];
    let answer = null;
    for (const host of hosts) {
        const probe = await smtpProbe(host, `postmaster@${domain}`, email, timeoutMs);
        results.push(probe);
        if (["exists", "no-such-user", "deferred"].includes(probe.status)) {
            answer = probe;
            break;
        }
    }
    const lines = [`SMTP mailbox check for ${email}:`, `MX hosts tried (in priority order): ${hosts.join(", ")}`, ""];
    for (const row of results) {
        const label = row.code ? `${row.code}` : row.status;
        lines.push(`  ${row.host.padEnd(28)} ${label} ${row.detail ?? ""}`);
    }
    lines.push("");
    if (!answer) {
        const codes = [...new Set(results.map((r) => String(r.detail ?? "").split(":")[0]))];
        lines.push("Result: INCONCLUSIVE — no MX host completed an SMTP conversation, so the address was not tested.",
            `Why: ${results.length} host(s) failed before the RCPT TO reply (${codes.join(", ")}). Outbound port 25 is blocked by most home and office networks and by every major cloud provider, so this is the common outcome from a laptop. An unreachable server is not an invalid address.`);
        lines.push("", "Run this from a host with outbound port 25 open, or rely on an MX record check for delivery risk and a signup confirmation mail for existence.");
        return lines.join("\n");
    }
    let catchAll = null;
    if (args.check_catch_all !== false && answer.status === "exists") {
        const randomLocal = `no-such-mailbox-${Math.random().toString(36).slice(2, 10)}`;
        catchAll = await smtpProbe(answer.host, `postmaster@${domain}`, `${randomLocal}@${domain}`, timeoutMs);
        lines.push(`Catch-all probe (${randomLocal}@${domain}): ${catchAll.status === "exists" ? "ACCEPTED, so this domain accepts every address" : `${catchAll.code ?? catchAll.status} ${catchAll.detail ?? ""}`}`);
        lines.push("");
    }
    if (catchAll && catchAll.status === "exists") {
        lines.push(`Result: CATCH-ALL DOMAIN — ${answer.host} accepted a random address, so it accepts ${email} without knowing whether the mailbox exists. A 250 here is not proof of anything.`);
    }
    else if (answer.status === "exists") {
        lines.push(`Result: MAILBOX ACCEPTED — ${answer.host} replied ${answer.code} to RCPT TO for this exact address, and rejected a random address, so the mailbox exists.`);
    }
    else if (answer.status === "no-such-user") {
        lines.push(`Result: NO SUCH USER — ${answer.host} replied ${answer.code}: ${answer.detail}. That is a definitive answer from the receiving server.`);
    }
    else if (answer.status === "deferred") {
        lines.push(`Result: DEFERRED — ${answer.host} replied ${answer.code}: ${answer.detail}. Greylisting looks exactly like this, so retry rather than treating it as a rejection.`);
    }
    lines.push("", "An SMTP reply is the receiving server's current policy, not a permanent fact: greylisting, catch-all and reputation filters all change the answer.");
    return lines.join("\n");
}
const SPF_MECHANISM = /^([+\-~?]?)([a-z0-9]+)(?::([^/\s]+))?(?:\/(\d+))?$/i;
function parseIp4(text) {
    const parts = String(text ?? "").trim().split(".");
    if (parts.length !== 4)
        return null;
    let value = 0;
    for (const part of parts) {
        if (!/^\d{1,3}$/.test(part))
            return null;
        const n = Number(part);
        if (n > 255)
            return null;
        value = value * 256 + n;
    }
    return value;
}
function ip4InCidr(ip, base, bits) {
    const a = parseIp4(ip);
    const b = parseIp4(base);
    if (a === null || b === null)
        return null;
    const width = bits === undefined ? 32 : bits;
    if (!Number.isInteger(width) || width < 0 || width > 32)
        return null;
    if (width === 0)
        return true;
    const mask = (0xffffffff << (32 - width)) >>> 0;
    return ((a & mask) >>> 0) === ((b & mask) >>> 0);
}
function parseIp6(text) {
    const value = String(text ?? "").trim();
    if (!value.includes(":") || value.split("::").length > 2)
        return null;
    const [headRaw, tailRaw = ""] = value.split("::");
    const head = headRaw ? headRaw.split(":") : [];
    const tail = tailRaw ? tailRaw.split(":") : [];
    let groups = head;
    if (value.includes("::")) {
        const missing = 8 - head.length - tail.length;
        if (missing < 0)
            return null;
        groups = [...head, ...Array(missing).fill("0"), ...tail];
    }
    if (groups.length !== 8)
        return null;
    let out = 0n;
    for (const group of groups) {
        if (!/^[0-9a-fA-F]{1,4}$/.test(group))
            return null;
        out = (out << 16n) | BigInt(parseInt(group, 16));
    }
    return out;
}
function ip6InCidr(ip, base, bits) {
    const a = parseIp6(ip);
    const b = parseIp6(base);
    if (a === null || b === null)
        return null;
    const width = bits === undefined ? 128 : bits;
    if (!Number.isInteger(width) || width < 0 || width > 128)
        return null;
    if (width === 0)
        return true;
    const shift = BigInt(128 - width);
    return (a >> shift) === (b >> shift);
}
const SPF_MAX_LOOKUPS = 10;
const SPF_MAX_DEPTH = 10;
/** Reads the SPF record for a domain, or null when it publishes none. */
async function spfRecordFor(domain) {
    const rows = await txtOf(domain);
    const records = rows.filter((row) => row.toLowerCase().startsWith("v=spf1"));
    if (records.length > 1)
        return { record: records[0], error: `${domain} publishes ${records.length} SPF records; RFC 7208 allows exactly one, so the answer is permerror` };
    return records.length ? { record: records[0] } : null;
}
async function addressesOf(host, family) {
    const sub = host.replace(/^\*+\./, "");
    if (family === 4)
        return dns.resolve4(sub).catch(() => []);
    return dns.resolve6(sub).catch(() => []);
}
/** Evaluates one domain's SPF record for an address. Returns the RFC 7208 result. */
async function evaluateSpf(domain, ip, family, state) {
    const found = await spfRecordFor(domain);
    if (!found)
        return { result: "none", detail: `no SPF record at ${domain}` };
    if (found.error)
        return { result: "permerror", detail: found.error };
    state.chain.push(`${domain}: ${found.record}`);
    const tokens = found.record.trim().split(/\s+/).slice(1);
    let redirect = null;
    for (const token of tokens) {
        if (!token || /^exp=/i.test(token))
            continue;
        const redirectMatch = /^redirect=(.*)$/i.exec(token);
        if (redirectMatch) {
            redirect = redirectMatch[1];
            continue;
        }
        if (/^[a-z-]+=/i.test(token)) {
            state.chain.push(`  ${token}: unknown modifier, ignored`);
            continue;
        }
        const mech = SPF_MECHANISM.exec(token);
        if (!mech) {
            state.chain.push(`  ${token}: not a valid mechanism, so permerror`);
            return { result: "permerror", detail: `unparseable term "${token}" in ${domain}'s record` };
        }
        const qualifier = mech[1] || "+";
        const name = mech[2].toLowerCase();
        const arg = mech[3] ?? null;
        const bits = mech[4] !== undefined ? Number(mech[4]) : undefined;
        const target = arg ?? domain;
        let matched = false;
        let note = token;
        if (name === "all") {
            matched = true;
        }
        else if (name === "ip4") {
            if (family === 4) {
                const hit = ip4InCidr(ip, target, bits);
                if (hit === null) {
                    state.chain.push(`  ${token}: invalid ip4 network, so permerror`);
                    return { result: "permerror", detail: `invalid ip4 form "${token}"` };
                }
                matched = hit;
            }
        }
        else if (name === "ip6") {
            if (family === 6) {
                const hit = ip6InCidr(ip, target, bits);
                if (hit === null) {
                    state.chain.push(`  ${token}: invalid ip6 network, so permerror`);
                    return { result: "permerror", detail: `invalid ip6 form "${token}"` };
                }
                matched = hit;
            }
        }
        else if (name === "a" || name === "mx" || name === "include" || name === "exists" || name === "ptr") {
            state.lookups += 1;
            if (state.lookups > SPF_MAX_LOOKUPS)
                return { result: "permerror", detail: `more than ${SPF_MAX_LOOKUPS} DNS lookups, which RFC 7208 forbids` };
            if (name === "include") {
                if (state.depth >= SPF_MAX_DEPTH)
                    return { result: "permerror", detail: "include nested too deeply" };
                state.depth += 1;
                const child = await evaluateSpf(target, ip, family, state);
                state.depth -= 1;
                if (child.result === "pass")
                    matched = true;
                else if (child.result === "permerror" || child.result === "temperror")
                    return child;
                note = `include:${target} (${child.result})`;
            }
            else if (name === "exists") {
                const hosts = await addressesOf(target, family);
                matched = hosts.length > 0;
            }
            else if (name === "ptr") {
                const names = family === 4 ? await dns.reverse(ip).catch(() => []) : [];
                matched = names.some((host) => host.toLowerCase().endsWith(`.${target}`));
            }
            else {
                const hosts = name === "mx"
                    ? (await dns.resolveMx(target).catch(() => [])).map((row) => row.exchange.replace(/\.$/, ""))
                    : [target];
                for (const host of hosts) {
                    const addresses = await addressesOf(host, family);
                    const hit = addresses.some((address) => (family === 4
                        ? ip4InCidr(ip, address, bits)
                        : ip6InCidr(ip, address, bits)) === true);
                    if (hit) {
                        matched = true;
                        break;
                    }
                }
            }
        }
        else {
            state.chain.push(`  ${token}: unknown mechanism, ignored`);
            continue;
        }
        state.chain.push(`  ${token} ${matched ? "matches" : "does not match"}${qualifier === "+" && matched ? " -> pass" : matched ? ` -> ${qualifier === "-" ? "fail" : qualifier === "~" ? "softfail" : "neutral"}` : ""}`);
        if (!matched)
            continue;
        const result = qualifier === "+" ? "pass" : qualifier === "-" ? "fail" : qualifier === "~" ? "softfail" : "neutral";
        return { result, detail: `${note} matched with qualifier "${qualifier}"` };
    }
    if (redirect) {
        state.lookups += 1;
        if (state.lookups > SPF_MAX_LOOKUPS)
            return { result: "permerror", detail: `redirect pushed past ${SPF_MAX_LOOKUPS} DNS lookups` };
        const child = await evaluateSpf(redirect, ip, family, state);
        if (child.result === "none")
            return { result: "permerror", detail: `redirect to ${redirect}, which publishes no SPF record` };
        return child;
    }
    return { result: "neutral", detail: "no mechanism matched and there is no redirect" };
}
/** Runs RFC 7208 SPF evaluation of a sender IP against a domain's real record. */
export async function spfEvaluate(args) {
    const domain = (args.domain ?? "").trim().toLowerCase().replace(/^@/, "");
    const ip = (args.ip ?? "").trim();
    if (!domain)
        throw new EmailError("Provide a domain, e.g. example.com");
    if (!DOMAIN_RE.test(domain))
        throw new EmailError(`"${domain}" is not a valid domain name`);
    const family = ip.includes(":") ? 6 : 4;
    const parsed = family === 4 ? parseIp4(ip) : parseIp6(ip);
    if (parsed === null)
        throw new EmailError(`"${ip}" is not a valid IPv4 or IPv6 address`);
    const state = { lookups: 0, depth: 0, chain: [] };
    const { result, detail } = await evaluateSpf(domain, ip, family, state);
    const meaning = {
        pass: "The sending IP is authorised by the domain's SPF record.",
        fail: "The sending IP is explicitly NOT authorised. Receivers should reject or quarantine the message.",
        softfail: "The IP is not authorised, but the domain asks receivers to mark rather than reject the message.",
        neutral: "The record makes no claim about this IP, which most receivers treat like a softfail.",
        none: "The domain publishes no SPF record at all, so SPF cannot authenticate anything it sends.",
        permerror: "The record is broken, so a compliant receiver must treat SPF as unavailable and fall back to DMARC.",
        temperror: "A DNS lookup failed temporarily, so the result is unknown and should be retried.",
    }[result] ?? "Unknown result.";
    const lines = [
        `SPF evaluation for ${ip} sending as ${domain}:`,
        `Result: ${result.toUpperCase()}`,
        `  ${meaning}`,
        `  ${detail}`,
        "",
        `DNS lookups used: ${state.lookups} of ${SPF_MAX_LOOKUPS} allowed`,
        "Chain of reasoning:",
        ...state.chain.map((line) => `  ${line}`),
    ];
    if (args.include_record !== false) {
        const found = await spfRecordFor(domain);
        lines.push("", `Record: ${found?.record ?? "none published"}`);
    }
    lines.push("", "Evaluated locally against the live DNS records; nothing was sent to the domain.");
    return lines.join("\n");
}
