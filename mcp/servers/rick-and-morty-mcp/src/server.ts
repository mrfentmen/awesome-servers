import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchCharacters } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "rick-and-morty-mcp", version: "1.0.0" })

  server.tool(
    "search_characters",
    "Search Rick and Morty characters",
    { name: z.string().min(1).describe("Character name, e.g. Rick"), limit: z.number().int().min(1).max(20).default(5).describe("How many characters") },
    async ({ name, limit }) => {
      try {
        return text(await searchCharacters(name, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
