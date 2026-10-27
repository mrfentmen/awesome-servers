/**
 * Wise API client. Requires WISE_API_TOKEN.
 * Create a free token in your Wise account (Settings > API tokens).
 * Docs: https://docs.wise.com/api-docs/
 */
const BASE = "https://api.wise.com"

export class WiseError extends Error {}

function token(): string {
  const t = process.env.WISE_API_TOKEN
  if (!t) throw new WiseError("Set WISE_API_TOKEN first (free in your Wise account settings).")
  return t
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "wise-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${token()}` },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new WiseError("Wise rejected the token (401/403). Check WISE_API_TOKEN.")
  if (res.status === 404) throw new WiseError("Not found.")
  if (!res.ok) throw new WiseError(`Wise error ${res.status}`)
  return (await res.json()) as T
}

export interface Profile {
  id: number
  type?: string
  name?: string
}

export async function listProfiles(): Promise<Profile[]> {
  const rows = await getJson<Raw[]>("/v2/profiles")
  return rows.map((p) => ({
    id: Number(p.id),
    type: p.type,
    name: p.details ? String(p.details.firstName ?? p.details.name ?? p.details.businessName ?? "") : undefined,
  }))
}

export interface Balance {
  currency?: string
  amount?: number
}

export async function getBalances(profileId: string): Promise<Balance[]> {
  if (!/^\d+$/.test(profileId.trim())) throw new WiseError(`Profile id must be numeric, got "${profileId}".`)
  const data = await getJson<Raw[]>(`/v4/profiles/${profileId.trim()}/balances?types=STANDARD`)
  return data.flatMap((b) =>
    (Array.isArray(b.balances) ? b.balances : []).map((x: Raw) => ({
      currency: x.currency,
      amount: typeof x.amount?.value === "number" ? x.amount.value : undefined,
    }))
  )
}

export async function exchangeRate(from: string, to: string): Promise<number> {
  const data = await getJson<Raw>(`/v1/rates?source=${encodeURIComponent(from.trim().toUpperCase())}&target=${encodeURIComponent(to.trim().toUpperCase())}`)
  const rows: Raw[] = Array.isArray(data) ? data : []
  const rate = rows.length > 0 ? Number(rows[0].rate) : NaN
  if (!isFinite(rate)) throw new WiseError(`No rate for ${from} to ${to}.`)
  return rate
}
