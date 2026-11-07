import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { listBreeds } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "dogapi-mcp", version: "1.0.0" })

  server.tool(
    "list_breeds",
    "List dog breeds",
    { limit: z.number().int().min(1).max(50).default(10).describe("How many breeds") },
    async ({ limit }) => {
      try {
        return text(await listBreeds(limit))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
