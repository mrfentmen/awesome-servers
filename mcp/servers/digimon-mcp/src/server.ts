import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { level, search, levelIndex } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "digimon-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Digimon by name.",
      inputSchema: z.object( { name: z.string().describe("Digimon name."), limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "level",
    {
      title: "Level",
      description: "List Digimon at a level.",
      inputSchema: z.object( { level: z.string().describe("Rookie, Champion, Ultimate, or Mega."), limit: z.number().describe("Maximum results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await level(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "browse",
    {
      title: "Browse",
      description: "Page through the whole Digimon catalogue with a name substring and level filter, which the exact-name search cannot do. Prints each entry's image url.",
      inputSchema: z.object( { name: z.string().describe("Part of a name to filter by, e.g. mon. Omit for all.").optional(), level: z.string().describe("Exact level, e.g. Rookie, Champion, Ultimate, Mega, Armor, Fresh, Training or In Training. Omit for all.").optional(), offset: z.number().describe("How many matches to skip, for paging. Defaults to 0.").optional(), limit: z.number().describe("Matches per page, 1-50. Defaults to 20.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement browse locally (paywall removed)
    try { return textError("Not yet implemented: browse") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "level_index",
    {
      title: "Level index",
      description: "How the Digimon catalogue is actually distributed across levels, with real counts, shares and sample names read from the live list.",
      inputSchema: z.object( { samples: z.number().describe("Sample names to show per level, 0-10. Defaults to 3.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await levelIndex(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
