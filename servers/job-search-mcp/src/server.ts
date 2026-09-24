import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { jobCategories } from "./api.js"
import { searchJobs } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "job-search-mcp", version: "1.0.0" })
  server.registerTool(
    "search_jobs",
    {
      title: "Search jobs",
      description: "Search remote jobs by keyword and category.",
      inputSchema: z.object( { query: z.string().describe("Keyword like developer.").optional(), category: z.string().describe("Category like Software Development.").optional(), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchJobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "job_categories",
    {
      title: "Job categories",
      description: "List job categories.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobCategories(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
