import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { getIndicator } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const fail = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true })
const errorMessage = (e: unknown): string => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "imf-mcp", version: "1.0.0" })

  server.tool(
    "indicator",
    "Values for one IMF indicator and country",
    { indicator: z.string().min(2).describe("Indicator code, e.g. NGDPD"), country: z.string().min(2).max(3).describe("ISO country code, e.g. USA") },
    async ({ indicator, country }) => {
      try {
        return text(await getIndicator(indicator, country))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
