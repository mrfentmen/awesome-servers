import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { recent } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "flickr-mcp", version: "1.0.0" })
  server.registerTool(
    "recent",
    {
      title: "Recent",
      description: "Recent public photos.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recent(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "photos_by_tag",
    {
      title: "Photos by tag",
      description: "Recent public Flickr uploads carrying given tags, with author, date taken and medium URL - a tag-filtered view of the public feed.",
      inputSchema: z.object( { tag: z.string().describe("Comma-separated tags, e.g. landscape or astronomy,space."), mode: z.string().describe("any (match one), all (match every) or none (exclude).").optional(), limit: z.number().describe("Max photos.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: photos_by_tag ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_flickr_photos_by_tag", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
