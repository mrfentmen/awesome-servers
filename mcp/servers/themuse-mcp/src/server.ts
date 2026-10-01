import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companyJobs, findJobs, job, jobInsights, jobs, MUSE_LEVELS, searchJobs, listCompanies, companySearch, compareCompanies, postingAgeCensus, marketConcentration, requirementsScan } from "./api.js"
import { premiumRequired } from "./license.js"
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
  server.registerTool(
    "list_companies",
    {
      title: "List companies",
      description:
        "Browse The Muse employer directory page by page: company, industries, locations and size, with the total number profiled.",
      inputSchema: z.object({
        page: z.number().describe("Directory page to read, starting at 1. Defaults to 1.").optional(),
        limit: z.number().describe("How many companies to show, 1-40. Defaults to 10.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ page, limit }) => {
      try {
        return text(await listCompanies({ page, limit }))
      } catch (e) {
        return textError(error(e))
      }
    }
  )

  server.registerTool(
    "company_search",
    {
      title: "Find a company",
      description:
        "Search the employer directory by name, scanning several pages because the directory has no search parameter, and reports which page each match came from.",
      inputSchema: z.object({
        name: z.string().describe("Company name or part of it, e.g. 'space'"),
        pages: z.number().describe("How many directory pages to scan, 1-20. Defaults to 5.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ name, pages }) => {
      try {
        return text(await companySearch({ name, pages }))
      } catch (e) {
        return textError(error(e))
      }
    }
  )

  server.registerTool(
    "compare_companies",
    {
      title: "Compare employers",
      description:
        "Open-role counts for two to five employers side by side, ranked, so a shortlist of companies can be compared on actual hiring.",
      inputSchema: z.object({
        companies: z.array(z.string()).describe('Company names, e.g. ["SpaceX", "Tesla", "Apple"]'),
      }),
      annotations: READ_ONLY,
    },
    async ({ companies }) => {
      try {
        return text(await compareCompanies({ companies }))
      } catch (e) {
        return textError(error(e))
      }
    }
  )

  server.registerTool(
    "posting_age_census",
    {
      title: "Posting age census",
      description: "How fresh the listings on a slice of The Muse actually are, from the public API's own publication dates: median and extreme ages, counts in six age buckets from under a week to over a year, how many listings are past a month and past three months, and the employers whose listings look stalest. A long tail of old adverts discounts the site's apparent volume.",
      inputSchema: z.object({ pages: z.number().describe("How many result pages to sample, 1-5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: posting_age_census ----
    const paywallMessage = await premiumRequired("posting_age_census")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await postingAgeCensus(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "market_concentration",
    {
      title: "Market concentration",
      description: "Who is actually hiring on a slice of The Muse: distinct employers, seniorities, locations and categories, the share held by the top ten employers, a Herfindahl index over employer concentration, the largest single employer, how many appear exactly once, how many listings are literally remote, and the level and location breakdowns, with an explicit warning that pagination is not a random sample.",
      inputSchema: z.object({ pages: z.number().describe("How many result pages to sample, 1-5.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await marketConcentration(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "requirements_scan",
    {
      title: "Requirements scan",
      description: "What the postings on a slice of The Muse actually ask for, read out of the description text: how many state any compensation figure and which, figures bucketed to the nearest five thousand, how many descriptions carry real text, the seniority tags, and the most frequent significant words across every description with common filler removed.",
      inputSchema: z.object({
        pages: z.number().describe("How many result pages to sample, 1-4.").optional(),
        location: z.string().describe("Only consider listings at locations matching this text.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: requirements_scan ----
    const paywallMessage = await premiumRequired("requirements_scan")
    if (paywallMessage) return { content: [{ type: "text" as const, text: paywallMessage }], isError: true }
    // ---- paywall: end ----
    try { return text(await requirementsScan(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
