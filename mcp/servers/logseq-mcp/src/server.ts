import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatPage, getPage, listPages, LogseqError, pageBlocks } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "logseq-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_pages",
    {
      title: "List pages",
      description: "All Logseq pages. Needs Logseq open with the HTTP APIs plugin.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        const rows = await listPages()
        if (rows.length === 0) return text("No pages.")
        return text(rows.map((p, i) => `${i + 1}. ${p.name}`).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_page",
    {
      title: "Get page",
      description: "One Logseq page with its block outline.",
      inputSchema: z.object({
        name: z.string().describe("Page name, e.g. 'Projects'"),
        limit: z.number().int().min(1).max(100).default(20),
      }),
      annotations: READ_ONLY,
    },
    async ({ name, limit }) => {
      try {
        const [page, blocks] = await Promise.all([getPage(name), pageBlocks(name, limit)])
        if (!page && blocks.length === 0) return text(`No Logseq page "${name}".`)
        return text(formatPage(name, page, blocks))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof LogseqError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
