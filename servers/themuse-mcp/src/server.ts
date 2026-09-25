import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companyJobs, findJobs, job, jobInsights, jobs, MUSE_LEVELS, searchJobs } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

const LEVEL = z.enum(MUSE_LEVELS).describe("Seniority filter, applied by the Muse API.").optional()
const LOCATION = z.string().describe("Location filter, e.g. 'Remote', 'New York, NY', 'London, UK'.").optional()

export function createServer(): McpServer {
  const server = new McpServer({ name: "themuse-mcp", version: "1.0.0" })
  server.registerTool(
    "jobs",
    {
      title: "Jobs",
      description:
        "Browse the newest The Muse job postings (about 414,000 open roles), 20 per page, with company, location, level and category.",
      inputSchema: z.object({
        page: z.number().describe("Page of the feed, 1-20000.").optional(),
        level: LEVEL,
        location: LOCATION,
        limit: z.number().describe("Max results to show, 1-40.").optional(),
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
      description: "Get one Muse job by id, including the full description text and landing page link.",
      inputSchema: z.object({
        job_id: z.number().describe("Muse job id, as returned by the jobs tool."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await job(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "find_jobs",
    {
      title: "Find jobs",
      description:
        "Search Muse jobs using the API's own level and location filters — faster and far more precise than scanning the feed. " +
        "Example: level 'Senior Level' with location 'Remote'.",
      inputSchema: z.object({
        level: LEVEL,
        location: LOCATION,
        page: z.number().describe("Result page, 1-20000.").optional(),
        limit: z.number().describe("Max results to show, 1-40.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await findJobs(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "company_jobs",
    {
      title: "Company jobs",
      description: "Every open Muse role at companies matching a name, found by scanning the newest postings.",
      inputSchema: z.object({
        company: z.string().describe("Company name or part of one, e.g. 'Uber'."),
        pages: z.number().describe("How many feed pages to scan, 1-10 (20 jobs each).").optional(),
        limit: z.number().describe("Max matches to show, 1-40.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await companyJobs(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "search_jobs",
    {
      title: "Search jobs",
      description:
        "Keyword search across the newest Muse postings (title, company, location, category, level, tags). " +
        "Add a level or location to narrow what gets scanned.",
      inputSchema: z.object({
        query: z.string().describe("Words to match, e.g. 'data analyst', 'kubernetes'."),
        level: LEVEL,
        location: LOCATION,
        pages: z.number().describe("How many feed pages to scan, 1-10 (20 jobs each).").optional(),
        limit: z.number().describe("Max matches to show, 1-40.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await searchJobs(args)) } catch (e) { return textError(error(e)) }
    }
  )
  server.registerTool(
    "job_insights",
    {
      title: "Job insights",
      description:
        "Market overview for a level and/or location: the top employers, locations, levels and categories hiring right now. " +
        "Supersedes a plain \"who is hiring\" company count.",
      inputSchema: z.object({
        level: LEVEL,
        location: LOCATION,
        pages: z.number().describe("How many pages to sample, 1-10 (20 jobs each).").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await jobInsights(args)) } catch (e) { return textError(error(e)) }
    }
  )
  return server
}
