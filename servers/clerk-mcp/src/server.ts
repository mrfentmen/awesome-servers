import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listUsers,
  getUser,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "clerk-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Clerk users.",
      inputSchema: z.object({
        limit: z.string().describe("Max results (default 10, max 100).").optional()
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
    "get_user",
    {
      title: "Get user",
      description: "User details by ID.",
      inputSchema: z.object({
        user_id: z.string().describe("Clerk user ID, e.g. user_2abc123def")
      }),
      annotations: READ_ONLY,
    },
    async ({ user_id }) => {
      try {
        return text(await getUser(user_id));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}