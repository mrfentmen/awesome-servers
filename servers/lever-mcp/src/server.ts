import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { departments, locations, posting, postings, recentPostings, searchPostings, teams } from "./api.js"

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
  return server
}
