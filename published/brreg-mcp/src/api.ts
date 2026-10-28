/**
 * Brønnøysund Register — keyless public API client.
 */
const BASE = "https://data.brreg.no/enhetsregisteret/api"
const SOURCE = "Brønnøysund Register"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "brreg-mcp", accept },
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

const checkOrg = (raw: string): string => {
  const v = raw.trim()
  if (!/^\d{9}$/.test(v)) throw new SourceError(`"${raw}" is not a 9-digit organisation number`)
  return v
}

function address(a: any): string {
  if (!a) return ""
  return [a.adresse, [a.postnummer, a.poststed].filter(Boolean).join(" "), a.land].filter(Boolean).join(", ")
}

export async function searchCompanies(a: { name: string; limit: number }): Promise<string> {
  const name = a.name.trim()
  if (name.length < 2) throw new SourceError("company name must be at least 2 characters")
  const d = await getJson(`/enheter?navn=${encodeURIComponent(name)}&size=${a.limit}`)
  const rows: any[] = d?._embedded?.enheter ?? []
  if (!rows.length) return `No Norwegian entity matches "${name}".`
  return [
    `${Number(d?.page?.totalElements ?? rows.length).toLocaleString("en-US")} entities match "${name}":`,
    ...rows.map((r, i) => `${i + 1}. ${r.navn} (org ${r.organisasjonsnummer})\n   ${[r.organisasjonsform?.beskrivelse, address(r.forretningsadresse)].filter(Boolean).join(" · ")}`),
  ].join("\n")
}

export async function companyDetail(a: { orgNumber: string }): Promise<string> {
  const org = checkOrg(a.orgNumber)
  const r = await getJson(`/enheter/${org}`)
  return [
    `${r.navn} (org ${r.organisasjonsnummer})`,
    `Form: ${r.organisasjonsform?.beskrivelse ?? "unknown"}`,
    `Registered: ${r.registreringsdatoEnhetsregisteret ?? "?"}`,
    `Employees: ${r.antallAnsatte ?? "not disclosed"}`,
    `Industry: ${[r.naeringskode1?.kode, r.naeringskode1?.beskrivelse].filter(Boolean).join(" ")}`,
    `Business address: ${address(r.forretningsadresse) || "none"}`,
    `Municipality: ${r.forretningsadresse?.kommune ?? "?"}`,
    `Website: ${r.hjemmeside ?? "none"}`,
    `Parent group: ${r.erIKonsern ? "yes" : "no"}`,
    `VAT registered: ${r.registrertIMvaregisteret ? "yes" : "no"}`,
  ].join("\n")
}

export async function companyRoles(a: { orgNumber: string }): Promise<string> {
  const org = checkOrg(a.orgNumber)
  const d = await getJson(`/enheter/${org}/roller`)
  const groups: any[] = d?.rollegrupper ?? []
  const out: string[] = []
  for (const g of groups) {
    for (const role of g?.roller ?? []) {
      const person = role?.person
      const name = person ? [person.navn?.fornavn ?? person.fornavn, person.navn?.etternavn ?? person.etternavn].filter(Boolean).join(" ") : role?.enhet?.navn ?? "unknown"
      const type = role?.type?.beskrivelse ?? g?.type?.beskrivelse ?? "role"
      if (role?.avregistrert) continue
      out.push(`${type}: ${name}${role?.fodselsdato ? ` (born ${role.fodselsdato})` : ""}`)
    }
  }
  if (!out.length) return `No active roles listed for ${org}.`
  return [`${out.length} active roles for org ${org}:`, ...out.slice(0, 40).map((x, i) => `${i + 1}. ${x}`)].join("\n")
}
