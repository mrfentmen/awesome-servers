import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { asOfDates } from "./api.js"
import { find } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "fcc-mcp", version: "1.0.0" })
  server.registerTool(
    "find",
    {
      title: "Find",
      description: "Find census block for coordinates.",
      inputSchema: z.object( { lat: z.number().describe("Latitude."), lon: z.number().describe("Longitude.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await find(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "as_of_dates",
    {
      title: "As of dates",
      description: "Broadband map data vintages. Needs FCC_USERNAME and FCC_HASH.",
      inputSchema: z.object( { type: z.string().describe("fixed or mobile.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await asOfDates(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
