import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { dataset, gdp, inflation, population, unemployment } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "eurostat-mcp", version: "1.0.0" })
  server.registerTool(
    "dataset",
    {
      title: "Dataset",
      description: "Summary and values for a Eurostat dataset.",
      inputSchema: z.object( { code: z.string().describe("Dataset code like teilm020."), geo: z.string().describe("Optional country code like DE.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await dataset(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "unemployment",
    {
      title: "Unemployment",
      description: "EU unemployment rates.",
      inputSchema: z.object( { geo: z.string().describe("Country like DE.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await unemployment(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "gdp",
    {
      title: "GDP",
      description: "GDP and main components.",
      inputSchema: z.object( { geo: z.string().describe("Country like DE.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await gdp(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "population",
    {
      title: "Population",
      description: "Population on 1 January.",
      inputSchema: z.object( { geo: z.string().describe("Country like DE.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await population(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "inflation",
    {
      title: "Inflation",
      description: "HICP annual inflation.",
      inputSchema: z.object( { geo: z.string().describe("Country like DE.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await inflation(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
