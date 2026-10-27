/**
 * Have I Been Pwned Breaches — keyless public API client.
 */
const BASE = "https://haveibeenpwned.com/api"
const SOURCE = "Have I Been Pwned Breaches"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "haveibeenpwned-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function breachLine(b: any): string {
  return [
    `- ${clean(b.Title)} (${clean(b.Name)}) · ${clean(b.Domain) || "no domain"}`,
    `  breached ${clean(b.BreachDate)} · added ${clean(b.AddedDate)?.slice(0, 10) || "?"} · ${Number(b.PwnCount).toLocaleString("en-US")} accounts${b.IsVerified ? " · verified" : " · unverified"}${b.IsSensitive ? " · sensitive" : ""}${b.IsRetired ? " · retired" : ""}`,
    Array.isArray(b.DataClasses) && b.DataClasses.length ? `  data: ${b.DataClasses.join(", ")}` : "",
  ].filter(Boolean).join("\n")
}

export async function listBreaches(a: { domain?: string; limit?: number }): Promise<string> {
  const limit = a.limit ?? 10
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new SourceError("limit must be between 1 and 50")
  const domain = a.domain ? clean(a.domain).toLowerCase() : ""
  if (domain && !/^[a-z0-9.-]{3,80}$/.test(domain)) throw new SourceError("domain must look like adobe.com")
  const d = await getJson(`/v3/breaches`)
  const all: any[] = Array.isArray(d) ? d : []
  if (!all.length) throw new SourceError("Have I Been Pwned returned no breaches")
  const rows = (domain ? all.filter((b) => clean(b.Domain).toLowerCase() === domain) : all)
    .sort((x, y) => String(y.AddedDate).localeCompare(String(x.AddedDate)))
  if (!rows.length) return `No breach in the catalogue is tied to ${domain}.`
  const accounts = rows.reduce((sum, b) => sum + Number(b.PwnCount ?? 0), 0)
  return [
    `${rows.length} breach(es)${domain ? ` for ${domain}` : " in the catalogue"} (newest first, showing ${Math.min(limit, rows.length)}):`,
    "",
    ...rows.slice(0, limit).map(breachLine),
    "",
    `Combined accounts involved: ${accounts.toLocaleString("en-US")}`,
  ].join("\n")
}

export async function breachDetail(a: { name: string }): Promise<string> {
  const name = clean(a.name)
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const b = await getJson(`/v3/breach/${encodeURIComponent(name)}`)
  if (!b || !b.Name) return `Have I Been Pwned has no breach called "${name}".`
  return [
    `${clean(b.Title)} (account name ${clean(b.Name)})`,
    `Domain: ${clean(b.Domain) || "none listed"} · breach date ${clean(b.BreachDate)} · added ${clean(b.AddedDate)?.slice(0, 10) || "?"}`,
    `Accounts: ${Number(b.PwnCount).toLocaleString("en-US")}${b.IsVerified ? " · verified" : " · unverified"}${b.IsSensitive ? " · sensitive" : ""}${b.IsRetired ? " · retired" : ""}${b.IsSpamList ? " · spam list" : ""}${b.IsMalware && !b.IsSpamList ? " · malware list" : ""}`,
    Array.isArray(b.DataClasses) && b.DataClasses.length ? `Data classes: ${b.DataClasses.join(", ")}` : "",
    "",
    clean(b.Description) ? clean(b.Description).replace(/<[^>]+>/g, "").slice(0, 1200) : "No description published.",
    Array.isArray(b.LogoPath) ? "" : "",
    `Record: https://haveibeenpwned.com/PwnedWebsites#${clean(b.Name)}`,
  ].filter(Boolean).join("\n")
}

export async function latestBreach(): Promise<string> {
  const b = await getJson(`/v3/latestbreach`)
  if (!b || !b.Name) throw new SourceError("Have I Been Pwned returned no latest breach")
  return [
    "Newest breach in the Have I Been Pwned catalogue:",
    "",
    breachLine(b),
    "",
    b.Description ? clean(b.Description).replace(/<[^>]+>/g, "").slice(0, 700) : "",
    `Record: https://haveibeenpwned.com/PwnedWebsites#${clean(b.Name)}`,
  ].filter(Boolean).join("\n")
}
