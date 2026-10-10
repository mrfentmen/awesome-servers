import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { search, repositoryDetails } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "core-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search academic works.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "work_details",
    {
      title: "Work details",
      description: "Full CORE record for one output: authors, DOI, versions, identifiers, download link and abstract.",
      inputSchema: z.object( { id: z.number().describe("CORE output id, from the outputs list in a search result.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: work_details ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_core_work_details", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "repository_details",
    {
      title: "Repository details",
      description: "Profile of a CORE data provider: institution, repository software, OAI-PMH endpoint, harvest source and location.",
      inputSchema: z.object( { id: z.number().describe("CORE data provider id, from a search result's dataProviders entry.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await repositoryDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "source_survey",
    {
      title: "Source survey",
      description: "Aggregate a CORE search rather than listing it: which repositories publish the topic, DOI coverage, mean citations and the most cited hits.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Works to summarise, 5-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: source_survey ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_core_source_survey", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
