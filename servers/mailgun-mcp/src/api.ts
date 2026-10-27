/**
 * Mailgun API client. Needs MAILGUN_API_KEY (free at https://www.mailgun.com/).
 * US region default; set MAILGUN_REGION=eu for EU accounts.
 * Docs: https://documentation.mailgun.com/
 */
const REGIONS: Record<string, string> = { us: "https://api.mailgun.net", eu: "https://api.eu.mailgun.net" }

export class MailgunError extends Error {}

function base(): string {
  const r = (process.env.MAILGUN_REGION ?? "us").trim().toLowerCase()
  if (!REGIONS[r]) throw new MailgunError(`Region must be us or eu, got "${process.env.MAILGUN_REGION}".`)
  return REGIONS[r]
}

function auth(): string {
  const key = process.env.MAILGUN_API_KEY
  if (!key) throw new MailgunError("Set MAILGUN_API_KEY first (free at mailgun.com).")
  return `Basic ${Buffer.from(`api:${key}`).toString("base64")}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    headers: { "User-Agent": "mailgun-mcp/1.0", Accept: "application/json", Authorization: auth() },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new MailgunError("Mailgun rejected the key (401/403). Check MAILGUN_API_KEY and MAILGUN_REGION.")
  if (res.status === 404) throw new MailgunError("Not found.")
  if (!res.ok) throw new MailgunError(`Mailgun error ${res.status}`)
  return (await res.json()) as T
}

export interface Domain {
  name: string
  state?: string
  created?: string
}

export async function listDomains(limit = 10): Promise<Domain[]> {
  const data = await getJson<Raw>(`/v3/domains?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.items) ? data.items : []
  return rows.slice(0, limit).map((d) => ({
    name: String(d.name),
    state: d.state,
    created: d.created_at ? String(d.created_at).slice(0, 10) : undefined,
  }))
}

export interface DomainStats {
  sent?: number
  delivered?: number
  opened?: number
  failed?: number
}

export async function domainStats(domain: string): Promise<DomainStats> {
  if (!domain.includes(".")) throw new MailgunError(`Not a domain: "${domain}".`)
  const data = await getJson<Raw>(`/v3/${encodeURIComponent(domain.trim())}/stats/total?event=sent&event=delivered&event=opened&event=failed`)
  const stats: Raw = data.stats ?? {}
  const pick = (ev: string): number | undefined => {
    const row = (stats[ev] ?? {}) as Raw
    const tot = (row.total ?? {}) as Raw
    return typeof tot.count === "number" ? tot.count : undefined
  }
  return { sent: pick("sent"), delivered: pick("delivered"), opened: pick("opened"), failed: pick("failed") }
}

export async function listBounces(domain: string, limit = 10): Promise<string[]> {
  if (!domain.includes(".")) throw new MailgunError(`Not a domain: "${domain}".`)
  const data = await getJson<Raw>(`/v3/${encodeURIComponent(domain.trim())}/bounces?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.items) ? data.items : []
  return rows.slice(0, limit).map((b) => `${String(b.address ?? "?")} — ${String(b.code ?? "?")} ${String(b.error ?? "").slice(0, 100)}`)
}

export function formatStats(domain: string, s: DomainStats): string {
  const lines = [
    `Stats for ${domain}`,
    s.sent !== undefined ? `Sent: ${s.sent.toLocaleString()}` : "",
    s.delivered !== undefined ? `Delivered: ${s.delivered.toLocaleString()}` : "",
    s.opened !== undefined ? `Opened: ${s.opened.toLocaleString()}` : "",
    s.failed !== undefined ? `Failed: ${s.failed.toLocaleString()}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}
