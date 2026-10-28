/**
 * NPI Registry — keyless public API client.
 */
const BASE = "https://npiregistry.cms.hhs.gov/api"
const SOURCE = "NPI Registry"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "npi-registry-mcp", accept },
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

function npiQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams({ version: "2.1" })
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") q.set(k, String(v))
  return `/?${q.toString()}`
}

function describeProvider(r: any): string {
  const basic = r.basic ?? {}
  const name = r.enumeration_type === "NPI-2"
    ? clean(basic.organization_name) || "unnamed organisation"
    : [basic.first_name, basic.last_name, basic.credential].map((x) => clean(x)).filter(Boolean).join(" ") || "unnamed provider"
  const addresses: any[] = r.addresses ?? []
  const practice = addresses.find((x) => x.address_purpose === "LOCATION") ?? addresses[0] ?? {}
  const taxes: any[] = r.taxonomies ?? []
  const primary = taxes.find((t) => t.primary) ?? taxes[0]
  return [
    `${name} · NPI ${clean(r.number)} (${r.enumeration_type === "NPI-2" ? "organisation" : "individual"})`,
    practice.address_1 ? `  ${[practice.address_1, practice.address_2, practice.city, practice.state, practice.postal_code].map((x) => clean(x)).filter(Boolean).join(", ")}` : "",
    primary ? `  taxonomy: ${clean(primary.desc)}${primary.license ? ` · licence ${clean(primary.license)} (${clean(primary.state)})` : ""}` : "",
    basic.status ? `  status: ${clean(basic.status)}${basic.enumeration_date ? ` · enumerated ${clean(basic.enumeration_date)}` : ""}` : "",
  ].filter(Boolean).join("\n")
}

export async function providerByNpi(a: { npi: string }): Promise<string> {
  const npi = clean(a.npi)
  if (!/^\d{10}$/.test(npi)) throw new SourceError("npi must be exactly 10 digits")
  const d = await getJson(npiQuery({ number: npi }))
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `The NPI Registry has no provider with NPI ${npi}.`
  const r = rows[0]
  const addresses: any[] = r.addresses ?? []
  const taxes: any[] = r.taxonomies ?? []
  const identifiers: any[] = r.identifiers ?? []
  return [
    describeProvider(r),
    "",
    ...addresses.slice(0, 3).map((x) => `Address (${clean(x.address_purpose) || "other"}): ${[x.address_1, x.city, x.state, x.postal_code].map((v) => clean(v)).filter(Boolean).join(", ")}${x.telephone_number ? ` · tel ${clean(x.telephone_number)}` : ""}`),
    ...taxes.slice(0, 5).map((t) => `Taxonomy: ${clean(t.desc)}${t.primary ? " (primary)" : ""}${t.state ? ` · ${clean(t.state)}` : ""}`),
    ...identifiers.slice(0, 5).map((i) => `Other id: ${clean(i.identifier)} (${clean(i.desc)})`),
    basicLine(r),
    `Registry: https://npiregistry.cms.hhs.gov/provider-view/${npi}`,
  ].filter(Boolean).join("\n")
}

function basicLine(r: any): string {
  const basic = r.basic ?? {}
  const bits = [basic.enumeration_date ? `enumeration ${clean(basic.enumeration_date)}` : "", basic.last_updated ? `updated ${clean(basic.last_updated)}` : "", basic.gender ? `gender ${clean(basic.gender)}` : ""].filter(Boolean)
  return bits.length ? `Record: ${bits.join(" · ")}` : ""
}

export async function searchProviders(a: { lastName?: string; firstName?: string; state?: string; taxonomies?: string; limit?: number }): Promise<string> {
  if (!a.lastName && !a.firstName && !a.taxonomies) throw new SourceError("pass lastName, firstName or taxonomies")
  if (a.state && !/^[A-Za-z]{2}$/.test(clean(a.state))) throw new SourceError("state must be a two-letter code")
  const limit = a.limit ?? 5
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new SourceError("limit must be between 1 and 20")
  const d = await getJson(npiQuery({
    last_name: a.lastName ? clean(a.lastName) : undefined,
    first_name: a.firstName ? clean(a.firstName) : undefined,
    state: a.state ? clean(a.state).toUpperCase() : undefined,
    taxonomy_description: a.taxonomies ? clean(a.taxonomies) : undefined,
    limit,
  }))
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `The NPI Registry returned no provider for that search.`
  return [
    `${d?.result_count ?? rows.length} providers match, showing ${rows.length}:`,
    "",
    ...rows.map(describeProvider),
  ].join("\n\n")
}

export async function searchOrganizations(a: { name: string; state?: string; city?: string; limit: number }): Promise<string> {
  const name = clean(a.name)
  if (name.length < 2) throw new SourceError("name must be at least 2 characters")
  const d = await getJson(npiQuery({
    enumeration_type: "NPI-2",
    organization_name: name,
    state: a.state ? clean(a.state).toUpperCase() : undefined,
    city: a.city ? clean(a.city) : undefined,
    limit: a.limit,
  }))
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `The NPI Registry returned no organisation for "${name}".`
  return [`${d?.result_count ?? rows.length} organisation(s) match, showing ${rows.length}:`, "", ...rows.map(describeProvider)].join("\n\n")
}

export async function providersByTaxonomy(a: { taxonomy: string; state?: string; limit: number }): Promise<string> {
  const tax = clean(a.taxonomy)
  if (tax.length < 3) throw new SourceError("taxonomy must be at least 3 characters")
  const d = await getJson(npiQuery({
    taxonomy_description: tax,
    state: a.state ? clean(a.state).toUpperCase() : undefined,
    limit: a.limit,
  }))
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `The NPI Registry returned no providers for taxonomy "${tax}".`
  return [`${d?.result_count ?? rows.length} provider(s) with taxonomy "${tax}", showing ${rows.length}:`, "", ...rows.map(describeProvider)].join("\n\n")
}

export async function providersByCity(a: { city: string; state: string; limit: number }): Promise<string> {
  const city = clean(a.city)
  const state = clean(a.state).toUpperCase()
  if (city.length < 2) throw new SourceError("city must be at least 2 characters")
  if (!/^[A-Z]{2}$/.test(state)) throw new SourceError("state must be two letters")
  const d = await getJson(npiQuery({ city, state, limit: a.limit }))
  const rows: any[] = d?.results ?? []
  if (!rows.length) return `The NPI Registry returned no providers in ${city}, ${state}.`
  return [`${d?.result_count ?? rows.length} provider(s) in ${city}, ${state}, showing ${rows.length}:`, "", ...rows.map(describeProvider)].join("\n\n")
}
