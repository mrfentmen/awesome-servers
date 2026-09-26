import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  me,
  listTeams,
  searchIssues,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "linear-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "me",
    {
      title: "Viewer",
      description: "The Linear user the API key belongs to.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await me());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_teams",
    {
      title: "List teams",
      description: "Teams in the workspace, with key and id.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listTeams());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "search_issues",
    {
      title: "Search issues",
      description: "Search issues by text, e.g. login bug.",
      inputSchema: z.object({
        term: z.string().describe("Search text."),
        limit: z.string().describe("Max results (default 10, max 50).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ term, limit }) => {
      try {
        return text(await searchIssues(term, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}