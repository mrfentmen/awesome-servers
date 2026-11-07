import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { weeklyDownloads } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "npm-downloads-mcp", version: "1.0.0" })

  server.tool(
    "weekly_downloads",
    "Downloads in the last week",
    { package_name: z.string().min(1).describe("Package name, e.g. react") },
    async ({ package_name }) => {
      try {
        return text(await weeklyDownloads(package_name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
