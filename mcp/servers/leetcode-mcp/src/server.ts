import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { problems, search } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "leetcode-mcp", version: "1.0.0" })
  server.registerTool(
    "problems",
    {
      title: "Problems",
      description: "List problems, optionally filtered by difficulty.",
      inputSchema: z.object( { difficulty: z.string().describe("easy, medium, or hard.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await problems(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Search problems by title.",
      inputSchema: z.object( { query: z.string().describe("Title search query."), limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await search(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "question_detail",
    {
      title: "Question detail",
      description: "One LeetCode problem in full by its slug: difficulty, premium flag, topic tags, companies, accept ratio and similar problems.",
      inputSchema: z.object( { slug: z.string().describe("Problem slug, e.g. two-sum."), }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement detail locally (paywall removed)
    try { return textError("Not yet implemented: detail") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "daily_challenge",
    {
      title: "Daily challenge",
      description: "LeetCode's active daily coding challenge with its date, url, difficulty and topic tags, resolved from the GraphQL endpoint.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement challenge locally (paywall removed)
    try { return textError("Not yet implemented: challenge") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
