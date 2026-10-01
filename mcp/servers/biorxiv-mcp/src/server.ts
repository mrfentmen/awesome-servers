import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { details, recent, preprintVersions } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "biorxiv-mcp", version: "1.0.0" })
  server.registerTool(
    "details",
    {
      title: "Details",
      description: "Get preprint details.",
      inputSchema: z.object( { doi: z.string().describe("bioRxiv DOI.") }),
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
      description: "List bioRxiv or medRxiv preprints posted within a date interval with title, authors, category, version and whether the preprint has since been published in a journal.",
      inputSchema: z.object( { from: z.string().describe("Start date, YYYY-MM-DD."), to: z.string().describe("End date, YYYY-MM-DD."), category: z.string().describe("biorxiv or medrxiv.").optional(), limit: z.number().describe("Max preprints.").optional(), cursor: z.number().describe("Pagination cursor.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: preprints_by_date ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_biorxiv_preprints_by_date", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "publication_linkage",
    {
      title: "Publication linkage",
      description: "Measure how many preprints posted in an interval went on to journal publication, with the top journals, the median days from preprint to publication and example preprint to journal DOI pairs.",
      inputSchema: z.object( { from: z.string().describe("Start date, YYYY-MM-DD."), to: z.string().describe("End date, YYYY-MM-DD."), limit: z.number().describe("Max linked pairs listed.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: publication_linkage ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_biorxiv_publication_linkage", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "preprint_versions",
    {
      title: "Preprint versions",
      description: "Every posted version of a bioRxiv preprint with its version number, posting date, category and publication status, plus the full author list, corresponding author and abstract.",
      inputSchema: z.object( { doi: z.string().describe("bioRxiv DOI, e.g. 10.1101/718403.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await preprintVersions(args)) } catch (e) { return textError(e instanceof Error ? `Error: ${e.message}` : String(e)) }
  }
  )

  return server
}
