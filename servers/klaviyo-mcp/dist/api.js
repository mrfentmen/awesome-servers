export class KlaviyoError extends Error {
    constructor(message) {
        super(message);
        this.name = "KlaviyoError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.KLAVIYO_API_KEY;
    if (!k)
        throw new KlaviyoError("Set KLAVIYO_API_KEY (Klaviyo private key).");
    return { ...UA, Accept: "application/json", Authorization: `Klaviyo-API-Key ${k}`, revision: "2024-10-15" };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://a.klaviyo.com/api" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new KlaviyoError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new KlaviyoError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function listProfiles() {
    return get("/profiles/?page[size]=10");
}
export function listLists() {
    return get("/lists/?page[size]=20");
}
export function listCampaigns() {
    return get("/campaigns/?page[size]=10");
}
export function profileDetails(profileId) {
    return get(`/profiles/${encodeURIComponent(profileId)}/`);
}
export function listDetails(listId) {
    return get(`/lists/${encodeURIComponent(listId)}/`);
}
export function campaignDetails(campaignId) {
    return get(`/campaigns/${encodeURIComponent(campaignId)}/`);
}
export function metrics() {
    return get("/metrics/?page[size]=20");
}
export function events() {
    return get("/events/?page[size]=10");
}
export function flows() {
    return get("/flows/?page[size]=10");
}
export function segments() {
    return get("/segments/?page[size]=20");
}
// ---- muxG tools:
const DISPOSABLE_LIST = "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf";
const KLAVIYO_DOH = "https://dns.google/resolve";
let disposableDomains = null;
let disposableAt = 0;
const LIST_TTL_MS = 30 * 60 * 1000;
async function disposableBlocklist() {
    if (disposableDomains && Date.now() - disposableAt < LIST_TTL_MS)
        return disposableDomains;
    const res = await fetch(DISPOSABLE_LIST, {
        headers: { ...UA, Accept: "text/plain" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new KlaviyoError(`The disposable domain list returned ${res.status}`);
    const text = await res.text();
    if (!text.trim())
        throw new KlaviyoError("The disposable domain list came back empty.");
    const set = new Set();
    for (const line of text.split("\n")) {
        const value = line.trim().toLowerCase();
        if (value && !value.startsWith("#"))
            set.add(value);
    }
    disposableDomains = set;
    disposableAt = Date.now();
    return set;
}
const domainOf = (value) => {
    const raw = String(value ?? "").trim().toLowerCase();
    const at = raw.lastIndexOf("@");
    const host = at >= 0 ? raw.slice(at + 1) : raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host))
        throw new KlaviyoError(`"${value}" does not contain a domain name.`);
    return host;
};
/** Would this signup address land in a throwaway inbox? The disposable domain blocklist says so before you send a welcome email. */
export async function disposableCheck(args) {
    const host = domainOf(args?.email);
    const list = await disposableBlocklist();
    const related = (args?.related ?? []).map((value) => domainOf(value)).filter((value) => value !== host);
    const labels = [host, ...related];
    const lines = [
        `Disposable inbox check for ${args?.email} using the ${list.size.toLocaleString("en-US")} domain blocklist`,
    ];
    for (const label of labels) {
        const exact = list.has(label);
        const registrable = label.split(".").slice(-2).join(".");
        const parent = !exact && list.has(registrable) ? registrable : null;
        const tagged = list.has(`mailinator.com`) ? null : null;
        void tagged;
        const verdict = exact ? "BLOCKED - the domain itself is on the list" : parent ? `BLOCKED - the parent domain ${parent} is on the list` : "not on the list";
        lines.push(`  ${label}: ${verdict}`);
    }
    lines.push("");
    lines.push("Being on the list means the address is very likely to be temporary, not that it is malicious. Providers such as Gmail and Outlook are not on it.");
    return lines.join("\n");
}
async function doh(type, name) {
    const res = await fetch(`${KLAVIYO_DOH}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, {
        headers: { ...UA, Accept: "application/dns-json" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new KlaviyoError(`DNS-over-HTTPS returned ${res.status}`);
    return (await res.json());
}
/** Is this sending domain set up to be delivered? MX, SPF, DKIM selectors and DMARC, read live from DNS. */
export async function sendingReadiness(args) {
    const host = domainOf(args?.domain);
    const lines = [`Sending readiness for ${host}, read live from Google Public DNS over HTTPS.`];
    const mx = await doh("MX", host);
    const mxRows = (mx.Answer ?? []).map((row) => String(row.data ?? "")).filter(Boolean);
    lines.push("");
    lines.push(`MX: ${mxRows.length} exchanger(s)${mxRows.length ? "" : " - nothing published, so mail to this domain has nowhere to land"}`);
    for (const row of mxRows.slice(0, 6)) {
        const [priority, exchange] = row.split(/\s+/);
        lines.push(`  priority ${priority ?? "?"} ${exchange ?? row}`);
    }
    if (mxRows.length > 6)
        lines.push(`  ...and ${mxRows.length - 6} more.`);
    const txt = await doh("TXT", host);
    const txtRows = (txt.Answer ?? []).map((row) => String(row.data ?? "")).filter(Boolean);
    const spf = txtRows.find((row) => /^v=spf1/i.test(row));
    const dmarcRecord = await doh("TXT", `_dmarc.${host}`).catch(() => null);
    const dmarc = (dmarcRecord?.Answer ?? []).map((row) => String(row.data ?? "")).find(Boolean) ?? null;
    lines.push("");
    lines.push(`SPF: ${spf ?? "no v=spf1 record at the apex"}`);
    lines.push(`DMARC: ${dmarc ?? "no _dmarc TXT record"}`);
    const selectors = (args?.dkim_selectors ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean).slice(0, 8);
    const found = [];
    const missing = [];
    for (const selector of selectors) {
        const answer = await doh("TXT", `${selector}._domainkey.${host}`).catch(() => null);
        const rows = (answer?.Answer ?? []).map((row) => String(row.data ?? "")).filter(Boolean);
        if (rows.length)
            found.push(`${selector} (${rows.length} TXT record(s))`);
        else
            missing.push(selector);
    }
    lines.push("");
    lines.push(`DKIM: ${selectors.length ? `${found.length} of ${selectors.length} selector(s) answered${found.length ? ` - ${found.join(", ")}` : ""}${missing.length ? `; no record for ${missing.join(", ")}` : ""}` : "pass the selectors to check, e.g. dkim or google; the selector list is not discoverable from DNS"}`);
    const gaps = [];
    if (!mxRows.length)
        gaps.push("no MX record");
    if (!spf)
        gaps.push("no SPF record");
    if (!dmarc)
        gaps.push("no DMARC record");
    lines.push("");
    lines.push(gaps.length ? `Gaps found: ${gaps.join("; ")}.` : "MX, SPF and DMARC all resolve. DKIM can only be confirmed for the selectors you name.");
    lines.push("DNS records are not proof that your Klaviyo account is configured to use them; a warm-up state and list hygiene still decide inbox placement.");
    return lines.join("\n");
}
