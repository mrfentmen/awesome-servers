import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, recentDatasets } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "data-gouv-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search datasets.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "dataset_detail",
    {
      title: "Dataset detail",
      description: "Full detail for one data.gouv.fr dataset: licence, update dates, tags and its downloadable resource files.",
      inputSchema: z.object( { id: z.string().describe("Dataset id, 24 hex characters.").optional(), query: z.string().describe("Free text to resolve a dataset from.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: dataset_detail ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_data_gouv_dataset_detail", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "organization_info",
    {
      title: "Publisher info",
      description: "Profile for a data.gouv.fr publisher: dataset and reuse counts, views, followers and members.",
      inputSchema: z.object( { id: z.string().describe("Publisher id, 24 hex characters.").optional(), query: z.string().describe("Publisher name to resolve.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: organization_info ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_data_gouv_organization_info", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "recent_datasets",
    {
      title: "Recent datasets",
      description: "The newest datasets published on data.gouv.fr.",
      inputSchema: z.object( { limit: z.number().describe("How many, 1-20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recentDatasets(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
