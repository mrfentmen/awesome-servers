import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  errorMessage,
  me,
  publicationPosts,
  getUser,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "hashnode-mcp",
    version: "1.0.0",
  })

  server.registerTool(
    "me",
    {
      title: "My profile",
      description: "Authenticated user.",
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
    "publication_posts",
    {
      title: "Publication posts",
      description: "Recent posts.",
      inputSchema: z.object({
        host: z.string().describe("Publication host."),
        limit: z.string().describe("Max results (default 5, max 20).").optional()
      }),
      annotations: READ_ONLY,
    },
    async ({ host, limit }) => {
      try {
        return text(await publicationPosts(host, limit));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  server.registerTool(
    "get_user",
    {
      title: "Get user",
      description: "User profile.",
      inputSchema: z.object({
        username: z.string().describe("Hashnode username, e.g. john")
      }),
      annotations: READ_ONLY,
    },
    async ({ username }) => {
      try {
        return text(await getUser(username));
      } catch (e) {
        return textError(errorMessage(e));
      }
    }
  )

  return server
}