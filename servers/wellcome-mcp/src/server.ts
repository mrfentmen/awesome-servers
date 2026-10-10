import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search, searchImages, searchByFormat } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wellcome-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search works.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_images",
    {
      title: "Search images",
      description: "Search the Wellcome Collection's digitised images: the work they come from, their IIIF image id, licence and aspect ratio.",
      inputSchema: z.object( { query: z.string().max(200).describe("Search terms."), limit: z.number().int().min(1).max(50).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_images ----
    const paywallMessage = await premiumRequired("search_images")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await searchImages(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "search_by_format",
    {
      title: "Search by format",
      description: "Search Wellcome works restricted to one format, with the total number of matches and each item's availability.",
      inputSchema: z.object( { query: z.string().max(200).describe("Search terms."), format: z.enum(["a", "k", "e", "j", "d", "m", "v"]).default("a").describe("Format letter: a books, k pictures, e maps, j e-journals, d journals, m CD-Roms, v e-books."), limit: z.number().int().min(1).max(50).default(10) }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: search_by_format ----
    const paywallMessage = await premiumRequired("search_by_format")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await searchByFormat(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
