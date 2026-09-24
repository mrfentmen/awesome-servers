import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { AshbyError, formatJob, listJobs } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "ashby-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_jobs",
    {
      title: "List jobs",
      description: "Open roles on an Ashby-powered job board: titles, departments, locations.",
      inputSchema: z.object({
        org: z.string().describe("Organization slug, e.g. 'ashby'"),
        limit: z.number().int().min(1).max(100).default(10),
      }),
      annotations: READ_ONLY,
    },
    async ({ org, limit }) => {
      try {
        const rows = await listJobs(org, limit)
        if (rows.length === 0) return text(`No open roles at ${org}.`)
        return text(rows.map((j, i) => formatJob(j, i)).join("\n"))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof AshbyError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
