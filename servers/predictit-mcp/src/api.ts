const BASE = "https://www.predictit.org/api/marketdata/all/"
const UA = "mrfentmen-predictit-mcp/1.0 (https://github.com/mrfentmen)"
export class PredictitError extends Error {}

export async function markets(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 15, 40)
  const res = await fetch(BASE, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new PredictitError(`PredictIt returned HTTP ${res.status}`)
  const d = (await res.json()) as any
  const list = (d?.markets ?? []) as any[]
  if (!list.length) return "No markets found"
  const rows = list.slice(0, limit).map((m: any, i: number) => {
    const best = (m?.lastTradePrice ?? m?.bestBuyYesCost ?? 0.5) * 100
    const short = (m?.shortName ?? m?.name ?? "").slice(0, 70)
    return `${i + 1}. ${short}\n   ${best.toFixed(0)} cents | ${m?.volume ?? 0} volume | ${m?.url ?? ""}`
  })
  return `PredictIt markets (${list.length} total, ${rows.length} shown):\n` + rows.join("\n")
}
