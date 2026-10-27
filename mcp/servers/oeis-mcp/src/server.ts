import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatSequence, getSequence, OeisError, searchSequences } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

export function createServer(): McpServer {
  const server = new McpServer({
    name: "oeis-mcp",
    version: "1.0.0",
  })

  server.tool(
    "search_sequences",
    "Search the OEIS by terms or a name query. Terms like '1,1,2,3,5,8' find sequences containing them.",
    { query: z.string().describe("Comma separated terms, a keyword, or a phrase, e.g. '1,1,2,3' or 'prime gaps'"), limit: z.number().int().min(1).max(10).default(5) },
    async ({ query, limit }) => {
      try {
        const results = await searchSequences(query, limit)
        if (results.length === 0) return text(`No OEIS sequences match "${query}".`)
        return text(`OEIS results for "${query}":\n\n${results.map((s, i) => formatSequence(s, i)).join("\n\n")}`)
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_sequence",
    "Get one OEIS sequence by its A number.",
    { id: z.string().describe("A number, e.g. 'A000045'") },
    async ({ id }) => {
      try {
        const s = await getSequence(id)
        if (!s) return text(`No OEIS sequence ${id}.`)
        return text(formatSequence(s))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof OeisError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
