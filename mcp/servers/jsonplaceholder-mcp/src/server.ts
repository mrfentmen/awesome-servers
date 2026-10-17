import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { posts, todos, users } from "./api.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "jsonplaceholder-mcp", version: "1.0.0" })
  server.registerTool(
    "todos",
    {
      title: "Todos",
      description: "List todos.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await todos(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "posts",
    {
      title: "Posts",
      description: "List posts.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await posts(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "users",
    {
      title: "Users",
      description: "List users.",
      inputSchema: z.object( {  }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await users(args)) } catch (e) { return textError(String(e)) }
  }
  )
  server.registerTool(
    "comments",
    {
      title: "Comments",
      description: "JSONPlaceholder comments with their name, email and body, optionally just the ones on one post.",
      inputSchema: z.object( { post_id: z.number().describe("Restrict to one post id, 1 to 100.").optional(), limit: z.number().describe("Max comments.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement comments locally (paywall removed)
    try { return textError("Not yet implemented: comments") } catch (e) { return textError(String(e)) }
  }
  )

  server.registerTool(
    "albums",
    {
      title: "Albums",
      description: "The JSONPlaceholder albums, optionally just one user's.",
      inputSchema: z.object( { user_id: z.number().describe("Restrict to one user id, 1 to 10.").optional(), limit: z.number().describe("Max albums.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // TODO: implement albums locally (paywall removed)
    try { return textError("Not yet implemented: albums") } catch (e) { return textError(String(e)) }
  }
  )

  return server
}
