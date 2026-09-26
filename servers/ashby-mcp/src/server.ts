import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  AshbyError,
  compensation,
  departments,
  formatJob,
  getJob,
  listJobs,
  remoteJobs,
  searchJobs,
} from "./api.js"

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
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(10)
          .describe("How many roles to list, 1-100 (default 10). For example 25."),
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

  server.registerTool(
    "search_jobs",
    {
      title: "Search jobs",
      description: "Search every open role on an Ashby job board by title, team or location.",
      inputSchema: z.object({
        org: z.string().describe("Organization slug, e.g. 'ramp'"),
        query: z.string().describe("Words to match, for example security engineer"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(10)
          .describe("How many matches to return, 1-100 (default 10). For example 20."),
      }),
      annotations: READ_ONLY,
    },
    async ({ org, query, limit }) => {
      try {
        return text(await searchJobs(org, query, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "get_job",
    {
      title: "Job detail",
      description: "Get one Ashby role by id, including the full plain-text description.",
      inputSchema: z.object({
        org: z.string().describe("Organization slug, e.g. 'ramp'"),
        job_id: z.string().describe("Role id, as returned by list_jobs or search_jobs"),
      }),
      annotations: READ_ONLY,
    },
    async ({ org, job_id }) => {
      try {
        return text(await getJob(org, job_id))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_departments",
    {
      title: "Departments",
      description: "List the teams hiring on an Ashby board, ranked by number of open roles.",
      inputSchema: z.object({
        org: z.string().describe("Organization slug, e.g. 'ramp'"),
      }),
      annotations: READ_ONLY,
    },
    async ({ org }) => {
      try {
        return text(await departments(org))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "list_remote_jobs",
    {
      title: "Remote jobs",
      description: "List only the remote roles on an Ashby job board.",
      inputSchema: z.object({
        org: z.string().describe("Organization slug, e.g. 'ramp'"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(10)
          .describe("How many remote roles to list, 1-100 (default 10). For example 30."),
      }),
      annotations: READ_ONLY,
    },
    async ({ org, limit }) => {
      try {
        return text(await remoteJobs(org, limit))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "compensation",
    {
      title: "Compensation",
      description: "List Ashby roles that publish a pay range, with the salary summary for each role.",
      inputSchema: z.object({
        org: z.string().describe("Organization slug, e.g. 'ramp'"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(10)
          .describe("How many roles to include, 1-100 (default 10). For example 15."),
      }),
      annotations: READ_ONLY,
    },
    async ({ org, limit }) => {
      try {
        return text(await compensation(org, limit))
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
