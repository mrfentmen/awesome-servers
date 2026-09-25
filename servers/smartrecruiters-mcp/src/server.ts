import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { departments, jobs, posting, searchPostings } from "./api.js"

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "smartrecruiters-mcp", version: "1.0.0" })
  server.registerTool(
    "jobs",
    {
      title: "Jobs",
      description: "List a company SmartRecruiters job postings with location, department and posting id.",
      inputSchema: z.object( {
        company: z.string().describe("Company id like BoschGroup or Continental."),
        limit: z.number().describe("How many postings to show, 1-50.").optional(),
        offset: z.number().describe("Skip this many postings to page through the board.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await jobs(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "posting",
    {
      title: "Posting detail",
      description: "Get one SmartRecruiters posting by id, with the full job description and apply link.",
      inputSchema: z.object( {
        company: z.string().describe("Company id like BoschGroup."),
        posting_id: z.string().describe("Posting id, as returned by the jobs tool.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await posting(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "search_postings",
    {
      title: "Search postings",
      description: "Search a company SmartRecruiters board by title, location, department or function.",
      inputSchema: z.object( {
        company: z.string().describe("Company id like BoschGroup."),
        query: z.string().describe("Words to match, for example engineer or Berlin."),
        limit: z.number().describe("How many matches to show, 1-50.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPostings(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "departments",
    {
      title: "Hiring breakdown",
      description: "Show a company SmartRecruiters hiring split by department, function, industry and experience level.",
      inputSchema: z.object( {
        company: z.string().describe("Company id like BoschGroup.")
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await departments(args)) } catch (e) { return textError(error(e)) }
  }
  )
  return server
}
