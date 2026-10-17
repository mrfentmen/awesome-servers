import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { formatJob, searchJobs, UsajobsError, hiringRules, hiringSignal } from "./api.js"

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
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "hiring_rules",
    {
      title: "Hiring rules",
      description:
        "The federal employment rules themselves from the Federal Register's public API: title, rule type, issuing agency, publication and effective dates, page count, dockets and an abstract extract. Says who qualifies for a federal post, which a job search does not. No USAJOBS_API_KEY needed.",
      inputSchema: z.object({
        query: z.string().describe("Term to search the register for, e.g. 'federal hiring', 'merit promotion', 'pay retention'. Defaults to 'federal hiring'.").optional(),
        limit: z.number().describe("Documents listed, 1-30. Defaults to 8.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hiringRules(args)) } catch (e) { return textError(`Error: ${(e as Error).message}`) }
  }
  )

  server.registerTool(
    "hiring_signal",
    {
      title: "Hiring signal",
      description:
        "The trend behind those rules rather than any one of them: hiring-related documents published per year, by rule type and by issuing agency, how many have taken effect, and whether activity is rising or falling. No USAJOBS_API_KEY needed.",
      inputSchema: z.object({
        query: z.string().describe("Term to profile. Defaults to 'federal hiring'.").optional(),
        years: z.number().describe("Window in years, 2-30. Defaults to 8.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await hiringSignal(args)) } catch (e) { return textError(`Error: ${(e as Error).message}`) }
  }
  )

  return server
}

function errorMessage(e: unknown): string {
  if (e instanceof UsajobsError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}
