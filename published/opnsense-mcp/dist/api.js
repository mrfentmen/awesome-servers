export class OpnSenseError extends Error {
    constructor(message) {
        super(message);
        this.name = "OpnSenseError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    const b = process.env.OPNSENSE_URL;
    if (!b)
        throw new OpnSenseError("Set OPNSENSE_URL (your OPNsense base URL).");
    return b.replace(/\/$/, "");
}
function headers() {
    const k = process.env.OPNSENSE_KEY;
    const s = process.env.OPNSENSE_SECRET;
    if (!k || !s)
        throw new OpnSenseError("Set OPNSENSE_KEY and OPNSENSE_SECRET (System > Access > Users > API keys).");
    return { ...UA, Accept: "application/json", Authorization: `Basic ${Buffer.from(`${k}:${s}`).toString("base64")}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new OpnSenseError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new OpnSenseError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 8000);
}
export function getFirmwareStatus() {
    return get("/api/core/firmware/status");
}
export function getInterfaces() {
    return get("/api/diagnostics/interface/getInterfaceStatistics");
}
// ---- muxG tools:
const OPS_RDAP = "https://rdap.org/ip/";
const OPS_KEV = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const OPS_PKG = "https://pkg.opnsense.org";
const OPS_LIST_CAP = 10;
async function opsJson(url, accept = "application/json") {
    const res = await fetch(url, {
        headers: { "User-Agent": "awesome-mcps/1.0", Accept: accept },
        signal: AbortSignal.timeout(40000),
    });
    if (res.status === 404)
        throw new OpnSenseError(`Not found: ${url.replace(/^https:\/\//, "")}`);
    if (res.status === 429)
        throw new OpnSenseError("That service is rate limiting this IP. Wait a moment and try again.");
    if (!res.ok)
        throw new OpnSenseError(`Returned ${res.status} for ${url.replace(/^https:\/\//, "")}`);
    return (await res.json());
}
async function opsText(url) {
    const res = await fetch(url, { headers: { "User-Agent": "awesome-mcps/1.0", Accept: "text/html,text/plain" }, signal: AbortSignal.timeout(40000) });
    if (!res.ok)
        throw new OpnSenseError(`Returned ${res.status} for ${url.replace(/^https:\/\//, "")}`);
    return res.text();
}
function opsBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function opsVcardField(vcard, key) {
    if (!Array.isArray(vcard) || !Array.isArray(vcard[1]))
        return null;
    for (const entry of vcard[1]) {
        if (Array.isArray(entry) && entry[0] === key && typeof entry[3] === "string")
            return entry[3];
    }
    return null;
}
/** Who owns an address that just showed up in a log, from the registry rather than a guess. */
export async function ipOwnership(args) {
    const raw = String(args?.ip ?? "").trim();
    if (!raw)
        throw new OpnSenseError("ip is required, for example 8.8.8.8 or 2606:4700:4700::1111.");
    if (!/^[0-9a-f:.]{3,39}$/i.test(raw) || !raw.includes(".")) {
        throw new OpnSenseError(`"${raw}" does not look like an IPv4 address. This tool reads the IPv4 registry; an IPv6 address needs the ARIN or RIPE RDAP server directly.`);
    }
    const octets = raw.split(".");
    if (octets.length !== 4 || octets.some((o) => !/^\d{1,3}$/.test(o) || Number(o) > 255)) {
        throw new OpnSenseError(`"${raw}" is not a valid IPv4 address.`);
    }
    const d = await opsJson(`${OPS_RDAP}${encodeURIComponent(raw)}`);
    const role = (name) => {
        const e = (d.entities ?? []).find((x) => x.roles?.includes(name));
        return e ? opsVcardField(e.vcardArray, "fn") : null;
    };
    const abuse = (d.entities ?? []).find((e) => e.roles?.includes("abuse"));
    const abuseEmail = abuse ? opsVcardField(abuse.vcardArray, "email") : null;
    const size = d.startAddress && d.endAddress ? Number(d.endAddress.split(".").pop()) - Number(d.startAddress.split(".").pop()) + 1 : null;
    const prefix = d.cidr0_cidrs?.[0] ? `${d.cidr0_cidrs[0].v4prefix ?? "?"}/${d.cidr0_cidrs[0].length ?? "?"}` : "not reported";
    const holder = role("registrant") ?? role("administrative") ?? d.name ?? "not reported";
    return [
        `Registry ownership of ${raw}`,
        `${holder}${d.country ? `, ${d.country}` : ""}`,
        `Range: ${d.startAddress ?? "?"} to ${d.endAddress ?? "?"}${size !== null && size > 0 ? ` (${size} address(es))` : ""}`,
        `Announced as: ${prefix}`,
        `Allocation type: ${d.type ?? "not reported"}${d.parentHandle ? `, parent block ${d.parentHandle}` : ""}`,
        `Registry handle: ${d.handle ?? "not reported"} | network name: ${d.name ?? "not reported"}`,
        `Abuse contact: ${abuseEmail ?? role("abuse") ?? "not published for this range"}`,
        "",
        "Registry events:",
        ...(d.events ?? []).map((e) => `  ${e.eventAction ?? "?"}: ${String(e.eventDate ?? "?").slice(0, 10)}`),
        (d.remarks?.length ?? 0) ? "" : "",
        ...(d.remarks ?? []).flatMap((r) => (r.description ?? []).slice(0, 2).map((x) => `  remark: ${x.slice(0, 160)}`)),
        "",
        "A block's holder is not the same as the person operating a host inside it: a cloud range can be a customer of the registrant, and a compromised host is still the registrant's allocation. Use this to decide whether the source is a provider you can abuse-report to, not to conclude who the attacker is.",
    ].filter(Boolean).join("\n");
}
const OPS_EDGE_VENDORS = [
    "cisco", "fortinet", "palo alto", "juniper", "citrix", "f5", "pulse secure", "ivanti",
    "couchbase", "atlassian", "dlink", "netgear", "zyxel", "huawei", "mikrotik", "sonicwall",
    "watchguard", "barracuda", "checkpoint", "sangfor", "haproxy", "freeswitch", "asterisk",
    "opnsense", "pfsense", "freebsd", "openbsd", "netbsd", "mikrotik",
];
/** Is anything on this edge on the actively exploited list, and by when must it be fixed. */
export async function knownExploitedCheck(args) {
    const limit = opsBound(args?.limit, 1, OPS_LIST_CAP * 2, 12);
    const cat = await opsJson(OPS_KEV);
    const rows = cat.vulnerabilities ?? [];
    if (!rows.length)
        throw new OpnSenseError("The known-exploited-vulnerabilities feed parsed to zero entries.");
    const today = new Date().toISOString().slice(0, 10);
    const edge = rows.filter((r) => OPS_EDGE_VENDORS.some((v) => `${r.vendorProject ?? ""} ${r.product ?? ""}`.toLowerCase().includes(v)));
    const overdue = rows.filter((r) => r.dueDate && r.dueDate < today);
    const ransomware = rows.filter((r) => r.knownRansomwareCampaignUse === "Known");
    const wanted = String(args?.products ?? "")
        .split(/[\n,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20);
    let mine = [];
    if (wanted.length) {
        mine = rows.filter((r) => wanted.some((w) => `${r.vendorProject ?? ""} ${r.product ?? ""} ${r.vulnerabilityName ?? ""}`.toLowerCase().includes(w)));
    }
    const out = [
        "Known exploited vulnerabilities, from the CISA catalog",
        `Catalog version ${cat.catalogVersion ?? "not reported"}, released ${String(cat.dateReleased ?? "?").slice(0, 10)}, ${rows.length} entries`,
        `Added for remediation and now past their due date: ${overdue.length}`,
        `Linked to a known ransomware campaign: ${ransomware.length}`,
        `Relating to firewall, VPN, router and network-edge vendors on this watch list: ${edge.length}`,
    ];
    if (wanted.length) {
        out.push("", `Matching what you asked about (${wanted.join(", ")}): ${mine.length} hit(s)`);
        if (!mine.length) {
            out.push("  Nothing on the list matches. Absence is not clearance: the catalog only contains vulnerabilities with confirmed active exploitation, so a product can be vulnerable and unlisted.");
        }
        for (const r of mine.slice(0, limit)) {
            out.push(`  ${r.cveID ?? "?"} ${r.vendorProject ?? "?"} / ${r.product ?? "?"}`, `    added ${String(r.dateAdded ?? "?").slice(0, 10)}, fix due ${String(r.dueDate ?? "?").slice(0, 10)}${r.dueDate && r.dueDate < today ? " — OVERDUE" : ""}${r.knownRansomwareCampaignUse === "Known" ? ", used in ransomware campaigns" : ""}`, `    ${(r.shortDescription ?? r.vulnerabilityName ?? "no description").slice(0, 200)}`, r.requiredAction ? `    required action: ${r.requiredAction.slice(0, 200)}` : "");
        }
    }
    out.push("", "Most recently added edge-device entries:");
    for (const r of [...edge].sort((a, b) => String(b.dateAdded).localeCompare(String(a.dateAdded))).slice(0, limit)) {
        out.push(`  ${String(r.dateAdded ?? "?").slice(0, 10)}  ${r.cveID ?? "?"}  ${r.vendorProject ?? "?"} / ${r.product ?? "?"}${r.knownRansomwareCampaignUse === "Known" ? "  [ransomware]" : ""}`);
    }
    out.push("", "Every entry here is a vulnerability under active exploitation somewhere, which is a higher bar than a CVE with a CVSS score: it means the fix is urgent rather than scheduled.");
    return out.filter(Boolean).join("\n");
}
function opsSplitPkg(file) {
    const stem = file.replace(/\.pkg$/, "");
    const i = stem.lastIndexOf("-");
    return i > 0 ? { name: stem.slice(0, i), version: stem.slice(i + 1) } : { name: stem, version: "not reported" };
}
/** What a given OPNsense branch currently offers, and whether the package you need exists. */
export async function packageAvailability(args) {
    const branch = String(args?.branch ?? "").trim();
    if (!branch) {
        const index = await opsText(`${OPS_PKG}/FreeBSD:14:amd64/`);
        const branches = [...index.matchAll(/href="([^"/][^"]*)\/"/g)].map((m) => m[1]).filter((b) => b !== "snapshots");
        throw new OpnSenseError(`branch is required, for example one of: ${branches.join(", ")}. It is the release branch under FreeBSD:14:amd64.`);
    }
    if (!/^[A-Za-z0-9._-]+$/.test(branch))
        throw new OpnSenseError(`"${branch}" is not a valid branch name.`);
    const limit = opsBound(args?.limit, 1, OPS_LIST_CAP * 2, 12);
    const listing = await opsText(`${OPS_PKG}/FreeBSD:14:amd64/${encodeURIComponent(branch)}/latest/All/`);
    const files = [...listing.matchAll(/href="([^"?][^"]*\.pkg)"/g)].map((m) => m[1]);
    if (!files.length)
        throw new OpnSenseError(`No packages are listed for branch "${branch}" under FreeBSD:14:amd64.`);
    const parsed = files.map(opsSplitPkg);
    const core = parsed.filter((p) => p.name.startsWith("os-"));
    const devel = parsed.filter((p) => p.name.endsWith("-devel"));
    const wanted = String(args?.package ?? "").trim().toLowerCase();
    const hits = wanted ? parsed.filter((p) => p.name === wanted || p.name.includes(wanted)) : [];
    const out = [
        `OPNsense package repository, branch ${branch} (FreeBSD:14:amd64, latest)`,
        `${parsed.length} packages offered, of which ${core.length} are os- core packages and ${devel.length} are development builds`,
    ];
    if (wanted) {
        out.push("", `Looking for "${wanted}": ${hits.length} match(es)`, ...(hits.length
            ? hits.slice(0, limit).map((p) => `  ${p.name}-${p.version}.pkg`)
            : [`  No package name contains "${wanted}". The repository is the upstream FreeBSD pkg set plus the os- plugins, so a plugin may exist under a shorter name or not be published for this branch yet.`]));
    }
    out.push("", "Core os- packages, first " + Math.min(limit, 12) + " by name:");
    out.push(...core.slice(0, 12).map((p) => `  ${p.name.padEnd(34)} ${p.version}`));
    const versions = new Map();
    for (const p of core)
        versions.set(p.name.replace(/-devel$/, ""), p.version);
    const dupes = [...versions.entries()].filter(([n]) => n.endsWith("-devel"));
    if (dupes.length)
        out.push("", `Development builds present for ${dupes.length} core package(s); install one only when you mean to.`);
    out.push("", `A trailing _1 or _2 is the package ABI revision, not a newer upstream release, so "1.9.2_1" and "1.9.2_2" are the same upstream version rebuilt for this branch.`, "The repository is what a running firewall can install. A package missing here is not available for that branch, which is the usual reason a plugin refuses to install rather than a dependency problem.");
    return out.join("\n");
}
