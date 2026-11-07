import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getSurah, searchVerses } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "alquran-mcp", version: "1.0.0" })

  server.tool(
    "get_surah",
    "One surah with Arabic and English text",
    { number: z.number().int().min(1).max(114).describe("Surah number, 1 to 114") },
    async ({ number }) => {
      try {
        return text(await getSurah(number))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_verses",
    "Search the English translation",
    { query: z.string().min(2).describe("Word or phrase, e.g. patience") },
    async ({ query }) => {
      try {
        return text(await searchVerses(query))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
