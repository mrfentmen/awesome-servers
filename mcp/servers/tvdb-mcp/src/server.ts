import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatSeries, getSeries, searchSeries, TvdbError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "tvdb-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_series",
    {
      title: "Search series",
      description: "TV series by title with years, networks, statuses.",
      inputSchema: z.object({
        query: z.string().describe("Series title, e.g. 'Severance'"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const rows = await searchSeries(query, limit)
        if (rows.length === 0) return text(`No series for "${query}".`)
        return text(rows.map((s, i) => formatSeries(s, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_series",
    {
      title: "Get series",
      description: "One series: network, status, overview.",
      inputSchema: z.object({
        id: z.string().describe("TVDB series id (use search_series)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(await getSeries(id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof TvdbError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
