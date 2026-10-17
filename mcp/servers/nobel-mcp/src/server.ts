import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { laureates, prizes } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nobel-mcp", version: "1.0.0" })
  server.registerTool(
    "laureates",
    {
      title: "Laureates",
      description: "List Nobel laureates, optionally by year.",
      inputSchema: z.object( { year: z.number().describe("Prize year.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await laureates(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "prizes",
    {
      title: "Prizes",
      description: "List Nobel prizes by year.",
      inputSchema: z.object( { year: z.number().describe("Prize year.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await prizes(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "laureate_detail",
    {
      title: "Laureate detail",
      description: "One laureate's full Nobel record: birth and death, every prize, the affiliations and the official motivation.",
      inputSchema: z.object( { id: z.number().describe("Numeric laureate id, e.g. 990 for Andrea Ghez.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "prize_detail",
    {
      title: "Prize detail",
      description: "The Nobel prize awarded in a year: category, award date, prize amount, every laureate and the official motivation.",
      inputSchema: z.object( { year: z.number().describe("Year, 1901 onwards."), category: z.string().describe("phys, chem, med, econ, lit or peace.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
