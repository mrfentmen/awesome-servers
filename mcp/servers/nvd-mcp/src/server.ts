import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { searchCves } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nvd-mcp", version: "1.0.0" })

  server.tool(
    "search_cves",
    "Search CVEs by keyword",
    { keyword: z.string().default("").describe("Keyword, e.g. openssl. Empty returns the newest CVEs"), severity: z.enum(["", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("").describe("Optional severity filter"), limit: z.number().int().min(1).max(20).default(5).describe("How many CVEs") },
    async ({ keyword, severity, limit }) => {
      try {
        return text(await searchCves(keyword, severity, limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
