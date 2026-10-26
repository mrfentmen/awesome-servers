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
