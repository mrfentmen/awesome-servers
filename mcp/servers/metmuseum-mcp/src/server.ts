import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

import { m0_formatObject, m0_getDepartments, m0_getObject, m0_MetError, m0_searchObjects, m1_object, m1_search } from "./api.js"
const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`
const errorMessage = error

export function createServer(): McpServer {
  const server = new McpServer({ name: 'metmuseum-mcp', version: '1.0.0' })
server.registerTool(
    "search_objects",
    {
      title: "Search objects",
      description: "Search the Met collection for artworks by title, artist, or keyword.",
      inputSchema: z.object(
    { query: z.string().describe("Search text, e.g. 'monet water lilies' or 'ancient egypt'"), limit: z.number().int().min(1).max(10).default(5) }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const objects = await m0_searchObjects(query, limit)
        if (objects.length === 0) return text(`No Met artworks match "${query}".`)
        return text(`Met Museum results for "${query}":\n\n${objects.map((o, i) => m0_formatObject(o)).join("\n\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )
server.registerTool(
    "get_object",
    {
      title: "Get object",
      description: "Get one artwork from the Met by object id.",
      inputSchema: z.object(
    { id: z.number().int().describe("Object id from search_objects") }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        const o = await m0_getObject(id)
        if (!o) return text(`No Met object ${id}.`)
        return text(m0_formatObject(o))
      } catch (e) {
        return textError(String(e))
      }
    }
  )
server.registerTool(
    "get_departments",
    {
      title: "Get departments",
      description: "List all Met Museum departments.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const deps = await m0_getDepartments()
        return text(`Met Museum departments:\n${deps.map((d) => `- ${d.departmentId}: ${d.displayName}`).join("\n")}`)
      } catch (e) {
        return textError(String(e))
      }
    }
  )
server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search the Met collection by text.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_search(args)) } catch (e) { return textError(String(e)) }
  }
  )
server.registerTool(
    "object",
    {
      title: "Object",
      description: "Details for one object.",
      inputSchema: z.object( { id: z.number().describe("Object ID.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await m1_object(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "objects_in_department",
    {
      title: "Objects in department",
      description: "The object ids held by a Met department, which is how you enumerate a department's whole catalogue before fetching individual records.",
      inputSchema: z.object( { department: z.number().describe("Department id, e.g. 12 for European Paintings."), limit: z.number().describe("Max ids.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement department locally (paywall removed)
    try { return textError("Not yet implemented: department") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "objects_with_images",
    {
      title: "Objects with images",
      description: "Search The Met for objects that actually have a photograph, returning each hit's title, artist and date, which the plain text search cannot filter for.",
      inputSchema: z.object( { query: z.string().describe("Search terms, e.g. violin."), limit: z.number().describe("Max objects.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement images locally (paywall removed)
    try { return textError("Not yet implemented: images") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
