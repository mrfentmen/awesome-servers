import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  listCollections,
  listUsers,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "directus-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "list_collections",
    {
      title: "List collections",
      description: "Collections (tables) in the Directus instance.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async ({  }) => {
      try {
        return text(await listCollections());
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "list_users",
    {
      title: "List users",
      description: "Directus users with email, role and status.",
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

  return server
}