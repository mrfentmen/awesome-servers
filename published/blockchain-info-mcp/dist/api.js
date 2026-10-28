/**
 * Blockchain.info — keyless public API client.
 */
const BASE = "https://blockchain.info";
const SOURCE = "Blockchain.info";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "blockchain-info-mcp", accept },
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
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
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
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
function sats(value) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return "?";
    return `${(n / 100000000).toFixed(8)} BTC`;
}
function when(seconds) {
    const n = Number(seconds);
    if (!Number.isFinite(n) || n <= 0)
        return "?";
    return new Date(n * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}
export async function latestBlock() {
    const d = await getJson(`/latestblock?format=json`);
    if (!d?.hash)
        throw new SourceError("blockchain.info returned no latest block");
    return [
        `Bitcoin block ${d.height} (index ${d.block_index})`,
        `Hash: ${clean(d.hash)}`,
        `Mined: ${when(d.time)}`,
        d.prev_block ? `Previous: ${clean(d.prev_block)}` : "",
        "",
        `Mempool: https://www.blockchain.com/explorer/mempool/btc`,
    ].filter(Boolean).join("\n");
}
export async function priceTicker(a) {
    const d = await getJson(`/ticker`);
    const rows = Object.entries(d ?? {});
    if (!rows.length)
        throw new SourceError("blockchain.info returned no ticker");
    if (a.currency) {
        const code = clean(a.currency).toUpperCase();
        if (!/^[A-Z]{3}$/.test(code))
            throw new SourceError("currency must be a three-letter code");
        const row = rows.find(([k]) => k.toUpperCase() === code);
        if (!row)
            return `blockchain.info has no ${code} ticker. Known currencies: ${rows.map(([k]) => k).join(", ")}`;
        const v = row[1] ?? {};
        return [
            `BTC/${code}`,
            `last ${Number(v.last).toLocaleString("en-US")} ${clean(v.symbol) || code} · buy ${v.buy ?? "?"} · sell ${v.sell ?? "?"} · 15m ${v["15m"] ?? "?"}`,
            "",
            `Source: https://www.blockchain.com/explorer/markets`,
        ].join("\n");
    }
    return [
        `BTC price in ${rows.length} currencies:`,
        "",
        ...rows.map(([k, v]) => `- ${k}: ${Number(v?.last).toLocaleString("en-US")} ${clean(v?.symbol) || k}`),
    ].join("\n");
}
export async function addressSummary(a) {
    const address = clean(a.address);
    if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) && !/^bc1[a-z0-9]{25,62}$/.test(address)) {
        throw new SourceError("address must look like a base58 (1.../3...) or bech32 (bc1...) Bitcoin address");
    }
    const limit = a.limit ?? 5;
    if (!Number.isInteger(limit) || limit < 1 || limit > 10)
        throw new SourceError("limit must be between 1 and 10");
    const d = await getJson(`/rawaddr/${encodeURIComponent(address)}?format=json&limit=${limit}`);
    if (!d?.address)
        return `blockchain.info has no data for address ${address}.`;
    const txs = Array.isArray(d.txs) ? d.txs : [];
    return [
        `Address ${clean(d.address)}`,
        `Balance ${sats(d.final_balance)} · received ${sats(d.total_received)} · sent ${sats(d.total_sent)}`,
        `Transactions: ${d.n_tx ?? "?"} (unredeemed outputs ${d.n_unredeemed ?? "?"})`,
        "",
        txs.length ? `Latest ${txs.length} transaction(s):` : "No transactions returned.",
        ...txs.map((t) => `- ${clean(t.hash)} · ${when(t.time)} · ${t.result >= 0 ? "+" : ""}${sats(t.result)} net`),
        "",
        `Explorer: https://www.blockchain.com/explorer/addresses/btc/${encodeURIComponent(address)}`,
    ].filter(Boolean).join("\n");
}
