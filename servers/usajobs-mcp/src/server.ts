import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatJob, searchJobs, UsajobsError } from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "usajobs-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_jobs",
    {
      title: "Search federal jobs",
      description: "US federal jobs by keyword and location, with pay bands and closing dates.",
      inputSchema: z.object({
        keyword: z.string().describe("Keyword, e.g. 'data scientist', 'park ranger'"),
        location: z.string().default("").describe("Location, e.g. 'Washington, DC', empty = anywhere"),
        limit: z.number().int().min(1).max(50).default(5),
      }),
      annotations: READ_ONLY,
    },
    async ({ keyword, location, limit }) => {
      try {
        if (!keyword.trim()) return textError("Error: keyword is empty.")
        const { total, jobs } = await searchJobs(keyword, location, limit)
        if (jobs.length === 0) return text("No federal jobs found.")
        return text(`${total.toLocaleString()} federal jobs (showing ${jobs.length}):\n\n${jobs.map((j, i) => formatJob(j, i)).join("\n\n")}`)
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof UsajobsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
