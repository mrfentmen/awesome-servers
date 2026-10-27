// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import {
  computeChecksums,
  formatFileSize,
  getDownloadUrl,
  parseSaveFile,
  scanCollection,
  searchInternetArchive,
  searchRomsGames,
  searchCoolrom,
  searchArcadePunks,
  searchRomsFun,
  searchRedditRoms,
  searchAllSources,
  verifyChecksum,
} from "./romdb.js"
import type { RomSearchResult } from "./types.js"

function formatResults(results: RomSearchResult[], query: string): string {
  if (results.length === 0) return `No ROMs found for "${query}"`
  const lines = results.map((r) => ({
    title: r.title,
    source: r.source,
    link: r.link || `https://archive.org/details/${r.identifier}`,
    size: r.size ? formatFileSize(r.size) : undefined,
    creator: r.creator,
    date: r.date,
    downloads: r.downloads,
  }))
  return JSON.stringify(lines, null, 2)
}

async function handleSearchAll(query: string, consoleFilter: string | undefined) {
  const results = await searchAllSources(query, consoleFilter)
  return formatResults(results, query)
}

async function handleSearchRomsGames(query: string, consoleFilter: string | undefined) {
  const results = await searchRomsGames(query, consoleFilter)
  return formatResults(results, query)
}

async function handleSearchCoolrom(query: string) {
  const results = await searchCoolrom(query)
  return formatResults(results, query)
}

async function handleSearchArcadePunks(query: string) {
  const results = await searchArcadePunks(query)
  return formatResults(results, query)
}

async function handleSearchRomsFun(query: string, consoleFilter: string | undefined) {
  const results = await searchRomsFun(query, consoleFilter)
  return formatResults(results, query)
}

async function handleSearchRedditRoms(query: string, sort: string, time: string) {
  const results = await searchRedditRoms(query, sort, time)
  return formatResults(results, query)
}

async function handleSearch(query: string, maxResults: number) {
  const results = await searchInternetArchive(query, "software", maxResults)
  if (results.length === 0) {
    return `No ROMs found for "${query}"`
  }
  const lines = results.map((r) => ({
    title: r.title,
    identifier: r.identifier,
    creator: r.creator || "unknown",
    date: r.date || "unknown",
    size: r.size ? formatFileSize(r.size) : "unknown",
    downloads: r.downloads || 0,
    link: `https://archive.org/details/${r.identifier}`,
  }))
  return JSON.stringify(lines, null, 2)
}

async function handleVerify(filepath: string) {
  const checksums = await computeChecksums(filepath)
  const verified = await verifyChecksum(checksums.crc32, checksums.md5, checksums.sha1)
  return JSON.stringify(
    {
      filepath,
      size: formatFileSize(checksums.size),
      md5: checksums.md5,
      sha1: checksums.sha1,
      verified: verified.match,
      game: verified.game || undefined,
      source: verified.source || undefined,
    },
    null,
    2,
  )
}

async function handleMatch(md5: string | undefined, sha1: string | undefined, crc32: string | undefined) {
  if (!md5 && !sha1 && !crc32) {
    return "Provide at least one hash (md5, sha1, or crc32)"
  }
  const result = await verifyChecksum(crc32, md5, sha1)
  return JSON.stringify(result, null, 2)
}

async function handleParseSave(filepath: string) {
  const info = await parseSaveFile(filepath)
  return JSON.stringify(info, null, 2)
}

async function handleScan(directory: string) {
  const entries = await scanCollection(directory)
  if (entries.length === 0) {
    return `No ROM files found in ${directory}`
  }
  const summary = {
    total: entries.length,
    totalSize: entries.reduce((sum, e) => sum + e.size, 0),
    roms: entries.map((e) => ({
      file: e.filename,
      size: formatFileSize(e.size),
      md5: e.md5,
      console: e.console || "unknown",
      valid: e.valid,
    })),
  }
  return JSON.stringify(summary, null, 2)
}

async function handleDownloadLink(identifier: string, filename: string | undefined) {
  return getDownloadUrl(identifier, filename)
}

async function handleDownload(identifier: string, filename: string, outputDir: string) {
  await mkdir(outputDir, { recursive: true })
  const url = await getDownloadUrl(identifier, filename)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const filepath = `${outputDir}/${filename}`
  await writeFile(filepath, buf)
  return `Downloaded ${formatFileSize(buf.length)} to ${filepath}`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "rom-mcp", version: "1.1.0" })

  server.tool(
    "search_rom",
    "Search Internet Archive for game ROMs by title, console, or keyword. Returns download links and metadata.",
    {
      query: z.string().describe("Game title or keyword to search for"),
      max_results: z.number().min(1).max(50).optional().describe("Maximum results to return"),
    },
    async (args: any) => {
      try {
        const text = await handleSearch(args.query, args.max_results ?? 20)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "verify_rom",
    "Verify a ROM file against known checksums. Computes MD5, SHA1 and checks against databases.",
    { filepath: z.string().describe("Path to the ROM file on disk") },
    async (args: any) => {
      try {
        const text = await handleVerify(args.filepath)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Verify error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "match_by_checksum",
    "Identify a game by providing its MD5, SHA1, or CRC32 hash.",
    {
      md5: z.string().optional().describe("MD5 hash of the ROM"),
      sha1: z.string().optional().describe("SHA1 hash of the ROM"),
      crc32: z.string().optional().describe("CRC32 hash of the ROM"),
    },
    async (args: any) => {
      try {
        const text = await handleMatch(args.md5, args.sha1, args.crc32)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Match error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "parse_save_file",
    "Read and parse an emulator save file (.sav, .srm, .states).",
    { filepath: z.string().describe("Path to the save file") },
    async (args: any) => {
      try {
        const text = await handleParseSave(args.filepath)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Parse error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "scan_collection",
    "Scan a directory of ROMs and identify all game files, compute checksums.",
    { directory: z.string().describe("Path to the ROM collection directory") },
    async (args: any) => {
      try {
        const text = await handleScan(args.directory)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Scan error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "get_download_link",
    "Get the direct download URL for a ROM from Internet Archive.",
    {
      identifier: z.string().describe("The Internet Archive identifier"),
      filename: z.string().optional().describe("Specific filename to download"),
    },
    async (args: any) => {
      try {
        const text = await handleDownloadLink(args.identifier, args.filename)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "download_rom",
    "Download a ROM from Internet Archive to a local directory.",
    {
      identifier: z.string().describe("Internet Archive identifier"),
      filename: z.string().describe("Filename to save as"),
      output_dir: z.string().describe("Directory to save the ROM into"),
    },
    async (args: any) => {
      try {
        const text = await handleDownload(args.identifier, args.filename, args.output_dir)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Download error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "search_all_sources",
    "Search across all ROM sources: Internet Archive, ROMsgames.net, CoolROM, Arcade Punks, ROMsFun, and Reddit r/Roms.",
    {
      query: z.string().describe("Game title or keyword to search for"),
      console_filter: z.string().optional().describe("Console type to filter by (e.g. 'nes', 'snes', 'gba')"),
    },
    async (args: any) => {
      try {
        const text = await handleSearchAll(args.query, args.console_filter)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "search_romsgames",
    "Search ROMsgames.net for game ROMs.",
    {
      query: z.string().describe("Game title or keyword to search for"),
      console_filter: z.string().optional().describe("Console type to filter by"),
    },
    async (args: any) => {
      try {
        const text = await handleSearchRomsGames(args.query, args.console_filter)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "search_coolrom",
    "Search CoolROM for game ROMs.",
    {
      query: z.string().describe("Game title or keyword to search for"),
    },
    async (args: any) => {
      try {
        const text = await handleSearchCoolrom(args.query)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "search_arcadepunks",
    "Search Arcade Punks for ROMs and related content.",
    {
      query: z.string().describe("Game title or keyword to search for"),
    },
    async (args: any) => {
      try {
        const text = await handleSearchArcadePunks(args.query)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "search_romsfun",
    "Search ROMsFun for game ROMs.",
    {
      query: z.string().describe("Game title or keyword to search for"),
      console_filter: z.string().optional().describe("Console type to filter by"),
    },
    async (args: any) => {
      try {
        const text = await handleSearchRomsFun(args.query, args.console_filter)
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "search_reddit_roms",
    "Search Reddit r/Roms for community discussions and recommendations about ROMs.",
    {
      query: z.string().describe("Search term for Reddit r/Roms"),
      sort: z.enum(["relevance", "new", "top", "comments"]).optional().describe("Sort order"),
      time: z.enum(["hour", "day", "week", "month", "year", "all"]).optional().describe("Time filter"),
    },
    async (args: any) => {
      try {
        const text = await handleSearchRedditRoms(args.query, args.sort ?? "relevance", args.time ?? "all")
        return { content: [{ type: "text", text }] }
      } catch (err) {
        return { content: [{ type: "text", text: `Search error: ${(err as Error).message}` }] }
      }
    },
  )

  server.tool(
    "detect_console",
    "Detect the likely game console from a filename or path.",
    { filepath: z.string().describe("Filename or path to detect console from") },
    async (args: any) => {
      const { detectConsoleFromPath } = await import("./romdb.js")
      const text = detectConsoleFromPath(args.filepath)
      return { content: [{ type: "text", text }] }
    },
  )

  return server
}
