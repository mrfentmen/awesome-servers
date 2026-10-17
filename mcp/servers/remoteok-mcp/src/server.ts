import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companies, job, jobs, search, tags, topSalaries, newestJobs, tagCombinations, companyJobs } from "./api.js"
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
    try { return text(await jobs(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await job(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await topSalaries(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await companies(args)) } catch (e) { return textError(String(e)) }
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
    try { return text(await tags(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "newest_jobs",
    {
      title: "Newest jobs",
      description:
        "Remote jobs posted inside a time window, newest first, with the tags and companies active in that window. The feed itself is unfiltered.",
      inputSchema: z.object({
        hours: z.number().describe("How far back to look, 1-720 hours. Defaults to 24.").optional(),
        limit: z.number().describe("How many jobs to show, 1-50. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ hours, limit }) => {
      try {
        return text(await newestJobs({ hours, limit }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "tag_combinations",
    {
      title: "Jobs with all these tags",
      description:
        "Find roles carrying every tag given, e.g. react plus senior, which the feed's single-tag filter cannot express, with the pay range they publish.",
      inputSchema: z.object({
        tags: z.array(z.string()).describe('Tags that must all be present, e.g. ["react", "senior"]'),
        limit: z.number().describe("How many jobs to show, 1-40. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ tags, limit }) => {
      try {
        return text(await tagCombinations({ tags, limit }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "company_jobs",
    {
      title: "One company's jobs",
      description:
        "Every open role from one company on the feed, with the tag mix across its roles and the salary range it publishes.",
      inputSchema: z.object({
        company: z.string().describe("Company name or part of it, e.g. 'stripe'"),
        limit: z.number().describe("How many roles to show, 1-40. Defaults to 15.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ company, limit }) => {
      try {
        return text(await companyJobs({ company, limit }))
      } catch (e) {
        return textError(String(e))
      }
    }
  )

  server.registerTool(
    "market_census",
    {
      title: "Feed census",
      description:
        "How complete the RemoteOK feed actually is: what share of postings disclose a salary, name a location, are verified and carry tags, and how the postings spread across the days they were listed.",
      inputSchema: z.object({
        limit: z.number().describe("Only inspect this many postings, 1-400. Defaults to the whole feed.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement census locally (paywall removed)
    try { return textError("Not yet implemented: census") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "salary_by_tag",
    {
      title: "Salary by tag",
      description:
        "What each tag pays, computed only from the postings that publish a band, with the sample size beside every figure and the median placed in a salary band.",
      inputSchema: z.object({
        limit: z.number().describe("Max tags listed, 1-30. Defaults to 15.").optional(),
        min_posts: z.number().describe("Only price tags with at least this many priced postings, 1-20. Defaults to 3.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement tag locally (paywall removed)
    try { return textError("Not yet implemented: tag") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
