import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "nasa-images-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search NASA media by query.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "asset_manifest",
    {
      title: "Asset manifest",
      description: "Every downloadable file NASA holds for one NASA id: all image sizes, the collection manifest and any sidecar text.",
      inputSchema: z.object( { nasa_id: z.string().describe("NASA id, e.g. jsc2007e034221."), limit: z.number().describe("Max files.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement manifest locally (paywall removed)
    try { return textError("Not yet implemented: manifest") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "media_details",
    {
      title: "Media details",
      description: "Full descriptive metadata for one NASA id: title, center, media type, date, keywords and description.",
      inputSchema: z.object( { nasa_id: z.string().describe("NASA id, e.g. jsc2007e034221.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement details locally (paywall removed)
    try { return textError("Not yet implemented: details") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
