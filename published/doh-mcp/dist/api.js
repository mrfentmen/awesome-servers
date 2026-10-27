/**
 * DNS-over-HTTPS client, keyless.
 * Cloudflare, Google and AdGuard all serve the RFC 8484 JSON API over HTTP.
 */
export class DohError extends Error {
    constructor(message) {
        super(message);
        this.name = "DohError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = "mrfentmen-doh-mcp/1.0";
/** Resolvers that speak the DoH JSON API. */
export const PROVIDERS = {
    cloudflare: "https://cloudflare-dns.com/dns-query",
    google: "https://dns.google/resolve",
    adguard: "https://dns.adguard-dns.com/resolve",
};
export const PROVIDER_NAMES = Object.keys(PROVIDERS);
export const RECORD_TYPES = [
    "A",
    "AAAA",
    "CNAME",
    "MX",
    "TXT",
    "NS",
    "SOA",
    "CAA",
    "SRV",
    "PTR",
];
const TYPE_NAMES = {
    1: "A",
    2: "NS",
    5: "CNAME",
    6: "SOA",
    12: "PTR",
    15: "MX",
    16: "TXT",
    28: "AAAA",
    33: "SRV",
    43: "DS",
    48: "DNSKEY",
    257: "CAA",
};
const RCODES = {
    0: "NOERROR",
    1: "FORMERR",
    2: "SERVFAIL",
    3: "NXDOMAIN",
    4: "NOTIMP",
    5: "REFUSED",
};
export function typeName(code) {
    return TYPE_NAMES[code] ?? `TYPE${code}`;
}
export function rcodeName(code) {
    return RCODES[code] ?? `RCODE${code}`;
}
export function normaliseProvider(provider) {
    const p = (provider ?? "cloudflare").toLowerCase().trim();
    if (!(p in PROVIDERS)) {
        throw new DohError(`Unknown provider "${provider}". Use one of: ${PROVIDER_NAMES.join(", ")}.`);
    }
    return p;
}
export function normaliseType(type) {
    const t = (type ?? "A").toUpperCase().trim();
    if (!/^[A-Z0-9]+$/.test(t))
        throw new DohError(`"${type}" is not a DNS record type.`);
    return t;
}
async function query(name, type, provider) {
    const clean = name.trim().replace(/\.$/, "");
    if (!clean)
        throw new DohError("Record name is required.");
    const q = new URLSearchParams({ name: clean, type });
    let res;
    try {
        res = await fetch(`${PROVIDERS[provider]}?${q.toString()}`, {
            headers: { "User-Agent": UA, Accept: "application/dns-json" },
            signal: AbortSignal.timeout(15000),
        });
    }
    catch (e) {
        throw new DohError(`Could not reach the ${provider} resolver: ${errorMessage(e)}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 200);
        throw new DohError(`The ${provider} resolver returned HTTP ${res.status}: ${body}`);
    }
    let json;
    try {
        json = (await res.json());
    }
    catch {
        throw new DohError(`The ${provider} resolver did not return JSON.`);
    }
    const status = typeof json.Status === "number" ? json.Status : 0;
    return {
        status,
        statusText: rcodeName(status),
        comment: json.Comment,
        answers: Array.isArray(json.Answer) ? json.Answer : [],
        authority: Array.isArray(json.Authority) ? json.Authority : [],
    };
}
/** One lookup. Returns status instead of throwing, so callers can report NXDOMAIN. */
export function resolve(name, type, provider) {
    return query(name, normaliseType(type), normaliseProvider(provider));
}
/** Unwrap the quoted chunks a TXT record is split into. */
export function txtValue(data) {
    const chunks = data.match(/"([^"]*)"/g);
    if (chunks && chunks.length > 0)
        return chunks.map((c) => c.slice(1, -1)).join("");
    return data.trim();
}
/** Split a CAA record into flags, tag and value. */
export function caaParts(data) {
    const m = data.trim().match(/^(\d+)\s+([a-z0-9]+)\s+"?([^"]*)"?$/i);
    if (!m)
        return { flags: 0, tag: "?", value: data.trim() };
    return { flags: Number(m[1]), tag: m[2].toLowerCase(), value: m[3] };
}
function formatValue(a) {
    if (a.type === 16)
        return txtValue(a.data);
    if (a.type === 257) {
        const p = caaParts(a.data);
        return `${p.tag} ${p.value}${p.flags & 128 ? " (critical)" : ""}`;
    }
    return a.data;
}
export function formatAnswer(name, type, provider, res) {
    const header = `${type} records for ${name} (via ${provider})`;
    if (res.answers.length === 0) {
        const why = res.status === 0 ? "No records of that type." : `${res.statusText}.`;
        return `${header}\n\n${why}${res.comment ? ` ${res.comment}` : ""}`;
    }
    const rows = res.answers.map((a) => `  ${formatValue(a)}${a.TTL ? `   (TTL ${a.TTL}s)` : ""}`);
    return `${header}\n\n${rows.join("\n")}`;
}
export async function resolveMany(names, type, provider) {
    const list = names.map((n) => n.trim()).filter(Boolean).slice(0, 15);
    if (list.length === 0)
        throw new DohError("Give at least one name.");
    const results = await Promise.all(list.map(async (n) => {
        try {
            const res = await resolve(n, type, provider);
            if (res.answers.length === 0)
                return `  ${n}  ->  ${res.statusText}`;
            return formatAnswer(n, type, provider, res)
                .split("\n")
                .slice(2)
                .map((line) => (line ? `${n}${line}` : line))
                .join("\n");
        }
        catch (e) {
            return `  ${n}  ->  ${errorMessage(e)}`;
        }
    }));
    return `${type} lookup for ${list.length} name(s) via ${provider}:\n\n${results.join("\n\n")}`;
}
const SUMMARY_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "CAA"];
export async function recordSummary(domain, provider) {
    const results = await Promise.all(SUMMARY_TYPES.map(async (type) => {
        try {
            return { type, res: await resolve(domain, type, provider) };
        }
        catch (e) {
            return { type, error: errorMessage(e) };
        }
    }));
    const lines = [];
    for (const r of results) {
        if ("error" in r) {
            lines.push(`${r.type.padEnd(6)} error: ${r.error}`);
            continue;
        }
        if (r.res.answers.length === 0)
            continue;
        const values = r.res.answers.map((a) => formatValue(a));
        lines.push(`${r.type.padEnd(6)} ${values.join("\n       ")}`);
    }
    const first = results.find((r) => !("error" in r) && r.res.answers.length > 0);
    const head = `${domain} DNS summary (via ${provider})`;
    if (lines.length === 0) {
        return `${head}\n\nNo records found.${first ? "" : " The domain may not exist."}`;
    }
    return `${head}\n\n${lines.join("\n")}\n\n${first?.res.statusText ?? ""}`.trimEnd();
}
export async function emailRecords(domain, provider) {
    const [mx, txt, dmarcRes, caaRes] = await Promise.all([
        resolve(domain, "MX", provider),
        resolve(domain, "TXT", provider),
        resolve(`_dmarc.${domain}`, "TXT", provider),
        resolve(domain, "CAA", provider),
    ]);
    const spf = txt.answers
        .filter((a) => a.type === 16)
        .map((a) => txtValue(a.data))
        .filter((t) => t.toLowerCase().startsWith("v=spf1"));
    const dmarc = dmarcRes.answers.filter((a) => a.type === 16).map((a) => txtValue(a.data));
    const mxLines = mx.answers.map((a) => {
        const [pref, host] = a.data.split(/\s+/);
        return `  ${pref.padStart(3)}  ${host}`;
    });
    const sections = [
        `Email DNS for ${domain} (via ${provider})`,
        "",
        `MX (${mx.answers.length})`,
        mxLines.length ? mxLines.join("\n") : "  none - the domain cannot receive mail",
        "",
        `SPF: ${spf.length ? spf.join(" | ") : "missing"}`,
        `DMARC: ${dmarc.length ? dmarc.join(" | ") : "missing"}`,
        `CAA: ${caaRes.answers.length ? caaRes.answers.map((a) => formatValue(a)).join(", ") : "none"}`,
    ];
    const problems = [];
    if (!spf.length)
        problems.push("no SPF record");
    if (!dmarc.length)
        problems.push("no DMARC record");
    if (!mx.answers.length)
        problems.push("no MX record");
    if (problems.length)
        sections.push("", `Note: ${problems.join(", ")}.`);
    return sections.join("\n");
}
export async function caaRecords(domain, provider) {
    const res = await resolve(domain, "CAA", provider);
    if (res.answers.length === 0) {
        return `No CAA records for ${domain} - any certificate authority may issue for it.`;
    }
    const lines = res.answers.map((a) => {
        const p = caaParts(a.data);
        return `  ${p.tag.padEnd(8)} ${p.value}${p.flags ? `  (flags ${p.flags})` : ""}`;
    });
    return `CAA records for ${domain} (via ${provider}):\n\n${lines.join("\n")}`;
}
export function reverseName(ip) {
    const clean = ip.trim();
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(clean)) {
        return `${clean.split(".").reverse().join(".")}.in-addr.arpa`;
    }
    if (clean.includes(":")) {
        const expanded = expandIpv6(clean);
        return `${expanded.split("").reverse().join(".")}.ip6.arpa`;
    }
    throw new DohError(`"${ip}" is not an IPv4 or IPv6 address.`);
}
function expandIpv6(ip) {
    const [head, tail] = ip.split("::");
    const headParts = head ? head.split(":") : [];
    const tailParts = tail ? tail.split(":") : [];
    const missing = 8 - headParts.length - tailParts.length;
    if (ip.includes("::") && missing < 0)
        throw new DohError(`"${ip}" is not a valid IPv6 address.`);
    const groups = ip.includes("::")
        ? [...headParts, ...Array(missing).fill("0"), ...tailParts]
        : headParts;
    if (groups.length !== 8)
        throw new DohError(`"${ip}" is not a valid IPv6 address.`);
    return groups.map((g) => g.padStart(4, "0")).join("");
}
export async function reverseLookup(ip, provider) {
    const ptrName = reverseName(ip);
    const res = await resolve(ptrName, "PTR", provider);
    if (res.answers.length === 0)
        return `No PTR record for ${ip} (${res.statusText}).`;
    const names = res.answers.map((a) => a.data.replace(/\.$/, ""));
    return `${ip} -> ${names.join(", ")}`;
}
export function providersHelp() {
    const lines = PROVIDER_NAMES.map((p) => `  ${p.padEnd(11)} ${PROVIDERS[p]}`);
    return [
        "Keyless DNS-over-HTTPS resolvers:",
        "",
        ...lines,
        "",
        `Record types: ${RECORD_TYPES.join(", ")}`,
    ].join("\n");
}
async function rawQuery(name, type, provider) {
    const clean = name.trim().replace(/\.$/, "");
    if (!clean)
        throw new DohError("Record name is required.");
    const res = await fetch(`${PROVIDERS[provider]}?name=${encodeURIComponent(clean)}&type=${encodeURIComponent(type)}&do=true`, { headers: { "User-Agent": UA, Accept: "application/dns-json" }, signal: AbortSignal.timeout(15000) });
    if (!res.ok)
        throw new DohError(`The ${provider} resolver returned HTTP ${res.status}`);
    return (await res.json());
}
export async function dnssecCheck(args) {
    const domain = (args.domain ?? "").trim().replace(/\.$/, "");
    if (!domain)
        throw new DohError("Give a domain, e.g. example.com");
    const provider = normaliseProvider(args.provider);
    const [key, ds] = await Promise.all([
        rawQuery(domain, "DNSKEY", provider),
        rawQuery(domain, "DS", provider),
    ]);
    const keys = (key.Answer ?? []).filter((a) => a.type === 48);
    const dsRows = (ds.Answer ?? []).filter((a) => a.type === 43);
    const validated = key.AD === true || ds.AD === true;
    const lines = [
        `DNSSEC for ${domain} (via ${provider}, DO bit set)`,
        `Validated by the resolver (AD flag): ${validated ? "yes" : "no"}`,
        `DNSKEY records published: ${keys.length}`,
        `DS records at the delegation: ${dsRows.length}`,
    ];
    if (dsRows.length)
        lines.push(`DS: ${dsRows.map((a) => txtValue(a.data)).slice(0, 4).join(" | ")}`);
    lines.push("", validated && keys.length
        ? "The zone is signed and the resolver validated the chain of trust."
        : "Not validated: either the zone is unsigned, or the DS record is missing at the registrar/parent zone, which breaks the chain.");
    return lines.join("\n");
}
export async function propagationCheck(args) {
    const name = (args.name ?? "").trim().replace(/\.$/, "");
    if (!name)
        throw new DohError("Give a hostname to check, e.g. www.example.com");
    const type = normaliseType(args.type);
    const providers = args.provider ? [normaliseProvider(args.provider)] : [...PROVIDER_NAMES];
    const rows = [];
    const seen = new Map();
    for (const provider of providers) {
        try {
            const res = await resolve(name, type, provider);
            const values = res.answers.map((a) => formatValue(a)).sort();
            const key = values.join(" | ") || res.statusText;
            seen.set(key, [...(seen.get(key) ?? []), provider]);
            rows.push(`${provider.padEnd(11)} ${values.length ? values.slice(0, 3).join(", ") : res.statusText}`);
        }
        catch (e) {
            rows.push(`${provider.padEnd(11)} error: ${errorMessage(e)}`);
        }
    }
    const agreeing = seen.size <= 1;
    return [
        `${type} propagation for ${name} across ${providers.length} resolver(s)`,
        agreeing
            ? "All resolvers returned the same answer."
            : "Resolvers DISAGREE - the record has not propagated everywhere yet, or a CDN answers differently per region:",
        "",
        ...rows,
        ...(agreeing ? [] : ["", ...[...seen.entries()].map(([values, names]) => `${names.join(", ")}: ${values}`)]),
    ].join("\n");
}
export async function txtContains(args) {
    const domain = (args.domain ?? "").trim().replace(/\.$/, "");
    const needle = (args.value ?? "").trim();
    if (!domain || !needle)
        throw new DohError("Give a domain and the text to look for");
    const provider = normaliseProvider(args.provider);
    const res = await resolve(domain, "TXT", provider);
    const values = res.answers.filter((a) => a.type === 16).map((a) => txtValue(a.data));
    const hits = values.filter((v) => v.toLowerCase().includes(needle.toLowerCase()));
    return [
        `TXT records for ${domain} (via ${provider}): ${values.length}`,
        hits.length ? `MATCH - ${hits.length} record(s) contain "${needle}":` : `No TXT record contains "${needle}".`,
        ...hits.map((h) => `  ${h.slice(0, 300)}`),
        "",
        "All TXT values:",
        ...(values.length ? values.slice(0, 10).map((v) => `  ${v.slice(0, 300)}`) : ["  none"]),
    ].join("\n");
}
// ---- muxD tools:
/**
 * Works out what actually happened on a lookup. A bare "no answer" is ambiguous:
 * the name may not exist, or it may exist with no record of that type, or the
 * resolver may have failed, or refused. Each needs a different next step, so this
 * spells out which one it is.
 */
async function classify(name, type, provider) {
    const res = await resolve(name, type, provider);
    if (res.status === 0 && res.answers.length > 0) {
        return { label: "ANSWERED", detail: `${res.answers.length} answer(s) returned`, advice: "The record resolves. If you expected something else, check the type you asked for and whether a CNAME is redirecting you." };
    }
    if (res.status === 0) {
        const soa = res.authority.find((a) => a.type === 6);
        return {
            label: "NO DATA (NODATA)",
            detail: `The name exists but publishes no ${type} record${soa ? `; the authority section carries the SOA of ${cfName(soa.data)}` : ""}`,
            advice: `This is not a typo or a missing domain. Either the ${type} record was never created, or it was removed. A null MX of "0 ." is the deliberate way to say "do not send mail here".`,
        };
    }
    if (res.status === 3) {
        return {
            label: "NXDOMAIN",
            detail: "The name does not exist at all in DNS",
            advice: "Either the hostname is wrong, or the domain has no delegation for it. If the parent domain also returns NXDOMAIN, the domain itself is not delegated. If the parent resolves, the label simply does not exist.",
        };
    }
    if (res.status === 2) {
        const c = cfComment(res.comment);
        return {
            label: "SERVFAIL",
            detail: `The resolver reached a server that failed${c ? `: ${c}` : ""}`,
            advice: c && /DNSSEC|DNSKEY|DS|SEC/i.test(c)
                ? "This is a DNSSEC validation failure, not a missing record. A validating resolver refuses the answer because the chain of trust is broken, usually a DS in the parent with no matching DNSKEY in the child. A non-validating resolver will still answer it, which is why the same name can work in a browser and fail in a script."
                : "The authoritative server for this zone returned an error. Common causes are broken DNSSEC, a lame delegation pointing at nameservers that do not answer, or an authoritative server that is down. Trying a second resolver tells you whether the problem is the zone or your path.",
        };
    }
    if (res.status === 5) {
        return { label: "REFUSED", detail: "The resolver refused to answer this query", advice: "Usually a policy block: the resolver is configured to refuse this name or type, often because the domain is on a blocklist. Switching resolver is the quickest test." };
    }
    if (res.status === 1) {
        return { label: "FORMERR", detail: "The resolver could not parse the question", advice: `Check the name and type. "${type}" is a valid type here, so the name is the likely problem, particularly if it contains a stray character or is not a valid hostname.` };
    }
    return { label: `RCODE ${res.status}`, detail: res.statusText, advice: "Unexpected response code. Running propagation_check across the available resolvers will show whether this is specific to one resolver." };
}
const cfComment = (c) => {
    if (c === null || c === undefined || c === "")
        return "";
    if (Array.isArray(c))
        return c.map((x) => String(x)).join("; ");
    return String(c);
};
/** Pull the owner name out of an SOA record's rdata. */
const cfName = (rdata) => {
    const first = String(rdata ?? "").trim().split(/\s+/)[0] ?? "";
    return first.replace(/\.$/, "");
};
const WILDCARD_LABELS = ["zzq7x-null-check", "null-check-zzq7x", "wxtest9x2", "nonexistent-probe-4k2"];
/** Whether a zone answers for any name at all, which is the usual reason an unexpected record resolves. */
export async function wildcardCheck(args) {
    const domain = (args.domain ?? "").trim().toLowerCase().replace(/\.$/, "");
    if (!domain || !domain.includes("."))
        throw new DohError("Give a domain like example.com");
    const provider = normaliseProvider(args.provider);
    const lines = [`Wildcard test for ${domain} via ${provider}:`, ""];
    const types = [["A", "1"], ["CNAME", "5"], ["TXT", "16"]];
    const hits = [];
    let nxdomain = 0;
    let nodata = 0;
    let other = 0;
    for (const [type, _code] of types) {
        const answers = [];
        // Track whether a probe actually returned data, rather than inspecting the
        // rendered text: NODATA means no record exists and must not read as a hit.
        let answered = false;
        for (const label of WILDCARD_LABELS) {
            const probe = `${label}.${domain}`;
            let res;
            try {
                res = await resolve(probe, type, provider);
            }
            catch (e) {
                answers.push(`${label}: error ${errorMessage(e)}`);
                continue;
            }
            if (res.status === 0 && res.answers.length) {
                answered = true;
                answers.push(`${label} -> ${res.answers.map((a) => a.data).slice(0, 2).join(", ")}`);
            }
            else if (res.status === 3) {
                // The label does not exist at all.
                nxdomain += 1;
                answers.push(`${label} -> NXDOMAIN (no such name)`);
            }
            else if (res.status === 0) {
                // The name exists but holds nothing of this type, which is a different
                // answer from the name not existing, and is not a wildcard.
                nodata += 1;
                answers.push(`${label} -> NODATA (name exists, no ${type} record)`);
            }
            else {
                other += 1;
                answers.push(`${label} -> rcode ${res.status}`);
            }
        }
        lines.push(`${type}:`);
        for (const a of answers)
            lines.push(`  ${a}`);
        if (answered)
            hits.push(type);
        lines.push("");
    }
    if (hits.length) {
        lines.push(`This zone answers for names that were never created, at least for ${hits.join(", ")}.`, "A wildcard record is why a mistyped or decommissioned hostname still resolves, and why a certificate can be issued for a name you never configured. If the answers are identical across probes, the records are a genuine wildcard rather than a coincidence.");
    }
    else {
        const probed = WILDCARD_LABELS.length * types.length;
        lines.push(`No wildcard detected. None of the ${probed} probe(s) returned an answer: ${nxdomain} NXDOMAIN, ${nodata} NODATA${other ? `, ${other} other` : ""}. All of those mean no record exists for a name that was never configured, which is the correct and safer behaviour.`, "If a name you expected to be gone still resolves, it is because a specific record for it still exists, not because the zone is wildcarded.");
    }
    lines.push("", "Only four labels are probed, and some zones wildcard selectively by record type or by pattern, so a clean result is strong evidence rather than proof.");
    return lines.join("\n");
}
/** Why a lookup returned what it did, plus a second opinion from the other resolvers. */
export async function diagnoseLookup(args) {
    const name = (args.name ?? "").trim().replace(/\.$/, "");
    if (!name)
        throw new DohError("Give a hostname to diagnose, e.g. www.example.com");
    const type = normaliseType(args.type);
    const provider = normaliseProvider(args.provider);
    const verdict = await classify(name, type, provider);
    const lines = [
        `Diagnosis for ${name} (${type}, asked of ${provider})`,
        "",
        `Result: ${verdict.label}`,
        `  ${verdict.detail}`,
        "",
        `What to do: ${verdict.advice}`,
    ];
    if (verdict.label !== "ANSWERED") {
        const others = PROVIDER_NAMES.filter((p) => p !== provider);
        const rows = [];
        for (const other of others) {
            try {
                const res = await resolve(name, type, other);
                const summary = res.answers.length
                    ? `${res.answers.length} answer(s): ${res.answers.slice(0, 2).map((a) => formatValue(a)).join(", ")}`
                    : `${res.statusText}${res.comment ? ` (${res.comment})` : ""}`;
                rows.push(`  ${other.padEnd(11)} ${summary}`);
            }
            catch (e) {
                rows.push(`  ${other.padEnd(11)} error: ${errorMessage(e)}`);
            }
        }
        const answeredElsewhere = rows.filter((row) => /answer\(s\):/.test(row)).length;
        lines.push("", `Asked the other ${others.length} resolver(s), because failing everywhere and failing on one resolver have opposite fixes:`);
        lines.push(...rows);
        lines.push("", answeredElsewhere
            ? `${answeredElsewhere} other resolver(s) did answer. That points at ${provider} rather than the zone: its cache, its DNSSEC validation, or a policy block on this name. Retry with provider set to one that answered.`
            : "No resolver produced an answer, so the problem is in the zone itself or in the delegation above it, not in your resolver.");
    }
    return lines.join("\n");
}
/** The NS delegation from the TLD downwards, then a lame-delegation check on the final zone. */
export async function delegationChain(args) {
    const domain = (args.domain ?? "").trim().toLowerCase().replace(/^\.+/, "").replace(/\.$/, "");
    if (!domain || !domain.includes("."))
        throw new DohError("Give a domain like www.example.com");
    const provider = normaliseProvider(args.provider);
    const maxHops = Math.min(Math.max(Math.floor(Number(args.max_hops ?? 8)) || 8, 1), 20);
    const labels = domain.split(".").filter(Boolean);
    const allLevels = [];
    // Shortest suffix first, so the walk starts at the TLD and ends at the name asked for.
    for (let i = labels.length - 1; i >= 0; i -= 1)
        allLevels.push(labels.slice(i).join("."));
    const levels = allLevels.slice(-maxHops);
    const lines = [`Delegation for ${domain} (via ${provider}, ${levels.length} level(s) walked)`, ""];
    const nsByLevel = [];
    for (const level of levels) {
        let ns = [];
        let status = "";
        try {
            const res = await resolve(level, "NS", provider);
            status = res.statusText;
            ns = res.answers.filter((a) => a.type === 2).map((a) => String(a.data ?? "").replace(/\.$/, ""));
        }
        catch (e) {
            status = `error ${errorMessage(e)}`;
        }
        if (!ns.length) {
            lines.push(`${level}  ->  no NS records (${status})`);
            continue;
        }
        nsByLevel.push({ level, ns });
        lines.push(`${level}  ->  ${ns.join(", ")}`);
    }
    if (!nsByLevel.length) {
        lines.push("", "No level published NS records, so the name is not delegated and cannot be resolved by any resolver.");
        return lines.join("\n");
    }
    const finalLevel = nsByLevel[nsByLevel.length - 1];
    let primary = "";
    try {
        const soa = await resolve(finalLevel.level, "SOA", provider);
        const row = soa.answers.find((a) => a.type === 6);
        if (row)
            primary = String(row.data ?? "").trim().split(/\s+/)[0]?.replace(/\.$/, "") ?? "";
    }
    catch {
        primary = "";
    }
    lines.push("", `Zone ${finalLevel.level} publishes ${finalLevel.ns.length} name server(s).` + (primary ? ` SOA primary: ${primary}.` : " No SOA was returned, which alone is a sign the zone is not answering authoritatively."));
    lines.push("", "Name server reachability:");
    let lame = 0;
    for (const host of finalLevel.ns) {
        const addresses = [];
        for (const type of ["A", "AAAA"]) {
            try {
                const res = await resolve(host, type, provider);
                for (const a of res.answers)
                    addresses.push(String(a.data ?? ""));
            }
            catch {
                /* one family failing is normal */
            }
        }
        if (!addresses.length) {
            lame += 1;
            lines.push(`  ${host.padEnd(34)} NO address record — lame delegation`);
        }
        else {
            lines.push(`  ${host.padEnd(34)} ${addresses.slice(0, 2).join(", ")}`);
        }
    }
    lines.push("", lame
        ? `${lame} of ${finalLevel.ns.length} name server(s) have no address record. A parent that points at servers with no address is a lame delegation: some resolvers will return SERVFAIL for the whole zone while others still work, which is why a name can resolve for one person and not another.`
        : `Every name server for ${finalLevel.level} resolves to an address, so the delegation is not lame.`);
    if (primary)
        lines.push(`If the zone still fails, query ${primary} directly: it is the server the zone claims to be authoritative.`);
    return lines.join("\n");
}
