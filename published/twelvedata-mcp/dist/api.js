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
