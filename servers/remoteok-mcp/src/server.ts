import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companies, job, jobs, search, tags, topSalaries } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "remoteok-mcp", version: "1.0.0" })
  server.registerTool(
    "jobs",
    {
      title: "Jobs",
      description: "List the newest remote jobs from RemoteOK, with pay range when published.",
      inputSchema: z.object( { limit: z.number().describe("Max results, 1-25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search RemoteOK jobs by tag or skill, for example python or react.",
      inputSchema: z.object( { query: z.string().describe("Search terms."), limit: z.number().describe("Max results, 1-25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "job",
    {
      title: "Job detail",
      description: "Get one RemoteOK job by id, including the full description and apply link.",
      inputSchema: z.object( { job_id: z.string().describe("Job id or slug, as returned by the jobs tool.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await job(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "top_salaries",
    {
      title: "Top salaries",
      description: "List the remote jobs in the live feed that publish the highest salaries.",
      inputSchema: z.object( { limit: z.number().describe("How many jobs to show, 1-25.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await topSalaries(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "companies",
    {
      title: "Companies",
      description: "List the companies hiring the most on RemoteOK right now, with opening counts.",
      inputSchema: z.object( { limit: z.number().describe("How many companies to show, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await companies(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "tags",
    {
      title: "Top tags",
      description: "Show which skills and tags appear most often in the live RemoteOK feed.",
      inputSchema: z.object( { limit: z.number().describe("How many tags to show, 1-50.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await tags(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
