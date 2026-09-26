import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companies, job, jobs, locations, remoteJobs, searchJobs, tags } from "./api.js"

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
        limit: z.number().describe("Max results to show, 1-50, e.g. 25 for a quick scan.").optional(),
        page: z.number().describe("Page of the live feed, 1-20, e.g. 2 for the next page.").optional()
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
        limit: z.number().describe("Max results to show, 1-50, e.g. 30 to see more remote roles.").optional()
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
        slug: z.string().describe("Job slug, e.g. the slug field returned by list_jobs or search_jobs.")
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
        limit: z.number().describe("How many tags to show, 1-50, e.g. 20 for the main skills.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tags(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "companies",
    {
      title: "Companies hiring",
      description: "Rank the employers with the most open Arbeitnow postings, with their remote count and newest posting date.",
      inputSchema: z.object( {
        limit: z.number().describe("How many companies to show, 1-50, e.g. 25 for the busiest employers.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await companies(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "locations",
    {
      title: "Locations and job types",
      description: "Show where the newest Arbeitnow jobs are, split by city and by job type, with a remote versus on-site count.",
      inputSchema: z.object( {
        limit: z.number().describe("How many locations and types to show, 1-50, e.g. 15 for the top cities.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await locations(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
