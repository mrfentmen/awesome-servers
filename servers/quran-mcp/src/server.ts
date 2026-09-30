import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { verse, surahInfo, chapters, chapter, page_verses } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: 'quran-mcp', version: '1.0.0' })
  server.registerTool(
    'verse',
    {
      title: "Verse",
      description: 'Quran verse in Arabic and English from alQuran.cloud.',
      inputSchema: z.object( { chapter: z.number().describe('Surah number 1 to 114.').optional(), verse: z.number().describe('Verse number.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await verse(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'surahInfo',
    {
      title: "Surah Info",
      description: 'Surah overview from alQuran.cloud.',
      inputSchema: z.object( { chapter: z.number().describe('Surah number 1 to 114.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await surahInfo(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'chapters',
    {
      title: "Chapters",
      description: 'List all 114 chapters from Quran.com.',
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
    try { return text(await chapters()) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    'chapter',
    {
      title: "Chapter",
      description: 'Chapter details from Quran.com.',
      inputSchema: z.object( { id: z.number().describe('Chapter id.').optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await chapter(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "verse_position",
    {
      title: "Verse position",
      description: "Show where a verse sits in the traditional reading structure: its juz of 30, hizb of 60, rub el hizb, ruku within the surah, manzil of 7, whether it carries a prostration, and the mushaf page, alongside the Arabic and a translation. The existing verse tool returns only the text of a verse, so none of this is reachable through it.",
      inputSchema: z.object({
        chapter: z.number().int().min(1).max(114).describe("Surah number 1 to 114."),
        verse: z.number().int().min(1).max(286).describe("Verse number within the surah."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: verse_position ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_quran_verse_position", args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "surah_order",
    {
      title: "Revelation order",
      description: "List the surahs in the order tradition holds they were revealed rather than the order they are printed, with revelation place, verse count and page range, and a total verse count for the selection. The existing chapters tool prints the printed order only and never mentions revelation order at all.",
      inputSchema: z.object({
        place: z.string().optional().describe("Restrict to makkah or madinah. meccan and medinan also work. Default is all 114."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: surah_order ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_quran_surah_order", args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "page_verses",
    {
      title: "Page verses",
      description: "Read one page of a standard 604 page mushaf and report which surahs fall on it, the verses grouped by surah, and roughly how many words the page carries. This is the view someone reading from a printed mushaf needs, and no existing tool can address a page at all.",
      inputSchema: z.object({
        page: z.number().int().min(1).max(604).describe("Mushaf page number 1 to 604."),
        limit: z.number().int().min(1).max(20).optional().describe("Verses to print per surah on the page. Default 10."),
      }),
      annotations: READ_ONLY,
    },
    async ({ page, limit }) => {
      try { return text(await page_verses({ page, limit })) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "recitation_audio",
    {
      title: "Recitation audio",
      description: "MP3 recitation URLs from Quran.com for a chapter or single verse, with the reciter's name and style. Reciter ids run 1 to 12.",
      inputSchema: z.object( { reciter: z.number().describe("Reciter id, 1 to 12."), chapter: z.number().describe("Chapter number, 1 to 114."), verse: z.number().describe("One verse to get audio for, instead of the whole chapter.").optional(), limit: z.number().describe("How many verse recordings to list.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: recitation_audio ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_quran_recitation_audio", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
