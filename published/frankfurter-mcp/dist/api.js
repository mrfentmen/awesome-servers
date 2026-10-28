/**
 * Frankfurter (ECB reference rates). Keyless, no signup.
 * Host moved from api.frankfurter.app to api.frankfurter.dev/v1.
 */
const BASE = "https://api.frankfurter.dev/v1";
export class FrankfurterError extends Error {
}
async function getJson(url, timeoutMs = 20000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "frankfurter-mcp" } });
        if (res.status === 404)
            throw new FrankfurterError("Frankfurter has no data for that request");
        if (res.status === 422 || res.status === 400) {
            const body = await res.text();
            throw new FrankfurterError(`Frankfurter rejected the request: ${body.slice(0, 160)}`);
        }
        if (!res.ok)
            throw new FrankfurterError(`Frankfurter responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof FrankfurterError)
            throw e;
        if (e.name === "AbortError")
            throw new FrankfurterError("Frankfurter request timed out");
        if (e instanceof SyntaxError)
            throw new FrankfurterError("Frankfurter returned malformed JSON");
        throw new FrankfurterError(`Frankfurter request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
const code = (c) => {
    const v = c.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(v))
        throw new FrankfurterError(`"${c}" is not a 3-letter currency code`);
    return v;
};
export async function currencies() {
    const d = await getJson(`${BASE}/currencies`);
    const rows = Object.entries(d ?? {});
    if (rows.length === 0)
        return "Frankfurter returned no currencies.";
    return [
        `Frankfurter tracks ${rows.length} currencies (ECB reference rates):`,
        "",
        rows.sort((a, b) => a[1].localeCompare(b[1])).map(([c, name]) => `${c} — ${name}`).join("\n"),
    ].join("\n");
}
export async function latest(base, symbols) {
    const from = code(base);
    const q = new URLSearchParams({ base: from });
    if (symbols && symbols.length)
        q.set("symbols", symbols.map(code).join(","));
    const d = await getJson(`${BASE}/latest?${q}`);
    const rates = Object.entries(d?.rates ?? {});
    if (rates.length === 0)
        return `No rates for ${from}.`;
    return [
        `1 ${from} on ${d.date} (ECB reference rates):`,
        "",
        rates.map(([c, r]) => `  ${c}  ${Number(r).toFixed(4)}`).join("\n"),
    ].join("\n");
}
export async function convert(amount, from, to) {
    const a = code(from);
    const b = code(to);
    if (a === b)
        return `${amount} ${a} = ${amount} ${b}`;
    const d = await getJson(`${BASE}/latest?base=${a}&symbols=${b}`);
    const rate = d?.rates?.[b];
    if (typeof rate !== "number")
        throw new FrankfurterError(`No rate published for ${a} → ${b}`);
    return [
        `${amount} ${a} = ${(amount * rate).toFixed(2)} ${b}`,
        `Rate: 1 ${a} = ${rate.toFixed(6)} ${b} · ECB reference for ${d.date}`,
    ].join("\n");
}
export async function history(from, to, days) {
    const a = code(from);
    const b = code(to);
    const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const d = await getJson(`${BASE}/${start}..?base=${a}&symbols=${b}`);
    const rates = d?.rates ?? {};
    const dates = Object.keys(rates).sort();
    if (dates.length === 0)
        throw new FrankfurterError(`No history for ${a} → ${b}`);
    const values = dates.map((k) => Number(rates[k][b])).filter((v) => Number.isFinite(v));
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return [
        `${a} → ${b}, last ${days} days (${dates.length} ECB days):`,
        `  first ${dates[0]}: ${first.toFixed(4)}`,
        `  last  ${dates[dates.length - 1]}: ${last.toFixed(4)}`,
        `  change: ${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        `  range: ${min.toFixed(4)} – ${max.toFixed(4)}`,
    ].join("\n");
}
export async function dateRate(date, from, to) {
    const day = date.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day))
        throw new FrankfurterError("Pass a date as YYYY-MM-DD");
    const a = code(from);
    const q = new URLSearchParams({ base: a });
    if (to)
        q.set("symbols", code(to));
    const d = await getJson(`${BASE}/${day}?${q}`);
    const rates = Object.entries(d?.rates ?? {});
    if (rates.length === 0)
        return `No rates for ${a} on ${day}.`;
    return [
        `1 ${a} on ${d.date}:`,
        "",
        rates.map(([c, r]) => `  ${c}  ${Number(r).toFixed(4)}`).join("\n"),
    ].join("\n");
}
export async function compare(currenciesList, days) {
    const codes = currenciesList.map(code);
    if (codes.length < 2)
        throw new FrankfurterError("Pass at least two currency codes to compare");
    const start = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const d = await getJson(`${BASE}/${start}..?base=USD&symbols=${codes.join(",")}`);
    const rates = d?.rates ?? {};
    const dates = Object.keys(rates).sort();
    if (dates.length === 0)
        throw new FrankfurterError("No history returned for that window");
    const first = rates[dates[0]];
    const last = rates[dates[dates.length - 1]];
    const lines = codes.map((c) => {
        const a = Number(first?.[c]);
        const b = Number(last?.[c]);
        const pct = ((b - a) / a) * 100;
        return `  ${c}: 1 USD = ${b.toFixed(4)} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}% over ${days}d)`;
    });
    return [`USD moves over the last ${days} days (${dates.length} ECB days):`, "", ...lines].join("\n");
}
