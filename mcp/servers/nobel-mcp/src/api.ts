const BASE = "https://api.nobelprize.org/2.1"
const UA = "mrfentmen-nobel-mcp/1.0 (https://github.com/mrfentmen)"
export class NobelError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new NobelError(`Nobel API error ${res.status}`)
  return (await res.json()) as T
}

export async function laureates(args: { year?: number; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 25)
  const year = args.year ? `year=${args.year}&` : ""
  const d = await get<any>(`${BASE}/laureates?${year}limit=${limit}`)
  const rows = (d.laureates ?? []).slice(0, limit)
  return rows.map((l: any) => {
    const name = l.fullName?.en ?? l.knownName?.en ?? "unknown"
    const prizes = (l.nobelPrizes ?? []).map((p: any) => `${p.category?.en ?? ""} ${p.awardYear ?? ""}`).join(", ")
    return `${name}\n  ${prizes || "no prize data"}`
  }).join("\n\n") || "No laureates found"
}

export async function prizes(args: { year?: number }): Promise<string> {
  const year = args.year ? `?year=${args.year}` : ""
  const d = await get<any>(`${BASE}/nobelPrizes.json${year}`)
  const rows = d.nobelPrizes ?? []
  return rows.map((p: any) => {
    const laureates = (p.laureates ?? []).map((l: any) => l.fullName?.en ?? l.knownName?.en ?? "unknown").join(", ")
    return `${p.awardYear ?? ""} ${p.category?.en ?? ""}\n  ${laureates || "no laureates listed"}`
  }).join("\n\n") || "No prizes found"
}

// ---- muxC tools:

const NOBEL_UA = "mrfentmen-nobel-mcp/1.0 (https://github.com/mrfentmen)"

async function nobelGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.nobelprize.org/2.1/${path}`, {
    headers: { "User-Agent": NOBEL_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new NobelError(`Nobel API error ${res.status}`)
  return (await res.json()) as T
}

