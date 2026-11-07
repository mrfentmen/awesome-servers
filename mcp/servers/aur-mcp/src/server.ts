import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchPackages } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "aur-mcp", version: "1.0.0" })

  server.tool(
    "search_packages",
    "Search AUR packages",
    { query: z.string().min(1).describe("Package name or description, e.g. yay"), limit: z.number().int().min(1).max(50).default(10).describe("How many packages") },
    async ({ query, limit }) => {
      try {
        return text(await searchPackages(query, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
