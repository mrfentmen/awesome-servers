/**
 * Esplora (Blockstream) API client, keyless. Points at any Esplora
 * instance via ESPLORA_URL (default https://blockstream.info/api).
 * Docs: https://github.com/blockstream/esplora/blob/master/API.md
 */
const BASE = (process.env.ESPLORA_URL ?? "https://blockstream.info/api").replace(/\/+$/, "")

export class EsploraError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getText(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "esplora-mcp/1.0" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new EsploraError("Not found.")
  if (!res.ok) throw new EsploraError(`Esplora error ${res.status}`)
  return await res.text()
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "esplora-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new EsploraError("Not found.")
  if (!res.ok) throw new EsploraError(`Esplora error ${res.status}`)
  return (await res.json()) as T
}

export async function tipHeight(): Promise<number> {
  const h = Number((await getText("/blocks/tip/height")).trim())
  if (!isFinite(h)) throw new EsploraError("Bad tip height response.")
  return h
}

export async function feeEstimates(): Promise<string> {
  const fees = await getJson<Raw>("/fee-estimates")
  const rows = Object.entries(fees)
    .map(([blocks, rate]) => ({ blocks: Number(blocks), rate: Number(rate) }))
    .filter((r) => isFinite(r.blocks) && isFinite(r.rate))
    .sort((a, b) => a.blocks - b.blocks)
    .slice(0, 8)
  return "Fee estimates (sat/vB by confirmation target):\n" + rows.map((r) => `~${r.blocks} blocks: ${r.rate}`).join("\n")
}

export async function mempoolFees(): Promise<string> {
  const fees = await getJson<Raw>("/mempool")
  return `Mempool: ${fees.count ?? "?"} txs, ${fees.vSize ?? "?"} vBytes, total fees ${fees.total_fee ?? "?"} sats`
}

export async function getBlock(heightOrHash: string): Promise<string> {
  const clean = heightOrHash.trim()
  let hash = clean
  if (/^\d+$/.test(clean)) {
    hash = (await getText(`/block-height/${clean}`)).trim()
  }
  if (!/^[0-9a-f]{64}$/i.test(hash)) throw new EsploraError(`Not a block height or hash: "${heightOrHash}".`)
  const b = await getJson<Raw>(`/block/${hash}`)
  return `Block ${b.height ?? "?"}\nHash: ${b.id ?? hash}\nTime: ${b.timestamp ? new Date(b.timestamp * 1000).toISOString().slice(0, 10) : "?"}\nTxs: ${b.tx_count ?? "?"}\nSize: ${b.size ?? "?"} bytes`
}

export async function getTx(txid: string): Promise<string> {
  const clean = txid.trim().toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(clean)) throw new EsploraError(`Not a txid: "${txid}".`)
  const t = await getJson<Raw>(`/tx/${clean}`)
  const status: Raw = t.status ?? {}
  const vout: Raw[] = Array.isArray(t.vout) ? t.vout : []
  const total = vout.reduce((n, o) => n + (typeof o.value === "number" ? o.value : 0), 0)
  return `Tx ${clean.slice(0, 16)}...\nConfirmed: ${status.confirmed === true ? `yes (block ${status.block_height ?? "?"})` : "no (mempool)"}\nFee: ${t.fee ?? "?"} sats\nOutputs total: ${(total / 1e8).toFixed(8)} BTC`
}

export async function getAddress(address: string): Promise<string> {
  const clean = address.trim()
  if (clean.length < 26 || clean.length > 90) throw new EsploraError(`Not an address: "${address}".`)
  const a = await getJson<Raw>(`/address/${encodeURIComponent(clean)}`)
  const chain = (a.chain_stats ?? {}) as Raw
  const mem = (a.mempool_stats ?? {}) as Raw
  const bal = (Number(chain.funded_txo_sum ?? 0) - Number(chain.spent_txo_sum ?? 0)) / 1e8
  return `${clean}\nBalance: ${bal.toFixed(8)} BTC (${chain.tx_count ?? 0} txs)\nMempool: ${mem.tx_count ?? 0} pending`
}

// ---- muxB tools:

const sat = (value: unknown): string => {
  const n = Number(value)
  return Number.isFinite(n) ? `${n.toLocaleString()} sats` : "not reported"
}

const when = (value: unknown): string => {
  const n = Number(value)
  if (!Number.isFinite(n)) return "time not reported"
  return new Date(n * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC"
}

export async function recentBlocks(heightOrTip: string, limit = 10): Promise<string> {
  const cap = Math.max(1, Math.min(limit, 25))
  let height = heightOrTip.trim()
  if (!/^\d+$/.test(height)) {
    height = (await getText("/blocks/tip/height")).trim()
  }
  if (!/^\d+$/.test(height)) throw new EsploraError(`Not a block height: "${heightOrTip}".`)
  const blocks = await getJson<Raw[]>(`/blocks/${height}`)
  if (!Array.isArray(blocks) || !blocks.length) throw new EsploraError(`No blocks at or below height ${height}.`)
  return `Most recent ${Math.min(blocks.length, cap)} Bitcoin blocks from height ${height} (Esplora lists ${blocks.length}):\n` +
    blocks.slice(0, cap).map((b, i) =>
      [
        `${i + 1}. height ${b.height ?? "?"} | ${when(b.timestamp)}`,
        `   hash ${b.id ?? "not reported"}`,
        `   ${b.tx_count ?? "?"} txs | ${Number(b.size ?? 0).toLocaleString()} bytes | weight ${Number(b.weight ?? 0).toLocaleString()}`,
        `   merkle root ${b.merkle_root ?? "not reported"}`,
      ].join("\n"),
    ).join("\n")
}

export async function recentMempool(limit = 10): Promise<string> {
  const cap = Math.max(1, Math.min(limit, 30))
  const rows = await getJson<Raw[]>("/mempool/recent")
  if (!Array.isArray(rows) || !rows.length) throw new EsploraError("Esplora returned no recent mempool transactions.")
  return `Most recent mempool transactions (${Math.min(rows.length, cap)} of ${rows.length} shown):\n` +
    rows.slice(0, cap).map((r, i) => {
      const vsize = Number(r.vsize ?? 0)
      const fee = Number(r.fee ?? 0)
      const rate = vsize > 0 ? (fee / vsize).toFixed(2) : "not reported"
      return `${i + 1}. ${r.txid ?? "not reported"}\n   value ${sat(r.value)} | fee ${fee} sats (${rate} sat/vB) | vsize ${vsize}`
    }).join("\n")
}
