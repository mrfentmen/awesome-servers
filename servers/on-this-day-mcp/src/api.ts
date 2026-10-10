const BASE = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday"
const UA = "mrfentmen-on-this-day-mcp/1.0 (https://github.com/mrfentmen)"
export class OnThisDayError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new OnThisDayError("Wikimedia rate limit hit, wait and retry")
  if (!res.ok) throw new OnThisDayError(`Wikimedia error ${res.status}`)
  return (await res.json()) as T
}

function validate(month: number, day: number): void {
  if (month === undefined || day === undefined || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new OnThisDayError("Provide a month 1 to 12 and a day 1 to 31")
  }
}

async function items(month: number, day: number, kind: string): Promise<any[]> {
  validate(month, day)
  const d = await get<any>(`${BASE}/${kind}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`)
  return d?.[kind] ?? []
}

function fmt(items: any[], limit: number, prefix: string): string {
  if (!items.length) return "Nothing found for this date"
  return items.slice(0, limit).map((it: any, i: number) => `${prefix} ${i + 1}. ${it?.text ?? ""}${it?.pages?.[0]?.content_urls?.desktop?.page ? ` (${it.pages[0].content_urls.desktop.page})` : ""}`).join("\n")
}

export async function events(args: { month?: number; day?: number; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 20)
  return fmt(await items(args.month ?? 0, args.day ?? 0, "events"), limit, "Event")
}

export async function births(args: { month?: number; day?: number; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 20)
  return fmt(await items(args.month ?? 0, args.day ?? 0, "births"), limit, "Birth")
}

export async function deaths(args: { month?: number; day?: number; limit?: number }): Promise<string> {
  const limit = Math.min(args.limit ?? 10, 20)
  return fmt(await items(args.month ?? 0, args.day ?? 0, "deaths"), limit, "Death")
}

// ---- muxB tools:

export interface DayFeedArgs {
  month: number
  day: number
  limit?: number
}

