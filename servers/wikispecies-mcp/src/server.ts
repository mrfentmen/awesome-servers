import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { search, speciesPage, pageCategories } from "./api.js"
import { premiumRequired } from "./license.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "wikispecies-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search species pages.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "species_page",
    {
      title: "Species page",
      description: "Plain-text extract of a Wikispecies taxon page, mostly the taxonavigation classification block.",
      inputSchema: z.object( { title: z.string().describe("Species page title, e.g. 'Vulpes vulpes'."), chars: z.number().describe("Max characters of extract.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: species_page ----
    const paywallMessage = await premiumRequired("species_page")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await speciesPage(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "page_categories",
    {
      title: "Page categories",
      description: "Categories a Wikispecies taxon page belongs to, e.g. conservation status or vernacular-name categories.",
      inputSchema: z.object( { title: z.string().describe("Species page title, e.g. 'Vulpes vulpes'."), limit: z.number().describe("Max categories.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await pageCategories(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
