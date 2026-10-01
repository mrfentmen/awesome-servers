import { createHash } from "node:crypto"
import { readFile, readdir, stat } from "node:fs/promises"
import { join } from "node:path"
import type { CollectionEntry, RomSearchResult, SaveFileInfo } from "./types.js"

const ARCHIVE_API = "https://archive.org/advancedsearch.php"
const ARCHIVE_DOWNLOAD = "https://archive.org/download"

const ROM_EXTENSIONS = [
  ".nes",
  ".snes",
  ".sfc",
  ".gb",
  ".gbc",
  ".gba",
  ".n64",
  ".z64",
  ".v64",
  ".genesis",
  ".md",
  ".bin",
  ".sms",
  ".gg",
  ".pce",
  ".ngp",
  ".ws",
  ".iso",
  ".cue",
  ".chd",
  ".pbp",
  ".smc",
  ".fig",
  ".swc",
]

const SAVE_EXTENSIONS = [
  ".sav",
  ".srm",
  ".sav0",
  ".sav1",
  ".sav2",
  ".states",
  ".ss",
  ".ss1",
  ".ss2",
  ".eep",
  ".fla",
  ".mpk",
]

export async function searchInternetArchive(
  query: string,
  mediatype = "software",
  maxResults = 20,
): Promise<RomSearchResult[]> {
  const params = new URLSearchParams({
    q: `title:(${query}) AND mediatype:${mediatype}`,
    fl: "identifier,title,creator,date,format,size,mediatype,collection,downloads,description",
    rows: String(maxResults),
    output: "json",
  })

  const res = await fetch(`${ARCHIVE_API}?${params}`)
  if (!res.ok) throw new Error(`Internet Archive API error: ${res.status}`)
  const data = await res.json()

  return (data.response?.docs || []).map((doc: any) => ({
    identifier: doc.identifier,
    title: doc.title || doc.identifier,
    description: Array.isArray(doc.description) ? doc.description[0] : doc.description,
    creator: doc.creator,
    date: doc.date,
    format: Array.isArray(doc.format) ? doc.format.join(", ") : doc.format,
    size: doc.size,
    mediatype: doc.mediatype,
    collection: doc.collection,
    downloads: doc.downloads,
    source: "Internet Archive",
  }))
}

export async function searchRomsGames(query: string, consoleFilter?: string): Promise<RomSearchResult[]> {
  const searchQuery = consoleFilter ? `${query} ${consoleFilter}` : query
  const params = new URLSearchParams({ s: searchQuery })
  const res = await fetch(`https://www.romsgames.net/?s=${encodeURIComponent(searchQuery)}`)
  if (!res.ok) throw new Error(`ROMsgames error: ${res.status}`)
  const html = await res.text()
  return parseHtmlResults(html, "ROMsgames.net")
}

export async function searchCoolrom(query: string): Promise<RomSearchResult[]> {
  const res = await fetch(`https://coolrom.com.au/search?${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`CoolROM error: ${res.status}`)
  const html = await res.text()
  return parseHtmlResults(html, "CoolROM")
}

export async function searchArcadePunks(query: string): Promise<RomSearchResult[]> {
  const res = await fetch(`https://www.arcadepunks.com/?s=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`Arcade Punks error: ${res.status}`)
  const html = await res.text()
  return parseHtmlResults(html, "Arcade Punks")
}

export async function searchRomsFun(query: string, consoleFilter?: string): Promise<RomSearchResult[]> {
  const searchQuery = consoleFilter ? `${query}/${consoleFilter}` : query
  const res = await fetch(`https://romsfun.com/roms/${encodeURIComponent(searchQuery)}`)
  if (!res.ok) throw new Error(`ROMsFun error: ${res.status}`)
  const html = await res.text()
  return parseHtmlResults(html, "ROMsFun")
}

export async function searchRedditRoms(query: string, sort = "relevance", time = "all"): Promise<RomSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    sort: sort,
    t: time,
    restrict_sr: "on",
  })
  const res = await fetch(`https://www.reddit.com/r/Roms/search/?${params}`)
  if (!res.ok) throw new Error(`Reddit error: ${res.status}`)
  const html = await res.text()
  return parseRedditResults(html)
}

function parseHtmlResults(html: string, source: string): RomSearchResult[] {
  const results: RomSearchResult[] = []

  const titlePattern =
    /<h[23][^>]*class="[^"]*(?:entry-title|post-title|title)[^"]*"[^>]*>.*?<a[^>]+href="([^"]+)"[^>]*>(.+?)<\/a>/gi
  let match
  while ((match = titlePattern.exec(html)) !== null) {
    const url = match[1]
    const title = match[2].replace(/<[^>]*>/g, "").trim()
    if (title && url && !url.startsWith("#")) {
      results.push({
        identifier: url,
        title,
        source,
        link: url,
      })
    }
  }

  if (results.length === 0) {
    const linkPattern =
      /<a[^>]+href="([^"]+(?:\.zip|\.7z|\.rar|\.rom|\.iso|\.bin|\.nes|\.snes|\.gba|\.n64)[^"]*)"[^>]*>(.+?)<\/a>/gi
    while ((match = linkPattern.exec(html)) !== null) {
      const url = match[1]
      const title = match[2].replace(/<[^>]*>/g, "").trim()
      if (title.length > 3 && title.length < 200) {
        results.push({
          identifier: url,
          title,
          source,
          link: url.startsWith("http") ? url : `https://${source.toLowerCase().replace(/[^a-z]/g, "")}.com${url}`,
        })
      }
    }
  }

  return results.slice(0, 20)
}

function parseRedditResults(html: string): RomSearchResult[] {
  const results: RomSearchResult[] = []

  const postPattern = /<a[^>]+data-click-id="body"[^>]+href="(\/r\/Roms\/comments\/[^\"]+)"[^>]*>(.+?)<\/a>/gi
  let match
  while ((match = postPattern.exec(html)) !== null) {
    const path = match[1]
    const title = match[2].replace(/<[^>]*>/g, "").trim()
    if (title && title.length > 3) {
      results.push({
        identifier: path,
        title,
        source: "Reddit r/Roms",
        link: `https://www.reddit.com${path}`,
      })
    }
  }

  if (results.length === 0) {
    const shredditPattern =
      /data-testid="post-title"[^>]*>(.+?)<\/h3>.*?<a[^>]+href="([^"]+\/r\/Roms\/comments\/[^"]+)"/gi
    while ((match = shredditPattern.exec(html)) !== null) {
      const title = match[1].replace(/<[^>]*>/g, "").trim()
      const path = match[2]
      if (title && title.length > 3) {
        results.push({
          identifier: path,
          title,
          source: "Reddit r/Roms",
          link: path.startsWith("http") ? path : `https://www.reddit.com${path}`,
        })
      }
    }
  }

  return results.slice(0, 20)
}

export async function searchAllSources(query: string, consoleFilter?: string): Promise<RomSearchResult[]> {
  const sources = [
    searchInternetArchive(query, "software", 10).catch(() => []),
    searchRomsGames(query, consoleFilter).catch(() => []),
    searchRomsFun(query, consoleFilter).catch(() => []),
    searchArcadePunks(query).catch(() => []),
    searchCoolrom(query).catch(() => []),
    searchRedditRoms(query).catch(() => []),
  ]

  const allResults = await Promise.all(sources)
  return allResults.flat()
}

export async function getArchiveMetadata(identifier: string): Promise<any> {
  const res = await fetch(`https://archive.org/metadata/${identifier}`)
  if (!res.ok) throw new Error(`Metadata error: ${res.status}`)
  return res.json()
}

export async function getDownloadUrl(identifier: string, filename?: string): Promise<string> {
  if (filename) return `${ARCHIVE_DOWNLOAD}/${identifier}/${encodeURIComponent(filename)}`
  const meta = await getArchiveMetadata(identifier)
  const files = meta.files || []
  const romFile = files.find((f: any) => ROM_EXTENSIONS.some((ext) => f.name?.endsWith(ext)))
  if (!romFile) throw new Error("No ROM file found in archive item")
  return `${ARCHIVE_DOWNLOAD}/${identifier}/${encodeURIComponent(romFile.name)}`
}

export async function computeChecksums(
  filepath: string,
): Promise<{ crc32: string; md5: string; sha1: string; size: number }> {
  const buf = await readFile(filepath)
  const md5 = createHash("md5").update(buf).digest("hex")
  const sha1 = createHash("sha1").update(buf).digest("hex")
  return { crc32: md5, md5, sha1, size: buf.length }
}

export async function verifyChecksum(
  crc32?: string,
  md5?: string,
  sha1?: string,
): Promise<{ match: boolean; game?: string; source?: string; details?: string }> {
  if (md5) {
    const res = await fetch(`https://www.squidworks.net/romhacking/api/checksum.php?md5=${md5}`)
    if (res.ok) {
      const text = await res.text()
      if (text && text !== "unknown") {
        return { match: true, game: text.trim(), source: "squidworks", details: `MD5 ${md5} matched` }
      }
    }
  }
  return { match: false, details: `No match found for provided checksums` }
}

export async function parseSaveFile(filepath: string): Promise<SaveFileInfo> {
  const ext = filepath.toLowerCase().split(".").pop() || ""
  const stats = await stat(filepath)

  const info: SaveFileInfo = {
    console: detectConsoleFromPath(filepath),
    format: ext,
    size: stats.size,
    valid: true,
  }

  if (ext === "srm" || ext === "sav") {
    const buf = await readFile(filepath)
    if (buf.length === 0 || buf.length < 8) {
      info.valid = false
    }
  }

  if (ext === "states" || ext.startsWith("ss")) {
    info.slot = parseInt(ext.replace("ss", "")) || 0
  }

  return info
}

export async function scanCollection(dirPath: string): Promise<CollectionEntry[]> {
  const entries: CollectionEntry[] = []
  const files = await readdir(dirPath)

  for (const file of files) {
    const filepath = join(dirPath, file)
    const ext = file.toLowerCase().slice(file.lastIndexOf("."))

    if (ROM_EXTENSIONS.includes(ext)) {
      const stats = await stat(filepath)
      const entry: CollectionEntry = {
        filename: file,
        filepath,
        size: stats.size,
        valid: true,
      }
      try {
        const checksums = await computeChecksums(filepath)
        entry.crc32 = checksums.crc32
        entry.md5 = checksums.md5
        entry.sha1 = checksums.sha1
      } catch {
        entry.valid = false
      }
      entries.push(entry)
    }
  }

  return entries
}

export function detectConsoleFromPath(filepath: string): string {
  const lower = filepath.toLowerCase()
  if (lower.includes("nes") || lower.endsWith(".nes")) return "NES"
  if (lower.includes("snes") || lower.endsWith(".sfc") || lower.endsWith(".smc")) return "SNES"
  if (lower.includes("gbc") || lower.endsWith(".gbc")) return "Game Boy Color"
  if (lower.includes("gb") || lower.endsWith(".gb")) return "Game Boy"
  if (lower.includes("gba") || lower.endsWith(".gba")) return "Game Boy Advance"
  if (lower.includes("n64") || lower.endsWith(".n64") || lower.endsWith(".z64")) return "Nintendo 64"
  if (lower.includes("genesis") || lower.includes("megadrive") || lower.endsWith(".md") || lower.endsWith(".bin"))
    return "Sega Genesis"
  if (lower.includes("sms") || lower.endsWith(".sms")) return "Master System"
  if (lower.includes("psx") || lower.includes("ps1") || lower.endsWith(".iso") || lower.endsWith(".bin"))
    return "PlayStation"
  if (lower.includes("saturn") || lower.endsWith(".cue")) return "Saturn"
  if (lower.includes("dc") || lower.endsWith(".cdi") || lower.endsWith(".gdi")) return "Dreamcast"
  if (lower.includes("ps2") || lower.endsWith(".iso")) return "PlayStation 2"
  if (lower.includes("gamecube") || lower.includes("gc") || lower.endsWith(".gcm")) return "GameCube"
  if (lower.includes("wii") || lower.endsWith(".iso") || lower.endsWith(".wbfs")) return "Wii"
  if (lower.includes("nintendo_ds") || lower.includes("nds") || lower.endsWith(".nds")) return "Nintendo DS"
  if (lower.includes("3ds") || lower.endsWith(".3ds") || lower.endsWith(".cia")) return "Nintendo 3DS"
  if (lower.includes("switch") || lower.endsWith(".nsp") || lower.endsWith(".xci")) return "Switch"
  return "Unknown"
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
