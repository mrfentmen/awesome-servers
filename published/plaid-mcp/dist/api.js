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
    if (Math.abs(n) >= 1e12)
        return `$${(n / 1e12).toLocaleString(undefined, { maximumFractionDigits: 2 })}T`;
    if (Math.abs(n) >= 1e9)
        return `$${(n / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 })}B`;
    if (Math.abs(n) >= 1e6)
        return `$${(n / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
    return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};
// FDIC call-report money fields are thousands of dollars, so 1907928000 is
// $1.9 trillion, not $1.9 billion.
const fdicUsd = (value) => (Number.isFinite(Number(value)) ? usd(Number(value) * 1000) : "not reported");
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
            `    assets ${fdicUsd(row.ASSET)} | deposits ${fdicUsd(row.DEP)} | report date ${cleanDate(row.REPDTE)}`,
            `    regulator ${String(row.REGAGNT ?? "not reported")} | international banking facility ${row.INTLNET === 1 ? "yes" : "no"} | primary depositor ${row.SPECIALIZ === 1 ? "yes" : "no"}`,
        ].join("\n")),
        "",
        "Source: FDIC BankFind call report data, a public dataset.",
    ].join("\n");
}
const FINANCIAL_FIELDS = "REPDTE,ASSET,DEP,NETINC,ROA,ROE,NIMY";
/** One bank's filed quarters, newest first, from the FDIC call report. */
export async function bankHealth(args) {
    const cert = String(args?.cert ?? "").trim().replace(/[^0-9]/g, "");
    if (!cert)
        throw new PlaidError("Give an FDIC certificate number, the digits that follow the routing number.");
    const quarters = Math.round(Math.min(Math.max(Number(args?.quarters ?? 8) || 8, 2), 20));
    const body = await fdciGet(`/financials?filters=CERT:${cert}&fields=${FINANCIAL_FIELDS}&sort_by=REPDTE&sort_order=DESC&limit=${quarters}&format=json`);
    const rows = fdciRows(body);
    if (!rows.length)
        throw new PlaidError(`The FDIC has no call report filed under certificate ${cert}. A credit union is not in this dataset, and a bank that closed has no current filing.`);
    const first = rows[rows.length - 1];
    const latest = rows[0];
    const change = (a, b) => (Number.isFinite(Number(a)) && Number.isFinite(Number(b)) && Number(b) !== 0 ? ((Number(a) - Number(b)) / Number(b)) * 100 : null);
    const assetChange = change(latest.ASSET, first.ASSET);
    const lines = [
        `FDIC certificate ${cert} — call report health over ${rows.length} quarter(s)`,
        `  newest filing    ${cleanDate(latest.REPDTE)} | assets ${fdicUsd(latest.ASSET)} | deposits ${fdicUsd(latest.DEP)}`,
        `  net income       ${fdicUsd(latest.NETINC)} for the quarter`,
        `  return on assets ${Number.isFinite(Number(latest.ROA)) ? `${Number(latest.ROA).toFixed(2)}%` : "not reported"}`,
        `  return on equity ${Number.isFinite(Number(latest.ROE)) ? `${Number(latest.ROE).toFixed(2)}%` : "not reported"}`,
        `  net interest margin ${Number.isFinite(Number(latest.NIMY)) ? `${Number(latest.NIMY).toFixed(2)}%` : "not reported"}`,
        assetChange === null ? "  asset growth     not comparable across the window" : `  asset growth     ${assetChange >= 0 ? "+" : ""}${assetChange.toFixed(1)}% from ${cleanDate(first.REPDTE)}`,
        "",
        "  reported     assets        deposits      net income    ROA     ROE     NIM",
        ...rows.map((r) => `  ${cleanDate(r.REPDTE)}  ${fdicUsd(r.ASSET).padStart(11)}  ${fdicUsd(r.DEP).padStart(12)}  ${fdicUsd(r.NETINC).padStart(12)}  ${Number.isFinite(Number(r.ROA)) ? `${Number(r.ROA).toFixed(2)}%` : "-"}  ${Number.isFinite(Number(r.ROE)) ? `${Number(r.ROE).toFixed(2)}%` : "-"}  ${Number.isFinite(Number(r.NIMY)) ? `${Number(r.NIMY).toFixed(2)}%` : "-"}`),
        "",
        "note: these are figures the bank filed with its regulator, not a measure of whether it is sound. A quarter with no filing is a reporting gap, and a bank that merged keeps its certificate, so a jump in assets can be an acquisition rather than growth.",
    ];
    return lines.join("\n");
}
/** The biggest active banks headquartered in one state, by filed assets. */
export async function banksByState(args) {
    const state = String(args?.state ?? "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(state))
        throw new PlaidError(`Give a two-letter US state code, for example OH or CA.`);
    const limit = Math.round(Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25));
    const body = await fdciGet(`/institutions?filters=STALP:${state}%20AND%20ACTIVE:1&fields=CERT,NAME,CITY,STALP,ASSET,DEP&sort_by=ASSET&sort_order=DESC&limit=${limit}&format=json`);
    const rows = fdciRows(body);
    if (!rows.length)
        throw new PlaidError(`The FDIC lists no active institution headquartered in ${state}.`);
    const total = body.meta?.total ?? rows.length;
    const shownAssets = rows.reduce((sum, r) => sum + (Number(r.ASSET) || 0), 0);
    const lines = [
        `Active banks headquartered in ${state} — ${total} in the FDIC database, showing the ${rows.length} largest`,
        `  the shown ${rows.length} hold ${fdicUsd(shownAssets)} of assets between them`,
        "",
        ...rows.map((r, i) => `  ${String(i + 1).padStart(2)}. ${String(r.NAME ?? "unnamed")} — certificate ${String(r.CERT ?? "?")}` + `\n      ${String(r.CITY ?? "?")}, ${state} | assets ${fdicUsd(r.ASSET)} | deposits ${fdicUsd(r.DEP)}`),
        "",
        "note: headquarters is where the charter sits, not where the branches are, so a state can be home to a bank with almost no local presence. Trust companies and savings institutions appear alongside commercial banks because the call report covers all of them.",
    ];
    return lines.join("\n");
}
