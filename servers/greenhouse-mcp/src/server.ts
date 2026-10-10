import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { board, departments, job, jobQuestions, jobs, jobsByOffice, newestJobs, offices, searchJobs } from "./api.js"
import { premiumTool } from "./gateway.js"
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
  server.registerTool(
    "jobs_by_office",
    {
      title: "Jobs by office",
      description: "List the open jobs attached to one office on a Greenhouse board, or to a matching location.",
      inputSchema: z.object( {
        board: z.string().describe("Board token like stripe."),
        office: z.string().describe("Office or location name, for example London or Remote."),
        limit: z.number().describe("How many jobs to show, 1-50.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobsByOffice(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "newest_jobs",
    {
      title: "Newest jobs",
      description: "List the most recently opened jobs on a Greenhouse board, newest first.",
      inputSchema: z.object( {
        board: z.string().describe("Board token like stripe."),
        limit: z.number().describe("How many jobs to show, 1-50.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await newestJobs(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "job_questions",
    {
      title: "Application form",
      description: "Show the real application questions for one Greenhouse job, with which are required and the deadline.",
      inputSchema: z.object( {
        board: z.string().describe("Board token like stripe."),
        job_id: z.number().describe("Greenhouse job id, as returned by the jobs tool.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobQuestions(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "hiring_velocity",
    {
      title: "Hiring velocity",
      description: "How fast a Greenhouse board is hiring: how many roles were first published inside a window, the median age of an open role, and the newest openings. Uses the first_published date the plain job list omits.",
      inputSchema: z.object({ board: z.string().describe("Board token, e.g. figma"), days: z.number().describe("Window in days (default 30, max 365).").optional(), limit: z.number().describe("How many openings to print (default 10, max 30).").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: hiring_velocity ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_greenhouse_hiring_velocity", args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "ashby_posting",
    {
      title: "Ashby posting",
      description: "The same role on a company that hires through Ashby, with the salary and equity band that posting publishes - figures a Greenhouse job record never carries.",
      inputSchema: z.object({ company: z.string().describe("Ashby job board name, e.g. Ramp"), query: z.string().describe("Role or team to match, e.g. 'engineer'"), limit: z.number().describe("How many matches to print (default 5, max 20).").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
      // ---- paywall: ashby_posting ----
          // The body runs on the gateway, behind the licence gate.
      // ---- paywall: end ----
      try { return text(await premiumTool("mcp_greenhouse_ashby_posting", args)) } catch (e) { return textError(error(e)) }
    }
  )

  return server
}
