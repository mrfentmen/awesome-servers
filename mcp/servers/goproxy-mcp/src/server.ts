import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { versions } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "goproxy-mcp", version: "1.0.0" })

  server.tool(
    "versions",
    "Published versions of a Go module",
    { module: z.string().min(3).describe("Module path, e.g. github.com/gin-gonic/gin") },
    async ({ module }) => {
      try {
        return text(await versions(module))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
