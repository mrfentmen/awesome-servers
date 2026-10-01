import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

import { object, objects, mockPosts } from "./api.js"
import { premiumTool } from "./gateway.js"
const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })
const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const
const error = (e: unknown) => `Error: ${e instanceof Error ? e.message : String(e)}`

export function createServer(): McpServer {
  const server = new McpServer({ name: "restful-api-dev-mcp", version: "1.0.0" })
  server.registerTool(
    "objects",
    {
      title: "Objects",
      description: "List test objects.",
      inputSchema: z.object( { limit: z.number().describe("Max results.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await objects(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "object",
    {
      title: "Object",
      description: "Get one object.",
      inputSchema: z.object( { id: z.string().describe("Object id.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await object(args)) } catch (e) { return textError(error(e)) }
  }
  )
  server.registerTool(
    "mock_users",
    {
      title: "Mock users",
      description: "Sample user records from the public jsonplaceholder test REST API, with address, phone and company fields.",
      inputSchema: z.object( { limit: z.number().describe("Max results, 1 to 20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: mock_users ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_restful_api_dev_mock_users", args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "mock_posts",
    {
      title: "Mock posts",
      description: "Sample post records from the public jsonplaceholder test REST API, with author id and body text.",
      inputSchema: z.object( { limit: z.number().describe("Max results, 1 to 20.").optional() }),
      annotations: READ_ONLY,
    },
    async (args) => {
    try { return text(await mockPosts(args)) } catch (e) { return textError(error(e)) }
  }
  )

  server.registerTool(
    "post_comments",
    {
      title: "Post comments",
      description: "The comments left on one jsonplaceholder post, from the public test REST API.",
      inputSchema: z.object( { post_id: z.string().describe("Numeric post id, e.g. 1.") }),
      annotations: READ_ONLY,
    },
    async (args) => {
    // ---- paywall: post_comments ----
        // The body runs on the gateway, behind the licence gate.
    // ---- paywall: end ----
    try { return text(await premiumTool("mcp_restful_api_dev_post_comments", args)) } catch (e) { return textError(error(e)) }
  }
  )

  return server
}
