/**
 * Arweave gateway HTTP API client, keyless.
 * Points at any gateway via ARWEAVE_URL (default https://arweave.net).
 * Docs: https://docs.arweave.org/developers/server/http-api
 */
const BASE = (process.env.ARWEAVE_URL ?? "https://arweave.net").replace(/\/+$/, "")

export class ArweaveError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getText(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "arweave-mcp/1.0" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new ArweaveError("Not found.")
  if (!res.ok) throw new ArweaveError(`Arweave error ${res.status}`)
  return await res.text()
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "arweave-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new ArweaveError("Not found.")
  if (!res.ok) throw new ArweaveError(`Arweave error ${res.status}`)
  return (await res.json()) as T
}

export async function networkInfo(): Promise<string> {
  const info = await getJson<Raw>("/info")
  return [
    `Network: ${info.network ?? "arweave"}`,
    `Height: ${(info.height ?? "?").toLocaleString?.() ?? info.height ?? "?"}`,
    `Peers: ${info.peers ?? "?"}`,
    `Queue: ${info.queue_length ?? "?"}`,
  ].join("\n")
}

export async function txStatus(id: string): Promise<string> {
  const clean = id.trim()
  if (clean.length < 40) throw new ArweaveError(`Not a tx id: "${id}".`)
  const st = await getJson<Raw>(`/tx/${clean}/status`)
  if (st.confirmed) {
    const c = (st.confirmed ?? {}) as Raw
    return `${clean.slice(0, 12)}... confirmed in block ${c.block_height ?? "?"} (${c.number_of_confirmations ?? "?"} confirmations)`
  }
  return `${clean.slice(0, 12)}... pending`
}

export async function walletBalance(address: string): Promise<string> {
  const clean = address.trim()
  if (clean.length < 40) throw new ArweaveError(`Not a wallet address: "${address}".`)
  const winston = Number(await getText(`/wallet/${clean}/balance`))
  if (!isFinite(winston)) throw new ArweaveError("Bad balance response.")
  return `${clean.slice(0, 12)}... balance: ${(winston / 1e12).toFixed(6)} AR`
}

export async function storagePrice(bytes: number): Promise<string> {
  if (!isFinite(bytes) || bytes <= 0) throw new ArweaveError("Bytes must be a positive number.")
  const winston = Number(await getText(`/price/${Math.floor(bytes)}`))
  if (!isFinite(winston)) throw new ArweaveError("Bad price response.")
  const mb = bytes / 1048576
  return `Storing ${mb >= 1 ? `${(Math.round(mb * 100) / 100).toLocaleString()} MB` : `${bytes.toLocaleString()} bytes`} costs ~${(winston / 1e12).toFixed(6)} AR`
}
