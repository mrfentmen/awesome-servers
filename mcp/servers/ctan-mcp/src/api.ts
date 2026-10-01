/**
 * CTAN JSON API client, keyless.
 * Docs: https://ctan.org/help/json
 */
const BASE = "https://ctan.org/json/2.0"

export class CtanError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "ctan-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new CtanError("No such CTAN package.")
  if (!res.ok) throw new CtanError(`CTAN error ${res.status}`)
  return (await res.json()) as T
}

export interface CtanPackage {
  key: string
  name?: string
  caption?: string
  authors: string[]
  version?: string
  ctanPath?: string
  mirrors: string[]
}

export async function getPackage(key: string): Promise<CtanPackage> {
  const clean = key.trim().toLowerCase()
  if (!/^[a-z0-9-]+$/.test(clean)) throw new CtanError(`Not a CTAN package key: "${key}".`)
  const p = await getJson<Raw>(`/pkg/${clean}`)
  const authors: Raw[] = Array.isArray(p.authors) ? p.authors : []
  const ctanPath = p.ctan?.path ? String(p.ctan.path).replace(/^\/+/, "") : undefined
  return {
    key: String(p.key ?? clean),
    name: p.name,
    caption: p.caption,
    authors: authors.map((a) => String(a.name ?? a.id ?? "?")).slice(0, 6),
    version: p.version?.number ? String(p.version.number) : undefined,
    ctanPath: p.ctan?.path,
    mirrors: [`https://ctan.org/pkg/${clean}`, ...(ctanPath ? [`https://mirrors.ctan.org/${ctanPath}`] : [])],
  }
}

export function formatPackage(p: CtanPackage): string {
  const lines = [
    `${p.key}${p.name && p.name !== p.key ? ` (${p.name})` : ""}${p.version ? ` ${p.version}` : ""}`,
    p.caption ? `${p.caption}` : "",
    p.authors.length ? `Authors: ${p.authors.join(", ")}` : "",
    p.ctanPath ? `CTAN path: ${p.ctanPath}` : "",
    p.mirrors.length ? `Links:\n- ${p.mirrors.join("\n- ")}` : "",
    `Install: tlmgr install ${p.key}`,
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxF tools:
interface CtanIndexRow {
  key: string
  name?: string
  caption?: string
}

interface CtanCopyright {
  owner?: string
  year?: string
}

interface CtanFull {
  id?: string
  name?: string
  caption?: string
  authors?: Array<{ id?: string; active?: boolean }>
  version?: { number?: string; date?: string } | null
  license?: string[]
  topics?: string[]
  repository?: string
  bugs?: string
  copyright?: CtanCopyright[]
  documentation?: Array<{ details?: string; href?: string }>
  texlive?: string
  miktex?: string
  install?: string
  ctan?: { path?: string; file?: boolean } | null
  descriptions?: Array<{ language?: string | null; text?: string }>
}

interface CtanLicense {
  key: string
  name?: string
  free?: boolean
}

async function getJsonPublic<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "ctan-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) throw new CtanError("No such CTAN package.")
  if (!res.ok) throw new CtanError(`CTAN error ${res.status}`)
  return (await res.json()) as T
}

/** The licence vocabulary CTAN itself uses, so a package licence can be read as free or not. */
export async function licenseCatalog(_args: Record<string, never>): Promise<string> {
  const rows = await getJsonPublic<CtanLicense[]>("/licenses")
  const free = rows.filter((r) => r.free)
  const restricted = rows.filter((r) => !r.free)
  const line = (r: CtanLicense) => `${r.key}: ${r.name ?? "name not reported"}`
  return [
    `CTAN licence list: ${rows.length} licence keys, ${free.length} marked free and ${restricted.length} not marked free`,
    `Marked free (${free.length}):`,
    ...free.map((r) => `- ${line(r)}`),
    `Not marked free (${restricted.length}):`,
    ...restricted.map((r) => `- ${line(r)}`),
    "A package lists its licences by these keys, so a key that is absent here cannot be read as free or non-free.",
  ].join("\n")
}
