import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { departments, locations, posting, postings, recentPostings, searchPostings, teams, groupedPostings, newestSince } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "lever-mcp", version: "1.0.0" })
  server.registerTool(
    "postings",
    {
      title: "Postings",
      description: "List every open posting on a company Lever job board, with team, location and workplace type.",
      inputSchema: z.object( { company: z.string().describe("Company slug, for example leverdemo."), limit: z.number().describe("Max results, 1-30.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await postings(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "posting",
    {
      title: "Posting detail",
      description: "Get one Lever posting by id, including the full plain-text description and apply link.",
      inputSchema: z.object( {
        company: z.string().describe("Company slug, for example leverdemo."),
        posting_id: z.string().describe("Posting id, as returned by the postings tool.")
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
      description: "Search a company Lever board by title, team, department, location or commitment.",
      inputSchema: z.object( {
        company: z.string().describe("Company slug, for example leverdemo."),
        query: z.string().describe("Words to match, for example engineer or Berlin."),
        limit: z.number().describe("Max matches, 1-30.").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await searchPostings(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "recent_postings",
    {
      title: "Recent postings",
      description: "A company's Lever postings sorted newest first, with the date each went up.",
      inputSchema: z.object({
        company: z.string().describe("Company slug, for example 'spotify' or 'kraken'."),
        limit: z.number().describe("Max results, 1-30.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await recentPostings(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "departments",
    {
      title: "Departments",
      description: "A company's Lever postings grouped by department, ranked by how many are open.",
      inputSchema: z.object({
        company: z.string().describe("Company slug, for example 'spotify'."),
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await departments(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "teams",
    {
      title: "Teams",
      description: "List the teams hiring on a company Lever board, ranked by number of postings.",
      inputSchema: z.object( { company: z.string().describe("Company slug, for example leverdemo.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await teams(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "locations",
    {
      title: "Locations",
      description: "List where a company is hiring on Lever, with posting counts per location.",
      inputSchema: z.object( { company: z.string().describe("Company slug, for example leverdemo.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await locations(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "grouped_postings",
    {
      title: "Grouped postings",
      description: "Lever's own server-side grouping: counts per team, department, location or commitment, with examples.",
      inputSchema: z.object({
        company: z.string().describe("Lever board slug, e.g. palantir (jobs.lever.co/<slug>)."),
        group_by: z.enum(["team", "department", "location", "commitment"]).describe("Field to group by (default team).").optional(),
        samples: z.number().describe("Example postings per group, 1-10 (default 3).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await groupedPostings(args)) } catch (e) { return textError(error(e)) }
    }
  )

  server.registerTool(
    "newest_since",
    {
      title: "Newest since",
      description: "Postings added on or after a date - what changed on the board since you last looked.",
      inputSchema: z.object({
        company: z.string().describe("Lever board slug, e.g. palantir."),
        since: z.string().describe("Cut-off date, YYYY-MM-DD."),
        limit: z.number().describe("Max postings to list (default 20, max 40).").optional()
      }),
      annotations: READ_ONLY,
    },
    async (args) => {
      try { return text(await newestSince(args)) } catch (e) { return textError(error(e)) }
    }
  )

  return server
}
