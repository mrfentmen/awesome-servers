/**
 * Squarespace Commerce API client. Needs SQUARESPACE_API_KEY
 * (Settings > Developer Tools > API Keys).
 * Docs: https://developers.squarespace.com/commerce-apis/overview
 */
const BASE = "https://api.squarespace.com/1.0";
export class SquarespaceError extends Error {
}
function headers() {
    const key = process.env.SQUARESPACE_API_KEY;
    if (!key)
        throw new SquarespaceError("Set SQUARESPACE_API_KEY first (Settings > Developer Tools > API Keys).");
    return { "User-Agent": "squarespace-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}` };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new SquarespaceError("Squarespace rejected the key (401/403).");
    if (res.status === 404)
        throw new SquarespaceError("Not found.");
    if (!res.ok)
        throw new SquarespaceError(`Squarespace error ${res.status}`);
    return (await res.json());
}
export async function listProducts(limit = 10) {
    const data = await getJson(`/commerce/products?limit=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.result) ? data.result : [];
    return rows.slice(0, limit).map((p) => ({
        id: String(p.id),
        name: p.name,
        price: p.variants?.[0]?.pricing?.basePrice?.value,
        url: p.url,
    }));
}
export async function listOrders(limit = 10) {
    const data = await getJson(`/commerce/orders?limit=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.result) ? data.result : [];
    return rows.slice(0, limit).map((o) => ({
        id: String(o.id),
        created: o.createdOn ? String(o.createdOn).slice(0, 10) : undefined,
        total: o.grandTotal?.value,
        email: o.customerEmail,
    }));
}
export function formatProduct(p, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${p.id}] ${p.name ?? "(unnamed)"}${p.price ? ` — ${p.price}` : ""}${p.url ? `\n   ${p.url}` : ""}`;
}
export function formatOrder(o, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${o.id}]${o.total ? ` ${o.total}` : ""}${o.email ? ` — ${o.email}` : ""}${o.created ? ` (${o.created})` : ""}`;
}
// ---- muxH tools:
// The four existing tools read one store's products and orders through a private
// API key. These two ask about the site itself rather than the shop on it, and
// both answer from public registries that need no key at all: the RDAP record of
// the domain, and the W3C validator's reading of the published markup.
const SQ_UA = "mcfentmen-squarespace-mcp/1.1 (https://github.com/mcfentmen/squarespace-mcp)";
const RDAP = "https://rdap.org/domain/";
const NUV = "https://validator.w3.org/nu/";
const asDate = (raw) => {
    const t = Date.parse(String(raw ?? ""));
    return Number.isFinite(t) ? new Date(t) : null;
};
const years = (ms) => {
    const days = ms / 86400000;
    if (days >= 730)
        return `${(days / 365.25).toFixed(1)} years`;
    if (days >= 60)
        return `${Math.round(days / 30.44)} months`;
    return `${Math.round(days)} days`;
};
/**
 * The registration record of a domain, from the registry's own RDAP service: who
 * holds it, when it was first registered, when it expires, what locks are on it,
 * which nameservers answer, and whether DNSSEC is signed. Every site owner needs
 * this and no commerce endpoint returns it.
 */
export async function domainRegistration(args) {
    const raw = String(args.domain ?? "").trim().toLowerCase();
    const domain = raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/\.$/, "");
    if (!domain)
        throw new SquarespaceError("Give a domain name, for example example.com.");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
        throw new SquarespaceError(`"${args.domain}" does not look like a domain name.`);
    }
    let res;
    try {
        res = await fetch(`${RDAP}${encodeURIComponent(domain)}`, {
            headers: { "User-Agent": SQ_UA, Accept: "application/rdap+json, application/json" },
            redirect: "follow",
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new SquarespaceError(`Could not reach the RDAP service: ${e.message}`);
    }
    if (res.status === 404) {
        return `${domain} has no RDAP registration record. Either the domain is not registered, or its registry does not publish RDAP. The .com and .net registries answer through rdap.org, as do most gTLDs, but many ccTLD registries publish no RDAP service at all, so an empty result is not proof that a domain is unregistered.`;
    }
    if (res.status === 429) {
        throw new SquarespaceError("The RDAP service is rate-limiting this client; wait a moment before retrying.");
    }
    if (!res.ok)
        throw new SquarespaceError(`The RDAP service returned HTTP ${res.status}.`);
    const record = (await res.json());
    const event = (action) => record.events?.find((e) => e.eventAction === action)?.eventDate ?? "";
    const registered = asDate(event("registration"));
    const expires = asDate(event("expiration"));
    const changed = asDate(event("last changed"));
    const now = Date.now();
    const registrar = record.entities?.find((e) => e.roles?.includes("registrar"));
    // Some registries give the registrar as a vcard, others only as its IANA number.
    const registrarName = (entity) => {
        if (!entity)
            return "not reported";
        const vcard = entity.vcardArray;
        if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
            const props = vcard[1];
            for (let i = 0; i < props.length - 1; i += 2) {
                if (props[i] === "fn")
                    return String(props[i + 1]);
            }
        }
        if (entity.handle && /^\d+$/.test(entity.handle))
            return `IANA registrar id ${entity.handle}`;
        return entity.handle ?? "not reported";
    };
    const nameservers = (record.nameservers ?? []).map((n) => n.ldhName ?? n.unicodeName ?? "?").sort();
    const families = new Map();
    for (const ns of nameservers) {
        const key = ns.split(".").slice(-3).join(".");
        families.set(key, (families.get(key) ?? 0) + 1);
    }
    const status = record.status ?? [];
    return [
        `Registration record for ${record.ldhName ?? domain}`,
        `  registry handle: ${record.handle ?? "not reported"}`,
        `  registrar: ${registrarName(registrar)}`,
        "",
        "Dates:",
        `  registered:  ${registered ? registered.toISOString().slice(0, 10) : "not reported"}${registered ? `  (${years(now - registered.getTime())} ago)` : ""}`,
        `  expires:     ${expires ? expires.toISOString().slice(0, 10) : "not reported"}${expires ? `  (${years(expires.getTime() - now)} from now)` : ""}`,
        `  last changed:${changed ? ` ${changed.toISOString().slice(0, 10)} (${years(now - changed.getTime())} ago)` : " not reported"}`,
        `  RDAP record last refreshed: ${event("last update of RDAP database") || "not reported"}`,
        "",
        "Locks and DNSSEC:",
        `  status: ${status.length ? status.join(", ") : "none reported, which usually means the domain is freely transferable"}`,
        `  client locks: ${status.filter((s) => s.startsWith("client")).join(", ") || "none"} | server locks: ${status.filter((s) => s.startsWith("server")).join(", ") || "none"}`,
        `  DNSSEC: ${record.secureDNS?.delegationSigned === true ? "signed" : record.secureDNS?.delegationSigned === false ? "not signed" : "not reported"}`,
        "",
        "Nameservers:",
        ...(nameservers.length
            ? nameservers.map((ns, i) => `  ${String(i + 1).padStart(2)}. ${ns}`)
            : ["  none published"]),
        families.size
            ? `  ${families.size} provider group(s): ${[...families.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} x${n}`).join(", ")}`
            : "",
        "",
        "Read as: age tells you how established the site is, the expiry gap tells you how much runway the owner has before a lapse, and a client lock means the domain cannot be changed without the registrar releasing it. This is the registry's own record, not the hosting account, so a domain can point somewhere other than where the site appears to live.",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
/**
 * What the W3C's Nu validator makes of a published page: the errors and warnings
 * grouped by rule, the first of each with a line number, and the document type it
 * detected. This is the check to run before shipping markup, and it catches the
 * errors a browser silently tolerates.
 */
export async function pageValidation(args) {
    const raw = String(args.url ?? "").trim();
    if (!raw)
        throw new SquarespaceError("Give the address of a published page to validate.");
    const target = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let parsed;
    try {
        parsed = new URL(target);
    }
    catch {
        throw new SquarespaceError(`"${args.url}" is not a URL.`);
    }
    const limit = Math.min(Math.max(Number(args.limit ?? 8) || 8, 1), 40);
    let res;
    try {
        res = await fetch(`${NUV}?doc=${encodeURIComponent(parsed.href)}&out=json`, {
            headers: { "User-Agent": SQ_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(45000),
        });
    }
    catch (e) {
        throw new SquarespaceError(`Could not reach the W3C validator: ${e.message}`);
    }
    if (res.status === 429) {
        throw new SquarespaceError("The W3C validator is rate-limiting this client; wait a moment before retrying.");
    }
    if (res.status === 400 || res.status === 503) {
        throw new SquarespaceError(`The W3C validator could not fetch ${parsed.href} (HTTP ${res.status}); the page may refuse automated requests.`);
    }
    if (!res.ok)
        throw new SquarespaceError(`The W3C validator returned HTTP ${res.status}.`);
    const report = (await res.json());
    const messages = report.messages ?? [];
    const errors = messages.filter((m) => m.type === "error");
    const warnings = messages.filter((m) => m.type === "info");
    const info = messages.filter((m) => m.type === "info" && m.subType === "info");
    const byRule = new Map();
    for (const m of errors) {
        const key = m.rule ?? "unclassified";
        byRule.set(key, (byRule.get(key) ?? 0) + 1);
    }
    const at = (m) => (m.lastLine ? `line ${m.lastLine}${m.lastColumn ? `:${m.lastColumn}` : ""}` : "no line reported");
    const block = (label, rows) => rows.length
        ? [
            `${label}:`,
            ...rows.slice(0, limit).map((m, i) => `  ${String(i + 1).padStart(2)}. ${at(m)}${m.rule ? ` [${m.rule}]` : ""}\n      ${String(m.message ?? "").slice(0, 170)}`),
            ...(rows.length > limit ? [`  (+${rows.length - limit} more of this kind)`] : []),
        ]
        : [`${label}: none reported`];
    return [
        `Markup validation of ${report.url ?? parsed.href}`,
        `  validator: W3C Nu (${report.version ?? "version not reported"})`,
        `  ${messages.length} message(s) in total: ${errors.length} error(s), ${warnings.length} warning(s)${info.length ? `, of which ${info.length} informational` : ""}`,
        "",
        ...(errors.length
            ? ["Errors by rule:", ...[...byRule.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([rule, n]) => `  ${String(n).padStart(4)}  ${rule}`), ""]
            : ["No errors were reported, so the markup matches the validator's reading of the specification.", ""]),
        ...block("First errors", errors),
        "",
        ...block("First warnings", warnings),
        "",
        "This is the HTML validator, so it reports only markup problems and says nothing about layout, scripts, speed or accessibility. It fetches the page as an ordinary client, so anything behind a login, a cookie wall or a bot check will be validated as whatever that client was served. The validator's own reading of the spec is not a legal standard.",
    ].join("\n");
}
