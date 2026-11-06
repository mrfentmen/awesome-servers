import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { packageInfo } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "hex-pm-mcp", version: "1.0.0" })

  server.tool(
    "package",
    "Package details from hex.pm",
    { name: z.string().min(1).describe("Package name, e.g. phoenix") },
    async ({ name }) => {
      try {
        return text(await packageInfo(name))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
