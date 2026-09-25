import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { job, jobs, remoteJobs, searchJobs, tags } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "arbeitnow-mcp", version: "1.0.0" })
  server.registerTool(
    "jobs",
    {
      title: "Jobs",
      description: "List the newest Arbeitnow job postings, 250 per page, with tags, location and remote flag.",
      inputSchema: z.object( {
        limit: z.number().describe("Max results to show, 1-50.").optional(),
        page: z.number().describe("Page of the live feed, 1-20.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_jobs",
    {
      title: "Search jobs",
      description: "Search the 500 newest Arbeitnow jobs by title, company, location, tag or job type.",
      inputSchema: z.object( {
        query: z.string().describe("Words to match, for example python or Berlin."),
        limit: z.number().describe("Max matches to show, 1-50.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchJobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "remote_jobs",
    {
      title: "Remote jobs",
      description: "List only the remote-friendly jobs among the 500 newest Arbeitnow postings.",
      inputSchema: z.object( {
        limit: z.number().describe("Max results to show, 1-50.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await remoteJobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "job",
    {
      title: "Job detail",
      description: "Get one Arbeitnow job by its slug, including the full description and apply link.",
      inputSchema: z.object( {
        slug: z.string().describe("Job slug, as returned by the jobs or search_jobs tools.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await job(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "tags",
    {
      title: "Top tags",
      description: "Show which skills and categories appear most often in the newest Arbeitnow jobs.",
      inputSchema: z.object( {
        limit: z.number().describe("How many tags to show, 1-50.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tags(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
