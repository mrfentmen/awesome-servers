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
const MSQ = "https://api.nasdaq.com/api/quote";
// Nasdaq serves these two endpoints to browsers, not to bots: it wants a real
// UA and an Accept header, and it answers with an HTML page when it refuses.
const MS_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
};
function msNum(value) {
    const n = Number(String(value ?? "").replace(/[$,%\s]/g, ""));
    return Number.isFinite(n) ? n : null;
}
// Nasdaq writes dates as MM/DD/YYYY in JSON and wants the same in query strings.
function msIsoDate(value) {
    const m = String(value ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}` : String(value ?? "");
}
// Nasdaq's historical endpoint wants the date as YYYY-MM-DD; the MM/DD/YYYY
// form it uses in its own HTML returns an empty table, not an error.
function msQueryDate(value, fallback) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "")) ? String(value) : fallback;
}
function msDayStamp(iso) {
    const t = Date.parse(`${iso}T00:00:00Z`);
    return Number.isFinite(t) ? t : null;
}
async function nasdaqGet(url, what) {
    const data = await req(url, { headers: MS_HEADERS });
    if (typeof data === "string") {
        throw new MarketstackError(`Nasdaq answered ${what} with a page instead of JSON, which usually means it is rate-limiting. Wait a moment and try again.`);
    }
    return data;
}
export async function symbolDividendLedger(symbol, limit) {
    const ticker = String(symbol ?? "").trim().toUpperCase();
    if (!ticker)
        throw new MarketstackError("Give a ticker, for example AAPL.");
    const n = Math.min(Math.max(Number(limit ?? 8) || 8, 1), 20);
    const data = await nasdaqGet(`${MSQ}/${encodeURIComponent(ticker)}/dividends?assetclass=stocks`, `the dividend ledger for ${ticker}`);
    const dividends = data?.data?.dividends ?? {};
    const rows = Array.isArray(dividends.rows) ? dividends.rows : [];
    if (!rows.length)
        throw new MarketstackError(`Nasdaq lists no dividend history for ${ticker}.`);
    const summary = data?.data?.summary ?? {};
    const parsed = rows.map((r) => ({
        type: String(r.type ?? "").trim() || null,
        amount_usd: msNum(r.amount),
        ex_date: msIsoDate(r.exOrEffDate) || null,
        declared: msIsoDate(r.declarationDate) || null,
        record: msIsoDate(r.recordDate) || null,
        payable: msIsoDate(r.paymentDate) || null,
    }));
    const cash = parsed.filter((r) => r.amount_usd !== null && (!r.type || /cash/i.test(r.type)));
    const today = Date.now();
    const lastYear = cash.filter((r) => {
        const stamp = msDayStamp(r.ex_date);
        return stamp !== null && today - stamp <= 366 * 86400000;
    });
    const annualised = lastYear.length
        ? Math.round(lastYear.reduce((sum, r) => sum + r.amount_usd, 0) * 100) / 100
        : null;
    const upcoming = cash
        .filter((r) => {
        const stamp = msDayStamp(r.ex_date);
        return stamp !== null && stamp >= today;
    })
        .sort((a, b) => String(a.ex_date).localeCompare(String(b.ex_date)));
    return pretty({
        symbol: ticker,
        currency: rows[0]?.currency ?? "USD",
        distributions_recorded: rows.length,
        declared_total_usd: cash.length ? Math.round(cash.reduce((sum, r) => sum + r.amount_usd, 0) * 100) / 100 : null,
        per_share_last_12_months_usd: annualised,
        yield_pct: msNum(summary.yield ?? summary.yieldPercent ?? summary.dividendYield),
        payout_ratio_pct: msNum(summary.payoutRatio),
        annualised_amount_usd: msNum(summary.annualizedDividend ?? summary.annualisedDividend),
        next_ex_date: upcoming[0]?.ex_date ?? (msIsoDate(summary.exDividendDate) || null),
        next_payment_date: upcoming[0]?.payable ?? null,
        upcoming_declared: upcoming.slice(0, n),
        ledger: parsed.slice(0, n),
        note: "Nasdaq's public quote API, one call. Amounts per share. Yield and payout ratio are Nasdaq's own figures and are null when it does not publish them; the 12-month total is summed from the declared cash rows.",
    });
}
export async function priceWindowReview(symbol, from, to, limit) {
    const ticker = String(symbol ?? "").trim().toUpperCase();
    if (!ticker)
        throw new MarketstackError("Give a ticker, for example MSFT.");
    const n = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 60);
    const today = new Date();
    const endIso = /^\d{4}-\d{2}-\d{2}$/.test(String(to ?? "")) ? String(to) : today.toISOString().slice(0, 10);
    const defaultStart = new Date(Date.parse(`${endIso}T00:00:00Z`) - 30 * 86400000).toISOString().slice(0, 10);
    const startIso = /^\d{4}-\d{2}-\d{2}$/.test(String(from ?? "")) ? String(from) : defaultStart;
    if (Date.parse(`${startIso}T00:00:00Z`) > Date.parse(`${endIso}T00:00:00Z`)) {
        throw new MarketstackError(`The start date ${startIso} is after the end date ${endIso}.`);
    }
    const url = `${MSQ}/${encodeURIComponent(ticker)}/historical?assetclass=stocks&fromdate=${msQueryDate(startIso)}&todate=${msQueryDate(endIso)}&limit=60`;
    const data = await nasdaqGet(url, `the price history for ${ticker}`);
    const rows = data?.data?.tradesTable?.rows;
    if (!Array.isArray(rows) || !rows.length) {
        throw new MarketstackError(`Nasdaq returned no sessions for ${ticker} between ${startIso} and ${endIso}.`);
    }
    const sessions = rows
        .map((r) => ({
        date: msIsoDate(r.date),
        close: msNum(r.close),
        open: msNum(r.open),
        high: msNum(r.high),
        low: msNum(r.low),
        volume: msNum(r.volume),
    }))
        .filter((r) => r.close !== null)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (!sessions.length)
        throw new MarketstackError(`Nasdaq's rows for ${ticker} carried no usable closes.`);
    const first = sessions[0];
    const last = sessions[sessions.length - 1];
    const closes = sessions.map((s) => s.close);
    const highs = sessions.map((s) => s.high).filter((v) => v !== null);
    const lows = sessions.map((s) => s.low).filter((v) => v !== null);
    const moves = sessions.slice(1).map((s, i) => ({
        date: s.date,
        pct: sessions[i].close ? Math.round(((s.close - sessions[i].close) / sessions[i].close) * 10000) / 100 : null,
        usd: Math.round((s.close - sessions[i].close) * 100) / 100,
    }));
    const biggest = moves.filter((m) => m.pct !== null).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))[0] ?? null;
    const volumes = sessions.map((s) => s.volume).filter((v) => v !== null && v > 0);
    return pretty({
        symbol: ticker,
        window: { from: first.date, to: last.date, sessions: sessions.length },
        first_close: first.close,
        last_close: last.close,
        move_usd: Math.round((last.close - first.close) * 100) / 100,
        move_pct: first.close ? Math.round(((last.close - first.close) / first.close) * 10000) / 100 : null,
        window_low: lows.length ? Math.min(...lows) : null,
        window_high: highs.length ? Math.max(...highs) : null,
        biggest_single_day: biggest,
        average_volume: volumes.length ? Math.round(volumes.reduce((s, v) => s + v, 0) / volumes.length) : null,
        sessions_printed: Math.min(sessions.length, n),
        sessions_list: sessions.slice(-n).reverse(),
        note: "Nasdaq's public historical endpoint, one call. Closes are unadjusted for splits and dividends; a window that crosses a split will show a jump that is not a real move.",
    });
}
