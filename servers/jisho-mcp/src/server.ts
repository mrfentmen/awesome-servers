import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { JishoError, formatWord, searchByTag, searchWords } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "jisho-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_words",
    {
      title: "Search words",
      description: "Search the Jisho Japanese-English dictionary. Accepts Japanese text, " +
      "romaji, or English keywords.",
      inputSchema: z.object(
    {
      keyword: z.string().describe("e.g. 'daijoubu', '大丈夫', or 'friendship'"),
      limit: z.number().int().min(1).max(15).default(10).describe("Max results"),
    }),
      annotations: READ_ONLY,
    },
    async ({ keyword, limit }) => {
      try {
        const words = await searchWords(keyword, limit)
        if (words.length === 0) return text(`No results for "${keyword}".`)
        return text(
          `Jisho results for "${keyword}":\n` +
            words.map((w, i) => formatWord(w, i + 1)).join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "search_by_tag",
    {
      title: "Search by tag",
      description: "Search Jisho by feature or tag: '#common' for common words, " +
      "'jlpt-n5' through 'jlpt-n1' for JLPT levels, 'wanikani5' etc., " +
      "or any English meaning.",
      inputSchema: z.object(
    {
      keyword: z.string().describe("e.g. '#common', 'jlpt-n4', 'wanikani10', or 'friendship'"),
      limit: z.number().int().min(1).max(15).default(10).describe("Max results"),
    }),
      annotations: READ_ONLY,
    },
    async ({ keyword, limit }) => {
      try {
        const words = await searchByTag(keyword, limit)
        if (words.length === 0) return text(`No results for "${keyword}".`)
        return text(
          `Jisho results for "${keyword}":\n` +
            words.map((w, i) => formatWord(w, i + 1)).join("\n")
        )
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "all_senses",
    {
      title: "All senses",
      description: "Every sense Jisho lists for a word, with all English definitions, parts of speech, usage restrictions, see-also and antonym cross references and external reference links.",
      inputSchema: z.object( { keyword: z.string().describe("e.g. '水' or 'daijoubu'"), limit: z.number().int().min(1).max(8).default(3).describe("Max entries") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: all_senses ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jisho_all_senses", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "words_by_reading",
    {
      title: "Words by reading",
      description: "Index a Japanese reading: every Jisho entry sharing that kana or romaji reading, with its written forms, sense count and JLPT level.",
      inputSchema: z.object( { reading: z.string().describe("Reading in kana or romaji, e.g. 'みず'."), limit: z.number().int().min(1).max(20).default(12).describe("Max entries") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: words_by_reading ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jisho_words_by_reading", args)) } catch (e) { return textError(errorMessage(e)) }
    }
  )

  server.registerTool(
    "word_network",
    {
      title: "Word network",
      description: "Follow the see-also pointers out of Jisho matches and resolve each neighbour into its own entry. The all_senses tool lists see_also words but never looks one up.",
      inputSchema: z.object( { keyword: z.string().describe("Word or reading to search, e.g. '水'."), limit: z.number().describe("How many matched entries to take pointers from.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: word_network ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jisho_word_network", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  server.registerTool(
    "kanji_profile",
    {
      title: "Kanji profile",
      description: "Which kanji recur across the words a keyword matches, with the forms each appears in. No other tool on this server breaks a word down into characters.",
      inputSchema: z.object( { keyword: z.string().describe("Word or reading to search, e.g. '水'."), limit: z.number().describe("How many distinct kanji to list.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: kanji_profile ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_jisho_kanji_profile", args)) } catch (e) { return textError(errorMessage(e)) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof JishoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
