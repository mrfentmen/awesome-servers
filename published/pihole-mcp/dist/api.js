/**
 * Pi-hole API client (v6 REST). Points at any instance via PIHOLE_URL
 * (default http://localhost:80). Auth with PIHOLE_PASSWORD (web password)
 * or PIHOLE_APP_PASSWORD (Settings > Web interface > App password).
 * Docs: https://docs.pi-hole.net/api/
 */
const BASE = (process.env.PIHOLE_URL ?? "http://localhost:80").replace(/\/+$/, "");
export class PiholeError extends Error {
}
let sid = null;
async function session() {
    if (sid)
        return sid;
    const password = process.env.PIHOLE_PASSWORD ?? process.env.PIHOLE_APP_PASSWORD;
    if (!password)
        throw new PiholeError("Set PIHOLE_PASSWORD (or PIHOLE_APP_PASSWORD).");
    const res = await fetch(`${BASE}/api/auth`, {
        method: "POST",
        headers: { "User-Agent": "pihole-mcp/1.0", "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new PiholeError(`Pi-hole login failed (${res.status}). Check URL and password.`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json());
    const id = data?.session?.sid;
    if (!id)
        throw new PiholeError("Pi-hole login returned no session.");
    sid = id;
    return sid;
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "pihole-mcp/1.0", Accept: "application/json", sid: await session() },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403) {
        sid = null;
        throw new PiholeError("Pi-hole refused (401/403). Check password.");
    }
    if (res.status === 404)
        throw new PiholeError("Not found. Check PIHOLE_URL (needs Pi-hole v6+).");
    if (!res.ok)
        throw new PiholeError(`Pi-hole error ${res.status}`);
    return (await res.json());
}
async function postJson(path, body = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "User-Agent": "pihole-mcp/1.0", Accept: "application/json", "Content-Type": "application/json", sid: await session() },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403) {
        sid = null;
        throw new PiholeError("Pi-hole refused (401/403). Check password.");
    }
    if (!res.ok)
        throw new PiholeError(`Pi-hole error ${res.status}`);
    return (await res.json());
}
export async function blockingStatus() {
    const d = await getJson("/api/dns/blocking");
    return `Blocking is ${d.blocking === true ? "ENABLED" : d.blocking === false ? "DISABLED" : String(d.blocking ?? "?")}${d.timer ? ` (timer: ${d.timer}s)` : ""}`;
}
export async function setBlocking(enabled, seconds = 0) {
    await postJson("/api/dns/blocking", { blocking: enabled, timer: seconds > 0 ? seconds : null });
    return seconds > 0
        ? `Blocking ${enabled ? "enabled" : "disabled"} for ${seconds}s.`
        : `Blocking ${enabled ? "enabled" : "disabled"}.`;
}
export async function summaryStats() {
    const d = await getJson("/api/stats/summary");
    const q = (d.queries ?? {});
    const lines = [
        `DNS queries (24h): ${(q.total ?? "?").toLocaleString?.() ?? q.total ?? "?"}`,
        `Blocked: ${(q.blocked ?? "?").toLocaleString?.() ?? q.blocked ?? "?"}${q.percent_blocked !== undefined ? ` (${q.percent_blocked}%)` : ""}`,
        `Blocklist size: ${(d.gravity?.domains_being_blocked ?? "?").toLocaleString?.() ?? d.gravity?.domains_being_blocked ?? "?"}`,
        `Clients: ${d.clients?.active ?? "?"}`,
    ];
    return lines.join("\n");
}
// ---- muxB tools:
const PHOLE_FORUM = "https://discourse.pi-hole.net";
/** Split a pasted blocklist into parsed rules, skipping comments and blanks. */
function piholeParseRules(text) {
    const rules = [];
    let skipped = 0;
    for (const line of String(text ?? "").split(/\r?\n/).slice(0, 5000)) {
        const row = line.trim();
        if (!row || row.startsWith("#") || row.startsWith("!")) {
            skipped++;
            continue;
        }
        if (row.startsWith("@@||")) {
            rules.push({ raw: row, kind: "exception", host: row.slice(4).split("^")[0].toLowerCase(), subdomains: true, modifiers: row.includes("$") ? row.slice(row.indexOf("$") + 1) : "" });
            continue;
        }
        if (row.startsWith("||")) {
            const body = row.slice(2);
            const host = body.split("^")[0].split("$")[0].toLowerCase();
            rules.push({ raw: row, kind: "adblock", host, subdomains: true, modifiers: body.includes("$") ? body.slice(body.indexOf("$") + 1) : "" });
            continue;
        }
        if (row.startsWith("/") && row.length > 2) {
            const end = row.lastIndexOf("/");
            const body = row.slice(1, end > 0 ? end : undefined);
            try {
                rules.push({ raw: row, kind: "regex", host: "", subdomains: false, modifiers: row.slice(end > 0 ? end + 1 : 0), pattern: new RegExp(body) });
            }
            catch (e) {
                rules.push({ raw: row, kind: "regex", host: "", subdomains: false, modifiers: "", invalid: e instanceof Error ? e.message : String(e) });
            }
            continue;
        }
        if (row.startsWith("address=/")) {
            const inner = row.slice("address=/".length).split("/")[0];
            const parts = inner.split("/");
            rules.push({ raw: row, kind: "only", host: (parts[1] ?? "").toLowerCase(), subdomains: true, modifiers: parts[2] ?? "" });
            continue;
        }
        const hosts = /^(\S+)\s+(\S+)(?:\s+#.*)?$/.exec(row);
        if (hosts && /^\d{1,3}(\.\d{1,3}){3}$|^::1$|^0:0:0:0:0:0:0:1$/.test(hosts[1])) {
            rules.push({ raw: row, kind: "hosts", host: hosts[2].toLowerCase(), subdomains: true, modifiers: "", address: hosts[1] });
            continue;
        }
        if (/^[a-z0-9_*-]+(\.[a-z0-9_*@-]+)+$/i.test(row)) {
            rules.push({ raw: row, kind: "domain", host: row.toLowerCase(), subdomains: true, modifiers: "" });
            continue;
        }
        rules.push({ raw: row, kind: "other", host: row.toLowerCase(), subdomains: false, modifiers: "" });
    }
    return { rules, skipped };
}
function piholeMatches(rule, host) {
    if (rule.invalid)
        return false;
    if (rule.kind === "regex")
        return rule.pattern ? rule.pattern.test(host) : false;
    if (!rule.host)
        return false;
    if (rule.host === host)
        return true;
    if (rule.subdomains) {
        if (rule.host.includes("*")) {
            const escaped = rule.host.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]*");
            return new RegExp(`(^|\\.)${escaped}$`).test(host);
        }
        return host.endsWith(`.${rule.host}`);
    }
    return false;
}
export async function communitySearch(args) {
    const query = (args.query ?? "").trim();
    if (!query)
        return "Give something to search the Pi-hole community forum for, e.g. 'DNSSEC not working'.";
    const limit = Math.min(Math.max(Number(args.limit ?? 5), 1), 10);
    const res = await fetch(`${PHOLE_FORUM}/search.json?q=${encodeURIComponent(query)}`, {
        headers: { "User-Agent": "pihole-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new PiholeError(`Pi-hole forum search failed (${res.status}).`);
    const data = (await res.json());
    const topics = Array.isArray(data.topics) ? data.topics : [];
    if (topics.length === 0)
        return `No Pi-hole community threads match "${query}".`;
    const blurbFor = (id) => {
        const post = (data.posts ?? []).find((p) => p.topic_id === id);
        return (post?.blurb ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
    };
    return [
        `${topics.length} thread(s) on the Pi-hole community forum match "${query}", showing ${Math.min(limit, topics.length)}.`,
        "",
        ...topics.slice(0, limit).map((t, i) => {
            const url = `https://discourse.pi-hole.net/t/${t.slug ?? "topic"}/${t.id ?? 0}`;
            const parts = [`${i + 1}. [${t.id ?? "?"}] ${t.title ?? "(untitled)"}`];
            if (t.posts_count)
                parts.push(`${t.posts_count} posts`);
            if (t.created_at)
                parts.push(`started ${String(t.created_at).slice(0, 10)}`);
            if (t.tags && t.tags.length)
                parts.push(`tags: ${t.tags.slice(0, 4).join(", ")}`);
            const blurb = blurbFor(t.id);
            return [`${parts.join(", ")}`, `   ${url}`, blurb ? `   "${blurb}"` : ""].filter(Boolean).join("\n");
        }),
    ].join("\n");
}
