import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_entity, m0_format, m0_search, m0_sparql, m0_WikidataError, m1_search } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'wikidata-mcp', version: '1.0.0' })
server.registerTool(
    "search_entities",
    {
      title: "Search entities",
      description: "Search Wikidata entities by name or description.",
      inputSchema: z.object( { query: z.string().min(1) }),
      annotations: READ_ONLY,
    },
    async ({ query }) => { try { return text(m0_format(await m0_search(query))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  )
server.registerTool(
    "get_entity",
    {
      title: "Get entity",
      description: "Get public Wikidata labels, descriptions, claims, and sitelinks by Q ID.",
      inputSchema: z.object( { id: z.string().regex(/^Q\d+$/i) }),
      annotations: READ_ONLY,
    },
    async ({ id }) => { try { return text(m0_format(await m0_entity(id.toUpperCase()))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  )
server.registerTool(
    "query_knowledge",
    {
      title: "Query knowledge",
      description: "Run a bounded read-only SPARQL query against Wikidata. Keep queries selective and include LIMIT.",
      inputSchema: z.object( { query: z.string().min(1).max(8000) }),
      annotations: READ_ONLY,
    },
    async ({ query }) => { try { return text(m0_format(await m0_sparql(query))) } catch (e) { return textError(`Error: ${e instanceof Error ? e.message : String(e)}`) } }
  )
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search Wikidata entities.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "entity_sitelinks",
    {
      title: "Entity sitelinks",
      description: "The Wikipedia and other wiki editions a Wikidata item sits in, which the label and claim views never show.",
      inputSchema: z.object( { id: z.string().describe("Wikidata item id, e.g. Q64."), limit: z.number().describe("Max wikis.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: entity_sitelinks ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikidata_entity_sitelinks", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "entity_history",
    {
      title: "Entity history",
      description: "A Wikidata item's revision history with editor, timestamp, size and edit summary, which shows who changed it and when.",
      inputSchema: z.object( { id: z.string().describe("Wikidata item id, e.g. Q64."), limit: z.number().describe("Max revisions.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: entity_history ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_wikidata_entity_history", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
