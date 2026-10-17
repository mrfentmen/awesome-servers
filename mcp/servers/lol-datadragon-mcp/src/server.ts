import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { champion, champions } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "lol-datadragon-mcp", version: "1.0.0" })
  server.registerTool(
    "champions",
    {
      title: "Champions",
      description: "All champions.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await champions(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "champion",
    {
      title: "Champion",
      description: "Details for one champion.",
      inputSchema: z.object( { name: z.string().describe("Champion name.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await champion(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "items",
    {
      title: "Items",
      description: "Search League of Legends shop items in the current patch, with total gold cost, tags and a short description.",
      inputSchema: z.object( { name: z.string().max(60).optional(), limit: z.number().int().min(1).max(40).default(15) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement items locally (paywall removed)
    try { return textError("Not yet implemented: items") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "runes",
    {
      title: "Runes",
      description: "The five League of Legends rune trees in the current patch and the runes in each of their four slots.",
      inputSchema: z.object( { tree: z.string().max(40).optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement runes locally (paywall removed)
    try { return textError("Not yet implemented: runes") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
