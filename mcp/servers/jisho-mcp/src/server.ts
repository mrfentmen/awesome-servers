import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  JishoError,
  formatWord,
  searchByTag,
  searchWords,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "jisho-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_words",
    "Search the Jisho Japanese-English dictionary. Accepts Japanese text, " +
      "romaji, or English keywords.",
    {
      keyword: z.string().describe("e.g. 'daijoubu', '大丈夫', or 'friendship'"),
      limit: z.number().int().min(1).max(15).default(10).describe("Max results"),
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
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_by_tag",
    "Search Jisho by feature or tag: '#common' for common words, " +
      "'jlpt-n5' through 'jlpt-n1' for JLPT levels, 'wanikani5' etc., " +
      "or any English meaning.",
    {
      keyword: z.string().describe("e.g. '#common', 'jlpt-n4', 'wanikani10', or 'friendship'"),
      limit: z.number().int().min(1).max(15).default(10).describe("Max results"),
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
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof JishoError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
