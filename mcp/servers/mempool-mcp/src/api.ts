const BASE = "https://mempool.space/api"

export class MempoolError extends Error {}

async function getJson(path: string, timeoutMs = 25000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "mempool-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new MempoolError("Not found on mempool.space")
    if (!res.ok) throw new MempoolError(`mempool.space responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof MempoolError) throw e
    if ((e as Error).name === "AbortError") throw new MempoolError("mempool.space request timed out")
    throw new MempoolError(`mempool.space request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

async function getText(path: string, timeoutMs = 25000): Promise<string> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "mempool-mcp" },
    })
    if (res.status === 404) throw new MempoolError("Not found on mempool.space")
    if (!res.ok) throw new MempoolError(`mempool.space responded ${res.status}`)
    return (await res.text()).trim()
  } catch (e) {
    if (e instanceof MempoolError) throw e
    if ((e as Error).name === "AbortError") throw new MempoolError("mempool.space request timed out")
    throw new MempoolError(`mempool.space request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function sats(n: unknown): string {
  const v = Number(n ?? 0)
  if (!Number.isFinite(v)) return "0"
  return `${v.toLocaleString("en-US")} sat`
}

function btc(n: unknown): string {
  const v = Number(n ?? 0) / 1e8
  return `${v.toFixed(8)} BTC`
}

function when(unix: unknown): string {
  const v = Number(unix)
  if (!Number.isFinite(v) || v <= 0) return "unknown"
  return new Date(v * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC"
}

export async function recommendedFees(): Promise<string> {
  const d = await getJson("/v1/fees/recommended")
  return [
    "Recommended Bitcoin fees (sat/vB)",
    `Fastest (next block): ${d.fastestFee}`,
    `Half hour: ${d.halfHourFee}`,
    `One hour: ${d.hourFee}`,
    `Economy: ${d.economyFee}`,
    `Minimum relay: ${d.minimumFee}`,
  ].join("\n")
}

export async function mempoolStats(): Promise<string> {
  const d = await getJson("/mempool")
  return [
    "Bitcoin mempool",
    `Pending transactions: ${Number(d.count ?? 0).toLocaleString("en-US")}`,
    `Total fees waiting: ${sats(d.total_fee)}`,
    `Backlog size: ${((Number(d.vsize ?? 0)) / 1e6).toFixed(2)} MvB`,
    `Fee histogram buckets: ${Array.isArray(d.fee_histogram) ? d.fee_histogram.length : 0}`,
  ].join("\n")
}

export async function recentBlocks(limit: number): Promise<string> {
  const d = await getJson("/v1/blocks")
  const rows: any[] = Array.isArray(d) ? d.slice(0, limit) : []
  if (rows.length === 0) return "mempool.space returned no blocks."
  const lines = rows.map(
    (b, i) =>
      `${i + 1}. height ${b.height} — ${b.tx_count} txs, ${((Number(b.size ?? 0)) / 1e6).toFixed(2)} MB, ${when(b.timestamp)}\n   ${b.id}`
  )
  return `Latest ${rows.length} Bitcoin blocks:\n\n${lines.join("\n")}`
}

export async function blockInfo(ref: string): Promise<string> {
  const clean = ref.trim()
  let b: any
  if (/^\d+$/.test(clean)) {
    // /block-height returns the hash as plain text, not JSON.
    const hash = await getText(`/block-height/${clean}`)
    if (!/^[0-9a-f]{64}$/i.test(hash)) throw new MempoolError(`No block at height ${clean}`)
    b = await getJson(`/block/${hash}`)
  } else if (/^[0-9a-fA-F]{64}$/.test(clean)) {
    b = await getJson(`/block/${clean.toLowerCase()}`)
  } else {
    throw new MempoolError("Pass a block height number or a 64-character block hash")
  }
  return [
    `Block ${b.height}`,
    `Hash: ${b.id}`,
    `Time: ${when(b.timestamp)}`,
    `Transactions: ${b.tx_count}   Size: ${((Number(b.size ?? 0)) / 1e6).toFixed(2)} MB   Weight: ${Number(b.weight ?? 0).toLocaleString("en-US")}`,
    `Difficulty: ${Number(b.difficulty ?? 0).toExponential(4)}`,
    `Merkle root: ${b.merkle_root ?? "n/a"}`,
    `Previous: ${b.previousblockhash ?? "n/a"}`,
  ].join("\n")
}

export async function addressInfo(address: string): Promise<string> {
  const addr = address.trim()
  if (!/^[a-zA-Z0-9]{14,90}$/.test(addr)) throw new MempoolError(`"${address}" is not a valid Bitcoin address`)
  const d = await getJson(`/address/${addr}`)
  const chain = d.chain_stats ?? {}
  const pool = d.mempool_stats ?? {}
  return [
    `Address: ${d.address ?? addr}`,
    `Confirmed: received ${btc(chain.funded_txo_sum)} in ${chain.funded_txo_count ?? 0} outputs, spent ${btc(chain.spent_txo_sum)}`,
    `Confirmed balance: ${btc((Number(chain.funded_txo_sum ?? 0)) - Number(chain.spent_txo_sum ?? 0))}`,
    `Transactions: ${chain.tx_count ?? 0} confirmed, ${pool.tx_count ?? 0} unconfirmed`,
    `Unconfirmed balance: ${btc((Number(pool.funded_txo_sum ?? 0)) - Number(pool.spent_txo_sum ?? 0))}`,
  ].join("\n")
}

export async function difficultyAdjustment(): Promise<string> {
  const d = await getJson("/v1/difficulty-adjustment")
  const change = Number(d.difficultyChange ?? 0)
  const prev = Number(d.previousRetarget ?? 0)
  const sign = change >= 0 ? "+" : ""
  const prevSign = prev >= 0 ? "+" : ""
  // remainingTime is milliseconds; estimatedRetargetDate is an epoch in ms.
  const hours = Number(d.remainingTime ?? 0) / 3600000
  const eta = Number(d.estimatedRetargetDate ?? 0)
  return [
    "Bitcoin difficulty adjustment",
    `Progress to next retarget: ${Number(d.progressPercent ?? 0).toFixed(1)}%`,
    `Estimated change: ${sign}${change.toFixed(2)}%`,
    `Remaining blocks: ${d.remainingBlocks ?? "?"}`,
    `Retarget in: ${hours.toFixed(1)} hours${eta ? ` (${new Date(eta).toISOString().replace("T", " ").slice(0, 16)} UTC)` : ""}`,
    `Next retarget height: ${d.nextRetargetHeight ?? "?"}`,
    `Last adjustment was: ${prevSign}${prev.toFixed(2)}%`,
    `Average block time: ${(Number(d.timeAvg ?? 0) / 60000).toFixed(1)} minutes`,
  ].join("\n")
}
