export class PlaidError extends Error {
    constructor(message) {
        super(message);
        this.name = "PlaidError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function creds() {
    const id = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    if (!id || !secret)
        throw new PlaidError("Set PLAID_CLIENT_ID and PLAID_SECRET (Plaid sandbox).");
    return { id, secret };
}
async function post(path, extra = {}) {
    const { id, secret } = creds();
    let res;
    try {
        res = await fetch("https://sandbox.plaid.com" + path, {
            method: "POST",
            headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", "PLAID-CLIENT-ID": id, "PLAID-SECRET": secret },
            body: JSON.stringify(extra),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new PlaidError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new PlaidError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 8000);
}
export function listInstitutions(count) {
    const n = Math.min(Number(count ?? 10) || 10, 100);
    return post("/institutions/search", { query: "bank", products: ["transactions"], country_codes: ["US"], options: { include_optional_metadata: false } }).then((t) => {
        try {
            const d = JSON.parse(t);
            return JSON.stringify((d.institutions ?? []).slice(0, n), null, 2);
        }
        catch {
            return t.slice(0, 4000);
        }
    });
}
export function listCategories() {
    return post("/categories/get", {});
}
export function sandboxToken(institutionId) {
    return post("/sandbox/public_token/create", {
        institution_id: institutionId ?? "ins_109508",
        initial_products: ["transactions"],
    });
}
export function getInstitution(institutionId) {
    return post("/institutions/get_by_id", { institution_id: institutionId });
}
export function sandboxBalance(accessToken) {
    return post("/accounts/balance/get", { access_token: accessToken });
}
export function sandboxTransactions(accessToken, days) {
    const d = Math.min(Number(days ?? 30) || 30, 730);
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
    return post("/transactions/sync", { access_token: accessToken, count: 20 }).then((t) => t.slice(0, 12000));
}
export function sandboxHoldings(accessToken) {
    return post("/investments/holdings/get", { access_token: accessToken });
}
export function sandboxLiabilities(accessToken) {
    return post("/liabilities/get", { access_token: accessToken });
}
export function sandboxAuth(accessToken) {
    return post("/auth/get", { access_token: accessToken });
}
export function sandboxIdentity(accessToken) {
    return post("/identity/get", { access_token: accessToken });
}
// ---- muxH tools:
// Every tool above needs Plaid credentials and reads a sandbox account. The
// FDIC publishes the call reports every US bank files, keylessly, so these
// tools answer "how healthy is that institution" without any account at all.
const FDIC = "https://api.fdic.gov/banks";
const FDIC_UA = "plaid-mcp/1.2 (https://github.com/mrfentmen/plaid-mcp)";
const fdciRows = (body) => Array.isArray(body.data) ? body.data.map((row) => row?.data ?? {}).filter((row) => Object.keys(row).length > 0) : [];
async function fdciGet(path) {
    const res = await fetch(`${FDIC}${path}`, {
        headers: { Accept: "application/json", "User-Agent": FDIC_UA },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 400)
        throw new PlaidError("The FDIC rejected the query. Check the certificate number or field names.");
    if (!res.ok)
        throw new PlaidError(`FDIC BankFind API error ${res.status}: ${res.statusText}`);
    return (await res.json());
}
const usd = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n))
        return "not reported";
    if (Math.abs(n) >= 1e9)
        return `$${(n / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 })}B`;
    if (Math.abs(n) >= 1e6)
        return `$${(n / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};
const pct = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? `${n.toFixed(2)}%` : "not reported";
};
const cleanDate = (value) => {
    const raw = String(value ?? "");
    if (/^\d{8}$/.test(raw))
        return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [m, d, y] = raw.split("/");
        return `${y}-${m}-${d}`;
    }
    return raw || "not reported";
};
const CERT_FIELDS = "CERT,NAME,CITY,STALP,ASSET,DEP,ESTYMD,REPDTE,ACTIVE,REGAGNT,SPECIALIZ,CLASSBK,INTLNET";
/**
 * Find a US bank by name and report its call-report basics: where it is, when
 * it was founded, its total assets and deposits, and its regulator.
 */
export async function findBank(args) {
    const name = (args.name ?? "").trim();
    if (name.length < 2)
        throw new PlaidError("Give at least two characters of the bank's name.");
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 5), 1), 20);
    const body = await fdciGet(`/institutions?search=NAME:%22${encodeURIComponent(name)}%22&fields=${CERT_FIELDS}&limit=${size}&format=json`);
    const rows = fdciRows(body);
    if (!rows.length)
        throw new PlaidError(`The FDIC call-report database has no institution matching "${name}".`);
    return [
        `US banks matching "${name}" (${body.totals?.count ?? rows.length} in the database, showing ${rows.length})`,
        "",
        ...rows.map((row, i) => [
            `${String(i + 1).padStart(2)}. ${String(row.NAME ?? "unnamed")} — certificate ${String(row.CERT ?? "not reported")}`,
            `    ${String(row.CITY ?? "city not reported")}, ${String(row.STALP ?? "state not reported")} | founded ${String(row.ESTYMD ?? "not reported")}`,
            `    assets ${usd(row.ASSET)} | deposits ${usd(row.DEP)} | report date ${cleanDate(row.REPDTE)}`,
            `    regulator ${String(row.REGAGNT ?? "not reported")} | international banking facility ${row.INTLNET === 1 ? "yes" : "no"} | primary depositor ${row.SPECIALIZ === 1 ? "yes" : "no"}`,
        ].join("\n")),
        "",
        "Source: FDIC BankFind call report data, a public dataset.",
    ].join("\n");
}
/**
 * One institution's financial health over time from its quarterly call reports:
 * size, profitability and net interest margin, and how each has moved.
 */
export async function bankHealth(args) {
    const cert = (args.cert ?? "").trim();
    if (!/^\d{1,6}$/.test(cert))
        throw new PlaidError("Give the FDIC certificate number, the digits after the routing number, e.g. 3511.");
    const quarters = Math.min(Math.max(Math.trunc(args.quarters ?? 8), 2), 20);
    const body = await fdciGet(`/financials?filters=CERT:${encodeURIComponent(cert)}&fields=CERT,ASSET,DEP,NETINC,ROA,ROE,NIMY,REPDTE&limit=${quarters}&format=json&sort_by=REPDTE&sort_order=DESC`);
    const rows = fdciRows(body);
    if (!rows.length)
        throw new PlaidError(`No quarterly financials are filed for certificate ${cert}.`);
    const name = await fdciGet(`/institutions?filters=CERT:${encodeURIComponent(cert)}&fields=NAME,CITY,STALP&limit=1&format=json`);
    const bank = fdciRows(name)[0] ?? {};
    const latest = rows[0];
    const oldest = rows[rows.length - 1];
    const assetGrowth = Number(oldest.ASSET) > 0 ? ((Number(latest.ASSET) - Number(oldest.ASSET)) / Number(oldest.ASSET)) * 100 : null;
    return [
        `Call-report health for ${String(bank.NAME ?? `certificate ${cert}`)} (cert ${cert}${bank.CITY ? `, ${String(bank.CITY)}, ${String(bank.STALP)}` : ""})`,
        `  ${rows.length} quarter(s) filed, ${cleanDate(oldest.REPDTE)} to ${cleanDate(latest.REPDTE)}`,
        "",
        "  quarter     assets        deposits      net income     ROA        ROE        NIM",
        ...rows.map((row) => `  ${cleanDate(row.REPDTE).padEnd(11)} ${usd(row.ASSET).padEnd(13)} ${usd(row.DEP).padEnd(13)} ${usd(row.NETINC).padEnd(14)} ${pct(row.ROA).padEnd(10)} ${pct(row.ROE).padEnd(10)} ${pct(row.NIMY)}`),
        "",
        assetGrowth === null
            ? "Asset growth cannot be computed from the first filing."
            : `Total assets moved ${assetGrowth >= 0 ? "up" : "down"} ${Math.abs(assetGrowth).toFixed(1)}% over the window; the latest filing reports a return on assets of ${pct(latest.ROA)}.`,
        "Source: FDIC BankFind call report data. ROA, ROE and NIM are as filed, not normalised.",
    ].join("\n");
}
/**
 * The largest active banks in a US state, by total assets, with their deposit
 * base and regulator, which is how a customer compares a local bank.
 */
export async function banksByState(args) {
    const state = (args.state ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(state))
        throw new PlaidError("Give a two-letter US state code, e.g. 'OH' or 'CA'.");
    const size = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 25);
    const body = await fdciGet(`/institutions?filters=ACTIVE:1+STALP:${encodeURIComponent(state)}&fields=NAME,CITY,STALP,ASSET,DEP,CERT,REPDTE,REGAGNT&limit=${size}&format=json&sort_by=ASSET&sort_order=DESC`);
    const rows = fdciRows(body);
    if (!rows.length)
        throw new PlaidError(`The FDIC database lists no active bank headquartered in ${state}.`);
    const totalAssets = rows.reduce((sum, row) => sum + (Number(row.ASSET) || 0), 0);
    const totalDeposits = rows.reduce((sum, row) => sum + (Number(row.DEP) || 0), 0);
    return [
        `Largest active banks headquartered in ${state} (${body.totals?.count ?? rows.length} active, showing ${rows.length})`,
        "",
        ...rows.map((row, i) => `${String(i + 1).padStart(2)}. ${String(row.NAME ?? "unnamed").slice(0, 46).padEnd(46)} — ${usd(row.ASSET).padStart(9)} assets | ${usd(row.DEP).padStart(9)} deposits | cert ${String(row.CERT ?? "?").padEnd(6)} | ${String(row.CITY ?? "?")}`),
        "",
        `Shown total: ${usd(totalAssets)} of assets and ${usd(totalDeposits)} of deposits across these ${rows.length} bank(s).`,
        `Latest report date in this set: ${cleanDate(rows[0].REPDTE)}.`,
        "Source: FDIC BankFind call report data, a public dataset.",
    ].join("\n");
}
