import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  webSearch,
  newsSearch,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "brave-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "web_search",
    {
      title: "Web search",
      description: "Independent web results.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        count: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, count }) => {
      try {
        return text(await webSearch(query, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "news_search",
    {
      title: "News search",
      description: "News results.",
      inputSchema: z.object({
        query: z.string().describe("Search text."),
        count: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, count }) => {
      try {
        return text(await newsSearch(query, count));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}