/**
 * GameBanana API v11 client — the game mods database.
 * Docs: https://gamebanana.com/apiv11  (read endpoints are public)
 *
 * The API returns `_`-prefixed keys; we normalize defensively since the
 * shape varies by endpoint and model.
 */

const BASE = "https://gamebanana.com/apiv11"

export class BananaError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", "User-Agent": "gamebanana-mcp/1.0" },
  })
  if (!res.ok) throw new BananaError(`GameBanana API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SearchResult {
  id: number
  name: string
  model: string
  url?: string
  description?: string
}

export interface GameInfo {
  id: number
  name: string
  url: string
  subtitle?: string
  viewCount?: number
  modCount?: number
}

export interface ModInfo {
  id: number
  name: string
  url: string
  description?: string
  author?: string
  dateAdded?: string
  viewCount?: number
  gameName?: string
  downloadUrl?: string
  fileSize?: number
  category?: string
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

function absUrl(u: string | undefined): string | undefined {
  if (!u) return undefined
  return u.startsWith("http") ? u : `https://gamebanana.com${u}`
}

interface RawRecord {
  _idRow?: number
  _sName?: string
  _sProfileUrl?: string
  _sModelName?: string
  _sText?: string
  _sDescription?: string
  _aSubmitter?: { _sName?: string }
  _aGame?: { _idRow?: number; _sName?: string }
  _tsDateAdded?: number
  _nViewCount?: number
  _nDownloadCount?: number
  _aFiles?: { _sFile?: string; _nFilesize?: number; _sDownloadUrl?: string }[]
  _aCategory?: { _sName?: string; _aParent?: { _sName?: string } }
  _aSuperCategory?: { _sName?: string }
  _sSubtitle?: string
}

async function search(model: string, query: string, perPage: number): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    _sSearchString: query,
    _csvModelInclusions: model,
    _nPerpage: String(perPage),
  })
  const data = await getJson<{ _aRecords?: RawRecord[] }>(
    `/Util/Search/Results?${params}`
  )
  return (data._aRecords ?? []).map((r) => ({
    id: r._idRow ?? 0,
    name: r._sName ?? "?",
    model: r._sModelName ?? model,
    url: absUrl(r._sProfileUrl),
    description: (r._sDescription ?? r._sText ?? "").slice(0, 200) || undefined,
  }))
}

export async function searchMods(query: string, perPage = 10): Promise<SearchResult[]> {
  return search("Mod", query, perPage)
}

export async function searchGames(query: string, perPage = 8): Promise<SearchResult[]> {
  return search("Game", query, perPage)
}

export async function getGame(id: number): Promise<GameInfo | null> {
  const g = await getJson<RawRecord & { _aRootCategory?: { _nChildCount?: number } }>(
    `/Game/${id}/ProfilePage`
  )
  if (!g || !g._idRow) return null
  return {
    id: g._idRow,
    name: g._sName ?? "?",
    url: absUrl(g._sProfileUrl) ?? `https://gamebanana.com/games/${id}`,
    subtitle: g._sSubtitle,
    viewCount: g._nViewCount,
    modCount: g._aRootCategory?._nChildCount,
  }
}

export async function getGameMods(gameId: number, perPage = 10): Promise<ModInfo[]> {
  const data = await getJson<{ _aRecords?: RawRecord[] }>(
    `/Game/${gameId}/Subfeed?_nPerpage=${perPage}`
  )
  return (data._aRecords ?? []).map((r) => ({
    id: r._idRow ?? 0,
    name: r._sName ?? "?",
    url: absUrl(r._sProfileUrl) ?? `https://gamebanana.com/mods/${r._idRow ?? ""}`,
    category: r._aSuperCategory?._sName ?? r._aCategory?._sName,
    viewCount: r._nViewCount,
    downloadUrl: r._aFiles?.[0]?._sDownloadUrl,
    fileSize: r._aFiles?.[0]?._nFilesize,
  }))
}

export async function getMod(id: number): Promise<ModInfo | null> {
  const m = await getJson<RawRecord>(`/Mod/${id}/ProfilePage`)
  if (!m || !m._idRow) return null
  return {
    id: m._idRow,
    name: m._sName ?? "?",
    url: absUrl(m._sProfileUrl) ?? `https://gamebanana.com/mods/${id}`,
    description: (m._sText ?? "").slice(0, 800),
    author: m._aSubmitter?._sName,
    dateAdded: m._tsDateAdded ? new Date(m._tsDateAdded * 1000).toISOString().slice(0, 10) : undefined,
    viewCount: m._nViewCount,
    downloadUrl: m._aFiles?.[0]?._sDownloadUrl,
    fileSize: m._aFiles?.[0]?._nFilesize,
    gameName: m._aGame?._sName,
    category: m._aCategory?._sName,
  }
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtBytes(n?: number): string {
  if (!n) return "?"
  if (n > 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  if (n > 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${n} B`
}

export function formatSearchResult(r: SearchResult, index: number): string {
  return (
    `${index}. [${r.model}] ${r.name} — id ${r.id}\n` +
    (r.description ? `   ${r.description}\n` : "") +
    `   ${r.url ?? "no url"}`
  )
}

export function formatGame(g: GameInfo): string {
  return (
    `[id ${g.id}] ${g.name}` +
    (g.subtitle ? ` — ${g.subtitle}` : "") +
    `\nMods: ${g.modCount ?? "?"} | Views: ${g.viewCount?.toLocaleString() ?? "?"}` +
    `\n${g.url}`
  )
}

export function formatMod(m: ModInfo): string {
  const lines = [`[id ${m.id}] ${m.name}`]
  if (m.gameName) lines.push(`Game: ${m.gameName}`)
  if (m.author) lines.push(`Author: ${m.author}`)
  if (m.category) lines.push(`Category: ${m.category}`)
  if (m.dateAdded) lines.push(`Added: ${m.dateAdded}`)
  if (m.viewCount) lines.push(`Views: ${m.viewCount.toLocaleString()}`)
  if (m.fileSize) lines.push(`Size: ${fmtBytes(m.fileSize)}`)
  if (m.description) lines.push(`\n${m.description}`)
  lines.push(`\n${m.url}`)
  if (m.downloadUrl) lines.push(`Download: ${m.downloadUrl}`)
  return lines.join("\n")
}
