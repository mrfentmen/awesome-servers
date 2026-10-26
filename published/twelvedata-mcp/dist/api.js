const UA = 'mrfentmen-twelvedata-mcp/1.0';
export async function quote(args) {
    const symbol = (args.symbol ?? '').trim().toUpperCase();
    if (!symbol)
        return 'Provide a stock symbol like AAPL.';
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=demo`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Twelve Data returned ${res.status}`);
    const d = (await res.json());
    if (d.status === 'error')
        throw new Error(`Twelve Data: ${String(d.message ?? d.code ?? 'error')}`);
    const get = (k) => String(d[k] ?? '?');
    return [
        `Twelve Data quote for ${symbol}:`,
        `Name: ${get('name')} | Exchange: ${get('exchange')} | Currency: ${get('currency')}`,
        `Price: ${get('close')} | Open: ${get('open')} | High: ${get('high')} | Low: ${get('low')}`,
        `Change: ${get('change')} (${get('percent_change')}%) | Volume: ${get('volume')}`,
        `Timestamp: ${get('datetime')}`,
    ].filter(Boolean).join('\n');
}
// ---- muxH tools:
// The one existing tool asks Twelve Data for a single equity quote. These two
// read the European Central Bank's own reference rates instead, which are public,
// need no key, and answer the two questions a currency desk actually asks: where
// everything stands against one base right now, and what a pair has done over a
// stretch of published days.
const TD_UA = "mcfentmen-twelvedata-mcp/1.1 (https://github.com/mcfentmen/twelvedata-mcp)";
const TD_FX = "https://api.frankfurter.dev/v1";
async function tdFx(path) {
    let res;
    try {
        res = await fetch(`${TD_FX}${path}`, {
            headers: { "User-Agent": TD_UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new Error(`Could not reach the ECB reference rate service: ${e.message}`);
    }
    if (!res.ok) {
        throw new Error(`The reference rate service returned HTTP ${res.status}; a currency code it does not publish is the usual cause.`);
    }
    return (await res.json());
}
const tdValid = (code) => /^[A-Z]{3}$/.test(code);
const tdIso = (offsetDays) => {
    const d = new Date(Date.now() - offsetDays * 86400000);
    return d.toISOString().slice(0, 10);
};
function tdSigned(n, digits = 2) {
    if (n === null || !Number.isFinite(n))
        return "-";
    return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;
}
/**
 * The whole board against one base: every currency the ECB fixes, how far each
 * moved since the previous fixing, and which end of the move each sits on.
 * `latest` alone cannot show a move, so this reads the last few published days.
 */
export async function fxBoard(args) {
    const base = (String(args?.base ?? "EUR").trim().toUpperCase() || "EUR");
    if (!tdValid(base))
        throw new Error("Give a three-letter base currency code, for example EUR or USD.");
    const limit = Math.min(Math.max(Number(args?.limit ?? 12) || 12, 1), 30);
    const series = await tdFx(`/${tdIso(10)}..${tdIso(0)}?base=${base}`);
    const byDate = series.rates ?? {};
    const dates = Object.keys(byDate).sort();
    if (dates.length < 2) {
        throw new Error(`The reference rate service published ${dates.length} fixing(s) for ${base} in the last ten days, too few to compare against a prior fixing.`);
    }
    const latestDate = dates[dates.length - 1];
    const priorDate = dates[dates.length - 2];
    const latest = byDate[latestDate] ?? {};
    const prior = byDate[priorDate] ?? {};
    const codes = Object.keys(latest).filter((c) => typeof latest[c] === "number" && c !== base).sort();
    if (!codes.length)
        throw new Error(`The service published no rates against ${base} on ${latestDate}.`);
    const rows = codes.map((code) => {
        const rate = latest[code];
        const before = typeof prior[code] === "number" ? prior[code] : null;
        const change = before === null ? null : rate - before;
        const pct = before === null || before === 0 ? null : ((rate - before) / before) * 100;
        return { code, rate, before, change, pct };
    });
    const moved = rows.filter((r) => r.pct !== null);
    const strongest = moved.length ? moved.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
    const weakest = moved.length ? moved.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
    const biggest = moved.length ? moved.reduce((a, b) => (Math.abs(b.pct) > Math.abs(a.pct) ? b : a)) : null;
    const listed = [...rows].sort((a, b) => Math.abs(b.pct ?? 0) - Math.abs(a.pct ?? 0)).slice(0, limit);
    const unchanged = moved.filter((r) => Math.abs(r.pct) < 0.0001).length;
    return [
        `European Central Bank reference rates against ${base}`,
        `  fixing of ${latestDate}, compared with the prior fixing of ${priorDate}`,
        `  ${rows.length} currency(ies) published; ${moved.length} could be compared, ${unchanged} of those unchanged`,
        strongest ? `  strongest ${strongest.code} ${tdSigned(strongest.pct)}%   weakest ${weakest.code} ${tdSigned(weakest.pct)}%   biggest move ${biggest.code} ${tdSigned(biggest.pct)}%` : "  no pair had a prior fixing to compare against",
        "",
        `Rates and moves, largest move first (${Math.min(limit, rows.length)} of ${rows.length}):`,
        ...listed.map((r) => `  ${r.code}  ${r.rate.toFixed(4).padStart(11)}  ${tdSigned(r.pct).padStart(8)}%  ${r.change === null ? "     -" : tdSigned(r.change, 4).padStart(9)}`),
        rows.length > listed.length ? `  ...and ${rows.length - listed.length} more currency(ies) the limit hid.` : "",
        "",
        `A rate here is how many units of the quote currency one ${base} buys at the ECB's daily fixing, so a positive move means ${base} strengthened against that currency. Fixings are published on working days only, which is why the prior date is not always yesterday.`,
    ].filter(Boolean).join("\n");
}
/**
 * What one currency pair actually did over a stretch of published days: its
 * opening and closing fix, the high and low it touched, the average, and the size
 * of the swing. A single quote cannot answer any of that.
 */
export async function fxHistory(args) {
    const base = String(args.base ?? "").trim().toUpperCase();
    const quote = String(args.quote ?? "").trim().toUpperCase();
    if (!tdValid(base) || !tdValid(quote)) {
        throw new Error("Give two three-letter currency codes, for example base EUR and quote USD.");
    }
    if (base === quote)
        throw new Error("The base and the quote currency are the same, which has no rate to report.");
    const days = Math.min(Math.max(Number(args.days ?? 30) || 30, 2), 400);
    const series = await tdFx(`/${tdIso(days + 7)}..${tdIso(0)}?base=${base}&symbols=${quote}`);
    // The service keys the series by date, so it has to be walked as entries.
    const daily = series.rates ?? {};
    const rows = Object.entries(daily)
        .map(([date, values]) => ({ date, value: values?.[quote] }))
        .filter((r) => typeof r.value === "number")
        .sort((a, b) => (a.date < b.date ? -1 : 1));
    if (rows.length < 2) {
        return `The reference rate service published ${rows.length} fixing(s) for ${base}/${quote} in the last ${days} days, which is too few to describe a trend.`;
    }
    const window = rows.slice(-days);
    const values = window.map((r) => r.value);
    const first = window[0];
    const last = window[window.length - 1];
    const high = window.reduce((a, b) => (b.value > a.value ? b : a));
    const low = window.reduce((a, b) => (b.value < a.value ? b : a));
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const netPct = ((last.value - first.value) / first.value) * 100;
    const rangePct = ((high.value - low.value) / low.value) * 100;
    // A crude direction count, stated as what it is rather than dressed up as a signal.
    let up = 0;
    for (let i = 1; i < window.length; i += 1)
        if (window[i].value > window[i - 1].value)
            up += 1;
    return [
        `Reference rate history for ${base}/${quote}`,
        `  ${window.length} published fixing(s) from ${first.date} to ${last.date} (asked for ${days} days)`,
        "",
        `  opening fix ${first.date}: ${first.value.toFixed(4)}`,
        `  closing fix ${last.date}: ${last.value.toFixed(4)}`,
        `  net change: ${netPct >= 0 ? "+" : ""}${netPct.toFixed(2)}% over the window`,
        `  high ${high.value.toFixed(4)} on ${high.date} | low ${low.value.toFixed(4)} on ${low.date}`,
        `  high-to-low range ${rangePct.toFixed(2)}% of the low, which is ${average.toFixed(4)} as a mean of the ${window.length} fixings`,
        `  ${up} of the ${window.length - 1} day-to-day steps were up, ${window.length - 1 - up} were down`,
        "",
        "Fixings, most recent last:",
        ...window.map((r) => {
            const index = rows.indexOf(r);
            const before = index > 0 ? rows[index - 1].value : null;
            const step = before ? ((r.value - before) / before) * 100 : null;
            return `  ${r.date}  ${r.value.toFixed(4).padStart(10)}  ${step === null ? "     -" : `${step >= 0 ? "+" : ""}${step.toFixed(2)}%`.padStart(8)}  ${step === null ? "" : "#".repeat(Math.min(30, Math.round(Math.abs(step) * 15)))}`;
        }),
        "",
        "Each row is one European Central Bank reference fixing, published on working days only, so weekends and holidays are absent rather than zero-filled. A rate rising means one unit of the base buys more of the quote, which is the opposite of the quote strengthening against the base.",
    ].join("\n");
}
