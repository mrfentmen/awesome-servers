import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { board, departments, job, jobs, offices, searchJobs } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "greenhouse-mcp", version: "1.0.0" })
  server.registerTool(
    "jobs",
    {
      title: "Jobs",
      description: "List open jobs on a company Greenhouse board, with location, departments and job ids.",
      inputSchema: z.object( {
        board: z.string().describe("Board token like stripe."),
        limit: z.number().describe("How many jobs to show, 1-50.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "job",
    {
      title: "Job detail",
      description: "Get one job posting on a Greenhouse board, including the full description text.",
      inputSchema: z.object( {
        board: z.string().describe("Board token like stripe."),
        job_id: z.number().describe("Greenhouse job id, as returned by the jobs tool.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await job(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_jobs",
    {
      title: "Search jobs",
      description: "Search a company Greenhouse board by title, location, department or office.",
      inputSchema: z.object( {
        board: z.string().describe("Board token like stripe."),
        query: z.string().describe("Words to match, for example security engineer."),
        limit: z.number().describe("How many matches to show, 1-50.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchJobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "departments",
    {
      title: "Departments",
      description: "List the teams hiring on a Greenhouse board, ranked by number of open roles.",
      inputSchema: z.object( {
        board: z.string().describe("Board token like stripe.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await departments(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "offices",
    {
      title: "Offices",
      description: "List the office locations on a Greenhouse board.",
      inputSchema: z.object( {
        board: z.string().describe("Board token like stripe.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await offices(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "board",
    {
      title: "Board overview",
      description: "Show a company Greenhouse board: name, open job count and the company intro.",
      inputSchema: z.object( {
        board: z.string().describe("Board token like stripe.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await board(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
