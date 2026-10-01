/**
 * Hex API client, keyless.
 * Docs: https://github.com/hexpm/hexpm/blob/main/lib/hexpm_web/controllers/api/package_controller.ex
 */
const BASE = "https://hex.pm/api"

export class HexError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "hex-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  })
  if (res.status === 404) throw new HexError("No such package on Hex.")
  if (!res.ok) throw new HexError(`Hex error ${res.status}`)
  return (await res.json()) as T
}

export interface HexPackage {
  name: string
  description?: string
  latest?: string
  downloads?: number
  docs?: string
  repo?: string
  licenses: string[]
  releases: string[]
}

export async function getPackage(name: string): Promise<HexPackage> {
  const p = await getJson<Raw>(`/packages/${encodeURIComponent(name.trim())}`)
  const releases: Raw[] = Array.isArray(p.releases) ? p.releases : []
  const latest = releases.find((r) => r.version) ?? {}
  const links: Raw = p.meta?.links ?? p.links ?? {}
  const dl: unknown = p.downloads
  const allDl = typeof dl === "number" ? dl : typeof (dl as Record<string, unknown>)?.all === "number" ? (dl as Record<string, number>).all : undefined
  return {
    name: String(p.name ?? name),
    description: p.meta?.description ? String(p.meta.description) : undefined,
    latest: latest.version ? String(latest.version) : undefined,
    downloads: allDl,
    docs: links.Documentation || (latest.version ? `https://hexdocs.pm/${p.name}/${latest.version}` : undefined),
    repo: links.GitHub || links.Repository,
    licenses: Array.isArray(p.meta?.licenses) ? p.meta.licenses.map(String) : [],
    releases: releases.map((r) => String(r.version)).slice(0, 8),
  }
}

export interface HexRelease {
  version: string
  published?: string
  checksum?: string
  requirements: string[]
}

export async function getRelease(name: string, version: string): Promise<HexRelease> {
  const r = await getJson<Raw>(`/packages/${encodeURIComponent(name.trim())}/releases/${encodeURIComponent(version.trim())}`)
  const reqs: Raw = r.requirements ?? {}
  return {
    version: String(r.version ?? version),
    published: r.inserted_at ? String(r.inserted_at).slice(0, 10) : undefined,
    checksum: r.checksum ? String(r.checksum).slice(0, 16) + "..." : undefined,
    requirements: Object.entries(reqs).slice(0, 10).map(([k, v]) => `${k} ${(v as Raw)?.requirement ?? ""}`.trim()),
  }
}

export function formatPackage(p: HexPackage): string {
  const lines = [
    `${p.name}${p.latest ? ` ${p.latest}` : ""}`,
    p.description ? `${p.description}` : "",
    p.downloads !== undefined ? `Downloads: ${p.downloads.toLocaleString()}` : "",
    p.licenses.length ? `Licenses: ${p.licenses.join(", ")}` : "",
    p.docs ? `Docs: ${p.docs}` : "",
    p.repo ? `Repo: ${p.repo}` : "",
    p.releases.length ? `Recent releases: ${p.releases.join(", ")}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

export function formatRelease(name: string, r: HexRelease): string {
  const lines = [
    `${name} ${r.version}`,
    r.published ? `Published: ${r.published}` : "",
    r.checksum ? `Checksum: ${r.checksum}` : "",
    r.requirements.length ? `Requires:\n- ${r.requirements.join("\n- ")}` : "",
  ].filter(Boolean)
  return lines.join("\n")
}

// ---- muxB tools:

const SORTS = ["downloads", "recent_downloads", "name", "updated_at"] as const;

export interface SearchPackagesArgs {
  query: string;
  sort?: string;
  limit?: number;
}

export async function searchPackages(args: SearchPackagesArgs): Promise<string> {
  const query = (args.query ?? "").trim()
  if (!query) throw new HexError("Provide a search term, e.g. json")
  const sort = (args.sort ?? "downloads").trim()
  if (!SORTS.includes(sort as (typeof SORTS)[number])) {
    throw new HexError(`Unknown sort "${sort}". Use one of: ${SORTS.join(", ")}.`)
  }
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  const res = await getJson<Raw[]>(`/packages?search=${encodeURIComponent(query)}&sort=${encodeURIComponent(sort)}`)
  const rows = (Array.isArray(res) ? res : []).slice(0, limit)
  if (!rows.length) return `No Hex packages match "${query}".`
  return `Hex packages matching "${query}" sorted by ${sort} (${rows.length} shown):\n` +
    rows
      .map((p, i) => {
        const dl: unknown = p.downloads
        const all = typeof dl === "number" ? dl : Number((dl as Raw)?.all ?? NaN)
        const licenses = Array.isArray(p.meta?.licenses) ? p.meta.licenses.map(String).join(", ") : ""
        return [
          `${i + 1}. ${p.name ?? "?"}${p.latest_version ? ` ${p.latest_version}` : ""}`,
          `   ${String(p.meta?.description ?? "").slice(0, 140)}`,
          `   downloads: ${Number.isFinite(all) ? all.toLocaleString() : "not reported"}${licenses ? ` | licenses: ${licenses}` : ""} | updated: ${p.updated_at ? String(p.updated_at).slice(0, 10) : "not reported"}`,
          p.url ? `   ${p.url}` : "",
        ]
          .filter((l) => l !== "")
          .join("\n")
      })
      .join("\n")
}
