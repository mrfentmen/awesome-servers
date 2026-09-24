/**
 * Mailjet API v3 client. Needs MJ_APIKEY_PUBLIC + MJ_APIKEY_PRIVATE
 * (free at https://app.mailjet.com/). Basic auth.
 * Docs: https://dev.mailjet.com/email/reference/
 */
const BASE = "https://api.mailjet.com/v3"

export class MailjetError extends Error {}

function headers(): Record<string, string> {
  const pub = process.env.MJ_APIKEY_PUBLIC
  const priv = process.env.MJ_APIKEY_PRIVATE
  if (!pub || !priv) throw new MailjetError("Set MJ_APIKEY_PUBLIC and MJ_APIKEY_PRIVATE first (free at app.mailjet.com).")
  return {
    "User-Agent": "mailjet-mcp/1.0",
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${pub}:${priv}`).toString("base64")}`,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new MailjetError("Mailjet refused (401/403). Check API keys.")
  if (res.status === 404) throw new MailjetError("Not found.")
  if (!res.ok) throw new MailjetError(`Mailjet error ${res.status}`)
  return (await res.json()) as T
}

export interface Contact {
  email?: string
  name?: string
  created?: string
  unsubscribed?: boolean
}

export async function listContacts(limit = 10): Promise<Contact[]> {
  const data = await getJson<Raw>(`/REST/contact?Limit=${Math.min(Math.max(limit, 1), 1000)}`)
  const rows: Raw[] = Array.isArray(data.Data) ? data.Data : []
  return rows.slice(0, limit).map((c) => ({
    email: c.Email,
    name: c.Name || undefined,
    created: c.CreatedAt ? String(c.CreatedAt).slice(0, 10) : undefined,
    unsubscribed: c.IsExcludedFromCampaigns,
  }))
}

export interface EmailMsg {
  id?: number
  to?: string
  subject?: string
  status?: string
  date?: string
}

export async function recentMessages(limit = 10): Promise<EmailMsg[]> {
  const data = await getJson<Raw>(`/REST/message?Limit=${Math.min(Math.max(limit, 1), 1000)}&ShowSubject=true&ShowContactAlt=true`)
  const rows: Raw[] = Array.isArray(data.Data) ? data.Data : []
  return rows.slice(0, limit).map((m) => ({
    id: m.ID,
    to: m.ContactAlt,
    subject: m.Subject,
    status: m.Status,
    date: m.ArrivedAt ? String(m.ArrivedAt).slice(0, 16).replace("T", " ") : undefined,
  }))
}

export function formatContact(c: Contact, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}${c.email ?? "?"}${c.name ? ` (${c.name})` : ""}${c.unsubscribed ? " [unsubscribed]" : ""}${c.created ? ` — since ${c.created}` : ""}`
}

export function formatMessage(m: EmailMsg, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${m.id ?? "?"}] ${m.subject ?? "(no subject)"} → ${m.to ?? "?"}${m.status ? ` [${m.status}]` : ""}${m.date ? ` (${m.date})` : ""}`
}
