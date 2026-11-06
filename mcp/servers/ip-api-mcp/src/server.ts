import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { lookup } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ip-api-mcp", version: "1.0.0" })

  server.tool(
    "lookup",
    "Geolocate an IPv4 address",
    { ip: z.string().min(7).describe("IPv4 address, e.g. 8.8.8.8") },
    async ({ ip }) => {
      try {
        return text(await lookup(ip))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
