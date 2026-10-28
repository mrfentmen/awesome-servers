/**
 * Nasdaq Quotes — keyless public API client.
 */
const BASE = "https://api.nasdaq.com/api";
const SOURCE = "Nasdaq Quotes";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "nasdaq-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path, accept = "application/json", timeoutMs = 25000) {
    const res = await request(path, accept, timeoutMs);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
function checkSymbol(value) {
    const v = clean(value).toUpperCase();
    if (!/^[A-Z0-9.\-]{1,10}$/.test(v))
        throw new SourceError(`"${value}" is not a valid ticker symbol`);
    return v;
}
export async function stockQuote(a) {
    const symbol = checkSymbol(a.symbol);
    const data = await getJson(`/quote/${encodeURIComponent(symbol)}/info?assetclass=stocks`, "application/json", 30000);
    const d = data?.data;
    if (!d || !d.symbol)
        throw new SourceError(`Nasdaq has no quote for "${symbol}"`);
    const primary = d.primaryData ?? {};
    const secondary = d.secondaryData ?? {};
    // Outside the regular session the primary block carries empty change fields
    // and the last close lives in the secondary block, so fall back per field.
    const changeRaw = clean(primary.netChange) || clean(secondary.netChange);
    const pctRaw = clean(primary.percentageChange) || clean(secondary.percentageChange);
    const delta = clean(clean(primary.netChange) ? primary.deltaIndicator : secondary.deltaIndicator);
    const sign = !changeRaw ? "" : /^[+-]/.test(changeRaw) ? "" : delta === "up" ? "+" : delta === "down" ? "-" : "";
    const changeText = changeRaw ? `  ${sign}${changeRaw}${pctRaw ? ` (${pctRaw})` : ""}` : "";
    const lastPrice = clean(primary.lastSalePrice) || clean(secondary.lastSalePrice) || "n/a";
    return [
        `${clean(d.companyName)} (${clean(d.symbol)})${d.exchange ? ` · ${clean(d.exchange)}` : ""}`,
        "",
        `Price: ${lastPrice}${changeText}`,
        bullet("market status", d.marketStatus),
        bullet("as of", clean(primary.lastTradeTimestamp) || secondary.lastTradeTimestamp),
        bullet("volume", secondary.volume),
        bullet("today's range", secondary.todaysHigh && secondary.todaysLow ? `${clean(secondary.todaysHigh)} - ${clean(secondary.todaysLow)}` : ""),
        bullet("52 week range", secondary.fiftTwoWeekHighLow?.high && secondary.fiftTwoWeekHighLow?.low ? `${clean(secondary.fiftTwoWeekHighLow.high)} - ${clean(secondary.fiftTwoWeekHighLow.low)}` : ""),
        bullet("previous close", secondary.previousClose),
    ].filter(Boolean).join("\n");
}
function isoDay(offsetDays) {
    const d = new Date(Date.now() + offsetDays * 86400000);
    return d.toISOString().slice(0, 10);
}
export async function stockHistory(a) {
    const limit = clampLimit(a.limit, 10, 30);
    const symbol = checkSymbol(a.symbol);
    const todate = isoDay(0);
    // Calendar days back, wide enough to cover `limit` trading days.
    const fromdate = isoDay(-(limit * 2 + 10));
    const data = await getJson(`/quote/${encodeURIComponent(symbol)}/historical?assetclass=stocks&fromdate=${fromdate}&todate=${todate}&limit=${limit}`, "application/json", 30000);
    const rows = data?.data?.tradesTable?.rows;
    if (!Array.isArray(rows) || !rows.length)
        throw new SourceError(`Nasdaq has no history for "${symbol}"`);
    const info = data?.data ?? {};
    return [
        `${symbol} recent bars${info.fromDate || info.toDate ? ` (${clean(info.fromDate)} to ${clean(info.toDate)})` : ""}:`,
        "",
        "date        close       open        high        low         volume",
        ...rows.slice(0, limit).map((r) => [
            clean(r?.date).padEnd(11),
            clean(r?.close).padStart(10),
            clean(r?.open).padStart(11),
            clean(r?.high).padStart(11),
            clean(r?.low).padStart(11),
            clean(r?.volume).padStart(14),
        ].join(" ")),
    ].join("\n");
}
export async function topStocks(a) {
    const limit = clampLimit(a.limit, 15, 50);
    const offset = Math.floor(a.offset ?? 0);
    if (!Number.isInteger(offset) || offset < 0 || offset > 5000)
        throw new SourceError("offset must be between 0 and 5000");
    const data = await getJson(`/screener/stocks?limit=${limit}&offset=${offset}`, "application/json", 30000);
    const table = data?.data?.table;
    const rows = table?.rows;
    if (!Array.isArray(rows) || !rows.length)
        throw new SourceError("Nasdaq returned no screener rows");
    const total = Number(table?.totalrecords ?? data?.data?.totalrecords ?? rows.length);
    return [
        `Nasdaq screener (${total} symbols on record, showing ${rows.length} from offset ${offset}):`,
        "",
        ...rows.map((r, i) => {
            const cap = clean(r?.marketCap);
            const sector = clean(r?.sector);
            const bits = [clean(r?.lastsale), clean(r?.pctchange), cap ? `cap ${cap}` : "", sector].filter(Boolean);
            return `${String(offset + i + 1).padStart(4)}. ${clean(r?.symbol).padEnd(7)} ${clean(r?.name).slice(0, 40).padEnd(41)} ${bits.join(" · ")}`;
        }),
    ].join("\n");
}
