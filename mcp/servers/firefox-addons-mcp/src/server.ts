import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { addon, search, categoryCatalog } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "firefox-addons-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Firefox add-ons.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "addon",
    {
      title: "Addon",
      description: "Details for one add-on.",
      inputSchema: z.object( { slug: z.string().describe("Add-on slug like ublock-origin.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await addon(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "version_history",
    {
      title: "Version history",
      description: "The release history behind a Firefox add-on: how many versions AMO lists, how many are on the listed channel, which licences appear across the history, the first and most recent file dates, the median gap between releases and the current compatibility window.",
      inputSchema: z.object( { slug: z.string().describe("Add-on slug like ublock-origin."), limit: z.number().describe("Versions to list, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: version_history ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_firefox_addons_version_history", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "category_catalog",
    {
      title: "Category catalog",
      description: "The Firefox add-on catalogue's own taxonomy: every category AMO files add-ons under, its type, weight and purpose, and which categories are the miscellaneous bucket.",
      inputSchema: z.object( { limit: z.number().describe("Categories to list, 1-40.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await categoryCatalog(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "addon_manifest",
    {
      title: "Addon manifest",
      description: "The add-on record in full: GUID, publication status, dates, authors, how many locales it is translated into, tags, privacy policy and EULA flags, promotion placements, preview count and the rating breakdown.",
      inputSchema: z.object( { slug: z.string().describe("Add-on slug like ublock-origin.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: addon_manifest ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_firefox_addons_addon_manifest", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
