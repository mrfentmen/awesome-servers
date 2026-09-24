import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { deals } from "./api.js"
import { storeList } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "cheapshark-mcp", version: "1.0.0" })
  server.registerTool(
    "deals",
    {
      title: "Deals",
      description: "Search current game deals.",
      inputSchema: z.object( { title: z.string().describe("Game title.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await deals(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "store_list",
    {
      title: "Store list",
      description: "List stores tracked by CheapShark.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await storeList(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
