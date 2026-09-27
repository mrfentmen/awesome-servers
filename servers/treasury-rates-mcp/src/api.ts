const BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange"
const UA = "mrfentmen-treasury-rates-mcp/1.0 (https://github.com/mrfentmen)"
export class TreasuryError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new TreasuryError(`Treasury returned HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function rates(args: { country?: string; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 25)
  const country = (args.country ?? "").trim()
  let url = `${BASE}?fields=country_currency_desc,currency,exchange_rate,record_date&sort=-record_date&page[size]=${limit}`
  if (country) {
    url = `${BASE}?fields=country_currency_desc,currency,exchange_rate,record_date&filter=country_currency_desc:eq:${encodeURIComponent(country)}&sort=-record_date&page[size]=${limit}`
  }
  const d = await get<any>(url)
  const rows = (d?.data ?? []) as any[]
  if (!rows.length) return country ? `No rates found for ${country}` : "No rates found"
  const lines = rows.map((r: any, i: number) => {
    const rate = r?.exchange_rate != null ? Number(r.exchange_rate).toFixed(4) : "n/a"
    return `${i + 1}. ${r?.country_currency_desc ?? "n/a"} | ${r?.currency ?? ""} | ${rate} per USD | ${r?.record_date?.slice(0, 10) ?? ""}`
  })
  return `US Treasury exchange rates${country ? ` for ${country}` : ""} (newest first):\n` + lines.join("\n")
}

const ROOT = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service"

async function table(path: string, fields: string, limit: number): Promise<any[]> {
  const d = await get<any>(`${ROOT}/${path}?fields=${fields}&sort=-record_date&page[size]=${limit}`)
  return (d?.data ?? []) as any[]
}

function rowsToText(rows: any[], pick: (r: any) => string): string {
  return rows.map((r, i) => `${i + 1}. ${pick(r)}`).join("\n")
}

export async function avgInterest(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 5, 25)
  const rows = await table("v2/accounting/od/avg_interest_rates", "record_date,security_type_desc,avg_interest_rate_amt", limit)
  if (!rows.length) return "No average interest rates found"
  return `Average interest rates (newest first):\n` + rowsToText(rows, (r) => `${r?.record_date?.slice(0, 10) ?? ""} | ${r?.security_type_desc ?? ""} | ${r?.avg_interest_rate_amt ?? "n/a"}%`)
}

export async function debtTotal(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 5, 25)
  const rows = await table("v1/debt/mspd/mspd_table_1", "record_date,security_type_desc,total_mil_amt", limit)
  if (!rows.length) return "No debt data found"
  return `Monthly statement of public debt (USD millions):\n` + rowsToText(rows, (r) => `${r?.record_date?.slice(0, 10) ?? ""} | ${r?.security_type_desc ?? ""} | $${Number(r?.total_mil_amt ?? 0).toLocaleString()}M`)
}

function mAmount(v: unknown): string {
  const n = Number(v)
  return Number.isFinite(n) ? `$${n.toLocaleString()}M` : "n/a"
}

export async function mtsSpending(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 5, 25)
  const rows = await table("v1/accounting/mts/mts_table_5", "record_date,classification_desc,current_month_gross_outly_amt,current_fytd_gross_outly_amt", limit)
  if (!rows.length) return "No MTS data found"
  return `Monthly Treasury statement, table 5 (outlays):\n` + rowsToText(rows, (r) => `${r?.record_date?.slice(0, 10) ?? ""} | ${(r?.classification_desc ?? "").slice(0, 60)} | month ${mAmount(r?.current_month_gross_outly_amt)} | FY ${mAmount(r?.current_fytd_gross_outly_amt)}`)
}

export async function cashOps(args: { limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 5, 25)
  const rows = await table("v1/accounting/dts/deposits_withdrawals_operating_cash", "record_date,transaction_type,transaction_today_amt", limit)
  if (!rows.length) return "No daily cash data found"
  return `Daily Treasury cash operations:\n` + rowsToText(rows, (r) => `${r?.record_date?.slice(0, 10) ?? ""} | ${(r?.transaction_type ?? "").slice(0, 50)} | $${Number(r?.transaction_today_amt ?? 0).toLocaleString()}M`)
}

export async function debtPenny(): Promise<string> {
  const rows = await table("v2/accounting/od/debt_to_penny", "record_date,tot_pub_debt_out_amt", 1)
  const r = rows[0]
  if (!r) return "No debt-to-penny data found"
  return `Total US public debt outstanding (${String(r.record_date ?? "").slice(0, 10)}): $${Number(r.tot_pub_debt_out_amt ?? 0).toLocaleString()}`
}
