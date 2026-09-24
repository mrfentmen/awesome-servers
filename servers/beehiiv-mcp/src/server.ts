import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { BeehiivError, findSubscriber, formatPost, listPosts } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "beehiiv-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_posts",
    {
      title: "List posts",
      description: "beehiiv publication posts with statuses and links.",
      inputSchema: z.object({
        publication_id: z.string().describe("Publication id, e.g. 'pub_abc123'"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ publication_id, limit }) => {
      try {
        const rows = await listPosts(publication_id, limit)
        if (rows.length === 0) return text("No posts.")
        return text(rows.map((p, i) => formatPost(p, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "find_subscriber",
    {
      title: "Find subscriber",
      description: "Find a beehiiv subscriber by email: status, tier, join date.",
      inputSchema: z.object({
        publication_id: z.string().describe("Publication id"),
        email: z.string().describe("Email address"),
      }),
      annotations: READ_ONLY,
    },
    async ({ publication_id, email }) => {
      try {
        const s = await findSubscriber(publication_id, email)
        if (!s) return text(`No subscriber ${email}.`)
        return text(`${s.email ?? email}${s.status ? ` [${s.status}]` : ""}${s.tier ? ` — ${s.tier}` : ""}${s.created ? ` (since ${s.created})` : ""}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof BeehiivError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
