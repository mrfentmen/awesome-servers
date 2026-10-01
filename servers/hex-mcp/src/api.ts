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

export interface SearchPackagesArgs {
  query: string;
  sort?: string;
  limit?: number;
}

// ---- gap4d1 tools:

function hexSegment(value: string, label: string): string {
  const clean = value.trim()
  if (!clean || clean.length > 200) throw new HexError(`Provide a ${label} of 1-200 characters.`)
  return encodeURIComponent(clean)
}

function hexField(value: unknown, max = 180): string {
  return value === null || value === undefined || value === '' ? 'not reported' : String(value).replace(/\s+/g, ' ').slice(0, max)
}

function hexLimit(value: number | undefined): number {
  return Math.max(1, Math.min(Math.trunc(Number.isFinite(value) ? value! : 20), 50))
}

export async function packageOwners(args: { name: string; limit?: number }): Promise<string> {
  const rows = await getJson<Array<{ username?: string; full_name?: string | null; level?: string }>>(`/packages/${hexSegment(args.name, 'package name')}/owners`)
  if (!Array.isArray(rows)) throw new HexError('Hex did not return an owner list.')
  const shown = rows.slice(0, hexLimit(args.limit))
  return `Owners of ${hexField(args.name)} (${shown.length} of ${rows.length} shown):\n` +
    (shown.map((owner, i) => `${i + 1}. ${hexField(owner.username)} | name: ${hexField(owner.full_name)} | permission: ${hexField(owner.level)}`).join('\n') || 'No owners reported.')
}

type HexRequirement = { requirement?: string; optional?: boolean; app?: string; repository?: string }
type HexDependencyRelease = { meta?: { elixir?: string }; requirements?: Record<string, HexRequirement> }

