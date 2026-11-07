import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { decodeVin } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "vpic-mcp", version: "1.0.0" })

  server.tool(
    "decode_vin",
    "Decode a 17 character VIN",
    { vin: z.string().min(11).max(17).describe("Vehicle identification number") },
    async ({ vin }) => {
      try {
        return text(await decodeVin(vin))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
