export class UrlhausError extends Error {
    constructor(message) {
        super(message);
        this.name = "UrlhausError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://urlhaus-api.abuse.ch/v1";
function key() {
    const k = process.env.URLHAUS_AUTH_KEY;
    if (!k)
        throw new UrlhausError("Set URLHAUS_AUTH_KEY (free at abuse.ch).");
    return k;
}
async function post(path, body) {
    let res;
    try {
        res = await fetch(BASE + path, {
            signal: AbortSignal.timeout(30000),
            method: "POST",
            headers: { ...UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", "Auth-Key": key() },
            body: new URLSearchParams(body).toString(),
        });
    }
    catch (e) {
        throw new UrlhausError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new UrlhausError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return text;
}
export async function recentUrls(limit) {
    const n = clampNum(limit, 10, 1000);
    let res;
    try {
        res = await fetch(`${BASE}/urls/recent/limit/${n}/`, { signal: AbortSignal.timeout(30000), headers: { ...UA, "Auth-Key": key() } });
    }
    catch (e) {
        throw new UrlhausError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new UrlhausError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return text;
}
export function lookupUrl(url) {
    return post("/url/", { url });
}
export function lookupPayload(sha256) {
    return post("/payload/", { sha256_hash: sha256 });
}
export function searchTag(tag, limit) {
    return post("/tag/", { tag, limit: clampNum(limit, 10, 1000) });
}
function clampNum(v, d, m) {
    const n = Math.min(Number(v ?? d) || d, m);
    return String(n);
}
// ---- muxH tools:
// All four tools above query the URLhaus API, which has required an Auth-Key
// since 2025. These two use what abuse.ch still publishes without one: the public
// bulk dump, and the public DNS blocklist. Neither is a keyless version of an
// existing tool; they are different data and a different mechanism.
const UH_UA = "mcfentmen-urlhaus-mcp/1.1 (https://github.com/mcfentmen/urlhaus-mcp)";
const UH_CSV = "https://urlhaus.abuse.ch/downloads/csv_recent/";
const UH_DBL = "dbl.spamhaus.org";
import { resolve4 } from "node:dns/promises";
/** Split one CSV record, honouring the quoted fields abuse.ch writes. */
function uhFields(line) {
    const out = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (quoted) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i += 1;
            }
            else if (ch === '"')
                quoted = false;
            else
                current += ch;
        }
        else if (ch === '"')
            quoted = true;
        else if (ch === ",") {
            out.push(current);
            current = "";
        }
        else
            current += ch;
    }
    out.push(current);
    return out.map((v) => v.trim());
}
/**
 * abuse.ch's own published dump, read as a whole rather than queried one URL at a
 * time: how many entries it carries, when they were added, what kind of payload
 * they serve, which hosts keep coming back, and who is reporting them. This is the
 * shape of the last day's activity, which no single lookup can show.
 */
export async function feedDigest(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 40);
    const wantedThreat = String(args?.threat ?? "").trim().toLowerCase();
    let res;
    try {
        res = await fetch(UH_CSV, { headers: { "User-Agent": UH_UA, Accept: "text/csv, text/plain" }, signal: AbortSignal.timeout(45000) });
    }
    catch (e) {
        throw new UrlhausError(`Could not reach abuse.ch's public dump: ${e.message}`);
    }
    if (!res.ok)
        throw new UrlhausError(`abuse.ch's public dump returned HTTP ${res.status}.`);
    const body = await res.text();
    // Every preamble line starts with "#", including the column-name line, so the
    // header is found by shape rather than by position.
    const all = body.split("\n").filter((l) => l.trim());
    const headerLine = all.find((l) => /^#?\s*id\s*,\s*dateadded\s*,/i.test(l.trim()));
    if (!headerLine)
        throw new UrlhausError("The public dump's columns changed shape, so its rows cannot be read.");
    const lines = all.filter((l) => !l.startsWith("#"));
    if (lines.length < 2)
        throw new UrlhausError("The public dump arrived with no data rows in it.");
    const header = uhFields(headerLine.replace(/^#\s*/, "")).map((h) => h.toLowerCase());
    const at = (name) => header.indexOf(name);
    const col = {
        date: at("dateadded"),
        url: at("url"),
        status: at("url_status"),
        threat: at("threat"),
        tags: at("tags"),
        reporter: at("reporter"),
    };
    if (col.url < 0 || col.threat < 0) {
        throw new UrlhausError("The public dump's columns changed shape, so its rows cannot be read.");
    }
    const rows = [];
    const threatCounts = new Map();
    const statusCounts = new Map();
    const tagCounts = new Map();
    const reporterCounts = new Map();
    const hostCounts = new Map();
    const dates = [];
    let tagged = 0;
    for (const line of lines.slice(1)) {
        const f = uhFields(line);
        const url = f[col.url] ?? "";
        if (!url)
            continue;
        let host = "host not reported";
        try {
            host = new URL(url).hostname || host;
        }
        catch {
            // A row whose URL will not parse still counts, just without a host.
        }
        const date = col.date >= 0 ? f[col.date] ?? "" : "";
        const threat = col.threat >= 0 ? f[col.threat] || "not reported" : "not reported";
        const status = col.status >= 0 ? f[col.status] || "not reported" : "not reported";
        const reporter = col.reporter >= 0 ? f[col.reporter] || "not reported" : "not reported";
        const tagList = col.tags >= 0 && f[col.tags] ? f[col.tags].split(",").map((t) => t.trim()).filter(Boolean) : [];
        if (tagList.length)
            tagged += 1;
        for (const t of tagList)
            tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
        threatCounts.set(threat, (threatCounts.get(threat) ?? 0) + 1);
        statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
        reporterCounts.set(reporter, (reporterCounts.get(reporter) ?? 0) + 1);
        hostCounts.set(host, (hostCounts.get(host) ?? 0) + 1);
        if (date)
            dates.push(date);
        rows.push({ date, url, status, threat, tags: tagList, reporter, host });
    }
    if (!rows.length)
        throw new UrlhausError("No usable rows in the public dump.");
    const updated = /Last updated:\s*([0-9]{4}-[0-9]{2}-[0-9]{2}[0-9: ]+\(UTC\))/i.exec(body)?.[1]?.replace(/[()]/g, "").trim() ?? "not stated in the file";
    const scope = wantedThreat
        ? rows.filter((r) => r.threat.toLowerCase().includes(wantedThreat))
        : rows;
    const rank = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
    const top = rank(threatCounts, limit);
    const maxThreat = top[0]?.[1] ?? 1;
    return [
        "abuse.ch URLhaus public dump, read whole",
        `  file last updated ${updated}`,
        `  ${rows.length} row(s) in the dump${wantedThreat ? `, ${scope.length} of them matching threat "${args.threat}"` : ""}`,
        `  entries added between ${dates.length ? dates.slice().sort()[0] : "not reported"} and ${dates.length ? dates.slice().sort()[dates.length - 1] : "not reported"}`,
        `  ${tagged} row(s) carry at least one tag`,
        "",
        "What the payloads are:",
        ...top.map(([threat, n]) => `  ${threat.padEnd(16)}${String(n).padStart(6)}  ${((n / rows.length) * 100).toFixed(1).padStart(5)}%  ${"#".repeat(Math.max(1, Math.round((n / maxThreat) * 30)))}`),
        ...(threatCounts.size > top.length ? [`  (+${threatCounts.size - top.length} further threat type(s) not shown)`] : []),
        "",
        "URL status as published:",
        ...rank(statusCounts, 6).map(([status, n]) => `  ${status.padEnd(16)}${String(n).padStart(6)}  ${((n / rows.length) * 100).toFixed(1)}%`),
        "",
        "Most frequent hosts:",
        ...rank(hostCounts, limit).map(([host, n]) => `  ${host.slice(0, 52).padEnd(52)}${String(n).padStart(5)}  ${((n / rows.length) * 100).toFixed(2)}% of the dump`),
        "",
        "Most frequent tags:",
        ...rank(tagCounts, limit).map(([tag, n]) => `  ${tag.padEnd(30)}${String(n).padStart(5)}`),
        "",
        "Who reported them:",
        ...rank(reporterCounts, Math.min(limit, 8)).map(([reporter, n]) => `  ${reporter.slice(0, 40).padEnd(40)}${String(n).padStart(5)}`),
        "",
        "Most recent entries:",
        ...scope
            .slice()
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .slice(0, limit)
            .map((r, i) => `  ${String(i + 1).padStart(2)}. ${r.date.slice(0, 16)}  ${r.threat.padEnd(14)} ${r.status.padEnd(10)} ${r.url.slice(0, 78)}`),
        "",
        "This is abuse.ch's public recent-URLs dump, not a query against the API, so it needs no key and is a snapshot of recent entries rather than a searchable history. A host appearing many times may be a distribution server rather than the source, and a host absent from the dump is not thereby clean, since the dump is limited to recent additions and abuse.ch publishes only what its own sensors saw.",
    ].join("\n");
}
/**
 * A domain's standing on abuse.ch's public DNS blocklist, read as a DNS lookup
 * rather than an API call, so it works anywhere a resolver does. The answer is
 * decoded rather than passed through: each return code names a different reason
 * the domain is listed.
 */
export async function domainReputation(args) {
    const raw = String(args?.domain ?? "").trim().toLowerCase();
    const domain = raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/\.$/, "");
    if (!domain)
        throw new UrlhausError("Give a domain name, for example example.com.");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
        throw new UrlhausError(`"${args.domain}" does not look like a domain name.`);
    }
    // The system resolver is used rather than a public one on purpose: Spamhaus
    // refuses lookups that arrive from open resolvers, so a DoH endpoint would
    // report every domain as unlisted.
    const query = async (name) => {
        try {
            return await resolve4(name);
        }
        catch (e) {
            const code = e.code;
            if (code === "ENOTFOUND" || code === "ENODATA")
                return [];
            throw new UrlhausError(`Could not query the resolver for ${name}: ${e.message}`);
        }
    };
    const answers = await query(`${domain}.${UH_DBL}`);
    const code = answers[0] ?? null;
    // Spamhaus uses 127.0.0.x and 127.0.2.x-127.0.10.x for listings, 127.0.1.x for
    // its own test zone, and 127.255.255.x to tell an open resolver it is not welcome.
    const refused = code !== null && code.startsWith("127.255.255.");
    const testZone = code !== null && code.startsWith("127.0.1.");
    const listed = code !== null && /^127\.0\.[02-9]\d?\./.test(code) && !refused && !testZone;
    const aRecords = await query(domain);
    /** Spamhaus publishes what each return code means; this is their published list. */
    const meanings = {
        "127.0.0.2": "spam domain",
        "127.0.0.3": "open redirect domain",
        "127.0.0.4": "domain involved in phishing",
        "127.0.0.5": "malware domain",
        "127.0.0.6": "botnet command and control",
        "127.0.0.7": "botnet command and control seen in a compromised system",
        "127.0.0.8": "abused legitimate domain",
        "127.0.0.9": "domain or IP involved in malware distribution",
        "127.0.0.10": "domain or IP abused for circumventing anti-virus software",
        "127.0.0.11": "domain with a compromised or hijacked name server",
        "127.0.0.100": "abused legitimate domain, spam or phishing",
    };
    const lines = [
        `Blocklist standing for ${domain}`,
        `  queried ${domain}.${UH_DBL} over DNS, the same way a mail server would`,
        listed
            ? `  LISTED: ${code} — ${meanings[code] ?? `listed with return code ${code}, a meaning this build does not carry`}`
            : refused
                ? `  refused: the resolver returned ${code}, which is Spamhaus telling this client that queries from it are not accepted. The answer below is not a verdict on the domain.`
                : testZone
                    ? `  returned ${code}, which is Spamhaus's own test-zone address rather than a listing. Only the domains it reserves for testing answer there.`
                    : `  not listed: the resolver returned ${code ?? "no answer"} for the blocklist zone, which is what an unlisted domain returns`,
        "",
        "What the domain itself resolves to:",
        `  A record: ${aRecords.length ? aRecords.join(", ").slice(0, 300) : "none returned, so the name does not resolve from here"}`,
        `  addresses found: ${aRecords.filter((r) => /^[\d.]+$/.test(r)).length}`,
        "",
    ];
    if (refused) {
        lines.push("This lookup ran through a resolver Spamhaus will not answer, so treat the result as unknown rather than clean. Running the same query from a normal network resolver returns a real answer.");
    }
    else if (listed) {
        lines.push("The listing is abuse.ch's judgement, not a court ruling, and DBL is built for mail: a domain can be listed for a reason that has nothing to do with the web, and a clean answer here is not a clean bill of health for a site.");
    }
    else {
        lines.push("Not being listed means only that abuse.ch has not categorised this domain, and it is weaker evidence than it looks: the list covers what its sensors have seen, a domain listed today may not be listed tomorrow, and a domain that never resolves cannot be listed because it cannot be used. A parent domain listed would not necessarily list the subdomain being queried.");
    }
    return lines.join("\n");
}
