import { createHash } from "node:crypto";
const UA = "mrfentmen-hibp-mcp/1.0";
const PWNED = "https://api.pwnedpasswords.com";
const HIBP = "https://haveibeenpwned.com/api/v3";
// The full catalogue is about 1 MB. A standby Actor serves several calls from one
// process, so hold it briefly instead of re-downloading it for every tool call.
const CATALOGUE_TTL_MS = 10 * 60 * 1000;
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const n = (value) => Number(value ?? 0).toLocaleString("en-US");
async function getJson(url) {
    let res;
    try {
        res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new Error(`Could not reach Have I Been Pwned: ${errorMessage(e)}`);
    }
    if (res.status === 404)
        return null;
    if (!res.ok)
        throw new Error(`Have I Been Pwned returned HTTP ${res.status}.`);
    return (await res.json());
}
let cache = null;
async function catalogue() {
    if (cache && Date.now() - cache.at < CATALOGUE_TTL_MS)
        return cache.breaches;
    const breaches = (await getJson(`${HIBP}/breaches`)) ?? [];
    cache = { at: Date.now(), breaches };
    return breaches;
}
/**
 * Sensitive entries cover adult or otherwise private services, and fabricated
 * entries are invented data attributed to a company. Neither belongs in a
 * default listing, so they are dropped and counted separately instead.
 */
function browsable(breaches) {
    return breaches.filter((b) => !b.IsSensitive && !b.IsFabricated);
}
function describe(b) {
    return [
        `   breached ${b.BreachDate ?? "unknown date"} | ${n(b.PwnCount)} accounts | verified: ${b.IsVerified ? "yes" : "no"}`,
        `   data exposed: ${(b.DataClasses ?? []).join(", ") || "not disclosed"}`,
    ];
}
export async function breachCatalog(args) {
    const all = browsable(await catalogue());
    let breaches = all;
    const domain = (args.domain ?? "").trim().toLowerCase();
    if (domain)
        breaches = breaches.filter((b) => (b.Domain ?? "").toLowerCase().includes(domain));
    const year = Number(args.year ?? 0);
    if (year)
        breaches = breaches.filter((b) => (b.BreachDate ?? "").startsWith(String(year)));
    breaches = [...breaches].sort((a, b) => (b.PwnCount ?? 0) - (a.PwnCount ?? 0));
    const totalAccounts = breaches.reduce((sum, b) => sum + (b.PwnCount ?? 0), 0);
    const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 100);
    const shown = breaches.slice(0, limit);
    const lines = [
        `Breach catalogue${domain ? ` for "${domain}"` : ""}${year ? ` in ${year}` : ""}`,
        `${n(breaches.length)} matching breach(es) out of ${n(all.length)} live in the catalogue, ${n(totalAccounts)} accounts exposed in total. Largest first.`,
        "Source: Have I Been Pwned, which aggregates publicly disclosed breaches.",
        "",
    ];
    shown.forEach((b, i) => {
        lines.push(`${i + 1}. ${b.Title || b.Name} (${b.Domain || "no domain disclosed"})`);
        lines.push(...describe(b));
    });
    if (!shown.length)
        lines.push("No breach matched those filters. Try a shorter domain or another year.");
    return lines.join("\n");
}
export async function breachDetail(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        return "Provide a breach name such as Adobe or LinkedIn.";
    const b = await getJson(`${HIBP}/breach/${encodeURIComponent(name)}`);
    if (!b)
        return `No breach named "${name}" is in the Have I Been Pwned catalogue. Names are case sensitive, for example Adobe.`;
    const description = (b.Description ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    return [
        `Breach: ${b.Title || b.Name}`,
        `Domain: ${b.Domain || "not disclosed"}`,
        `Breach date: ${b.BreachDate ?? "unknown"} | added to the catalogue: ${(b.AddedDate ?? "").slice(0, 10) || "unknown"}`,
        `Accounts exposed: ${n(b.PwnCount)}`,
        `Verified by the breached site: ${b.IsVerified ? "yes" : "no"}${b.IsFabricated ? " | flagged as fabricated" : ""}${b.IsSensitive ? " | flagged as sensitive" : ""}`,
        `Data exposed: ${(b.DataClasses ?? []).join(", ") || "not disclosed"}`,
        "",
        description ? description.slice(0, 1200) : "No description published.",
    ].join("\n");
}
export async function recentBreaches(args) {
    const all = browsable(await catalogue());
    const days = Math.min(Math.max(Number(args.days ?? 0) || 0, 0), 3650);
    const cutoff = days ? Date.now() - days * 86400000 : 0;
    let breaches = [...all].sort((a, b) => (b.AddedDate ?? "").localeCompare(a.AddedDate ?? ""));
    if (cutoff)
        breaches = breaches.filter((b) => Date.parse(b.AddedDate ?? "") >= cutoff);
    const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 100);
    const shown = breaches.slice(0, limit);
    const lines = [
        `Newest additions to the breach catalogue${days ? ` in the last ${days} day(s)` : ""}`,
        `${n(breaches.length)} breach(es) added${days ? " in that window" : " in total"}, newest first.`,
        "",
    ];
    shown.forEach((b, i) => {
        lines.push(`${i + 1}. ${b.Title || b.Name} (${b.Domain || "no domain disclosed"}) — added ${(b.AddedDate ?? "").slice(0, 10)}`);
        lines.push(...describe(b));
    });
    if (!shown.length)
        lines.push("Nothing was added in that window. Widen the number of days.");
    return lines.join("\n");
}
export async function breachStats(args) {
    const raw = await catalogue();
    let breaches = browsable(raw);
    const year = Number(args.year ?? 0);
    if (year)
        breaches = breaches.filter((b) => (b.BreachDate ?? "").startsWith(String(year)));
    const accounts = breaches.reduce((sum, b) => sum + (b.PwnCount ?? 0), 0);
    const verified = breaches.filter((b) => b.IsVerified).length;
    const largest = [...breaches].sort((a, b) => (b.PwnCount ?? 0) - (a.PwnCount ?? 0))[0];
    const newest = [...breaches].sort((a, b) => (b.AddedDate ?? "").localeCompare(a.AddedDate ?? ""))[0];
    const recentAdds = breaches.filter((b) => Date.parse(b.AddedDate ?? "") >= Date.now() - 90 * 86400000).length;
    const byYear = new Map();
    for (const b of breaches) {
        const key = (b.BreachDate ?? "").slice(0, 4);
        if (!/^\d{4}$/.test(key))
            continue;
        const row = byYear.get(key) ?? { breaches: 0, accounts: 0 };
        row.breaches += 1;
        row.accounts += b.PwnCount ?? 0;
        byYear.set(key, row);
    }
    const years = [...byYear.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10);
    const classes = new Map();
    for (const b of breaches) {
        for (const c of b.DataClasses ?? [])
            classes.set(c, (classes.get(c) ?? 0) + 1);
    }
    const topClasses = [...classes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const perBreach = breaches.length ? Math.round(accounts / breaches.length) : 0;
    const headline = [
        `Have I Been Pwned catalogue overview${year ? ` for breaches dated ${year}` : ""}`,
        `${n(breaches.length)} breach(es) | ${n(accounts)} accounts exposed`,
        perBreach ? `Average of ${n(perBreach)} accounts per breach` : "",
        `Verified by the breached site: ${n(verified)} of ${n(breaches.length)} | added in the last 90 days: ${n(recentAdds)}`,
        largest ? `Largest: ${largest.Title || largest.Name} with ${n(largest.PwnCount)} accounts (${largest.BreachDate ?? "date unknown"})` : "",
        newest ? `Newest entry: ${newest.Title || newest.Name}, added ${(newest.AddedDate ?? "").slice(0, 10)}` : "",
        `Left out of the counts above: ${n(raw.filter((b) => b.IsSensitive).length)} sensitive and ${n(raw.filter((b) => b.IsFabricated).length)} fabricated entr(ies) in the full catalogue.`,
    ].filter((line) => line !== "");
    return [
        ...headline,
        "",
        "Breaches and accounts by the year the breach happened (last 10 years present):",
        ...years.map(([y, row]) => `  ${y}  ${n(row.breaches).padStart(6)} breach(es)  ${n(row.accounts).padStart(16)} accounts`),
        "",
        "Most exposed kinds of data:",
        ...topClasses.map(([c, count], i) => `  ${String(i + 1).padStart(2)}. ${c} — in ${n(count)} breach(es)`),
    ].join("\n");
}
export async function dataClasses(args) {
    const [declared, breaches] = await Promise.all([
        getJson(`${HIBP}/dataclasses`),
        catalogue(),
    ]);
    const live = browsable(breaches);
    const counts = new Map();
    for (const b of live) {
        for (const c of b.DataClasses ?? [])
            counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const limit = Math.min(Math.max(Number(args.limit ?? 25) || 25, 1), 165);
    const shown = ranked.slice(0, limit);
    return [
        "Data types exposed in breaches",
        `Have I Been Pwned tracks ${n((declared ?? []).length)} data classes; ${n(ranked.length)} of them appear in the ${n(live.length)} live breaches.`,
        "",
        ...shown.map(([c, count], i) => `${String(i + 1).padStart(3)}. ${c} — ${n(count)} breach(es), ${((count / Math.max(live.length, 1)) * 100).toFixed(1)}% of the catalogue`),
        "",
        "Email addresses and passwords dominate: those two are what credential-stuffing attacks replay against other sites.",
    ].join("\n");
}
/**
 * Checks a password against the Have I Been Pwned range API using k-anonymity:
 * only the first five characters of the SHA-1 hash leave this server, so the
 * password itself is never sent and never logged.
 */
async function pwnedCount(password) {
    if (!password)
        throw new Error("Provide the password to check.");
    const hash = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`${PWNED}/range/${prefix}`, {
        headers: { "User-Agent": UA, "Add-Padding": "true" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Have I Been Pwned returned HTTP ${res.status}.`);
    const body = await res.text();
    for (const line of body.split(/\r?\n/)) {
        const [candidate, count] = line.split(":");
        if (candidate?.trim().toUpperCase() === suffix)
            return Number(count) || 0;
    }
    return 0;
}
export async function passwordExposure(args) {
    const count = await pwnedCount(args.password);
    return [
        count > 0
            ? `BREACHED — this password appears in ${n(count)} known breach record(s).`
            : "Not found in any known breach.",
        "Only the first 5 characters of the SHA-1 hash were sent (k-anonymity); the password itself never left this server.",
        "",
        count > 0
            ? "Attackers replay leaked passwords against other sites first, so change it everywhere it is used and pick a unique one per account."
            : "It has not appeared in a public dump. Use a different password for every account so one leak cannot spread.",
    ].join("\n");
}
export async function passwordAudit(args) {
    const list = (args.passwords ?? []).map((p) => String(p)).filter(Boolean).slice(0, 10);
    if (!list.length)
        return "Provide up to 10 passwords to check.";
    const rows = [];
    let breached = 0;
    // Sequential so a burst of requests does not trip the upstream rate limit.
    for (let i = 0; i < list.length; i += 1) {
        const count = await pwnedCount(list[i]);
        if (count > 0)
            breached += 1;
        rows.push(`#${i + 1}: ${count > 0 ? `BREACHED — ${n(count)} record(s)` : "not in any known breach"}`);
    }
    return [
        `Checked ${n(list.length)} password(s): ${n(breached)} already breached.`,
        "Each password is hashed locally and only its 5-character hash prefix is sent, so no password is transmitted or stored.",
        "",
        ...rows,
    ].join("\n");
}
// ---- batch-4 tools: latest breach and password strength (2026-09-27) ----
export async function latestBreach() {
    const b = await getJson(`${HIBP}/latestbreach`);
    if (!b?.Name)
        throw new Error("Have I Been Pwned returned no latest breach.");
    const description = (b.Description ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const added = (b.AddedDate ?? "").slice(0, 10);
    const days = added ? Math.round((Date.now() - Date.parse(b.AddedDate)) / 86400000) : null;
    const exposure = (b.PwnCount ?? 0) / 1_000_000;
    return [
        `Newest breach added to Have I Been Pwned: ${b.Title || b.Name}`,
        `  domain         ${b.Domain || "not disclosed"}`,
        `  breach date    ${b.BreachDate ?? "unknown"}${days !== null ? ` | added to the catalogue ${added} (${days} day(s) ago)` : ""}`,
        `  accounts       ${n(b.PwnCount)}`,
        `  verified       ${b.IsVerified ? "yes" : "no"}${b.IsFabricated ? " | flagged as fabricated" : ""}${b.IsSensitive ? " | flagged as sensitive" : ""}`,
        `  data exposed   ${(b.DataClasses ?? []).join(", ") || "not disclosed"}`,
        exposure >= 1 ? `  scale          about 1 in every ${Math.max(1, Math.round(340 / exposure))} people on earth are in this dump` : "",
        "",
        description ? description.slice(0, 1200) : "No description published.",
        "",
        "This endpoint answers with the single most recent addition; call recent_breaches for a window.",
    ].filter((line) => line !== "").join("\n");
}
/** Character-set size of the classes actually present in the password. */
function charsetSize(password) {
    const classes = [];
    let size = 0;
    if (/[a-z]/.test(password)) {
        classes.push("lowercase");
        size += 26;
    }
    if (/[A-Z]/.test(password)) {
        classes.push("uppercase");
        size += 26;
    }
    if (/[0-9]/.test(password)) {
        classes.push("digits");
        size += 10;
    }
    if (/[^A-Za-z0-9]/.test(password)) {
        classes.push("symbols");
        size += 33;
    }
    if (/[^\x20-\x7e]/.test(password)) {
        classes.push("non-ASCII");
        size += 100;
    }
    return { size: Math.max(size, 1), classes };
}
function humanTime(seconds) {
    if (seconds < 1)
        return "under a second";
    const units = [
        [60, "second"], [60, "minute"], [24, "hour"], [365, "day"], [1000, "year"],
    ];
    let value = seconds;
    let label = "second";
    for (const [factor, name] of units) {
        if (value < factor) {
            label = name;
            break;
        }
        value /= factor;
        label = name;
    }
    if (label === "year" && value > 1000)
        return `${Math.round(value).toLocaleString("en-US")} years`;
    return `${value.toFixed(value < 10 ? 1 : 0)} ${label}${value >= 2 ? "s" : ""}`;
}
/**
 * Entropy estimate plus a breach lookup. The maths assumes the password is drawn
 * from the character classes it happens to use; a phrase a human invented has far
 * less real entropy, so the headline number is an upper bound.
 */
export async function passwordStrength(args) {
    const password = String(args?.password ?? "");
    if (!password)
        throw new Error("Provide the password to estimate.");
    const { size, classes } = charsetSize(password);
    const bits = password.length * Math.log2(size);
    const rate = Math.min(Math.max(Number(args?.guesses_per_second ?? 1e10) || 1e10, 1), 1e18);
    const guesses = Math.pow(2, Math.min(bits, 1024));
    const seconds = guesses / 2 / rate;
    const breached = await pwnedCount(password);
    const verdict = breached > 0 ? "COMPROMISED - it is already in a public breach corpus, so length does not help"
        : bits < 40 ? "weak for anything that matters"
            : bits < 60 ? "usable for low-value logins only"
                : bits < 80 ? "solid against online guessing, thin against a dedicated cracker"
                    : "strong against offline cracking at the assumed rate";
    return [
        `Password strength estimate (${password.length} character(s), ${classes.join(" + ") || "no classes"})`,
        "",
        `  charset        ${size} possible characters per position`,
        `  entropy        ${bits.toFixed(1)} bits (upper bound - assumes random characters)`,
        `  crack rate     ${rate.toExponential(0)} guesses/second`,
        `  time to crack  ${humanTime(seconds)} on average (half the keyspace)`,
        `  breach check   ${breached > 0 ? `found in ${n(breached)} breach record(s)` : "not in any known breach"}`,
        "",
        `Reading: ${verdict}.`,
        "The password is hashed locally and only a 5-character hash prefix is sent for the breach check; nothing is stored or logged.",
        "Prefer a long passphrase or a password manager: 4 random words beat 12 random characters for memorability at the same entropy.",
    ].join("\n");
}
// ---- muxG tools:
const OSV = "https://api.osv.dev/v1";
const NVD = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const OSV_ECOSYSTEMS = {
    npm: "npm",
    pypi: "PyPI",
    python: "PyPI",
    pip: "PyPI",
    cargo: "crates.io",
    crates: "crates.io",
    go: "Go",
    golang: "Go",
    maven: "Maven",
    packagist: "Packagist",
    composer: "Packagist",
    nuget: "NuGet",
    rubygems: "RubyGems",
};
const OSV_HEADERS = { "User-Agent": "mrfentmen-hibp-mcp/1.0", Accept: "application/json", "Content-Type": "application/json" };
function nvdScore(cve) {
    const groups = ["cvssMetricV40", "cvssMetricV31", "cvssMetricV30", "cvssMetricV2"];
    for (const group of groups) {
        const entry = (cve.metrics?.[group] ?? [])[0]?.cvssData;
        if (entry && typeof entry.baseScore === "number") {
            return {
                score: entry.baseScore.toFixed(1),
                severity: entry.baseSeverity ?? "severity not reported",
                vector: entry.vectorString ?? "vector not reported",
            };
        }
    }
    return { score: "not scored", severity: "not reported", vector: "not reported" };
}
