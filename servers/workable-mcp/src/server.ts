import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companies, companyJobs, jobDetail, marketSummary, recentJobs, remoteJobs, searchJobs } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "workable-mcp", version: "1.0.0" })
  server.registerTool(
    "search_jobs",
    {
      title: "Search jobs",
      description:
        "Search live roles on company career sites powered by Workable (roughly 170,000 open jobs). " +
        "Filter by keyword, location or both.",
      inputSchema: z.object({
        query: z.string().describe("Job keyword, e.g. 'data engineer', 'nurse'.").optional(),
        location: z.string().describe("Location filter, e.g. 'London', 'Berlin', 'remote'.").optional(),
        limit: z.number().describe("Max roles to show (default 10, max 20).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await searchJobs(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "job_detail",
    {
      title: "Job detail",
      description: "Full posting for one job: company, location, contract type, apply link and the description text.",
      inputSchema: z.object({
        job_id: z.string().describe("Job id from search_jobs."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await jobDetail(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "company_jobs",
    {
      title: "Company jobs",
      description: "Every open role on one company's Workable board, e.g. board 'stealth-it'.",
      inputSchema: z.object({
        board: z.string().describe("Workable board slug, e.g. 'stealth-it'."),
        limit: z.number().describe("Max roles to show (default 20, max 50).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await companyJobs(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "companies",
    {
      title: "Companies hiring",
      description: "Which companies are hiring for a keyword, ranked by how many roles they have open.",
      inputSchema: z.object({
        query: z.string().describe("Job keyword, e.g. 'rust developer'."),
        location: z.string().describe("Optional location filter.").optional(),
        limit: z.number().describe("Max companies to show (default 15, max 20).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await companies(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "market_summary",
    {
      title: "Market summary",
      description:
        "Rough shape of the job market for a keyword: top employers, locations, contract types and departments.",
      inputSchema: z.object({
        query: z.string().describe("Job keyword, e.g. 'product manager'."),
        location: z.string().describe("Optional location filter.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await marketSummary(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "remote_jobs",
    {
      title: "Remote jobs",
      description: "List only remote, hybrid or on-site roles, using Workable's own workplace filter rather than sorting through mixed results.",
      inputSchema: z.object({
        query: z.string().describe("Keywords, e.g. 'customer support'.").optional(),
        location: z.string().describe("Optional location filter, e.g. 'Berlin'.").optional(),
        workplace: z.enum(["remote", "hybrid", "on_site"]).describe("Which workplace mode to keep. Defaults to remote.").optional(),
        limit: z.number().describe("How many roles to show, 1-20.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await remoteJobs(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "recent_jobs",
    {
      title: "Newest jobs",
      description: "Sort Workable results by posting date, newest first, and report how fresh the sample actually is.",
      inputSchema: z.object({
        query: z.string().describe("Keywords, e.g. 'data analyst'.").optional(),
        location: z.string().describe("Optional location filter, e.g. 'Austin'.").optional(),
        limit: z.number().describe("How many roles to show, 1-20.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await recentJobs(args)) } catch (e) { return textError(error(e)) }
    }
  )
  return server
}
