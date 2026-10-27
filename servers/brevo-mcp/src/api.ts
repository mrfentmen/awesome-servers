/**
 * Brevo API v3 client. Needs BREVO_API_KEY (free at https://app.brevo.com/).
 * Docs: https://developers.brevo.com/docs
 */
const BASE = "https://api.brevo.com/v3"

export class BrevoError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.BREVO_API_KEY
  if (!key) throw new BrevoError("Set BREVO_API_KEY first (free at app.brevo.com).")
  return { "User-Agent": "brevo-mcp/1.0", Accept: "application/json", "api-key": key }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new BrevoError("Brevo rejected the key (401/403).")
  if (res.status === 404) throw new BrevoError("Not found.")
  if (!res.ok) throw new BrevoError(`Brevo error ${res.status}`)
  return (await res.json()) as T
}

export async function accountInfo(): Promise<string> {
  const a = await getJson<Raw>("/account")
  const plan = (a.plan ?? {}) as Raw
  return [
    `${a.email ?? "(unknown account)"}${a.firstName ? ` (${a.firstName}${a.lastName ? ` ${a.lastName}` : ""})` : ""}`,
    `Plan: ${plan.type ?? "?"}${plan.credits ? ` — ${plan.credits} credits` : ""}`,
    a.companyName ? `Company: ${a.companyName}` : "",
  ].filter(Boolean).join("\n")
}

export interface Contact {
  email?: string
  created?: string
  blacklisted?: boolean
}

export async function listContacts(limit = 10): Promise<Contact[]> {
  const data = await getJson<Raw>(`/contacts?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.contacts) ? data.contacts : []
  return rows.slice(0, limit).map((c) => ({
    email: c.email,
    created: c.createdAt ? String(c.createdAt).slice(0, 10) : undefined,
    blacklisted: c.emailBlacklisted,
  }))
}

export async function emailReports(days = 30): Promise<string> {
  if (days < 1 || days > 90) throw new BrevoError("Days must be 1-90.")
  const data = await getJson<Raw>(`/smtp/statistics/reports?days=${days}`)
  const rows: Raw[] = Array.isArray(data.reports) ? data.reports : []
  const tot = (k: string): number => rows.reduce((n, r) => n + (Number(r[k] ?? 0) || 0), 0)
  return [
    `Email reports (last ${days}d)`,
    `Requests: ${tot("requests").toLocaleString()}`,
    `Delivered: ${tot("delivered").toLocaleString()}`,
    `Opened: ${tot("opened").toLocaleString()}`,
    `Clicked: ${tot("clicked").toLocaleString()}`,
    `Bounced: ${tot("hardBounces") + tot("softBounces")}`,
  ].join("\n")
}

export function formatContact(c: Contact, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}${c.email ?? "?"}${c.blacklisted ? " [blacklisted]" : ""}${c.created ? ` — since ${c.created}` : ""}`
}
