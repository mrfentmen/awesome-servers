import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { companies, companyJobs, geographies, industries, jobDetails, jobLevels, jobs, salaryBands, topSalaries } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "jobicy-mcp", version: "1.0.0" })
  server.registerTool(
    "jobs",
    {
      title: "Jobs",
      description: "List remote jobs, filtered by region (geo), industry or skill tag.",
      inputSchema: z.object( {
        count: z.number().describe("Max results, 1-50.").optional(),
        geo: z.string().describe("Region filter, for example usa or europe.").optional(),
        industry: z.string().describe("Industry filter, for example marketing.").optional(),
        tag: z.string().describe("Skill tag filter, for example python.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "job_details",
    {
      title: "Job details",
      description: "Get full descriptions for jobs matching a title, company or skill, searched across the 50 most recent postings.",
      inputSchema: z.object( {
        query: z.string().describe("Words to match against job title, company, industry or summary."),
        geo: z.string().describe("Optional region filter, for example usa.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobDetails(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "industries",
    {
      title: "Industries",
      description: "List the industries hiring the most remote workers right now, with open job counts.",
      inputSchema: z.object( {
        geo: z.string().describe("Optional region filter, for example europe.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await industries(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "top_salaries",
    {
      title: "Top salaries",
      description: "List the highest-paying remote jobs that publish a salary, annualized for comparison.",
      inputSchema: z.object( {
        count: z.number().describe("How many jobs to show, 1-50.").optional(),
        geo: z.string().describe("Region filter, for example usa.").optional(),
        industry: z.string().describe("Industry filter, for example software.").optional(),
        tag: z.string().describe("Skill tag filter, for example python.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await topSalaries(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "companies",
    {
      title: "Companies hiring",
      description: "Rank the companies with the most open remote jobs, including how many disclosed pay and the top published salary.",
      inputSchema: z.object( {
        count: z.number().describe("How many companies to show, 1-50.").optional(),
        geo: z.string().describe("Region filter, for example usa.").optional(),
        industry: z.string().describe("Industry filter, for example finance.").optional(),
        tag: z.string().describe("Skill tag filter, for example react.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await companies(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "job_levels",
    {
      title: "Levels and pay",
      description: "Break remote hiring down by experience level and employment type, with the highest published salary in each level.",
      inputSchema: z.object( {
        geo: z.string().describe("Optional region filter, for example europe.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobLevels(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "geographies",
    {
      title: "Where jobs are based",
      description: "Break the most recent remote jobs down by region, with the top published pay in each place.",
      inputSchema: z.object( {
        count: z.number().describe("Unused, kept for symmetry with jobs.").optional(),
        industry: z.string().describe("Industry filter, for example marketing.").optional(),
        tag: z.string().describe("Skill tag filter, for example python.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await geographies(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "company_jobs",
    {
      title: "Company jobs",
      description: "List every open remote job from one company in the most recent postings, newest first.",
      inputSchema: z.object( {
        company: z.string().describe("Company name or part of it, for example Automattic."),
        count: z.number().describe("How many jobs to show, 1-50.").optional(),
        geo: z.string().describe("Region filter, for example usa.").optional(),
        industry: z.string().describe("Industry filter, for example software.").optional(),
        tag: z.string().describe("Skill tag filter, for example react.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await companyJobs(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "salary_bands",
    {
      title: "Pay bands",
      description: "Show how published remote salaries are distributed, with the median and the share of jobs that disclose pay.",
      inputSchema: z.object( {
        geo: z.string().describe("Region filter, for example europe.").optional(),
        industry: z.string().describe("Industry filter, for example finance.").optional(),
        tag: z.string().describe("Skill tag filter, for example python.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await salaryBands(args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
