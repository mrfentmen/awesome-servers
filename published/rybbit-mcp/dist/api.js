export class RybbitError extends Error {
    constructor(message) {
        super(message);
        this.name = "RybbitError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new RybbitError(`Set the ${name} environment variable.`);
    return v;
}
async function authHeaders() {
    return { Authorization: "Bearer " + envStrict("RYBBIT_API_KEY") };
}
function rybbitBase() {
    return (process.env.RYBBIT_BASE_URL ?? "https://app.rybbit.io").replace(/\/$/, "");
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(url, init = {}) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new RybbitError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getOverview(site, startDate, endDate, timeZone) {
    const base = rybbitBase();
    const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
    qs.append("time_zone", timeZone ?? "UTC");
    const data = await req(`${base}/api/sites/${encodeURIComponent(site)}/overview?${qs.toString()}`);
    return pretty(data);
}
export async function listUsers(site, startDate, endDate, timeZone, limit) {
    const base = rybbitBase();
    const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
    qs.append("time_zone", timeZone ?? "UTC");
    qs.append('limit', String(limit ?? 20));
    const data = await req(`${base}/api/sites/${encodeURIComponent(site)}/users?${qs.toString()}`);
    return pretty(data);
}
export async function getJourneys(site, startDate, endDate, timeZone) {
    const base = rybbitBase();
    const qs = new URLSearchParams({ start_date: startDate, end_date: endDate });
    qs.append("time_zone", timeZone ?? "UTC");
    const data = await req(`${base}/api/sites/${encodeURIComponent(site)}/journeys?${qs.toString()}`);
    return pretty(data);
}
// ---- muxH tools:
// Rybbit reads traffic from a site. These two read the two things that sit
// underneath the traffic: who actually owns the domain it is attributed to, and
// which measurement tags the page itself loads. Both are answerable without a
// Rybbit account and both change how the numbers should be read.
const RDAP = "https://rdap.org/domain";
const RY_UA = "mcfentmen-rybbit-mcp/1.2 (https://github.com/mcfentmen/rybbit-mcp)";
async function rdapGet(domain) {
    const res = await fetch(`${RDAP}/${encodeURIComponent(domain)}`, {
        headers: { Accept: "application/rdap+json, application/json", "User-Agent": RY_UA },
        redirect: "follow",
        signal: AbortSignal.timeout(25000),
    });
    const body = (await res.json().catch(() => ({})));
    if (res.status === 404 || body.errorCode === 404) {
        throw new RybbitError(`No registry record for "${domain}". It may be a subdomain, an unregistered name, or a ccTLD RDAP does not serve.`);
    }
    if (!res.ok)
        throw new RybbitError(`RDAP error ${res.status}: ${res.statusText}`);
    return body;
}
/** Pull the organisation or the person out of a jCard so the registrar is readable. */
function entityName(entity) {
    const rows = entity.vcardArray?.[1];
    if (!Array.isArray(rows))
        return entity.handle ?? "not reported";
    const value = rows.find((row) => Array.isArray(row) && (row[0] === "fn" || row[0] === "org"));
    if (value?.[3])
        return String(value[3]);
    return entity.handle ?? "not reported";
}
const daysUntil = (iso) => {
    if (!iso)
        return null;
    const target = Date.parse(iso);
    if (!Number.isFinite(target))
        return null;
    return Math.round((target - Date.now()) / 86400000);
};
/**
 * The registry record behind a domain the analytics is attributed to: who holds
 * it, who the registrar is, when it was registered, when it expires and what
 * locks are set on it. A domain registered last week cannot have a history.
 */
export async function domainProfile(args) {
    const domain = (args.domain ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(domain)) {
        throw new RybbitError(`"${args.domain}" does not look like a domain name.`);
    }
    const body = await rdapGet(domain);
    const registrar = (body.entities ?? []).find((e) => (e.roles ?? []).includes("registrar"));
    const registrant = (body.entities ?? []).find((e) => (e.roles ?? []).includes("registrant"));
    const event = (action) => body.events?.find((e) => e.eventAction === action)?.eventDate;
    const registered = event("registration");
    const expires = event("expiration");
    const changed = event("last changed");
    const sinceRegistration = daysUntil(registered);
    const ageDays = sinceRegistration === null ? null : -sinceRegistration;
    const expiryDays = daysUntil(expires);
    const nameservers = (body.nameservers ?? []).map((n) => n.ldhName).filter((v) => Boolean(v));
    const notes = [];
    if (ageDays !== null && ageDays < 90) {
        notes.push(`the domain was registered ${ageDays} day(s) ago, so it cannot yet have the multi-year history a returning visitor implies`);
    }
    if (expiryDays !== null && expiryDays < 180) {
        notes.push(`the registration expires in ${expiryDays} day(s), which is worth flagging on any report attributed to this domain`);
    }
    if ((body.status ?? []).includes("clientTransferProhibited")) {
        notes.push("clientTransferProhibited is set, so a hijack attempt cannot move the domain");
    }
    if (nameservers.length && new Set(nameservers).size < 2) {
        notes.push(`only ${nameservers.length} name server is published, which is a single point of failure for resolution`);
    }
    return [
        `Registry record for ${body.ldhName ?? domain}`,
        `  handle: ${body.handle ?? "not reported"}`,
        `  registrar: ${registrar ? entityName(registrar) : "not published (redacted under GDPR)"}`,
        registrant ? `  registrant: ${entityName(registrant)}` : "  registrant: not published (redacted under GDPR)",
        "",
        "Dates:",
        `  registered: ${registered ? `${registered.slice(0, 10)}${ageDays !== null ? ` (${ageDays} day(s) ago)` : ""}` : "not reported"}`,
        `  last changed: ${changed ? changed.slice(0, 10) : "not reported"}`,
        `  expires: ${expires ? `${expires.slice(0, 10)}${expiryDays !== null ? ` (in ${expiryDays} day(s))` : ""}` : "not reported"}`,
        "",
        `  DNSSEC: ${body.secureDNS?.delegationSigned === true ? "signed" : body.secureDNS?.delegationSigned === false ? "not signed" : "not reported"}`,
        `  status: ${(body.status ?? []).join(" | ") || "none published"}`,
        `  name servers (${nameservers.length}): ${nameservers.slice(0, 6).join(", ") || "none published"}${nameservers.length > 6 ? `, +${nameservers.length - 6} more` : ""}`,
        "",
        notes.length ? `Worth knowing before the numbers are read:` : "Nothing in the registry record qualifies the traffic data.",
        ...notes.map((n) => `  - ${n}`),
        "",
        "Source: RDAP, the registry's own protocol for domain registration data. A redacted registrant is normal under GDPR and is not a missing record.",
    ].join("\n");
}
const TAG_RULES = [
    { kind: "GA4 measurement ID", pattern: /\bG-[A-Z0-9]{6,12}\b/g },
    { kind: "Google Tag Manager container", pattern: /\bGTM-[A-Z0-9]{4,10}\b/g },
    { kind: "Universal Analytics property", pattern: /\bUA-\d{4,10}-\d{1,4}\b/g },
    { kind: "Meta Pixel", pattern: /fbq\(\s*["']init["']\s*,\s*["'](\d{6,20})["']/g },
    { kind: "LinkedIn Insight", pattern: /_linkedin_partner_id\s*=\s*["']?(\d{4,8})/g },
    { kind: "Hotjar site ID", pattern: /hjsSettings\s*=\s*\{[^}]*hjid\s*:\s*(\d{4,10})/g },
    { kind: "Plausible domain", pattern: /data-domain=["']([a-z0-9.-]+)["'][^>]*src=["'][^"']*plausible\.io/g },
    { kind: "Fathom site ID", pattern: /fathom\.io\/js\/[a-z0-9.]*\.js\?siteId=([A-Z0-9]{6,10})/gi },
    { kind: "Matomo site ID", pattern: /_paq\.push\(\[\s*["']setSiteId["']\s*,\s*["']?(\d{1,4})/g },
    { kind: "Microsoft Clarity project", pattern: /clarity(["',\s]+)ms["',\s]+(\w{6,10})/g },
];
const HOST_RULES = [
    { kind: "Google Analytics", pattern: /google-analytics\.com|googletagmanager\.com\/gtag/i },
    { kind: "Google Tag Manager", pattern: /googletagmanager\.com\/gtm\.js/i },
    { kind: "Segment", pattern: /cdn\.segment\.com/i },
    { kind: "Mixpanel", pattern: /cdn\.mxpnl\.com|mixpanel/i },
    { kind: "Amplitude", pattern: /api\.amplitude\.com/i },
    { kind: "Hotjar", pattern: /static\.hotjar\.com|script\.hotjar\.com/i },
    { kind: "Plausible", pattern: /plausible\.io\/js/i },
    { kind: "Fathom", pattern: /cdn\.usefathom\.com/i },
    { kind: "Matomo", pattern: /matomo\.js|piwik\.js/i },
    { kind: "Cloudflare Insights", pattern: /static\.cloudflareinsights\.com/i },
    { kind: "FullStory", pattern: /fullstory\.com/i },
    { kind: "LogRocket", pattern: /cdn\.logrocket\.com/i },
    { kind: "New Relic browser", pattern: /bam\.nr-data\.com|newrelic\.com\/js/i },
    { kind: "Datadog RUM", pattern: /browser-intake-datadoghq\.com/i },
    { kind: "Sentry", pattern: /sentry-cdn\.com|cdn\.sentry-capture/i },
    { kind: "Intercom", pattern: /widget\.intercom\.io/i },
    { kind: "Drift", pattern: /js\.driftt\.com/i },
    { kind: "Facebook Pixel", pattern: /connect\.facebook\.net\/[^"']*\/fbevents\.js/i },
];
/**
 * Which measurement tags a page actually loads, read from the live HTML: the
 * vendor scripts, the specific container and property ids, and the frameworks
 * that usually decide how a site is built. Anything reporting traffic needs to
 * know what is being counted before it counts it.
 */
export async function trackingAudit(args) {
    const raw = (args.url ?? "").trim();
    if (!raw)
        throw new RybbitError("Give a URL to audit, e.g. https://example.com");
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let target;
    try {
        target = new URL(url);
    }
    catch {
        throw new RybbitError(`"${raw}" is not a URL.`);
    }
    const size = Math.min(Math.max(Number(args.limit) || 10 || 10, 1), 25);
    let res;
    try {
        res = await fetch(target, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; rybbit-mcp)", Accept: "text/html,*/*" },
            redirect: "follow",
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new RybbitError(`Could not fetch ${target.hostname}: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (!res.ok)
        throw new RybbitError(`${target.hostname} answered HTTP ${res.status}, so no page was audited.`);
    const contentType = res.headers.get("content-type") ?? "not reported";
    const html = (await res.text()).slice(0, 1200000);
    if (!/text\/html/i.test(contentType)) {
        return `${target.toString()} answered ${contentType}, which is not a page, so there are no tags to audit.`;
    }
    const vendors = HOST_RULES.filter((rule) => rule.pattern.test(html)).map((rule) => rule.kind);
    const ids = [];
    for (const rule of TAG_RULES) {
        const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : `${rule.pattern.flags}g`);
        for (const match of html.matchAll(pattern)) {
            const value = match[match.length - 1];
            if (value && !ids.some((hit) => hit.kind === rule.kind && hit.id === value))
                ids.push({ kind: rule.kind, id: value });
        }
    }
    const framework = /__NEXT_DATA__/.test(html) ? "Next.js"
        : /id=["']__nuxt/.test(html) ? "Nuxt"
            : /wp-content|wp-includes/.test(html) ? "WordPress"
                : /Shopify\.theme|cdn\.shopify\.com/.test(html) ? "Shopify"
                    : /data-reactroot|__remixContext/.test(html) ? "React or Remix"
                        : /svelte-[a-z0-9]{6}|__sveltekit/.test(html) ? "SvelteKit"
                            : /astro-island|data-astro/.test(html) ? "Astro"
                                : /window\.__INITIAL_STATE__/.test(html) ? "unknown single-page app"
                                    : "not detected from the markup";
    const consent = /cookie-?banner|consent|gdpr|onetrust|cookiebot/i.test(html);
    const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.replace(/\s+/g, " ").trim();
    return [
        `Tracking audit for ${target.toString()}`,
        `  HTTP ${res.status} | ${contentType} | ${Buffer.byteLength(html).toLocaleString()} bytes of HTML read`,
        `  page title: ${title ? title.slice(0, 100) : "not reported"}`,
        `  framework: ${framework}`,
        `  consent or cookie tooling referenced: ${consent ? "yes" : "no"}`,
        "",
        `Measurement vendors referenced (${vendors.length}):`,
        ...(vendors.length ? vendors.slice(0, size).map((v, i) => `  ${String(i + 1).padStart(2)}. ${v}`) : ["  none of the common browser analytics vendors appear in the markup"]),
        vendors.length > size ? `  (+${vendors.length - size} more)` : "",
        "",
        `Identifiers found in the page (${ids.length}):`,
        ...(ids.length ? ids.slice(0, size).map((hit, i) => `  ${String(i + 1).padStart(2)}. ${hit.kind.padEnd(30)} ${hit.id}`) : ["  none: no measurement id was found in the served HTML"]),
        ids.length > size ? `  (+${ids.length - size} more)` : "",
        "",
        ids.length === 0
            ? "No measurement id in the served HTML. Either the site sends nothing, or the tag is injected after load, which a plain fetch cannot see."
            : "More than one measurement id means the page is being counted more than once, which double-counts sessions in any analytics tool reading it.",
        "",
        "Read from the served HTML only; tags added by client-side script after the first paint are not visible to a fetch and would not be listed.",
    ].join("\n");
}
