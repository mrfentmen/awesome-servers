import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { details, recent, revisedPreprints } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "medrxiv-mcp", version: "1.0.0" })
  server.registerTool(
    "details",
    {
      title: "Details",
      description: "Get preprint details.",
      inputSchema: z.object( { doi: z.string().describe("medRxiv DOI.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await details(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "recent",
    {
      title: "Recent",
      description: "Recent preprints.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recent(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "preprints_by_date",
    {
      title: "Preprints by date",
      description: "medRxiv preprints posted inside a date window, with posted date, version, subject category and DOI.",
      inputSchema: z.object( { start: z.string().describe("Window start, YYYY-MM-DD."), end: z.string().describe("Window end, YYYY-MM-DD."), limit: z.number().describe("Max preprints to list.").optional(), pages: z.number().describe("How many 30-record pages to walk, 1-4.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: preprints_by_date ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_medrxiv_preprints_by_date", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "category_breakdown",
    {
      title: "Category breakdown",
      description: "What a medRxiv date window is made of: subject categories, version mix, licences and most frequent first authors, with the window total.",
      inputSchema: z.object( { start: z.string().describe("Window start, YYYY-MM-DD."), end: z.string().describe("Window end, YYYY-MM-DD."), pages: z.number().describe("How many 30-record pages to walk, 1-4.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: category_breakdown ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_medrxiv_category_breakdown", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "revised_preprints",
    {
      title: "Revised preprints",
      description: "medRxiv preprints in a date window that are revisions (version 2 or later) rather than first postings, with authors and DOI.",
      inputSchema: z.object( { start: z.string().describe("Window start, YYYY-MM-DD."), end: z.string().describe("Window end, YYYY-MM-DD."), limit: z.number().describe("Max revisions to list.").optional(), pages: z.number().describe("How many 30-record pages to walk, 1-4.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await revisedPreprints(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
