const BASE = "https://api.osv.dev/v1"
const headers = { "Content-Type": "application/json", "User-Agent": "mrfentmen-osv-mcp/1.0" }

export class OsvError extends Error {}
export type PackageRef = { ecosystem: string; name: string; version?: string }

type OsvVuln = {
  id?: string
  summary?: string
  details?: string
  aliases?: string[]
  published?: string
  modified?: string
  database_specific?: Record<string, unknown>
  affected?: Array<{ package?: { ecosystem?: string; name?: string }; ranges?: unknown[]; versions?: string[]; database_specific?: Record<string, unknown> }>
  references?: Array<{ type?: string; url?: string }>
}

type OsvQuery = { package: { ecosystem: string; name: string }; version?: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new OsvError(`OSV API error ${res.status}: ${await res.text().catch(() => res.statusText)}`)
  return (await res.json()) as T
}

export async function queryPackage(ref: PackageRef): Promise<{ vulns: OsvVuln[]; nextPageToken?: string }> {
  const body: OsvQuery = { package: { ecosystem: ref.ecosystem, name: ref.name }, ...(ref.version ? { version: ref.version } : {}) }
  return request<{ vulns?: OsvVuln[]; next_page_token?: string }>("/query", { method: "POST", body: JSON.stringify(body) }).then((data) => ({ vulns: data.vulns ?? [], nextPageToken: data.next_page_token }))
}

export async function queryBatch(packages: PackageRef[]): Promise<Array<{ ref: PackageRef; vulns: OsvVuln[] }>> {
  const queries = packages.map((ref) => ({ package: { ecosystem: ref.ecosystem, name: ref.name }, ...(ref.version ? { version: ref.version } : {}) }))
  const data = await request<{ results?: Array<{ vulns?: OsvVuln[] }> }>("/querybatch", { method: "POST", body: JSON.stringify({ queries }) })
  return packages.map((ref, index) => ({ ref, vulns: data.results?.[index]?.vulns ?? [] }))
}

export function getVulnerability(id: string): Promise<OsvVuln> {
  return request<OsvVuln>(`/vulns/${encodeURIComponent(id.trim())}`)
}

export function formatVulnerability(v: OsvVuln): string {
  const lines = [
    `${v.id ?? "Unknown vulnerability"}: ${v.summary ?? "No summary"}`,
    v.aliases?.length ? `Aliases: ${v.aliases.join(", ")}` : "",
    v.published ? `Published: ${v.published}` : "",
    v.modified ? `Modified: ${v.modified}` : "",
    v.details ? `Details: ${v.details.slice(0, 1200)}` : "",
    v.affected?.length ? `Affected packages: ${v.affected.map((a) => `${a.package?.ecosystem ?? "?"}/${a.package?.name ?? "?"}`).join(", ")}` : "",
    v.references?.length ? `References:\n${v.references.slice(0, 8).map((r) => `* ${r.type ?? "reference"}: ${r.url ?? ""}`).join("\n")}` : "",
  ]
  return lines.filter(Boolean).join("\n")
}
