/**
 * Tiingo API client. Needs TIINGO_API_TOKEN (free at https://www.tiingo.com/).
 * Docs: https://www.tiingo.com/documentation/
 */
const BASE = "https://api.tiingo.com";
export class TiingoError extends Error {
}
function headers() {
    const token = process.env.TIINGO_API_TOKEN;
    if (!token)
        throw new TiingoError("Set TIINGO_API_TOKEN first (free at tiingo.com).");
    return { "User-Agent": "tiingo-mcp/1.0", Accept: "application/json", "Content-Type": "application/json", Authorization: `Token ${token}` };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new TiingoError("Tiingo refused (401/403). Check API token.");
    if (res.status === 404)
        throw new TiingoError("Not found.");
    if (!res.ok)
        throw new TiingoError(`Tiingo error ${res.status}`);
    return (await res.json());
}
export async function stockMeta(symbol) {
    if (!symbol.trim())
        throw new TiingoError("Symbol is empty.");
    const m = await getJson(`/tiingo/daily/${encodeURIComponent(symbol.trim().toUpperCase())}`);
    return [
        `${m.ticker ?? symbol.trim().toUpperCase()} — ${m.name ?? "(unnamed)"}`,
        m.exchangeCode ? `Exchange: ${m.exchangeCode}` : "",
        m.startDate || m.endDate ? `Data: ${String(m.startDate ?? "?").slice(0, 10)} to ${String(m.endDate ?? "?").slice(0, 10)}` : "",
    ].filter(Boolean).join("\n");
}
export async function stockPrices(symbol, days = 5) {
    if (!symbol.trim())
        throw new TiingoError("Symbol is empty.");
    const rows = await getJson(`/tiingo/daily/${encodeURIComponent(symbol.trim().toUpperCase())}/prices?resampleFreq=daily`);
    const last = rows.slice(-Math.min(Math.max(days, 1), 30)).reverse();
    if (last.length === 0)
        return `No prices for ${symbol.trim().toUpperCase()}.`;
    return last.map((p) => `${String(p.date).slice(0, 10)}: close $${p.close} (o ${p.open} h ${p.high} l ${p.low} v ${Number(p.volume ?? 0).toLocaleString()})`).join("\n");
}
export async function cryptoMeta(symbol) {
    if (!symbol.trim())
        throw new TiingoError("Symbol is empty.");
    const rows = await getJson("/tiingo/crypto?tickers=" + encodeURIComponent(symbol.trim().toLowerCase()));
    const c = rows[0];
    if (!c)
        throw new TiingoError(`No crypto ${symbol.trim()}.`);
    return `${c.ticker?.toUpperCase() ?? symbol.trim().toUpperCase()} — ${c.name ?? "(unnamed)"}`;
}
// ---- muxG tools:
const TG_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";
const TG_LIST_CAP = 6;
/** Yahoo accepts 1d, 5d, 1wk, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd and max. */
function tgRange(value) {
    const r = value.trim();
    if (/^\d+(d|wk|mo|y)$/.test(r) || /^(ytd|max)$/.test(r))
        return r;
    throw new TiingoError(`"${value}" is not a range the price source accepts. Use 1d, 5d, 1wk, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd or max.`);
}
async function tgSeries(symbol, range, interval) {
    const sym = String(symbol ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9.\-^=]{1,12}$/.test(sym)) {
        throw new TiingoError(`"${symbol}" is not a ticker symbol. Use something like AAPL, MSFT, BTC-USD or ^GSPC.`);
    }
    const res = await fetch(`${TG_CHART}/${encodeURIComponent(sym)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; awesome-mcp/1.0)", Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new TiingoError(`No price history for ${sym}. Check the ticker; Yahoo uses suffixes like -USD for crypto and ^GSPC for an index.`);
    if (!res.ok)
        throw new TiingoError(`The price source returned ${res.status} for ${sym}.`);
    const d = (await res.json());
    if (d.chart?.error?.description)
        throw new TiingoError(`The price source rejected ${sym}: ${d.chart.error.description}`);
    const r = d.chart?.result?.[0];
    if (!r?.timestamp?.length)
        throw new TiingoError(`The price source returned no bars for ${sym} over ${range}.`);
    const q = r.indicators?.quote?.[0] ?? {};
    const bars = r.timestamp
        .map((t, i) => ({ t, open: q.open?.[i] ?? null, high: q.high?.[i] ?? null, low: q.low?.[i] ?? null, close: q.close?.[i] ?? null, volume: q.volume?.[i] ?? null }))
        .filter((b) => b.close !== null);
    if (bars.length < 5)
        throw new TiingoError(`Only ${bars.length} usable bar(s) for ${sym} over ${range}; widen the range.`);
    return { symbol: sym, currency: String(r.meta?.currency ?? "not reported"), bars, meta: r.meta ?? {} };
}
function tgDailyReturns(bars) {
    const out = [];
    for (let i = 1; i < bars.length; i += 1) {
        const a = bars[i - 1].close;
        const b = bars[i].close;
        if (a > 0 && b > 0)
            out.push(b / a - 1);
    }
    return out;
}
function tgStdev(xs) {
    if (xs.length < 2)
        return 0;
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    return Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / (xs.length - 1));
}
function tgAnnualised(xs) {
    return tgStdev(xs) * Math.sqrt(252);
}
function tgMaxDrawdown(closes) {
    let peak = closes[0] ?? 0;
    let peakIndex = 0;
    let worst = 0;
    let worstPeak = 0;
    let worstTrough = 0;
    closes.forEach((c, i) => {
        if (c > peak) {
            peak = c;
            peakIndex = i;
        }
        const dd = peak > 0 ? c / peak - 1 : 0;
        if (dd < worst) {
            worst = dd;
            worstPeak = peakIndex;
            worstTrough = i;
        }
    });
    return { depth: worst, from: worstPeak, to: worstTrough, recovered: false };
}
function tgIso(epochSeconds) {
    return new Date(epochSeconds * 1000).toISOString().slice(0, 10);
}
/** The risk numbers, computed from real daily closes. */
export async function riskMetrics(args) {
    const range = tgRange(String(args?.range ?? "1y"));
    const { symbol, currency, bars, meta } = await tgSeries(String(args?.symbol ?? "AAPL"), range, "1d");
    const closes = bars.map((b) => b.close);
    const rets = tgDailyReturns(bars);
    const dd = tgMaxDrawdown(closes);
    const last = closes[closes.length - 1];
    const first = closes[0];
    const totalReturn = last / first - 1;
    const years = bars.length / 252;
    const cagr = years > 0 ? Math.pow(last / first, 1 / years) - 1 : 0;
    const vol20 = tgAnnualised(rets.slice(-20));
    const vol60 = tgAnnualised(rets.slice(-60));
    const volAll = tgAnnualised(rets);
    const mean = rets.length ? rets.reduce((s, x) => s + x, 0) / rets.length : 0;
    const best = Math.max(...rets);
    const worst = Math.min(...rets);
    const ma = (n) => (closes.length >= n ? closes.slice(-n).reduce((s, c) => s + c, 0) / n : null);
    const ma50 = ma(50);
    const ma200 = ma(200);
    const lo52 = meta.fiftyTwoWeekLow !== undefined ? Number(meta.fiftyTwoWeekLow) : Math.min(...closes);
    const hi52 = meta.fiftyTwoWeekHigh !== undefined ? Number(meta.fiftyTwoWeekHigh) : Math.max(...closes);
    const rangePos = hi52 > lo52 ? (last - lo52) / (hi52 - lo52) : null;
    const volumes = bars.map((b) => b.volume ?? 0).filter((v) => v > 0);
    const avgVol = volumes.length ? volumes.reduce((s, v) => s + v, 0) / volumes.length : 0;
    return [
        `Risk metrics for ${symbol} (${currency}), ${bars.length} daily bars over ${range}`,
        `From ${tgIso(bars[0].t)} to ${tgIso(bars[bars.length - 1].t)}`,
        "",
        `Last close: ${last} | period return: ${(totalReturn * 100).toFixed(2)}% | CAGR: ${(cagr * 100).toFixed(2)}%`,
        `Annualised volatility: ${(volAll * 100).toFixed(2)}% (last 20 bars ${(vol20 * 100).toFixed(2)}%, last 60 ${(vol60 * 100).toFixed(2)}%)`,
        `Worst single day: ${(worst * 100).toFixed(2)}% | best single day: ${(best * 100).toFixed(2)}% | mean daily return: ${(mean * 100).toFixed(3)}%`,
        `Maximum drawdown: ${(dd.depth * 100).toFixed(2)}%, from ${tgIso(bars[dd.from].t)} to ${tgIso(bars[dd.to].t)}, ${dd.to - dd.from} trading days`,
        "",
        `52 week range: ${lo52} to ${hi52}${rangePos === null ? "" : `; last close sits at ${(rangePos * 100).toFixed(0)}% of that range`}`,
        `50 day average: ${ma50 === null ? "not enough bars" : ma50.toFixed(2)}${ma50 === null ? "" : `, last close is ${(((last - ma50) / ma50) * 100).toFixed(1)}% ${last >= ma50 ? "above" : "below"} it`}`,
        `200 day average: ${ma200 === null ? "not enough bars, widen the range" : ma200.toFixed(2)}${ma200 === null ? "" : `, last close is ${(((last - ma200) / ma200) * 100).toFixed(1)}% ${last >= ma200 ? "above" : "below"} it`}`,
        avgVol ? `Average daily volume: ${Math.round(avgVol).toLocaleString("en-US")} units` : "Average daily volume: not reported",
        "",
        "Annualised volatility scales a daily standard deviation by the square root of 252, which assumes independent daily moves. Real returns are not independent: volatility clusters, so a calm month like the last 20 bars is a poor guide to what the next month will feel like.",
        "A maximum drawdown measured on daily closes misses the real intraday depth, so this number is a floor on how bad it got, not the worst price anyone saw.",
    ]
        .filter(Boolean)
        .join("\n");
}
/** Every peak-to-trough episode in the sample, not just the worst one. */
export async function drawdownProfile(args) {
    const range = tgRange(String(args?.range ?? "2y"));
    const top = Math.max(1, Math.min(TG_LIST_CAP, Math.floor(Number(args?.top ?? 5)) || 5));
    const { symbol, currency, bars } = await tgSeries(String(args?.symbol ?? "AAPL"), range, "1d");
    const closes = bars.map((b) => b.close);
    const episodes = [];
    let peak = closes[0];
    let peakIndex = 0;
    let trough = closes[0];
    let troughIndex = 0;
    let inDrawdown = false;
    for (let i = 1; i < closes.length; i += 1) {
        if (closes[i] >= peak) {
            if (inDrawdown) {
                episodes.push({ start: peakIndex, bottom: troughIndex, depth: trough / peak - 1, recoveredAt: i, days: i - peakIndex });
                inDrawdown = false;
            }
            peak = closes[i];
            peakIndex = i;
            continue;
        }
        if (!inDrawdown) {
            inDrawdown = true;
            trough = closes[i];
            troughIndex = i;
        }
        if (closes[i] < trough) {
            trough = closes[i];
            troughIndex = i;
        }
    }
    if (inDrawdown)
        episodes.push({ start: peakIndex, bottom: troughIndex, depth: trough / peak - 1, recoveredAt: null, days: closes.length - 1 - peakIndex });
    const sorted = [...episodes].sort((a, b) => a.depth - b.depth);
    const worst = sorted[0];
    const ongoing = episodes.find((e) => e.recoveredAt === null);
    const depths = episodes.map((e) => e.depth);
    const durations = episodes.map((e) => e.days);
    return [
        `Drawdown profile for ${symbol} (${currency}), ${bars.length} bars from ${tgIso(bars[0].t)} to ${tgIso(bars[closes.length - 1].t)}`,
        `${episodes.length} peak-to-trough episode(s) in this sample${depths.length ? `, mean depth ${((depths.reduce((s, d) => s + d, 0) / depths.length) * 100).toFixed(1)}% and mean length ${Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)} trading days` : ""}`,
        worst ? `Worst: ${(worst.depth * 100).toFixed(2)}% from ${tgIso(bars[worst.start].t)} to ${tgIso(bars[worst.bottom].t)}${worst.recoveredAt ? `, recovered ${tgIso(bars[worst.recoveredAt].t)} after ${worst.days} days` : ", not yet recovered"}` : "No drawdown in this sample.",
        ongoing ? `Ongoing: ${(ongoing.depth * 100).toFixed(2)}% below the ${tgIso(bars[ongoing.start].t)} peak, ${ongoing.days} trading days so far` : "Nothing is currently in a drawdown by this measure.",
        "",
        `Deepest ${Math.min(top, sorted.length)} episode(s):`,
        ...sorted.slice(0, top).map((e) => {
            const rec = e.recoveredAt ? `recovered in ${e.recoveredAt - e.start} days` : `unrecovered after ${e.days} days`;
            const under = e.days - (e.recoveredAt ? e.recoveredAt - e.bottom : e.days);
            return `  ${(e.depth * 100).toFixed(2).padStart(7)}%  ${tgIso(bars[e.start].t)} -> ${tgIso(bars[e.bottom].t)}, ${rec}${e.recoveredAt ? `, ${under} days spent below the prior peak` : ""}`;
        }),
        "",
        "An unrecovered episode is the one to watch: a drawdown that has not returned to its peak is a different problem from one that did, regardless of depth. The time spent below the peak is often the number people underestimate, because it is the period during which the position is still open and still losing relative to its high.",
        "Measured on daily closes, so intraday extremes are invisible and every depth here is a floor.",
    ]
        .filter(Boolean)
        .join("\n");
}
/** How several tickers actually moved together, over real returns. */
export async function returnCorrelation(args) {
    const list = String(args?.symbols ?? "SPY,QQQ,TLT,GLD")
        .split(/[\s,;|]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
    if (list.length < 2)
        throw new TiingoError(`Give at least two symbols, comma separated. Received ${list.length}.`);
    if (list.length > 5)
        throw new TiingoError(`${list.length} symbols is over the limit of 5; the pairwise table gets unreadable.`);
    const range = tgRange(String(args?.range ?? "1y"));
    const baseline = String(args?.baseline ?? list[0]).trim().toUpperCase();
    const series = new Map();
    const metas = new Map();
    for (const s of list) {
        const r = await tgSeries(s, range, "1d");
        const closes = r.bars.map((b) => b.close);
        series.set(s, closes);
        metas.set(s, { currency: r.currency, last: closes[closes.length - 1] });
    }
    const shortest = Math.min(...[...series.values()].map((v) => v.length));
    const ret = (closes) => {
        const out = [];
        for (let i = 1; i < closes.length; i += 1) {
            const a = closes[i - 1];
            const b = closes[i];
            out.push(a > 0 ? b / a - 1 : 0);
        }
        return out;
    };
    const rets = new Map();
    for (const [s, v] of series)
        rets.set(s, ret(v.slice(-shortest)));
    const symbols = [...rets.keys()];
    const base = rets.has(baseline) ? baseline : symbols[0];
    const corr = (a, b) => {
        const n = Math.min(a.length, b.length);
        if (n < 3)
            return 0;
        const x = a.slice(-n);
        const y = b.slice(-n);
        const mx = x.reduce((s, v) => s + v, 0) / n;
        const my = y.reduce((s, v) => s + v, 0) / n;
        let num = 0;
        let dx = 0;
        let dy = 0;
        for (let i = 0; i < n; i += 1) {
            num += (x[i] - mx) * (y[i] - my);
            dx += (x[i] - mx) ** 2;
            dy += (y[i] - my) ** 2;
        }
        return dx > 0 && dy > 0 ? num / Math.sqrt(dx * dy) : 0;
    };
    const beta = (a, b) => {
        const n = Math.min(a.length, b.length);
        if (n < 3)
            return 0;
        const x = b.slice(-n);
        const y = a.slice(-n);
        const mx = x.reduce((s, v) => s + v, 0) / n;
        const my = y.reduce((s, v) => s + v, 0) / n;
        let cov = 0;
        let varb = 0;
        for (let i = 0; i < n; i += 1) {
            cov += (x[i] - mx) * (y[i] - my);
            varb += (x[i] - mx) ** 2;
        }
        return varb > 0 ? cov / varb : 0;
    };
    const perSymbol = symbols.map((s) => {
        const r = rets.get(s);
        const total = r.reduce((acc, x) => acc * (1 + x), 1) - 1;
        return { s, total, vol: tgAnnualised(r) };
    });
    const baseVol = tgAnnualised(rets.get(base));
    return [
        `Return correlation across ${symbols.length} symbol(s) over ${range}, ${shortest} common daily bars`,
        `Baseline for beta: ${base}`,
        "",
        "Pairwise correlation of daily returns:",
        ...symbols.map((a) => {
            const row = symbols.map((b) => (a === b ? "    1.00" : corr(rets.get(a), rets.get(b)).toFixed(2).padStart(6)));
            return `  ${a.padEnd(8)} ${row.join(" ")}`;
        }),
        `  ${" ".repeat(8)} ${symbols.map((s) => s.slice(0, 5).padStart(6)).join(" ")}`,
        "",
        "Per symbol:",
        ...perSymbol.map((p) => {
            const m = metas.get(p.s);
            return `  ${p.s.padEnd(8)} return ${(p.total * 100).toFixed(2).padStart(8)}%  annualised vol ${(p.vol * 100).toFixed(2).padStart(6)}%  beta vs ${base} ${p.s === base ? "1.00" : beta(rets.get(p.s), rets.get(base)).toFixed(2).padStart(5)}${m ? `  last ${m.last} ${m.currency}` : ""}`;
        }),
        "",
        "The series were trimmed to the shortest one so the table compares the same days for every symbol, which is why a longer-listed symbol can show a shorter period than it could.",
        "Correlation is not diversification on its own: two assets at 0.95 correlation still double the position risk, and correlations rise together in a crisis, which is exactly when the diversification is needed.",
    ]
        .filter(Boolean)
        .join("\n");
}
