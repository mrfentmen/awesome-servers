import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { contests, user, problemList } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "codeforces-mcp", version: "1.0.0" })
  server.registerTool(
    "contests",
    {
      title: "Contests",
      description: "List upcoming and recent contests.",
      inputSchema: z.object( { limit: z.number().describe("Max contests.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await contests(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "user",
    {
      title: "User",
      description: "Get user info by handle.",
      inputSchema: z.object( { handle: z.string().describe("Codeforces handle.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await user(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "problem_list",
    {
      title: "Problem list",
      description: "Search the Codeforces problem archive by name, tag and difficulty rating.",
      inputSchema: z.object( { query: z.string().describe("Substring of the problem name.").optional(), tag: z.string().describe("Exact problem tag, e.g. dp or greedy.").optional(), minRating: z.number().describe("Lowest difficulty rating.").optional(), maxRating: z.number().describe("Highest difficulty rating.").optional(), limit: z.number().describe("Max problems.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await problemList(args)) } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "user_rating_history",
    {
      title: "User rating history",
      description: "Every rated Codeforces contest a user entered, with rank and the rating change each one caused.",
      inputSchema: z.object( { handle: z.string().describe("Codeforces handle."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement history locally (paywall removed)
    try { return textError("Not yet implemented: history") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "user_submissions",
    {
      title: "User submissions",
      description: "A user's recent Codeforces submissions with problem, verdict, language, runtime and memory.",
      inputSchema: z.object( { handle: z.string().describe("Codeforces handle."), count: z.number().describe("Max submissions to fetch.").optional(), verdict: z.string().describe("Only this verdict, e.g. ACCEPTED.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement submissions locally (paywall removed)
    try { return textError("Not yet implemented: submissions") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
