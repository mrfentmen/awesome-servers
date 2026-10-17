import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { entry, search, domainIndex } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "ebi-search-mcp", version: "1.0.0" })
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search a biomedical database.",
      inputSchema: z.object( { query: z.string().describe("Search query."), domain: z.string().describe("Database domain (ensembl, uniprot, literature).").optional(), size: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "entry",
    {
      title: "Entry",
      description: "Get a specific entry.",
      inputSchema: z.object( { domain: z.string().describe("Database domain."), id: z.string().describe("Entry id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await entry(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "domain_index",
    {
      title: "Domain index",
      description: "The whole tree of databases EBI Search can query, with how many domains sit inside each group, so a caller can see what is searchable instead of guessing a domain name.",
      inputSchema: z.object( {  } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await domainIndex()) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "domain_info",
    {
      title: "Domain info",
      description: "One database's own facts: the entry count and release dates EBI Search reports for it, and which of its fields are searchable. The search tool only returns results, it never describes the domain.",
      inputSchema: z.object( { domain: z.string().describe("A domain id from the domain index, like uniprot, ensembl or literature.") } ),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement info locally (paywall removed)
    try { return textError("Not yet implemented: info") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
