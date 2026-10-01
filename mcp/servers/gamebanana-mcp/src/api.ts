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

// ---- muxB tools:
type GbFile = {
  _sFile?: string;
  _nFilesize?: number;
  _sDownloadUrl?: string;
  _bIsArchived?: boolean;
  _nDownloadCount?: number;
  _sAnalysisState?: string;
}

type GbImage = { _sType?: string; _sBaseUrl?: string; _sFile?: string; _sFile530?: string }
type GbPreview = { _aImages?: GbImage[] }
type GbModPage = {
  _idRow?: number;
  _sName?: string;
  _sProfileUrl?: string;
  _tsDateAdded?: number;
  _aSubmitter?: { _sName?: string };
  _aCategory?: { _sName?: string };
  _aSuperCategory?: { _sName?: string };
  _aGame?: { _idRow?: number; _sName?: string; _sAbbreviation?: string };
  _aFiles?: GbFile[];
  _aPreviewMedia?: GbPreview;
  _nViewCount?: number;
  _nDownloadCount?: number;
  _nLikeCount?: number;
  _nPostCount?: number;
  _nSubscriberCount?: number;
  _sVersion?: string;
  _tsDateModified?: number;
  _bIsObsolete?: boolean;
  _bIsPorted?: boolean;
  _sLicense?: string;
}

async function modPage(id: number, label: string): Promise<GbModPage> {
  if (!Number.isInteger(id) || id <= 0) throw new BananaError(`Provide a numeric ${label} id, for example 241905.`)
  const data = await getJson<GbModPage>(`/Mod/${id}/ProfilePage`)
  if (!data || !data._idRow) throw new BananaError(`No mod with id ${id} on GameBanana.`)
  return data
}

const day = (secs: number | undefined): string =>
  secs ? new Date(secs * 1000).toISOString().slice(0, 10) : "not reported"

export async function modFiles(args: { id: number }): Promise<string> {
  const m = await modPage(Math.trunc(Number(args.id)), "mod")
  const files = m._aFiles ?? []
  if (!files.length) throw new BananaError(`${m._sName ?? "That mod"} has no files attached.`)
  const lines = files.map((f, i) =>
    `${i + 1}. ${f._sFile ?? "unnamed file"} - ${fmtBytes(f._nFilesize)}` +
    `${f._bIsArchived ? " | ARCHIVED" : ""}` +
    `${typeof f._nDownloadCount === "number" ? ` | ${f._nDownloadCount.toLocaleString()} downloads` : ""}` +
    `${f._sDownloadUrl ? `\n   ${f._sDownloadUrl}` : "\n   no download link reported"}`,
  )
  const total = files.reduce((sum, f) => sum + (f._nFilesize ?? 0), 0)
  return [
    `Files attached to [${m._idRow}] ${m._sName ?? "unnamed mod"} (${files.length} file(s), ${fmtBytes(total)} total)`,
    ...lines,
  ].join("\n")
}

export async function modStats(args: { id: number }): Promise<string> {
  const m = await modPage(Math.trunc(Number(args.id)), "mod")
  const num = (v: number | undefined): string => (typeof v === "number" ? v.toLocaleString() : "not reported")
  const license = (m._sLicense ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  return [
    `Statistics for [${m._idRow}] ${m._sName ?? "unnamed mod"} on GameBanana`,
    `  game: ${m._aGame?._sName ?? "not reported"}${m._aGame?._sAbbreviation ? ` (${m._aGame._sAbbreviation})` : ""}`,
    `  author: ${m._aSubmitter?._sName ?? "not reported"}`,
    `  category: ${m._aCategory?._sName ?? "not reported"} under ${m._aSuperCategory?._sName ?? "not reported"}`,
    `  version: ${m._sVersion || "not reported"} | added ${day(m._tsDateAdded)} | last modified ${day(m._tsDateModified)}`,
    `  views ${num(m._nViewCount)} | downloads ${num(m._nDownloadCount)} | likes ${num(m._nLikeCount)}`,
    `  comments ${num(m._nPostCount)} | subscribers ${num(m._nSubscriberCount)}`,
    `  obsolete: ${m._bIsObsolete ? "yes" : "no"} | ported: ${m._bIsPorted ? "yes" : "no"}`,
    `  license: ${license || "not reported"}`,
  ].join("\n")
}

export async function modPreviews(args: { id: number; limit?: number }): Promise<string> {
  const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 8) || 8), 30))
  const m = await modPage(Math.trunc(Number(args.id)), "mod")
  const images = m._aPreviewMedia?._aImages ?? []
  if (!images.length) throw new BananaError(`${m._sName ?? "That mod"} has no preview images attached.`)
  const lines = images.slice(0, limit).map((img, i) => {
    const file = img._sFile530 ?? img._sFile
    return `${i + 1}. ${img._sType ?? "image"}${file && img._sBaseUrl ? ` - ${img._sBaseUrl}/${file}` : " - no url reported"}`
  })
  return `Preview images for [${m._idRow}] ${m._sName ?? "unnamed mod"} (${images.length} attached, showing ${Math.min(limit, images.length)}):\n${lines.join("\n")}`
}
