import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchJobs,
  latestJobs,
  jobsByBoard,
  companyJobs,
  salaryInsights,
  boardCoverage,
  jobCategories,
} from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

const boardsArg = z
  .string()
  .describe("Comma-separated board ids to limit the search, e.g. jobicy,themuse. Default: all six.")
  .optional()

export function createServer(): McpServer {
  const server = new McpServer({ name: "job-search-mcp", version: "1.0.0" })

  server.registerTool(
    "search_jobs",
    {
      title: "Search jobs",
      description:
        "Search six public job boards at once (Jobicy, Arbeitnow, RemoteOK, The Muse, Remotive, Hacker News) and get merged, de-duplicated results with company, location, salary where the board exposes one, and a link. Use this for any job hunt.",
      inputSchema: z.object({
        query: z.string().describe("Role or skill keywords, e.g. python developer.").optional(),
        category: z.string().describe("Industry or role keyword to narrow results, e.g. engineering.").optional(),
        location: z.string().describe("Location filter, e.g. USA, Germany, New York.").optional(),
        boards: boardsArg,
        limit: z.number().describe("How many jobs to show, 1-50 (default 10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, category, location, boards, limit }) => {
      try {
        const combined = [query, category].filter((part) => part && part.trim()).join(" ")
        return text(await searchJobs({ query: combined, location, boards, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "latest_jobs",
    {
      title: "Latest jobs",
      description:
        "The newest postings across all six boards, newest first, with no keyword needed. Good for 'what jobs came out today'.",
      inputSchema: z.object({
        location: z.string().describe("Location filter, e.g. USA.").optional(),
        boards: boardsArg,
        limit: z.number().describe("How many jobs to show, 1-50 (default 10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ location, boards, limit }) => {
      try {
        return text(await latestJobs({ location, boards, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "jobs_by_board",
    {
      title: "Jobs by board",
      description:
        "Query one specific job board on its own, for when you want a single source instead of the merged feed. Jobicy and Hacker News filter server-side; the others are filtered over their latest postings.",
      inputSchema: z.object({
        board: z.string().describe("Board id: jobicy, arbeitnow, remoteok, themuse, remotive, or hn."),
        query: z.string().describe("Role or skill keywords, e.g. rust.").optional(),
        location: z.string().describe("Location filter, e.g. Germany.").optional(),
        limit: z.number().describe("How many jobs to show, 1-50 (default 10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ board, query, location, limit }) => {
      try {
        return text(await jobsByBoard({ board, query, location, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "company_jobs",
    {
      title: "Company jobs",
      description:
        "Every open posting at a company across all six boards, matched on the company name. Useful before an interview or when tracking a shortlist.",
      inputSchema: z.object({
        company: z.string().describe("Company name or part of it, e.g. stripe."),
        boards: boardsArg,
        limit: z.number().describe("How many jobs to show, 1-50 (default 10).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ company, boards, limit }) => {
      try {
        return text(await companyJobs({ company, boards, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "job_categories",
    {
      title: "Job categories",
      description:
        "The job boards this server aggregates, their ids, and how each one filters — so an agent knows which board to target for a given query.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => {
      try {
        return text(await jobCategories())
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "salary_insights",
    {
      title: "Salary insights",
      description:
        "Scan the job boards for a keyword and summarise the pay that postings actually disclosed: lowest, median and highest USD-per-year figure, plus the best paying matches.",
      inputSchema: z.object({
        query: z.string().describe('Job keywords to focus on, e.g. "backend engineer" or "data analyst". Omit to scan all recent postings.').optional(),
        boards: z.string().describe('Comma separated board ids to use, e.g. "jobicy,remoteok". Defaults to all six.').optional(),
        limit: z.number().describe("How many best paying matches to list, 1-50.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await salaryInsights(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "board_coverage",
    {
      title: "Board coverage",
      description:
        "Compare how many jobs each aggregated board returns for a query, and report which boards are unreachable, so an agent knows where a search is actually coming from.",
      inputSchema: z.object({
        query: z.string().describe('Optional keywords to compare coverage for, e.g. "devops".').optional(),
        location: z.string().describe('Optional location to compare coverage for, e.g. "Berlin".').optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        return text(await boardCoverage(args))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
