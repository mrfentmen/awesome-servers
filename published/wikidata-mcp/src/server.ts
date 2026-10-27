import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_entity, m0_format, m0_search, m0_sparql, m0_WikidataError, m1_search } from "./api.js"
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
    try { return text(await m1_search(args)) } catch (e) { return textError(String(e)) }
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
    // TODO: implement sitelinks locally (paywall removed)
    try { return textError("Not yet implemented: sitelinks") } catch (e) { return textError(String(e)) }
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
    // TODO: implement history locally (paywall removed)
    try { return textError("Not yet implemented: history") } catch (e) { return textError(String(e)) }
  }
  )
const serverName = "wikidata-mcp"

  server.registerTool(
    "health_check",
    {
      title: "Health check",
      description: "Check if the server is running and responsive.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("OK - server is running")
    }
  )
  server.registerTool(
    "version_info",
    {
      title: "Version info",
      description: "Get server version and metadata.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2))
    }
  )
  server.registerTool(
    "list_tools",
    {
      title: "List tools",
      description: "List all available tools on this server.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      return text("See the tools/list response for the full tool list.")
    }
  )
  server.registerTool(
    "echo",
    {
      title: "Echo",
      description: "Echo back the provided text.",
      inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
      return text(String(args?.text ?? ""))
    }
  )


  return server
}
