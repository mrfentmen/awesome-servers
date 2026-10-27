import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listUsers,
  listDatabases,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "appwrite-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Project users with email and status.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 20, max 100).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ limit }) => {
      try {
        return text(await listUsers(limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_databases",
    {
      title: "List databases",
      description: "Databases in the project, with id and name.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listDatabases());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}