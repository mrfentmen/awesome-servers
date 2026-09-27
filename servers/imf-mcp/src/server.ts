import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { compareCountries, indicator, indicatorsList } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "imf-mcp", version: "1.0.0" })
  server.registerTool(
    "indicator",
    {
      title: "Indicator",
      description: "Get indicator series for a country.",
      inputSchema: z.object( { indicator: z.string().describe("Indicator like NGDPD."), country: z.string().describe("Country code like USA.").optional(), limit: z.number().describe("Max years.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await indicator(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "indicators_list",
    {
      title: "Indicators list",
      description: "Browse IMF indicators.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await indicatorsList(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "compare_countries",
    {
      title: "Compare countries",
      description: "One indicator across countries.",
      inputSchema: z.object( { indicator: z.string().describe("Indicator like NGDP_RPCH."), countries: z.string().describe("Comma codes like USA,CHN,DEU.").optional(), year: z.string().describe("Year.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await compareCountries(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
