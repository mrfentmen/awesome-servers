const BASE = "https://api.nhtsa.gov/recalls"
const UA = "mrfentmen-car-recalls-mcp/1.0 (https://github.com/mrfentmen)"
export class RecallError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new RecallError(`NHTSA error ${res.status}`)
  return (await res.json()) as T
}

function fmt(r: any): string {
  return `${r.CampaignNumber ?? ""} | ${r.Component ?? ""}\n  ${(r.Summary ?? "").slice(0, 300)}\n  Consequence: ${(r.Consequence ?? "").slice(0, 200)}`
}

export async function recallsByVehicle(args: { make?: string; model?: string; year?: number }): Promise<string> {
  const make = (args.make ?? "").trim()
  const model = (args.model ?? "").trim()
  if (!make || !model || !args.year) throw new RecallError("Provide make, model, and year")
  const d = await get<any>(`${BASE}/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${args.year}`)
  const rows = d.results ?? []
  return `${rows.length} recalls for ${args.year} ${make} ${model}\n${rows.slice(0, 10).map(fmt).join("\n\n") || "No recalls found"}`
}

export async function recallByCampaign(args: { campaign?: string }): Promise<string> {
  const c = (args.campaign ?? "").trim()
  if (!c) throw new RecallError("Provide a campaign number")
  const d = await get<any>(`${BASE}/recall?campaignNumber=${encodeURIComponent(c)}`)
  const rows = d.results ?? []
  return rows.slice(0, 5).map(fmt).join("\n\n") || "No recall found"
}

// ---- muxA tools:

async function nhtsa<T>(path: string): Promise<T> {
  const res = await fetch(`https://api.nhtsa.gov${path}`, {
    headers: { 'User-Agent': 'mrfentmen-car-recalls-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (res.status === 404) throw new Error(`NHTSA has nothing at ${path}`);
  if (!res.ok) throw new Error(`NHTSA returned ${res.status} for ${path}`);
  const d = (await res.json()) as { message?: string } & T;
  if (d?.message && /error|not found|invalid/i.test(d.message)) {
    throw new Error(`NHTSA said: ${d.message}`);
  }
  return d;
}

export interface ComplaintArgs {
  make: string
  model: string
  year: number
  limit?: number
}

export interface YearsArgs {
  issueType?: string
}

