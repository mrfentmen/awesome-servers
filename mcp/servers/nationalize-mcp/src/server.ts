import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { nationality } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nationalize-mcp", version: "1.0.0" })
  server.registerTool(
    "nationality",
    {
      title: "Nationality",
      description: "Estimated nationalities for a name.",
      inputSchema: z.object( { name: z.string().describe("First name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await nationality(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "nationality_countries",
    {
      title: "Nationality countries",
      description: "Estimated nationalities for a first name, each ISO code resolved to the real country with its World Bank region, income level and capital.",
      inputSchema: z.object( { name: z.string().describe("First name."), limit: z.number().int().min(1).max(10).default(5) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement countries locally (paywall removed)
    try { return textError("Not yet implemented: countries") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "country_indicators",
    {
      title: "Country indicators",
      description: "World Bank basics for a two letter country code: region, income level, lending type, capital, coordinates and latest total population.",
      inputSchema: z.object( { code: z.string().max(3).describe("ISO country code like PL.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement indicators locally (paywall removed)
    try { return textError("Not yet implemented: indicators") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
