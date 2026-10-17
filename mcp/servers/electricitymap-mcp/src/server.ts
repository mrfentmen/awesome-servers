import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { zones, zoneCatalogue } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "electricitymap-mcp", version: "1.0.0" })
  server.registerTool(
    "zones",
    {
      title: "Zones",
      description: "List electricity zones.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await zones(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "zone_hierarchy",
    {
      title: "Zone hierarchy",
      description: "The parent and sub-zone tree inside the Electricity Map catalogue: with no argument, every zone that has sub-zones and what they are; with a zone key, that zone's parent, its sub-zones and whether any of them are themselves parents. The zones tool prints the key, the name and the country and never reaches the parent or sub-zone fields.",
      inputSchema: z.object( { zone: z.string().describe("A zone key such as AU, CA-NT or DE. Omit for the whole tree.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement hierarchy locally (paywall removed)
    try { return textError("Not yet implemented: hierarchy") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "zone_catalogue",
    {
      title: "Zone catalogue",
      description: "A profile of the whole Electricity Map zone catalogue: how many zones and country codes it holds, the data tier breakdown and which zones carry no tier, the counts of top level, sub and leaf zones, the untiered zones by name, and the parent zones with the most sub-zones. The zones tool shows at most 50 rows of key, name and country and no totals.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await zoneCatalogue()) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
