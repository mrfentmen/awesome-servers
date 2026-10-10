export class MarketstackError extends Error {
    constructor(message) {
        super(message);
        this.name = "MarketstackError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new MarketstackError(`Set the ${name} environment variable.`);
    return v;
}
function apiKey() {
    return envStrict("MARKETSTACK_API_KEY");
}
async function authHeaders() {
    return {};
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
        throw new MarketstackError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function getLatestEod(symbols) {
    const key = apiKey();
    let url = `https://api.marketstack.com/v1/eod`;
    const qs = new URLSearchParams();
    qs.append("access_key", key);
    qs.append("symbols", String(symbols));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getEodOnDate(symbols, date) {
    const key = apiKey();
    let url = `https://api.marketstack.com/v1/eod/${encodeURIComponent(String(date))}`;
    const qs = new URLSearchParams();
    qs.append("access_key", key);
    qs.append("symbols", String(symbols));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function searchTickers(query, limit) {
    const key = apiKey();
    let url = `https://api.marketstack.com/v1/tickers`;
    const qs = new URLSearchParams();
    qs.append("access_key", key);
    qs.append("search", String(query));
    if (limit !== undefined)
        qs.append("limit", String(limit));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function listExchanges() {
    const key = apiKey();
    let url = `https://api.marketstack.com/v1/exchanges`;
    const qs = new URLSearchParams();
    qs.append("access_key", key);
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
export async function getDividends(symbols) {
    const key = apiKey();
    let url = `https://api.marketstack.com/v1/dividends`;
    const qs = new URLSearchParams();
    qs.append("access_key", key);
    qs.append("symbols", String(symbols));
    const qstr = qs.toString();
    if (qstr)
        url += (url.includes('?') ? '&' : '?') + qstr;
    const data = await req(url);
    return pretty(data);
}
// ---- muxF tools:
/**
 * Marketstack's own endpoints all need MARKETSTACK_API_KEY. Nasdaq's public
 * quote endpoints answer the same two questions - dividend ledger and daily
 * price history - without a key, so these two read from there.
 */
const MSQ = "https://api.nasdaq.com/api/quote";
const MS_UA = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
};
const msSymbol = (input) => {
    const symbol = String(input ?? "").trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(symbol))
        throw new MarketstackError(`"${input}" is not a ticker symbol.`);
    return symbol;
};
const msMoney = (value) => {
    if (value === null || value === undefined)
        return null;
    const parsed = Number(String(value).replace(/[$,%\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
};
const msDay = (raw) => {
    const value = String(raw ?? "").trim();
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m)
        return `${m[3]}-${m[1]}-${m[2]}`;
    const stamp = Date.parse(value);
    return Number.isFinite(stamp) ? new Date(stamp).toISOString().slice(0, 10) : "not reported";
};
async function msQuote(path, what) {
    let res;
    try {
        res = await fetch(path, { headers: { ...MS_UA }, signal: AbortSignal.timeout(30000) });
    }
    catch (e) {
        throw new MarketstackError(`Network error: ${e.message}`);
    }
    if (res.status === 404)
        throw new MarketstackError(`Nasdaq has no ${what} for that symbol.`);
    if (!res.ok)
        throw new MarketstackError(`Nasdaq returned HTTP ${res.status} for ${what}.`);
    const body = (await res.text()).trim();
    if (!body)
        throw new MarketstackError(`Nasdaq returned an empty body for ${what}.`);
    const parsed = JSON.parse(body);
    if (!parsed.data) {
        const message = parsed.status?.bCodeMessage ?? "no data block in the response";
        throw new MarketstackError(`Nasdaq returned no data for ${what}: ${String(message).slice(0, 120)}`);
    }
    return parsed.data;
}
/** The dividend ledger for a symbol, read from Nasdaq's public dividend endpoint. */
export async function symbolDividendLedger(args) {
    const symbol = msSymbol(args?.symbol);
    const n = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 20);
    const data = await msQuote(`${MSQ}/${symbol}/dividends?assetclass=stocks`, `the dividend ledger for ${symbol}`);
    const table = (data.dividends ?? {});
    const rows = Array.isArray(table.rows) ? table.rows : [];
    if (!rows.length)
        throw new MarketstackError(`Nasdaq reports no dividend history for ${symbol}.`);
    const annualised = msMoney(data.annualizedDividend);
    const yieldPct = msMoney(data.yield);
    const payout = msMoney(data.payoutRatio);
    const headers = (data.dividendHeaderValues ?? []);
    const amounts = rows.map((row) => msMoney(row.amount)).filter((value) => value !== null);
    const total = amounts.reduce((sum, value) => sum + value, 0);
    const dates = rows.map((row) => Date.parse(msDay(row.exOrEffDate))).filter((n2) => Number.isFinite(n2));
    const spanDays = dates.length > 1 ? (Math.max(...dates) - Math.min(...dates)) / 86_400_000 : 0;
    const lines = [
        `Dividend ledger for ${symbol}, from Nasdaq's public quote API`,
        annualised !== null ? `  annualised dividend: $${annualised}` : "  annualised dividend: not reported",
        yieldPct !== null ? `  yield: ${yieldPct}%` : "  yield: not reported",
        payout !== null ? `  payout ratio: ${payout}%` : "  payout ratio: not reported",
        `  next ex-dividend date: ${msDay(data.exDividendDate)}, payment date ${msDay(data.dividendPaymentDate)}`,
        `  ${rows.length} distribution(s) on record, ${amounts.length} with an amount, totalling $${total.toFixed(2)}${spanDays ? ` over ${Math.round(spanDays)} day(s)` : ""}`,
    ];
    for (const header of headers.slice(0, 6)) {
        if (header.label && header.value)
            lines.push(`  ${header.label}: ${header.value}`);
    }
    lines.push("");
    lines.push(`  ex/eff date   type   amount   declared   record      payment`);
    for (const row of rows.slice(0, n)) {
        lines.push(`  ${msDay(row.exOrEffDate)}   ${String(row.type ?? "not reported").padEnd(5)} ${String(row.amount ?? "not reported").padEnd(7)} ${msDay(row.declarationDate).padEnd(10)} ${msDay(row.recordDate).padEnd(11)} ${msDay(row.paymentDate)}`);
    }
    if (rows.length > n)
        lines.push(`  ...and ${rows.length - n} older distribution(s) on record.`);
    if (spanDays > 300 && amounts.length > 1) {
        const perYear = (total / spanDays) * 365;
        lines.push("");
        lines.push(`  That works out to about $${perYear.toFixed(2)} a year over the ${Math.round(spanDays)} day(s) on record.`);
    }
    return lines.join("\n");
}
/** What a price did over a real date range: sessions, direction, extremes and volume. */
export async function priceWindowReview(args) {
    const symbol = msSymbol(args?.symbol);
    const today = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    const to = String(args?.to ?? iso(today)).trim();
    const from = String(args?.from ?? iso(new Date(today.getTime() - 30 * 86_400_000))).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        throw new MarketstackError("Give the window as YYYY-MM-DD for both from and to.");
    }
    if (from >= to)
        throw new MarketstackError("The from date must be before the to date.");
    const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 60);
    const data = await msQuote(`${MSQ}/${symbol}/historical?assetclass=stocks&fromdate=${from}&todate=${to}&limit=200`, `price history for ${symbol}`);
    const table = (data.tradesTable ?? {});
    const rows = Array.isArray(table.rows) ? table.rows : [];
    if (!rows.length)
        throw new MarketstackError(`Nasdaq returned no sessions for ${symbol} between ${from} and ${to}.`);
    const sessions = rows
        .map((row) => ({
        date: msDay(row.date),
        close: msMoney(row.close),
        open: msMoney(row.open),
        high: msMoney(row.high),
        low: msMoney(row.low),
        volume: msMoney(row.volume),
    }))
        .filter((row) => row.close !== null)
        .sort((a, b) => a.date.localeCompare(b.date));
    const closes = sessions.map((row) => row.close);
    const first = closes[0];
    const last = closes[closes.length - 1];
    const change = last - first;
    const changePct = first ? Math.round((change / first) * 10000) / 100 : null;
    const moves = sessions
        .map((row, i) => (i === 0 ? null : (row.close - sessions[i - 1].close) / sessions[i - 1].close))
        .filter((value) => value !== null);
    const best = moves.length ? Math.max(...moves) : null;
    const worst = moves.length ? Math.min(...moves) : null;
    const volumes = sessions.map((row) => row.volume ?? 0).filter((v) => v > 0);
    const avgVolume = volumes.length ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : null;
    const high = Math.max(...sessions.map((row) => row.high ?? row.close));
    const low = Math.min(...sessions.map((row) => row.low ?? row.close));
    const lines = [
        `${symbol} over ${sessions[0].date} to ${sessions[sessions.length - 1].date}: ${sessions.length} session(s), from Nasdaq's public historical endpoint`,
        `  close on the first session $${first}, last close $${last}, change $${change >= 0 ? "+" : ""}${change.toFixed(2)} (${changePct === null ? "not reported" : `${changePct > 0 ? "+" : ""}${changePct}%`})`,
        `  range in the window: low $${low}, high $${high}`,
        `  biggest one-day move: ${worst === null ? "not reported" : `${(worst * 100).toFixed(2)}%`} to ${best === null ? "not reported" : `+${(best * 100).toFixed(2)}%`}`,
        `  average volume: ${avgVolume === null ? "not reported" : avgVolume.toLocaleString("en-US")} shares per session`,
        "",
        `  date        open     high     low      close     volume`,
    ];
    for (const row of sessions.slice(-n)) {
        lines.push(`  ${row.date}  ${String(row.open ?? "-").padEnd(8)} ${String(row.high ?? "-").padEnd(8)} ${String(row.low ?? "-").padEnd(8)} ${String(row.close ?? "-").padEnd(9)} ${row.volume === null ? "not reported" : Math.round(row.volume).toLocaleString("en-US")}`);
    }
    if (sessions.length > n)
        lines.push(`  ...and ${sessions.length - n} earlier session(s) in the window.`);
    lines.push("  Split or dividend adjusted closes are not labelled here, so a large one-day move may be a corporate action.");
    return lines.join("\n");
}
