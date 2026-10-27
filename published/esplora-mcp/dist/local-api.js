/**
 * Esplora (Blockstream) API client, keyless. Points at any Esplora
 * instance via ESPLORA_URL (default https://blockstream.info/api).
 * Docs: https://github.com/blockstream/esplora/blob/master/API.md
 */
const BASE = (process.env.ESPLORA_URL ?? "https://blockstream.info/api").replace(/\/+$/, "");
export class EsploraError extends Error {
}
async function getText(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "esplora-mcp/1.0" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new EsploraError("Not found.");
    if (!res.ok)
        throw new EsploraError(`Esplora error ${res.status}`);
    return await res.text();
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "esplora-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new EsploraError("Not found.");
    if (!res.ok)
        throw new EsploraError(`Esplora error ${res.status}`);
    return (await res.json());
}
export async function tipHeight() {
    const h = Number((await getText("/blocks/tip/height")).trim());
    if (!isFinite(h))
        throw new EsploraError("Bad tip height response.");
    return h;
}
export async function feeEstimates() {
    const fees = await getJson("/fee-estimates");
    const rows = Object.entries(fees)
        .map(([blocks, rate]) => ({ blocks: Number(blocks), rate: Number(rate) }))
        .filter((r) => isFinite(r.blocks) && isFinite(r.rate))
        .sort((a, b) => a.blocks - b.blocks)
        .slice(0, 8);
    return "Fee estimates (sat/vB by confirmation target):\n" + rows.map((r) => `~${r.blocks} blocks: ${r.rate}`).join("\n");
}
export async function mempoolFees() {
    const fees = await getJson("/mempool");
    return `Mempool: ${fees.count ?? "?"} txs, ${fees.vSize ?? "?"} vBytes, total fees ${fees.total_fee ?? "?"} sats`;
}
export async function getBlock(heightOrHash) {
    const clean = heightOrHash.trim();
    let hash = clean;
    if (/^\d+$/.test(clean)) {
        hash = (await getText(`/block-height/${clean}`)).trim();
    }
    if (!/^[0-9a-f]{64}$/i.test(hash))
        throw new EsploraError(`Not a block height or hash: "${heightOrHash}".`);
    const b = await getJson(`/block/${hash}`);
    return `Block ${b.height ?? "?"}\nHash: ${b.id ?? hash}\nTime: ${b.timestamp ? new Date(b.timestamp * 1000).toISOString().slice(0, 10) : "?"}\nTxs: ${b.tx_count ?? "?"}\nSize: ${b.size ?? "?"} bytes`;
}
export async function getTx(txid) {
    const clean = txid.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(clean))
        throw new EsploraError(`Not a txid: "${txid}".`);
    const t = await getJson(`/tx/${clean}`);
    const status = t.status ?? {};
    const vout = Array.isArray(t.vout) ? t.vout : [];
    const total = vout.reduce((n, o) => n + (typeof o.value === "number" ? o.value : 0), 0);
    return `Tx ${clean.slice(0, 16)}...\nConfirmed: ${status.confirmed === true ? `yes (block ${status.block_height ?? "?"})` : "no (mempool)"}\nFee: ${t.fee ?? "?"} sats\nOutputs total: ${(total / 1e8).toFixed(8)} BTC`;
}
export async function getAddress(address) {
    const clean = address.trim();
    if (clean.length < 26 || clean.length > 90)
        throw new EsploraError(`Not an address: "${address}".`);
    const a = await getJson(`/address/${encodeURIComponent(clean)}`);
    const chain = (a.chain_stats ?? {});
    const mem = (a.mempool_stats ?? {});
    const bal = (Number(chain.funded_txo_sum ?? 0) - Number(chain.spent_txo_sum ?? 0)) / 1e8;
    return `${clean}\nBalance: ${bal.toFixed(8)} BTC (${chain.tx_count ?? 0} txs)\nMempool: ${mem.tx_count ?? 0} pending`;
}
// ---- muxB tools:
const sat = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? `${n.toLocaleString()} sats` : "not reported";
};
const when = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n))
        return "time not reported";
    return new Date(n * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
};
export async function recentBlocks(heightOrTip, limit = 10) {
    const cap = Math.max(1, Math.min(limit, 25));
    let height = heightOrTip.trim();
    if (!/^\d+$/.test(height)) {
        height = (await getText("/blocks/tip/height")).trim();
    }
    if (!/^\d+$/.test(height))
        throw new EsploraError(`Not a block height: "${heightOrTip}".`);
    const blocks = await getJson(`/blocks/${height}`);
    if (!Array.isArray(blocks) || !blocks.length)
        throw new EsploraError(`No blocks at or below height ${height}.`);
    return `Most recent ${Math.min(blocks.length, cap)} Bitcoin blocks from height ${height} (Esplora lists ${blocks.length}):\n` +
        blocks.slice(0, cap).map((b, i) => [
            `${i + 1}. height ${b.height ?? "?"} | ${when(b.timestamp)}`,
            `   hash ${b.id ?? "not reported"}`,
            `   ${b.tx_count ?? "?"} txs | ${Number(b.size ?? 0).toLocaleString()} bytes | weight ${Number(b.weight ?? 0).toLocaleString()}`,
            `   merkle root ${b.merkle_root ?? "not reported"}`,
        ].join("\n")).join("\n");
}
export async function recentMempool(limit = 10) {
    const cap = Math.max(1, Math.min(limit, 30));
    const rows = await getJson("/mempool/recent");
    if (!Array.isArray(rows) || !rows.length)
        throw new EsploraError("Esplora returned no recent mempool transactions.");
    return `Most recent mempool transactions (${Math.min(rows.length, cap)} of ${rows.length} shown):\n` +
        rows.slice(0, cap).map((r, i) => {
            const vsize = Number(r.vsize ?? 0);
            const fee = Number(r.fee ?? 0);
            const rate = vsize > 0 ? (fee / vsize).toFixed(2) : "not reported";
            return `${i + 1}. ${r.txid ?? "not reported"}\n   value ${sat(r.value)} | fee ${fee} sats (${rate} sat/vB) | vsize ${vsize}`;
        }).join("\n");
}

const MEMPOOL_DA = 'https://mempool.space/api/v1/difficulty-adjustment';
export async function difficultyAdjustment() {
    const res = await fetch(MEMPOOL_DA, {
        headers: { 'User-Agent': 'mrfentmen-esplora-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new EsploraError(`mempool.space returned ${res.status}`);
    const d = (await res.json());
    if (typeof d.progressPercent !== 'number')
        throw new EsploraError('mempool.space returned no difficulty adjustment data');
    const eta = typeof d.estimatedRetargetDate === 'number' ? new Date(d.estimatedRetargetDate).toISOString().slice(0, 16).replace('T', ' ') : 'unknown';
    const hours = typeof d.remainingTime === 'number' ? (d.remainingTime / 3600000).toFixed(1) : '?';
    return [
        `Difficulty retarget ${Number(d.progressPercent).toFixed(1)}% complete`,
        `Projected change: ${Number(d.difficultyChange).toFixed(2)}%`,
        `Estimated retarget: ${eta} UTC · ${d.remainingBlocks ?? '?'} block(s), about ${hours} h`,
        `Next retarget height: ${d.nextRetargetHeight ?? '?'} · previous change ${typeof d.previousRetarget === 'number' ? d.previousRetarget.toFixed(2) + '%' : '?'}`,
        `Average block time this epoch: ${typeof d.timeAvg === 'number' ? (d.timeAvg / 60000).toFixed(2) + ' min' : '?'}`,
    ].join('\n');
}
