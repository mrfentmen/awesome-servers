import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { artwork, search, exhibitions } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "clevelandart-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search artworks.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "artwork",
    {
      title: "Artwork",
      description: "Get an artwork by id.",
      inputSchema: z.object( { id: z.number().describe("Artwork id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await artwork(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "creator_details",
    {
      title: "Creator details",
      description: "Look up Cleveland Museum of Art creators by name or nationality with life dates, biography and linked works with accession numbers.",
      inputSchema: z.object( { name: z.string().describe("Creator name.").optional(), nationality: z.string().describe("Nationality filter.").optional(), limit: z.number().describe("Max creators.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement details locally (paywall removed)
    try { return textError("Not yet implemented: details") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "open_access_images",
    {
      title: "Open access images",
      description: "List Cleveland Museum of Art artworks that are CC0 with images, returning direct CDN URLs for web, print and thumbnail renditions, filterable by free text, department and object type.",
      inputSchema: z.object( { query: z.string().describe("Free text filter.").optional(), department: z.string().describe("Department name.").optional(), type: z.string().describe("Object type, e.g. Painting.").optional(), limit: z.number().describe("Max records.").optional(), skip: z.number().describe("1 based offset for paging.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement images locally (paywall removed)
    try { return textError("Not yet implemented: images") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "exhibitions",
    {
      title: "Exhibitions",
      description: "Cleveland Museum of Art exhibition history with titles, identifiers, run dates, organizers and exhibition types.",
      inputSchema: z.object( { query: z.string().describe("Free text filter.").optional(), limit: z.number().describe("Max exhibitions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await exhibitions(args)) } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
