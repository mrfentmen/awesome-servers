import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatHit, formatPlugin, getPlugin, JetBrainsError, searchPlugins } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "jetbrains-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_plugins",
    {
      title: "Search plugins",
      description: "Search JetBrains Marketplace plugins: names, descriptions, downloads, ratings.",
      inputSchema: z.object({
        query: z.string().describe("Search text, e.g. 'python', 'vim', 'git'"),
        limit: z.number().int().min(1).max(20).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        const results = await searchPlugins(query, limit)
        if (results.length === 0) return text(`No plugins match "${query}".`)
        return text(`JetBrains plugins for "${query}":\n\n${results.map((p, i) => formatHit(p, i)).join("\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_plugin",
    {
      title: "Get plugin details",
      description: "One JetBrains plugin: vendor, downloads, rating, description, page link.",
      inputSchema: z.object({
        id: z.string().describe("Numeric plugin id, e.g. '9525' (use search_plugins to find it)"),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      try {
        return text(formatPlugin(await getPlugin(id)))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof JetBrainsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
