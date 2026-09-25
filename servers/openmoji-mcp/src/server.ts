import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  searchEmoji,
  getEmoji,
  listGroups,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "openmoji-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "search_emoji",
    {
      title: "Search emoji",
      description: "Emoji matching a keyword.",
      inputSchema: z.object({
        query: z.string().describe("Keyword, e.g. cat."),
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ query, limit }) => {
      try {
        return text(await searchEmoji(query, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_emoji",
    {
      title: "Get emoji",
      description: "Details by hexcode.",
      inputSchema: z.object({
        hexcode: z.string().describe("Hexcode, e.g. 1F431.")
      }),
      annotations: READ_ONLY,
    },
    async ({ hexcode }) => {
      try {
        return text(await getEmoji(hexcode));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_groups",
    {
      title: "List groups",
      description: "Emoji groups.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listGroups());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}