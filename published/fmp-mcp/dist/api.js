/**
 * Financial Modeling Prep API client. Needs FMP_API_KEY
 * (free at https://site.financialmodelingprep.com/developer/docs).
 * Docs: https://site.financialmodelingprep.com/developer/docs
 */
const BASE = "https://financialmodelingprep.com/stable";
export class FmpError extends Error {
}
function apiKey() {
    const k = process.env.FMP_API_KEY;
    if (!k)
        throw new FmpError("Set FMP_API_KEY first (free at site.financialmodelingprep.com).");
    return k;
}
async function getJson(path, extra = {}) {
    const qs = new URLSearchParams({ ...extra, apikey: apiKey() }).toString();
    const res = await fetch(`${BASE}${path}?${qs}`, {
        headers: { "User-Agent": "fmp-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new FmpError("FMP refused (401/403). Check FMP_API_KEY and plan limits.");
    if (res.status === 429)
        throw new FmpError("FMP rate limit hit; wait and retry.");
    if (!res.ok)
        throw new FmpError(`FMP error ${res.status}`);
    return (await res.json());
}
export async function stockQuote(symbol) {
    if (!symbol.trim())
        throw new FmpError("Symbol is empty.");
    const rows = await getJson(`/quote?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`);
    const q = rows[0];
    if (!q)
        throw new FmpError(`No quote for ${symbol.trim().toUpperCase()}.`);
    return [
        `${q.symbol} — $${q.price ?? "?"}`,
        `${q.name ?? ""}${q.exchange ? ` (${q.exchange})` : ""}`,
        `Change: ${q.change ?? "?"} (${q.changesPercentage ?? "?"}%) · Day range ${q.dayLow ?? "?"}-${q.dayHigh ?? "?"} · Mkt cap $${Number(q.marketCap ?? 0).toLocaleString()}`,
    ].filter(Boolean).join("\n");
}
export async function companyProfile(symbol) {
    if (!symbol.trim())
        throw new FmpError("Symbol is empty.");
    const rows = await getJson(`/profile?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}`);
    const c = rows[0];
    if (!c)
        throw new FmpError(`No profile for ${symbol.trim().toUpperCase()}.`);
    return [
        `${c.companyName ?? symbol.trim().toUpperCase()} (${c.symbol ?? "?"})`,
        c.industry ? `${c.industry} · ${c.sector ?? ""}`.trim() : "",
        c.ceo ? `CEO: ${c.ceo}` : "",
        c.website ? `${c.website}` : "",
        c.description ? `${String(c.description).slice(0, 300)}` : "",
    ].filter(Boolean).join("\n");
}
// ---- muxF tools ----
const RANGE_DAYS = { "1d": 5, "5d": 10, "1mo": 31, "3mo": 92, "6mo": 183, "1y": 366, "2y": 731, "5y": 1826, ytd: null, max: 3650 };
const DAILY_INTERVAL = new Set(["1d", "5d", "1wk", "1mo", "3mo"]);
const CHART_INTERVAL = { "1m": "1min", "5m": "5min", "15m": "15min", "30m": "30min", "60m": "1hour", "1h": "1hour" };
function isoDay(value, fallback) {
    const text = String(value ?? "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(`${text}T00:00:00Z`)))
        return text;
    return fallback.toISOString().slice(0, 10);
}
function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}
function rowsOf(payload) {
    if (Array.isArray(payload))
        return payload;
    if (Array.isArray(payload?.historical))
        return payload.historical;
    return [];
}
function rateOf(row) {
    return num(row?.rate ?? row?.price ?? row?.bid ?? row?.close);
}
function codeOf(row, base) {
    const raw = String(row?.currency ?? row?.symbol ?? row?.pair ?? "").toUpperCase();
    if (!raw)
        return null;
    const pair = raw.replace(/[^A-Z]/g, "");
    if (pair.length === 6 && pair.startsWith(base))
        return pair.slice(3);
    return raw.replace(base, "").replace(/[^A-Z]/g, "") || raw;
}
function barOf(row) {
    const close = num(row?.close ?? row?.price ?? row?.adjClose);
    if (close === null)
        return null;
    return {
        date: String(row?.date ?? row?.datetime ?? "").slice(0, 19).replace(" ", "T"),
        open: num(row?.open),
        high: num(row?.high),
        low: num(row?.low),
        close,
        volume: num(row?.volume),
    };
}
function bucketKey(iso, interval) {
    const day = iso.slice(0, 10);
    const [y, m] = day.split("-");
    if (interval === "1wk") {
        const d = new Date(`${day}T00:00:00Z`);
        const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86400000);
        return monday.toISOString().slice(0, 10);
    }
    if (interval === "1mo")
        return `${y}-${m}`;
    if (interval === "3mo")
        return `${y}-Q${Math.floor((Number(m) - 1) / 3) + 1}`;
    return day;
}
function aggregate(bars, interval, size) {
    const out = [];
    let current = null;
    for (const bar of bars) {
        const key = bucketKey(bar.date, interval);
        if (!current || current.key !== key) {
            if (current)
                out.push(current.bar);
            current = { key, bar: { ...bar } };
            continue;
        }
        current.bar.high = current.bar.high === null || bar.high === null ? current.bar.high ?? bar.high : Math.max(current.bar.high, bar.high);
        current.bar.low = current.bar.low === null || bar.low === null ? current.bar.low ?? bar.low : Math.min(current.bar.low, bar.low);
        current.bar.close = bar.close;
        current.bar.volume = (current.bar.volume ?? 0) + (bar.volume ?? 0);
        current.bar.date = bar.date;
    }
    if (current)
        out.push(current.bar);
    return out.filter((bar) => bar.date).slice(-size);
}
export async function currencyRates(base, symbols) {
    const from = String(base ?? "USD").trim().toUpperCase() || "USD";
    const wanted = (Array.isArray(symbols) ? symbols : [])
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 10);
    if (!wanted.length)
        throw new FmpError("Give at least one target currency, e.g. ['EUR', 'JPY'].");
    const rows = rowsOf(await getJson(`/fx-rates?base=${encodeURIComponent(from)}`));
    if (!rows.length)
        throw new FmpError(`FMP returned no FX rates against ${from}.`);
    const byCode = new Map();
    for (const row of rows) {
        const code = codeOf(row, from);
        const rate = rateOf(row);
        if (code && rate && rate > 0)
            byCode.set(code, { rate, date: row.date ?? null });
    }
    const lines = [];
    const missing = [];
    let asOf = null;
    for (const code of wanted) {
        const hit = byCode.get(code);
        if (!hit) {
            missing.push(code);
            continue;
        }
        asOf = asOf ?? hit.date;
        lines.push(`1 ${from} = ${hit.rate} ${code}   (1 ${code} = ${(1 / hit.rate).toFixed(6)} ${from})`);
    }
    if (!lines.length)
        throw new FmpError(`FMP quotes none of ${wanted.join(", ")} against ${from}.`);
    return [
        `FX rates against ${from}${asOf ? ` (reference date ${String(asOf).slice(0, 10)})` : ""}`,
        "",
        ...lines,
        missing.length ? `\nNot quoted by this endpoint: ${missing.join(", ")}.` : "",
        "",
        "Note: these are published reference rates, not tradeable quotes; a bank or broker will add a spread.",
    ].filter((line) => line !== "").join("\n");
}
export async function fxHistory(pair, start, end, limit = 10) {
    const clean = String(pair ?? "").trim().toUpperCase().replace(/[^A-Z]/g, "");
    if (clean.length !== 6)
        throw new FmpError(`"${pair ?? ""}" is not a six-letter pair such as EURUSD.`);
    const today = new Date();
    const to = isoDay(end, today);
    const from = isoDay(start, new Date(Date.parse(`${to}T00:00:00Z`) - 30 * 86400000));
    if (Date.parse(`${from}T00:00:00Z`) > Date.parse(`${to}T00:00:00Z`))
        throw new FmpError(`The start date ${from} is after the end date ${to}.`);
    const bars = rowsOf(await getJson(`/historical-price-eod/full?symbol=${clean}&from=${from}&to=${to}`))
        .map(barOf)
        .filter((b) => b !== null)
        .sort((a, b) => a.date.localeCompare(b.date));
    if (!bars.length)
        throw new FmpError(`FMP has no ${clean} history between ${from} and ${to}.`);
    const closes = bars.map((b) => b.close);
    const first = closes[0];
    const last = closes[closes.length - 1];
    const high = Math.max(...bars.map((b) => b.high ?? b.close));
    const low = Math.min(...bars.map((b) => b.low ?? b.close));
    const n = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 30);
    const changePct = first ? ((last - first) / first) * 100 : 0;
    return [
        `${clean} — ${bars.length} daily reference rate(s), ${bars[0].date.slice(0, 10)} to ${bars[bars.length - 1].date.slice(0, 10)}`,
        `Period change: ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}% (${first} to ${last}) | high ${high} | low ${low}`,
        "",
        `Last ${Math.min(n, bars.length)} day(s):`,
        ...bars.slice(-n).map((b) => `${b.date.slice(0, 10)}  close ${b.close}${b.high !== null ? `  high ${b.high}` : ""}${b.low !== null ? `  low ${b.low}` : ""}`),
        "",
        "Note: FMP publishes each day's reference rate once, so this is end-of-day data, not intraday.",
    ].join("\n");
}
export async function priceHistory(symbol, range = "1mo", interval = "1d", limit = 10) {
    const ticker = String(symbol ?? "").trim().toUpperCase();
    if (!ticker)
        throw new FmpError("Ticker is empty.");
    const span = range === "ytd" ? null : RANGE_DAYS[range] ?? RANGE_DAYS["1mo"];
    const today = new Date();
    const from = range === "ytd" ? `${today.getUTCFullYear()}-01-01` : new Date(today.getTime() - (span ?? 31) * 86400000).toISOString().slice(0, 10);
    const to = today.toISOString().slice(0, 10);
    const size = Math.min(Math.max(Number(limit ?? 10) || 10, 1), 30);
    let bars;
    let label;
    if (DAILY_INTERVAL.has(interval)) {
        const rows = rowsOf(await getJson(`/historical-price-eod/full?symbol=${ticker}&from=${from}&to=${to}`))
            .map(barOf)
            .filter((b) => b !== null)
            .sort((a, b) => a.date.localeCompare(b.date));
        bars = interval === "1d" ? rows : aggregate(rows, interval, size);
        label = interval === "1d" ? "daily bars" : `${interval} bars built from daily closes`;
    }
    else {
        const step = CHART_INTERVAL[interval];
        if (!step)
            throw new FmpError(`Unsupported interval "${interval}".`);
        bars = rowsOf(await getJson(`/historical-chart/${step}?symbol=${ticker}`))
            .map(barOf)
            .filter((b) => b !== null)
            .filter((b) => b.date.slice(0, 10) >= from)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-size);
        label = `${step} intraday bars`;
    }
    if (!bars.length)
        throw new FmpError(`FMP returned no bars for ${ticker} over ${range}. Try a longer range or a coarser interval.`);
    const year = rowsOf(await getJson(`/historical-price-eod/full?symbol=${ticker}&from=${new Date(today.getTime() - 365 * 86400000).toISOString().slice(0, 10)}&to=${to}`))
        .map(barOf)
        .filter((b) => b !== null);
    const last = bars[bars.length - 1];
    const first = bars[0];
    const changePct = first.close ? ((last.close - first.close) / first.close) * 100 : 0;
    return [
        `${ticker} — ${bars.length} ${label}, ${first.date.slice(0, 16)} to ${last.date.slice(0, 16)}`,
        `Last close ${last.close} | change over the window ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%` +
            (year.length ? ` | 52-week range ${Math.min(...year.map((b) => b.low ?? b.close))} to ${Math.max(...year.map((b) => b.high ?? b.close))}` : ""),
        "",
        ...bars.slice(-size).map((b) => `${b.date.slice(0, 16)}  O ${b.open ?? "?"}  H ${b.high ?? "?"}  L ${b.low ?? "?"}  C ${b.close}  V ${b.volume ?? "?"}`),
        "",
        year.length
            ? `The 52-week range is measured across ${year.length} daily bar(s) fetched separately from the window above.`
            : "No 52-week bars came back, so no 52-week range is reported rather than inventing one.",
        "Note: FMP prices are unadjusted for this endpoint unless the plan returns adjusted closes; volume is in shares.",
    ].join("\n");
}
export async function incomeStatement(symbol, limit = 4) {
    if (!symbol.trim())
        throw new FmpError("Symbol is empty.");
    const rows = await getJson(`/income-statement?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}&limit=${Math.min(Math.max(limit, 1), 10)}`);
    if (rows.length === 0)
        return `No financials for ${symbol.trim().toUpperCase()}.`;
    return rows.map((r) => {
        const rev = Number(r.revenue ?? 0);
        const net = Number(r.netIncome ?? 0);
        return `${String(r.fiscalYear ?? r.date ?? "?").slice(0, 10)}: revenue $${(rev / 1e9).toFixed(2)}B, net $${(net / 1e9).toFixed(2)}B`;
    }).join("\n");
}
