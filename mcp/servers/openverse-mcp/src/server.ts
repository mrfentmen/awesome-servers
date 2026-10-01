import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { searchImages, sourceIndex } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "openverse-mcp", version: "1.0.0" })
  server.registerTool(
    "search_images",
    {
      title: "Search images",
      description: "Search openly licensed images.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchImages(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "source_index",
    {
      title: "Source index",
      description: "Every Openverse source with the number of images and audio files it contributes right now, so the source filter names are not guesswork.",
      inputSchema: z.object( { mediaType: z.string().describe("images or audio. Omit for both.").optional(), match: z.string().describe("Only show sources whose name contains this text.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await sourceIndex(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "search_audio",
    {
      title: "Search audio",
      description: "Search Openverse audio with the source, category and licence filters, with real page numbers. Only filters the API actually applies are offered.",
      inputSchema: z.object( { query: z.string().describe("Search terms, like jazz or rain."), source: z.string().describe("A source name from source_index. Openverse rejects a name that is not in that list.").optional(), category: z.string().describe("One of podcast, audiobook, news, music, pronunciation, sound_effect.").optional(), license: z.string().describe("Licence code, like by, by-sa or cc0. Openverse rejects one it does not know.").optional(), licenseType: z.string().describe("all, commercial or modification.").optional(), page: z.number().describe("Page number, starting at 1.").optional(), pageSize: z.number().describe("Results per page, 1 to 20 for anonymous callers. Defaults to 10.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_audio ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openverse_search_audio", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "media_detail",
    {
      title: "Media detail",
      description: "One Openverse image or audio record in full, with the attribution wording to reuse and the optional ten related items.",
      inputSchema: z.object( { mediaType: z.string().describe("images or audio, the plural form the API uses in its URLs."), id: z.string().describe("Record id, as printed by a search."), includeRelated: z.boolean().describe("Also fetch the ten related items. Adds one request.").optional() } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: media_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_openverse_media_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
