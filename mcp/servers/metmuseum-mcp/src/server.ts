import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatObject, getDepartments, getObject, MetError, searchObjects } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "metmuseum-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_objects",
    "Search the Met collection for artworks by title, artist, or keyword.",
    { query: z.string().describe("Search text, e.g. 'monet water lilies' or 'ancient egypt'"), limit: z.number().int().min(1).max(10).default(5) },
    async ({ query, limit }) => {
      try {
        const objects = await searchObjects(query, limit)
        if (objects.length === 0) return text(`No Met artworks match "${query}".`)
        return text(`Met Museum results for "${query}":\n\n${objects.map((o, i) => formatObject(o)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_object",
    "Get one artwork from the Met by object id.",
    { id: z.number().int().describe("Object id from search_objects") },
    async ({ id }) => {
      try {
        const o = await getObject(id)
        if (!o) return text(`No Met object ${id}.`)
        return text(formatObject(o))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_departments",
    "List all Met Museum departments.",
    {},
    async () => {
      try {
        const deps = await getDepartments()
        return text(`Met Museum departments:\n${deps.map((d) => `- ${d.departmentId}: ${d.displayName}`).join("\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof MetError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
